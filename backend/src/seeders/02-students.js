'use strict';

const {
  User,
  Student,
  PROGRAMS,
  ensure,
  faker,
  getUser,
  slugify,
  studentUsers
} = require('../seed-data-helpers');

module.exports = {
  async up() {
    for (let index = 0; index < studentUsers.length; index += 1) {
      const { email, name } = studentUsers[index];
      const user = await getUser(email);
      await ensure(Student, { user_id: user.id }, {
        nim: String(20241001 + index),
        program_studi: PROGRAMS[index % PROGRAMS.length],
        angkatan: 2021 + (index % 4),
        phone: faker.phone.number(),
        is_public: index % 2 === 0,
        slug: `${slugify(name)}-${20241001 + index}`
      });
    }
  },

  async down() {
    const users = await User.findAll({
      where: { email: studentUsers.map(({ email }) => email) },
      attributes: ['id']
    });
    await Student.destroy({ where: { user_id: users.map(({ id }) => id) } });
  }
};
