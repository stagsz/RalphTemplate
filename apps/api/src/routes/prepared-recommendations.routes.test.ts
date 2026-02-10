/**
 * API integration tests for prepared recommendations endpoints.
 *
 * Tests the full API flow for prepared recommendation templates.
 * These endpoints are public and don't require authentication.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';

// Import the routes
import preparedRecommendationsRoutes from './prepared-recommendations.routes.js';

describe('Prepared Recommendations API Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Create a fresh Express app for testing
    app = express();
    app.use(express.json());
    app.use('/prepared-recommendations', preparedRecommendationsRoutes);
  });

  describe('GET /prepared-recommendations', () => {
    it('should return all prepared recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('recommendation');
      expect(response.body.data.answers).toBeDefined();
      expect(Array.isArray(response.body.data.answers)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include all required properties for each recommendation', async () => {
      const response = await request(app).get('/prepared-recommendations');

      expect(response.status).toBe(200);

      const firstRecommendation = response.body.data.answers[0];
      expect(firstRecommendation).toHaveProperty('id');
      expect(firstRecommendation).toHaveProperty('text');
      expect(firstRecommendation).toHaveProperty('applicableEquipmentTypes');
      expect(firstRecommendation).toHaveProperty('applicableGuideWords');
      expect(firstRecommendation).toHaveProperty('isCommon');
      expect(firstRecommendation).toHaveProperty('sortOrder');

      // Verify types
      expect(typeof firstRecommendation.id).toBe('string');
      expect(typeof firstRecommendation.text).toBe('string');
      expect(Array.isArray(firstRecommendation.applicableEquipmentTypes)).toBe(true);
      expect(Array.isArray(firstRecommendation.applicableGuideWords)).toBe(true);
      expect(typeof firstRecommendation.isCommon).toBe('boolean');
      expect(typeof firstRecommendation.sortOrder).toBe('number');
    });

    it('should filter by equipment type', async () => {
      const response = await request(app).get('/prepared-recommendations?equipmentType=pump');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toBeDefined();

      // All results should be applicable to pumps (empty array means universal)
      response.body.data.answers.forEach((recommendation: { applicableEquipmentTypes: string[] }) => {
        expect(
          recommendation.applicableEquipmentTypes.length === 0 ||
            recommendation.applicableEquipmentTypes.includes('pump')
        ).toBe(true);
      });
    });

    it('should filter by guide word', async () => {
      const response = await request(app).get('/prepared-recommendations?guideWord=more');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toBeDefined();

      // All results should be applicable to "more" guide word
      response.body.data.answers.forEach((recommendation: { applicableGuideWords: string[] }) => {
        expect(
          recommendation.applicableGuideWords.length === 0 ||
            recommendation.applicableGuideWords.includes('more')
        ).toBe(true);
      });
    });

    it('should filter by commonOnly', async () => {
      const response = await request(app).get('/prepared-recommendations?commonOnly=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // All results should be common
      response.body.data.answers.forEach((recommendation: { isCommon: boolean }) => {
        expect(recommendation.isCommon).toBe(true);
      });
    });

    it('should return validation error for invalid equipment type', async () => {
      const response = await request(app).get('/prepared-recommendations?equipmentType=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid guide word', async () => {
      const response = await request(app).get('/prepared-recommendations?guideWord=invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-recommendations/common', () => {
    it('should return only common prepared recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations/common');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('recommendation');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All should be common
      response.body.data.answers.forEach((recommendation: { isCommon: boolean }) => {
        expect(recommendation.isCommon).toBe(true);
      });
    });
  });

  describe('GET /prepared-recommendations/stats', () => {
    it('should return statistics about prepared recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations/stats');

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

  describe('GET /prepared-recommendations/by-equipment/:type', () => {
    it('should return recommendations for pump equipment type', async () => {
      const response = await request(app).get('/prepared-recommendations/by-equipment/pump');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('pump');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // Verify pump-specific recommendations are included
      const texts = response.body.data.answers.map((r: { text: string }) => r.text.toLowerCase());
      expect(texts.some((t: string) => t.includes('pump') || t.includes('flow'))).toBe(true);
    });

    it('should return recommendations for reactor equipment type', async () => {
      const response = await request(app).get('/prepared-recommendations/by-equipment/reactor');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('reactor');
      expect(response.body.data.count).toBeGreaterThan(0);

      // Verify reactor-specific recommendations are included
      const texts = response.body.data.answers.map((r: { text: string }) => r.text.toLowerCase());
      expect(texts.some((t: string) => t.includes('reactor') || t.includes('reaction') || t.includes('cooling'))).toBe(true);
    });

    it('should return 400 for invalid equipment type', async () => {
      const response = await request(app).get('/prepared-recommendations/by-equipment/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-recommendations/by-guide-word/:guideWord', () => {
    it('should return recommendations for "more" guide word', async () => {
      const response = await request(app).get('/prepared-recommendations/by-guide-word/more');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('more');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return recommendations for "less" guide word', async () => {
      const response = await request(app).get('/prepared-recommendations/by-guide-word/less');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('less');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return recommendations for "other_than" guide word', async () => {
      const response = await request(app).get('/prepared-recommendations/by-guide-word/other_than');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guideWord).toBe('other_than');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return 400 for invalid guide word', async () => {
      const response = await request(app).get('/prepared-recommendations/by-guide-word/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-recommendations/context', () => {
    it('should return recommendations for pump + more combination', async () => {
      const response = await request(app).get(
        '/prepared-recommendations/context?equipmentType=pump&guideWord=more'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipmentType).toBe('pump');
      expect(response.body.data.guideWord).toBe('more');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All results should be applicable to both pump and "more"
      response.body.data.answers.forEach(
        (recommendation: { applicableEquipmentTypes: string[]; applicableGuideWords: string[] }) => {
          const appliesToPump =
            recommendation.applicableEquipmentTypes.length === 0 ||
            recommendation.applicableEquipmentTypes.includes('pump');
          const appliesToMore =
            recommendation.applicableGuideWords.length === 0 ||
            recommendation.applicableGuideWords.includes('more');
          expect(appliesToPump && appliesToMore).toBe(true);
        }
      );
    });

    it('should return 400 when equipmentType is missing', async () => {
      const response = await request(app).get('/prepared-recommendations/context?guideWord=more');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Equipment type');
    });

    it('should return 400 when guideWord is missing', async () => {
      const response = await request(app).get('/prepared-recommendations/context?equipmentType=pump');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Guide word');
    });

    it('should return 400 for invalid equipment type', async () => {
      const response = await request(app).get(
        '/prepared-recommendations/context?equipmentType=invalid&guideWord=more'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid guide word', async () => {
      const response = await request(app).get(
        '/prepared-recommendations/context?equipmentType=pump&guideWord=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-recommendations/search', () => {
    it('should search recommendations by text', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=install');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('recommendation');
      expect(response.body.data.answers).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);

      // All results should contain "install" in text or description
      response.body.data.answers.forEach((recommendation: { text: string; description?: string }) => {
        const matchesText = recommendation.text.toLowerCase().includes('install');
        const matchesDescription =
          recommendation.description && recommendation.description.toLowerCase().includes('install');
        expect(matchesText || matchesDescription).toBe(true);
      });
    });

    it('should search recommendations case-insensitively', async () => {
      const response1 = await request(app).get('/prepared-recommendations/search?q=TRAINING');
      const response2 = await request(app).get('/prepared-recommendations/search?q=training');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.count).toBe(response2.body.data.count);
    });

    it('should return empty array when no matches', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=xyznonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answers).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app).get('/prepared-recommendations/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when query is empty', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /prepared-recommendations/:id', () => {
    it('should return a single prepared recommendation by ID', async () => {
      // First get all recommendations to find a valid ID
      const allResponse = await request(app).get('/prepared-recommendations');
      expect(allResponse.status).toBe(200);

      const firstRecommendation = allResponse.body.data.answers[0];
      const response = await request(app).get(`/prepared-recommendations/${firstRecommendation.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(firstRecommendation.id);
      expect(response.body.data.text).toBe(firstRecommendation.text);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).get(
        '/prepared-recommendations/00000000-0000-0000-0000-000000000000'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for invalid UUID format', async () => {
      const response = await request(app).get('/prepared-recommendations/invalid-uuid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Recommendation-specific content verification', () => {
    it('should include key recommendation categories', async () => {
      const response = await request(app).get('/prepared-recommendations');

      expect(response.status).toBe(200);

      const texts = response.body.data.answers.map((r: { text: string }) => r.text.toLowerCase());

      // Verify key recommendation types exist
      expect(texts.some((t: string) => t.includes('install'))).toBe(true);
      expect(texts.some((t: string) => t.includes('procedure') || t.includes('sop'))).toBe(true);
      expect(texts.some((t: string) => t.includes('training'))).toBe(true);
      expect(texts.some((t: string) => t.includes('update'))).toBe(true);
      expect(texts.some((t: string) => t.includes('upgrade'))).toBe(true);
    });

    it('should include design modification recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=design');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should include instrumentation recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=switch');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);

      // Should have multiple switch-related recommendations (LSHH, PSHH, TSHH, etc.)
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('should include procedural recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=procedure');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);

      // Should have multiple procedure-related recommendations
      expect(response.body.data.count).toBeGreaterThanOrEqual(3);
    });

    it('should include training recommendations', async () => {
      const response = await request(app).get('/prepared-recommendations/search?q=training');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
    });
  });
});
