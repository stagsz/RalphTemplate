-- Migration: 001_create_enum_types
-- Description: Create PostgreSQL custom enum types for HazOp Assistant
-- Task: DB-01
-- Date: 2026-02-09

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for HazOp application
CREATE SCHEMA IF NOT EXISTS hazop;
SET search_path TO hazop, public;

-- ============================================================================
-- CUSTOM ENUM TYPES
-- These types align with TypeScript definitions in packages/types/src/
-- ============================================================================

-- User role enum (from packages/types/src/user.ts)
-- Values: administrator, lead_analyst, analyst, viewer
CREATE TYPE user_role AS ENUM (
    'administrator',
    'lead_analyst',
    'analyst',
    'viewer'
);

COMMENT ON TYPE user_role IS 'User access roles for the HazOp system';

-- Project status enum (from packages/types/src/project.ts)
-- Values: planning, active, review, completed, archived
CREATE TYPE project_status AS ENUM (
    'planning',
    'active',
    'review',
    'completed',
    'archived'
);

COMMENT ON TYPE project_status IS 'Lifecycle status of HazOp projects';

-- Project member role enum (from packages/types/src/project.ts)
-- Values: owner, lead, member, viewer
CREATE TYPE project_member_role AS ENUM (
    'owner',
    'lead',
    'member',
    'viewer'
);

COMMENT ON TYPE project_member_role IS 'Role of a user within a specific project';

-- Equipment type enum (from packages/types/src/analysis-node.ts)
-- Values: pump, valve, reactor, heat_exchanger, pipe, tank, other
CREATE TYPE equipment_type AS ENUM (
    'pump',
    'valve',
    'reactor',
    'heat_exchanger',
    'pipe',
    'tank',
    'other'
);

COMMENT ON TYPE equipment_type IS 'P&ID equipment/node types for HazOp analysis';

-- Guide word enum (from packages/types/src/hazop-analysis.ts)
-- Values: no, more, less, reverse, early, late, other_than
CREATE TYPE guide_word AS ENUM (
    'no',
    'more',
    'less',
    'reverse',
    'early',
    'late',
    'other_than'
);

COMMENT ON TYPE guide_word IS 'Standard HazOp guide words for deviation analysis';

-- Risk level enum (from packages/types/src/hazop-analysis.ts)
-- Values: low, medium, high
CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high'
);

COMMENT ON TYPE risk_level IS 'Calculated risk level based on severity, likelihood, and detectability';

-- Analysis status enum (from packages/types/src/hazop-analysis.ts)
-- Values: draft, in_review, approved, rejected
CREATE TYPE analysis_status AS ENUM (
    'draft',
    'in_review',
    'approved',
    'rejected'
);

COMMENT ON TYPE analysis_status IS 'Status of HazOp analysis sessions';

-- PID document status enum (from packages/types/src/pid-document.ts)
-- Values: pending, processing, processed, failed
CREATE TYPE pid_document_status AS ENUM (
    'pending',
    'processing',
    'processed',
    'failed'
);

COMMENT ON TYPE pid_document_status IS 'Processing status for uploaded P&ID documents';

-- Report format enum (from packages/types/src/report.ts)
-- Values: pdf, word, excel, powerpoint
CREATE TYPE report_format AS ENUM (
    'pdf',
    'word',
    'excel',
    'powerpoint'
);

COMMENT ON TYPE report_format IS 'Output format for generated HazOp reports';

-- Report status enum (from packages/types/src/report.ts)
-- Values: pending, generating, completed, failed
CREATE TYPE report_status AS ENUM (
    'pending',
    'generating',
    'completed',
    'failed'
);

COMMENT ON TYPE report_status IS 'Generation status for HazOp reports';

-- ============================================================================
-- AUDIT LOG OPERATION TYPE
-- For tracking database changes
-- ============================================================================

CREATE TYPE audit_operation AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE'
);

COMMENT ON TYPE audit_operation IS 'Type of database operation for audit logging';

-- ============================================================================
-- VERIFICATION QUERIES
-- These can be used to verify the migration was successful
-- ============================================================================

-- To list all custom types:
-- SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hazop');

-- To see enum values for a specific type:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'hazop.user_role'::regtype;
