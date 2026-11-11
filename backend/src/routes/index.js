const express = require('express');
const authRoutes = require('./authRoutes');
const competitionRoutes = require('./competitionRoutes');
const competitionCategoryRoutes = require('./competitionCategoryRoutes');
const publicCompetitionRoutes = require('./publicCompetitionRoutes');
const publicCompetitionCategoryRoutes = require('./publicCompetitionCategoryRoutes');
const publicRoutes = require('./publicRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/competitions', competitionRoutes);
router.use('/competition-categories', competitionCategoryRoutes);
router.use('/public/competitions', publicCompetitionRoutes);
router.use('/public/competition-categories', publicCompetitionCategoryRoutes);
router.use('/public', publicRoutes);

module.exports = router;
