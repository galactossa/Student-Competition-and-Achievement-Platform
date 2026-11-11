const {
  JsonWebTokenError,
  TokenExpiredError
} = require('jsonwebtoken');
const {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError
} = require('sequelize');
const AppError = require('../utils/appError');
const { error: sendError } = require('../utils/response');
const env = require('../config/env');

module.exports = function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }
  if (err instanceof UniqueConstraintError) {
    return sendError(res, 'Data yang dimasukkan sudah digunakan.', 409);
  }
  if (err instanceof ForeignKeyConstraintError) {
    return sendError(res, 'Data masih digunakan oleh data lain.', 409);
  }
  if (err instanceof ValidationError) {
    return sendError(
      res,
      'Data yang dikirim belum valid.',
      422,
      err.errors.map((item) => ({ field: item.path, message: item.message }))
    );
  }
  if (err instanceof TokenExpiredError) {
    return sendError(res, 'Token sudah kedaluwarsa. Silakan login kembali.', 401);
  }
  if (err instanceof JsonWebTokenError) {
    return sendError(res, 'Token tidak valid.', 401);
  }

  if (env.nodeEnv !== 'production') {
    console.error(err);
  }
  return sendError(res, 'Terjadi kesalahan pada server.', 500);
};
