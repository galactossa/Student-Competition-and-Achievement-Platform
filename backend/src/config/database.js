require('dotenv').config();

const database = process.env.DB_NAME || 'scap_db';
const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
};

module.exports = {
  development: common,
  test: { ...common, database: `${database}_test` },
  production: common
};
