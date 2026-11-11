const models = require('../src/models');

describe('MVP Sequelize models', () => {
  test('exports all 22 MVP models', () => {
    const modelNames = Object.keys(models).filter((name) => name !== 'sequelize');

    expect(modelNames).toHaveLength(22);
    expect(modelNames).toEqual(
      expect.arrayContaining([
        'User',
        'Student',
        'Competition',
        'CompetitionCategory',
        'Registration',
        'Team',
        'TeamMember',
        'TeamInvitation',
        'MentorAssignment',
        'MentorNote',
        'Submission',
        'SubmissionVersion',
        'Result',
        'Achievement',
        'AchievementVerification',
        'Certificate',
        'Skill',
        'AchievementSkill',
        'Document',
        'Notification',
        'AuditLog',
        'UserCalendarEvent'
      ])
    );
  });

  test('models user role and student/team/achievement relationships', () => {
    expect(models.User.rawAttributes.role.values).toEqual([
      'super_admin',
      'admin_pka',
      'mahasiswa',
      'verifier',
      'pimpinan',
      'prodi'
    ]);
    expect(models.User.rawAttributes.isActive.allowNull).toBe(false);
    expect(models.Team.associations.members.associationType).toBe('BelongsToMany');
    expect(models.Achievement.associations.skills.associationType).toBe('BelongsToMany');
  });

  test('foundation models expose the requested fields and student aliases', () => {
    expect(models.User.rawAttributes.name.type.options.length).toBe(100);
    expect(models.User.rawAttributes.email.type.options.length).toBe(150);
    expect(models.User.rawAttributes.password).toBeDefined();
    expect(models.Student.rawAttributes.nim.type.options.length).toBe(20);
    expect(models.Student.rawAttributes.program_studi.type.options.length).toBe(100);
    expect(models.Student.rawAttributes.angkatan.type.key).toBe('INTEGER');
    expect(models.Student.rawAttributes.is_public.defaultValue).toBe(false);
    expect(models.Skill.rawAttributes.name.type.options.length).toBe(80);
    expect(models.Skill.rawAttributes.category.type.options.length).toBe(50);
    expect(models.User.associations.student.foreignKey).toBe('user_id');
    expect(models.Student.associations.user.foreignKey).toBe('user_id');
  });

  test('competition models expose requested schema and association aliases', () => {
    expect(models.CompetitionCategory.rawAttributes.name.type.options.length).toBe(80);
    expect(models.Competition.rawAttributes.name.type.options.length).toBe(200);
    expect(models.Competition.rawAttributes.slug.type.options.length).toBe(220);
    expect(models.Competition.rawAttributes.description.type.options.length).toBe('long');
    expect(models.Competition.rawAttributes.mode.values).toEqual(['online', 'offline', 'hybrid']);
    expect(models.Competition.rawAttributes.status.values).toEqual([
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'submission',
      'competition',
      'result_announced',
      'completed'
    ]);
    expect(models.Competition.rawAttributes.category_id.onDelete).toBe('RESTRICT');
    expect(models.Competition.rawAttributes.created_by.onDelete).toBe('SET NULL');
    expect(models.Competition.rawAttributes.price.defaultValue).toBe(0);
    expect(models.Competition.rawAttributes.status.defaultValue).toBe('draft');
    expect(models.Competition.rawAttributes.mode.defaultValue).toBe('online');
    expect(models.Competition.options.indexes.map((index) => index.fields[0])).toEqual(
      expect.arrayContaining(['level', 'category_id', 'registration_deadline', 'status'])
    );
    expect(models.CompetitionCategory.associations.competitions.foreignKey).toBe('category_id');
    expect(models.Competition.associations.category.foreignKey).toBe('category_id');
    expect(models.User.associations.created_competitions.foreignKey).toBe('created_by');
    expect(models.Competition.associations.creator.foreignKey).toBe('created_by');
  });

  test('registration and team models expose requested fields and associations', () => {
    expect(models.Team.rawAttributes.team_code.type.options.length).toBe(50);
    expect(models.Team.rawAttributes.status.values).toEqual([
      'draft',
      'pending_approval',
      'approved',
      'rejected'
    ]);
    expect(models.Team.rawAttributes.leader_id.onDelete).toBe('CASCADE');
    expect(models.Team.rawAttributes.approved_by.onDelete).toBe('SET NULL');
    expect(models.Registration.rawAttributes.participation_type.values).toEqual([
      'individual',
      'team'
    ]);
    expect(models.Registration.rawAttributes.status.defaultValue).toBe('registered');
    expect(models.Registration.rawAttributes.team_id.onDelete).toBe('SET NULL');
    expect(models.TeamMember.rawAttributes.joined_at.allowNull).toBe(false);
    expect(models.TeamInvitation.rawAttributes.status.values).toEqual([
      'pending',
      'accepted',
      'rejected',
      'expired'
    ]);
    expect(models.TeamInvitation.rawAttributes.invitee_id.allowNull).toBe(true);
    expect(models.Team.associations.competition.as).toBe('competition');
    expect(models.Team.associations.leader.foreignKey).toBe('leader_id');
    expect(models.Team.associations.members.associationType).toBe('BelongsToMany');
    expect(models.Registration.associations.competition).toBeDefined();
    expect(models.Registration.associations.user).toBeDefined();
    expect(models.Registration.associations.team).toBeDefined();
    expect(models.TeamInvitation.associations.inviter.foreignKey).toBe('inviter_id');
    expect(models.TeamInvitation.associations.invitee.foreignKey).toBe('invitee_id');
  });

  test('mentor and submission models expose requested fields and associations', () => {
    expect(models.MentorAssignment.rawAttributes.assigned_by.allowNull).toBe(true);
    expect(models.MentorAssignment.rawAttributes.assigned_by.onDelete).toBe('SET NULL');
    expect(models.MentorAssignment.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ unique: true, fields: ['team_id'] })
      ])
    );
    expect(models.MentorNote.rawAttributes.type.values).toEqual([
      'comment',
      'progress',
      'evaluation'
    ]);
    expect(models.Submission.rawAttributes.current_version.defaultValue).toBe(1);
    expect(models.Submission.rawAttributes.team_id.allowNull).toBe(true);
    expect(models.Submission.rawAttributes.user_id.allowNull).toBe(true);
    expect(models.Submission.associations.versions.foreignKey).toBe('submission_id');
    expect(models.SubmissionVersion.rawAttributes.version.allowNull).toBe(false);
    expect(models.SubmissionVersion.rawAttributes.uploaded_by.onDelete).toBe('SET NULL');
    expect(models.SubmissionVersion.associations.uploader.foreignKey).toBe('uploaded_by');
    expect(models.MentorAssignment.associations.mentor.foreignKey).toBe('mentor_id');
    expect(models.MentorAssignment.associations.assigner.foreignKey).toBe('assigned_by');
    expect(models.MentorNote.associations.MentorAssignment).toBeDefined();
  });

  test('result and achievement models expose the core achievement schema', () => {
    expect(models.Result.rawAttributes.result_type.values).toEqual([
      'participation',
      'finalist',
      'winner'
    ]);
    expect(models.Result.rawAttributes.team_id.allowNull).toBe(true);
    expect(models.Result.rawAttributes.user_id.allowNull).toBe(true);
    expect(models.Result.rawAttributes.date.allowNull).toBe(false);
    expect(models.Achievement.rawAttributes.result_id.allowNull).toBe(false);
    expect(models.Achievement.rawAttributes.organizer.type.options.length).toBe(150);
    expect(models.Achievement.rawAttributes.skkm_points.type.key).toBe('INTEGER');
    expect(models.Achievement.rawAttributes.verified_at).toBeDefined();
    expect(models.AchievementVerification.rawAttributes.action.values).toEqual([
      'approve',
      'revision',
      'reject'
    ]);
    expect(models.AchievementVerification.rawAttributes.verifier_id.onDelete).toBe('SET NULL');
    expect(models.Certificate.rawAttributes.certificate_number.type.options.length).toBe(80);
    expect(models.Certificate.rawAttributes.file_url.type.options.length).toBe(255);
    expect(models.AchievementSkill.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unique: true,
          fields: ['achievement_id', 'skill_id']
        })
      ])
    );
    expect(models.Result.associations.competition.foreignKey).toBe('competition_id');
    expect(models.Result.associations.team.foreignKey).toBe('team_id');
    expect(models.Result.associations.user.foreignKey).toBe('user_id');
    expect(models.Achievement.associations.result.foreignKey).toBe('result_id');
    expect(models.Achievement.associations.verifications.as).toBe('verifications');
    expect(models.Achievement.associations.skills.associationType).toBe('BelongsToMany');
    expect(models.Achievement.associations.certificate.associationType).toBe('HasOne');
    expect(models.User.associations.achievements.foreignKey).toBe('user_id');
    expect(models.AchievementVerification.associations.verifier.foreignKey).toBe('verifier_id');
  });

  test('supporting models expose polymorphic documents, notifications, audit logs, and calendar events', () => {
    expect(models.Document.rawAttributes.documentable_type.type.options.length).toBe(100);
    expect(models.Document.rawAttributes.documentable_id.type.toSql()).toBe('BIGINT UNSIGNED');
    expect(models.Document.rawAttributes.file_name.type.options.length).toBe(200);
    expect(models.Document.rawAttributes.version.defaultValue).toBe(1);
    expect(models.Document.rawAttributes.uploaded_by.allowNull).toBe(true);
    expect(models.Document.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: ['documentable_type', 'documentable_id'] })
      ])
    );
    expect(models.Notification.rawAttributes.type.type.options.length).toBe(80);
    expect(models.Notification.rawAttributes.data.type.key).toBe('JSON');
    expect(models.Notification.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: ['user_id', 'read_at'] })
      ])
    );
    expect(models.AuditLog.rawAttributes.user_id.onDelete).toBe('SET NULL');
    expect(models.AuditLog.rawAttributes.model_id.type.toSql()).toBe('BIGINT UNSIGNED');
    expect(models.AuditLog.rawAttributes.old_values.type.key).toBe('JSON');
    expect(models.AuditLog.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: ['model_type', 'model_id'] }),
        expect.objectContaining({ fields: ['user_id'] }),
        expect.objectContaining({ fields: ['created_at'] })
      ])
    );
    expect(models.UserCalendarEvent.rawAttributes.event_type.values).toEqual([
      'registration',
      'submission',
      'result',
      'custom'
    ]);
    expect(models.UserCalendarEvent.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unique: true,
          fields: ['user_id', 'competition_id', 'event_type']
        })
      ])
    );
    expect(models.Document.associations.uploader.foreignKey).toBe('uploaded_by');
    expect(models.Notification.associations.user.foreignKey).toBe('user_id');
    expect(models.AuditLog.associations.user.foreignKey).toBe('user_id');
    expect(models.UserCalendarEvent.associations.user.foreignKey).toBe('user_id');
    expect(models.UserCalendarEvent.associations.competition.foreignKey).toBe('competition_id');
  });

  test('every model foreign key declares references and update/delete actions', () => {
    const foreignKeys = Object.values(models)
      .filter((model) => model && model.rawAttributes)
      .flatMap((model) =>
        Object.values(model.rawAttributes).filter((attribute) => attribute.references)
      );

    expect(foreignKeys).toHaveLength(39);
    foreignKeys.forEach((attribute) => {
      expect(attribute.references.key).toBe('id');
      expect(attribute.onUpdate).toBe('CASCADE');
      expect(['CASCADE', 'RESTRICT', 'SET NULL']).toContain(attribute.onDelete);
    });
  });
});
