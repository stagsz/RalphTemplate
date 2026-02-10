/**
 * API integration tests for prepared causes endpoints.
 *
 * Tests the full API flow for prepared cause templates.
 * These endpoints are public and don't require authentication.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';

// Import the routes
import preparedCausesRoutes from './prepared-causes.routes.js';

describe('Prepared Causes API Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Create a fresh Express app for testing
    app = express();
    app.use(express.json());
    app.use('/prepared-causes', preparedCausesRoutes);
  });

  describe('GET /prepared-causes', () => {
    it('should return all prepared causes', async () => {
      const response = await request(app).get('/prepared-causes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('cause');
      expect(response.body.data.answers).toBeDefined();
      expect(Array.isArray(response.body.data.answers)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include all required properties for each cause', async () => {
      const response = await request(app).get('/prepared-causes');

      expect(response.status).toBe(200);

      const firstCause = response.body.data.answers[0];
      expect(firstCause).toHaveProperty('id');
      expect(firstCause).toHaveProperty('text');
      expect(firstCause).toHaveProperty('applicableEquipmentTypes');
      expect(firstCause).toHaveProperty('applicableGuideWords');
      expect(firstCause).toHaveProperty('isCommon');
      expect(firstCause).toHaveProperty('sortOrder');

      // Verify types
      expect(typeof firstCause.id).toBe('string');
      expect(typeof firstCause.text).toBe('string');
      expect(Array.isArray(firstCause.applicableEquipmentTypes)).toBe(true);
      expect(Array.isArray(firstCause.applicableGuideWords)).toBe(true);
      expect(typeof firstCause.isCommon).toBe('boolean');
      expect(typeof firstCause.sortOrder).toBe('number');
    });

    it('should filter by equipment type', async () => {
      const response = await request(app).get('/prepared-causes?equipmentType=pump');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toBeDefined();

      // All results should be applicable to pumps (empty array means universal)
      response.body.data.answers.forEach((cause: { applicableEquipmentTypes: string[] }) => {
        expect(
          cause.applicableEquipmentTypes.length === 0 ||
            cause.applicableEquipmentTypes.includes('pump')
        ).toBe(true);
      });
    });

    it('should filter by guide word', async () => {
      const response = await request(app).get('/prepared-causes?guideWord=no');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toBeDefined();

      // All results should be applicable to "no" guide word
      response.body.data.answers.forEach((cause: { applicableGuideWords: string[] }) => {
        expect(
          cause.applicableGuideWords.length === 0 || cause.applicableGuideWords.includes('no')
        ).toBe(true);
      });
    });

    it('should filter by commonOnly', async () => {
      const response = await request(app).get('/prepared-causes?commonOnly=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // All results should be common
      response.body.data.answers.forEach((cause: { isCommon: boolean }) => {
        expect(cause.isCommon).toBe(true);
      });
    });

    it('should return validation error for invalid equipment type', async () => {
      const response = await request(app).get('/prepared-causes?equipmentType=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid guide word', async () => {
      const response = await request(app).get('/prepared-causes?guideWord=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-causes/common', () => {
    it('should return only common prepared causes', async () => {
      const response = await request(app).get('/prepared-causes/common');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('cause');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All should be common
      response.body.data.answers.forEach((cause: { isCommon: boolean }) => {
        expect(cause.isCommon).toBe(true);
      });
    });
  });

  describe('GET /prepared-causes/stats', () => {
    it('should return statistics about prepared causes', async () => {
      const response = await request(app).get('/prepared-causes/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('commonCount');
      expect(response.body.data).toHaveProperty('byEquipmentType');
      expect(response.body.data).toHaveProperty('byGuideWord');
      expect(response.body.data).toHaveProperty('universalCount');

      // Verify types
      expect(typeof response.body.data.totalCount).toBe('number');
      expect(typeof response.body.data.commonCount).toBe('number');
      expect(typeof response.body.data.byEquipmentType).toBe('object');
      expect(typeof response.body.data.byGuideWord).toBe('object');
      expect(typeof response.body.data.universalCount).toBe('number');

      // Verify equipment types in stats
      expect(response.body.data.byEquipmentType).toHaveProperty('pump');
      expect(response.body.data.byEquipmentType).toHaveProperty('valve');
      expect(response.body.data.byEquipmentType).toHaveProperty('reactor');

      // Verify guide words in stats
      expect(response.body.data.byGuideWord).toHaveProperty('no');
      expect(response.body.data.byGuideWord).toHaveProperty('more');
      expect(response.body.data.byGuideWord).toHaveProperty('less');
    });
  });

  describe('GET /prepared-causes/by-equipment/:type', () => {
    it('should return causes for pump equipment type', async () => {
      const response = await request(app).get('/prepared-causes/by-equipment/pump');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('pump');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // Verify pump-specific causes are included
      const texts = response.body.data.answers.map((c: { text: string }) => c.text.toLowerCase());
      expect(texts.some((t: string) => t.includes('pump'))).toBe(true);
    });

    it('should return causes for valve equipment type', async () => {
      const response = await request(app).get('/prepared-causes/by-equipment/valve');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('valve');
      expect(response.body.data.count).toBeGreaterThan(0);

      // Verify valve-specific causes are included
      const texts = response.body.data.answers.map((c: { text: string }) => c.text.toLowerCase());
      expect(texts.some((t: string) => t.includes('valve'))).toBe(true);
    });

    it('should return 400 for invalid equipment type', async () => {
      const response = await request(app).get('/prepared-causes/by-equipment/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-causes/by-guide-word/:guideWord', () => {
    it('should return causes for "no" guide word', async () => {
      const response = await request(app).get('/prepared-causes/by-guide-word/no');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('no');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return causes for "more" guide word', async () => {
      const response = await request(app).get('/prepared-causes/by-guide-word/more');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('more');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return causes for "other_than" guide word', async () => {
      const response = await request(app).get('/prepared-causes/by-guide-word/other_than');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('other_than');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return 400 for invalid guide word', async () => {
      const response = await request(app).get('/prepared-causes/by-guide-word/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-causes/context', () => {
    it('should return causes for pump + no combination', async () => {
      const response = await request(app).get(
        '/prepared-causes/context?equipmentType=pump&guideWord=no'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('pump');
      expect(response.body.data.guideWord).toBe('no');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All results should be applicable to both pump and "no"
      response.body.data.answers.forEach(
        (cause: { applicableEquipmentTypes: string[]; applicableGuideWords: string[] }) => {
          const appliesToPump =
            cause.applicableEquipmentTypes.length === 0 ||
            cause.applicableEquipmentTypes.includes('pump');
          const appliesToNo =
            cause.applicableGuideWords.length === 0 || cause.applicableGuideWords.includes('no');
          expect(appliesToPump && appliesToNo).toBe(true);
        }
      );
    });

    it('should return 400 when equipmentType is missing', async () => {
      const response = await request(app).get('/prepared-causes/context?guideWord=no');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Equipment type');
    });

    it('should return 400 when guideWord is missing', async () => {
      const response = await request(app).get('/prepared-causes/context?equipmentType=pump');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Guide word');
    });

    it('should return 400 for invalid equipment type', async () => {
      const response = await request(app).get(
        '/prepared-causes/context?equipmentType=invalid&guideWord=no'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid guide word', async () => {
      const response = await request(app).get(
        '/prepared-causes/context?equipmentType=pump&guideWord=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-causes/search', () => {
    it('should search causes by text', async () => {
      const response = await request(app).get('/prepared-causes/search?q=failure');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('cause');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All results should contain "failure" in text or description
      response.body.data.answers.forEach((cause: { text: string; description?: string }) => {
        const matchesText = cause.text.toLowerCase().includes('failure');
        const matchesDescription =
          cause.description && cause.description.toLowerCase().includes('failure');
        expect(matchesText || matchesDescription).toBe(true);
      });
    });

    it('should search causes case-insensitively', async () => {
      const response1 = await request(app).get('/prepared-causes/search?q=PUMP');
      const response2 = await request(app).get('/prepared-causes/search?q=pump');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.count).toBe(response2.body.data.count);
    });

    it('should return empty array when no matches', async () => {
      const response = await request(app).get('/prepared-causes/search?q=xyznonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app).get('/prepared-causes/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when query is empty', async () => {
      const response = await request(app).get('/prepared-causes/search?q=');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-causes/:id', () => {
    it('should return a single prepared cause by ID', async () => {
      // First get all causes to find a valid ID
      const allResponse = await request(app).get('/prepared-causes');
      expect(allResponse.status).toBe(200);

      const firstCause = allResponse.body.data.answers[0];
      const response = await request(app).get(`/prepared-causes/${firstCause.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(firstCause.id);
      expect(response.body.data.text).toBe(firstCause.text);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).get(
        '/prepared-causes/00000000-0000-0000-0000-000000000000'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for invalid UUID format', async () => {
      const response = await request(app).get('/prepared-causes/invalid-uuid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
