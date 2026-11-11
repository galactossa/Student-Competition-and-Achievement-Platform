const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const activeRefreshTokens = new Map();

function signAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      email: user.email,
      type: 'access',
      sid: sessionId,
      jti: crypto.randomUUID()
    },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

function signRefreshToken(user, jti) {
  return jwt.sign(
    { sub: String(user.id), type: 'refresh', jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

function issueTokenPair(user) {
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, jti);
  const decoded = jwt.decode(refreshToken);
  activeRefreshTokens.set(jti, decoded.exp * 1000);

  return {
    accessToken: signAccessToken(user, jti),
    refreshToken
  };
}

function verifyAccess(token) {
  const payload = jwt.verify(token, env.jwt.secret);
  if (payload.type !== 'access' || !payload.sub || !payload.sid) {
    throw new jwt.JsonWebTokenError('Token akses tidak valid');
  }
  return payload;
}

function verifyRefresh(token) {
  const payload = jwt.verify(token, env.jwt.refreshSecret);
  if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
    throw new jwt.JsonWebTokenError('Token refresh tidak valid');
  }

  const expiresAt = activeRefreshTokens.get(payload.jti);
  if (!expiresAt || expiresAt <= Date.now()) {
    activeRefreshTokens.delete(payload.jti);
    throw new jwt.JsonWebTokenError('Token refresh sudah tidak berlaku');
  }
  return payload;
}

function revokeRefreshToken(jti) {
  return activeRefreshTokens.delete(jti);
}

module.exports = {
  activeRefreshTokens,
  issueTokenPair,
  revokeRefreshToken,
  signAccessToken,
  verifyAccess,
  verifyRefresh
};
