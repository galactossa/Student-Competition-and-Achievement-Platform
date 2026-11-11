'use strict';

const { Achievement, AchievementSkill, Skill, ensure } = require('../seed-data-helpers');

const skillAssignments = [
  ['Python', 'Problem Solving', 'Data Analysis'],
  ['Business Plan', 'Public Speaking', 'Leadership']
];

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
      for (const name of skillAssignments[index]) {
        const skill = await Skill.findOne({ where: { name } });
        if (!skill) {
          throw new Error(`Required skill not found: ${name}`);
        }
        await ensure(AchievementSkill, {
          achievement_id: achievement.id,
          skill_id: skill.id
        }, {});
      }
    }
  },

  async down() {
    const achievements = await Achievement.findAll({
      where: { status: 'verified' },
      order: [['id', 'ASC']],
      limit: 2
    });
    for (const [index, achievement] of achievements.entries()) {
      const skills = await Skill.findAll({
        where: { name: skillAssignments[index] },
        attributes: ['id']
      });
      await AchievementSkill.destroy({
        where: {
          achievement_id: achievement.id,
          skill_id: skills.map(({ id }) => id)
        }
      });
    }
  }
};
