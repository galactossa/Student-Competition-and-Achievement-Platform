const { UniqueConstraintError } = require('sequelize');
const { sequelize, Student, User } = require('../models');
const AppError = require('../utils/appError');
const { comparePassword, hashPassword } = require('../utils/password');
const {
  issueTokenPair,
  revokeRefreshToken,
  signAccessToken,
  verifyRefresh
} = require('../utils/jwt');

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function makeStudentSlug(name, nim) {
  const suffix = String(nim);
  const base = `${name}-${suffix}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length <= 100) return base;

  const namePart = base.slice(0, 99 - suffix.length).replace(/-+$/g, '');
  return `${namePart}-${suffix}`;
}

async function register(input) {
  const existingUser = await User.findOne({ where: { email: input.email } });
  if (existingUser) throw new AppError('Email sudah terdaftar.', 409);

  let transaction;
  try {
    transaction = await sequelize.transaction();
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: 'mahasiswa'
    }, { transaction });

    let student = null;
    if (input.nim && input.program_studi) {
      student = await Student.create({
        user_id: user.id,
        nim: input.nim,
        program_studi: input.program_studi,
        angkatan: input.angkatan || new Date().getFullYear(),
        slug: makeStudentSlug(input.name, input.nim)
      }, { transaction });
    }

    await transaction.commit();
    return {
      user: publicUser(user),
      student: student
        ? { id: student.id, nim: student.nim, program_studi: student.program_studi }
        : null,
      ...issueTokenPair(user)
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    if (err instanceof UniqueConstraintError) {
      throw new AppError('Email atau NIM sudah terdaftar.', 409);
    }
    throw err;
  }
}

async function login({ email, password }) {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Student, as: 'student' }]
  });
  if (!user) {
    throw new AppError('Email atau password salah.', 401);
  }
  if (!user.isActive) throw new AppError('Akun Anda tidak aktif.', 403);
  if (!(await comparePassword(password, user.password))) {
    throw new AppError('Email atau password salah.', 401);
  }

  return { user: publicUser(user), ...issueTokenPair(user) };
}

async function refresh(token) {
  const payload = verifyRefresh(token);
  const user = await User.findByPk(payload.sub);
  if (!user) throw new AppError('Akun tidak ditemukan.', 401);
  if (!user.isActive) throw new AppError('Akun Anda tidak aktif.', 403);
  return { accessToken: signAccessToken(user, payload.jti) };
}

function logout(sessionId) {
  revokeRefreshToken(sessionId);
}

async function getMe(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'role'],
    include: [{ model: Student, as: 'student' }]
  });
  if (!user) throw new AppError('Akun tidak ditemukan.', 404);
  const student = user.student
    ? {
      id: user.student.id,
      nim: user.student.nim,
      program_studi: user.student.program_studi,
      angkatan: user.student.angkatan,
      phone: user.student.phone,
      photo_url: user.student.photo_url,
      is_public: user.student.is_public,
      slug: user.student.slug
    }
    : null;

  return { user: publicUser(user), student };
}

module.exports = { getMe, login, logout, refresh, register };
