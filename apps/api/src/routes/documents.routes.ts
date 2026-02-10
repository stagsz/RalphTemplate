/**
 * Document routes.
 *
 * Provides endpoints for P&ID document operations:
 * - GET /documents/:id - Get a document by ID
 * - GET /documents/:id/download - Get a signed download URL for a document
 * - DELETE /documents/:id - Delete a document
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { getDocumentById, deleteDocumentById, downloadDocument } from '../controllers/documents.controller.js';

const router = Router();

/**
 * GET /documents/:id
 * Get a P&ID document by ID.
 *
 * Path parameters:
 * - id: string (required) - Document UUID
 *
 * Returns the document details with uploader info.
 * Only accessible if the user is a member of the project that owns the document.
 */
router.get('/:id', authenticate, requireAuth, getDocumentById);

/**
 * GET /documents/:id/download
 * Get a signed download URL for a P&ID document.
 *
 * Path parameters:
 * - id: string (required) - Document UUID
 *
 * Query parameters:
 * - expiresIn: number (optional) - URL expiration time in seconds (default: 3600, max: 604800)
 *
 * Returns a signed URL that allows direct download from MinIO.
 * Only accessible if the user is a member of the project that owns the document.
 */
router.get('/:id/download', authenticate, requireAuth, downloadDocument);

/**
 * DELETE /documents/:id
 * Delete a P&ID document by ID.
 *
 * Path parameters:
 * - id: string (required) - Document UUID
 *
 * Deletes the document record and associated file from storage.
 * Only accessible by project members with owner, lead, or member role.
 * Viewers cannot delete documents.
 */
router.delete('/:id', authenticate, requireAuth, deleteDocumentById);

export default router;
