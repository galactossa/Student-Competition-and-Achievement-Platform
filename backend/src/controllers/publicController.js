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

async function getAchievementDetail(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const notFound = () =>
      res.status(404).json({ success: false, message: 'Prestasi tidak ditemukan.', data: null });

    if (!Number.isInteger(id) || id < 1) return notFound();

    const achievement = await publicService.getAchievementDetail(id);
    if (!achievement) return notFound();

    return success(res, achievement, 'Detail prestasi berhasil diambil.');
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

module.exports = { listAchievements, getAchievementDetail, stats };