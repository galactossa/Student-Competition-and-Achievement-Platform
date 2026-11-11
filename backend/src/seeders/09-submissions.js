'use strict';

const {
  Submission,
  SubmissionVersion,
  Team,
  ensure,
  getStudentUsers
} = require('../seed-data-helpers');

const submissionDefinitions = [
  { team: 'TEAM-IF-2026-001', title: 'Rancangan Solusi Kampus', status: 'draft', versions: 0, author: 0 },
  { team: 'TEAM-IF-2026-002', title: 'Proposal Inovasi Mahasiswa', status: 'submitted', versions: 1, author: 3 },
  { team: 'TEAM-IF-2026-001', title: 'Prototipe Layanan Digital', status: 'final_submission', versions: 2, author: 1 }
];

module.exports = {
  async up() {
    const students = await getStudentUsers();

    for (const [index, definition] of submissionDefinitions.entries()) {
      const team = await Team.findOne({ where: { team_code: definition.team } });
      if (!team) {
        throw new Error(`Required seeded team not found: ${definition.team}`);
      }
      const submission = await ensure(Submission, {
        team_id: team.id,
        title: definition.title
      }, {
        user_id: null,
        competition_id: team.competition_id,
        description: `Dokumen ${definition.title.toLowerCase()} untuk kompetisi.`,
        status: definition.status,
        current_version: Math.max(definition.versions, 1)
      });

      for (let version = 1; version <= definition.versions; version += 1) {
        await ensure(SubmissionVersion, {
          submission_id: submission.id,
          version
        }, {
          file_url: `/uploads/submissions/${submission.id}/version-${version}.pdf`,
          repository_url: `https://github.com/scap-demo/team-${index + 1}`,
          demo_url: version === definition.versions ? `https://demo.scap.test/team-${index + 1}` : null,
          video_url: null,
          presentation_url: `/uploads/submissions/${submission.id}/presentation-${version}.pdf`,
          supporting_document_url: null,
          notes: `Versi ${version} dari ${definition.title}.`,
          uploaded_by: students[definition.author].id
        });
      }
    }
  },

  async down() {
    const submissions = await Submission.findAll({
      where: { title: submissionDefinitions.map(({ title }) => title) },
      attributes: ['id']
    });
    const ids = submissions.map(({ id }) => id);
    await SubmissionVersion.destroy({ where: { submission_id: ids } });
    await Submission.destroy({ where: { id: ids } });
  }
};
