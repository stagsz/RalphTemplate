/**
 * Sessions routes.
 *
 * Provides endpoints for collaboration session operations:
 * - POST /sessions/:id/join - Join a collaboration session
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { joinCollaborationSession } from '../controllers/analyses.controller.js';

const router = Router();

/**
 * POST /sessions/:id/join
 * Join a collaboration session.
 *
 * Allows an authenticated user to join an existing collaboration session.
 * The user must have access to the project that owns the analysis associated
 * with the session.
 *
 * Path parameters:
 * - id: string (required) - Session UUID
 *
 * Returns:
 * - session: The collaboration session with active participants
 *   - id: Session UUID
 *   - analysisId: Analysis UUID
 *   - name: Session name (if provided)
 *   - status: Session status
 *   - createdById: Creator's user UUID
 *   - createdByName: Creator's name
 *   - createdByEmail: Creator's email
 *   - createdAt: ISO timestamp
 *   - updatedAt: ISO timestamp
 *   - endedAt: ISO timestamp (if ended)
 *   - notes: Session notes
 *   - participants: Array of active participants with user details
 * - participant: The joining user's participant details
 *   - id: Participant UUID
 *   - userId: User UUID
 *   - userName: User's name
 *   - userEmail: User's email
 *   - joinedAt: ISO timestamp
 *   - isActive: true
 *   - cursorPosition: null (initially)
 *   - lastActivityAt: ISO timestamp
 *
 * Status codes:
 * - 200: Successfully joined session
 * - 400: Invalid session ID format
 * - 401: Not authenticated
 * - 403: Not authorized to access this session's analysis
 * - 404: Session not found
 * - 409: Session is not active (cannot join ended/paused sessions)
 * - 500: Internal server error
 */
router.post('/:id/join', authenticate, requireAuth, joinCollaborationSession);

export default router;
