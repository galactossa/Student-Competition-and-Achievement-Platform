const express = require('express');
const { z } = require('zod');
const competitionController = require('../controllers/competitionController');
const auth = require('../middlewares/auth');
const { uploadCompetitionFiles, removeUploadedFiles } = require('../middlewares/upload');
const role = require('../middlewares/role');
const validate = require('../middlewares/validate');
const {
  createSchema,
  listQuerySchema,
  statusSchema,
  updateSchema
} = require('../validators/competitionValidator');
const AppError = require('../utils/appError');

const router = express.Router();
const adminOnly = [auth, role('admin_pka', 'super_admin')];

function validateUpload(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      try {
        removeUploadedFiles(req);
      } catch (error) {
        return next(error);
      }
      return next(new AppError('Data yang dikirim belum valid.', 422, result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))));
    }
    req.body = result.data;
    return next();
  };
}

const idSchema = z.coerce.number().int().positive();
function validateId(req, _res, next) {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) return next(new AppError('ID kompetisi tidak valid.', 422));
  req.params.id = parsed.data;
  return next();
}

router.post('/', ...adminOnly, uploadCompetitionFiles, validateUpload(createSchema), competitionController.create);
router.get('/stats', ...adminOnly, competitionController.stats);
router.get('/', ...adminOnly, validate(listQuerySchema, 'query'), competitionController.listAdmin);
router.get('/:id', ...adminOnly, validateId, competitionController.getById);
router.put('/:id', ...adminOnly, validateId, uploadCompetitionFiles, validateUpload(updateSchema), competitionController.update);
router.patch('/:id/status', ...adminOnly, validateId, validate(statusSchema), competitionController.changeStatus);
router.delete('/:id', ...adminOnly, validateId, competitionController.remove);

module.exports = router;
