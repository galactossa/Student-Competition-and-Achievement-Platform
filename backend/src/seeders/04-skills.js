'use strict';

const { Skill, ensure } = require('../seed-data-helpers');

const skills = [
  ['Python', 'programming'],
  ['JavaScript', 'programming'],
  ['PHP', 'programming'],
  ['Java', 'programming'],
  ['Cyber Security', 'technology'],
  ['Problem Solving', 'soft_skill'],
  ['Teamwork', 'soft_skill'],
  ['Public Speaking', 'soft_skill'],
  ['UI/UX Design', 'design'],
  ['Data Analysis', 'technology'],
  ['Machine Learning', 'technology'],
  ['Business Plan', 'business'],
  ['Marketing', 'business'],
  ['Photography', 'arts'],
  ['Leadership', 'soft_skill']
];

module.exports = {
  async up() {
    for (const [name, category] of skills) {
      await ensure(Skill, { name }, { category });
    }
  },

  async down() {
    await Skill.destroy({ where: { name: skills.map(([name]) => name) } });
  }
};
