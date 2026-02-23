/**
 * Prepared Causes routes.
 *
 * Provides endpoints for prepared cause answer templates:
 * - GET /prepared-causes - List all prepared causes with optional filtering
 * - GET /prepared-causes/common - List common/recommended causes
 * - GET /prepared-causes/stats - Get statistics about prepared causes
 * - GET /prepared-causes/by-equipment/:type - Get causes for equipment type
 * - GET /prepared-causes/by-guide-word/:guideWord - Get causes for guide word
 * - GET /prepared-causes/context - Get causes for equipment type and guide word
 * - GET /prepared-causes/search - Search causes by text
 * - GET /prepared-causes/:id - Get a single prepared cause by ID
 *
 * These endpoints are public (no authentication required) since prepared causes
 * are static reference data for HazOps analysis templates.
 */

import { Router } from 'express';
import {
  listPreparedCauses,
  listCommonPreparedCauses,
  getPreparedCausesStatistics,
  getPreparedCausesByEquipmentType,
  getPreparedCausesByGuideWord,
  getPreparedCausesByContext,
  searchPreparedCausesHandler,
  getPreparedCause,
} from '../controllers/prepared-causes.controller.js';

const router = Router();

/**
 * GET /prepared-causes
 * List all prepared causes with optional filtering.
 *
 * Query parameters:
 * - equipmentType: Filter by equipment type (pump, valve, reactor, etc.)
 * - guideWord: Filter by guide word (no, more, less, etc.)
 * - commonOnly: Only return common causes (true/false)
 * - search: Search text to filter causes
 *
 * Returns all prepared cause templates for HazOps analysis.
 */
router.get('/', listPreparedCauses);

/**
 * GET /prepared-causes/common
 * List common/recommended prepared causes.
 *
 * Returns only the causes marked as commonly used or recommended.
 * Useful for quick selection during analysis.
 */
router.get('/common', listCommonPreparedCauses);

/**
 * GET /prepared-causes/stats
 * Get statistics about prepared causes.
 *
 * Returns counts of causes by equipment type, guide word, and common status.
 * Useful for understanding the coverage of prepared answers.
 */
router.get('/stats', getPreparedCausesStatistics);

/**
 * GET /prepared-causes/by-equipment/:type
 * Get prepared causes applicable to a specific equipment type.
 *
 * Path parameters:
 * - type: string (required) - Equipment type (pump, valve, reactor, heat_exchanger, tank, pipe, other)
 *
 * Returns causes that are applicable to the specified equipment type,
 * including universal causes that apply to all equipment.
 */
router.get('/by-equipment/:type', getPreparedCausesByEquipmentType);

/**
 * GET /prepared-causes/by-guide-word/:guideWord
 * Get prepared causes applicable to a specific guide word.
 *
 * Path parameters:
 * - guideWord: string (required) - Guide word (no, more, less, reverse, early, late, other_than)
 *
 * Returns causes that are applicable to the specified guide word,
 * including universal causes that apply to all guide words.
 */
router.get('/by-guide-word/:guideWord', getPreparedCausesByGuideWord);

/**
 * GET /prepared-causes/context
 * Get prepared causes for a specific equipment type and guide word combination.
 *
 * Query parameters:
 * - equipmentType: string (required) - Equipment type
 * - guideWord: string (required) - Guide word
 *
 * Returns causes that are applicable to both the equipment type and guide word,
 * providing context-aware suggestions during HazOps analysis.
 */
router.get('/context', getPreparedCausesByContext);

/**
 * GET /prepared-causes/search
 * Search prepared causes by text.
 *
 * Query parameters:
 * - q: string (required) - Search query
 *
 * Searches cause text and descriptions for matching terms.
 */
router.get('/search', searchPreparedCausesHandler);

/**
 * GET /prepared-causes/:id
 * Get a single prepared cause by its ID.
 *
 * Path parameters:
 * - id: string (required) - The prepared cause ID
 *
 * Returns 404 if the prepared cause is not found.
 */
router.get('/:id', getPreparedCause);

export default router;
