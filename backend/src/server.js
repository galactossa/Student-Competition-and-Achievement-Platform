const app = require('./app');
const sequelize = require('./config/db');
const env = require('./config/env');

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    app.listen(env.port, () => {
      console.log(`SCAP API berjalan pada port ${env.port}.`);
    });
  } catch (error) {
    console.error('Unable to start SCAP API:', error);
    process.exitCode = 1;
  }
}

startServer();
