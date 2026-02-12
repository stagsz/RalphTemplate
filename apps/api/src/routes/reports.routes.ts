/**
 * Report routes.
 *
 * Provides endpoints for report operations:
 * - GET /reports/:id/status - Get report generation status
 * - GET /reports/:id/download - Download a generated report
 *
 * Report creation is handled via POST /projects/:id/reports in projects.routes.ts.
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { getReportStatus, downloadReport } from '../controllers/reports.controller.js';

const router = Router();

/**
 * GET /reports/:id/status
 * Get the current status of a report generation job.
 *
 * Path parameters:
 * - id: string (required) - Report UUID
 *
 * Returns the report status including:
 * - reportId: The report ID
 * - status: pending | generating | completed | failed
 * - progress: 0-100 percentage (if available)
 * - downloadUrl: Signed URL for downloading the report (if completed)
 * - errorMessage: Error details (if failed)
 * - completedAt: Timestamp when generation completed (if completed)
 *
 * Only accessible if the user is a member of the project that owns the report.
 */
router.get('/:id/status', authenticate, requireAuth, getReportStatus);

/**
 * GET /reports/:id/download
 * Download a generated report.
 *
 * Path parameters:
 * - id: string (required) - Report UUID
 *
 * Query parameters:
 * - expiresIn: number (optional) - URL expiration time in seconds (1-604800, default: 3600)
 *
 * Returns:
 * - downloadUrl: Signed URL for downloading the report file
 * - filename: The filename for the download
 * - mimeType: The MIME type of the report file
 * - fileSize: The size of the file in bytes
 * - format: The report format (pdf, word, excel, powerpoint)
 * - expiresIn: How long the URL is valid for (seconds)
 *
 * Only accessible if the user is a member of the project that owns the report.
 * Returns 409 Conflict if the report is not yet completed.
 */
router.get('/:id/download', authenticate, requireAuth, downloadReport);

export default router;
