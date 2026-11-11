const { Op } = require('sequelize');
const slugify = require('slugify');
const {
  sequelize,
  Competition,
  CompetitionCategory,
  User,
  Registration,
  Submission,
  Result
} = require('../models');
const AppError = require('../utils/appError');
const { logAudit } = require('../utils/audit');
const { deleteFile } = require('../utils/fileHelper');

const nextStatus = {
  draft: 'published',
  published: 'registration_open',
  registration_open: 'registration_closed',
  registration_closed: 'submission',
  submission: 'competition',
  competition: 'result_announced',
  result_announced: 'completed'
};

function plain(instance) {
  return instance?.toJSON ? instance.toJSON() : instance;
}

function validateSchedule(values) {
  const dates = [
    ['registration_deadline', values.registration_deadline],
    ['submission_deadline', values.submission_deadline],
    ['end_date', values.end_date]
  ].filter(([, date]) => date);
  for (let index = 1; index < dates.length; index += 1) {
    if (Date.parse(dates[index - 1][1]) >= Date.parse(dates[index][1])) {
      throw new AppError(
        'Urutan tanggal harus pendaftaran, pengumpulan, lalu akhir kompetisi.',
        422,
        [{ field: dates[index][0], message: 'Tanggal tidak sesuai urutan.' }]
      );
    }
  }
}

async function generateUniqueSlug(name, excludeId = null) {
  const rawSlug = slugify(name, { lower: true, strict: true, trim: true }) || 'kompetisi';
  let suffix = 1;
  while (true) {
    const suffixText = suffix === 1 ? '' : `-${suffix}`;
    const baseSlug = rawSlug.slice(0, 220 - suffixText.length).replace(/-+$/g, '') || 'kompetisi';
    const candidate = `${baseSlug}${suffixText}`;
    const existing = await Competition.findOne({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
      }
    });
    if (!existing) return candidate;
    suffix += 1;
  }
}

async function ensureCategory(categoryId) {
  const category = await CompetitionCategory.findByPk(categoryId);
  if (!category) throw new AppError('Kategori kompetisi tidak ditemukan.', 422);
}

async function create(req, input, files) {
  await ensureCategory(input.category_id);
  validateSchedule(input);

  const values = {
    ...input,
    slug: await generateUniqueSlug(input.name),
    created_by: req.user.id,
    status: 'draft',
    poster_url: files.poster ? `/uploads/competitions/${files.poster.filename}` : null,
    guidebook_url: files.guidebook ? `/uploads/competitions/${files.guidebook.filename}` : null
  };
  return sequelize.transaction(async (transaction) => {
    const competition = await Competition.create(values, { transaction });
    await logAudit(req, 'create', 'Competition', competition.id, null, plain(competition), { transaction });
    return competition;
  });
}

function buildWhere(query, publicOnly) {
  const where = {};
  if (publicOnly) where.status = { [Op.ne]: 'draft' };
  else if (query.status) where.status = query.status;
  if (query.category_id) where.category_id = query.category_id;
  if (query.level) where.level = query.level;
  if (query.mode) where.mode = query.mode;
  if (query.q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { organizer: { [Op.like]: `%${query.q}%` } }
    ];
  }
  return where;
}

function buildOrder(sort) {
  if (sort === 'name_asc') return [['name', 'ASC']];
  if (sort === 'name_desc') return [['name', 'DESC']];
  if (sort === 'deadline_asc') return [['registration_deadline', 'ASC']];
  return [['created_at', 'DESC']];
}

function buildPublicOrder(sort) {
  if (sort === 'name_asc') return [['name', 'ASC']];
  if (sort === 'deadline_asc') return [['registration_deadline', 'ASC']];
  return [['created_at', 'DESC']];
}

async function listAdmin(query) {
  const { count, rows } = await Competition.findAndCountAll({
    where: buildWhere(query, false),
    include: [{ model: CompetitionCategory, as: 'category' }],
    order: buildOrder(query.sort),
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    distinct: true
  });
  return {
    data: rows,
    meta: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.ceil(count / query.limit)
    }
  };
}

async function getStats() {
  const grouped = await Competition.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['status'],
    raw: true
  });
  const byStatus = Object.fromEntries(grouped.map(({ status, count }) => [status, Number(count)]));
  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

  return {
    total,
    published: byStatus.published || 0,
    registration_open: byStatus.registration_open || 0,
    draft: byStatus.draft || 0,
    byStatus
  };
}

async function listPublic(query) {
  const attributes = [
    'id',
    'name',
    'slug',
    'organizer',
    'category_id',
    'level',
    'mode',
    'price',
    'poster_url',
    'registration_deadline',
    'start_date',
    'end_date'
  ];
  const where = {
    status: {
      [Op.in]: [
        'published',
        'registration_open',
        'registration_closed',
        'submission',
        'competition',
        'result_announced'
      ]
    }
  };
  if (query.category_id) where.category_id = query.category_id;
  if (query.level) where.level = query.level;
  if (query.mode) where.mode = query.mode;
  if (query.is_free !== undefined) {
    where.price = query.is_free ? { [Op.eq]: 0 } : { [Op.gt]: 0 };
  }
  if (query.deadline_before) {
    const deadline = /^\d{4}-\d{2}-\d{2}$/.test(query.deadline_before)
      ? `${query.deadline_before}T23:59:59.999Z`
      : query.deadline_before;
    where.registration_deadline = { [Op.lte]: deadline };
  }
  if (query.q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { organizer: { [Op.like]: `%${query.q}%` } }
    ];
  }
  const { count, rows } = await Competition.findAndCountAll({
    attributes,
    where,
    include: [{ model: CompetitionCategory, as: 'category', attributes: ['id', 'name'] }],
    order: buildPublicOrder(query.sort),
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    distinct: true
  });
  return {
    data: rows.map((row) => {
      const competition = plain(row);
      return {
        ...competition,
        category_name: competition.category?.name || null
      };
    }),
    meta: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.ceil(count / query.limit)
    }
  };
}

async function listPublicCategories() {
  return CompetitionCategory.findAll({
    attributes: ['id', 'name'],
    order: [['name', 'ASC']]
  });
}

async function getById(id) {
  const competition = await Competition.findByPk(id, {
    include: [
      { model: CompetitionCategory, as: 'category' },
      { model: User, as: 'creator', attributes: ['name'] }
    ]
  });
  if (!competition) throw new AppError('Kompetisi tidak ditemukan.', 404);
  return competition;
}

async function getBySlug(slug) {
  const competition = await Competition.findOne({
    where: { slug, status: { [Op.ne]: 'draft' } },
    attributes: [
      'id',
      'name',
      'slug',
      'organizer',
      'description',
      'category_id',
      'level',
      'start_date',
      'end_date',
      'registration_deadline',
      'submission_deadline',
      'result_date',
      'location',
      'mode',
      'registration_url',
      'prize',
      'requirements',
      'poster_url',
      'guidebook_url',
      'contact_person',
      'price',
      'status'
    ],
    include: [{ model: CompetitionCategory, as: 'category' }]
  });
  if (!competition) throw new AppError('Kompetisi tidak ditemukan.', 404);
  return competition;
}

async function update(req, id, input, files) {
  const competition = await Competition.findByPk(id);
  if (!competition) throw new AppError('Kompetisi tidak ditemukan.', 404);
  if (input.category_id !== undefined) await ensureCategory(input.category_id);
  const current = plain(competition);
  const merged = { ...current, ...input };
  validateSchedule(merged);

  const values = { ...input };
  if (input.name && input.name !== current.name) {
    values.slug = await generateUniqueSlug(input.name, id);
  }
  if (files.poster) values.poster_url = `/uploads/competitions/${files.poster.filename}`;
  if (files.guidebook) values.guidebook_url = `/uploads/competitions/${files.guidebook.filename}`;

  await sequelize.transaction(async (transaction) => {
    await competition.update(values, { transaction });
    await logAudit(req, 'update', 'Competition', id, current, plain(competition), { transaction });
  });

  try {
    if (files.poster && current.poster_url) await deleteFile(current.poster_url);
    if (files.guidebook && current.guidebook_url) await deleteFile(current.guidebook_url);
  } catch (error) {
    error.operationCommitted = true;
    throw error;
  }
  return competition;
}

async function changeStatus(req, id, status) {
  const competition = await Competition.findByPk(id);
  if (!competition) throw new AppError('Kompetisi tidak ditemukan.', 404);
  const oldValues = plain(competition);
  if (nextStatus[competition.status] !== status) {
    throw new AppError(`Transisi status dari ${competition.status} ke ${status} tidak diizinkan.`, 422);
  }
  await sequelize.transaction(async (transaction) => {
    await competition.update({ status }, { transaction });
    await logAudit(req, 'change_status', 'Competition', id, oldValues, plain(competition), { transaction });
  });
  return competition;
}

async function deleteCompetition(req, id) {
  const competition = await Competition.findByPk(id);
  if (!competition) throw new AppError('Kompetisi tidak ditemukan.', 404);
  const [registrations, submissions, results] = await Promise.all([
    Registration.count({ where: { competition_id: id } }),
    Submission.count({ where: { competition_id: id } }),
    Result.count({ where: { competition_id: id } })
  ]);
  if (registrations + submissions + results > 0) {
    throw new AppError('Tidak bisa hapus kompetisi yang sudah punya peserta/submission.', 409);
  }

  const oldValues = plain(competition);
  await sequelize.transaction(async (transaction) => {
    await logAudit(req, 'delete', 'Competition', id, oldValues, null, { transaction });
    await competition.destroy({ transaction });
  });
  await deleteFile(oldValues.poster_url);
  await deleteFile(oldValues.guidebook_url);
}

module.exports = {
  changeStatus,
  create,
  delete: deleteCompetition,
  generateUniqueSlug,
  getById,
  getBySlug,
  listAdmin,
  listPublic,
  listPublicCategories,
  getStats,
  update
};
