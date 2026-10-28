'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const inDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const passwordHash = await bcrypt.hash('ScapDemo2026!', 12);

    await queryInterface.bulkInsert('users', [
      { id: 1, name: 'Super Admin', email: 'superadmin@scap.local', password_hash: passwordHash, role: 'super_admin', is_active: true, created_at: now, updated_at: now },
      { id: 2, name: 'Admin PKA', email: 'admin@scap.local', password_hash: passwordHash, role: 'admin_pka', is_active: true, created_at: now, updated_at: now },
      { id: 3, name: 'Ayu Pratama', email: 'ayu@scap.local', password_hash: passwordHash, role: 'mahasiswa', is_active: true, created_at: now, updated_at: now },
      { id: 4, name: 'Bima Saputra', email: 'bima@scap.local', password_hash: passwordHash, role: 'mahasiswa', is_active: true, created_at: now, updated_at: now },
      { id: 5, name: 'Citra Lestari', email: 'citra@scap.local', password_hash: passwordHash, role: 'mahasiswa', is_active: true, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('students', [
      { id: 1, user_id: 3, student_number: '2024001', faculty: 'Teknik', study_program: 'Informatika', entry_year: 2024, semester: 5, created_at: now, updated_at: now },
      { id: 2, user_id: 4, student_number: '2024002', faculty: 'Teknik', study_program: 'Sistem Informasi', entry_year: 2024, semester: 5, created_at: now, updated_at: now },
      { id: 3, user_id: 5, student_number: '2024003', faculty: 'Ekonomi', study_program: 'Manajemen', entry_year: 2024, semester: 5, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('competition_categories', [
      { id: 1, name: 'Teknologi', slug: 'teknologi', description: 'Kompetisi teknologi dan rekayasa.', created_at: now, updated_at: now },
      { id: 2, name: 'Bisnis', slug: 'bisnis', description: 'Kompetisi bisnis dan kewirausahaan.', created_at: now, updated_at: now },
      { id: 3, name: 'Sains', slug: 'sains', description: 'Kompetisi sains dan penelitian.', created_at: now, updated_at: now },
      { id: 4, name: 'Seni dan Budaya', slug: 'seni-budaya', description: 'Kompetisi seni dan budaya.', created_at: now, updated_at: now },
      { id: 5, name: 'Olahraga', slug: 'olahraga', description: 'Kompetisi olahraga.', created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('competitions', [
      { id: 1, category_id: 1, title: 'Hackathon Inovasi Kampus', slug: 'hackathon-inovasi-kampus', description: 'Bangun solusi digital untuk tantangan kampus.', level: 'Internal Kampus', organizer: 'Pusat Kegiatan Mahasiswa', location: 'Kampus Utama', registration_start: inDays(-5), registration_end: inDays(15), start_at: inDays(20), end_at: inDays(22), quota: 30, status: 'published', created_at: now, updated_at: now },
      { id: 2, category_id: 2, title: 'Kompetisi Ide Bisnis Muda', slug: 'kompetisi-ide-bisnis-muda', description: 'Presentasikan ide bisnis berdampak dan berkelanjutan.', level: 'Regional', organizer: 'Universitas Nusantara', location: 'Daring', registration_start: inDays(-2), registration_end: inDays(25), start_at: inDays(35), end_at: inDays(36), quota: 50, status: 'published', created_at: now, updated_at: now },
      { id: 3, category_id: 3, title: 'Olimpiade Riset Mahasiswa', slug: 'olimpiade-riset-mahasiswa', description: 'Ajang presentasi karya riset mahasiswa.', level: 'Nasional', organizer: 'Forum Riset Indonesia', location: 'Jakarta', registration_start: inDays(2), registration_end: inDays(40), start_at: inDays(55), end_at: inDays(57), quota: 100, status: 'published', created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('teams', [
      { id: 1, competition_id: 1, created_by: 3, name: 'Tim Cakrawala', description: 'Tim demo SCAP untuk hackathon kampus.', status: 'approved', approved_by: 2, approved_at: now, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('team_members', [
      { id: 1, team_id: 1, user_id: 3, role: 'leader', status: 'active', joined_at: now, created_at: now, updated_at: now },
      { id: 2, team_id: 1, user_id: 4, role: 'member', status: 'active', joined_at: now, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('registrations', [
      { id: 1, user_id: 3, competition_id: 1, team_id: 1, status: 'confirmed', registered_at: now, created_at: now, updated_at: now },
      { id: 2, user_id: 4, competition_id: 1, team_id: 1, status: 'confirmed', registered_at: now, created_at: now, updated_at: now },
      { id: 3, user_id: 5, competition_id: 2, team_id: null, status: 'registered', registered_at: now, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('achievements', [
      { id: 1, user_id: 3, competition_id: 1, title: 'Juara 1 Hackathon Inovasi Kampus', description: 'Meraih juara pertama melalui aplikasi akses informasi kampus.', level: 'Lokal', organizer: 'Pusat Kegiatan Mahasiswa', occurred_at: inDays(-30), skkm_points: 10, status: 'verified', submitted_at: inDays(-28), created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('achievement_verifications', [
      { id: 1, achievement_id: 1, verifier_id: 2, status: 'verified', notes: 'Dokumen dan hasil telah diverifikasi.', verified_at: now, created_at: now, updated_at: now }
    ]);
  },

  async down(queryInterface) {
    const seededRows = [
      ['achievement_verifications', [1]],
      ['achievements', [1]],
      ['registrations', [1, 2, 3]],
      ['team_members', [1, 2]],
      ['teams', [1]],
      ['competitions', [1, 2, 3]],
      ['competition_categories', [1, 2, 3, 4, 5]],
      ['students', [1, 2, 3]],
      ['users', [1, 2, 3, 4, 5]]
    ];

    for (const [table, ids] of seededRows) {
      await queryInterface.bulkDelete(table, { id: ids }, {});
    }
  }
};
