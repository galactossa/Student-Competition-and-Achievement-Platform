'use strict';

const {
  MentorAssignment,
  MentorNote,
  Team,
  ensure,
  getUser,
  daysFromBase
} = require('../seed-data-helpers');

const assignments = [
  { team: 'TEAM-IF-2026-001', mentor: 'verifier1@scap.test' },
  { team: 'TEAM-IF-2026-002', mentor: 'verifier2@scap.test' }
];
const noteContents = [
  'Tim sudah menyusun target kerja dan membagi tanggung jawab.',
  'Pastikan bukti riset dan prototipe dicantumkan pada proposal.',
  'Rencana kerja realistis; lanjutkan uji coba dengan pengguna.'
];

module.exports = {
  async up() {
    const admin = await getUser('pka@scap.test');

    for (const [index, definition] of assignments.entries()) {
      const team = await Team.findOne({ where: { team_code: definition.team } });
      const mentor = await getUser(definition.mentor);
      if (!team) {
        throw new Error(`Required approved team not found: ${definition.team}`);
      }
      const assignment = await ensure(MentorAssignment, { team_id: team.id }, {
        mentor_id: mentor.id,
        assigned_by: admin.id,
        assigned_at: daysFromBase(-4 + index),
        notes: 'Pendampingan untuk persiapan dan evaluasi kompetisi.'
      });

      const notes = [
        ['progress', noteContents[0]],
        ['comment', noteContents[1]],
        ['evaluation', noteContents[2]]
      ];
      for (const [type, content] of notes) {
        await ensure(MentorNote, {
          mentor_assignment_id: assignment.id,
          content
        }, {
          type
        });
      }
    }
  },

  async down() {
    const teams = await Team.findAll({
      where: { team_code: assignments.map(({ team }) => team) },
      attributes: ['id']
    });
    const rows = await MentorAssignment.findAll({
      where: { team_id: teams.map(({ id }) => id) },
      attributes: ['id']
    });
    await MentorNote.destroy({
      where: {
        mentor_assignment_id: rows.map(({ id }) => id),
        content: noteContents
      }
    });
    await MentorAssignment.destroy({ where: { id: rows.map(({ id }) => id) } });
  }
};
