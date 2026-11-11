'use strict';

const {
  Achievement,
  Competition,
  Result,
  Team,
  ensure,
  getStudentUsers
} = require('../seed-data-helpers');

const pointTable = {
  Internasional: { winner: [200, 160, 120], finalist: 80, participation: 20 },
  Nasional: { winner: [100, 80, 60], finalist: 40, participation: 10 },
  Regional: { winner: [50, 40, 30], finalist: 20, participation: 5 },
  Lokal: { winner: [25, 20, 15], finalist: 10, participation: 2 }
};

const achievementDefinitions = [
  { competition: 'olimpiade-riset-indonesia', team: 'TEAM-IF-2026-006', student: 15, status: 'verified' },
  { competition: 'business-plan-challenge', student: 0, status: 'verified' },
  { competition: 'global-student-innovation-summit', student: 1, status: 'submitted' },
  { competition: 'lomba-esai-nusantara', student: 2, status: 'revision_required' },
  { competition: 'olimpiade-riset-indonesia', team: 'TEAM-IF-2026-006', student: 17, status: 'rejected' }
];

function calculatePoints(level, resultType, position) {
  const points = pointTable[level];
  if (!points) {
    throw new Error(`Unsupported achievement level: ${level}`);
  }
  if (resultType === 'winner') {
    return points.winner[position - 1] || 0;
  }
  return points[resultType];
}

module.exports = {
  async up() {
    const students = await getStudentUsers();
    for (const definition of achievementDefinitions) {
      const competition = await Competition.findOne({
        where: {
          slug: definition.competition
        }
      });
      if (!competition) {
        throw new Error(`Required competition not found: ${definition.competition}`);
      }
      const team = definition.team
        ? await Team.findOne({ where: { team_code: definition.team } })
        : null;
      const result = await Result.findOne({
        where: {
          competition_id: competition.id,
          team_id: team ? team.id : null,
          user_id: team ? null : students[definition.student].id
        }
      });
      if (!result) {
        throw new Error(`Required result not found for ${definition.competition}`);
      }

      const date = result.date;
      const defaults = {
        competition_id: competition.id,
        level: competition.level === 'Internal Kampus' ? 'Lokal' : competition.level,
        organizer: competition.organizer,
        date,
        certificate_url: definition.status === 'verified'
          ? `/uploads/certificates/achievement-${definition.student + 1}.pdf`
          : null,
        evidence_url: `/uploads/achievements/evidence-${definition.student + 1}.pdf`,
        skkm_points: calculatePoints(
          competition.level === 'Internal Kampus' ? 'Lokal' : competition.level,
          result.result_type,
          result.position
        ),
        status: definition.status,
        submitted_at: definition.status === 'draft' ? null : date,
        verified_at: definition.status === 'verified' ? date : null
      };

      await ensure(Achievement, {
        result_id: result.id,
        user_id: students[definition.student].id
      }, defaults);
    }
  },

  async down() {
    const students = await getStudentUsers();
    for (const definition of achievementDefinitions) {
      const user = students[definition.student];
      const competition = await Competition.findOne({
        where: { slug: definition.competition }
      });
      const team = definition.team
        ? await Team.findOne({ where: { team_code: definition.team } })
        : null;
      const result = await Result.findOne({
        where: {
          competition_id: competition.id,
          team_id: team ? team.id : null,
          user_id: team ? null : user.id
        }
      });
      const achievement = await Achievement.findOne({
        where: { result_id: result.id, user_id: user.id }
      });
      if (achievement) {
        await Achievement.destroy({ where: { id: achievement.id } });
      }
    }
  }
};
