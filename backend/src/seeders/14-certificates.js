'use strict';

const { Achievement, Certificate, ensure } = require('../seed-data-helpers');

module.exports = {
  async up() {
    const achievements = await Achievement.findAll({
      where: { status: 'verified' },
      order: [['id', 'ASC']],
      limit: 2
    });
    if (achievements.length !== 2) {
      throw new Error(`Expected two verified achievements, found ${achievements.length}`);
    }

    for (const [index, achievement] of achievements.entries()) {
      const number = String(index + 1).padStart(5, '0');
      await ensure(Certificate, { achievement_id: achievement.id }, {
        certificate_number: `ACH-2026-${number}`,
        file_url: `/uploads/certificates/ACH-2026-${number}.pdf`,
        issued_at: achievement.date
      });
    }
  },

  async down() {
    await Certificate.destroy({
      where: {
        certificate_number: ['ACH-2026-00001', 'ACH-2026-00002']
      }
    });
  }
};
