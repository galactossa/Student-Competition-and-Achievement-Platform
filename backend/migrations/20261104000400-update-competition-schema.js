'use strict';

const competitionStatuses = [
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'submission',
  'competition',
  'result_announced',
  'completed'
];

const previousStatuses = ['draft', 'published', 'closed', 'cancelled', 'completed'];

function enumDefinition(statuses) {
  return [...new Set(statuses)].map((status) => `'${status}'`).join(', ');
}

async function renameColumnIfNeeded(queryInterface, table, oldName, newName) {
  const columns = await queryInterface.describeTable(table);
  if (columns[oldName] && !columns[newName]) {
    await queryInterface.renameColumn(table, oldName, newName);
  }
}

async function removeColumnIfPresent(queryInterface, table, column) {
  const columns = await queryInterface.describeTable(table);
  if (columns[column]) {
    await queryInterface.removeColumn(table, column);
  }
}

async function addColumnIfMissing(queryInterface, table, column, definition) {
  const columns = await queryInterface.describeTable(table);
  if (!columns[column]) {
    await queryInterface.addColumn(table, column, definition);
  }
}

async function replaceForeignKey(queryInterface, table, column, definition) {
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

  await queryInterface.addConstraint(table, {
    fields: [column],
    type: 'foreign key',
    name: definition.name,
    references: { table: definition.table, field: 'id' },
    onDelete: definition.onDelete,
    onUpdate: 'CASCADE'
  });
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

async function ensureIndex(queryInterface, field, name) {
  const indexes = await queryInterface.showIndex('competitions');
  if (!indexes.some((index) => index.fields.length === 1 && index.fields[0].attribute === field)) {
    await queryInterface.addIndex('competitions', [field], { name });
  }
}

async function ensureUniqueIndex(queryInterface, table, field, name) {
  const indexes = (await queryInterface.showIndex(table)).filter(
    (index) => index.unique && index.fields.length === 1 && index.fields[0].attribute === field
  );
  if (indexes.length === 0) {
    await queryInterface.addIndex(table, [field], { name, unique: true });
    return;
  }

  for (const index of indexes.slice(1)) {
    await queryInterface.removeIndex(table, index.name);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.changeColumn('competition_categories', 'name', {
      type: DataTypes.STRING(80),
      allowNull: false
    });
    await removeColumnIfPresent(queryInterface, 'competition_categories', 'slug');

    await renameColumnIfNeeded(queryInterface, 'competitions', 'title', 'name');
    await renameColumnIfNeeded(queryInterface, 'competitions', 'registration_end', 'registration_deadline');
    await renameColumnIfNeeded(queryInterface, 'competitions', 'start_at', 'start_date');
    await renameColumnIfNeeded(queryInterface, 'competitions', 'end_at', 'end_date');

    await queryInterface.changeColumn('competitions', 'name', {
      type: DataTypes.STRING(200),
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'slug', {
      type: DataTypes.STRING(220),
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'organizer', {
      type: DataTypes.STRING(150),
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'description', {
      type: DataTypes.TEXT('long'),
      allowNull: true
    });
    await queryInterface.changeColumn('competitions', 'location', {
      type: DataTypes.STRING(200),
      allowNull: true
    });
    await queryInterface.changeColumn('competitions', 'start_date', {
      type: DataTypes.DATEONLY,
      allowNull: true
    });
    await queryInterface.changeColumn('competitions', 'end_date', {
      type: DataTypes.DATEONLY,
      allowNull: true
    });
    await queryInterface.changeColumn('competitions', 'registration_deadline', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await removeColumnIfPresent(queryInterface, 'competitions', 'registration_start');
    await removeColumnIfPresent(queryInterface, 'competitions', 'quota');

    await queryInterface.sequelize.query(
      `ALTER TABLE \`competitions\` MODIFY \`status\` ENUM(${enumDefinition([...previousStatuses, ...competitionStatuses])}) NOT NULL DEFAULT 'draft'`
    );
    await queryInterface.sequelize.query(
      "UPDATE competitions SET status = 'registration_closed' WHERE status IN ('closed', 'cancelled')"
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE \`competitions\` MODIFY \`status\` ENUM(${enumDefinition(competitionStatuses)}) NOT NULL DEFAULT 'draft'`
    );

    const columns = {
      submission_deadline: { type: DataTypes.DATE, allowNull: true },
      result_date: { type: DataTypes.DATEONLY, allowNull: true },
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
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
    };

    for (const [column, definition] of Object.entries(columns)) {
      await addColumnIfMissing(queryInterface, 'competitions', column, definition);
    }

    await addColumnIfMissing(queryInterface, 'competitions', 'created_by', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await replaceForeignKey(queryInterface, 'competitions', 'category_id', {
      name: 'competitions_category_id_fkey',
      table: 'competition_categories',
      onDelete: 'RESTRICT'
    });

    await ensureIndex(queryInterface, 'level', 'competitions_level_idx');
    await ensureIndex(queryInterface, 'category_id', 'competitions_category_id_idx');
    await ensureIndex(queryInterface, 'registration_deadline', 'competitions_registration_deadline_idx');
    await ensureIndex(queryInterface, 'status', 'competitions_status_idx');
    await ensureUniqueIndex(queryInterface, 'competition_categories', 'name', 'competition_categories_name_unique');
    await ensureUniqueIndex(queryInterface, 'competitions', 'slug', 'competitions_slug_unique');
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    const indexesToRemove = new Set([
      'competitions_status_idx',
      'competitions_registration_deadline_idx',
      'competitions_category_id_idx',
      'competitions_level_idx'
    ]);
    for (const index of await queryInterface.showIndex('competitions')) {
      if (indexesToRemove.has(index.name)) {
        await queryInterface.removeIndex('competitions', index.name);
      }
    }

    await removeForeignKeys(queryInterface, 'competitions', 'created_by');
    await queryInterface.removeColumn('competitions', 'created_by');
    await replaceForeignKey(queryInterface, 'competitions', 'category_id', {
      name: 'competitions_category_id_fkey',
      table: 'competition_categories',
      onDelete: 'CASCADE'
    });

    for (const column of [
      'price',
      'contact_person',
      'guidebook_url',
      'poster_url',
      'requirements',
      'prize',
      'registration_url',
      'mode',
      'result_date',
      'submission_deadline'
    ]) {
      await queryInterface.removeColumn('competitions', column);
    }

    await queryInterface.sequelize.query(
      `ALTER TABLE \`competitions\` MODIFY \`status\` ENUM(${enumDefinition([...competitionStatuses, ...previousStatuses])}) NOT NULL DEFAULT 'draft'`
    );
    await queryInterface.sequelize.query(
      "UPDATE competitions SET status = 'published' WHERE status IN ('registration_open', 'submission', 'competition', 'result_announced')"
    );
    await queryInterface.sequelize.query(
      "UPDATE competitions SET status = 'closed' WHERE status = 'registration_closed'"
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE \`competitions\` MODIFY \`status\` ENUM(${enumDefinition(previousStatuses)}) NOT NULL DEFAULT 'draft'`
    );

    await queryInterface.renameColumn('competitions', 'registration_deadline', 'registration_end');
    await queryInterface.renameColumn('competitions', 'start_date', 'start_at');
    await queryInterface.renameColumn('competitions', 'end_date', 'end_at');
    await queryInterface.addColumn('competitions', 'registration_start', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      'UPDATE competitions SET registration_start = COALESCE(registration_end, start_at, NOW()), registration_end = COALESCE(registration_end, start_at, NOW()), start_at = COALESCE(start_at, CURDATE()), end_at = COALESCE(end_at, start_at, CURDATE())'
    );
    await queryInterface.changeColumn('competitions', 'registration_start', {
      type: DataTypes.DATE,
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'registration_end', {
      type: DataTypes.DATE,
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'start_at', {
      type: DataTypes.DATE,
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'end_at', {
      type: DataTypes.DATE,
      allowNull: false
    });
    await queryInterface.addColumn('competitions', 'quota', {
      type: DataTypes.INTEGER,
      allowNull: true
    });

    await queryInterface.changeColumn('competitions', 'description', {
      type: DataTypes.TEXT,
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'location', {
      type: DataTypes.STRING(180),
      allowNull: true
    });
    await queryInterface.changeColumn('competitions', 'organizer', {
      type: DataTypes.STRING(160),
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'slug', {
      type: DataTypes.STRING(200),
      allowNull: false
    });
    await queryInterface.changeColumn('competitions', 'name', {
      type: DataTypes.STRING(180),
      allowNull: false
    });
    await queryInterface.renameColumn('competitions', 'name', 'title');

    await queryInterface.addColumn('competition_categories', 'slug', {
      type: DataTypes.STRING(120),
      allowNull: true
    });
    await queryInterface.sequelize.query(
      "UPDATE competition_categories SET slug = CONCAT('rollback-category-', id) WHERE slug IS NULL"
    );
    await queryInterface.changeColumn('competition_categories', 'slug', {
      type: DataTypes.STRING(120),
      allowNull: false
    });
    await queryInterface.changeColumn('competition_categories', 'name', {
      type: DataTypes.STRING(100),
      allowNull: false
    });

    await ensureIndex(queryInterface, 'category_id', 'category_id');
    await ensureUniqueIndex(queryInterface, 'competition_categories', 'name', 'competition_categories_name_unique');
    await ensureUniqueIndex(queryInterface, 'competition_categories', 'slug', 'competition_categories_slug_unique');
    await ensureUniqueIndex(queryInterface, 'competitions', 'slug', 'competitions_slug_unique');
  }
};
