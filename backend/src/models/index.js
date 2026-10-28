const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const define = (name, tableName, attributes) =>
  sequelize.define(name, attributes, { tableName, underscored: true });

const cascade = (foreignKey, allowNull = false) => ({
  foreignKey: { name: foreignKey, allowNull },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

const User = define('User', 'users', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin_pka', 'mahasiswa', 'verifier', 'pimpinan', 'prodi'),
    allowNull: false,
    defaultValue: 'mahasiswa'
  },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true }
});

const Student = define('Student', 'students', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  studentNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  faculty: { type: DataTypes.STRING(120), allowNull: false },
  studyProgram: { type: DataTypes.STRING(120), allowNull: false },
  entryYear: { type: DataTypes.SMALLINT, allowNull: false },
  semester: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
});

const CompetitionCategory = define('CompetitionCategory', 'competition_categories', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true }
});

const Competition = define('Competition', 'competitions', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  level: {
    type: DataTypes.ENUM('Internal Kampus', 'Regional', 'Nasional', 'Internasional'),
    allowNull: false
  },
  organizer: { type: DataTypes.STRING(160), allowNull: false },
  location: { type: DataTypes.STRING(180), allowNull: true },
  registrationStart: { type: DataTypes.DATE, allowNull: false },
  registrationEnd: { type: DataTypes.DATE, allowNull: false },
  startAt: { type: DataTypes.DATE, allowNull: false },
  endAt: { type: DataTypes.DATE, allowNull: false },
  quota: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'draft'
  }
});

const Team = define('Team', 'teams', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  competitionId: { type: DataTypes.INTEGER, allowNull: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'draft'
  },
  approvedBy: { type: DataTypes.INTEGER, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true }
});

const Registration = define('Registration', 'registrations', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  competitionId: { type: DataTypes.INTEGER, allowNull: false },
  teamId: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'registered', 'confirmed', 'participating', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  registeredAt: { type: DataTypes.DATE, allowNull: true }
});

const TeamMember = define('TeamMember', 'team_members', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  teamId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM('leader', 'member'), allowNull: false, defaultValue: 'member' },
  status: { type: DataTypes.ENUM('active', 'left', 'removed'), allowNull: false, defaultValue: 'active' },
  joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
});

const TeamInvitation = define('TeamInvitation', 'team_invitations', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  teamId: { type: DataTypes.INTEGER, allowNull: false },
  invitedBy: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: false },
  token: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
    allowNull: false,
    defaultValue: 'pending'
  },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
});

const MentorAssignment = define('MentorAssignment', 'mentor_assignments', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  teamId: { type: DataTypes.INTEGER, allowNull: false },
  mentorId: { type: DataTypes.INTEGER, allowNull: false },
  assignedBy: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'ended'), allowNull: false, defaultValue: 'active' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
});

const Submission = define('Submission', 'submissions', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  registrationId: { type: DataTypes.INTEGER, allowNull: false },
  teamId: { type: DataTypes.INTEGER, allowNull: false },
  submittedBy: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'revision', 'final_submission', 'completed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  submittedAt: { type: DataTypes.DATE, allowNull: true },
  finalSubmittedAt: { type: DataTypes.DATE, allowNull: true }
});

const SubmissionVersion = define('SubmissionVersion', 'submission_versions', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  submissionId: { type: DataTypes.INTEGER, allowNull: false },
  submittedBy: { type: DataTypes.INTEGER, allowNull: false },
  versionNumber: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  filePath: { type: DataTypes.STRING(500), allowNull: true }
});

const Result = define('Result', 'results', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  competitionId: { type: DataTypes.INTEGER, allowNull: false },
  registrationId: { type: DataTypes.INTEGER, allowNull: false },
  teamId: { type: DataTypes.INTEGER, allowNull: true },
  rank: { type: DataTypes.INTEGER, allowNull: true },
  award: { type: DataTypes.STRING(120), allowNull: true },
  prizeAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
});

const Achievement = define('Achievement', 'achievements', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  competitionId: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  level: {
    type: DataTypes.ENUM('Lokal', 'Regional', 'Nasional', 'Internasional'),
    allowNull: false
  },
  organizer: { type: DataTypes.STRING(160), allowNull: false },
  occurredAt: { type: DataTypes.DATEONLY, allowNull: false },
  skkmPoints: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_verification', 'revision_required', 'verified', 'rejected'),
    allowNull: false,
    defaultValue: 'draft'
  },
  submittedAt: { type: DataTypes.DATE, allowNull: true }
});

const AchievementVerification = define('AchievementVerification', 'achievement_verifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  achievementId: { type: DataTypes.INTEGER, allowNull: false },
  verifierId: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('under_verification', 'revision_required', 'verified', 'rejected'),
    allowNull: false
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true }
});

const Certificate = define('Certificate', 'certificates', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  achievementId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  certificateNumber: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  filePath: { type: DataTypes.STRING(500), allowNull: false },
  issuedAt: { type: DataTypes.DATE, allowNull: true }
});

const Skill = define('Skill', 'skills', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true }
});

const AchievementSkill = define('AchievementSkill', 'achievement_skills', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  achievementId: { type: DataTypes.INTEGER, allowNull: false },
  skillId: { type: DataTypes.INTEGER, allowNull: false },
  proficiency: { type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'), allowNull: true }
});

const Document = define('Document', 'documents', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
  achievementId: { type: DataTypes.INTEGER, allowNull: true },
  submissionId: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  filePath: { type: DataTypes.STRING(500), allowNull: false },
  mimeType: { type: DataTypes.STRING(120), allowNull: false },
  sizeBytes: { type: DataTypes.BIGINT, allowNull: false }
});

const Notification = define('Notification', 'notifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  channel: { type: DataTypes.ENUM('EMAIL', 'IN_APP'), allowNull: false, defaultValue: 'EMAIL' },
  status: { type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'), allowNull: false, defaultValue: 'pending' },
  readAt: { type: DataTypes.DATE, allowNull: true }
});

const AuditLog = define('AuditLog', 'audit_logs', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  actorId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entityType: { type: DataTypes.STRING(100), allowNull: false },
  entityId: { type: DataTypes.STRING(64), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true }
});

User.hasOne(Student, cascade('userId'));
Student.belongsTo(User, cascade('userId'));

CompetitionCategory.hasMany(Competition, cascade('categoryId'));
Competition.belongsTo(CompetitionCategory, cascade('categoryId'));

Competition.hasMany(Registration, cascade('competitionId'));
Registration.belongsTo(Competition, cascade('competitionId'));
User.hasMany(Registration, cascade('userId'));
Registration.belongsTo(User, cascade('userId'));

Competition.hasMany(Team, cascade('competitionId'));
Team.belongsTo(Competition, cascade('competitionId'));
User.hasMany(Team, { ...cascade('createdBy'), as: 'createdTeams' });
Team.belongsTo(User, { ...cascade('createdBy'), as: 'creator' });
User.hasMany(Team, { ...cascade('approvedBy', true), as: 'approvedTeams' });
Team.belongsTo(User, { ...cascade('approvedBy', true), as: 'approver' });

Team.hasMany(Registration, cascade('teamId', true));
Registration.belongsTo(Team, cascade('teamId', true));
Team.belongsToMany(User, {
  through: TeamMember,
  as: 'members',
  foreignKey: 'teamId',
  otherKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.belongsToMany(Team, {
  through: TeamMember,
  as: 'teams',
  foreignKey: 'userId',
  otherKey: 'teamId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Team.hasMany(TeamMember, cascade('teamId'));
TeamMember.belongsTo(Team, cascade('teamId'));
User.hasMany(TeamMember, cascade('userId'));
TeamMember.belongsTo(User, cascade('userId'));

Team.hasMany(TeamInvitation, cascade('teamId'));
TeamInvitation.belongsTo(Team, cascade('teamId'));
User.hasMany(TeamInvitation, { ...cascade('invitedBy'), as: 'sentInvitations' });
TeamInvitation.belongsTo(User, { ...cascade('invitedBy'), as: 'inviter' });
User.hasMany(TeamInvitation, { ...cascade('userId', true), as: 'receivedInvitations' });
TeamInvitation.belongsTo(User, { ...cascade('userId', true), as: 'invitee' });

Team.hasMany(MentorAssignment, cascade('teamId'));
MentorAssignment.belongsTo(Team, cascade('teamId'));
User.hasMany(MentorAssignment, { ...cascade('mentorId'), as: 'mentorAssignments' });
MentorAssignment.belongsTo(User, { ...cascade('mentorId'), as: 'mentor' });
User.hasMany(MentorAssignment, { ...cascade('assignedBy'), as: 'createdMentorAssignments' });
MentorAssignment.belongsTo(User, { ...cascade('assignedBy'), as: 'assigner' });

Registration.hasMany(Submission, cascade('registrationId'));
Submission.belongsTo(Registration, cascade('registrationId'));
Team.hasMany(Submission, cascade('teamId'));
Submission.belongsTo(Team, cascade('teamId'));
User.hasMany(Submission, cascade('submittedBy'));
Submission.belongsTo(User, { ...cascade('submittedBy'), as: 'submitter' });
Submission.hasMany(SubmissionVersion, cascade('submissionId'));
SubmissionVersion.belongsTo(Submission, cascade('submissionId'));
User.hasMany(SubmissionVersion, cascade('submittedBy'));
SubmissionVersion.belongsTo(User, { ...cascade('submittedBy'), as: 'submitter' });

Competition.hasMany(Result, cascade('competitionId'));
Result.belongsTo(Competition, cascade('competitionId'));
Registration.hasMany(Result, cascade('registrationId'));
Result.belongsTo(Registration, cascade('registrationId'));
Team.hasMany(Result, cascade('teamId', true));
Result.belongsTo(Team, cascade('teamId', true));

User.hasMany(Achievement, cascade('userId'));
Achievement.belongsTo(User, cascade('userId'));
Competition.hasMany(Achievement, cascade('competitionId', true));
Achievement.belongsTo(Competition, cascade('competitionId', true));
Achievement.hasMany(AchievementVerification, cascade('achievementId'));
AchievementVerification.belongsTo(Achievement, cascade('achievementId'));
User.hasMany(AchievementVerification, cascade('verifierId'));
AchievementVerification.belongsTo(User, { ...cascade('verifierId'), as: 'verifier' });
Achievement.hasOne(Certificate, cascade('achievementId'));
Certificate.belongsTo(Achievement, cascade('achievementId'));
Achievement.belongsToMany(Skill, {
  through: AchievementSkill,
  as: 'skills',
  foreignKey: 'achievementId',
  otherKey: 'skillId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Skill.belongsToMany(Achievement, {
  through: AchievementSkill,
  as: 'achievements',
  foreignKey: 'skillId',
  otherKey: 'achievementId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Achievement.hasMany(AchievementSkill, cascade('achievementId'));
AchievementSkill.belongsTo(Achievement, cascade('achievementId'));
Skill.hasMany(AchievementSkill, cascade('skillId'));
AchievementSkill.belongsTo(Skill, cascade('skillId'));

User.hasMany(Document, cascade('uploadedBy'));
Document.belongsTo(User, { ...cascade('uploadedBy'), as: 'uploader' });
Achievement.hasMany(Document, cascade('achievementId', true));
Document.belongsTo(Achievement, cascade('achievementId', true));
Submission.hasMany(Document, cascade('submissionId', true));
Document.belongsTo(Submission, cascade('submissionId', true));

User.hasMany(Notification, cascade('userId'));
Notification.belongsTo(User, cascade('userId'));
User.hasMany(AuditLog, cascade('actorId', true));
AuditLog.belongsTo(User, { ...cascade('actorId', true), as: 'actor' });

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
  AuditLog
};
