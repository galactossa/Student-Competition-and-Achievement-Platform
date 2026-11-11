const { Sequelize } = require('sequelize');
const configs = require('./database');

const environment = process.env.NODE_ENV || 'development';
const config = configs[environment];
if (!config) {
  throw new Error(`Unknown NODE_ENV "${environment}" for database configuration`);
}

const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database ${config.database} terhubung`);
  } catch (error) {
    console.error(`Koneksi database ${config.database} gagal:`, error);
    throw error;
  }
}

module.exports = sequelize;
module.exports.testConnection = testConnection;
