'use strict';

const {
  Notification,
  daysFromBase,
  ensure,
  getStudentUsers
} = require('../seed-data-helpers');

const notificationTypes = [
  'team_invitation',
  'achievement_verified',
  'competition_published',
  'submission_reminder',
  'achievement_revision'
];
const notificationTitles = Array.from({ length: 20 }, (_, index) =>
  `${[
    'Undangan tim baru',
    'Prestasi berhasil diverifikasi',
    'Kompetisi baru tersedia',
    'Pengingat tenggat pengumpulan',
    'Perlu perbaikan data prestasi'
  ][index % notificationTypes.length]} #${String(index + 1).padStart(2, '0')}`
);

module.exports = {
  async up() {
    const students = await getStudentUsers();

    for (let index = 0; index < 20; index += 1) {
      const type = notificationTypes[index % notificationTypes.length];
      const title = notificationTitles[index];
      await ensure(Notification, {
        user_id: students[index % students.length].id,
        title
      }, {
        type,
        message: [
          'Anda menerima undangan untuk bergabung dengan tim kompetisi.',
          'Prestasi Anda telah diverifikasi dan siap ditampilkan di portofolio.',
          'Kompetisi baru telah ditambahkan ke platform SCAP.',
          'Pastikan submission dikirim sebelum tenggat waktu.',
          'Periksa catatan verifier dan lengkapi bukti prestasi.'
        ][index % notificationTypes.length],
        data: { source: 'seed', activity: index + 1 },
        read_at: index % 4 === 0 ? daysFromBase(-1) : null
      });
    }
  },

  async down() {
    await Notification.destroy({
      where: { title: notificationTitles }
    });
  }
};
