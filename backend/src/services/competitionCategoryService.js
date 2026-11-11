const { sequelize, Competition, CompetitionCategory } = require('../models');
const AppError = require('../utils/appError');
const { logAudit } = require('../utils/audit');

function plain(instance) {
  return instance?.toJSON ? instance.toJSON() : instance;
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
  return sequelize.transaction(async (transaction) => {
    const category = await CompetitionCategory.create(input, { transaction });
    await logAudit(req, 'create', 'CompetitionCategory', category.id, null, plain(category), { transaction });
    return category;
  });
}

async function update(req, id, input) {
  const category = await CompetitionCategory.findByPk(id);
  if (!category) throw new AppError('Kategori kompetisi tidak ditemukan.', 404);
  const oldValues = plain(category);
  await sequelize.transaction(async (transaction) => {
    await category.update(input, { transaction });
    await logAudit(req, 'update', 'CompetitionCategory', id, oldValues, plain(category), { transaction });
  });
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
