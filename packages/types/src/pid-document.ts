/**
 * P&ID Document type definitions for HazOp Assistant.
 *
 * P&ID (Piping & Instrumentation Diagram) documents are the foundation
 * for HazOps analysis. They are uploaded to projects and contain nodes
 * that represent equipment to be analyzed.
 */

/**
 * Processing status for P&ID documents.
 *
 * - pending: Document uploaded, awaiting processing
 * - processing: Document is being processed (metadata extraction)
 * - processed: Processing complete, ready for analysis
 * - failed: Processing failed (see error field for details)
 */
export type PIDDocumentStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed';

/**
 * All available P&ID document statuses as a constant array.
 * Useful for validation, dropdowns, and iteration.
 */
export const PID_DOCUMENT_STATUSES: readonly PIDDocumentStatus[] = [
  'pending',
  'processing',
  'processed',
  'failed',
] as const;

/**
 * Valid MIME types for P&ID document uploads.
 * Supports PDF, PNG, JPG, and DWG formats.
 */
export const VALID_PID_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/acad', // DWG
  'application/x-acad', // DWG alternative
  'application/dwg', // DWG alternative
  'image/vnd.dwg', // DWG alternative
] as const;

/**
 * Valid MIME type union for P&ID documents.
 */
export type PIDMimeType = (typeof VALID_PID_MIME_TYPES)[number];

/**
 * P&ID Document entity representing an uploaded diagram.
 */
export interface PIDDocument {
  /** Unique identifier (UUID) */
  id: string;

  /** ID of the project this document belongs to */
  projectId: string;

  /** Original filename as uploaded */
  filename: string;

  /** Storage path/key in MinIO (S3-compatible storage) */
  storagePath: string;

  /** MIME type of the uploaded file */
  mimeType: string;

  /** File size in bytes */
  fileSize: number;

  /** Current processing status */
  status: PIDDocumentStatus;

  /** Error message if status is 'failed' */
  errorMessage: string | null;

  /** Document width in pixels (after processing) */
  width: number | null;

  /** Document height in pixels (after processing) */
  height: number | null;

  /** ID of the user who uploaded the document */
  uploadedById: string;

  /** Timestamp when the document was uploaded */
  uploadedAt: Date;

  /** Timestamp when processing completed (null if not yet processed) */
  processedAt: Date | null;

  /** Timestamp when the document was created */
  createdAt: Date;

  /** Timestamp when the document was last updated */
  updatedAt: Date;
}

/**
 * P&ID Document with uploader information (for display purposes).
 */
export interface PIDDocumentWithUploader extends PIDDocument {
  /** Name of the user who uploaded the document */
  uploadedByName: string;

  /** Email of the user who uploaded the document */
  uploadedByEmail: string;
}

/**
 * P&ID Document with node count (for list views).
 */
export interface PIDDocumentWithNodeCount extends PIDDocument {
  /** Number of analysis nodes defined on this document */
  nodeCount: number;
}

/**
 * Payload for uploading a new P&ID document.
 * The actual file is uploaded separately via multipart form data.
 */
export interface CreatePIDDocumentPayload {
  /** ID of the project to upload the document to */
  projectId: string;

  /** Original filename */
  filename: string;

  /** MIME type of the file */
  mimeType: string;

  /** File size in bytes */
  fileSize: number;
}

/**
 * Payload for updating P&ID document metadata.
 * Only filename can be updated by users.
 */
export interface UpdatePIDDocumentPayload {
  /** New filename (for renaming) */
  filename?: string;
}

/**
 * Internal payload for updating document processing status.
 * Used by the processing service, not exposed to API.
 */
export interface UpdatePIDDocumentStatusPayload {
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
