process.env.NODE_ENV = 'test';

const request = require('supertest');
const { Op } = require('sequelize');
const app = require('../src/app');
const models = require('../src/models');

describe('Public landing page API', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('returns only verified achievements without sensitive student data', async () => {
    models.Achievement.findAll = jest.fn(async () => [{
      id: 8,
      date: '2026-10-12',
      certificate_url: '/private/certificate.pdf',
      status: 'verified',
      user: {
        name: 'Mahasiswa SCAP',
        email: 'private@example.test',
        student: {
          nim: '12345678',
          program_studi: 'Informatika',
          photo_url: '/uploads/students/photo.png'
        }
      },
      competition: { name: 'Hackathon Nasional', level: 'Nasional' },
      result: { title: 'Juara 1' }
    }]);

    const response = await request(app).get('/api/public/achievements');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{
      id: 8,
      student_name: 'Mahasiswa SCAP',
      program_studi: 'Informatika',
      photo_url: '/uploads/students/photo.png',
      competition_name: 'Hackathon Nasional',
      level: 'Nasional',
      result_title: 'Juara 1',
      date: '2026-10-12'
    }]);
    expect(JSON.stringify(response.body)).not.toContain('private@example.test');
    expect(JSON.stringify(response.body)).not.toContain('12345678');
    expect(JSON.stringify(response.body)).not.toContain('certificate.pdf');
    expect(models.Achievement.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'verified' },
      limit: 6,
      include: expect.arrayContaining([
        expect.objectContaining({ as: 'user', attributes: ['name'] }),
        expect.objectContaining({ as: 'competition', attributes: ['name', 'level'] }),
        expect.objectContaining({ as: 'result', attributes: ['title'] })
      ])
    }));
    const userInclude = models.Achievement.findAll.mock.calls[0][0].include.find(({ as }) => as === 'user');
    expect(userInclude.include[0]).toMatchObject({
      as: 'student',
      attributes: ['program_studi', 'photo_url']
    });
  });

  test('validates achievement limit and returns public statistics', async () => {
    models.Competition.count = jest.fn(async ({ where }) => {
      expect(where.status[Op.in]).toContain('published');
      return 12;
    });
    models.Achievement.count = jest.fn(async ({ where }) => {
      expect(where).toEqual({ status: 'verified' });
      return 7;
    });
    models.Student.count = jest.fn(async () => 120);
    models.Achievement.findAll = jest.fn(async () => []);

    const invalidLimit = await request(app).get('/api/public/achievements?limit=0');
    const achievements = await request(app).get('/api/public/achievements?limit=4');
    const stats = await request(app).get('/api/public/stats');

    expect(invalidLimit.status).toBe(422);
    expect(achievements.status).toBe(200);
    expect(models.Achievement.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 4 }));
    expect(stats.body.data).toEqual({
      total_competitions: 12,
      total_achievements: 7,
      total_students: 120
    });
  });
});
