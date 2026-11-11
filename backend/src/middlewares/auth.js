const AppError = require('../utils/appError');
const { verifyAccess } = require('../utils/jwt');

module.exports = function auth(req, _res, next) {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Token akses diperlukan.', 401));
  }

  try {
    const payload = verifyAccess(authorization.slice(7).trim());
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      sessionId: payload.sid
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
