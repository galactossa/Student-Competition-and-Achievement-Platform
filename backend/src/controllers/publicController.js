const publicService = require('../services/publicService');
const { success } = require('../utils/response');

async function listAchievements(req, res, next) {
  try {
    return success(
      res,
      await publicService.listAchievements(req.validatedQuery.limit),
      'Daftar prestasi berhasil diambil.'
    );
  } catch (error) {
    return next(error);
  }
}

async function stats(_req, res, next) {
  try {
    return success(res, await publicService.getPublicStats(), 'Statistik publik berhasil diambil.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAchievements, stats };
