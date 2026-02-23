-- Migration: 003_create_projects_tables
-- Description: Create projects and project_members tables for HazOp project management
-- Task: DB-03
-- Date: 2026-02-09

-- Set search path to use the hazop schema
SET search_path TO hazop, public;

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
-- Stores HazOp projects which contain P&ID documents and analyses

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status project_status NOT NULL DEFAULT 'planning',
    created_by_id UUID NOT NULL,
    organization VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraint
    CONSTRAINT projects_created_by_fk FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Business rule: project names must be unique within an organization
    CONSTRAINT projects_org_name_unique UNIQUE (organization, name),

    -- Validation constraints
    CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT projects_organization_not_empty CHECK (LENGTH(TRIM(organization)) > 0)
);

-- Table comment
COMMENT ON TABLE projects IS 'HazOp projects containing P&ID documents and analysis sessions';

-- Column comments
COMMENT ON COLUMN projects.id IS 'Unique project identifier (UUID)';
COMMENT ON COLUMN projects.name IS 'Project name (unique within organization)';
COMMENT ON COLUMN projects.description IS 'Optional project description';
COMMENT ON COLUMN projects.status IS 'Current project status: planning, active, review, completed, archived';
COMMENT ON COLUMN projects.created_by_id IS 'Reference to the user who created the project';
COMMENT ON COLUMN projects.organization IS 'Organization that owns this project';
COMMENT ON COLUMN projects.created_at IS 'Timestamp when project was created';
COMMENT ON COLUMN projects.updated_at IS 'Timestamp when project was last modified';

-- Performance indexes for projects table
CREATE INDEX idx_projects_created_by_id ON projects (created_by_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_organization ON projects (organization);
CREATE INDEX idx_projects_created_at ON projects (created_at DESC);

-- ============================================================================
-- PROJECT_MEMBERS TABLE
-- ============================================================================
-- Stores project team membership with role-based access

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role project_member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT project_members_project_fk FOREIGN KEY (project_id)
        REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT project_members_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

    -- Business rule: a user can only be a member of a project once
    CONSTRAINT project_members_unique UNIQUE (project_id, user_id)
);

-- Table comment
COMMENT ON TABLE project_members IS 'Project team membership with role-based access control';

-- Column comments
COMMENT ON COLUMN project_members.id IS 'Unique membership identifier (UUID)';
COMMENT ON COLUMN project_members.project_id IS 'Reference to the project';
COMMENT ON COLUMN project_members.user_id IS 'Reference to the team member user';
COMMENT ON COLUMN project_members.role IS 'Member role: owner, lead, member, viewer';
COMMENT ON COLUMN project_members.joined_at IS 'Timestamp when user joined the project';

-- Performance indexes for project_members table
CREATE INDEX idx_project_members_project_id ON project_members (project_id);
CREATE INDEX idx_project_members_user_id ON project_members (user_id);
CREATE INDEX idx_project_members_role ON project_members (role);
