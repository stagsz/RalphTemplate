/**
 * Prepared Recommendations routes.
 *
 * Provides endpoints for prepared recommendation answer templates:
 * - GET /prepared-recommendations - List all prepared recommendations with optional filtering
 * - GET /prepared-recommendations/common - List common/recommended recommendations
 * - GET /prepared-recommendations/stats - Get statistics about prepared recommendations
 * - GET /prepared-recommendations/by-equipment/:type - Get recommendations for equipment type
 * - GET /prepared-recommendations/by-guide-word/:guideWord - Get recommendations for guide word
 * - GET /prepared-recommendations/context - Get recommendations for equipment type and guide word
 * - GET /prepared-recommendations/search - Search recommendations by text
 * - GET /prepared-recommendations/:id - Get a single prepared recommendation by ID
 *
 * These endpoints are public (no authentication required) since prepared recommendations
 * are static reference data for HazOps analysis templates.
 */

import { Router } from 'express';
import {
  listPreparedRecommendations,
  listCommonPreparedRecommendations,
  getPreparedRecommendationsStatistics,
  getPreparedRecommendationsByEquipmentType,
  getPreparedRecommendationsByGuideWord,
  getPreparedRecommendationsByContext,
  searchPreparedRecommendationsHandler,
  getPreparedRecommendation,
} from '../controllers/prepared-recommendations.controller.js';

const router = Router();

/**
 * GET /prepared-recommendations
 * List all prepared recommendations with optional filtering.
 *
 * Query parameters:
 * - equipmentType: Filter by equipment type (pump, valve, reactor, etc.)
 * - guideWord: Filter by guide word (no, more, less, etc.)
 * - commonOnly: Only return common recommendations (true/false)
 * - search: Search text to filter recommendations
 *
 * Returns all prepared recommendation templates for HazOps analysis.
 */
router.get('/', listPreparedRecommendations);

/**
 * GET /prepared-recommendations/common
 * List common/recommended prepared recommendations.
 *
 * Returns only the recommendations marked as commonly used or recommended.
 * Useful for quick selection during analysis.
 */
router.get('/common', listCommonPreparedRecommendations);

/**
 * GET /prepared-recommendations/stats
 * Get statistics about prepared recommendations.
 *
 * Returns counts of recommendations by equipment type, guide word, and common status.
 * Useful for understanding the coverage of prepared answers.
 */
router.get('/stats', getPreparedRecommendationsStatistics);

/**
 * GET /prepared-recommendations/by-equipment/:type
 * Get prepared recommendations applicable to a specific equipment type.
 *
 * Path parameters:
 * - type: string (required) - Equipment type (pump, valve, reactor, heat_exchanger, tank, pipe, other)
 *
 * Returns recommendations that are applicable to the specified equipment type,
 * including universal recommendations that apply to all equipment.
 */
router.get('/by-equipment/:type', getPreparedRecommendationsByEquipmentType);

/**
 * GET /prepared-recommendations/by-guide-word/:guideWord
 * Get prepared recommendations applicable to a specific guide word.
 *
 * Path parameters:
 * - guideWord: string (required) - Guide word (no, more, less, reverse, early, late, other_than)
 *
 * Returns recommendations that are applicable to the specified guide word,
 * including universal recommendations that apply to all guide words.
 */
router.get('/by-guide-word/:guideWord', getPreparedRecommendationsByGuideWord);

/**
 * GET /prepared-recommendations/context
 * Get prepared recommendations for a specific equipment type and guide word combination.
 *
 * Query parameters:
 * - equipmentType: string (required) - Equipment type
 * - guideWord: string (required) - Guide word
 *
 * Returns recommendations that are applicable to both the equipment type and guide word,
 * providing context-aware suggestions during HazOps analysis.
 */
router.get('/context', getPreparedRecommendationsByContext);

/**
 * GET /prepared-recommendations/search
 * Search prepared recommendations by text.
 *
 * Query parameters:
 * - q: string (required) - Search query
 *
 * Searches recommendation text and descriptions for matching terms.
 */
router.get('/search', searchPreparedRecommendationsHandler);

/**
 * GET /prepared-recommendations/:id
 * Get a single prepared recommendation by its ID.
 *
 * Path parameters:
 * - id: string (required) - The prepared recommendation ID
 *
 * Returns 404 if the prepared recommendation is not found.
 */
router.get('/:id', getPreparedRecommendation);

export default router;
