/**
 * Analyses routes.
 *
 * Provides endpoints for HazOps analysis session operations:
 * - GET /analyses/:id - Get analysis session details with progress metrics
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { getAnalysisById } from '../controllers/analyses.controller.js';

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

export default router;
