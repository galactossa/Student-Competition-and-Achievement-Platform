'use strict';

const {
  Result,
  Team,
  daysFromBase,
  ensure,
  getCompetition,
  getStudentUsers
} = require('../seed-data-helpers');

const resultDefinitions = [
  {
    competition: 'olimpiade-riset-indonesia',
    team: 'TEAM-IF-2026-006',
    result_type: 'winner',
    position: 1,
    title: 'Juara 1'
  },
  {
    competition: 'business-plan-challenge',
    user: 0,
    result_type: 'winner',
    position: 2,
    title: 'Juara 2'
  },
  {
    competition: 'global-student-innovation-summit',
    user: 1,
    result_type: 'finalist',
    position: null,
    title: 'Finalis Internasional'
  },
  {
    competition: 'lomba-esai-nusantara',
    user: 2,
    result_type: 'participation',
    position: null,
    title: 'Peserta'
  }
];

module.exports = {
  async up() {
    const students = await getStudentUsers();
    for (const [index, definition] of resultDefinitions.entries()) {
      const competition = await getCompetition(definition.competition);
      const team = definition.team
        ? await Team.findOne({ where: { team_code: definition.team } })
        : null;
      const user = definition.user === undefined ? null : students[definition.user];
      if (definition.team && !team) {
        throw new Error(`Required team not found: ${definition.team}`);
      }

      await ensure(Result, {
        competition_id: competition.id,
        team_id: team ? team.id : null,
        user_id: user ? user.id : null
      }, {
        result_type: definition.result_type,
        position: definition.position,
        title: definition.title,
        date: daysFromBase(-25 - index),
        notes: `Hasil resmi ${competition.name}.`
      });
    }
  },

  async down() {
    const ids = [];
    for (const definition of resultDefinitions) {
      const competition = await getCompetition(definition.competition);
      ids.push(competition.id);
    }
    await Result.destroy({
      where: {
        competition_id: ids,
        title: resultDefinitions.map(({ title }) => title)
      }
    });
  }
};
