-- Migration: 009_create_reports_tables
-- Description: Create reports and report_templates tables for HazOp report generation
-- Task: DB-09
-- Date: 2026-02-09

-- Set search path to use the hazop schema
SET search_path TO hazop, public;

-- ============================================================================
-- REPORT_TEMPLATES TABLE
-- ============================================================================
-- Stores templates used for generating HazOp reports. Templates can support
-- multiple output formats and can be activated/deactivated by administrators.
-- Templates are stored in file storage (MinIO/S3).

CREATE TABLE report_templates (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template name (displayed in UI for selection)
    name VARCHAR(200) NOT NULL,

    -- Optional description of what this template produces
    description TEXT DEFAULT NULL,

    -- Path to the template file in storage (MinIO/S3)
    template_path VARCHAR(500) NOT NULL,

    -- Output formats this template supports (stored as JSONB array)
    -- Example: ["pdf", "word"] or ["pdf", "word", "excel", "powerpoint"]
    supported_formats JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Whether this template is available for use
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- User who created this template
    created_by_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================

    -- Foreign key to users
    CONSTRAINT report_templates_fk_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Template name must not be empty
    CONSTRAINT report_templates_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),

    -- Template path must not be empty
    CONSTRAINT report_templates_path_not_empty CHECK (LENGTH(TRIM(template_path)) > 0),

    -- Supported formats must be a non-empty array
    CONSTRAINT report_templates_formats_not_empty CHECK (
        jsonb_typeof(supported_formats) = 'array' AND jsonb_array_length(supported_formats) > 0
    ),

    -- Each format in the array must be a valid report_format value
    -- Note: Full validation is handled at application level; this ensures basic structure
    CONSTRAINT report_templates_formats_array CHECK (
        jsonb_typeof(supported_formats) = 'array'
    )
);

-- ============================================================================
-- TABLE AND COLUMN COMMENTS FOR report_templates
-- ============================================================================

COMMENT ON TABLE report_templates IS
    'Templates used for generating HazOp reports. Templates can support multiple '
    'output formats (PDF, Word, Excel, PowerPoint) and are stored in MinIO/S3.';

COMMENT ON COLUMN report_templates.id IS
    'Unique identifier (UUID) for the report template';

COMMENT ON COLUMN report_templates.name IS
    'Display name of the template shown in the UI for user selection';

COMMENT ON COLUMN report_templates.description IS
    'Optional description explaining what this template produces and its use case';

COMMENT ON COLUMN report_templates.template_path IS
    'Storage path to the template file in MinIO/S3 (e.g., templates/standard-hazop-v1.docx)';

COMMENT ON COLUMN report_templates.supported_formats IS
    'JSON array of output formats this template supports: pdf, word, excel, powerpoint';

COMMENT ON COLUMN report_templates.is_active IS
    'Whether this template is available for use (inactive templates are hidden from users)';

COMMENT ON COLUMN report_templates.created_by_id IS
    'Foreign key reference to the user who created this template';

COMMENT ON COLUMN report_templates.created_at IS
    'Timestamp when the template was created';

COMMENT ON COLUMN report_templates.updated_at IS
    'Timestamp when the template was last updated';

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
-- Stores generated HazOp reports. Reports are generated asynchronously via
-- RabbitMQ message queue and stored in MinIO/S3 file storage.
-- Each report is linked to a HazOps analysis and uses a specific template.

CREATE TABLE reports (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- HazOps analysis this report was generated from
    hazop_analysis_id UUID NOT NULL,

    -- Name/title of the report
    name VARCHAR(300) NOT NULL,

    -- Output format of the report (uses report_format enum)
    format report_format NOT NULL,

    -- Name/identifier of the template used (stored for historical reference)
    template_used VARCHAR(200) NOT NULL,

    -- Current status of report generation (uses report_status enum)
    status report_status NOT NULL DEFAULT 'pending',

    -- Path to the generated file in storage (null until generation completes)
    file_path VARCHAR(500) DEFAULT NULL,

    -- Size of the generated file in bytes (null until generation completes)
    file_size BIGINT DEFAULT NULL,

    -- User who requested the report generation
    generated_by_id UUID NOT NULL,

    -- Timestamp when the report generation was requested
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamp when the report generation completed (null if not complete)
    generated_at TIMESTAMPTZ DEFAULT NULL,

    -- Generation parameters used for this report (JSONB for flexibility)
    -- See ReportParameters interface in packages/types/src/report.ts
    parameters JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Error message if generation failed (null if no error)
    error_message TEXT DEFAULT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================

    -- Foreign key to hazop_analyses
    CONSTRAINT reports_fk_hazop_analysis FOREIGN KEY (hazop_analysis_id)
        REFERENCES hazop_analyses(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Foreign key to users (generator)
    CONSTRAINT reports_fk_generated_by FOREIGN KEY (generated_by_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Report name must not be empty
    CONSTRAINT reports_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),

    -- Template used must not be empty
    CONSTRAINT reports_template_not_empty CHECK (LENGTH(TRIM(template_used)) > 0),

    -- File size must be positive when provided
    CONSTRAINT reports_file_size_positive CHECK (file_size IS NULL OR file_size > 0),

    -- Completed reports must have file_path and file_size
    CONSTRAINT reports_completed_has_file CHECK (
        status != 'completed' OR (file_path IS NOT NULL AND file_size IS NOT NULL)
    ),

    -- Completed reports must have generated_at timestamp
    CONSTRAINT reports_completed_has_timestamp CHECK (
        status != 'completed' OR generated_at IS NOT NULL
    ),

    -- Failed reports must have error_message
    CONSTRAINT reports_failed_has_error CHECK (
        status != 'failed' OR error_message IS NOT NULL
    ),

    -- Error message should only exist for failed status
    CONSTRAINT reports_error_only_when_failed CHECK (
        error_message IS NULL OR status = 'failed'
    ),

    -- Parameters must be a valid JSON object
    CONSTRAINT reports_parameters_object CHECK (
        jsonb_typeof(parameters) = 'object'
    )
);

-- ============================================================================
-- TABLE AND COLUMN COMMENTS FOR reports
-- ============================================================================

COMMENT ON TABLE reports IS
    'Generated HazOp reports. Reports are created asynchronously via RabbitMQ '
    'and stored in MinIO/S3. Each report is linked to a HazOps analysis.';

COMMENT ON COLUMN reports.id IS
    'Unique identifier (UUID) for the report, also serves as job ID for tracking';

COMMENT ON COLUMN reports.hazop_analysis_id IS
    'Foreign key reference to the HazOps analysis this report was generated from';

COMMENT ON COLUMN reports.name IS
    'Name/title of the report (can be customized by user or auto-generated)';

COMMENT ON COLUMN reports.format IS
    'Output format: pdf, word, excel, or powerpoint';

COMMENT ON COLUMN reports.template_used IS
    'Name of the template used (stored as string for historical reference even if template is deleted)';

COMMENT ON COLUMN reports.status IS
    'Generation status: pending (queued), generating (in progress), completed, or failed';

COMMENT ON COLUMN reports.file_path IS
    'Storage path to the generated file in MinIO/S3 (null until generation completes)';

COMMENT ON COLUMN reports.file_size IS
    'Size of the generated file in bytes (null until generation completes)';

COMMENT ON COLUMN reports.generated_by_id IS
    'Foreign key reference to the user who requested the report generation';

COMMENT ON COLUMN reports.requested_at IS
    'Timestamp when the report generation was requested (job queued)';

COMMENT ON COLUMN reports.generated_at IS
    'Timestamp when the report generation completed successfully (null if not complete)';

COMMENT ON COLUMN reports.parameters IS
    'JSON object with generation parameters (includeRiskMatrix, riskLevelFilter, etc.)';

COMMENT ON COLUMN reports.error_message IS
    'Error message if generation failed (null if no error)';

COMMENT ON COLUMN reports.created_at IS
    'Timestamp when the report record was created';

COMMENT ON COLUMN reports.updated_at IS
    'Timestamp when the report record was last updated';

-- ============================================================================
-- PERFORMANCE INDEXES FOR report_templates
-- ============================================================================

-- Index for querying active templates (most common use case)
CREATE INDEX idx_report_templates_is_active
    ON report_templates (is_active)
    WHERE is_active = TRUE;

-- Index for querying templates by creator
CREATE INDEX idx_report_templates_created_by
    ON report_templates (created_by_id);

-- Index for listing templates sorted by creation date
CREATE INDEX idx_report_templates_created_at
    ON report_templates (created_at DESC);

-- GIN index for searching within supported_formats JSONB array
CREATE INDEX idx_report_templates_formats_gin
    ON report_templates USING GIN (supported_formats);

-- ============================================================================
-- PERFORMANCE INDEXES FOR reports
-- ============================================================================

-- Index for querying reports by analysis (most common lookup)
CREATE INDEX idx_reports_hazop_analysis_id
    ON reports (hazop_analysis_id);

-- Index for querying reports by status (for monitoring pending/generating jobs)
CREATE INDEX idx_reports_status
    ON reports (status);

-- Index for querying reports by format
CREATE INDEX idx_reports_format
    ON reports (format);

-- Index for querying reports by generator
CREATE INDEX idx_reports_generated_by
    ON reports (generated_by_id);

-- Index for listing reports sorted by request date (most recent first)
CREATE INDEX idx_reports_requested_at
    ON reports (requested_at DESC);

-- Index for listing completed reports sorted by generation date
CREATE INDEX idx_reports_generated_at
    ON reports (generated_at DESC)
    WHERE generated_at IS NOT NULL;

-- Composite index for analysis + status (common filter combination)
CREATE INDEX idx_reports_analysis_status
    ON reports (hazop_analysis_id, status);

-- Composite index for user + status (user's pending reports)
CREATE INDEX idx_reports_user_status
    ON reports (generated_by_id, status);

-- Partial index for pending reports (queue monitoring)
CREATE INDEX idx_reports_pending
    ON reports (requested_at ASC)
    WHERE status = 'pending';

-- Partial index for generating reports (in-progress monitoring)
CREATE INDEX idx_reports_generating
    ON reports (requested_at ASC)
    WHERE status = 'generating';

-- Partial index for failed reports (error monitoring)
CREATE INDEX idx_reports_failed
    ON reports (requested_at DESC)
    WHERE status = 'failed';

-- GIN index for searching within parameters JSONB
CREATE INDEX idx_reports_parameters_gin
    ON reports USING GIN (parameters);
