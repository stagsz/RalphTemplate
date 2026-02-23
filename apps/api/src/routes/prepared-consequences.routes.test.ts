/**
 * API integration tests for prepared consequences endpoints.
 *
 * Tests the full API flow for prepared consequence templates.
 * These endpoints are public and don't require authentication.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';

// Import the routes
import preparedConsequencesRoutes from './prepared-consequences.routes.js';

describe('Prepared Consequences API Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Create a fresh Express app for testing
    app = express();
    app.use(express.json());
    app.use('/prepared-consequences', preparedConsequencesRoutes);
  });

  describe('GET /prepared-consequences', () => {
    it('should return all prepared consequences', async () => {
      const response = await request(app).get('/prepared-consequences');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('consequence');
      expect(response.body.data.answers).toBeDefined();
      expect(Array.isArray(response.body.data.answers)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include all required properties for each consequence', async () => {
      const response = await request(app).get('/prepared-consequences');

      expect(response.status).toBe(200);

      const firstConsequence = response.body.data.answers[0];
      expect(firstConsequence).toHaveProperty('id');
      expect(firstConsequence).toHaveProperty('text');
      expect(firstConsequence).toHaveProperty('applicableEquipmentTypes');
      expect(firstConsequence).toHaveProperty('applicableGuideWords');
      expect(firstConsequence).toHaveProperty('isCommon');
      expect(firstConsequence).toHaveProperty('sortOrder');

      // Verify types
      expect(typeof firstConsequence.id).toBe('string');
      expect(typeof firstConsequence.text).toBe('string');
      expect(Array.isArray(firstConsequence.applicableEquipmentTypes)).toBe(true);
      expect(Array.isArray(firstConsequence.applicableGuideWords)).toBe(true);
      expect(typeof firstConsequence.isCommon).toBe('boolean');
      expect(typeof firstConsequence.sortOrder).toBe('number');
    });

    it('should filter by equipment type', async () => {
      const response = await request(app).get('/prepared-consequences?equipmentType=pump');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toBeDefined();

      // All results should be applicable to pumps (empty array means universal)
      response.body.data.answers.forEach(
        (consequence: { applicableEquipmentTypes: string[] }) => {
          expect(
            consequence.applicableEquipmentTypes.length === 0 ||
              consequence.applicableEquipmentTypes.includes('pump')
          ).toBe(true);
        }
      );
    });

    it('should filter by guide word', async () => {
      const response = await request(app).get('/prepared-consequences?guideWord=more');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toBeDefined();

      // All results should be applicable to "more" guide word
      response.body.data.answers.forEach((consequence: { applicableGuideWords: string[] }) => {
        expect(
          consequence.applicableGuideWords.length === 0 ||
            consequence.applicableGuideWords.includes('more')
        ).toBe(true);
      });
    });

    it('should filter by commonOnly', async () => {
      const response = await request(app).get('/prepared-consequences?commonOnly=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // All results should be common
      response.body.data.answers.forEach((consequence: { isCommon: boolean }) => {
        expect(consequence.isCommon).toBe(true);
      });
    });

    it('should return validation error for invalid equipment type', async () => {
      const response = await request(app).get('/prepared-consequences?equipmentType=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid guide word', async () => {
      const response = await request(app).get('/prepared-consequences?guideWord=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-consequences/common', () => {
    it('should return only common prepared consequences', async () => {
      const response = await request(app).get('/prepared-consequences/common');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('consequence');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All should be common
      response.body.data.answers.forEach((consequence: { isCommon: boolean }) => {
        expect(consequence.isCommon).toBe(true);
      });
    });
  });

  describe('GET /prepared-consequences/stats', () => {
    it('should return statistics about prepared consequences', async () => {
      const response = await request(app).get('/prepared-consequences/stats');

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

  describe('GET /prepared-consequences/by-equipment/:type', () => {
    it('should return consequences for pump equipment type', async () => {
      const response = await request(app).get('/prepared-consequences/by-equipment/pump');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('pump');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return consequences for reactor equipment type', async () => {
      const response = await request(app).get('/prepared-consequences/by-equipment/reactor');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('reactor');
      expect(response.body.data.count).toBeGreaterThan(0);

      // Verify reactor-specific consequences are included
      const texts = response.body.data.answers.map((c: { text: string }) => c.text.toLowerCase());
      expect(
        texts.some(
          (t: string) => t.includes('reactor') || t.includes('runaway') || t.includes('explosion')
        )
      ).toBe(true);
    });

    it('should return 400 for invalid equipment type', async () => {
      const response = await request(app).get('/prepared-consequences/by-equipment/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-consequences/by-guide-word/:guideWord', () => {
    it('should return consequences for "more" guide word', async () => {
      const response = await request(app).get('/prepared-consequences/by-guide-word/more');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('more');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return consequences for "no" guide word', async () => {
      const response = await request(app).get('/prepared-consequences/by-guide-word/no');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('no');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return consequences for "other_than" guide word', async () => {
      const response = await request(app).get('/prepared-consequences/by-guide-word/other_than');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('other_than');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return 400 for invalid guide word', async () => {
      const response = await request(app).get('/prepared-consequences/by-guide-word/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-consequences/context', () => {
    it('should return consequences for reactor + more combination', async () => {
      const response = await request(app).get(
        '/prepared-consequences/context?equipmentType=reactor&guideWord=more'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('reactor');
      expect(response.body.data.guideWord).toBe('more');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All results should be applicable to both reactor and "more"
      response.body.data.answers.forEach(
        (consequence: { applicableEquipmentTypes: string[]; applicableGuideWords: string[] }) => {
          const appliesToReactor =
            consequence.applicableEquipmentTypes.length === 0 ||
            consequence.applicableEquipmentTypes.includes('reactor');
          const appliesToMore =
            consequence.applicableGuideWords.length === 0 ||
            consequence.applicableGuideWords.includes('more');
          expect(appliesToReactor && appliesToMore).toBe(true);
        }
      );
    });

    it('should return 400 when equipmentType is missing', async () => {
      const response = await request(app).get('/prepared-consequences/context?guideWord=more');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Equipment type');
    });

    it('should return 400 when guideWord is missing', async () => {
      const response = await request(app).get(
        '/prepared-consequences/context?equipmentType=reactor'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Guide word');
    });

    it('should return 400 for invalid equipment type', async () => {
      const response = await request(app).get(
        '/prepared-consequences/context?equipmentType=invalid&guideWord=more'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid guide word', async () => {
      const response = await request(app).get(
        '/prepared-consequences/context?equipmentType=reactor&guideWord=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-consequences/search', () => {
    it('should search consequences by text', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=fire');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('consequence');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All results should contain "fire" in text or description
      response.body.data.answers.forEach(
        (consequence: { text: string; description?: string }) => {
          const matchesText = consequence.text.toLowerCase().includes('fire');
          const matchesDescription =
            consequence.description && consequence.description.toLowerCase().includes('fire');
          expect(matchesText || matchesDescription).toBe(true);
        }
      );
    });

    it('should search consequences case-insensitively', async () => {
      const response1 = await request(app).get('/prepared-consequences/search?q=EXPLOSION');
      const response2 = await request(app).get('/prepared-consequences/search?q=explosion');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.count).toBe(response2.body.data.count);
    });

    it('should return empty array when no matches', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=xyznonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app).get('/prepared-consequences/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when query is empty', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-consequences/:id', () => {
    it('should return a single prepared consequence by ID', async () => {
      // First get all consequences to find a valid ID
      const allResponse = await request(app).get('/prepared-consequences');
      expect(allResponse.status).toBe(200);

      const firstConsequence = allResponse.body.data.answers[0];
      const response = await request(app).get(`/prepared-consequences/${firstConsequence.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(firstConsequence.id);
      expect(response.body.data.text).toBe(firstConsequence.text);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).get(
        '/prepared-consequences/00000000-0000-0000-0000-000000000000'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for invalid UUID format', async () => {
      const response = await request(app).get('/prepared-consequences/invalid-uuid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Consequence Categories Coverage', () => {
    it('should include safety consequences', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=injury');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include fire and explosion consequences', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=explosion');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include environmental consequences', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=release');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include equipment damage consequences', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=damage');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include production consequences', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=production');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include regulatory consequences', async () => {
      const response = await request(app).get('/prepared-consequences/search?q=regulatory');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });
  });
});
