# 9. Data Model

## 9.1 Core Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### contacts
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  status TEXT CHECK (status IN ('lead', 'customer')),
  owner_id UUID REFERENCES users(id),
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_email ON contacts(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_owner ON contacts(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_search ON contacts USING GIN(
  to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(company, ''))
);
```

### deals
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL(12, 2),
  stage TEXT NOT NULL,
  probability INTEGER DEFAULT 25,
  expected_close_date DATE,
  contact_id UUID REFERENCES contacts(id),
  owner_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('open', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_stage ON deals(stage) WHERE deleted_at IS NULL AND status = 'open';
CREATE INDEX idx_deals_owner ON deals(owner_id) WHERE deleted_at IS NULL;
```

### activities
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
  subject TEXT,
  notes TEXT,
  duration_minutes INTEGER,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id),
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_contact ON activities(contact_id, activity_date DESC);
CREATE INDEX idx_activities_deal ON activities(deal_id, activity_date DESC);
```

### time_entries
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_billable BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approval_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_user ON time_entries(user_id, entry_date DESC);
CREATE INDEX idx_time_entries_contact ON time_entries(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_time_entries_deal ON time_entries(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_time_entries_status ON time_entries(status, user_id);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable, entry_date);
```

## 9.2 Relationships
```
users (1) ----< (many) contacts [owner]
users (1) ----< (many) deals [owner]
users (1) ----< (many) activities [owner]
users (1) ----< (many) time_entries [tracked by]
users (1) ----< (many) time_entries [approved by]
contacts (1) ----< (many) deals [primary contact]
contacts (1) ----< (many) activities [related to]
contacts (1) ----< (many) time_entries [related to]
deals (1) ----< (many) activities [related to]
deals (1) ----< (many) time_entries [related to]
activities (1) ----< (1) time_entries [auto-tracked from]
```

---
