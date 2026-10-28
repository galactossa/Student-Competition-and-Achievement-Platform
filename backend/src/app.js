const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const env = require('./config/env');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SCAP API is running',
    data: { status: 'ok' }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

module.exports = app;
