const categoryService = require('../services/competitionCategoryService');
const { success } = require('../utils/response');

async function list(_req, res, next) {
  try {
    return success(res, await categoryService.list(), 'Daftar kategori berhasil diambil.');
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    return success(res, await categoryService.create(req, req.body), 'Kategori berhasil dibuat.', 201);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    return success(
      res,
      await categoryService.update(req, req.params.id, req.body),
      'Kategori berhasil diperbarui.'
    );
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    await categoryService.delete(req, req.params.id);
    return success(res, null, 'Kategori berhasil dihapus.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, list, remove, update };
