-- Create activities table for activity & task management
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('call', 'meeting', 'email', 'note', 'task')),
  subject TEXT NOT NULL,
  description TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT activity_relation_check CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON public.activities(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON public.activities(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON public.activities(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(due_date) WHERE deleted_at IS NULL AND status != 'completed';
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON public.activities(deleted_at);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view activities for their contacts/deals" ON public.activities;
DROP POLICY IF EXISTS "Users can view assigned activities" ON public.activities;
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON public.activities;

-- RLS Policy: Users can view activities for contacts/deals they own
CREATE POLICY "Users can view activities for their contacts/deals"
ON public.activities FOR SELECT
USING (
  deleted_at IS NULL AND (
    owner_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = activities.contact_id AND contacts.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = activities.deal_id AND deals.owner_id = auth.uid()
    )
  )
);

-- RLS Policy: Users can create activities
CREATE POLICY "Users can create activities"
ON public.activities FOR INSERT
WITH CHECK (
  owner_id = auth.uid() AND
  (
    contact_id IN (SELECT id FROM public.contacts WHERE owner_id = auth.uid()) OR
    deal_id IN (SELECT id FROM public.deals WHERE owner_id = auth.uid())
  )
);

-- RLS Policy: Users can update their own activities or assigned tasks
CREATE POLICY "Users can update their own activities"
ON public.activities FOR UPDATE
USING (
  deleted_at IS NULL AND (
    owner_id = auth.uid() OR
    assigned_to = auth.uid()
  )
)
WITH CHECK (
  owner_id = auth.uid() OR
  assigned_to = auth.uid()
);

-- RLS Policy: Users can soft delete their own activities
CREATE POLICY "Users can delete their own activities"
ON public.activities FOR DELETE
USING (owner_id = auth.uid());

-- RLS Policy: Admins can view all activities
CREATE POLICY "Admins can view all activities"
ON public.activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();