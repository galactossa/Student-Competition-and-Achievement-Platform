const express = require('express');
const competitionCategoryController = require('../controllers/competitionCategoryController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { createSchema, updateSchema } = require('../validators/competitionCategoryValidator');
const AppError = require('../utils/appError');
const { z } = require('zod');

const router = express.Router();
const adminOnly = [auth, role('admin_pka', 'super_admin')];
const idSchema = z.coerce.number().int().positive();

function validateId(req, _res, next) {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) return next(new AppError('ID kategori tidak valid.', 422));
  req.params.id = parsed.data;
  return next();
}

router.get('/', ...adminOnly, competitionCategoryController.list);
router.post('/', ...adminOnly, validate(createSchema), competitionCategoryController.create);
router.put('/:id', ...adminOnly, validateId, validate(updateSchema), competitionCategoryController.update);
router.delete('/:id', ...adminOnly, validateId, competitionCategoryController.remove);

module.exports = router;
