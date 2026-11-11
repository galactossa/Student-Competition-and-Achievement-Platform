process.env.JWT_SECRET = 'test-access-secret-with-enough-length';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-enough-length';
process.env.NODE_ENV = 'test';

const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../src/app');
const models = require('../src/models');
const { activeRefreshTokens } = require('../src/utils/jwt');

let users;
let students;
let nextUserId;
let nextStudentId;

function findUser(where = {}) {
  return users.find((user) => Object.entries(where).every(([key, value]) => user[key] == value));
}

async function addUser({
  name = 'Test User',
  email = 'test@scap.test',
  password = 'Password123!',
  role = 'mahasiswa',
  isActive = true,
  student = null
} = {}) {
  const user = {
    id: nextUserId++,
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    isActive,
    student
  };
  users.push(user);
  return user;
}

beforeEach(() => {
  users = [];
  students = [];
  nextUserId = 1;
  nextStudentId = 1;
  activeRefreshTokens.clear();

  models.sequelize.transaction = jest.fn(async () => ({
    commit: jest.fn(async () => {}),
    rollback: jest.fn(async () => {})
  }));
  models.User.findOne = jest.fn(async ({ where }) => findUser(where) || null);
  models.User.findByPk = jest.fn(async (id) => findUser({ id: Number(id) }) || null);
  models.User.create = jest.fn(async (attributes) => {
    const user = { id: nextUserId++, isActive: true, student: null, ...attributes };
    users.push(user);
    return user;
  });
  models.Student.create = jest.fn(async (attributes) => {
    const student = { id: nextStudentId++, ...attributes };
    students.push(student);
    const user = findUser({ id: attributes.user_id });
    if (user) user.student = student;
    return student;
  });
});

describe('SCAP authentication API', () => {
  test('registers a user and student profile with a hashed password', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Mahasiswa Test',
      email: 'baru@scap.test',
      password: 'Password123!',
      nim: '12345678',
      program_studi: 'Informatika',
      angkatan: 2024
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      name: 'Mahasiswa Test',
      email: 'baru@scap.test',
      role: 'mahasiswa'
    });
    expect(response.body.data.student).toMatchObject({
      nim: '12345678',
      program_studi: 'Informatika'
    });
    expect(users[0].password).not.toBe('Password123!');
    expect(await bcrypt.compare('Password123!', users[0].password)).toBe(true);
    expect(response.body.data.user.password).toBeUndefined();
  });

  test('rejects duplicate email with 409', async () => {
    await addUser();
    const response = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: 'test@scap.test',
      password: 'Password123!'
    });

    expect(response.status).toBe(409);
  });

  test.each([
    [{ name: 'Test User', email: 'test@scap.test', password: 'Pass1' }],
    [{ name: 'Test User', email: 'invalid-email', password: 'Password123!' }]
  ])('rejects invalid registration input with 422', async (body) => {
    const response = await request(app).post('/api/auth/register').send(body);
    expect(response.status).toBe(422);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test('logs in and returns access and refresh tokens', async () => {
    await addUser();
    const response = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.refreshToken).toBeTruthy();
    expect(response.body.data.user.password).toBeUndefined();
  });

  test('rejects incorrect password with 401', async () => {
    await addUser();
    const response = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'WrongPass123'
    });
    expect(response.status).toBe(401);
  });

  test('rejects inactive users with 403', async () => {
    await addUser({ isActive: false });
    const response = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });
    expect(response.status).toBe(403);
  });

  test('requires a bearer token for /me', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  test('returns current user data with a valid token', async () => {
    const user = await addUser({
      student: {
        id: 8,
        nim: '12345678',
        program_studi: 'Informatika',
        angkatan: 2024,
        phone: null,
        photo_url: null,
        is_public: false,
        slug: 'test-user-12345678'
      }
    });
    const login = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'Password123!'
    });
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ id: user.id, email: user.email });
    expect(response.body.data.student.nim).toBe('12345678');
  });

  test('refreshes a valid refresh token', async () => {
    await addUser();
    const login = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });
    const response = await request(app).post('/api/auth/refresh').send({
      refreshToken: login.body.data.refreshToken
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.accessToken).not.toBe(login.body.data.accessToken);
  });

  test('logout revokes the associated refresh token', async () => {
    await addUser();
    const login = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });
    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    const refresh = await request(app).post('/api/auth/refresh').send({
      refreshToken: login.body.data.refreshToken
    });

    expect(logout.status).toBe(200);
    expect(logout.body.message).toBe('Logout berhasil');
    expect(refresh.status).toBe(401);
  });

  test('allows mahasiswa on the mahasiswa ping', async () => {
    await addUser();
    const login = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });
    const response = await request(app)
      .get('/api/auth/ping/mahasiswa')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Halo mahasiswa');
  });

  test('denies admin_pka on the mahasiswa ping', async () => {
    await addUser({ role: 'admin_pka' });
    const login = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });
    const response = await request(app)
      .get('/api/auth/ping/mahasiswa')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(response.status).toBe(403);
  });

  test('allows super_admin on the admin ping', async () => {
    await addUser({ role: 'super_admin' });
    const login = await request(app).post('/api/auth/login').send({
      email: 'test@scap.test',
      password: 'Password123!'
    });
    const response = await request(app)
      .get('/api/auth/ping/admin')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Halo admin');
  });
});
