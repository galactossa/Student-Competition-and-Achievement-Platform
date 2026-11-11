'use strict';

const oldStatuses = ['draft', 'registered', 'confirmed', 'participating', 'completed', 'cancelled'];
const registrationStatuses = ['draft', 'registered', 'confirmed', 'participating', 'completed'];

function enumValues(values) {
  return [...new Set(values)].map((value) => `'${value}'`).join(', ');
}

async function removeForeignKeys(queryInterface, table, column) {
  const [constraints] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = '${table}'
       AND COLUMN_NAME = '${column}'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
  );
  for (const { CONSTRAINT_NAME: name } of constraints) {
    await queryInterface.removeConstraint(table, name);
  }
}

async function ensureIndex(queryInterface, table, field, name) {
  const indexes = await queryInterface.showIndex(table);
  if (!indexes.some((index) => index.fields.length === 1 && index.fields[0].attribute === field)) {
    await queryInterface.addIndex(table, [field], { name });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    await queryInterface.addColumn('registrations', 'participation_type', {
      type: DataTypes.ENUM('individual', 'team'),
      allowNull: true
    });
    await queryInterface.sequelize.query(
      "UPDATE registrations SET participation_type = IF(team_id IS NULL, 'individual', 'team') WHERE participation_type IS NULL"
    );
    await queryInterface.changeColumn('registrations', 'participation_type', {
      type: DataTypes.ENUM('individual', 'team'),
      allowNull: false
    });
    await queryInterface.addColumn('registrations', 'supporting_document_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('registrations', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE \`registrations\` MODIFY \`status\` ENUM(${enumValues(registrationStatuses)}) NOT NULL DEFAULT 'registered'`
    );
    await removeForeignKeys(queryInterface, 'registrations', 'team_id');
    await queryInterface.changeColumn('registrations', 'team_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addConstraint('registrations', {
      fields: ['team_id'],
      type: 'foreign key',
      name: 'registrations_team_id_fkey',
      references: { table: 'teams', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('registrations', {
      fields: ['competition_id', 'user_id'],
      type: 'unique',
      name: 'registrations_competition_user_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await ensureIndex(queryInterface, 'registrations', 'competition_id', 'registrations_competition_id_idx');
    await ensureIndex(queryInterface, 'registrations', 'user_id', 'registrations_user_id_idx');
    await queryInterface.removeConstraint(
      'registrations',
      'registrations_competition_user_unique'
    );
    await removeForeignKeys(queryInterface, 'registrations', 'team_id');
    await queryInterface.changeColumn('registrations', 'team_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addConstraint('registrations', {
      fields: ['team_id'],
      type: 'foreign key',
      name: 'registrations_team_id_fkey',
      references: { table: 'teams', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    await queryInterface.sequelize.query(
      `ALTER TABLE \`registrations\` MODIFY \`status\` ENUM(${enumValues(oldStatuses)}) NOT NULL DEFAULT 'draft'`
    );
    await queryInterface.removeColumn('registrations', 'notes');
    await queryInterface.removeColumn('registrations', 'supporting_document_url');
    await queryInterface.removeColumn('registrations', 'participation_type');
  }
};
