-- Create time_entries table for time tracking feature (Epic 5)
-- Tracks time spent on contacts, deals, and activities
-- Supports manual entry, timer-based tracking, and activity-linked entries
-- Includes billable hours tracking and approval workflow

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User who logged the time (required)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Related entities (at least one of contact_id or deal_id should be set)
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,

  -- Time tracking fields
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,

  -- Billable hours tracking
  is_billable BOOLEAN DEFAULT true,

  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approval_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, entry_date DESC);
CREATE INDEX idx_time_entries_contact ON time_entries(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_time_entries_deal ON time_entries(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_time_entries_status ON time_entries(status, user_id);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable, entry_date);
CREATE INDEX idx_time_entries_activity ON time_entries(activity_id) WHERE activity_id IS NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE time_entries IS 'Tracks time spent on contacts, deals, and activities with billable hours and approval workflow';
COMMENT ON COLUMN time_entries.status IS 'Workflow status: draft (default), submitted (awaiting approval), approved, rejected';
COMMENT ON COLUMN time_entries.is_billable IS 'Whether this time entry is billable to the client (default: true)';
COMMENT ON COLUMN time_entries.duration_minutes IS 'Duration in minutes (must be positive)';
