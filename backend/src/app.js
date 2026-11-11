const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { error } = require('./utils/response');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SCAP API is running',
    data: { status: 'ok' }
  });
});

app.use('/api/auth', rateLimit({
  windowMs: 60 * 1000,
  limit: env.nodeEnv === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Silakan coba kembali satu menit lagi.',
    data: null
  }
}));
app.use('/api', routes);

app.use((_req, res) => error(res, 'Rute tidak ditemukan.', 404));
app.use(errorHandler);

module.exports = app;
