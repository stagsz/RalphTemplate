/**
 * Report template routes.
 *
 * Provides endpoints for report template operations:
 * - GET /templates - List available report templates
 *
 * Templates are used to customize report output formats and content.
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { listTemplates } from '../controllers/reports.controller.js';

const router = Router();

/**
 * GET /templates
 * List available report templates with optional filtering and pagination.
 * Any authenticated user can view available templates.
 *
 * Query parameters:
 * - page: number (1-based, default 1)
 * - limit: number (default 20, max 100)
 * - format: 'pdf' | 'word' | 'excel' | 'powerpoint' (filter by supported format)
 * - isActive: 'true' | 'false' (filter by active status, default shows all)
 *
 * Returns:
 * - data: Array of templates with creator details
 * - meta: Pagination metadata (page, limit, total, totalPages, hasNextPage, hasPrevPage)
 *
 * Template objects include:
 * - id: Template UUID
 * - name: Template name
 * - description: Template description
 * - templatePath: Path to template file in storage
 * - supportedFormats: Array of supported output formats
 * - isActive: Whether template is available for use
 * - createdById: ID of user who created the template
 * - createdAt: Creation timestamp
 * - createdByName: Name of creator
 * - createdByEmail: Email of creator
 */
router.get('/', authenticate, requireAuth, listTemplates);

export default router;
