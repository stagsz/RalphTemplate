# Product Requirements Document (PRD)
# CRM Application - V1.0 MVP

**Version:** 1.0
**Date:** October 20, 2025
**Status:** Draft - Ready for Architecture Review
**Author:** Product Team

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 20, 2025 | Product Team | Initial minimal MVP PRD |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Strategy](#2-product-strategy)
3. [Target Users & Personas](#3-target-users--personas)
4. [Core Features (V1.0 MVP)](#4-core-features-v10-mvp)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Tech Stack](#7-tech-stack)
8. [Epics & Stories Breakdown](#8-epics--stories-breakdown)
9. [Data Model](#9-data-model)
10. [UI/UX Guidelines](#10-uiux-guidelines)
11. [Success Metrics](#11-success-metrics)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Future Roadmap (V2.0+)](#13-future-roadmap-v20)

---

## 1. Executive Summary

### 1.1 Product Vision
A **simple, fast CRM** that helps small sales teams manage contacts and close deals without the complexity and cost of enterprise solutions like Salesforce.

### 1.2 V1.0 MVP Scope
**Core Features Only:**
- Contact Management (CRUD, search, import)
- Deal Pipeline (Kanban board, stages, tracking)
- Activity Logging (calls, emails, meetings, notes)
- Time Tracking (timer, billable hours, admin reports)
- Basic Reporting (3 essential reports)
- User Management (basic roles)

**Timeline:** 2-3 months to launch

**Target:** 100 beta users by Month 3

### 1.3 Key Differentiators
- **Lightning Fast Setup:** 5 minutes vs 2 weeks (Salesforce)
- **Dead Simple:** No training required
- **Affordable:** Free tier + $29/user/month vs Salesforce $150+
- **Modern Tech:** Built with Next.js 15, not legacy architecture

### 1.4 What's NOT in V1.0 (Non-Goals)

❌ **Explicitly OUT of V1.0:**
- Email integration (Gmail, Outlook) → V2.0
- Calendar integration → V2.0
- Lead scoring → V2.0
- Automation/workflows → V2.0
- Slack/Stripe/Zapier integrations → V2.0+
- Native mobile apps → V2.0
- Advanced permissions → V2.0

✅ **What IS in V1.0:**
- Core CRM: Contacts, Deals, Activities
- Time tracking with billable hours
- Mobile-responsive web UI
- CSV import/export
- 4 basic reports (including time tracking)
- Simple user roles (Admin, User)

---

## 2. Product Strategy

### 2.1 Market Opportunity
- **Target Market:** Small B2B sales teams (5-50 people)
- **Problem:** Existing CRMs are too complex/expensive for small teams
- **Solution:** Minimal CRM focused on core workflows

### 2.2 Positioning
"The CRM you can set up in 5 minutes and actually want to use"

### 2.3 Go-to-Market
- Beta launch: Month 3
- Free tier: Up to 3 users, 100 contacts
- Paid tier: $29/user/month, unlimited contacts

---

## 3. Target Users & Personas

### 3.1 Primary Persona: Sales Rep (Sarah)
- **Role:** Account Executive at 20-person company
- **Current Tool:** Spreadsheets or HubSpot Free
- **Pain Points:**
  - Too much time on data entry
  - Can't find customer info quickly
  - No visibility into pipeline
- **Goals:**
  - Log activities in <15 seconds
  - See all customer history in one place
  - Track deals visually

### 3.2 Secondary Persona: Sales Manager (Michael)
- **Role:** Head of Sales at 30-person company
- **Current Tool:** Spreadsheets + Slack
- **Pain Points:**
  - No real-time pipeline visibility
  - Manual reporting takes hours
  - Can't forecast accurately
- **Goals:**
  - See team pipeline at a glance
  - Generate reports in 1 click
  - Track team activity

---

## 4. Core Features (V1.0 MVP)

### 4.1 MUST HAVE (P0 - Launch Blockers)

#### Feature 1: Contact Management
- **CRUD Operations:** Create, read, update, delete contacts
- **Fields:** Name, email, phone, company, title, status (lead/customer)
- **Search:** Global search by name, email, company
- **Import:** CSV upload (up to 1,000 contacts)
- **Export:** CSV download
- **Custom Fields:** 5 custom fields per contact

#### Feature 2: Deal Pipeline
- **Visual Kanban:** Drag-and-drop pipeline board
- **Deal Stages:**
  - Lead → Qualified → Proposal → Negotiation → Closed Won/Lost
  - Customizable stage names and order
- **Deal Fields:** Name, value, close date, stage, probability
- **Deal Detail:** View/edit all deal information
- **Link to Contacts:** Associate deals with contacts/companies

#### Feature 3: Activity Logging
- **Quick Log:** Log call, email, meeting, or note in <15 seconds
- **Activity Types:** Call, Email, Meeting, Note
- **Fields:** Type, date, duration, notes, related contact/deal
- **Timeline:** View all activities for a contact or deal
- **Keyboard Shortcuts:**
  - `C` = Log call
  - `E` = Log email
  - `M` = Log meeting
  - `N` = Add note

#### Feature 4: Time Tracking
- **Automatic Timer:** Start/stop timer for leads and deals
- **Activity-Based Tracking:** Auto-log time when activities are created
- **Manual Time Entry:** Add/edit time entries manually
- **Billable Hours:** Mark time as billable or non-billable
- **Time Approval:** Admin can approve/reject time entries
- **Admin Dashboard:**
  - View total time per user, per lead, per deal
  - Filter by date range, user, billable status
  - Export timesheets to CSV

#### Feature 5: Basic Reporting
- **Report 1: Sales Pipeline**
  - Deals by stage
  - Total value per stage
  - Filter by user, date range
- **Report 2: Activity Summary**
  - Activities logged per user
  - Breakdown by type (calls, emails, meetings)
- **Report 3: Win/Loss Report**
  - Win rate by stage
  - Lost deal reasons
  - Average deal size
- **Report 4: Time Tracking Report**
  - Total hours per user, per lead, per deal
  - Billable vs non-billable breakdown
  - Export to CSV for payroll/invoicing

#### Feature 6: User Management
- **Roles:**
  - Admin: Full access, manage users, settings
  - User: Access own data, view team data
- **User Profile:** Name, email, password, timezone
- **Team View:** See all users and their activity

---

## 5. Functional Requirements

### 5.1 Contact Management (FR-CM)

#### FR-CM-001: Create Contact
**Priority:** P0 (Must Have)

**User Story:**
> As a sales rep, I want to create a new contact in under 30 seconds so that I can quickly capture lead information.

**Acceptance Criteria:**
- ✅ AC1: Form opens in <500ms
- ✅ AC2: Required fields: First Name, Last Name, Email
- ✅ AC3: Email format validation (on blur)
- ✅ AC4: Duplicate detection: Warn if email exists
- ✅ AC5: Save completes in <2 seconds
- ✅ AC6: Redirect to contact detail page after save

#### FR-CM-002: Contact List View
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Load 100 contacts in <1 second
- ✅ AC2: Columns: Name, Company, Email, Status, Owner
- ✅ AC3: Sort by any column
- ✅ AC4: Filter by owner, status
- ✅ AC5: Pagination (100 per page)
- ✅ AC6: Global search (name, email, company)

#### FR-CM-003: Import Contacts (CSV)
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Support CSV format
- ✅ AC2: Map CSV columns to CRM fields
- ✅ AC3: Import up to 1,000 contacts
- ✅ AC4: Complete in <30 seconds for 1,000 contacts
- ✅ AC5: Duplicate detection by email
- ✅ AC6: Show import summary (created, skipped, errors)

---

### 5.2 Deal Management (FR-DM)

#### FR-DM-001: Visual Pipeline Board
**Priority:** P0 (Must Have)

**User Story:**
> As a sales rep, I want to see all my deals in a visual pipeline so I can prioritize my work.

**Acceptance Criteria:**
- ✅ AC1: Kanban board with 5 stages (Lead, Qualified, Proposal, Negotiation, Closed)
- ✅ AC2: Drag-and-drop to move deals between stages
- ✅ AC3: Show deal name, value, close date on card
- ✅ AC4: Load 100 deals in <1 second
- ✅ AC5: Filter by owner, date range
- ✅ AC6: Total value displayed per stage

#### FR-DM-002: Create Deal
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Required fields: Deal Name, Value, Close Date, Stage
- ✅ AC2: Default stage: "Qualified"
- ✅ AC3: Default close date: 30 days from today
- ✅ AC4: Link to contact/company (optional)
- ✅ AC5: Save in <2 seconds
- ✅ AC6: Redirect to deal detail page

#### FR-DM-003: Deal Detail Page
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Show all deal fields (editable inline)
- ✅ AC2: Activity timeline (calls, emails, meetings, notes)
- ✅ AC3: Quick log activity from deal page
- ✅ AC4: Stage history (audit trail)
- ✅ AC5: Load in <1 second

---

### 5.3 Activity Logging (FR-AL)

#### FR-AL-001: Quick Log Activity
**Priority:** P0 (Must Have)

**User Story:**
> As a sales rep, I want to log a call in under 15 seconds so I don't lose momentum.

**Acceptance Criteria:**
- ✅ AC1: Modal opens in <300ms
- ✅ AC2: Required fields: Type, Date, Related Contact/Deal
- ✅ AC3: Optional fields: Duration, Notes
- ✅ AC4: Keyboard shortcuts work (C, E, M, N)
- ✅ AC5: Save in <1 second
- ✅ AC6: Activity appears in timeline immediately

#### FR-AL-002: Activity Timeline
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Show all activities for a contact or deal
- ✅ AC2: Sort by date (newest first)
- ✅ AC3: Load 50 activities in <500ms
- ✅ AC4: Filter by type (call, email, meeting, note)
- ✅ AC5: Edit/delete any activity

---

### 5.4 Time Tracking (FR-TT)

#### FR-TT-001: Start/Stop Timer
**Priority:** P1 (Should Have)

**User Story:**
> As a sales rep, I want to start a timer when I begin working on a lead so that my time is automatically tracked without manual entry.

**Acceptance Criteria:**
- ✅ AC1: Timer button visible on contact and deal pages
- ✅ AC2: Click "Start Timer" → Timer begins (shows elapsed time)
- ✅ AC3: Click "Stop Timer" → Time entry created automatically
- ✅ AC4: Timer persists across page navigation
- ✅ AC5: Only one timer can run at a time
- ✅ AC6: Timer shows notification if left running >8 hours

#### FR-TT-002: Manual Time Entry
**Priority:** P1 (Should Have)

**User Story:**
> As a sales rep, I want to manually add time I spent on a lead yesterday so I can track all my work accurately.

**Acceptance Criteria:**
- ✅ AC1: "Add Time" button on contact/deal pages
- ✅ AC2: Required fields: Duration (hours/minutes), Date, Related Contact/Deal
- ✅ AC3: Optional fields: Notes, Billable (checkbox, default: true)
- ✅ AC4: Duration can be entered as HH:MM or decimal (1.5 hours)
- ✅ AC5: Save in <1 second
- ✅ AC6: Time entry appears in timeline immediately

#### FR-TT-003: Activity-Based Auto-Tracking
**Priority:** P1 (Should Have)

**User Story:**
> As a sales rep, when I log a call that lasted 30 minutes, I want the time to be automatically tracked so I don't have to enter it twice.

**Acceptance Criteria:**
- ✅ AC1: When activity with duration is logged, create time entry automatically
- ✅ AC2: Time entry links to the activity
- ✅ AC3: User can edit/delete auto-created time entries
- ✅ AC4: Checkbox in activity form: "Track time for this activity" (default: checked)
- ✅ AC5: Duration from activity maps to time entry duration

#### FR-TT-004: Billable Hours Tracking
**Priority:** P1 (Should Have)

**User Story:**
> As an admin, I want to mark time as billable or non-billable so I can invoice clients accurately.

**Acceptance Criteria:**
- ✅ AC1: Each time entry has "Billable" checkbox
- ✅ AC2: Default billable status configurable per user (Admin setting)
- ✅ AC3: Admin can bulk update billable status for multiple entries
- ✅ AC4: Time tracking report shows billable vs non-billable breakdown
- ✅ AC5: Export includes billable flag

#### FR-TT-005: Time Approval Workflow
**Priority:** P1 (Should Have)

**User Story:**
> As an admin, I want to approve time entries before they're finalized so I can ensure accuracy.

**Acceptance Criteria:**
- ✅ AC1: Time entries have status: Draft, Submitted, Approved, Rejected
- ✅ AC2: Users can submit time for approval (changes status to "Submitted")
- ✅ AC3: Admin sees pending approvals in dashboard
- ✅ AC4: Admin can approve/reject with optional note
- ✅ AC5: Approved time cannot be edited by user (only admin)
- ✅ AC6: Rejected time returns to Draft with admin note visible

#### FR-TT-006: Admin Time Tracking Dashboard
**Priority:** P1 (Should Have)

**User Story:**
> As an admin, I want to see total time tracked per user and per lead so I can manage team workload and billing.

**Acceptance Criteria:**
- ✅ AC1: Dashboard shows total hours (today, this week, this month)
- ✅ AC2: Breakdown by user (sortable table)
- ✅ AC3: Breakdown by contact/deal (top 10 by hours)
- ✅ AC4: Filter by date range, user, billable status, approval status
- ✅ AC5: Visual chart: Hours per day (last 7 days)
- ✅ AC6: "Export Timesheet" button → CSV download
- ✅ AC7: Load in <2 seconds

---

### 5.5 Reporting (FR-RP)

#### FR-RP-001: Sales Pipeline Report
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
- ✅ AC1: Show deals by stage
- ✅ AC2: Total value per stage
- ✅ AC3: Filter by owner, date range
- ✅ AC4: Export to CSV
- ✅ AC5: Load in <2 seconds

#### FR-RP-002: Activity Summary Report
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
- ✅ AC1: Activities logged per user (last 30 days)
- ✅ AC2: Breakdown by type (calls, emails, meetings)
- ✅ AC3: Filter by user, date range
- ✅ AC4: Export to CSV

#### FR-RP-003: Time Tracking Report
**Priority:** P1 (Should Have)

**User Story:**
> As an admin, I want to export timesheets for payroll and invoicing so I can bill clients accurately.

**Acceptance Criteria:**
- ✅ AC1: Show total hours per user (sortable table)
- ✅ AC2: Show total hours per contact/deal
- ✅ AC3: Breakdown: Billable vs Non-billable hours
- ✅ AC4: Breakdown: Approved vs Pending vs Rejected
- ✅ AC5: Filter by date range, user, billable status, approval status
- ✅ AC6: Export to CSV with columns: Date, User, Contact/Deal, Duration, Billable, Status, Notes
- ✅ AC7: Load in <2 seconds for <10,000 time entries

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Page Load:** P95 < 2 seconds on 4G
- **API Latency:** P95 < 500ms
- **Database Queries:** No query > 100ms

### 6.2 Security
- **Authentication:** Email/password + 2FA (optional)
- **Authorization:** Role-based access control
- **Data Encryption:** At rest (database) and in transit (HTTPS)
- **Password Policy:** Min 8 characters, require letters + numbers

### 6.3 Scalability
- **Users:** Support up to 500 concurrent users
- **Data:** Handle 100,000 contacts, 50,000 deals
- **Growth:** Architecture supports 10x growth without major refactor

### 6.4 Reliability
- **Uptime:** 99.5% availability target
- **Data Backup:** Daily automated backups
- **Recovery:** RTO < 4 hours, RPO < 1 hour

---

## 7. Tech Stack

### 7.1 Architecture
**Approach:** Serverless Monolith (Next.js App Router)

### 7.2 Stack
```
Frontend:
- Framework: Next.js 15 (App Router)
- UI Library: React 19
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: React Context + Server State

Backend:
- API: Next.js API Routes + Server Actions
- Language: TypeScript

Database:
- Primary: Supabase (PostgreSQL 14)
- Features: Row Level Security, Real-time subscriptions

Authentication:
- Provider: Supabase Auth
- Methods: Email/password, OAuth (Google, GitHub)

Storage:
- Files: Supabase Storage (for CSV imports)

Deployment:
- Platform: Vercel
- CI/CD: GitHub Actions
- Domain: Custom domain via Vercel

Monitoring:
- Analytics: Vercel Analytics
- Errors: Vercel Logs + Supabase Dashboard
```

---

## 8. Epics & Stories Breakdown

### Epic 1: Foundation & Authentication
**Goal:** Basic app infrastructure and user authentication

**Stories:**
- **Story 1.1:** Project setup (Next.js 15 + Supabase + Vercel)
- **Story 1.2:** Authentication UI (Signup, Login, Logout)
- **Story 1.3:** User profile page
- **Story 1.4:** Role-based access control (Admin, User)

**Estimated Time:** 1 week

---

### Epic 2: Contact Management
**Goal:** Full contact lifecycle management

**Stories:**
- **Story 2.1:** Create contact form with validation
- **Story 2.2:** Contact list view (table, search, filters)
- **Story 2.3:** Contact detail page
- **Story 2.4:** Edit/delete contact
- **Story 2.5:** CSV import wizard
- **Story 2.6:** CSV export
- **Story 2.7:** Custom fields (5 per contact)

**Estimated Time:** 2 weeks

---

### Epic 3: Deal Pipeline
**Goal:** Visual deal management and tracking

**Stories:**
- **Story 3.1:** Pipeline Kanban board (drag-and-drop)
- **Story 3.2:** Create deal form
- **Story 3.3:** Deal detail page
- **Story 3.4:** Edit/delete deal
- **Story 3.5:** Deal stage configuration (admin)
- **Story 3.6:** Link deals to contacts/companies

**Estimated Time:** 2 weeks

---

### Epic 4: Activity Logging
**Goal:** Quick activity tracking and timeline

**Stories:**
- **Story 4.1:** Quick log modal (calls, emails, meetings, notes)
- **Story 4.2:** Activity timeline component
- **Story 4.3:** Keyboard shortcuts (C, E, M, N)
- **Story 4.4:** Edit/delete activities
- **Story 4.5:** Activity filters (type, date)

**Estimated Time:** 1 week

---

### Epic 5: Time Tracking
**Goal:** Comprehensive time tracking and billing management

**Stories:**
- **Story 5.1:** Start/stop timer component (persists across navigation)
- **Story 5.2:** Manual time entry form
- **Story 5.3:** Activity-based auto-tracking (link time to activities)
- **Story 5.4:** Billable hours configuration (default per user)
- **Story 5.5:** Time approval workflow (submit, approve, reject)
- **Story 5.6:** Admin time tracking dashboard
- **Story 5.7:** Time tracking report with CSV export

**Estimated Time:** 1.5 weeks

---

### Epic 6: Reporting
**Goal:** Basic sales insights

**Stories:**
- **Story 6.1:** Sales pipeline report
- **Story 6.2:** Activity summary report
- **Story 6.3:** Win/loss report
- **Story 6.4:** Time tracking report (see Epic 5)
- **Story 6.5:** CSV export for all reports

**Estimated Time:** 1 week

---

### Epic 7: User Management
**Goal:** Team collaboration features

**Stories:**
- **Story 7.1:** User list (admin only)
- **Story 7.2:** Invite users
- **Story 7.3:** Assign roles
- **Story 7.4:** User activity log

**Estimated Time:** 3 days

---

### Epic 8: Polish & Launch Prep
**Goal:** Production-ready quality

**Stories:**
- **Story 8.1:** Mobile responsive optimization
- **Story 8.2:** Loading states and error handling
- **Story 8.3:** Onboarding tutorial
- **Story 8.4:** Performance optimization
- **Story 8.5:** Security audit
- **Story 8.6:** Beta testing with 10 users

**Estimated Time:** 1 week

---

## 9. Data Model

### 9.1 Core Tables

#### users
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

#### contacts
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

#### deals
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

#### activities
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

#### time_entries
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

### 9.2 Relationships
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

## 10. UI/UX Guidelines

### 10.1 Design Principles
1. **Speed First:** Every action completes in <2 seconds
2. **Mobile-Friendly:** Responsive design, works on iPhone/Android
3. **Keyboard-First:** Power users can do everything with keyboard
4. **Progressive Disclosure:** Show simple, reveal complexity on demand

### 10.2 Key Screens
1. **Dashboard:** Pipeline overview + recent activities + active timer
2. **Contact List:** Table with search and filters
3. **Contact Detail:** Profile + activity timeline + time tracking
4. **Pipeline Board:** Kanban view with drag-and-drop
5. **Deal Detail:** Deal info + activity timeline + time tracking
6. **Time Tracking Dashboard (Admin):** Hours by user, approval queue, export

### 10.3 Mobile Responsiveness
- **Breakpoints:** Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- **Touch Targets:** Minimum 44x44px
- **Navigation:** Hamburger menu on mobile

---

## 11. Success Metrics

### 11.1 Development Metrics (Internal)
- **Month 1:** Foundation complete, authentication working
- **Month 2:** Core features complete (contacts, deals, activities)
- **Month 3:** Polish complete, ready for beta launch

### 11.2 Beta Launch Metrics (Month 3)
- **User Acquisition:** 100 beta users
- **Activation:** 80% of users create at least 1 contact and 1 deal
- **Engagement:** 60% weekly active users
- **Performance:** P95 page load <2 seconds

### 11.3 Post-Launch Metrics (Months 4-6)
- **Growth:** 500 total users
- **Retention:** <10% monthly churn
- **NPS:** >40
- **Revenue:** $5K MRR (assuming $29/user/month, 200 paid users)

---

## 12. Implementation Roadmap

### 12.1 Month 1: Foundation
**Week 1:**
- Project setup (Next.js 15, Supabase, Vercel)
- CI/CD pipeline (GitHub Actions)
- Database schema v1
- Authentication (signup, login, logout)

**Week 2:**
- User roles and permissions
- Basic UI shell (header, nav, dashboard)
- User profile page
- Deploy to staging

**Week 3-4:**
- Contact management (CRUD)
- Contact list view with search
- Contact detail page

**Deliverable:** Working contact management, 5 alpha testers

---

### 12.2 Month 2: Core Features
**Week 5-6:**
- Deal pipeline (Kanban board)
- Deal CRUD operations
- Deal detail page
- Drag-and-drop functionality

**Week 7:**
- Activity logging (quick log modal)
- Activity timeline component
- Keyboard shortcuts
- Activity-based time tracking (auto-create time entries)

**Week 8:**
- Time tracking: Timer component (start/stop)
- Time tracking: Manual entry form
- Time tracking: Billable hours configuration
- CSV import for contacts

**Deliverable:** Full CRM functionality, 20 beta testers

---

### 12.3 Month 3: Polish & Launch
**Week 9:**
- Time tracking: Approval workflow (submit, approve, reject)
- Time tracking: Admin dashboard
- Time tracking report + CSV export
- Custom fields for contacts

**Week 10:**
- Basic reporting (Sales pipeline, Activity summary, Win/loss)
- CSV export for contacts/deals
- User management (admin features)
- Mobile responsive optimization

**Week 11:**
- Performance tuning and optimization
- Onboarding tutorial
- Error handling improvements
- Beta testing (50 users)

**Week 12:**
- Bug fixes from beta testing
- Security audit
- Final polish and documentation
- **Beta Launch:** Open to 100 users

---

## 13. Future Roadmap (V2.0+)

### 13.1 V2.0 (Months 4-6) - Integrations
**Based on user feedback, add most-requested features:**
- Gmail integration (email sync)
- Google Calendar integration (meeting sync)
- Lead scoring (rule-based)
- Email templates
- Basic automation (5 workflows)

### 13.2 V3.0 (Months 7-12) - Intelligence
- AI lead scoring (ML-based)
- Slack integration
- Stripe integration (billing)
- Advanced workflows
- Native mobile apps (iOS, Android)

### 13.3 V4.0 (Year 2+) - Scale
- Zapier integration
- Mailchimp integration
- Custom reports builder
- API for third-party integrations
- Marketplace for plugins

---

## End of PRD V1.0

**Status:** Ready for Architecture Review

**Next Steps:**
1. Architecture review (Architect agent)
2. Epic/story sharding (PO agent)
3. Sprint planning (SM agent)
4. Development start (Dev agent)

---

*This PRD focuses on delivering core CRM value in 2-3 months. All integrations and advanced features are intentionally deferred to V2.0+ based on user feedback.*
