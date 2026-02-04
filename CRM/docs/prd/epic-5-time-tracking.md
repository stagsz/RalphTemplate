# Epic 5: Time Tracking

**Goal:** Comprehensive time tracking and billing management

**Estimated Time:** 1.5 weeks

## Stories

### Story 5.1: Start/stop timer component (persists across navigation)
**Description:** Create a timer component that tracks time and persists across page navigation.

**Acceptance Criteria:**
- Timer widget visible in navbar/sidebar
- Start/stop button
- Display running time (HH:MM:SS)
- Persist timer state in localStorage
- Continue timer across page navigation
- Timer auto-saves every 60 seconds
- Link timer to contact/deal (optional)
- Stop timer creates time entry
- Visual indicator when timer is running

**Dependencies:** Epic 1 (Authentication)

---

### Story 5.2: Manual time entry form
**Description:** Allow users to manually log time entries.

**Acceptance Criteria:**
- Form fields: duration_minutes, entry_date, notes, contact_id, deal_id, activity_id, is_billable
- Duration input accepts hours:minutes format (e.g., 2:30 = 150 minutes)
- Date picker for entry_date
- Optional linking to contact, deal, or activity
- Billable toggle (default from user settings)
- Validation (duration > 0, valid date)
- Success notification after save

**Dependencies:** Epic 2 (Contact Management), Epic 3 (Deal Pipeline), Epic 4 (Activity Logging)

---

### Story 5.3: Activity-based auto-tracking (link time to activities)
**Description:** Automatically create time entries from logged activities with duration.

**Acceptance Criteria:**
- When activity has duration_minutes, create linked time entry
- Time entry inherits contact_id, deal_id from activity
- Time entry date matches activity_date
- Auto-populated notes from activity subject
- Billable flag based on user default setting
- Display linked time entry on activity detail
- Option to unlink or edit time entry

**Dependencies:** Story 5.2, Epic 4 (Activity Logging)

---

### Story 5.4: Billable hours configuration (default per user)
**Description:** Allow users to set default billable status for time entries.

**Acceptance Criteria:**
- User settings page for time tracking preferences
- Toggle for "billable by default" setting
- Hourly rate field (optional, for reporting)
- Apply default to new time entries
- Override option on each time entry form
- Admin can set organization-wide defaults

**Dependencies:** Story 5.2, Story 1.3 (User Profile)

---

### Story 5.5: Time approval workflow (submit, approve, reject)
**Description:** Implement approval workflow for submitted time entries.

**Acceptance Criteria:**
- Time entry status: draft, submitted, approved, rejected
- Submit button changes status to "submitted"
- Admin approval dashboard showing pending entries
- Approve/reject actions with optional notes
- Email notification on approval/rejection (future)
- Approved entries are locked (no editing)
- Rejected entries return to draft with notes
- Bulk approve option

**Dependencies:** Story 5.2, Story 1.4 (RBAC)

---

### Story 5.6: Admin time tracking dashboard
**Description:** Create admin dashboard for time tracking overview and management.

**Acceptance Criteria:**
- Summary cards: total hours, billable hours, pending approvals, team utilization
- Time entries table (all users)
- Filter by user, date range, status, billable
- Sort by date, duration, user
- Quick approve/reject buttons
- Export to CSV
- Charts: hours by user, billable vs non-billable, hours by project

**Dependencies:** Story 5.5, Story 1.4 (RBAC)

---

### Story 5.7: Time tracking report with CSV export
**Description:** Generate time tracking reports with export functionality.

**Acceptance Criteria:**
- Report filters: date range, user, contact, deal, billable status
- Display: date, user, contact, deal, duration, notes, billable, status
- Totals: total hours, billable hours, estimated value (hours × rate)
- Sort by any column
- Export to CSV with all fields
- Filename: timesheet-YYYY-MM-DD.csv
- Print-friendly view
- Save favorite filter combinations

**Dependencies:** Story 5.6

---

## Technical Notes

- Use Zustand for timer state management (persists to localStorage)
- Store time entries in `time_entries` table with 5 indexes
- Use `setInterval` for timer updates (every second)
- Calculate billable amount: duration_minutes × (hourly_rate / 60)
- RLS policies: users see own entries, admins see all
- Approval workflow requires admin role

## Definition of Done

- All stories completed and tested
- Timer persists across navigation
- Manual time entry working
- Activity-based auto-tracking functional
- Approval workflow implemented
- Admin dashboard complete with reports
- CSV export working
- RLS policies enforced
- Unit tests written (>80% coverage)
- E2E tests for timer and approval flows
- Performance tested with 10,000 time entries
- Code reviewed and merged to main branch
