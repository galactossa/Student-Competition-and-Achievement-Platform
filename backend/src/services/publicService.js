const { Op } = require('sequelize');
const { Achievement, Competition, Result, Student, User } = require('../models');

const publicCompetitionStatuses = [
  'published',
  'registration_open',
  'registration_closed',
  'submission',
  'competition',
  'result_announced'
];

function plain(instance) {
  return instance?.toJSON ? instance.toJSON() : instance;
}

async function listAchievements(limit = 6) {
  const achievements = await Achievement.findAll({
    where: { status: 'verified' },
    attributes: ['id', 'date'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name'],
        include: [{
          model: Student,
          as: 'student',
          attributes: ['program_studi', 'photo_url']
        }]
      },
      {
        model: Competition,
        as: 'competition',
        attributes: ['name', 'level']
      },
      {
        model: Result,
        as: 'result',
        attributes: ['title']
      }
    ],
    order: [['date', 'DESC']],
    limit
  });

  return achievements.map((item) => {
    const achievement = plain(item);
    return {
      id: achievement.id,
      student_name: achievement.user?.name || null,
      program_studi: achievement.user?.student?.program_studi || null,
      photo_url: achievement.user?.student?.photo_url || null,
      competition_name: achievement.competition?.name || null,
      level: achievement.competition?.level || null,
      result_title: achievement.result?.title || null,
      date: achievement.date
    };
  });
}

async function getPublicStats() {
  const [totalCompetitions, totalAchievements, totalStudents] = await Promise.all([
    Competition.count({ where: { status: { [Op.in]: publicCompetitionStatuses } } }),
    Achievement.count({ where: { status: 'verified' } }),
    Student.count()
  ]);

  return {
    total_competitions: totalCompetitions,
    total_achievements: totalAchievements,
    total_students: totalStudents
  };
}

module.exports = { getPublicStats, listAchievements, publicCompetitionStatuses };
