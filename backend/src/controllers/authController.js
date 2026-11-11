const authService = require('../services/authService');
const { success } = require('../utils/response');

async function register(req, res, next) {
  try {
    return success(res, await authService.register(req.body), 'Registrasi berhasil', 201);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    return success(res, await authService.login(req.body), 'Login berhasil');
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    return success(res, await authService.refresh(req.body.refreshToken), 'Token berhasil diperbarui');
  } catch (err) {
    return next(err);
  }
}

function logout(req, res, next) {
  try {
    authService.logout(req.user.sessionId);
    return success(res, null, 'Logout berhasil');
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    return success(res, await authService.getMe(req.user.id), 'Data pengguna berhasil diambil');
  } catch (err) {
    return next(err);
  }
}

function mahasiswaPing(_req, res) {
  return success(res, null, 'Halo mahasiswa');
}

function adminPing(_req, res) {
  return success(res, null, 'Halo admin');
}

module.exports = { adminPing, login, logout, mahasiswaPing, me, refresh, register };
