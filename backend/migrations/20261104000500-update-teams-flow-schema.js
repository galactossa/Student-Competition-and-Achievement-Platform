'use strict';

const oldStatuses = ['draft', 'pending', 'approved', 'rejected'];
const teamStatuses = ['draft', 'pending_approval', 'approved', 'rejected'];

function enumValues(values) {
  return [...new Set(values)].map((value) => `'${value}'`).join(', ');
}

async function renameColumnIfNeeded(queryInterface, table, oldName, newName) {
  const columns = await queryInterface.describeTable(table);
  if (columns[oldName] && !columns[newName]) {
    await queryInterface.renameColumn(table, oldName, newName);
  }
}

async function ensureIndex(queryInterface, table, fields, name, unique = false) {
  const indexes = await queryInterface.showIndex(table);
  const found = indexes.some(
    (index) =>
      index.unique === unique &&
      index.fields.length === fields.length &&
      fields.every((field, position) => index.fields[position].attribute === field)
  );
  if (!found) {
    await queryInterface.addIndex(table, fields, { name, unique });
  }
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

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    await renameColumnIfNeeded(queryInterface, 'teams', 'created_by', 'leader_id');
    await renameColumnIfNeeded(queryInterface, 'teams', 'description', 'notes');
    await queryInterface.changeColumn('teams', 'name', {
      type: DataTypes.STRING(150),
      allowNull: false
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE \`teams\` MODIFY \`status\` ENUM(${enumValues([...oldStatuses, ...teamStatuses])}) NOT NULL DEFAULT 'draft'`
    );
    await queryInterface.sequelize.query(
      "UPDATE teams SET status = 'pending_approval' WHERE status = 'pending'"
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE \`teams\` MODIFY \`status\` ENUM(${enumValues(teamStatuses)}) NOT NULL DEFAULT 'draft'`
    );

    await queryInterface.addColumn('teams', 'team_code', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    const [existingTeams] = await queryInterface.sequelize.query(
      `SELECT t.id, t.leader_id, t.created_at, s.program_studi, s.angkatan
       FROM teams t
       LEFT JOIN students s ON s.user_id = t.leader_id
       WHERE t.team_code IS NULL
       ORDER BY t.id`
    );
    const sequenceByProgramAndYear = new Map();
    for (const team of existingTeams) {
      const program = (team.program_studi || 'UMUM')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '');
      const year = team.angkatan || new Date(team.created_at).getFullYear();
      const sequenceKey = `${program}-${year}`;
      const sequence = (sequenceByProgramAndYear.get(sequenceKey) || 0) + 1;
      sequenceByProgramAndYear.set(sequenceKey, sequence);
      const teamCode = `TEAM-${program}-${year}-${String(sequence).padStart(3, '0')}`;
      await queryInterface.bulkUpdate('teams', { team_code: teamCode }, { id: team.id });
    }

    await queryInterface.changeColumn('teams', 'team_code', {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    });
    await removeForeignKeys(queryInterface, 'teams', 'approved_by');
    await queryInterface.changeColumn('teams', 'approved_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addConstraint('teams', {
      fields: ['approved_by'],
      type: 'foreign key',
      name: 'teams_approved_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    await removeForeignKeys(queryInterface, 'teams', 'approved_by');
    await queryInterface.changeColumn('teams', 'approved_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addConstraint('teams', {
      fields: ['approved_by'],
      type: 'foreign key',
      name: 'teams_approved_by_fkey',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    await queryInterface.removeColumn('teams', 'team_code');

    await queryInterface.sequelize.query(
      `ALTER TABLE \`teams\` MODIFY \`status\` ENUM(${enumValues([...teamStatuses, ...oldStatuses])}) NOT NULL DEFAULT 'draft'`
    );
    await queryInterface.sequelize.query(
      "UPDATE teams SET status = 'pending' WHERE status = 'pending_approval'"
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE \`teams\` MODIFY \`status\` ENUM(${enumValues(oldStatuses)}) NOT NULL DEFAULT 'draft'`
    );

    await queryInterface.changeColumn('teams', 'name', {
      type: DataTypes.STRING(120),
      allowNull: false
    });
    await renameColumnIfNeeded(queryInterface, 'teams', 'notes', 'description');
    await renameColumnIfNeeded(queryInterface, 'teams', 'leader_id', 'created_by');
  }
};
