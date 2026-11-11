process.env.JWT_SECRET = 'competition-test-access-secret-long-enough';
process.env.JWT_REFRESH_SECRET = 'competition-test-refresh-secret-long-enough';
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { Op, UniqueConstraintError } = require('sequelize');
const app = require('../src/app');
const models = require('../src/models');

const uploadDirectory = path.resolve(__dirname, '../uploads/competitions');
const testUser = { id: 41, email: 'admin@scap.test' };
const baselineFiles = new Set(fs.readdirSync(uploadDirectory));
let competitions;
let categories;
let auditEntries;
let registrations;
let submissions;
let results;
let nextCompetitionId;
let nextCategoryId;

function token(role = 'admin_pka') {
  return jwt.sign({
    sub: String(testUser.id),
    role,
    email: testUser.email,
    type: 'access',
    sid: 'competition-test-session'
  }, process.env.JWT_SECRET);
}

function authorized(role = 'admin_pka') {
  return { Authorization: `Bearer ${token(role)}` };
}

function record(model, attributes, list) {
  const instance = {
    ...attributes,
    toJSON() {
      return Object.fromEntries(Object.entries(this).filter(([key]) => !['toJSON', 'update', 'destroy'].includes(key)));
    },
    async update(values) {
      Object.assign(this, values);
      return this;
    },
    async destroy() {
      const index = list.indexOf(this);
      if (index >= 0) list.splice(index, 1);
    }
  };
  return instance;
}

function includesCompetition(competition, where) {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (key === 'status' && value?.[Op.ne] !== undefined) {
      if (competition.status === value[Op.ne]) return false;
    } else if (key === 'status' && value?.[Op.in]) {
      if (!value[Op.in].includes(competition.status)) return false;
    } else if (key === 'name' || key === 'organizer') {
      if (!String(competition[key] || '').toLowerCase().includes(String(value[Op.like] || '').replaceAll('%', '').toLowerCase())) return false;
    } else if (key === 'category_id' && competition[key] !== value) {
      return false;
    } else if (key === 'price' && value?.[Op.eq] !== undefined && Number(competition.price) !== value[Op.eq]) {
      return false;
    } else if (key === 'price' && value?.[Op.gt] !== undefined && Number(competition.price) <= value[Op.gt]) {
      return false;
    } else if (key === 'registration_deadline' && value?.[Op.lte] && competition[key] > value[Op.lte]) {
      return false;
    } else if (!['status', 'name', 'organizer', 'category_id', 'price', 'registration_deadline'].includes(key)
      && competition[key] !== value) {
      return false;
    }
  }
  const search = where[Op.or];
  if (search) {
    const term = search[0].name?.[Op.like];
    const organizerTerm = search[1].organizer?.[Op.like];
    const needle = String(term || organizerTerm || '').replaceAll('%', '').toLowerCase();
    if (!`${competition.name} ${competition.organizer}`.toLowerCase().includes(needle)) return false;
  }
  return true;
}

function filterCompetitions(where) {
  return competitions.filter((competition) => includesCompetition(competition, where));
}

beforeEach(() => {
  competitions = [];
  categories = [record(models.CompetitionCategory, { id: 1, name: 'Teknologi', description: null }, [])];
  auditEntries = [];
  registrations = [];
  submissions = [];
  results = [];
  nextCompetitionId = 1;
  nextCategoryId = 2;

  models.sequelize.transaction = jest.fn(async (callback) => callback({}));
  models.AuditLog.create = jest.fn(async (attributes) => {
    auditEntries.push(attributes);
    return attributes;
  });

  models.Competition.findOne = jest.fn(async ({ where, attributes }) => {
    const competition = competitions.find((item) => item.slug === where.slug
      && (!where.id || item.id !== where.id[Op.ne])
      && (!where.status || item.status !== where.status[Op.ne]));
    if (!competition || !attributes) return competition || null;
    return Object.fromEntries(attributes.map((key) => [key, competition[key]]));
  });
  models.Competition.findByPk = jest.fn(async (id) => competitions.find((item) => item.id === Number(id)) || null);
  models.Competition.create = jest.fn(async (attributes) => {
    const item = record(models.Competition, {
      id: nextCompetitionId++,
      created_at: new Date().toISOString(),
      ...attributes,
      category: categories.find(({ id }) => id === Number(attributes.category_id)) || null
    }, competitions);
    competitions.push(item);
    return item;
  });
  models.Competition.findAndCountAll = jest.fn(async ({ where, limit, offset }) => {
    const rows = filterCompetitions(where);
    return { count: rows.length, rows: rows.slice(offset, offset + limit) };
  });
  models.Competition.findAll = jest.fn(async () => [
    { status: 'draft', count: '2' },
    { status: 'published', count: '1' },
    { status: 'registration_open', count: '3' }
  ]);
  models.Competition.count = jest.fn(async ({ where } = {}) => (
    competitions.filter((item) => item.category_id === where?.category_id).length
  ));
  models.CompetitionCategory.findByPk = jest.fn(async (id) => categories.find((item) => item.id === Number(id)) || null);
  models.CompetitionCategory.findAll = jest.fn(async ({ attributes } = {}) => (
    attributes
      ? categories.map((category) => Object.fromEntries(attributes.map((key) => [key, category[key]])))
      : categories
  ));
  models.CompetitionCategory.create = jest.fn(async (attributes) => {
    if (categories.some((item) => item.name === attributes.name)) {
      throw new UniqueConstraintError({ message: 'Duplicate category' });
    }
    const category = record(models.CompetitionCategory, { id: nextCategoryId++, ...attributes }, categories);
    categories.push(category);
    return category;
  });
  models.Registration.count = jest.fn(async ({ where }) => registrations.filter((item) => item.competition_id === where.competition_id).length);
  models.Submission.count = jest.fn(async ({ where }) => submissions.filter((item) => item.competition_id === where.competition_id).length);
  models.Result.count = jest.fn(async ({ where }) => results.filter((item) => item.competition_id === where.competition_id).length);
});

afterEach(() => {
  for (const filename of fs.readdirSync(uploadDirectory)) {
    if (!baselineFiles.has(filename)) fs.unlinkSync(path.join(uploadDirectory, filename));
  }
});

describe('Competition management API', () => {
  test('requires an authenticated admin to create competitions', async () => {
    const guest = await request(app).post('/api/competitions').send({});
    const student = await request(app).post('/api/competitions').set(authorized('mahasiswa')).send({});
    expect(guest.status).toBe(401);
    expect(student.status).toBe(403);
  });

  test('creates a competition with uploaded poster and guidebook and audit entry', async () => {
    const response = await request(app)
      .post('/api/competitions')
      .set(authorized())
      .field('name', 'Hackathon Nasional')
      .field('organizer', 'SCAP Indonesia')
      .field('category_id', '1')
      .field('level', 'Nasional')
      .field('mode', 'online')
      .attach('poster', Buffer.from('poster content'), 'poster.png')
      .attach('guidebook', Buffer.from('%PDF-test'), 'guidebook.pdf');

    expect(response.status).toBe(201);
    expect(response.body.data.slug).toBe('hackathon-nasional');
    expect(response.body.data.created_by).toBe(String(testUser.id));
    expect(response.body.data.status).toBe('draft');
    expect(fs.existsSync(path.join(uploadDirectory, path.basename(response.body.data.poster_url)))).toBe(true);
    expect(fs.existsSync(path.join(uploadDirectory, path.basename(response.body.data.guidebook_url)))).toBe(true);
    expect(auditEntries[0]).toMatchObject({ action: 'create', model_type: 'Competition', model_id: response.body.data.id });
  });

  test.each([
    [{ name: '', organizer: 'SCAP', category_id: '1', level: 'Nasional', mode: 'online' }],
    [{ name: 'Valid Event', organizer: 'SCAP Org', category_id: '999', level: 'Nasional', mode: 'online' }],
    [{ name: 'Valid Event', organizer: 'SCAP Org', category_id: '1', level: 'Nasional', mode: 'online', price: '-1' }],
    [{
      name: 'Valid Event',
      organizer: 'SCAP Org',
      category_id: '1',
      level: 'Nasional',
      mode: 'online',
      registration_deadline: '2027-03-01T00:00:00Z',
      submission_deadline: '2027-02-01T00:00:00Z'
    }]
  ])('rejects invalid competition input with 422', async (fields) => {
    const response = await request(app).post('/api/competitions').set(authorized()).send(fields);
    expect(response.status).toBe(422);
  });

  test('generates unique slugs for duplicate competition names', async () => {
    const body = { name: 'Repeated Event', organizer: 'SCAP Org', category_id: 1, level: 'Nasional', mode: 'online' };
    const first = await request(app).post('/api/competitions').set(authorized()).send(body);
    const second = await request(app).post('/api/competitions').set(authorized()).send(body);
    expect(first.body.data.slug).toBe('repeated-event');
    expect(second.body.data.slug).toBe('repeated-event-2');
  });

  test('lists admin competitions with pagination and query filtering', async () => {
    competitions.push(
      { id: 1, name: 'Cyber Challenge', organizer: 'SCAP', category_id: 1, status: 'published' },
      { id: 2, name: 'Design Week', organizer: 'SCAP', category_id: 1, status: 'draft' }
    );
    const page = await request(app).get('/api/competitions?page=1&limit=1').set(authorized());
    const search = await request(app).get('/api/competitions?q=cyber').set(authorized());
    expect(page.status).toBe(200);
    expect(page.body.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].name).toBe('Cyber Challenge');
  });

  test('applies default pagination values', async () => {
    const response = await request(app).get('/api/competitions').set(authorized());
    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  test('returns aggregated competition statistics for admins', async () => {
    const response = await request(app).get('/api/competitions/stats').set(authorized());
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      total: 6,
      published: 1,
      registration_open: 3,
      draft: 2,
      byStatus: { draft: 2, published: 1, registration_open: 3 }
    });
  });

  test('returns an admin detail with category and creator associations', async () => {
    competitions.push(record(models.Competition, {
      id: 1, name: 'Detail Event', category_id: 1, category: categories[0], creator: { name: 'Admin SCAP' }
    }, competitions));
    const response = await request(app).get('/api/competitions/1').set(authorized());
    expect(response.status).toBe(200);
    expect(models.Competition.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
      include: expect.arrayContaining([
        expect.objectContaining({ as: 'category' }),
        expect.objectContaining({ as: 'creator', attributes: ['name'] })
      ])
    }));
  });

  test('rejects unsupported upload MIME types and removes invalid files', async () => {
    const response = await request(app)
      .post('/api/competitions')
      .set(authorized())
      .field('name', 'Hackathon Nasional')
      .field('organizer', 'SCAP Indonesia')
      .field('category_id', '1')
      .field('level', 'Nasional')
      .field('mode', 'online')
      .attach('poster', Buffer.from('not an image'), { filename: 'poster.txt', contentType: 'text/plain' });
    expect(response.status).toBe(422);
    expect(response.body.message).toMatch(/JPG, PNG, atau WEBP/);
  });

  test('replaces an uploaded poster and removes the previous file', async () => {
    const oldName = `poster-fixture-${Date.now()}.png`;
    fs.writeFileSync(path.join(uploadDirectory, oldName), 'old');
    const oldUrl = `/uploads/competitions/${oldName}`;
    const item = record(models.Competition, {
      id: 1, name: 'Existing Event', organizer: 'SCAP Org', category_id: 1,
      level: 'Nasional', mode: 'online', status: 'draft', slug: 'existing-event',
      poster_url: oldUrl, guidebook_url: null
    }, competitions);
    competitions.push(item);

    const response = await request(app).put('/api/competitions/1')
      .set(authorized())
      .attach('poster', Buffer.from('replacement'), 'replacement.jpg');
    expect(response.status).toBe(200);
    expect(fs.existsSync(path.join(uploadDirectory, oldName))).toBe(false);
    expect(fs.existsSync(path.join(uploadDirectory, path.basename(response.body.data.poster_url)))).toBe(true);
  });

  test('enforces only the next valid status transition', async () => {
    competitions.push(record(models.Competition, { id: 1, status: 'draft', name: 'Event' }, competitions));
    const valid = await request(app).patch('/api/competitions/1/status').set(authorized()).send({ status: 'published' });
    const invalid = await request(app).patch('/api/competitions/1/status').set(authorized()).send({ status: 'completed' });
    expect(valid.status).toBe(200);
    expect(valid.body.data.status).toBe('published');
    expect(invalid.status).toBe(422);
  });

  test('deletes an unused competition and its uploaded file', async () => {
    const filename = `poster-delete-${Date.now()}.png`;
    fs.writeFileSync(path.join(uploadDirectory, filename), 'poster');
    competitions.push(record(models.Competition, {
      id: 1, status: 'draft', poster_url: `/uploads/competitions/${filename}`, guidebook_url: null
    }, competitions));
    const response = await request(app).delete('/api/competitions/1').set(authorized());
    expect(response.status).toBe(200);
    expect(fs.existsSync(path.join(uploadDirectory, filename))).toBe(false);
    expect(competitions).toHaveLength(0);
  });

  test('prevents deleting competitions with participants or submissions', async () => {
    competitions.push(record(models.Competition, { id: 1, status: 'published' }, competitions));
    registrations.push({ competition_id: 1 });
    const response = await request(app).delete('/api/competitions/1').set(authorized());
    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/sudah punya peserta\/submission/);
  });

  test('prevents deleting competitions with a submission', async () => {
    competitions.push(record(models.Competition, { id: 1, status: 'published' }, competitions));
    submissions.push({ competition_id: 1 });
    await request(app).delete('/api/competitions/1').set(authorized()).expect(409);
  });

  test('publishes only discovery statuses and omits sensitive fields', async () => {
    competitions.push(
      { id: 1, name: 'Draft Event', organizer: 'SCAP', category_id: 1, status: 'draft', created_by: 10 },
      { id: 2, name: 'Open Event', slug: 'open-event', organizer: 'SCAP', category_id: 1, status: 'published', created_by: 10 },
      { id: 3, name: 'Completed Event', organizer: 'SCAP', category_id: 1, status: 'completed', created_by: 10 }
    );
    const list = await request(app).get('/api/public/competitions');
    expect(list.status).toBe(200);
    expect(list.body.data.map(({ name }) => name)).toEqual(['Open Event']);
    expect(list.body.meta).toEqual({ page: 1, limit: 6, total: 1, totalPages: 1 });
    expect(models.Competition.findAndCountAll.mock.calls[0][0]).toEqual(expect.objectContaining({
      attributes: expect.arrayContaining(['start_date', 'end_date']),
      include: [expect.objectContaining({ as: 'category', attributes: ['id', 'name'] })]
    }));

    const detail = await request(app).get('/api/public/competitions/open-event');
    expect(detail.status).toBe(200);
    expect(detail.body.data.created_by).toBeUndefined();
  });

  test('filters public discovery by level, free status, search, and deadline', async () => {
    competitions.push(
      {
        id: 1, name: 'Cyber Nasional', organizer: 'SCAP', category_id: 1,
        status: 'published', level: 'Nasional', price: 0, registration_deadline: '2027-01-20'
      },
      {
        id: 2, name: 'Cyber Regional', organizer: 'SCAP', category_id: 1,
        status: 'registration_open', level: 'Regional', price: 50000, registration_deadline: '2027-02-20'
      },
      {
        id: 3, name: 'Music Nasional', organizer: 'Music Org', category_id: 1,
        status: 'result_announced', level: 'Nasional', price: 10000, registration_deadline: '2027-01-10'
      },
      {
        id: 4, name: 'Late Cyber', organizer: 'SCAP', category_id: 1,
        status: 'published', level: 'Nasional', price: 10000, registration_deadline: '2027-01-15T16:30:00Z'
      }
    );

    const level = await request(app).get('/api/public/competitions?level=Nasional');
    const free = await request(app).get('/api/public/competitions?is_free=true');
    const paid = await request(app).get('/api/public/competitions?is_free=false');
    const search = await request(app).get('/api/public/competitions?q=cyber');
    const deadline = await request(app).get('/api/public/competitions?deadline_before=2027-01-15');
    expect(level.body.data.map(({ name }) => name)).toEqual(['Cyber Nasional', 'Music Nasional', 'Late Cyber']);
    expect(free.body.data.map(({ name }) => name)).toEqual(['Cyber Nasional']);
    expect(paid.body.data.map(({ name }) => name)).toEqual(['Cyber Regional', 'Music Nasional', 'Late Cyber']);
    expect(search.body.data.map(({ name }) => name)).toEqual(['Cyber Nasional', 'Cyber Regional', 'Late Cyber']);
    expect(deadline.body.data.map(({ name }) => name)).toEqual(['Music Nasional', 'Late Cyber']);
  });

  test('does not expose a draft competition by public slug', async () => {
    competitions.push({ id: 1, slug: 'private-draft', status: 'draft' });
    await request(app).get('/api/public/competitions/private-draft').expect(404);
  });

  test('lists public competition categories without authentication', async () => {
    const response = await request(app).get('/api/public/competition-categories');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1, name: 'Teknologi' }]);
    expect(models.CompetitionCategory.findAll).toHaveBeenCalledWith({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
  });

  test('lists categories and supports create, update, and delete with audit records', async () => {
    const list = await request(app).get('/api/competition-categories').set(authorized());
    expect(list.status).toBe(200);
    expect(list.body.data[0]).toMatchObject({ name: 'Teknologi', competition_count: 0 });

    const created = await request(app).post('/api/competition-categories')
      .set(authorized())
      .send({ name: 'Kewirausahaan', description: 'Bisnis dan inovasi' });
    expect(created.status).toBe(201);
    const updated = await request(app).put(`/api/competition-categories/${created.body.data.id}`)
      .set(authorized())
      .send({ description: 'Inovasi bisnis' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.description).toBe('Inovasi bisnis');
    await request(app).delete(`/api/competition-categories/${created.body.data.id}`)
      .set(authorized())
      .expect(200);
    expect(auditEntries.map(({ action }) => action)).toEqual(['create', 'update', 'delete']);
  });

  test('rejects duplicate category names and deletion of used categories', async () => {
    await request(app).post('/api/competition-categories').set(authorized()).send({ name: 'Teknologi' })
      .expect(409);
    categories.push({ id: 2, name: 'Seni', description: null });
    competitions.push({ id: 1, category_id: 2 });
    await request(app).delete('/api/competition-categories/2').set(authorized()).expect(409);
  });
});
