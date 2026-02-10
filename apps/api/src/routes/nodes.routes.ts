/**
 * Node routes.
 *
 * Provides endpoints for analysis node operations:
 * - PUT /nodes/:id - Update an existing analysis node
 * - DELETE /nodes/:id - Delete an existing analysis node
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';
import { updateNode, deleteNode } from '../controllers/documents.controller.js';

const router = Router();

/**
 * PUT /nodes/:id
 * Update an existing analysis node.
 *
 * Path parameters:
 * - id: string (required) - Node UUID
 *
 * Body (all fields optional):
 * - nodeId: string - User-defined node identifier (e.g., "P-101")
 * - description: string - Description of the node/equipment
 * - equipmentType: EquipmentType - Type of equipment
 * - x: number - X coordinate as percentage (0-100)
 * - y: number - Y coordinate as percentage (0-100)
 *
 * Only accessible by project members with owner, lead, or member role.
 * Viewers cannot update nodes.
 */
router.put('/:id', authenticate, requireAuth, updateNode);

/**
 * DELETE /nodes/:id
 * Delete an existing analysis node.
 *
 * Path parameters:
 * - id: string (required) - Node UUID
 *
 * Only accessible by project members with owner, lead, or member role.
 * Viewers cannot delete nodes.
 */
router.delete('/:id', authenticate, requireAuth, deleteNode);

export default router;
