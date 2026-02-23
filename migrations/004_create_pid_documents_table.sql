-- Migration: 004_create_pid_documents_table
-- Description: Create pid_documents table for P&ID document storage and processing tracking
-- Task: DB-04
-- Date: 2026-02-09

-- Set search path to use the hazop schema
SET search_path TO hazop, public;

-- ============================================================================
-- PID_DOCUMENTS TABLE
-- ============================================================================
-- Stores P&ID (Piping & Instrumentation Diagram) documents uploaded to projects.
-- Documents are stored in MinIO (S3-compatible) and this table tracks metadata
-- and processing status.

CREATE TABLE pid_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    status pid_document_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    width INTEGER,
    height INTEGER,
    uploaded_by_id UUID NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT pid_documents_project_fk FOREIGN KEY (project_id)
        REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT pid_documents_uploaded_by_fk FOREIGN KEY (uploaded_by_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Business rule: storage paths must be unique (no duplicate files)
    CONSTRAINT pid_documents_storage_path_unique UNIQUE (storage_path),

    -- Validation constraints
    CONSTRAINT pid_documents_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0),
    CONSTRAINT pid_documents_storage_path_not_empty CHECK (LENGTH(TRIM(storage_path)) > 0),
    CONSTRAINT pid_documents_mime_type_valid CHECK (
        mime_type IN (
            'application/pdf',
            'image/png',
            'image/jpeg',
            'application/acad',
            'application/x-acad',
            'application/dwg',
            'image/vnd.dwg'
        )
    ),
    CONSTRAINT pid_documents_file_size_positive CHECK (file_size > 0),
    CONSTRAINT pid_documents_dimensions_positive CHECK (
        (width IS NULL OR width > 0) AND
        (height IS NULL OR height > 0)
    ),
    CONSTRAINT pid_documents_error_message_on_failed CHECK (
        (status = 'failed' AND error_message IS NOT NULL) OR
        (status != 'failed')
    ),
    CONSTRAINT pid_documents_processed_at_on_processed CHECK (
        (status = 'processed' AND processed_at IS NOT NULL) OR
        (status != 'processed')
    )
);

-- Table comment
COMMENT ON TABLE pid_documents IS 'P&ID (Piping & Instrumentation Diagram) documents uploaded to projects for HazOps analysis';

-- Column comments
COMMENT ON COLUMN pid_documents.id IS 'Unique document identifier (UUID)';
COMMENT ON COLUMN pid_documents.project_id IS 'Reference to the project this document belongs to';
COMMENT ON COLUMN pid_documents.filename IS 'Original filename as uploaded by user';
COMMENT ON COLUMN pid_documents.storage_path IS 'Storage path/key in MinIO (S3-compatible storage)';
COMMENT ON COLUMN pid_documents.mime_type IS 'MIME type of the uploaded file (PDF, PNG, JPEG, DWG)';
COMMENT ON COLUMN pid_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN pid_documents.status IS 'Processing status: pending, processing, processed, failed';
COMMENT ON COLUMN pid_documents.error_message IS 'Error message if processing failed (required when status is failed)';
COMMENT ON COLUMN pid_documents.width IS 'Document width in pixels (populated after processing)';
COMMENT ON COLUMN pid_documents.height IS 'Document height in pixels (populated after processing)';
COMMENT ON COLUMN pid_documents.uploaded_by_id IS 'Reference to the user who uploaded the document';
COMMENT ON COLUMN pid_documents.uploaded_at IS 'Timestamp when the document was uploaded';
COMMENT ON COLUMN pid_documents.processed_at IS 'Timestamp when processing completed (required when status is processed)';
COMMENT ON COLUMN pid_documents.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN pid_documents.updated_at IS 'Timestamp when record was last modified';

-- Performance indexes for pid_documents table
CREATE INDEX idx_pid_documents_project_id ON pid_documents (project_id);
CREATE INDEX idx_pid_documents_uploaded_by_id ON pid_documents (uploaded_by_id);
CREATE INDEX idx_pid_documents_status ON pid_documents (status);
CREATE INDEX idx_pid_documents_uploaded_at ON pid_documents (uploaded_at DESC);
CREATE INDEX idx_pid_documents_project_status ON pid_documents (project_id, status);
