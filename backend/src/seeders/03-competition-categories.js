'use strict';

const { CompetitionCategory, ensure } = require('../seed-data-helpers');

const categories = [
  ['ACADEMIC', 'Kompetisi akademik, riset, dan olimpiade.'],
  ['NON ACADEMIC', 'Kompetisi minat dan bakat non-akademik.'],
  ['TECHNOLOGY', 'Kompetisi teknologi dan inovasi digital.'],
  ['BUSINESS', 'Kompetisi bisnis, kewirausahaan, dan pemasaran.'],
  ['ARTS', 'Kompetisi seni, desain, dan budaya.'],
  ['SPORTS', 'Kompetisi olahraga dan kebugaran.'],
  ['SOCIAL', 'Kompetisi pengabdian dan dampak sosial.']
];

module.exports = {
  async up() {
    for (const [name, description] of categories) {
      await ensure(CompetitionCategory, { name }, { description });
    }
  },

  async down() {
    await CompetitionCategory.destroy({
      where: { name: categories.map(([name]) => name) }
    });
  }
};
