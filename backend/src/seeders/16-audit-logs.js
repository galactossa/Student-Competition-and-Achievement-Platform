'use strict';

const {
  AuditLog,
  auditUserAgents,
  ensure,
  getUsersByRole
} = require('../seed-data-helpers');

const actions = ['create', 'update', 'delete', 'verify', 'invite', 'submit'];
const modelTypes = [
  'Team',
  'Competition',
  'Submission',
  'Achievement',
  'TeamInvitation',
  'UserCalendarEvent'
];

module.exports = {
  async up() {
    const users = await getUsersByRole('mahasiswa');
    const admins = await getUsersByRole('admin_pka');
    const verifiers = await getUsersByRole('verifier');
    const actors = [...admins, ...verifiers, ...users];
    if (actors.length === 0) {
      throw new Error('No seeded users are available for audit log events');
    }

    for (let index = 0; index < 30; index += 1) {
      const action = actions[index % actions.length];
      const modelType = modelTypes[index % modelTypes.length];
      const modelId = index + 1;
      await ensure(AuditLog, {
        user_id: actors[index % actors.length].id,
        action,
        model_type: modelType,
        model_id: modelId
      }, {
        old_values: index % 2 === 0 ? { status: 'draft' } : null,
        new_values: { status: index % 2 === 0 ? 'submitted' : 'verified' },
        ip_address: `192.168.1.${(index % 200) + 1}`,
        user_agent: auditUserAgents[index]
      });
    }
  },

  async down() {
    await AuditLog.destroy({
      where: {
        user_agent: auditUserAgents,
        ip_address: Array.from({ length: 30 }, (_, index) => `192.168.1.${index + 1}`)
      }
    });
  }
};
