'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('users', 'password_hash', 'password');
    await queryInterface.changeColumn('users', 'name', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(150),
      allowNull: false,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'name', {
      type: Sequelize.STRING(120),
      allowNull: false
    });
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(160),
      allowNull: false,
      unique: true
    });
    await queryInterface.renameColumn('users', 'password', 'password_hash');
  }
};
