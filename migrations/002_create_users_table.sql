-- Migration: 002_create_users_table
-- Description: Create users table with password_hash, role, organization
-- Task: DB-02
-- Date: 2026-02-09

-- Ensure we're using the hazop schema
SET search_path TO hazop, public;

-- ============================================================================
-- USERS TABLE
-- Stores authenticated user accounts for the HazOp system
-- Aligns with TypeScript interface: packages/types/src/user.ts
-- ============================================================================

CREATE TABLE users (
    -- Primary key using UUID for distributed systems compatibility
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication credentials
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- User profile
    name VARCHAR(255) NOT NULL,

    -- Role determines permissions (uses user_role enum from migration 001)
    role user_role NOT NULL DEFAULT 'viewer',

    -- Organization/company the user belongs to
    organization VARCHAR(255) NOT NULL,

    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT users_organization_not_empty CHECK (LENGTH(TRIM(organization)) > 0)
);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts for HazOp Assistant authentication and authorization';
COMMENT ON COLUMN users.id IS 'Unique identifier (UUID v4)';
COMMENT ON COLUMN users.email IS 'User email address, used for login (unique)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password - never expose to clients';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.role IS 'User role determining system-wide permissions';
COMMENT ON COLUMN users.organization IS 'Organization/company the user belongs to';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active and can log in';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user account was last modified';

-- ============================================================================
-- INDEXES
-- Performance indexes will be added in DB-10, but email lookup is critical
-- for authentication, so we add it here
-- ============================================================================

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_organization ON users (organization);
CREATE INDEX idx_users_is_active ON users (is_active);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify the table was created:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'hazop' AND table_name = 'users';

-- To verify constraints:
-- SELECT conname, contype FROM pg_constraint
-- WHERE conrelid = 'hazop.users'::regclass;
