'use strict';

const bcrypt = require('bcryptjs');
const { fakerID_ID: faker } = require('@faker-js/faker');
const models = require('./models');

faker.seed(20261104);

const PASSWORD = 'Password123!';
const BASE_DATE = new Date('2026-11-04T12:00:00Z');
const PROGRAMS = [
  'Informatika',
  'Sistem Informasi',
  'Elektro',
  'Mesin',
  'Sipil',
  'Arsitektur'
];

const studentUsers = Array.from({ length: 20 }, (_, index) => {
  const name = faker.person.fullName();
  const email = faker.internet.email({
    firstName: `mahasiswa${String(index + 1).padStart(2, '0')}`,
    lastName: 'scap',
    provider: 'scap.test'
  }).toLowerCase();
  return { name, email, role: 'mahasiswa' };
});
const auditUserAgents = Array.from({ length: 30 }, () => faker.internet.userAgent());

async function passwordHash() {
  return bcrypt.hash(PASSWORD, 12);
}

async function ensure(model, where, defaults) {
  const [instance] = await model.findOrCreate({ where, defaults });
  return instance;
}

function daysFromBase(days, hour = 12) {
  const date = new Date(BASE_DATE);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function slugify(value) {
  return faker.helpers.slugify(value).toLowerCase().replace(/-+/g, '-');
}

async function getUsersByRole(role) {
  return models.User.findAll({
    where: { role },
    order: [['email', 'ASC']]
  });
}

async function getStudentUsers() {
  return models.User.findAll({
    where: { role: 'mahasiswa' },
    include: [{ model: models.Student, as: 'student' }],
    order: [[{ model: models.Student, as: 'student' }, 'nim', 'ASC']]
  });
}

async function getUser(email) {
  const user = await models.User.findOne({ where: { email } });
  if (!user) {
    throw new Error(`Required seeded user not found: ${email}`);
  }
  return user;
}

async function getCompetition(slug) {
  const competition = await models.Competition.findOne({ where: { slug } });
  if (!competition) {
    throw new Error(`Required seeded competition not found: ${slug}`);
  }
  return competition;
}

module.exports = {
  ...models,
  BASE_DATE,
  PASSWORD,
  PROGRAMS,
  auditUserAgents,
  daysFromBase,
  ensure,
  faker,
  getCompetition,
  getStudentUsers,
  getUser,
  getUsersByRole,
  passwordHash,
  slugify,
  studentUsers
};
