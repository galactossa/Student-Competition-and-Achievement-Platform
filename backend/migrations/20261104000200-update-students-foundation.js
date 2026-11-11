'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    let columns = await queryInterface.describeTable('students');
    if (columns.student_number && !columns.nim) {
      await queryInterface.renameColumn('students', 'student_number', 'nim');
    }
    columns = await queryInterface.describeTable('students');
    if (columns.study_program && !columns.program_studi) {
      await queryInterface.renameColumn('students', 'study_program', 'program_studi');
    }
    columns = await queryInterface.describeTable('students');
    if (columns.entry_year && !columns.angkatan) {
      await queryInterface.renameColumn('students', 'entry_year', 'angkatan');
    }
    await queryInterface.changeColumn('students', 'nim', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true
    });
    await queryInterface.changeColumn('students', 'program_studi', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE `students` MODIFY `angkatan` YEAR NOT NULL'
    );
    await queryInterface.changeColumn('students', 'faculty', {
      type: Sequelize.STRING(120),
      allowNull: true
    });
    columns = await queryInterface.describeTable('students');
    const newColumns = {
      phone: { type: Sequelize.STRING(20), allowNull: true },
      photo_url: { type: Sequelize.STRING(255), allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      slug: { type: Sequelize.STRING(100), allowNull: true, unique: true }
    };
    for (const [name, definition] of Object.entries(newColumns)) {
      if (!columns[name]) {
        await queryInterface.addColumn('students', name, definition);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'slug');
    await queryInterface.removeColumn('students', 'is_public');
    await queryInterface.removeColumn('students', 'bio');
    await queryInterface.removeColumn('students', 'photo_url');
    await queryInterface.removeColumn('students', 'phone');
    await queryInterface.sequelize.query(
      'ALTER TABLE `students` MODIFY `angkatan` SMALLINT NOT NULL'
    );
    await queryInterface.changeColumn('students', 'program_studi', {
      type: Sequelize.STRING(120),
      allowNull: false
    });
    await queryInterface.changeColumn('students', 'nim', {
      type: Sequelize.STRING(30),
      allowNull: false,
      unique: true
    });
    await queryInterface.sequelize.query(
      "UPDATE students SET faculty = 'Belum diisi' WHERE faculty IS NULL"
    );
    await queryInterface.changeColumn('students', 'faculty', {
      type: Sequelize.STRING(120),
      allowNull: false
    });
    await queryInterface.renameColumn('students', 'angkatan', 'entry_year');
    await queryInterface.renameColumn('students', 'program_studi', 'study_program');
    await queryInterface.renameColumn('students', 'nim', 'student_number');
  }
};
