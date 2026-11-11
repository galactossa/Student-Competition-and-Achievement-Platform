const competitionService = require('../services/competitionService');
const { removeUploadedFiles } = require('../middlewares/upload');
const { success } = require('../utils/response');

function filesFromRequest(req) {
  return {
    poster: req.files?.poster?.[0] || null,
    guidebook: req.files?.guidebook?.[0] || null
  };
}

function handleError(req, error, next) {
  if (!error.operationCommitted) {
    try {
      removeUploadedFiles(req);
    } catch (cleanupError) {
      return next(cleanupError);
    }
  }
  return next(error);
}

async function create(req, res, next) {
  try {
    const competition = await competitionService.create(req, req.body, filesFromRequest(req));
    return success(res, competition, 'Kompetisi berhasil dibuat.', 201);
  } catch (error) {
    return handleError(req, error, next);
  }
}

async function listAdmin(req, res, next) {
  try {
    const result = await competitionService.listAdmin(req.validatedQuery || req.query);
    return res.status(200).json({
      success: true,
      message: 'Daftar kompetisi berhasil diambil.',
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    return next(error);
  }
}

async function listPublic(req, res, next) {
  try {
    const result = await competitionService.listPublic(req.validatedQuery || req.query);
    return res.status(200).json({
      success: true,
      message: 'Daftar kompetisi berhasil diambil.',
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    return next(error);
  }
}

async function listPublicCategories(_req, res, next) {
  try {
    return success(
      res,
      await competitionService.listPublicCategories(),
      'Daftar kategori berhasil diambil.'
    );
  } catch (error) {
    return next(error);
  }
}

async function stats(_req, res, next) {
  try {
    return success(res, await competitionService.getStats(), 'Statistik kompetisi berhasil diambil.');
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    return success(res, await competitionService.getById(req.params.id), 'Detail kompetisi berhasil diambil.');
  } catch (error) {
    return next(error);
  }
}

async function getBySlug(req, res, next) {
  try {
    return success(res, await competitionService.getBySlug(req.params.slug), 'Detail kompetisi berhasil diambil.');
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const competition = await competitionService.update(req, req.params.id, req.body, filesFromRequest(req));
    return success(res, competition, 'Kompetisi berhasil diperbarui.');
  } catch (error) {
    return handleError(req, error, next);
  }
}

async function changeStatus(req, res, next) {
  try {
    return success(
      res,
      await competitionService.changeStatus(req, req.params.id, req.body.status),
      'Status kompetisi berhasil diperbarui.'
    );
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    await competitionService.delete(req, req.params.id);
    return success(res, null, 'Kompetisi berhasil dihapus.');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  changeStatus,
  create,
  getById,
  getBySlug,
  listAdmin,
  listPublic,
  listPublicCategories,
  remove,
  stats,
  update
};
