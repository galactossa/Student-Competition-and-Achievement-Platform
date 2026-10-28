const request = require('supertest');
const app = require('../src/app');

describe('SCAP API', () => {
  test('returns a standard health response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'SCAP API is running',
      data: { status: 'ok' }
    });
  });

  test('returns a standard response for unknown routes', async () => {
    const response = await request(app).get('/api/not-found');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not found/i);
  });
});
