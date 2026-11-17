const { sequelize, Competition, CompetitionCategory } = require('../models');
const { Op, UniqueConstraintError } = require('sequelize');
const AppError = require('../utils/appError');
const { logAudit } = require('../utils/audit');

function plain(instance) {
  return instance?.toJSON ? instance.toJSON() : instance;
}

async function ensureNameAvailable(name, excludeId, transaction) {
  if (typeof name !== 'string') return;

  const conditions = [
    sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      name.trim().toLowerCase()
    )
  ];
  if (excludeId !== undefined) conditions.push({ id: { [Op.ne]: excludeId } });

  const existing = await CompetitionCategory.findOne({
    where: { [Op.and]: conditions },
    transaction
  });
  if (existing) throw new AppError('Nama kategori sudah digunakan.', 409);
}

function rethrowCategoryNameError(error) {
  if (error instanceof UniqueConstraintError) {
    throw new AppError('Nama kategori sudah digunakan.', 409);
  }
  throw error;
}

async function list() {
  const categories = await CompetitionCategory.findAll({ order: [['name', 'ASC']] });
  return Promise.all(categories.map(async (category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    competition_count: await Competition.count({ where: { category_id: category.id } })
  })));
}

async function create(req, input) {
  try {
    return await sequelize.transaction(async (transaction) => {
      await ensureNameAvailable(input.name, undefined, transaction);
      const category = await CompetitionCategory.create(input, { transaction });
      await logAudit(req, 'create', 'CompetitionCategory', category.id, null, plain(category), { transaction });
      return category;
    });
  } catch (error) {
    rethrowCategoryNameError(error);
  }
}

async function update(req, id, input) {
  const category = await CompetitionCategory.findByPk(id);
  if (!category) throw new AppError('Kategori kompetisi tidak ditemukan.', 404);
  const oldValues = plain(category);
  try {
    await sequelize.transaction(async (transaction) => {
      await ensureNameAvailable(input.name, Number(id), transaction);
      await category.update(input, { transaction });
      await logAudit(req, 'update', 'CompetitionCategory', id, oldValues, plain(category), { transaction });
    });
  } catch (error) {
    rethrowCategoryNameError(error);
  }
  return category;
}

async function countUsage(id) {
  return Competition.count({ where: { category_id: id } });
}

async function remove(req, id) {
  const category = await CompetitionCategory.findByPk(id);
  if (!category) throw new AppError('Kategori kompetisi tidak ditemukan.', 404);
  if (await countUsage(id)) throw new AppError('Kategori masih digunakan oleh kompetisi.', 409);
  const oldValues = plain(category);
  await sequelize.transaction(async (transaction) => {
    await logAudit(req, 'delete', 'CompetitionCategory', id, oldValues, null, { transaction });
    await category.destroy({ transaction });
  });
}

module.exports = { countUsage, create, delete: remove, list, update };
