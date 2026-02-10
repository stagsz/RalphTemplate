/**
 * P&ID Document service for database operations.
 *
 * Handles document CRUD operations, status updates, and queries.
 * Also handles analysis node operations for nodes attached to documents.
 */

import { getPool } from '../config/database.config.js';
import type { PIDDocumentStatus, EquipmentType } from '@hazop/types';

/**
 * P&ID document row from the database.
 * Uses snake_case column names matching PostgreSQL schema.
 */
export interface PIDDocumentRow {
  id: string;
  project_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: string; // BIGINT comes as string from pg
  status: PIDDocumentStatus;
  error_message: string | null;
  width: number | null;
  height: number | null;
  uploaded_by_id: string;
  uploaded_at: Date;
  processed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * P&ID document row with uploader info joined from users table.
 */
export interface PIDDocumentRowWithUploader extends PIDDocumentRow {
  uploaded_by_name: string;
  uploaded_by_email: string;
}

/**
 * P&ID document object (API response format).
 */
export interface PIDDocument {
  id: string;
  projectId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  status: PIDDocumentStatus;
  errorMessage: string | null;
  width: number | null;
  height: number | null;
  uploadedById: string;
  uploadedAt: Date;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * P&ID document with uploader information (for display purposes).
 */
export interface PIDDocumentWithUploader extends PIDDocument {
  uploadedByName: string;
  uploadedByEmail: string;
}

/**
 * Convert a database row to a PIDDocument object.
 * Maps snake_case columns to camelCase properties.
 */
function rowToDocument(row: PIDDocumentRow): PIDDocument {
  return {
    id: row.id,
    projectId: row.project_id,
    filename: row.filename,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSize: parseInt(row.file_size, 10),
    status: row.status,
    errorMessage: row.error_message,
    width: row.width,
    height: row.height,
    uploadedById: row.uploaded_by_id,
    uploadedAt: row.uploaded_at,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert a database row with uploader info to PIDDocumentWithUploader object.
 */
function rowToDocumentWithUploader(row: PIDDocumentRowWithUploader): PIDDocumentWithUploader {
  return {
    ...rowToDocument(row),
    uploadedByName: row.uploaded_by_name,
    uploadedByEmail: row.uploaded_by_email,
  };
}

/**
 * Payload for creating a new P&ID document record.
 */
export interface CreatePIDDocumentData {
  projectId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string;
}

/**
 * Create a new P&ID document record in the database.
 * The document is created with 'pending' status.
 *
 * @param data - Document creation data
 * @returns The created document with uploader information
 */
export async function createPIDDocument(
  data: CreatePIDDocumentData
): Promise<PIDDocumentWithUploader> {
  const pool = getPool();

  const result = await pool.query<PIDDocumentRowWithUploader>(
    `INSERT INTO hazop.pid_documents
       (project_id, filename, storage_path, mime_type, file_size, uploaded_by_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       project_id,
       filename,
       storage_path,
       mime_type,
       file_size,
       status,
       error_message,
       width,
       height,
       uploaded_by_id,
       uploaded_at,
       processed_at,
       created_at,
       updated_at,
       (SELECT name FROM hazop.users WHERE id = $6) AS uploaded_by_name,
       (SELECT email FROM hazop.users WHERE id = $6) AS uploaded_by_email`,
    [
      data.projectId,
      data.filename,
      data.storagePath,
      data.mimeType,
      data.fileSize,
      data.uploadedById,
    ]
  );

  return rowToDocumentWithUploader(result.rows[0]);
}

/**
 * Find a P&ID document by ID.
 * Returns null if document not found.
 *
 * @param documentId - The document ID
 * @returns The document with uploader information, or null if not found
 */
export async function findPIDDocumentById(
  documentId: string
): Promise<PIDDocumentWithUploader | null> {
  const pool = getPool();

  const result = await pool.query<PIDDocumentRowWithUploader>(
    `SELECT
       d.id,
       d.project_id,
       d.filename,
       d.storage_path,
       d.mime_type,
       d.file_size,
       d.status,
       d.error_message,
       d.width,
       d.height,
       d.uploaded_by_id,
       d.uploaded_at,
       d.processed_at,
       d.created_at,
       d.updated_at,
       u.name AS uploaded_by_name,
       u.email AS uploaded_by_email
     FROM hazop.pid_documents d
     INNER JOIN hazop.users u ON d.uploaded_by_id = u.id
     WHERE d.id = $1`,
    [documentId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToDocumentWithUploader(result.rows[0]);
}

/**
 * Check if a document belongs to a specific project.
 *
 * @param documentId - The document ID
 * @param projectId - The project ID
 * @returns True if the document belongs to the project
 */
export async function documentBelongsToProject(
  documentId: string,
  projectId: string
): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM hazop.pid_documents
       WHERE id = $1 AND project_id = $2
     ) AS exists`,
    [documentId, projectId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Filters for listing project documents.
 */
export interface ListDocumentsFilters {
  status?: PIDDocumentStatus;
  search?: string;
}

/**
 * Pagination options for listing project documents.
 */
export interface ListDocumentsPagination {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'uploaded_at' | 'filename' | 'status' | 'file_size';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result of listing project documents.
 */
export interface ListDocumentsResult {
  documents: PIDDocumentWithUploader[];
  total: number;
}

/**
 * List all P&ID documents for a project with pagination and filtering.
 *
 * @param projectId - The project ID
 * @param filters - Optional filters (status, search)
 * @param pagination - Optional pagination options
 * @returns Paginated list of documents with uploader info
 */
export async function listProjectDocuments(
  projectId: string,
  filters: ListDocumentsFilters = {},
  pagination: ListDocumentsPagination = {}
): Promise<ListDocumentsResult> {
  const pool = getPool();

  // Set defaults for pagination
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 20;
  const sortBy = pagination.sortBy ?? 'uploaded_at';
  const sortOrder = pagination.sortOrder ?? 'desc';
  const offset = (page - 1) * limit;

  // Build WHERE clause conditions
  const conditions: string[] = ['d.project_id = $1'];
  const params: (string | number)[] = [projectId];
  let paramIndex = 2;

  // Filter by status
  if (filters.status) {
    conditions.push(`d.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  // Filter by search (filename)
  if (filters.search) {
    conditions.push(`d.filename ILIKE $${paramIndex}`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Validate and map sort column
  const sortColumnMap: Record<string, string> = {
    created_at: 'd.created_at',
    uploaded_at: 'd.uploaded_at',
    filename: 'd.filename',
    status: 'd.status',
    file_size: 'd.file_size',
  };
  const sortColumn = sortColumnMap[sortBy] || 'd.uploaded_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Count total matching documents
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM hazop.pid_documents d
     WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  // Fetch paginated documents with uploader info
  const result = await pool.query<PIDDocumentRowWithUploader>(
    `SELECT
       d.id,
       d.project_id,
       d.filename,
       d.storage_path,
       d.mime_type,
       d.file_size,
       d.status,
       d.error_message,
       d.width,
       d.height,
       d.uploaded_by_id,
       d.uploaded_at,
       d.processed_at,
       d.created_at,
       d.updated_at,
       u.name AS uploaded_by_name,
       u.email AS uploaded_by_email
     FROM hazop.pid_documents d
     INNER JOIN hazop.users u ON d.uploaded_by_id = u.id
     WHERE ${whereClause}
     ORDER BY ${sortColumn} ${order}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const documents = result.rows.map(rowToDocumentWithUploader);

  return { documents, total };
}

/**
 * Payload for updating document processing status.
 */
export interface UpdateDocumentStatusData {
  /** New processing status */
  status: PIDDocumentStatus;
  /** Error message (required if status is 'failed') */
  errorMessage?: string;
  /** Document width in pixels (set when status is 'processed') */
  width?: number;
  /** Document height in pixels (set when status is 'processed') */
  height?: number;
  /** Processing completion timestamp (set when status is 'processed') */
  processedAt?: Date;
}

/**
 * Update a P&ID document's processing status and metadata.
 * Used by the metadata extraction service after processing.
 *
 * @param documentId - The document ID
 * @param data - Status update data
 * @returns The updated document, or null if not found
 */
export async function updatePIDDocumentStatus(
  documentId: string,
  data: UpdateDocumentStatusData
): Promise<PIDDocument | null> {
  const pool = getPool();

  // Build dynamic SET clause
  const setClauses: string[] = ['status = $2', 'updated_at = NOW()'];
  const params: (string | number | Date | null)[] = [documentId, data.status];
  let paramIndex = 3;

  if (data.errorMessage !== undefined) {
    setClauses.push(`error_message = $${paramIndex}`);
    params.push(data.errorMessage);
    paramIndex++;
  }

  if (data.width !== undefined) {
    setClauses.push(`width = $${paramIndex}`);
    params.push(data.width);
    paramIndex++;
  }

  if (data.height !== undefined) {
    setClauses.push(`height = $${paramIndex}`);
    params.push(data.height);
    paramIndex++;
  }

  if (data.processedAt !== undefined) {
    setClauses.push(`processed_at = $${paramIndex}`);
    params.push(data.processedAt);
    paramIndex++;
  }

  const result = await pool.query<PIDDocumentRow>(
    `UPDATE hazop.pid_documents
     SET ${setClauses.join(', ')}
     WHERE id = $1
     RETURNING
       id,
       project_id,
       filename,
       storage_path,
       mime_type,
       file_size,
       status,
       error_message,
       width,
       height,
       uploaded_by_id,
       uploaded_at,
       processed_at,
       created_at,
       updated_at`,
    params
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToDocument(result.rows[0]);
}

/**
 * Delete a P&ID document by ID.
 * Returns the deleted document (for cleanup operations like file deletion).
 *
 * @param documentId - The document ID
 * @returns The deleted document, or null if not found
 */
export async function deletePIDDocument(
  documentId: string
): Promise<PIDDocument | null> {
  const pool = getPool();

  const result = await pool.query<PIDDocumentRow>(
    `DELETE FROM hazop.pid_documents
     WHERE id = $1
     RETURNING
       id,
       project_id,
       filename,
       storage_path,
       mime_type,
       file_size,
       status,
       error_message,
       width,
       height,
       uploaded_by_id,
       uploaded_at,
       processed_at,
       created_at,
       updated_at`,
    [documentId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToDocument(result.rows[0]);
}

// ============================================================================
// ANALYSIS NODE OPERATIONS
// ============================================================================

/**
 * Analysis node row from the database.
 * Uses snake_case column names matching PostgreSQL schema.
 */
export interface AnalysisNodeRow {
  id: string;
  document_id: string;
  node_id: string;
  description: string;
  equipment_type: EquipmentType;
  x_coordinate: string; // DECIMAL comes as string from pg
  y_coordinate: string; // DECIMAL comes as string from pg
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Analysis node row with creator info joined from users table.
 */
export interface AnalysisNodeRowWithCreator extends AnalysisNodeRow {
  created_by_name: string;
  created_by_email: string;
}

/**
 * Analysis node object (API response format).
 */
export interface AnalysisNode {
  id: string;
  documentId: string;
  nodeId: string;
  description: string;
  equipmentType: EquipmentType;
  x: number;
  y: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analysis node with creator information (for display purposes).
 */
export interface AnalysisNodeWithCreator extends AnalysisNode {
  createdByName: string;
  createdByEmail: string;
}

/**
 * Convert a database row to an AnalysisNode object.
 * Maps snake_case columns to camelCase properties.
 */
function rowToNode(row: AnalysisNodeRow): AnalysisNode {
  return {
    id: row.id,
    documentId: row.document_id,
    nodeId: row.node_id,
    description: row.description,
    equipmentType: row.equipment_type,
    x: parseFloat(row.x_coordinate),
    y: parseFloat(row.y_coordinate),
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert a database row with creator info to AnalysisNodeWithCreator object.
 */
function rowToNodeWithCreator(row: AnalysisNodeRowWithCreator): AnalysisNodeWithCreator {
  return {
    ...rowToNode(row),
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
  };
}

/**
 * Payload for creating a new analysis node record.
 */
export interface CreateAnalysisNodeData {
  documentId: string;
  nodeId: string;
  description: string;
  equipmentType: EquipmentType;
  x: number;
  y: number;
  createdById: string;
}

/**
 * Create a new analysis node record in the database.
 *
 * @param data - Node creation data
 * @returns The created node with creator information
 * @throws Error with code '23505' if nodeId is duplicate within document
 */
export async function createAnalysisNode(
  data: CreateAnalysisNodeData
): Promise<AnalysisNodeWithCreator> {
  const pool = getPool();

  const result = await pool.query<AnalysisNodeRowWithCreator>(
    `INSERT INTO hazop.analysis_nodes
       (document_id, node_id, description, equipment_type, x_coordinate, y_coordinate, created_by_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id,
       document_id,
       node_id,
       description,
       equipment_type,
       x_coordinate,
       y_coordinate,
       created_by_id,
       created_at,
       updated_at,
       (SELECT name FROM hazop.users WHERE id = $7) AS created_by_name,
       (SELECT email FROM hazop.users WHERE id = $7) AS created_by_email`,
    [
      data.documentId,
      data.nodeId,
      data.description,
      data.equipmentType,
      data.x,
      data.y,
      data.createdById,
    ]
  );

  return rowToNodeWithCreator(result.rows[0]);
}

/**
 * Check if a node ID already exists for a document.
 *
 * @param documentId - The document ID
 * @param nodeId - The node ID to check
 * @returns True if the nodeId already exists for this document
 */
export async function nodeIdExistsForDocument(
  documentId: string,
  nodeId: string
): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM hazop.analysis_nodes
       WHERE document_id = $1 AND node_id = $2
     ) AS exists`,
    [documentId, nodeId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Filters for listing document nodes.
 */
export interface ListNodesFilters {
  equipmentType?: EquipmentType;
  search?: string;
}

/**
 * Pagination options for listing document nodes.
 */
export interface ListNodesPagination {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'node_id' | 'equipment_type';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result of listing document nodes.
 */
export interface ListNodesResult {
  nodes: AnalysisNodeWithCreator[];
  total: number;
}

/**
 * List all analysis nodes for a document with pagination and filtering.
 *
 * @param documentId - The document ID
 * @param filters - Optional filters (equipmentType, search)
 * @param pagination - Optional pagination options
 * @returns Paginated list of nodes with creator info
 */
export async function listDocumentNodes(
  documentId: string,
  filters: ListNodesFilters = {},
  pagination: ListNodesPagination = {}
): Promise<ListNodesResult> {
  const pool = getPool();

  // Set defaults for pagination
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 50;
  const sortBy = pagination.sortBy ?? 'node_id';
  const sortOrder = pagination.sortOrder ?? 'asc';
  const offset = (page - 1) * limit;

  // Build WHERE clause conditions
  const conditions: string[] = ['n.document_id = $1'];
  const params: (string | number)[] = [documentId];
  let paramIndex = 2;

  // Filter by equipment type
  if (filters.equipmentType) {
    conditions.push(`n.equipment_type = $${paramIndex}`);
    params.push(filters.equipmentType);
    paramIndex++;
  }

  // Filter by search (node_id or description)
  if (filters.search) {
    conditions.push(`(n.node_id ILIKE $${paramIndex} OR n.description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Validate and map sort column
  const sortColumnMap: Record<string, string> = {
    created_at: 'n.created_at',
    node_id: 'n.node_id',
    equipment_type: 'n.equipment_type',
  };
  const sortColumn = sortColumnMap[sortBy] || 'n.node_id';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Count total matching nodes
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM hazop.analysis_nodes n
     WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  // Fetch paginated nodes with creator info
  const result = await pool.query<AnalysisNodeRowWithCreator>(
    `SELECT
       n.id,
       n.document_id,
       n.node_id,
       n.description,
       n.equipment_type,
       n.x_coordinate,
       n.y_coordinate,
       n.created_by_id,
       n.created_at,
       n.updated_at,
       u.name AS created_by_name,
       u.email AS created_by_email
     FROM hazop.analysis_nodes n
     INNER JOIN hazop.users u ON n.created_by_id = u.id
     WHERE ${whereClause}
     ORDER BY ${sortColumn} ${order}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const nodes = result.rows.map(rowToNodeWithCreator);

  return { nodes, total };
}

/**
 * Find an analysis node by its UUID.
 *
 * @param nodeId - The node UUID (not the user-defined nodeId)
 * @returns The node with creator information, or null if not found
 */
export async function findAnalysisNodeById(
  nodeId: string
): Promise<AnalysisNodeWithCreator | null> {
  const pool = getPool();

  const result = await pool.query<AnalysisNodeRowWithCreator>(
    `SELECT
       n.id,
       n.document_id,
       n.node_id,
       n.description,
       n.equipment_type,
       n.x_coordinate,
       n.y_coordinate,
       n.created_by_id,
       n.created_at,
       n.updated_at,
       u.name AS created_by_name,
       u.email AS created_by_email
     FROM hazop.analysis_nodes n
     INNER JOIN hazop.users u ON n.created_by_id = u.id
     WHERE n.id = $1`,
    [nodeId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToNodeWithCreator(result.rows[0]);
}

/**
 * Payload for updating an existing analysis node.
 * All fields are optional - only provided fields are updated.
 */
export interface UpdateAnalysisNodeData {
  nodeId?: string;
  description?: string;
  equipmentType?: EquipmentType;
  x?: number;
  y?: number;
}

/**
 * Update an analysis node in the database.
 * Only provided fields are updated.
 *
 * @param id - The node UUID
 * @param data - Fields to update
 * @returns The updated node with creator information, or null if not found
 * @throws Error with code '23505' if nodeId is duplicate within document
 */
export async function updateAnalysisNode(
  id: string,
  data: UpdateAnalysisNodeData
): Promise<AnalysisNodeWithCreator | null> {
  const pool = getPool();

  // Build dynamic SET clause based on provided fields
  const setClauses: string[] = ['updated_at = NOW()'];
  const params: (string | number)[] = [id];
  let paramIndex = 2;

  if (data.nodeId !== undefined) {
    setClauses.push(`node_id = $${paramIndex}`);
    params.push(data.nodeId);
    paramIndex++;
  }

  if (data.description !== undefined) {
    setClauses.push(`description = $${paramIndex}`);
    params.push(data.description);
    paramIndex++;
  }

  if (data.equipmentType !== undefined) {
    setClauses.push(`equipment_type = $${paramIndex}`);
    params.push(data.equipmentType);
    paramIndex++;
  }

  if (data.x !== undefined) {
    setClauses.push(`x_coordinate = $${paramIndex}`);
    params.push(data.x);
    paramIndex++;
  }

  if (data.y !== undefined) {
    setClauses.push(`y_coordinate = $${paramIndex}`);
    params.push(data.y);
    paramIndex++;
  }

  const result = await pool.query<AnalysisNodeRowWithCreator>(
    `UPDATE hazop.analysis_nodes n
     SET ${setClauses.join(', ')}
     FROM hazop.users u
     WHERE n.id = $1 AND u.id = n.created_by_id
     RETURNING
       n.id,
       n.document_id,
       n.node_id,
       n.description,
       n.equipment_type,
       n.x_coordinate,
       n.y_coordinate,
       n.created_by_id,
       n.created_at,
       n.updated_at,
       u.name AS created_by_name,
       u.email AS created_by_email`,
    params
  );

  if (!result.rows[0]) {
    return null;
  }

  return rowToNodeWithCreator(result.rows[0]);
}

/**
 * Check if a node ID already exists for a document, excluding a specific node.
 * Used for validating updates that change the nodeId.
 *
 * @param documentId - The document ID
 * @param nodeId - The node ID to check
 * @param excludeId - The node UUID to exclude from the check
 * @returns True if the nodeId already exists for another node in this document
 */
export async function nodeIdExistsForDocumentExcluding(
  documentId: string,
  nodeId: string,
  excludeId: string
): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM hazop.analysis_nodes
       WHERE document_id = $1 AND node_id = $2 AND id != $3
     ) AS exists`,
    [documentId, nodeId, excludeId]
  );

  return result.rows[0]?.exists ?? false;
}
