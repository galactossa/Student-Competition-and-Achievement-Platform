'use strict';

const submissionStatuses = [
  'draft',
  'submitted',
  'under_review',
  'revision',
  'final_submission',
  'completed'
];

async function removeForeignKeys(queryInterface, table, column) {
  const [constraints] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = '${table}'
       AND COLUMN_NAME = '${column}'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
  );
  for (const { CONSTRAINT_NAME: name } of constraints) {
    await queryInterface.removeConstraint(table, name);
  }
}

async function addForeignKey(queryInterface, table, column, referencedTable, onDelete, name) {
  await queryInterface.addConstraint(table, {
    fields: [column],
    type: 'foreign key',
    name,
    references: { table: referencedTable, field: 'id' },
    onDelete,
    onUpdate: 'CASCADE'
  });
}

async function ensureUniqueIndex(queryInterface, table, fields, name) {
  const indexes = await queryInterface.showIndex(table);
  const matching = indexes.filter(
    (index) =>
      index.unique &&
      index.fields.length === fields.length &&
      fields.every((field, position) => index.fields[position].attribute === field)
  );
  if (matching.length === 0) {
    await queryInterface.addIndex(table, fields, { name, unique: true });
    return;
  }
  for (const index of matching.slice(1)) {
    await queryInterface.removeIndex(table, index.name);
  }
}

async function ensureSingleColumnIndex(queryInterface, table, field, name) {
  const indexes = await queryInterface.showIndex(table);
  if (!indexes.some((index) => index.fields.length === 1 && index.fields[0].attribute === field)) {
    await queryInterface.addIndex(table, [field], { name });
  }
}

async function ensureNonUniqueSingleColumnIndex(queryInterface, table, field, name) {
  const indexes = await queryInterface.showIndex(table);
  if (
    !indexes.some(
      (index) =>
        !index.unique &&
        index.fields.length === 1 &&
        index.fields[0].attribute === field
    )
  ) {
    await queryInterface.addIndex(table, [field], { name });
  }
}

async function removeUniqueIndex(queryInterface, table, fields) {
  const indexes = await queryInterface.showIndex(table);
  const matching = indexes.find(
    (index) =>
      index.unique &&
      index.fields.length === fields.length &&
      fields.every((field, position) => index.fields[position].attribute === field)
  );
  if (matching) {
    await queryInterface.removeIndex(table, matching.name);
  }
}

async function addColumnIfMissing(queryInterface, table, column, definition) {
  const columns = await queryInterface.describeTable(table);
  if (!columns[column]) {
    await queryInterface.addColumn(table, column, definition);
  }
}

async function removeColumnIfPresent(queryInterface, table, column) {
  const columns = await queryInterface.describeTable(table);
  if (columns[column]) {
    await queryInterface.removeColumn(table, column);
  }
}

async function renameColumnIfNeeded(queryInterface, table, oldName, newName) {
  const columns = await queryInterface.describeTable(table);
  if (columns[oldName] && !columns[newName]) {
    await queryInterface.renameColumn(table, oldName, newName);
  }
}

async function removeCheckIfPresent(queryInterface, table, name) {
  const [constraints] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = '${table}'
       AND CONSTRAINT_NAME = '${name}'
       AND CONSTRAINT_TYPE = 'CHECK'`
  );
  if (constraints.length > 0) {
    await queryInterface.sequelize.query(
      `ALTER TABLE \`${table}\` DROP CHECK \`${name}\``
    );
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await removeForeignKeys(queryInterface, 'mentor_assignments', 'assigned_by');
    await queryInterface.changeColumn('mentor_assignments', 'assigned_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addForeignKey(queryInterface, 'mentor_assignments', 'assigned_by', 'users', 'SET NULL', 'mentor_assignments_assigned_by_fkey');
    await ensureUniqueIndex(queryInterface, 'mentor_assignments', ['team_id'], 'mentor_assignments_team_unique');
    await removeColumnIfPresent(queryInterface, 'mentor_assignments', 'status');

    const tables = await queryInterface.showAllTables();
    if (!tables.includes('mentor_notes')) {
      await queryInterface.createTable('mentor_notes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        mentor_assignment_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'mentor_assignments', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        content: { type: DataTypes.TEXT, allowNull: false },
        type: {
          type: DataTypes.ENUM('comment', 'progress', 'evaluation'),
          allowNull: false,
          defaultValue: 'comment'
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    await addColumnIfMissing(queryInterface, 'submissions', 'user_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submissions', 'competition_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submissions', 'current_version', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    const submissionColumns = await queryInterface.describeTable('submissions');
    if (submissionColumns.registration_id) {
      await queryInterface.sequelize.query(
        `UPDATE submissions s
         JOIN registrations r ON r.id = s.registration_id
         SET s.competition_id = r.competition_id,
             s.user_id = IF(s.team_id IS NULL, r.user_id, NULL)
         WHERE s.competition_id IS NULL`
      );
    }
    await removeForeignKeys(queryInterface, 'submissions', 'team_id');
    await removeForeignKeys(queryInterface, 'submissions', 'user_id');
    await removeForeignKeys(queryInterface, 'submissions', 'competition_id');
    await removeForeignKeys(queryInterface, 'submissions', 'submitted_by');
    await removeForeignKeys(queryInterface, 'submissions', 'registration_id');
    await queryInterface.changeColumn('submissions', 'team_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.changeColumn('submissions', 'competition_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'submissions', 'team_id', 'teams', 'CASCADE', 'submissions_team_id_fkey');
    await addForeignKey(queryInterface, 'submissions', 'user_id', 'users', 'CASCADE', 'submissions_user_id_fkey');
    await addForeignKey(queryInterface, 'submissions', 'competition_id', 'competitions', 'CASCADE', 'submissions_competition_id_fkey');
    await queryInterface.changeColumn('submissions', 'title', {
      type: DataTypes.STRING(200),
      allowNull: false
    });
    await ensureSingleColumnIndex(queryInterface, 'submissions', 'team_id', 'submissions_team_id_idx');
    await ensureSingleColumnIndex(queryInterface, 'submissions', 'user_id', 'submissions_user_id_idx');
    await ensureSingleColumnIndex(queryInterface, 'submissions', 'competition_id', 'submissions_competition_id_idx');
    await removeColumnIfPresent(queryInterface, 'submissions', 'registration_id');
    await removeColumnIfPresent(queryInterface, 'submissions', 'submitted_by');

    await renameColumnIfNeeded(queryInterface, 'submission_versions', 'version_number', 'version');
    await renameColumnIfNeeded(queryInterface, 'submission_versions', 'file_path', 'file_url');
    await renameColumnIfNeeded(queryInterface, 'submission_versions', 'submitted_by', 'uploaded_by');
    await addColumnIfMissing(queryInterface, 'submission_versions', 'repository_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submission_versions', 'demo_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submission_versions', 'video_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submission_versions', 'presentation_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submission_versions', 'supporting_document_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'submission_versions', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    const versionColumns = await queryInterface.describeTable('submission_versions');
    if (versionColumns.title && versionColumns.description) {
      await queryInterface.sequelize.query(
        "UPDATE submission_versions SET notes = CONCAT_WS('\\n', title, description) WHERE notes IS NULL AND (description IS NOT NULL OR title IS NOT NULL)"
      );
    }
    await removeForeignKeys(queryInterface, 'submission_versions', 'uploaded_by');
    await queryInterface.changeColumn('submission_versions', 'uploaded_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addForeignKey(queryInterface, 'submission_versions', 'uploaded_by', 'users', 'SET NULL', 'submission_versions_uploaded_by_fkey');
    await removeColumnIfPresent(queryInterface, 'submission_versions', 'title');
    await removeColumnIfPresent(queryInterface, 'submission_versions', 'description');
    await queryInterface.changeColumn('submission_versions', 'file_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await ensureUniqueIndex(
      queryInterface,
      'submission_versions',
      ['submission_id', 'version'],
      'submission_versions_submission_version_unique'
    );
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await ensureNonUniqueSingleColumnIndex(
      queryInterface,
      'submission_versions',
      'submission_id',
      'submission_versions_submission_id_idx'
    );
    await removeUniqueIndex(queryInterface, 'submission_versions', ['submission_id', 'version']);
    await queryInterface.addColumn('submission_versions', 'title', {
      type: DataTypes.STRING(180),
      allowNull: true
    });
    await queryInterface.addColumn('submission_versions', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('submission_versions', 'file_url', {
      type: DataTypes.STRING(500),
      allowNull: true
    });
    await queryInterface.sequelize.query(
      "UPDATE submission_versions SET title = CONCAT('Version ', version), description = notes"
    );
    await removeForeignKeys(queryInterface, 'submission_versions', 'uploaded_by');
    await queryInterface.changeColumn('submission_versions', 'uploaded_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE submission_versions sv
       LEFT JOIN submissions s ON s.id = sv.submission_id
       LEFT JOIN teams t ON t.id = s.team_id
       SET sv.uploaded_by = COALESCE(sv.uploaded_by, s.user_id, t.leader_id)
       WHERE sv.uploaded_by IS NULL`
    );
    await queryInterface.changeColumn('submission_versions', 'uploaded_by', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'submission_versions', 'uploaded_by', 'users', 'CASCADE', 'submission_versions_submitted_by_fkey');
    await queryInterface.renameColumn('submission_versions', 'uploaded_by', 'submitted_by');
    await queryInterface.renameColumn('submission_versions', 'file_url', 'file_path');
    await queryInterface.renameColumn('submission_versions', 'version', 'version_number');
    for (const column of [
      'notes',
      'supporting_document_url',
      'presentation_url',
      'video_url',
      'demo_url',
      'repository_url'
    ]) {
      await queryInterface.removeColumn('submission_versions', column);
    }

    await queryInterface.addColumn('submissions', 'registration_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await ensureSingleColumnIndex(queryInterface, 'submissions', 'registration_id', 'submissions_registration_id_idx');
    await queryInterface.sequelize.query(
      `UPDATE submissions s
       LEFT JOIN registrations r
         ON r.competition_id = s.competition_id
        AND (r.team_id = s.team_id OR (s.team_id IS NULL AND r.user_id = s.user_id))
       SET s.registration_id = r.id
       WHERE s.registration_id IS NULL`
    );
    await queryInterface.sequelize.query(
      `INSERT INTO registrations (
         user_id, competition_id, team_id, participation_type, status, created_at, updated_at
       )
       SELECT DISTINCT COALESCE(s.user_id, t.leader_id), s.competition_id, s.team_id,
              IF(s.team_id IS NULL, 'individual', 'team'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM submissions s
       LEFT JOIN teams t ON t.id = s.team_id
       WHERE s.registration_id IS NULL
         AND COALESCE(s.user_id, t.leader_id) IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
           FROM registrations existing
           WHERE existing.competition_id = s.competition_id
             AND existing.user_id = COALESCE(s.user_id, t.leader_id)
         )`
    );
    await queryInterface.sequelize.query(
      `UPDATE submissions s
       JOIN registrations r
         ON r.competition_id = s.competition_id
        AND (r.team_id = s.team_id OR (s.team_id IS NULL AND r.user_id = s.user_id))
       SET s.registration_id = r.id
       WHERE s.registration_id IS NULL`
    );
    await queryInterface.sequelize.query(
      `UPDATE submissions s
       LEFT JOIN teams t ON t.id = s.team_id
       SET s.user_id = COALESCE(s.user_id, t.leader_id)
       WHERE s.user_id IS NULL`
    );
    await queryInterface.addColumn('submissions', 'submitted_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      'UPDATE submissions SET submitted_by = user_id WHERE submitted_by IS NULL'
    );
    await removeCheckIfPresent(queryInterface, 'submissions', 'submissions_participant_check');
    await removeForeignKeys(queryInterface, 'submissions', 'team_id');
    await removeForeignKeys(queryInterface, 'submissions', 'user_id');
    await removeForeignKeys(queryInterface, 'submissions', 'competition_id');
    await queryInterface.changeColumn('submissions', 'team_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('submissions', 'registration_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('submissions', 'submitted_by', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'submissions', 'registration_id', 'registrations', 'CASCADE', 'submissions_registration_id_fkey');
    await addForeignKey(queryInterface, 'submissions', 'team_id', 'teams', 'CASCADE', 'submissions_team_id_fkey');
    await addForeignKey(queryInterface, 'submissions', 'submitted_by', 'users', 'CASCADE', 'submissions_submitted_by_fkey');
    for (const field of ['team_id', 'user_id', 'competition_id']) {
      await ensureNonUniqueSingleColumnIndex(
        queryInterface,
        'submissions',
        field,
        `submissions_${field}_idx`
      );
      await removeUniqueIndex(queryInterface, 'submissions', [field]);
    }
    await queryInterface.removeColumn('submissions', 'current_version');
    await queryInterface.removeColumn('submissions', 'competition_id');
    await queryInterface.removeColumn('submissions', 'user_id');
    await queryInterface.changeColumn('submissions', 'title', {
      type: DataTypes.STRING(180),
      allowNull: false
    });

    await queryInterface.addColumn('mentor_assignments', 'status', {
      type: DataTypes.ENUM('active', 'ended'),
      allowNull: false,
      defaultValue: 'active'
    });
    await removeForeignKeys(queryInterface, 'mentor_assignments', 'assigned_by');
    await queryInterface.changeColumn('mentor_assignments', 'assigned_by', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'mentor_assignments', 'assigned_by', 'users', 'CASCADE', 'mentor_assignments_assigned_by_fkey');
    await ensureNonUniqueSingleColumnIndex(
      queryInterface,
      'mentor_assignments',
      'team_id',
      'mentor_assignments_team_id_idx'
    );
    await removeUniqueIndex(queryInterface, 'mentor_assignments', ['team_id']);
    await queryInterface.dropTable('mentor_notes');
  }
};
