'use strict';

const {
  Team,
  TeamInvitation,
  daysFromBase,
  ensure,
  getStudentUsers
} = require('../seed-data-helpers');

const invitations = [
  { team: 'TEAM-IF-2026-001', inviter: 0, invitee: 4, status: 'pending', token: '00000000-0000-4000-8000-000000000001' },
  { team: 'TEAM-IF-2026-001', inviter: 0, invitee: 5, status: 'pending', token: '00000000-0000-4000-8000-000000000002' },
  { team: 'TEAM-IF-2026-002', inviter: 3, invitee: 8, status: 'pending', token: '00000000-0000-4000-8000-000000000003' },
  { team: 'TEAM-IF-2026-003', inviter: 6, invitee: 7, status: 'accepted', token: '00000000-0000-4000-8000-000000000004' },
  { team: 'TEAM-IF-2026-004', inviter: 9, invitee: 10, status: 'rejected', token: '00000000-0000-4000-8000-000000000005' }
];

module.exports = {
  async up() {
    const students = await getStudentUsers();
    for (const [index, invitation] of invitations.entries()) {
      const team = await Team.findOne({ where: { team_code: invitation.team } });
      if (!team) {
        throw new Error(`Required seeded team not found: ${invitation.team}`);
      }
      const inviter = students[invitation.inviter];
      const invitee = students[invitation.invitee];
      await ensure(TeamInvitation, { team_id: team.id, invitee_id: invitee.id }, {
        inviter_id: inviter.id,
        invitee_email: invitee.email,
        token: invitation.token,
        status: invitation.status,
        expired_at: daysFromBase(14 + index),
        responded_at: invitation.status === 'pending' ? null : daysFromBase(-1)
      });
    }
  },

  async down() {
    await TeamInvitation.destroy({
      where: { token: invitations.map(({ token }) => token) }
    });
  }
};
