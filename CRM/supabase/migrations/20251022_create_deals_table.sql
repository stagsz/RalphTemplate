-- Create deals table for deal pipeline management
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expected_close_date DATE,
  stage TEXT NOT NULL CHECK (stage IN ('lead', 'proposal', 'negotiation', 'closed-won', 'closed-lost')) DEFAULT 'lead',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON public.deals(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_deleted_at ON public.deals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;

-- RLS Policy: Users can see deals owned by them or created by their team
CREATE POLICY "Users can view their own deals"
ON public.deals FOR SELECT
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- RLS Policy: Users can create deals
CREATE POLICY "Users can create deals"
ON public.deals FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Users can update their own deals
CREATE POLICY "Users can update their own deals"
ON public.deals FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Users can soft delete their own deals
CREATE POLICY "Users can delete their own deals"
ON public.deals FOR DELETE
USING (auth.uid() = owner_id);
