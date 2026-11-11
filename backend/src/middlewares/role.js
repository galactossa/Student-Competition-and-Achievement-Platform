const AppError = require('../utils/appError');

const role = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Autentikasi diperlukan.', 401));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Anda tidak memiliki izin untuk mengakses layanan ini.', 403));
  }
  return next();
};

module.exports = role;
