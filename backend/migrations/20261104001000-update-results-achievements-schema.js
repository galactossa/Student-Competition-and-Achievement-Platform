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
  } else {
    for (const index of matching.slice(1)) {
      await queryInterface.removeIndex(table, index.name);
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await addColumnIfMissing(queryInterface, 'results', 'user_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'results', 'result_type', {
      type: DataTypes.ENUM('participation', 'finalist', 'winner'),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'results', 'date', {
      type: DataTypes.DATEONLY,
      allowNull: true
    });
    await renameColumnIfNeeded(queryInterface, 'results', 'rank', 'position');
    await renameColumnIfNeeded(queryInterface, 'results', 'award', 'title');

    const resultColumns = await queryInterface.describeTable('results');
    if (resultColumns.registration_id) {
      await queryInterface.sequelize.query(
        `UPDATE results r
         JOIN registrations rg ON rg.id = r.registration_id
         SET r.user_id = CASE WHEN r.team_id IS NULL THEN rg.user_id ELSE NULL END
         WHERE r.user_id IS NULL`
      );
    }
    await queryInterface.sequelize.query(
      `UPDATE results
       SET result_type = CASE
         WHEN position IS NULL THEN 'participation'
         WHEN position = 1 THEN 'winner'
         ELSE 'finalist'
       END
       WHERE result_type IS NULL`
    );
    await queryInterface.sequelize.query(
      `UPDATE results r
       LEFT JOIN competitions c ON c.id = r.competition_id
       SET r.date = COALESCE(c.result_date, DATE(r.created_at), CURRENT_DATE)
       WHERE r.date IS NULL`
    );
    await queryInterface.changeColumn('results', 'result_type', {
      type: DataTypes.ENUM('participation', 'finalist', 'winner'),
      allowNull: false
    });
    await queryInterface.changeColumn('results', 'date', {
      type: DataTypes.DATEONLY,
      allowNull: false
    });
    await queryInterface.changeColumn('results', 'title', {
      type: DataTypes.STRING(150),
      allowNull: true
    });
    await removeColumnIfPresent(queryInterface, 'results', 'prize_amount');

    await addColumnIfMissing(queryInterface, 'achievements', 'result_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievements', 'certificate_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievements', 'evidence_url', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievements', 'verified_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await renameColumnIfNeeded(queryInterface, 'achievements', 'occurred_at', 'date');

    const achievementColumns = await queryInterface.describeTable('achievements');
    if (achievementColumns.competition_id) {
      await queryInterface.sequelize.query(
        `UPDATE achievements a
         JOIN results r ON r.competition_id = a.competition_id
         LEFT JOIN registrations rg ON rg.competition_id = r.competition_id
           AND rg.user_id = a.user_id
         SET a.result_id = r.id
         WHERE a.result_id IS NULL
           AND (r.user_id = a.user_id OR (r.team_id IS NOT NULL AND r.team_id = rg.team_id))`
      );
    }
    const [missingResultRows] = await queryInterface.sequelize.query(
      `SELECT id, competition_id, user_id
       FROM achievements
       WHERE result_id IS NULL
       LIMIT 10`
    );
    if (missingResultRows.length > 0) {
      throw new Error(
        `Cannot migrate achievements without a matching result. Achievement IDs: ${missingResultRows
          .map(({ id }) => id)
          .join(', ')}`
      );
    }

    const [missingCompetitionRows] = await queryInterface.sequelize.query(
      'SELECT id FROM achievements WHERE competition_id IS NULL LIMIT 10'
    );
    if (missingCompetitionRows.length > 0) {
      throw new Error(
        `Cannot migrate achievements without a competition. Achievement IDs: ${missingCompetitionRows
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
    const [unsupportedVerificationRows] = await queryInterface.sequelize.query(
      `SELECT id, status
       FROM achievement_verifications
       WHERE status NOT IN ('verified', 'revision_required', 'rejected')
       LIMIT 10`
    );
    if (unsupportedVerificationRows.length > 0) {
      throw new Error(
        `Cannot map pending achievement verification records to an action. Verification IDs: ${unsupportedVerificationRows
          .map(({ id }) => id)
          .join(', ')}`
      );
    }

    const oldAchievementColumns = await queryInterface.describeTable('achievements');
    if (oldAchievementColumns.title) {
      await queryInterface.sequelize.query(
        `UPDATE achievements
         SET evidence_url = COALESCE(
           evidence_url,
           (SELECT d.file_path FROM documents d
            WHERE d.achievement_id = achievements.id
            ORDER BY d.id LIMIT 1)
         ),
         certificate_url = COALESCE(
           certificate_url,
           (SELECT c.file_path FROM certificates c
            WHERE c.achievement_id = achievements.id
            ORDER BY c.id LIMIT 1)
         )`
      );
    }
    const [oversizedValues] = await queryInterface.sequelize.query(
      `SELECT 'achievement' AS entity, id
       FROM achievements
       WHERE CHAR_LENGTH(organizer) > 150
          OR CHAR_LENGTH(certificate_url) > 255
          OR CHAR_LENGTH(evidence_url) > 255
       UNION ALL
       SELECT 'certificate' AS entity, id
       FROM certificates
       WHERE CHAR_LENGTH(file_path) > 255
          OR CHAR_LENGTH(certificate_number) > 80
       LIMIT 10`
    );
    if (oversizedValues.length > 0) {
      throw new Error(
        `Cannot safely shorten achievement/certificate fields. Records: ${oversizedValues
          .map(({ entity, id }) => `${entity} ${id}`)
          .join(', ')}`
      );
    }
    await queryInterface.sequelize.query(
      `UPDATE achievements a
       SET a.verified_at = (
         SELECT MAX(av.verified_at)
         FROM achievement_verifications av
         WHERE av.achievement_id = a.id
           AND av.status = 'verified'
       )
       WHERE a.verified_at IS NULL`
    );

    await queryInterface.changeColumn('achievements', 'organizer', {
      type: DataTypes.STRING(150),
      allowNull: false
    });
    await queryInterface.changeColumn('achievements', 'skkm_points', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.sequelize.query(
      'UPDATE achievements SET skkm_points = ROUND(skkm_points)'
    );
    await queryInterface.changeColumn('achievements', 'date', {
      type: DataTypes.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('results', 'competition_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('achievements', 'competition_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('achievements', 'user_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('achievements', 'result_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });

    await removeForeignKeys(queryInterface, 'results', 'competition_id');
    await removeForeignKeys(queryInterface, 'results', 'team_id');
    await removeForeignKeys(queryInterface, 'results', 'user_id');
    await addForeignKey(queryInterface, 'results', 'competition_id', 'competitions', 'CASCADE', 'results_competition_id_fkey');
    await addForeignKey(queryInterface, 'results', 'team_id', 'teams', 'CASCADE', 'results_team_id_fkey');
    await addForeignKey(queryInterface, 'results', 'user_id', 'users', 'CASCADE', 'results_user_id_fkey');

    await removeForeignKeys(queryInterface, 'achievements', 'result_id');
    await removeForeignKeys(queryInterface, 'achievements', 'user_id');
    await removeForeignKeys(queryInterface, 'achievements', 'competition_id');
    await addForeignKey(queryInterface, 'achievements', 'result_id', 'results', 'CASCADE', 'achievements_result_id_fkey');
    await addForeignKey(queryInterface, 'achievements', 'user_id', 'users', 'CASCADE', 'achievements_user_id_fkey');
    await addForeignKey(queryInterface, 'achievements', 'competition_id', 'competitions', 'CASCADE', 'achievements_competition_id_fkey');

    await removeForeignKeys(queryInterface, 'achievement_verifications', 'verifier_id');
    await queryInterface.changeColumn('achievement_verifications', 'verifier_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addForeignKey(queryInterface, 'achievement_verifications', 'verifier_id', 'users', 'SET NULL', 'achievement_verifications_verifier_id_fkey');

    await removeForeignKeys(queryInterface, 'achievement_verifications', 'achievement_id');
    await addForeignKey(queryInterface, 'achievement_verifications', 'achievement_id', 'achievements', 'CASCADE', 'achievement_verifications_achievement_id_fkey');

    const verificationColumns = await queryInterface.describeTable('achievement_verifications');
    if (verificationColumns.status) {
      await addColumnIfMissing(queryInterface, 'achievement_verifications', 'action', {
        type: DataTypes.ENUM('approve', 'revision', 'reject'),
        allowNull: true
      });
      await queryInterface.sequelize.query(
        `UPDATE achievement_verifications
         SET action = CASE status
           WHEN 'verified' THEN 'approve'
           WHEN 'revision_required' THEN 'revision'
           WHEN 'rejected' THEN 'reject'
         END
         WHERE action IS NULL`
      );
      await queryInterface.changeColumn('achievement_verifications', 'action', {
        type: DataTypes.ENUM('approve', 'revision', 'reject'),
        allowNull: false
      });
      await removeColumnIfPresent(queryInterface, 'achievement_verifications', 'status');
      await removeColumnIfPresent(queryInterface, 'achievement_verifications', 'verified_at');
    }

    await removeForeignKeys(queryInterface, 'certificates', 'achievement_id');
    await addForeignKey(queryInterface, 'certificates', 'achievement_id', 'achievements', 'CASCADE', 'certificates_achievement_id_fkey');
    await renameColumnIfNeeded(queryInterface, 'certificates', 'file_path', 'file_url');
    await queryInterface.changeColumn('certificates', 'file_url', {
      type: DataTypes.STRING(255),
      allowNull: false
    });
    await queryInterface.changeColumn('certificates', 'certificate_number', {
      type: DataTypes.STRING(80),
      allowNull: true
    });
    await queryInterface.changeColumn('certificates', 'issued_at', {
      type: DataTypes.DATEONLY,
      allowNull: true
    });

    await removeColumnIfPresent(queryInterface, 'achievement_skills', 'proficiency');
    await ensureUniqueIndex(
      queryInterface,
      'achievement_skills',
      ['achievement_id', 'skill_id'],
      'achievement_skills_achievement_skill_unique'
    );

    await removeColumnIfPresent(queryInterface, 'achievements', 'title');
    await removeColumnIfPresent(queryInterface, 'achievements', 'description');
    await removeColumnIfPresent(queryInterface, 'achievements', 'occurred_at');
    await removeForeignKeys(queryInterface, 'results', 'registration_id');
    await removeColumnIfPresent(queryInterface, 'results', 'registration_id');
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await addColumnIfMissing(queryInterface, 'achievements', 'competition_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievements', 'title', {
      type: DataTypes.STRING(180),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievements', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievements', 'occurred_at', {
      type: DataTypes.DATEONLY,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE achievements a
       LEFT JOIN results r ON r.id = a.result_id
       SET a.competition_id = COALESCE(a.competition_id, r.competition_id),
           a.occurred_at = COALESCE(a.occurred_at, a.date),
           a.title = COALESCE(a.title, r.title, CONCAT('Achievement ', a.id)),
           a.description = COALESCE(a.description, a.evidence_url)`
    );
    await removeForeignKeys(queryInterface, 'achievements', 'competition_id');
    await queryInterface.changeColumn('achievements', 'competition_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addForeignKey(queryInterface, 'achievements', 'competition_id', 'competitions', 'CASCADE', 'achievements_competition_id_fkey');
    await queryInterface.changeColumn('achievements', 'organizer', {
      type: DataTypes.STRING(160),
      allowNull: false
    });
    await queryInterface.changeColumn('achievements', 'skkm_points', {
      type: DataTypes.DECIMAL(7, 2),
      allowNull: false,
      defaultValue: 0
    });

    await addColumnIfMissing(queryInterface, 'achievement_verifications', 'status', {
      type: DataTypes.ENUM('under_verification', 'revision_required', 'verified', 'rejected'),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'achievement_verifications', 'verified_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE achievement_verifications
       SET status = CASE action
         WHEN 'approve' THEN 'verified'
         WHEN 'revision' THEN 'revision_required'
         WHEN 'reject' THEN 'rejected'
       END`
    );
    await queryInterface.changeColumn('achievement_verifications', 'status', {
      type: DataTypes.ENUM('under_verification', 'revision_required', 'verified', 'rejected'),
      allowNull: false
    });

    await addColumnIfMissing(queryInterface, 'achievement_skills', 'proficiency', {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true
    });

    await queryInterface.changeColumn('certificates', 'issued_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.changeColumn('certificates', 'certificate_number', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await renameColumnIfNeeded(queryInterface, 'certificates', 'file_url', 'file_path');
    await queryInterface.changeColumn('certificates', 'file_path', {
      type: DataTypes.STRING(500),
      allowNull: false
    });

    await removeForeignKeys(queryInterface, 'achievement_verifications', 'verifier_id');
    await queryInterface.changeColumn('achievement_verifications', 'verifier_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'achievement_verifications', 'verifier_id', 'users', 'CASCADE', 'achievement_verifications_verifier_id_fkey');

    await addColumnIfMissing(queryInterface, 'results', 'registration_id', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'results', 'rank', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'results', 'award', {
      type: DataTypes.STRING(120),
      allowNull: true
    });
    await addColumnIfMissing(queryInterface, 'results', 'prize_amount', {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE results r
       LEFT JOIN registrations rg
         ON rg.competition_id = r.competition_id
        AND (rg.team_id = r.team_id OR (r.team_id IS NULL AND rg.user_id = r.user_id))
       SET r.registration_id = COALESCE(r.registration_id, rg.id),
           r.rank = COALESCE(r.rank, r.position),
           r.award = COALESCE(r.award, r.title)
       WHERE r.registration_id IS NULL OR r.rank IS NULL OR r.award IS NULL`
    );
    await queryInterface.sequelize.query(
      `INSERT INTO registrations (
         user_id, competition_id, team_id, participation_type, status, created_at, updated_at
       )
       SELECT DISTINCT COALESCE(r.user_id, t.leader_id), r.competition_id, r.team_id,
              IF(r.team_id IS NULL, 'individual', 'team'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM results r
       LEFT JOIN teams t ON t.id = r.team_id
       WHERE r.registration_id IS NULL
         AND COALESCE(r.user_id, t.leader_id) IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
           FROM registrations existing
           WHERE existing.competition_id = r.competition_id
             AND existing.user_id = COALESCE(r.user_id, t.leader_id)
         )`
    );
    await queryInterface.sequelize.query(
      `UPDATE results r
       JOIN registrations rg
         ON rg.competition_id = r.competition_id
        AND (rg.team_id = r.team_id OR (r.team_id IS NULL AND rg.user_id = r.user_id))
       SET r.registration_id = rg.id
       WHERE r.registration_id IS NULL`
    );
    const [unlinkedResults] = await queryInterface.sequelize.query(
      'SELECT id FROM results WHERE registration_id IS NULL LIMIT 10'
    );
    if (unlinkedResults.length > 0) {
      throw new Error(
        `Cannot restore required legacy registrations for result IDs: ${unlinkedResults
          .map(({ id }) => id)
          .join(', ')}`
      );
    }

    await removeForeignKeys(queryInterface, 'results', 'registration_id');
    await queryInterface.changeColumn('results', 'registration_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'results', 'registration_id', 'registrations', 'CASCADE', 'results_registration_id_fkey');
    await queryInterface.changeColumn('results', 'title', {
      type: DataTypes.STRING(120),
      allowNull: true
    });
    await removeForeignKeys(queryInterface, 'results', 'user_id');
    await removeColumnIfPresent(queryInterface, 'results', 'user_id');
    await removeColumnIfPresent(queryInterface, 'results', 'result_type');
    await removeColumnIfPresent(queryInterface, 'results', 'date');
    await renameColumnIfNeeded(queryInterface, 'results', 'position', 'rank');
    await renameColumnIfNeeded(queryInterface, 'results', 'title', 'award');

    await removeForeignKeys(queryInterface, 'achievements', 'result_id');
    await removeColumnIfPresent(queryInterface, 'achievements', 'result_id');
    await removeColumnIfPresent(queryInterface, 'achievements', 'certificate_url');
    await removeColumnIfPresent(queryInterface, 'achievements', 'evidence_url');
    await removeColumnIfPresent(queryInterface, 'achievements', 'verified_at');
    await renameColumnIfNeeded(queryInterface, 'achievements', 'date', 'occurred_at');

    await removeForeignKeys(queryInterface, 'achievement_verifications', 'achievement_id');
    await removeForeignKeys(queryInterface, 'achievement_verifications', 'verifier_id');
    await queryInterface.changeColumn('achievement_verifications', 'verifier_id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    await addForeignKey(queryInterface, 'achievement_verifications', 'achievement_id', 'achievements', 'CASCADE', 'achievement_verifications_achievement_id_fkey');
    await addForeignKey(queryInterface, 'achievement_verifications', 'verifier_id', 'users', 'CASCADE', 'achievement_verifications_verifier_id_fkey');
    await removeColumnIfPresent(queryInterface, 'achievement_verifications', 'action');
  }
};
