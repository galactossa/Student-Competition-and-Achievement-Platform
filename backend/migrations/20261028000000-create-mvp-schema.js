'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const id = { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true };
    const timestamps = {
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    };
    const fk = (table, allowNull = false) => ({
      type: DataTypes.INTEGER,
      allowNull,
      references: { model: table, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.createTable('users', {
      id,
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.ENUM('super_admin', 'admin_pka', 'mahasiswa', 'verifier', 'pimpinan', 'prodi'),
        allowNull: false,
        defaultValue: 'mahasiswa'
      },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('students', {
      id,
      user_id: { ...fk('users'), unique: true },
      student_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      faculty: { type: DataTypes.STRING(120), allowNull: false },
      study_program: { type: DataTypes.STRING(120), allowNull: false },
      entry_year: { type: DataTypes.SMALLINT, allowNull: false },
      semester: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      ...timestamps
    });

    await queryInterface.createTable('competition_categories', {
      id,
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('competitions', {
      id,
      category_id: fk('competition_categories'),
      title: { type: DataTypes.STRING(180), allowNull: false },
      slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      level: {
        type: DataTypes.ENUM('Internal Kampus', 'Regional', 'Nasional', 'Internasional'),
        allowNull: false
      },
      organizer: { type: DataTypes.STRING(160), allowNull: false },
      location: { type: DataTypes.STRING(180), allowNull: true },
      registration_start: { type: DataTypes.DATE, allowNull: false },
      registration_end: { type: DataTypes.DATE, allowNull: false },
      start_at: { type: DataTypes.DATE, allowNull: false },
      end_at: { type: DataTypes.DATE, allowNull: false },
      quota: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'closed', 'cancelled', 'completed'),
        allowNull: false,
        defaultValue: 'draft'
      },
      ...timestamps
    });

    await queryInterface.createTable('teams', {
      id,
      competition_id: fk('competitions'),
      created_by: fk('users'),
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft'
      },
      approved_by: fk('users', true),
      approved_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('registrations', {
      id,
      user_id: fk('users'),
      competition_id: fk('competitions'),
      team_id: fk('teams', true),
      status: {
        type: DataTypes.ENUM('draft', 'registered', 'confirmed', 'participating', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      registered_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('team_members', {
      id,
      team_id: fk('teams'),
      user_id: fk('users'),
      role: { type: DataTypes.ENUM('leader', 'member'), allowNull: false, defaultValue: 'member' },
      status: { type: DataTypes.ENUM('active', 'left', 'removed'), allowNull: false, defaultValue: 'active' },
      joined_at: { type: DataTypes.DATE, allowNull: false },
      ...timestamps
    });
    await queryInterface.addConstraint('team_members', {
      fields: ['team_id', 'user_id'],
      type: 'unique',
      name: 'team_members_team_user_unique'
    });

    await queryInterface.createTable('team_invitations', {
      id,
      team_id: fk('teams'),
      invited_by: fk('users'),
      user_id: fk('users', true),
      email: { type: DataTypes.STRING(160), allowNull: false },
      token: { type: DataTypes.STRING(128), allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
      },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      ...timestamps
    });

    await queryInterface.createTable('mentor_assignments', {
      id,
      team_id: fk('teams'),
      mentor_id: fk('users'),
      assigned_by: fk('users'),
      status: { type: DataTypes.ENUM('active', 'ended'), allowNull: false, defaultValue: 'active' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      assigned_at: { type: DataTypes.DATE, allowNull: false },
      ...timestamps
    });

    await queryInterface.createTable('submissions', {
      id,
      registration_id: fk('registrations'),
      team_id: fk('teams'),
      submitted_by: fk('users'),
      title: { type: DataTypes.STRING(180), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'revision', 'final_submission', 'completed'),
        allowNull: false,
        defaultValue: 'draft'
      },
      submitted_at: { type: DataTypes.DATE, allowNull: true },
      final_submitted_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('submission_versions', {
      id,
      submission_id: fk('submissions'),
      submitted_by: fk('users'),
      version_number: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(180), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      file_path: { type: DataTypes.STRING(500), allowNull: true },
      ...timestamps
    });
    await queryInterface.addConstraint('submission_versions', {
      fields: ['submission_id', 'version_number'],
      type: 'unique',
      name: 'submission_versions_submission_version_unique'
    });

    await queryInterface.createTable('results', {
      id,
      competition_id: fk('competitions'),
      registration_id: fk('registrations'),
      team_id: fk('teams', true),
      rank: { type: DataTypes.INTEGER, allowNull: true },
      award: { type: DataTypes.STRING(120), allowNull: true },
      prize_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('achievements', {
      id,
      user_id: fk('users'),
      competition_id: fk('competitions', true),
      title: { type: DataTypes.STRING(180), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      level: { type: DataTypes.ENUM('Lokal', 'Regional', 'Nasional', 'Internasional'), allowNull: false },
      organizer: { type: DataTypes.STRING(160), allowNull: false },
      occurred_at: { type: DataTypes.DATEONLY, allowNull: false },
      skkm_points: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'under_verification', 'revision_required', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'draft'
      },
      submitted_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('achievement_verifications', {
      id,
      achievement_id: fk('achievements'),
      verifier_id: fk('users'),
      status: {
        type: DataTypes.ENUM('under_verification', 'revision_required', 'verified', 'rejected'),
        allowNull: false
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      verified_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('certificates', {
      id,
      achievement_id: { ...fk('achievements'), unique: true },
      certificate_number: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      file_path: { type: DataTypes.STRING(500), allowNull: false },
      issued_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('skills', {
      id,
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('achievement_skills', {
      id,
      achievement_id: fk('achievements'),
      skill_id: fk('skills'),
      proficiency: { type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'), allowNull: true },
      ...timestamps
    });
    await queryInterface.addConstraint('achievement_skills', {
      fields: ['achievement_id', 'skill_id'],
      type: 'unique',
      name: 'achievement_skills_achievement_skill_unique'
    });

    await queryInterface.createTable('documents', {
      id,
      uploaded_by: fk('users'),
      achievement_id: fk('achievements', true),
      submission_id: fk('submissions', true),
      name: { type: DataTypes.STRING(180), allowNull: false },
      file_path: { type: DataTypes.STRING(500), allowNull: false },
      mime_type: { type: DataTypes.STRING(120), allowNull: false },
      size_bytes: { type: DataTypes.BIGINT, allowNull: false },
      ...timestamps
    });

    await queryInterface.createTable('notifications', {
      id,
      user_id: fk('users'),
      title: { type: DataTypes.STRING(180), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      channel: { type: DataTypes.ENUM('EMAIL', 'IN_APP'), allowNull: false, defaultValue: 'EMAIL' },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
        allowNull: false,
        defaultValue: 'pending'
      },
      read_at: { type: DataTypes.DATE, allowNull: true },
      ...timestamps
    });

    await queryInterface.createTable('audit_logs', {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      actor_id: fk('users', true),
      action: { type: DataTypes.STRING(100), allowNull: false },
      entity_type: { type: DataTypes.STRING(100), allowNull: false },
      entity_id: { type: DataTypes.STRING(64), allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
      ...timestamps
    });
  },

  async down(queryInterface) {
    const tables = [
      'audit_logs',
      'notifications',
      'documents',
      'achievement_skills',
      'skills',
      'certificates',
      'achievement_verifications',
      'achievements',
      'results',
      'submission_versions',
      'submissions',
      'mentor_assignments',
      'team_invitations',
      'team_members',
      'registrations',
      'teams',
      'competitions',
      'competition_categories',
      'students',
      'users'
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  }
};
