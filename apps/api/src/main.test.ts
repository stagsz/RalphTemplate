import request from 'supertest';
import app from './main.js';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('returns health status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'hazop-api',
      });
    });

    it('returns JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /', () => {
    it('returns welcome message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'HazOp Assistant API',
      });
    });

    it('returns JSON content type', async () => {
      const response = await request(app).get('/');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Unknown routes', () => {
    it('returns 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });
  });
});
