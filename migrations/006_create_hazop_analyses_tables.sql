-- Migration: 006_create_hazop_analyses_tables
-- Description: Create hazop_analyses and analysis_entries tables for core HazOps workflow
-- Task: DB-06
-- Date: 2026-02-09

-- Set search path to use the hazop schema
SET search_path TO hazop, public;

-- ============================================================================
-- HAZOP_ANALYSES TABLE
-- ============================================================================
-- Stores HazOps analysis sessions. Each analysis is performed on a P&ID document
-- within a project and contains multiple analysis entries (node + guide word combinations).

CREATE TABLE hazop_analyses (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to projects table
    project_id UUID NOT NULL,

    -- Foreign key to pid_documents table
    document_id UUID NOT NULL,

    -- Analysis session name/title
    name VARCHAR(255) NOT NULL,

    -- Optional description of the analysis scope or notes
    description TEXT DEFAULT NULL,

    -- Current status of the analysis (uses analysis_status enum from 001_create_enum_types)
    status analysis_status NOT NULL DEFAULT 'draft',

    -- Lead analyst responsible for this analysis
    lead_analyst_id UUID NOT NULL,

    -- User who created this analysis session
    created_by_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Workflow timestamps (null until action is taken)
    submitted_at TIMESTAMPTZ DEFAULT NULL,
    approved_at TIMESTAMPTZ DEFAULT NULL,

    -- User who approved the analysis (null if not approved)
    approved_by_id UUID DEFAULT NULL,

    -- Optional review notes from submitter
    review_notes TEXT DEFAULT NULL,

    -- Optional approval/rejection comments
    approval_comments TEXT DEFAULT NULL,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================

    -- Foreign key to projects - cascade delete when project is deleted
    CONSTRAINT hazop_analyses_fk_project FOREIGN KEY (project_id)
        REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Foreign key to pid_documents - cascade delete when document is deleted
    CONSTRAINT hazop_analyses_fk_document FOREIGN KEY (document_id)
        REFERENCES pid_documents(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Foreign key to users for lead analyst - restrict deletion
    CONSTRAINT hazop_analyses_fk_lead_analyst FOREIGN KEY (lead_analyst_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Foreign key to users for creator - restrict deletion
    CONSTRAINT hazop_analyses_fk_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Foreign key to users for approver - can be null
    CONSTRAINT hazop_analyses_fk_approved_by FOREIGN KEY (approved_by_id)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    -- Analysis name must not be empty
    CONSTRAINT hazop_analyses_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),

    -- Approval timestamp should only be set when approved_by_id is set
    CONSTRAINT hazop_analyses_approval_consistency CHECK (
        (approved_at IS NULL AND approved_by_id IS NULL) OR
        (approved_at IS NOT NULL AND approved_by_id IS NOT NULL)
    )
);

-- ============================================================================
-- TABLE AND COLUMN COMMENTS
-- ============================================================================

COMMENT ON TABLE hazop_analyses IS
    'HazOps analysis sessions. Each analysis evaluates a P&ID document using '
    'the HazOps methodology with guide words applied to equipment nodes.';

COMMENT ON COLUMN hazop_analyses.id IS
    'Unique identifier (UUID) for the analysis session';

COMMENT ON COLUMN hazop_analyses.project_id IS
    'Foreign key reference to the project this analysis belongs to';

COMMENT ON COLUMN hazop_analyses.document_id IS
    'Foreign key reference to the P&ID document being analyzed';

COMMENT ON COLUMN hazop_analyses.name IS
    'Name/title of the analysis session';

COMMENT ON COLUMN hazop_analyses.description IS
    'Optional description of the analysis scope, methodology, or notes';

COMMENT ON COLUMN hazop_analyses.status IS
    'Current status: draft, in_review, approved, or rejected';

COMMENT ON COLUMN hazop_analyses.lead_analyst_id IS
    'Foreign key reference to the user responsible for leading this analysis';

COMMENT ON COLUMN hazop_analyses.created_by_id IS
    'Foreign key reference to the user who created this analysis session';

COMMENT ON COLUMN hazop_analyses.created_at IS
    'Timestamp when the analysis session was created';

COMMENT ON COLUMN hazop_analyses.updated_at IS
    'Timestamp when the analysis session was last updated';

COMMENT ON COLUMN hazop_analyses.submitted_at IS
    'Timestamp when the analysis was submitted for review (null if not submitted)';

COMMENT ON COLUMN hazop_analyses.approved_at IS
    'Timestamp when the analysis was approved or rejected (null if not reviewed)';

COMMENT ON COLUMN hazop_analyses.approved_by_id IS
    'Foreign key reference to the user who approved/rejected the analysis';

COMMENT ON COLUMN hazop_analyses.review_notes IS
    'Optional notes provided by the analyst when submitting for review';

COMMENT ON COLUMN hazop_analyses.approval_comments IS
    'Required comments from reviewer explaining approval or rejection decision';

-- ============================================================================
-- PERFORMANCE INDEXES FOR hazop_analyses
-- ============================================================================

-- Index for querying analyses by project (most common query)
CREATE INDEX idx_hazop_analyses_project_id
    ON hazop_analyses (project_id);

-- Index for querying analyses by document
CREATE INDEX idx_hazop_analyses_document_id
    ON hazop_analyses (document_id);

-- Index for filtering by status
CREATE INDEX idx_hazop_analyses_status
    ON hazop_analyses (status);

-- Index for querying analyses by lead analyst
CREATE INDEX idx_hazop_analyses_lead_analyst_id
    ON hazop_analyses (lead_analyst_id);

-- Index for querying analyses by creator
CREATE INDEX idx_hazop_analyses_created_by_id
    ON hazop_analyses (created_by_id);

-- Composite index for project + status queries (common dashboard query)
CREATE INDEX idx_hazop_analyses_project_status
    ON hazop_analyses (project_id, status);

-- Index for sorting by creation date
CREATE INDEX idx_hazop_analyses_created_at
    ON hazop_analyses (created_at DESC);

-- ============================================================================
-- ANALYSIS_ENTRIES TABLE
-- ============================================================================
-- Stores individual analysis entries for each node + guide word combination.
-- This is the core data structure of the HazOps methodology.

CREATE TABLE analysis_entries (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to hazop_analyses table
    analysis_id UUID NOT NULL,

    -- Foreign key to analysis_nodes table
    node_id UUID NOT NULL,

    -- Guide word applied to this node (uses guide_word enum from 001_create_enum_types)
    guide_word guide_word NOT NULL,

    -- Parameter being analyzed (e.g., "flow", "pressure", "temperature", "level")
    parameter VARCHAR(100) NOT NULL,

    -- Description of the deviation from normal operation
    deviation TEXT NOT NULL,

    -- Possible causes of this deviation (stored as JSON array)
    causes JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Potential consequences of this deviation (stored as JSON array)
    consequences JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Existing safeguards that mitigate this risk (stored as JSON array)
    safeguards JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Recommended actions to reduce risk (stored as JSON array)
    recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- ========================================================================
    -- RISK RANKING FIELDS
    -- ========================================================================

    -- Severity level (1-5): Impact of consequence
    -- NULL indicates risk has not yet been assessed
    severity SMALLINT DEFAULT NULL CHECK (severity IS NULL OR (severity >= 1 AND severity <= 5)),

    -- Likelihood level (1-5): Probability of occurrence
    likelihood SMALLINT DEFAULT NULL CHECK (likelihood IS NULL OR (likelihood >= 1 AND likelihood <= 5)),

    -- Detectability level (1-5): Ability to detect before impact
    detectability SMALLINT DEFAULT NULL CHECK (detectability IS NULL OR (detectability >= 1 AND detectability <= 5)),

    -- Calculated risk score (severity × likelihood × detectability, range 1-125)
    -- Computed and stored for efficient querying
    risk_score SMALLINT DEFAULT NULL CHECK (risk_score IS NULL OR (risk_score >= 1 AND risk_score <= 125)),

    -- Classified risk level based on score thresholds (uses risk_level enum from 001_create_enum_types)
    risk_level risk_level DEFAULT NULL,

    -- ========================================================================
    -- OTHER FIELDS
    -- ========================================================================

    -- Additional notes or comments
    notes TEXT DEFAULT NULL,

    -- User who created this entry
    created_by_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================

    -- Foreign key to hazop_analyses - cascade delete when analysis is deleted
    CONSTRAINT analysis_entries_fk_analysis FOREIGN KEY (analysis_id)
        REFERENCES hazop_analyses(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Foreign key to analysis_nodes - cascade delete when node is deleted
    CONSTRAINT analysis_entries_fk_node FOREIGN KEY (node_id)
        REFERENCES analysis_nodes(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Foreign key to users for creator - restrict deletion
    CONSTRAINT analysis_entries_fk_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Parameter must not be empty
    CONSTRAINT analysis_entries_parameter_not_empty CHECK (LENGTH(TRIM(parameter)) > 0),

    -- Deviation must not be empty
    CONSTRAINT analysis_entries_deviation_not_empty CHECK (LENGTH(TRIM(deviation)) > 0),

    -- Risk fields must be all set or all null (partial risk assessment not allowed)
    CONSTRAINT analysis_entries_risk_consistency CHECK (
        (severity IS NULL AND likelihood IS NULL AND detectability IS NULL AND risk_score IS NULL AND risk_level IS NULL) OR
        (severity IS NOT NULL AND likelihood IS NOT NULL AND detectability IS NOT NULL AND risk_score IS NOT NULL AND risk_level IS NOT NULL)
    ),

    -- Risk score must equal severity × likelihood × detectability when set
    CONSTRAINT analysis_entries_risk_score_calculation CHECK (
        risk_score IS NULL OR risk_score = severity * likelihood * detectability
    ),

    -- Unique constraint: one entry per analysis + node + guide word + parameter combination
    CONSTRAINT analysis_entries_unique_node_guideword_param
        UNIQUE (analysis_id, node_id, guide_word, parameter)
);

-- ============================================================================
-- TABLE AND COLUMN COMMENTS
-- ============================================================================

COMMENT ON TABLE analysis_entries IS
    'Individual HazOps analysis entries. Each entry represents the analysis of '
    'a specific node using a guide word to identify deviations, causes, '
    'consequences, safeguards, and recommendations with risk ranking.';

COMMENT ON COLUMN analysis_entries.id IS
    'Unique identifier (UUID) for the analysis entry';

COMMENT ON COLUMN analysis_entries.analysis_id IS
    'Foreign key reference to the HazOps analysis session';

COMMENT ON COLUMN analysis_entries.node_id IS
    'Foreign key reference to the analysis node being analyzed';

COMMENT ON COLUMN analysis_entries.guide_word IS
    'Standard HazOps guide word: no, more, less, reverse, early, late, other_than';

COMMENT ON COLUMN analysis_entries.parameter IS
    'Process parameter being analyzed (e.g., flow, pressure, temperature, level)';

COMMENT ON COLUMN analysis_entries.deviation IS
    'Description of the deviation from normal operation';

COMMENT ON COLUMN analysis_entries.causes IS
    'JSON array of possible causes for this deviation';

COMMENT ON COLUMN analysis_entries.consequences IS
    'JSON array of potential consequences of this deviation';

COMMENT ON COLUMN analysis_entries.safeguards IS
    'JSON array of existing safeguards that mitigate this risk';

COMMENT ON COLUMN analysis_entries.recommendations IS
    'JSON array of recommended actions to reduce risk';

COMMENT ON COLUMN analysis_entries.severity IS
    'Severity level (1-5): 1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic';

COMMENT ON COLUMN analysis_entries.likelihood IS
    'Likelihood level (1-5): 1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain';

COMMENT ON COLUMN analysis_entries.detectability IS
    'Detectability level (1-5): 1=Almost Certain, 2=High, 3=Moderate, 4=Low, 5=Undetectable';

COMMENT ON COLUMN analysis_entries.risk_score IS
    'Calculated risk score: severity × likelihood × detectability (range 1-125)';

COMMENT ON COLUMN analysis_entries.risk_level IS
    'Classified risk level: low (1-20), medium (21-60), high (61-125)';

COMMENT ON COLUMN analysis_entries.notes IS
    'Additional notes or comments about this analysis entry';

COMMENT ON COLUMN analysis_entries.created_by_id IS
    'Foreign key reference to the user who created this entry';

COMMENT ON COLUMN analysis_entries.created_at IS
    'Timestamp when the entry was created';

COMMENT ON COLUMN analysis_entries.updated_at IS
    'Timestamp when the entry was last updated';

-- ============================================================================
-- PERFORMANCE INDEXES FOR analysis_entries
-- ============================================================================

-- Index for querying entries by analysis (most common query)
CREATE INDEX idx_analysis_entries_analysis_id
    ON analysis_entries (analysis_id);

-- Index for querying entries by node
CREATE INDEX idx_analysis_entries_node_id
    ON analysis_entries (node_id);

-- Index for filtering by guide word
CREATE INDEX idx_analysis_entries_guide_word
    ON analysis_entries (guide_word);

-- Index for filtering by risk level
CREATE INDEX idx_analysis_entries_risk_level
    ON analysis_entries (risk_level);

-- Index for filtering by risk score (for sorting and filtering high risks)
CREATE INDEX idx_analysis_entries_risk_score
    ON analysis_entries (risk_score DESC NULLS LAST);

-- Index for querying entries by creator
CREATE INDEX idx_analysis_entries_created_by_id
    ON analysis_entries (created_by_id);

-- Composite index for analysis + guide word queries
CREATE INDEX idx_analysis_entries_analysis_guideword
    ON analysis_entries (analysis_id, guide_word);

-- Composite index for analysis + risk level queries (risk dashboard)
CREATE INDEX idx_analysis_entries_analysis_risk
    ON analysis_entries (analysis_id, risk_level);

-- GIN index for searching within JSONB arrays (causes, consequences, etc.)
CREATE INDEX idx_analysis_entries_causes_gin
    ON analysis_entries USING GIN (causes);

CREATE INDEX idx_analysis_entries_consequences_gin
    ON analysis_entries USING GIN (consequences);

CREATE INDEX idx_analysis_entries_safeguards_gin
    ON analysis_entries USING GIN (safeguards);

CREATE INDEX idx_analysis_entries_recommendations_gin
    ON analysis_entries USING GIN (recommendations);
