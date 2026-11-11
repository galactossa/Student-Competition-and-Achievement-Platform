'use strict';

const {
  User,
  ensure,
  passwordHash,
  studentUsers
} = require('../seed-data-helpers');

module.exports = {
  async up() {
    const hash = await passwordHash();
    const accounts = [
      { name: 'Super Admin SCAP', email: 'superadmin@scap.test', role: 'super_admin' },
      { name: 'Admin PKA', email: 'pka@scap.test', role: 'admin_pka' },
      { name: 'Verifier 1', email: 'verifier1@scap.test', role: 'verifier' },
      { name: 'Verifier 2', email: 'verifier2@scap.test', role: 'verifier' },
      { name: 'Pimpinan Universitas', email: 'pimpinan@scap.test', role: 'pimpinan' },
      { name: 'Koordinator Program Studi', email: 'prodi@scap.test', role: 'prodi' },
      ...studentUsers
    ];

    for (const account of accounts) {
      await ensure(User, { email: account.email }, {
        ...account,
        password: hash,
        isActive: true
      });
    }
  },

  async down() {
    await User.destroy({
      where: {
        email: [
          'superadmin@scap.test',
          'pka@scap.test',
          'verifier1@scap.test',
          'verifier2@scap.test',
          'pimpinan@scap.test',
          'prodi@scap.test',
          ...studentUsers.map(({ email }) => email)
        ]
      }
    });
  }
};
