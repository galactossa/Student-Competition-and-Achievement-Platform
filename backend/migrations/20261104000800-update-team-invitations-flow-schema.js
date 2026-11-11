'use strict';

const oldStatuses = ['pending', 'accepted', 'declined', 'expired'];
const invitationStatuses = ['pending', 'accepted', 'rejected', 'expired'];

function enumValues(values) {
  return [...new Set(values)].map((value) => `'${value}'`).join(', ');
}

async function renameColumnIfNeeded(queryInterface, oldName, newName) {
  const columns = await queryInterface.describeTable('team_invitations');
  if (columns[oldName] && !columns[newName]) {
    await queryInterface.renameColumn('team_invitations', oldName, newName);
  }
}

async function ensureUniqueIndex(queryInterface, fields, name) {
  const indexes = await queryInterface.showIndex('team_invitations');
  if (
    !indexes.some(
      (index) =>
        index.unique &&
        index.fields.length === fields.length &&
        fields.every((field, position) => index.fields[position].attribute === field)
    )
  ) {
    await queryInterface.addIndex('team_invitations', fields, { name, unique: true });
  }
}

async function ensureIndex(queryInterface, field, name) {
  const indexes = await queryInterface.showIndex('team_invitations');
  if (!indexes.some((index) => index.fields.length === 1 && index.fields[0].attribute === field)) {
    await queryInterface.addIndex('team_invitations', [field], { name });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    await renameColumnIfNeeded(queryInterface, 'invited_by', 'inviter_id');
    await renameColumnIfNeeded(queryInterface, 'user_id', 'invitee_id');
    await renameColumnIfNeeded(queryInterface, 'email', 'invitee_email');
    await renameColumnIfNeeded(queryInterface, 'expires_at', 'expired_at');

    await queryInterface.changeColumn('team_invitations', 'invitee_email', {
      type: DataTypes.STRING(150),
      allowNull: true
    });
    await queryInterface.changeColumn('team_invitations', 'token', {
      type: DataTypes.STRING(100),
      allowNull: false
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE \`team_invitations\` MODIFY \`status\` ENUM(${enumValues([...oldStatuses, ...invitationStatuses])}) NOT NULL DEFAULT 'pending'`
    );
    await queryInterface.sequelize.query(
      "UPDATE team_invitations SET status = 'rejected' WHERE status = 'declined'"
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE \`team_invitations\` MODIFY \`status\` ENUM(${enumValues(invitationStatuses)}) NOT NULL DEFAULT 'pending'`
    );

    await queryInterface.addColumn('team_invitations', 'responded_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await ensureUniqueIndex(
      queryInterface,
      ['team_id', 'invitee_id'],
      'team_invitations_team_invitee_unique'
    );
  },

  async down(queryInterface, Sequelize) {
    await ensureIndex(queryInterface, 'team_id', 'team_invitations_team_id_idx');
    await queryInterface.removeIndex(
      'team_invitations',
      'team_invitations_team_invitee_unique'
    );
    await queryInterface.removeColumn('team_invitations', 'responded_at');
    await queryInterface.sequelize.query(
      `ALTER TABLE \`team_invitations\` MODIFY \`status\` ENUM(${enumValues([...invitationStatuses, ...oldStatuses])}) NOT NULL DEFAULT 'pending'`
    );
    await queryInterface.sequelize.query(
      "UPDATE team_invitations SET status = 'declined' WHERE status = 'rejected'"
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE \`team_invitations\` MODIFY \`status\` ENUM(${enumValues(oldStatuses)}) NOT NULL DEFAULT 'pending'`
    );
    await queryInterface.changeColumn('team_invitations', 'token', {
      type: Sequelize.STRING(128),
      allowNull: false
    });
    await queryInterface.sequelize.query(
      "UPDATE team_invitations ti LEFT JOIN users u ON u.id = ti.invitee_id SET ti.invitee_email = COALESCE(ti.invitee_email, u.email, CONCAT('legacy-', ti.id, '@invalid.local')) WHERE ti.invitee_email IS NULL"
    );
    await queryInterface.changeColumn('team_invitations', 'invitee_email', {
      type: Sequelize.STRING(160),
      allowNull: false
    });
    await renameColumnIfNeeded(queryInterface, 'expired_at', 'expires_at');
    await renameColumnIfNeeded(queryInterface, 'invitee_email', 'email');
    await renameColumnIfNeeded(queryInterface, 'invitee_id', 'user_id');
    await renameColumnIfNeeded(queryInterface, 'inviter_id', 'invited_by');
  }
};
