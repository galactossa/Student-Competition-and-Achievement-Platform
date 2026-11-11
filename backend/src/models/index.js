const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const define = (name, tableName, attributes, options = {}) =>
  sequelize.define(name, attributes, { tableName, underscored: true, ...options });

const fk = (table, allowNull = false) => ({
  type: DataTypes.INTEGER,
  allowNull,
  references: { model: table, key: 'id' },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

const cascade = (foreignKey, allowNull = false) => ({
  foreignKey: { name: foreignKey, allowNull },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

const setNullForeignKey = (table) => ({
  type: DataTypes.INTEGER,
  allowNull: true,
  references: { model: table, key: 'id' },
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

const User = define('User', 'users', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin_pka', 'mahasiswa', 'verifier', 'pimpinan', 'prodi'),
    allowNull: false,
    defaultValue: 'mahasiswa'
  },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
});

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
const hashChangedPassword = async (user) => {
  if (user.password && user.changed('password') && !isBcryptHash(user.password)) {
    user.password = await bcrypt.hash(user.password, 10);
  }
};

User.addHook('beforeCreate', hashChangedPassword);
User.addHook('beforeUpdate', hashChangedPassword);
User.prototype.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const Student = define('Student', 'students', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { ...fk('users'), unique: true },
  nim: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  program_studi: { type: DataTypes.STRING(100), allowNull: false },
  angkatan: { type: DataTypes.INTEGER, allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  photo_url: { type: DataTypes.STRING(255), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  slug: { type: DataTypes.STRING(100), allowNull: true, unique: true }
});

const CompetitionCategory = define('CompetitionCategory', 'competition_categories', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true }
});

const Competition = define('Competition', 'competitions', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
  organizer: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT('long'), allowNull: true },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'competition_categories', key: 'id' },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  },
  level: {
    type: DataTypes.ENUM('Internal Kampus', 'Regional', 'Nasional', 'Internasional'),
    allowNull: false
  },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  end_date: { type: DataTypes.DATEONLY, allowNull: true },
  registration_deadline: { type: DataTypes.DATE, allowNull: true },
  submission_deadline: { type: DataTypes.DATE, allowNull: true },
  result_date: { type: DataTypes.DATEONLY, allowNull: true },
  location: { type: DataTypes.STRING(200), allowNull: true },
  mode: {
    type: DataTypes.ENUM('online', 'offline', 'hybrid'),
    allowNull: false,
    defaultValue: 'online'
  },
  registration_url: { type: DataTypes.STRING(255), allowNull: true },
  prize: { type: DataTypes.TEXT, allowNull: true },
  requirements: { type: DataTypes.TEXT, allowNull: true },
  poster_url: { type: DataTypes.STRING(255), allowNull: true },
  guidebook_url: { type: DataTypes.STRING(255), allowNull: true },
  contact_person: { type: DataTypes.STRING(100), allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'submission',
      'competition',
      'result_announced',
      'completed'
    ),
    allowNull: false,
    defaultValue: 'draft'
  },
  created_by: setNullForeignKey('users')
}, {
  indexes: [
    { fields: ['level'], name: 'competitions_level_idx' },
    { fields: ['category_id'], name: 'competitions_category_id_idx' },
    { fields: ['registration_deadline'], name: 'competitions_registration_deadline_idx' },
    { fields: ['status'], name: 'competitions_status_idx' }
  ]
});

const Team = define('Team', 'teams', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  competition_id: fk('competitions'),
  leader_id: fk('users'),
  name: { type: DataTypes.STRING(150), allowNull: false },
  team_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'draft'
  },
  approved_by: setNullForeignKey('users'),
  approved_at: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
});

const Registration = define('Registration', 'registrations', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  competition_id: fk('competitions'),
  user_id: fk('users'),
  participation_type: {
    type: DataTypes.ENUM('individual', 'team'),
    allowNull: false
  },
  team_id: setNullForeignKey('teams'),
  supporting_document_url: { type: DataTypes.STRING(255), allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'registered', 'confirmed', 'participating', 'completed'),
    allowNull: false,
    defaultValue: 'registered'
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  registered_at: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { unique: true, fields: ['competition_id', 'user_id'], name: 'registrations_competition_user_unique' }
  ]
});

const TeamMember = define('TeamMember', 'team_members', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: fk('teams'),
  user_id: fk('users'),
  role: { type: DataTypes.ENUM('leader', 'member'), allowNull: false, defaultValue: 'member' },
  joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('active', 'left', 'removed'), allowNull: false, defaultValue: 'active' }
}, {
  indexes: [
    { unique: true, fields: ['team_id', 'user_id'], name: 'team_members_team_user_unique' }
  ]
});

const TeamInvitation = define('TeamInvitation', 'team_invitations', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: fk('teams'),
  inviter_id: fk('users'),
  invitee_id: { ...fk('users', true) },
  invitee_email: { type: DataTypes.STRING(150), allowNull: true },
  token: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
    allowNull: false,
    defaultValue: 'pending'
  },
  expired_at: { type: DataTypes.DATE, allowNull: false },
  responded_at: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { unique: true, fields: ['team_id', 'invitee_id'], name: 'team_invitations_team_invitee_unique' }
  ]
});

const MentorAssignment = define('MentorAssignment', 'mentor_assignments', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: fk('teams'),
  mentor_id: fk('users'),
  assigned_by: setNullForeignKey('users'),
  notes: { type: DataTypes.TEXT, allowNull: true },
  assigned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  indexes: [
    { unique: true, fields: ['team_id'], name: 'mentor_assignments_team_unique' }
  ]
});

const MentorNote = define('MentorNote', 'mentor_notes', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  mentor_assignment_id: fk('mentor_assignments'),
  content: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('comment', 'progress', 'evaluation'),
    allowNull: false,
    defaultValue: 'comment'
  }
});

const Submission = define('Submission', 'submissions', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: { ...fk('teams', true) },
  user_id: { ...fk('users', true) },
  competition_id: fk('competitions'),
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'revision', 'final_submission', 'completed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  current_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, {
  validate: {
    teamOrUserPresent() {
      if (!this.team_id && !this.user_id) {
        throw new Error('Submission must belong to a team or a user');
      }
    }
  }
});

const SubmissionVersion = define('SubmissionVersion', 'submission_versions', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  submission_id: fk('submissions'),
  version: { type: DataTypes.INTEGER, allowNull: false },
  file_url: { type: DataTypes.STRING(255), allowNull: true },
  repository_url: { type: DataTypes.STRING(255), allowNull: true },
  demo_url: { type: DataTypes.STRING(255), allowNull: true },
  video_url: { type: DataTypes.STRING(255), allowNull: true },
  presentation_url: { type: DataTypes.STRING(255), allowNull: true },
  supporting_document_url: { type: DataTypes.STRING(255), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  uploaded_by: setNullForeignKey('users')
}, {
  indexes: [
    { unique: true, fields: ['submission_id', 'version'], name: 'submission_versions_submission_version_unique' }
  ]
});

const Result = define('Result', 'results', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  competition_id: fk('competitions'),
  team_id: fk('teams', true),
  user_id: fk('users', true),
  result_type: {
    type: DataTypes.ENUM('participation', 'finalist', 'winner'),
    allowNull: false
  },
  position: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(150), allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true }
});

const Achievement = define('Achievement', 'achievements', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  result_id: fk('results'),
  user_id: fk('users'),
  competition_id: fk('competitions'),
  level: {
    type: DataTypes.ENUM('Lokal', 'Regional', 'Nasional', 'Internasional'),
    allowNull: false
  },
  organizer: { type: DataTypes.STRING(150), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  certificate_url: { type: DataTypes.STRING(255), allowNull: true },
  evidence_url: { type: DataTypes.STRING(255), allowNull: true },
  skkm_points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_verification', 'revision_required', 'verified', 'rejected'),
    allowNull: false,
    defaultValue: 'draft'
  },
  submitted_at: { type: DataTypes.DATE, allowNull: true },
  verified_at: { type: DataTypes.DATE, allowNull: true }
});

const AchievementVerification = define('AchievementVerification', 'achievement_verifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  achievement_id: fk('achievements'),
  verifier_id: setNullForeignKey('users'),
  action: {
    type: DataTypes.ENUM('approve', 'revision', 'reject'),
    allowNull: false
  },
  notes: { type: DataTypes.TEXT, allowNull: true }
});

const Certificate = define('Certificate', 'certificates', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  achievement_id: { ...fk('achievements'), unique: true },
  certificate_number: { type: DataTypes.STRING(80), allowNull: true, unique: true },
  file_url: { type: DataTypes.STRING(255), allowNull: false },
  issued_at: { type: DataTypes.DATEONLY, allowNull: true }
});

const Skill = define('Skill', 'skills', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  category: { type: DataTypes.STRING(50), allowNull: true }
});

const AchievementSkill = define('AchievementSkill', 'achievement_skills', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  achievement_id: fk('achievements'),
  skill_id: fk('skills')
}, {
  indexes: [
    { unique: true, fields: ['achievement_id', 'skill_id'], name: 'achievement_skills_achievement_skill_unique' }
  ]
});

const Document = define('Document', 'documents', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  documentable_type: { type: DataTypes.STRING(100), allowNull: false },
  documentable_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  file_name: { type: DataTypes.STRING(200), allowNull: false },
  file_path: { type: DataTypes.STRING(255), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: false },
  size: { type: DataTypes.BIGINT, allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  uploaded_by: setNullForeignKey('users')
}, {
  indexes: [
    { fields: ['documentable_type', 'documentable_id'], name: 'documents_documentable_idx' }
  ]
});

const Notification = define('Notification', 'notifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: fk('users'),
  type: { type: DataTypes.STRING(80), allowNull: false },
  title: { type: DataTypes.STRING(150), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: true },
  read_at: { type: DataTypes.DATE, allowNull: true }
}, {
  indexes: [
    { fields: ['user_id', 'read_at'], name: 'notifications_user_read_at_idx' }
  ]
});

const AuditLog = define('AuditLog', 'audit_logs', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  user_id: setNullForeignKey('users'),
  action: { type: DataTypes.STRING(80), allowNull: false },
  model_type: { type: DataTypes.STRING(100), allowNull: true },
  model_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  old_values: { type: DataTypes.JSON, allowNull: true },
  new_values: { type: DataTypes.JSON, allowNull: true },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.STRING(255), allowNull: true }
}, {
  indexes: [
    { fields: ['model_type', 'model_id'], name: 'audit_logs_model_idx' },
    { fields: ['user_id'], name: 'audit_logs_user_id_idx' },
    { fields: ['created_at'], name: 'audit_logs_created_at_idx' }
  ]
});

const UserCalendarEvent = define('UserCalendarEvent', 'user_calendar_events', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: fk('users'),
  competition_id: fk('competitions'),
  event_type: {
    type: DataTypes.ENUM('registration', 'submission', 'result', 'custom'),
    allowNull: false
  },
  title: { type: DataTypes.STRING(150), allowNull: false },
  event_date: { type: DataTypes.DATE, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'competition_id', 'event_type'],
      name: 'user_calendar_events_user_competition_type_unique'
    }
  ]
});

User.hasOne(Student, {
  foreignKey: 'user_id',
  as: 'student',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Student.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

CompetitionCategory.hasMany(Competition, {
  foreignKey: 'category_id',
  as: 'competitions',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Competition.belongsTo(CompetitionCategory, {
  foreignKey: 'category_id',
  as: 'category',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
User.hasMany(Competition, {
  foreignKey: 'created_by',
  as: 'created_competitions',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Competition.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Competition.hasMany(Registration, {
  foreignKey: 'competition_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Registration.belongsTo(Competition, {
  foreignKey: 'competition_id',
  as: 'competition',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(Registration, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Registration.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Competition.hasMany(Team, {
  foreignKey: 'competition_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Team.belongsTo(Competition, {
  foreignKey: 'competition_id',
  as: 'competition',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(Team, { ...cascade('leader_id'), as: 'ledTeams' });
Team.belongsTo(User, {
  foreignKey: 'leader_id',
  as: 'leader',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(Team, { ...cascade('approved_by', true), as: 'approvedTeams' });
Team.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Team.hasMany(Registration, {
  foreignKey: 'team_id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Registration.belongsTo(Team, {
  foreignKey: 'team_id',
  as: 'team',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Team.belongsToMany(User, {
  through: TeamMember,
  as: 'members',
  foreignKey: 'team_id',
  otherKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.belongsToMany(Team, {
  through: TeamMember,
  as: 'teams',
  foreignKey: 'user_id',
  otherKey: 'team_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Team.hasMany(TeamMember, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(TeamMember, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
TeamMember.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Team.hasMany(TeamInvitation, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
TeamInvitation.belongsTo(Team, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(TeamInvitation, { ...cascade('inviter_id'), as: 'sentInvitations' });
TeamInvitation.belongsTo(User, {
  foreignKey: 'inviter_id',
  as: 'inviter',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(TeamInvitation, { ...cascade('invitee_id', true), as: 'receivedInvitations' });
TeamInvitation.belongsTo(User, {
  foreignKey: 'invitee_id',
  as: 'invitee',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Team.hasMany(MentorAssignment, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
MentorAssignment.belongsTo(Team, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(MentorAssignment, { ...cascade('mentor_id'), as: 'mentorAssignments' });
MentorAssignment.belongsTo(User, {
  foreignKey: 'mentor_id',
  as: 'mentor',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(MentorAssignment, { ...cascade('assigned_by', true), as: 'createdMentorAssignments' });
MentorAssignment.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assigner',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
MentorAssignment.hasMany(MentorNote, {
  foreignKey: 'mentor_assignment_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
MentorNote.belongsTo(MentorAssignment, {
  foreignKey: 'mentor_assignment_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Team.hasMany(Submission, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Submission.belongsTo(Team, { foreignKey: 'team_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(Submission, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Submission.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Competition.hasMany(Submission, {
  foreignKey: 'competition_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Submission.belongsTo(Competition, {
  foreignKey: 'competition_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Submission.hasMany(SubmissionVersion, {
  foreignKey: 'submission_id',
  as: 'versions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
SubmissionVersion.belongsTo(Submission, {
  foreignKey: 'submission_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(SubmissionVersion, { ...cascade('uploaded_by', true), as: 'uploadedSubmissionVersions' });
SubmissionVersion.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Competition.hasMany(Result, cascade('competition_id'));
Result.belongsTo(Competition, { ...cascade('competition_id'), as: 'competition' });
Team.hasMany(Result, { ...cascade('team_id', true), as: 'results' });
Result.belongsTo(Team, { ...cascade('team_id', true), as: 'team' });
User.hasMany(Result, { ...cascade('user_id', true), as: 'results' });
Result.belongsTo(User, { ...cascade('user_id', true), as: 'user' });

Result.hasMany(Achievement, cascade('result_id'));
Achievement.belongsTo(Result, { ...cascade('result_id'), as: 'result' });
User.hasMany(Achievement, { ...cascade('user_id'), as: 'achievements' });
Achievement.belongsTo(User, { ...cascade('user_id'), as: 'user' });
Competition.hasMany(Achievement, cascade('competition_id'));
Achievement.belongsTo(Competition, { ...cascade('competition_id'), as: 'competition' });
Achievement.hasMany(AchievementVerification, {
  ...cascade('achievement_id'),
  as: 'verifications'
});
AchievementVerification.belongsTo(Achievement, {
  ...cascade('achievement_id'),
  as: 'achievement'
});
User.hasMany(AchievementVerification, { ...cascade('verifier_id', true), as: 'verifications' });
AchievementVerification.belongsTo(User, {
  ...cascade('verifier_id', true),
  as: 'verifier',
  onDelete: 'SET NULL'
});
Achievement.hasOne(Certificate, { ...cascade('achievement_id'), as: 'certificate' });
Certificate.belongsTo(Achievement, { ...cascade('achievement_id'), as: 'achievement' });
Achievement.belongsToMany(Skill, {
  through: AchievementSkill,
  as: 'skills',
  foreignKey: 'achievement_id',
  otherKey: 'skill_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Skill.belongsToMany(Achievement, {
  through: AchievementSkill,
  as: 'achievements',
  foreignKey: 'skill_id',
  otherKey: 'achievement_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Achievement.hasMany(AchievementSkill, cascade('achievement_id'));
AchievementSkill.belongsTo(Achievement, cascade('achievement_id'));
Skill.hasMany(AchievementSkill, cascade('skill_id'));
AchievementSkill.belongsTo(Skill, cascade('skill_id'));

User.hasMany(Document, { ...cascade('uploaded_by', true), as: 'uploadedDocuments' });
Document.belongsTo(User, {
  ...cascade('uploaded_by', true),
  as: 'uploader',
  onDelete: 'SET NULL'
});

User.hasMany(Notification, cascade('user_id'));
Notification.belongsTo(User, { ...cascade('user_id'), as: 'user' });
User.hasMany(AuditLog, { ...cascade('user_id', true), as: 'auditLogs' });
AuditLog.belongsTo(User, {
  ...cascade('user_id', true),
  as: 'user',
  onDelete: 'SET NULL'
});
User.hasMany(UserCalendarEvent, { ...cascade('user_id'), as: 'calendarEvents' });
UserCalendarEvent.belongsTo(User, { ...cascade('user_id'), as: 'user' });
Competition.hasMany(UserCalendarEvent, { ...cascade('competition_id'), as: 'calendarEvents' });
UserCalendarEvent.belongsTo(Competition, {
  ...cascade('competition_id'),
  as: 'competition'
});

module.exports = {
  sequelize,
  User,
  Student,
  Competition,
  CompetitionCategory,
  Registration,
  Team,
  TeamMember,
  TeamInvitation,
  MentorAssignment,
  MentorNote,
  Submission,
  SubmissionVersion,
  Result,
  Achievement,
  AchievementVerification,
  Certificate,
  Skill,
  AchievementSkill,
  Document,
  Notification,
  AuditLog,
  UserCalendarEvent
};
