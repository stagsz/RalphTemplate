/**
 * Analyses routes.
 *
 * Provides endpoints for HazOps analysis session operations:
 * - GET /analyses/:id - Get analysis session details with progress metrics
 * - PUT /analyses/:id - Update analysis session metadata
 * - POST /analyses/:id/entries - Create analysis entry for node/guideword
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { getAnalysisById, updateAnalysis, createAnalysisEntry } from '../controllers/analyses.controller.js';

const router = Router();

/**
 * GET /analyses/:id
 * Get a HazOps analysis session by ID.
 *
 * Path parameters:
 * - id: string (required) - Analysis UUID
 *
 * Returns the analysis with progress metrics including:
 * - totalNodes: Total nodes in the document
 * - analyzedNodes: Nodes with at least one analysis entry
 * - totalEntries: Total analysis entries
 * - highRiskCount, mediumRiskCount, lowRiskCount: Risk distribution
 *
 * Only accessible if the user is a member of the project that owns the analysis.
 */
router.get('/:id', authenticate, requireAuth, getAnalysisById);

/**
 * PUT /analyses/:id
 * Update a HazOps analysis session metadata.
 *
 * Path parameters:
 * - id: string (required) - Analysis UUID
 *
 * Request body (all fields optional):
 * - name: string - Analysis session name (max 255 chars)
 * - description: string | null - Analysis description (null to clear)
 * - leadAnalystId: string - Lead analyst UUID
 *
 * Only draft analyses can be updated.
 * Only accessible if the user is a member of the project that owns the analysis.
 */
router.put('/:id', authenticate, requireAuth, updateAnalysis);

/**
 * POST /analyses/:id/entries
 * Create a new analysis entry for a node/guideword combination.
 *
 * Path parameters:
 * - id: string (required) - Analysis UUID
 *
 * Request body:
 * - nodeId: string (required) - Analysis node UUID
 * - guideWord: GuideWord (required) - Guide word to apply (no, more, less, reverse, early, late, other_than)
 * - parameter: string (required) - Parameter being analyzed (e.g., "flow", "pressure")
 * - deviation: string (required) - Description of the deviation
 * - causes: string[] (optional) - Possible causes (default [])
 * - consequences: string[] (optional) - Potential consequences (default [])
 * - safeguards: string[] (optional) - Existing safeguards (default [])
 * - recommendations: string[] (optional) - Recommended actions (default [])
 * - notes: string (optional) - Additional notes
 *
 * Only draft analyses can have entries added.
 * Only accessible if the user is a member of the project that owns the analysis.
 */
router.post('/:id/entries', authenticate, requireAuth, createAnalysisEntry);

export default router;
