const models = require('../src/models');

describe('MVP Sequelize models', () => {
  test('exports all 20 MVP models', () => {
    const modelNames = Object.keys(models).filter((name) => name !== 'sequelize');

    expect(modelNames).toHaveLength(20);
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
        'AuditLog'
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
});
