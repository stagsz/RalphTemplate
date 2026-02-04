# 5. Functional Requirements

## 5.1 Contact Management (FR-CM)

### FR-CM-001: Create Contact
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

### FR-CM-002: Contact List View
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Load 100 contacts in <1 second
- ✅ AC2: Columns: Name, Company, Email, Status, Owner
- ✅ AC3: Sort by any column
- ✅ AC4: Filter by owner, status
- ✅ AC5: Pagination (100 per page)
- ✅ AC6: Global search (name, email, company)

### FR-CM-003: Import Contacts (CSV)
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Support CSV format
- ✅ AC2: Map CSV columns to CRM fields
- ✅ AC3: Import up to 1,000 contacts
- ✅ AC4: Complete in <30 seconds for 1,000 contacts
- ✅ AC5: Duplicate detection by email
- ✅ AC6: Show import summary (created, skipped, errors)

---

## 5.2 Deal Management (FR-DM)

### FR-DM-001: Visual Pipeline Board
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

### FR-DM-002: Create Deal
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Required fields: Deal Name, Value, Close Date, Stage
- ✅ AC2: Default stage: "Qualified"
- ✅ AC3: Default close date: 30 days from today
- ✅ AC4: Link to contact/company (optional)
- ✅ AC5: Save in <2 seconds
- ✅ AC6: Redirect to deal detail page

### FR-DM-003: Deal Detail Page
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Show all deal fields (editable inline)
- ✅ AC2: Activity timeline (calls, emails, meetings, notes)
- ✅ AC3: Quick log activity from deal page
- ✅ AC4: Stage history (audit trail)
- ✅ AC5: Load in <1 second

---

## 5.3 Activity Logging (FR-AL)

### FR-AL-001: Quick Log Activity
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

### FR-AL-002: Activity Timeline
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
- ✅ AC1: Show all activities for a contact or deal
- ✅ AC2: Sort by date (newest first)
- ✅ AC3: Load 50 activities in <500ms
- ✅ AC4: Filter by type (call, email, meeting, note)
- ✅ AC5: Edit/delete any activity

---

## 5.4 Time Tracking (FR-TT)

### FR-TT-001: Start/Stop Timer
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

### FR-TT-002: Manual Time Entry
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

### FR-TT-003: Activity-Based Auto-Tracking
**Priority:** P1 (Should Have)

**User Story:**
> As a sales rep, when I log a call that lasted 30 minutes, I want the time to be automatically tracked so I don't have to enter it twice.

**Acceptance Criteria:**
- ✅ AC1: When activity with duration is logged, create time entry automatically
- ✅ AC2: Time entry links to the activity
- ✅ AC3: User can edit/delete auto-created time entries
- ✅ AC4: Checkbox in activity form: "Track time for this activity" (default: checked)
- ✅ AC5: Duration from activity maps to time entry duration

### FR-TT-004: Billable Hours Tracking
**Priority:** P1 (Should Have)

**User Story:**
> As an admin, I want to mark time as billable or non-billable so I can invoice clients accurately.

**Acceptance Criteria:**
- ✅ AC1: Each time entry has "Billable" checkbox
- ✅ AC2: Default billable status configurable per user (Admin setting)
- ✅ AC3: Admin can bulk update billable status for multiple entries
- ✅ AC4: Time tracking report shows billable vs non-billable breakdown
- ✅ AC5: Export includes billable flag

### FR-TT-005: Time Approval Workflow
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

### FR-TT-006: Admin Time Tracking Dashboard
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

## 5.5 Reporting (FR-RP)

### FR-RP-001: Sales Pipeline Report
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
- ✅ AC1: Show deals by stage
- ✅ AC2: Total value per stage
- ✅ AC3: Filter by owner, date range
- ✅ AC4: Export to CSV
- ✅ AC5: Load in <2 seconds

### FR-RP-002: Activity Summary Report
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
- ✅ AC1: Activities logged per user (last 30 days)
- ✅ AC2: Breakdown by type (calls, emails, meetings)
- ✅ AC3: Filter by user, date range
- ✅ AC4: Export to CSV

### FR-RP-003: Time Tracking Report
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
