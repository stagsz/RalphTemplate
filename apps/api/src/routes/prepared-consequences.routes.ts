/**
 * Prepared Consequences routes.
 *
 * Provides endpoints for prepared consequence answer templates:
 * - GET /prepared-consequences - List all prepared consequences with optional filtering
 * - GET /prepared-consequences/common - List common/recommended consequences
 * - GET /prepared-consequences/stats - Get statistics about prepared consequences
 * - GET /prepared-consequences/by-equipment/:type - Get consequences for equipment type
 * - GET /prepared-consequences/by-guide-word/:guideWord - Get consequences for guide word
 * - GET /prepared-consequences/context - Get consequences for equipment type and guide word
 * - GET /prepared-consequences/search - Search consequences by text
 * - GET /prepared-consequences/:id - Get a single prepared consequence by ID
 *
 * These endpoints are public (no authentication required) since prepared consequences
 * are static reference data for HazOps analysis templates.
 */

import { Router } from 'express';
import {
  listPreparedConsequences,
  listCommonPreparedConsequences,
  getPreparedConsequencesStatistics,
  getPreparedConsequencesByEquipmentType,
  getPreparedConsequencesByGuideWord,
  getPreparedConsequencesByContext,
  searchPreparedConsequencesHandler,
  getPreparedConsequence,
} from '../controllers/prepared-consequences.controller.js';

const router = Router();

/**
 * GET /prepared-consequences
 * List all prepared consequences with optional filtering.
 *
 * Query parameters:
 * - equipmentType: Filter by equipment type (pump, valve, reactor, etc.)
 * - guideWord: Filter by guide word (no, more, less, etc.)
 * - commonOnly: Only return common consequences (true/false)
 * - search: Search text to filter consequences
 *
 * Returns all prepared consequence templates for HazOps analysis.
 */
router.get('/', listPreparedConsequences);

/**
 * GET /prepared-consequences/common
 * List common/recommended prepared consequences.
 *
 * Returns only the consequences marked as commonly used or recommended.
 * Useful for quick selection during analysis.
 */
router.get('/common', listCommonPreparedConsequences);

/**
 * GET /prepared-consequences/stats
 * Get statistics about prepared consequences.
 *
 * Returns counts of consequences by equipment type, guide word, and common status.
 * Useful for understanding the coverage of prepared answers.
 */
router.get('/stats', getPreparedConsequencesStatistics);

/**
 * GET /prepared-consequences/by-equipment/:type
 * Get prepared consequences applicable to a specific equipment type.
 *
 * Path parameters:
 * - type: string (required) - Equipment type (pump, valve, reactor, heat_exchanger, tank, pipe, other)
 *
 * Returns consequences that are applicable to the specified equipment type,
 * including universal consequences that apply to all equipment.
 */
router.get('/by-equipment/:type', getPreparedConsequencesByEquipmentType);

/**
 * GET /prepared-consequences/by-guide-word/:guideWord
 * Get prepared consequences applicable to a specific guide word.
 *
 * Path parameters:
 * - guideWord: string (required) - Guide word (no, more, less, reverse, early, late, other_than)
 *
 * Returns consequences that are applicable to the specified guide word,
 * including universal consequences that apply to all guide words.
 */
router.get('/by-guide-word/:guideWord', getPreparedConsequencesByGuideWord);

/**
 * GET /prepared-consequences/context
 * Get prepared consequences for a specific equipment type and guide word combination.
 *
 * Query parameters:
 * - equipmentType: string (required) - Equipment type
 * - guideWord: string (required) - Guide word
 *
 * Returns consequences that are applicable to both the equipment type and guide word,
 * providing context-aware suggestions during HazOps analysis.
 */
router.get('/context', getPreparedConsequencesByContext);

/**
 * GET /prepared-consequences/search
 * Search prepared consequences by text.
 *
 * Query parameters:
 * - q: string (required) - Search query
 *
 * Searches consequence text and descriptions for matching terms.
 */
router.get('/search', searchPreparedConsequencesHandler);

/**
 * GET /prepared-consequences/:id
 * Get a single prepared consequence by its ID.
 *
 * Path parameters:
 * - id: string (required) - The prepared consequence ID
 *
 * Returns 404 if the prepared consequence is not found.
 */
router.get('/:id', getPreparedConsequence);

export default router;
