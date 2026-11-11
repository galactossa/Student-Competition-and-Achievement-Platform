const fs = require('fs');
const path = require('path');
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
    expect(response.body.message).toMatch(/tidak ditemukan/i);
  });

  test('allows public frontend pages to load static upload assets cross-origin', async () => {
    const uploadsDirectory = path.resolve(__dirname, '../uploads');
    const filename = `cors-policy-test-${process.pid}.txt`;
    const filePath = path.join(uploadsDirectory, filename);
    fs.writeFileSync(filePath, 'test asset');

    try {
      const response = await request(app).get(`/uploads/${filename}`);
      expect(response.status).toBe(200);
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
      expect(response.text).toBe('test asset');
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});
