'use strict';

const {
  Team,
  TeamMember,
  getCompetition,
  getUser,
  getStudentUsers,
  ensure,
  daysFromBase
} = require('../seed-data-helpers');

const teamDefinitions = [
  { code: 'TEAM-IF-2026-001', name: 'Cakrawala Digital', slug: 'hackathon-kampus-berdampak', status: 'approved', leader: 0 },
  { code: 'TEAM-IF-2026-002', name: 'Nusa Inovator', slug: 'pekan-inovasi-mahasiswa', status: 'approved', leader: 3 },
  { code: 'TEAM-IF-2026-003', name: 'Riset Muda', slug: 'lomba-esai-nusantara', status: 'pending_approval', leader: 6 },
  { code: 'TEAM-IF-2026-004', name: 'Robotika Garuda', slug: 'kompetisi-robotika-regional', status: 'pending_approval', leader: 9 },
  { code: 'TEAM-IF-2026-005', name: 'Juara Kampus', slug: 'festival-olahraga-mahasiswa', status: 'draft', leader: 12 },
  { code: 'TEAM-IF-2026-006', name: 'Solusi Hijau', slug: 'olimpiade-riset-indonesia', status: 'draft', leader: 15 }
];

module.exports = {
  async up() {
    const students = await getStudentUsers();
    const admin = await getUser('pka@scap.test');
    const membersByTeam = [
      [0, 1, 2],
      [3, 4, 5, 6],
      [6, 7],
      [9, 10, 11],
      [12, 13, 14, 15],
      [15, 16, 17]
    ];

    for (const [index, definition] of teamDefinitions.entries()) {
      const competition = await getCompetition(definition.slug);
      const leader = students[definition.leader];
      const team = await ensure(Team, { team_code: definition.code }, {
        competition_id: competition.id,
        leader_id: leader.id,
        name: definition.name,
        status: definition.status,
        approved_by: definition.status === 'approved' ? admin.id : null,
        approved_at: definition.status === 'approved' ? daysFromBase(-5 - index) : null,
        notes: `Tim peserta ${competition.name}.`
      });

      for (const memberIndex of membersByTeam[index]) {
        const member = students[memberIndex];
        await ensure(TeamMember, { team_id: team.id, user_id: member.id }, {
          role: member.id === leader.id ? 'leader' : 'member',
          status: 'active',
          joined_at: daysFromBase(-8 + memberIndex)
        });
      }
    }
  },

  async down() {
    await Team.destroy({
      where: { team_code: teamDefinitions.map(({ code }) => code) }
    });
  }
};
