'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('team_members', 'role', {
      type: Sequelize.ENUM('leader', 'member'),
      allowNull: false,
      defaultValue: 'member'
    });
    await queryInterface.changeColumn('team_members', 'joined_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('team_members', 'role', {
      type: Sequelize.ENUM('leader', 'member'),
      allowNull: false,
      defaultValue: 'member'
    });
    await queryInterface.changeColumn('team_members', 'joined_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  }
};
