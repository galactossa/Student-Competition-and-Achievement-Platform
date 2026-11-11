const express = require('express');
const competitionController = require('../controllers/competitionController');
const validate = require('../middlewares/validate');
const { publicListQuerySchema } = require('../validators/competitionValidator');

const router = express.Router();

router.get('/', validate(publicListQuerySchema, 'query'), competitionController.listPublic);
router.get('/:slug', competitionController.getBySlug);

module.exports = router;
