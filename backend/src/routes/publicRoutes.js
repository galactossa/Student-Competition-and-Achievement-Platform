const express = require('express');
const publicController = require('../controllers/publicController');
const validate = require('../middlewares/validate');
const { achievementListQuerySchema } = require('../validators/publicValidator');

const router = express.Router();

router.get('/achievements', validate(achievementListQuerySchema, 'query'), publicController.listAchievements);
router.get('/stats', publicController.stats);

module.exports = router;
