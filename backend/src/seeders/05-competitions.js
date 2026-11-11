'use strict';

const {
  Competition,
  CompetitionCategory,
  ensure,
  daysFromBase,
  getUser
} = require('../seed-data-helpers');

const competitions = [
  { name: 'Hackathon Kampus Berdampak', level: 'Internal Kampus', category: 'TECHNOLOGY', status: 'draft' },
  { name: 'Pekan Inovasi Mahasiswa', level: 'Internal Kampus', category: 'ACADEMIC', status: 'draft' },
  { name: 'Lomba Esai Nusantara', level: 'Regional', category: 'ACADEMIC', status: 'registration_open' },
  { name: 'Kompetisi Robotika Regional', level: 'Regional', category: 'TECHNOLOGY', status: 'registration_open' },
  { name: 'Festival Olahraga Mahasiswa', level: 'Regional', category: 'SPORTS', status: 'registration_open' },
  { name: 'Olimpiade Riset Indonesia', level: 'Nasional', category: 'ACADEMIC', status: 'registration_open' },
  { name: 'Business Plan Challenge', level: 'Nasional', category: 'BUSINESS', status: 'registration_open' },
  { name: 'Inovasi Digital Nasional', level: 'Nasional', category: 'TECHNOLOGY', status: 'submission' },
  { name: 'Kompetisi Seni Kreatif', level: 'Internasional', category: 'ARTS', status: 'submission' },
  { name: 'Global Student Innovation Summit', level: 'Internasional', category: 'TECHNOLOGY', status: 'submission' },
  { name: 'International Social Impact Award', level: 'Internasional', category: 'SOCIAL', status: 'completed' },
  { name: 'Kejuaraan Debat Dunia Mahasiswa', level: 'Internasional', category: 'NON ACADEMIC', status: 'completed' }
];

module.exports = {
  async up() {
    const admin = await getUser('pka@scap.test');

    for (const [index, competition] of competitions.entries()) {
      const { category: categoryName, ...competitionAttributes } = competition;
      const category = await CompetitionCategory.findOne({
        where: { name: categoryName }
      });
      if (!category) {
        throw new Error(`Competition category not found: ${categoryName}`);
      }

      const slug = competition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const deadlineDays = index % 3 === 0 ? -10 - index : 12 + index;
      const attributes = {
        ...competitionAttributes,
        category_id: category.id,
        slug,
        organizer: `${competition.level} ${categoryName} Committee`,
        description: `${competition.name} merupakan ajang pengembangan prestasi mahasiswa tingkat ${competition.level.toLowerCase()}.`,
        start_date: daysFromBase(deadlineDays + 5),
        end_date: daysFromBase(deadlineDays + 7),
        registration_deadline: daysFromBase(deadlineDays),
        submission_deadline: daysFromBase(deadlineDays + 3),
        result_date: competition.status === 'completed' ? daysFromBase(-20 - index) : null,
        location: index % 2 === 0 ? 'Kampus Utama' : 'Daring',
        mode: index % 3 === 0 ? 'hybrid' : index % 2 === 0 ? 'offline' : 'online',
        registration_url: `https://scap.test/competitions/${slug}/register`,
        prize: 'Piala, sertifikat, dan pembinaan.',
        requirements: 'Mahasiswa aktif dan mengunggah karya sesuai panduan.',
        poster_url: `/uploads/competitions/${slug}-poster.jpg`,
        guidebook_url: `/uploads/competitions/${slug}-guidebook.pdf`,
        contact_person: 'Panitia SCAP',
        price: 0,
        created_by: admin.id
      };
      await ensure(Competition, { slug }, attributes);
    }
  },

  async down() {
    const slugs = competitions.map(({ name }) =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    );
    await Competition.destroy({ where: { slug: slugs } });
  }
};
