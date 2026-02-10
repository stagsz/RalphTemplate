/**
 * Documents controller for handling P&ID document operations.
 *
 * Handles:
 * - POST /projects/:id/documents - Upload a P&ID document
 */

import type { Request, Response } from 'express';
import {
  userHasProjectAccess,
  getUserProjectRole,
  findProjectById as findProjectByIdService,
} from '../services/project.service.js';
import { createPIDDocument } from '../services/pid-document.service.js';
import { uploadFile, generateStoragePath } from '../services/storage.service.js';
import { getUploadedFileBuffer, getUploadMeta } from '../middleware/upload.middleware.js';

/**
 * POST /projects/:id/documents
 * Upload a P&ID document to a project.
 * Only project members with appropriate roles can upload documents.
 *
 * Path parameters:
 * - id: string (required) - Project UUID
 *
 * Body (multipart/form-data):
 * - file: The P&ID document file (PDF, PNG, JPG, or DWG)
 *
 * Returns:
 * - 201: Created document with uploader info
 * - 400: Validation error (no file, invalid format)
 * - 401: Not authenticated
 * - 403: Not authorized to upload to this project
 * - 404: Project not found
 * - 500: Internal server error
 */
export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const { id: projectId } = req.params;

    // Get authenticated user ID
    const userId = (req.user as { id: string } | undefined)?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project ID format',
          errors: [
            {
              field: 'id',
              message: 'Project ID must be a valid UUID',
              code: 'INVALID_FORMAT',
            },
          ],
        },
      });
      return;
    }

    // Check if user has access to the project
    const hasAccess = await userHasProjectAccess(userId, projectId);
    if (!hasAccess) {
      // Check if project exists to return appropriate error
      const project = await findProjectByIdService(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      // Project exists but user doesn't have access
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this project',
        },
      });
      return;
    }

    // Get user's role - only owner, lead, and member can upload documents
    // Viewers cannot upload
    const userRole = await getUserProjectRole(userId, projectId);
    if (!userRole || userRole === 'viewer') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to upload documents to this project',
        },
      });
      return;
    }

    // Get uploaded file buffer and metadata
    const fileBuffer = getUploadedFileBuffer(req);
    const uploadMeta = getUploadMeta(req);

    if (!fileBuffer || !uploadMeta) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'A file is required for this request',
        },
      });
      return;
    }

    // Generate storage path and upload to MinIO
    const storagePath = generateStoragePath(projectId, uploadMeta.originalFilename);

    await uploadFile(fileBuffer, storagePath, uploadMeta.mimeType);

    // Create database record
    const document = await createPIDDocument({
      projectId,
      filename: uploadMeta.originalFilename,
      storagePath,
      mimeType: uploadMeta.mimeType,
      fileSize: uploadMeta.fileSize,
      uploadedById: userId,
    });

    res.status(201).json({
      success: true,
      data: { document },
    });
  } catch (error) {
    console.error('Upload document error:', error);

    // Handle storage path conflict (shouldn't happen with UUID-based paths, but just in case)
    if (error instanceof Error && 'code' in error) {
      const dbError = error as { code: string };
      if (dbError.code === '23505') {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A document with this storage path already exists',
          },
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while uploading the document',
      },
    });
  }
}
