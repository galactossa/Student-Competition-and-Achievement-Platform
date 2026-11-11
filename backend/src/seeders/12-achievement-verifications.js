'use strict';

const {
  Achievement,
  AchievementVerification,
  ensure,
  getStudentUsers,
  getUser
} = require('../seed-data-helpers');

const processed = [
  { student: 15, action: 'approve', verifier: 'verifier1@scap.test' },
  { student: 0, action: 'approve', verifier: 'verifier2@scap.test' },
  { student: 2, action: 'revision', verifier: 'verifier1@scap.test' },
  { student: 17, action: 'reject', verifier: 'verifier2@scap.test' }
];
const actionNotes = {
  approve: 'Bukti prestasi dan hasil kompetisi telah diverifikasi.',
  revision: 'Mohon lengkapi bukti pendukung dan perbaiki deskripsi prestasi.',
  reject: 'Bukti yang diajukan tidak memenuhi persyaratan verifikasi.'
};

module.exports = {
  async up() {
    const students = await getStudentUsers();
    for (const entry of processed) {
      const achievement = await Achievement.findOne({
        where: { user_id: students[entry.student].id },
        order: [['id', 'ASC']]
      });
      if (!achievement) {
        throw new Error(`Processed achievement missing for student ${entry.student}`);
      }
      const verifier = await getUser(entry.verifier);
      await ensure(AchievementVerification, {
        achievement_id: achievement.id,
        action: entry.action
      }, {
        verifier_id: verifier.id,
        notes: actionNotes[entry.action]
      });
    }
  },

  async down() {
    const students = await getStudentUsers();
    for (const entry of processed) {
      const achievement = await Achievement.findOne({
        where: { user_id: students[entry.student].id },
        order: [['id', 'ASC']]
      });
      if (achievement) {
        await AchievementVerification.destroy({
          where: {
            achievement_id: achievement.id,
            action: entry.action,
            notes: actionNotes[entry.action]
          }
        });
      }
    }
  }
};
