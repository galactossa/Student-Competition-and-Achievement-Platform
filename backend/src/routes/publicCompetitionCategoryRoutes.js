const express = require('express');
const competitionController = require('../controllers/competitionController');

const router = express.Router();

router.get('/', competitionController.listPublicCategories);

module.exports = router;
