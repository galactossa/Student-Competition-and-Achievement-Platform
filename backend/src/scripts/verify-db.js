'use strict';

const { QueryTypes } = require('sequelize');
const models = require('../models');
const sequelize = models.sequelize;

async function runQuery(label, sql) {
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT });
  console.log(`\n${label}`);
  console.table(rows);
}

async function verifyDatabase() {
  await sequelize.authenticate();

  const modelList = Object.values(models).filter(
    (model) => model && typeof model.getTableName === 'function'
  );
  const queryInterface = sequelize.getQueryInterface();
  const counts = [];

  for (const model of modelList) {
    const tableName = model.getTableName();
    const quotedTable = queryInterface.queryGenerator.quoteTable(tableName);
    const rows = await sequelize.query(
      `SELECT COUNT(*) AS count FROM ${quotedTable}`,
      { type: QueryTypes.SELECT }
    );
    counts.push({
      table: typeof tableName === 'string' ? tableName : tableName.tableName,
      count: Number(rows[0].count)
    });
  }

  console.log('Jumlah baris per tabel:');
  console.table(counts);

  await runQuery(
    'a) Total kompetisi per level',
    `SELECT level, COUNT(*) AS total
     FROM competitions
     GROUP BY level
     ORDER BY level`
  );
  await runQuery(
    'b) Total achievement per status',
    `SELECT status, COUNT(*) AS total
     FROM achievements
     GROUP BY status
     ORDER BY status`
  );
  await runQuery(
    'c) Top 3 mahasiswa berdasarkan total SKKM points',
    `SELECT u.id AS user_id, u.name, s.nim, SUM(a.skkm_points) AS total_skkm_points
     FROM users u
     INNER JOIN students s ON s.user_id = u.id
     INNER JOIN achievements a ON a.user_id = u.id
     WHERE u.role = 'mahasiswa'
     GROUP BY u.id, u.name, s.nim
     ORDER BY total_skkm_points DESC, u.name ASC
     LIMIT 3`
  );
  await runQuery(
    'd) Total submission per status',
    `SELECT status, COUNT(*) AS total
     FROM submissions
     GROUP BY status
     ORDER BY status`
  );
  await runQuery(
    'e) Lima team approved beserta leader dan kompetisi',
    `SELECT t.id AS team_id, t.name AS team_name, u.name AS leader_name,
            c.name AS competition_name
     FROM teams t
     INNER JOIN users u ON u.id = t.leader_id
     INNER JOIN competitions c ON c.id = t.competition_id
     WHERE t.status = 'approved'
     ORDER BY t.id
     LIMIT 5`
  );

  const expectedEmptyTables = new Set([
    'registrations',
    'documents',
    'user_calendar_events'
  ]);
  const emptyTables = counts.filter(({ count }) => count === 0).map(({ table }) => table);
  const missingSeedData = counts.filter(
    ({ table, count }) => count === 0 && !expectedEmptyTables.has(table)
  );
  const totalRows = counts.reduce((total, { count }) => total + count, 0);

  if (totalRows > 0 && missingSeedData.length === 0) {
    console.log('✅ Semua tabel & relasi OK');
  } else {
    console.warn(
      `Verifikasi selesai; tabel tanpa data seeder: ${emptyTables.join(', ') || 'tidak ada'}`
    );
  }
  if (missingSeedData.length > 0) {
    console.warn(
      `Tabel yang seharusnya terisi tetapi masih kosong: ${missingSeedData
        .map(({ table }) => table)
        .join(', ')}`
    );
  }
}

verifyDatabase()
  .catch((error) => {
    console.error('Verifikasi database gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
