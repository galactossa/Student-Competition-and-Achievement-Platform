'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('skills', 'name', {
      type: Sequelize.STRING(80),
      allowNull: false,
      unique: true
    });
    await queryInterface.changeColumn('skills', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('skills', 'category', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('skills', 'category');
    await queryInterface.sequelize.query(
      "UPDATE skills SET slug = CONCAT('rollback-', REPLACE(UUID(), '-', '')) WHERE slug IS NULL"
    );
    await queryInterface.changeColumn('skills', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true
    });
    await queryInterface.changeColumn('skills', 'name', {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true
    });
  }
};
