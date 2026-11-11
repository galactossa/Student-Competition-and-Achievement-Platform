'use strict';

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

async function ensureIndex(queryInterface, table, fields, name, unique = false) {
  const indexes = await queryInterface.showIndex(table);
  if (
    !indexes.some(
      (index) =>
        index.unique === unique &&
        index.fields.length === fields.length &&
        fields.every((field, position) => index.fields[position].attribute === field)
    )
  ) {
    await queryInterface.addIndex(table, fields, { name, unique });
  }
}

async function removeIndexIfPresent(queryInterface, table, name) {
  const indexes = await queryInterface.showIndex(table);
  if (indexes.some((index) => index.name === name)) {
    await queryInterface.removeIndex(table, name);
  }
}

async function ensureSingleColumnIndex(queryInterface, table, field, name) {
  const indexes = await queryInterface.showIndex(table);
  if (
    !indexes.some(
      (index) => index.fields.length === 1 && index.fields[0].attribute === field
    )
  ) {
    await queryInterface.addIndex(table, [field], { name });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const tables = await queryInterface.showAllTables();

    await addColumnIfMissing(queryInterface, 'documents', 'documentable_type', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'documents', 'documentable_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'documents', 'version', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await renameColumnIfNeeded(queryInterface, 'documents', 'name', 'file_name');
    await renameColumnIfNeeded(queryInterface, 'documents', 'size_bytes', 'size');

    const updatedDocumentColumns = await queryInterface.describeTable('documents');
    if (updatedDocumentColumns.achievement_id && updatedDocumentColumns.submission_id) {
      const [ambiguousDocuments] = await queryInterface.sequelize.query(
        `SELECT id
         FROM documents
         WHERE achievement_id IS NOT NULL AND submission_id IS NOT NULL
         LIMIT 10`
      );
      if (ambiguousDocuments.length > 0) {
        throw new Error(
          `Documents reference multiple entities and cannot be migrated: ${ambiguousDocuments
            .map(({ id }) => id)
            .join(', ')}`
        );
      }
      await queryInterface.sequelize.query(
        `UPDATE documents
         SET documentable_type = CASE
               WHEN achievement_id IS NOT NULL THEN 'Achievement'
               WHEN submission_id IS NOT NULL THEN 'Submission'
               ELSE documentable_type
             END,
             documentable_id = COALESCE(achievement_id, submission_id, documentable_id)
         WHERE documentable_type IS NULL OR documentable_id IS NULL`
      );
    }
    const [unmappedDocuments] = await queryInterface.sequelize.query(
      `SELECT id
       FROM documents
       WHERE documentable_type IS NULL OR documentable_id IS NULL
       LIMIT 10`
    );
    if (unmappedDocuments.length > 0) {
      throw new Error(
        `Documents need a documentable target before migration. Document IDs: ${unmappedDocuments
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
    const [oversizedDocuments] = await queryInterface.sequelize.query(
      `SELECT id
       FROM documents
       WHERE CHAR_LENGTH(file_name) > 200
          OR CHAR_LENGTH(file_path) > 255
          OR CHAR_LENGTH(mime_type) > 100
       LIMIT 10`
    );
    if (oversizedDocuments.length > 0) {
      throw new Error(
        `Cannot safely shorten document fields. Document IDs: ${oversizedDocuments
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
    await queryInterface.changeColumn('documents', 'documentable_type', {
      type: DataTypes.STRING(100),
      allowNull: false
    });
    await queryInterface.changeColumn('documents', 'documentable_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    });
    await queryInterface.changeColumn('documents', 'file_name', {
      type: DataTypes.STRING(200),
      allowNull: false
    });
    await queryInterface.changeColumn('documents', 'file_path', {
      type: DataTypes.STRING(255),
      allowNull: false
    });
    await queryInterface.changeColumn('documents', 'mime_type', {
      type: DataTypes.STRING(100),
      allowNull: false
    });
    await removeForeignKeys(queryInterface, 'documents', 'achievement_id');
    await removeForeignKeys(queryInterface, 'documents', 'submission_id');
    await removeForeignKeys(queryInterface, 'documents', 'uploaded_by');
    await queryInterface.changeColumn('documents', 'uploaded_by', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addForeignKey(queryInterface, 'documents', 'uploaded_by', 'users', 'SET NULL', 'documents_uploaded_by_fkey');
    await removeColumnIfPresent(queryInterface, 'documents', 'achievement_id');
    await removeColumnIfPresent(queryInterface, 'documents', 'submission_id');
    await ensureIndex(
      queryInterface,
      'documents',
      ['documentable_type', 'documentable_id'],
      'documents_documentable_idx'
    );

    await addColumnIfMissing(queryInterface, 'notifications', 'type', {
      type: DataTypes.STRING(80),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'notifications', 'data', {
      type: DataTypes.JSON,
      allowNull: true
    });
    const notificationColumns = await queryInterface.describeTable('notifications');
    if (notificationColumns.status) {
      await queryInterface.sequelize.query(
        `UPDATE notifications
         SET type = COALESCE(type, 'legacy'),
             read_at = CASE
               WHEN status = 'read' THEN COALESCE(read_at, updated_at, created_at)
               ELSE read_at
             END
         WHERE type IS NULL OR status = 'read'`
      );
    } else {
      await queryInterface.sequelize.query(
        `UPDATE notifications SET type = 'legacy' WHERE type IS NULL`
      );
    }
    const [oversizedNotifications] = await queryInterface.sequelize.query(
      `SELECT id
       FROM notifications
       WHERE CHAR_LENGTH(title) > 150 OR CHAR_LENGTH(type) > 80
       LIMIT 10`
    );
    if (oversizedNotifications.length > 0) {
      throw new Error(
        `Cannot safely shorten notification fields. Notification IDs: ${oversizedNotifications
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
    await queryInterface.changeColumn('notifications', 'type', {
      type: DataTypes.STRING(80),
      allowNull: false
    });
    await queryInterface.changeColumn('notifications', 'title', {
      type: DataTypes.STRING(150),
      allowNull: false
    });
    await removeColumnIfPresent(queryInterface, 'notifications', 'channel');
    await removeColumnIfPresent(queryInterface, 'notifications', 'status');
    await ensureIndex(
      queryInterface,
      'notifications',
      ['user_id', 'read_at'],
      'notifications_user_read_at_idx'
    );

    await addColumnIfMissing(queryInterface, 'audit_logs', 'model_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'audit_logs', 'old_values', {
      type: DataTypes.JSON,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'audit_logs', 'user_agent', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await renameColumnIfNeeded(queryInterface, 'audit_logs', 'actor_id', 'user_id');
    await renameColumnIfNeeded(queryInterface, 'audit_logs', 'entity_type', 'model_type');
    await renameColumnIfNeeded(queryInterface, 'audit_logs', 'metadata', 'new_values');
    const auditColumns = await queryInterface.describeTable('audit_logs');
    if (auditColumns.entity_id) {
      const [invalidEntityIds] = await queryInterface.sequelize.query(
        `SELECT id, entity_id
         FROM audit_logs
         WHERE entity_id IS NOT NULL
           AND entity_id NOT REGEXP '^[0-9]{1,20}$'
         LIMIT 10`
      );
      if (invalidEntityIds.length > 0) {
        throw new Error(
          `Audit log entity IDs must be numeric before migration: ${invalidEntityIds
            .map(({ id }) => id)
            .join(', ')}`
        );
      }
      await queryInterface.sequelize.query(
        `UPDATE audit_logs
         SET model_id = CAST(entity_id AS UNSIGNED)
         WHERE model_id IS NULL AND entity_id IS NOT NULL`
      );
    }
    const [oversizedAuditValues] = await queryInterface.sequelize.query(
      `SELECT id
       FROM audit_logs
       WHERE CHAR_LENGTH(action) > 80 OR CHAR_LENGTH(model_type) > 100
       LIMIT 10`
    );
    if (oversizedAuditValues.length > 0) {
      throw new Error(
        `Cannot safely shorten audit log fields. Audit log IDs: ${oversizedAuditValues
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
    await queryInterface.changeColumn('audit_logs', 'action', {
      type: DataTypes.STRING(80),
      allowNull: false
    });
    await queryInterface.changeColumn('audit_logs', 'model_type', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await queryInterface.changeColumn('audit_logs', 'model_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    });
    await queryInterface.changeColumn('audit_logs', 'user_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await removeForeignKeys(queryInterface, 'audit_logs', 'user_id');
    await addForeignKey(queryInterface, 'audit_logs', 'user_id', 'users', 'SET NULL', 'audit_logs_user_id_fkey');
    await removeColumnIfPresent(queryInterface, 'audit_logs', 'entity_id');
    await ensureIndex(
      queryInterface,
      'audit_logs',
      ['model_type', 'model_id'],
      'audit_logs_model_idx'
    );
    await ensureIndex(queryInterface, 'audit_logs', ['user_id'], 'audit_logs_user_id_idx');
    await ensureIndex(queryInterface, 'audit_logs', ['created_at'], 'audit_logs_created_at_idx');

    if (!tables.includes('user_calendar_events')) {
      await queryInterface.createTable('user_calendar_events', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        competition_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'competitions', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        event_type: {
          type: DataTypes.ENUM('registration', 'submission', 'result', 'custom'),
          allowNull: false
        },
        title: { type: DataTypes.STRING(150), allowNull: false },
        event_date: { type: DataTypes.DATE, allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
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
    await ensureIndex(
      queryInterface,
      'user_calendar_events',
      ['user_id', 'competition_id', 'event_type'],
      'user_calendar_events_user_competition_type_unique',
      true
    );
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.dropTable('user_calendar_events');

    await ensureSingleColumnIndex(
      queryInterface,
      'audit_logs',
      'user_id',
      'audit_logs_user_id_rollback_idx'
    );
    await removeForeignKeys(queryInterface, 'audit_logs', 'user_id');
    await removeIndexIfPresent(queryInterface, 'audit_logs', 'audit_logs_model_idx');
    await removeIndexIfPresent(queryInterface, 'audit_logs', 'audit_logs_user_id_idx');
    await removeIndexIfPresent(queryInterface, 'audit_logs', 'audit_logs_created_at_idx');
    await queryInterface.changeColumn('audit_logs', 'user_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addForeignKey(queryInterface, 'audit_logs', 'user_id', 'users', 'CASCADE', 'audit_logs_actor_id_fkey');
    await queryInterface.addColumn('audit_logs', 'entity_id', {
      type: DataTypes.STRING(64),
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE audit_logs
       SET entity_id = CAST(model_id AS CHAR)
       WHERE model_id IS NOT NULL`
    );
    await renameColumnIfNeeded(queryInterface, 'audit_logs', 'user_id', 'actor_id');
    await renameColumnIfNeeded(queryInterface, 'audit_logs', 'model_type', 'entity_type');
    await renameColumnIfNeeded(queryInterface, 'audit_logs', 'new_values', 'metadata');
    await removeColumnIfPresent(queryInterface, 'audit_logs', 'model_id');
    await removeColumnIfPresent(queryInterface, 'audit_logs', 'old_values');
    await removeColumnIfPresent(queryInterface, 'audit_logs', 'user_agent');
    await queryInterface.changeColumn('audit_logs', 'action', {
      type: DataTypes.STRING(100),
      allowNull: false
    });

    await ensureSingleColumnIndex(
      queryInterface,
      'notifications',
      'user_id',
      'notifications_user_id_rollback_idx'
    );
    await removeIndexIfPresent(queryInterface, 'notifications', 'notifications_user_read_at_idx');
    await queryInterface.addColumn('notifications', 'channel', {
      type: DataTypes.ENUM('EMAIL', 'IN_APP'),
      allowNull: false,
      defaultValue: 'IN_APP'
    });
    await queryInterface.addColumn('notifications', 'status', {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
      allowNull: false,
      defaultValue: 'sent'
    });
    await queryInterface.sequelize.query(
      `UPDATE notifications
       SET status = CASE WHEN read_at IS NOT NULL THEN 'read' ELSE 'sent' END`
    );
    await removeColumnIfPresent(queryInterface, 'notifications', 'type');
    await removeColumnIfPresent(queryInterface, 'notifications', 'data');
    await queryInterface.changeColumn('notifications', 'title', {
      type: DataTypes.STRING(180),
      allowNull: false
    });

    await removeIndexIfPresent(queryInterface, 'documents', 'documents_documentable_idx');
    await queryInterface.addColumn('documents', 'achievement_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('documents', 'submission_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    const [unsupportedDocumentTypes] = await queryInterface.sequelize.query(
      `SELECT id, documentable_type
       FROM documents
       WHERE documentable_type NOT IN ('Achievement', 'Submission')
       LIMIT 10`
    );
    if (unsupportedDocumentTypes.length > 0) {
      throw new Error(
        `Cannot restore polymorphic document targets to legacy columns: ${unsupportedDocumentTypes
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
    await queryInterface.sequelize.query(
      `UPDATE documents
       SET achievement_id = CASE WHEN documentable_type = 'Achievement' THEN documentable_id END,
           submission_id = CASE WHEN documentable_type = 'Submission' THEN documentable_id END`
    );
    await removeForeignKeys(queryInterface, 'documents', 'uploaded_by');
    await queryInterface.changeColumn('documents', 'uploaded_by', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'documents', 'achievement_id', 'achievements', 'CASCADE', 'documents_achievement_id_fkey');
    await addForeignKey(queryInterface, 'documents', 'submission_id', 'submissions', 'CASCADE', 'documents_submission_id_fkey');
    await addForeignKey(queryInterface, 'documents', 'uploaded_by', 'users', 'CASCADE', 'documents_uploaded_by_fkey');
    await removeColumnIfPresent(queryInterface, 'documents', 'documentable_type');
    await removeColumnIfPresent(queryInterface, 'documents', 'documentable_id');
    await removeColumnIfPresent(queryInterface, 'documents', 'version');
    await queryInterface.changeColumn('documents', 'file_name', {
      type: DataTypes.STRING(180),
      allowNull: false
    });
    await renameColumnIfNeeded(queryInterface, 'documents', 'file_name', 'name');
    await queryInterface.changeColumn('documents', 'file_path', {
      type: DataTypes.STRING(500),
      allowNull: false
    });
    await queryInterface.changeColumn('documents', 'mime_type', {
      type: DataTypes.STRING(120),
      allowNull: false
    });
    await renameColumnIfNeeded(queryInterface, 'documents', 'size', 'size_bytes');
  }
};
