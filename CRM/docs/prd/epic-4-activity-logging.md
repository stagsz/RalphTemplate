# Epic 4: Activity Logging

**Goal:** Quick activity tracking and timeline

**Estimated Time:** 1 week

## Stories

### Story 4.1: Quick log modal (calls, emails, meetings, notes)
**Description:** Create a quick-access modal for logging activities with keyboard shortcuts.

**Acceptance Criteria:**
- Modal accessible from global navbar
- Activity types: Call, Email, Meeting, Note
- Form fields: type, subject, notes, duration_minutes, contact_id, deal_id, activity_date
- Default activity_date to today
- Optional contact/deal linking
- Keyboard shortcuts (C=call, E=email, M=meeting, N=note)
- Success notification after save
- Modal closes after save
- Form validation (required fields)

**Dependencies:** Epic 2 (Contact Management), Epic 3 (Deal Pipeline)

---

### Story 4.2: Activity timeline component
**Description:** Display activities in a chronological timeline view.

**Acceptance Criteria:**
- Timeline shows activities grouped by date
- Each activity shows: type icon, subject, notes, duration, timestamp
- Link to related contact/deal
- Filter by activity type (all, calls, emails, meetings, notes)
- Filter by date range
- Pagination (20 activities per page)
- Empty state for no activities
- Mobile responsive layout

**Dependencies:** Story 4.1

---

### Story 4.3: Keyboard shortcuts (C, E, M, N)
**Description:** Implement global keyboard shortcuts for quick activity logging.

**Acceptance Criteria:**
- C key opens quick log modal with Call pre-selected
- E key opens quick log modal with Email pre-selected
- M key opens quick log modal with Meeting pre-selected
- N key opens quick log modal with Note pre-selected
- Shortcuts disabled in text input fields
- Visual indicator of shortcuts in UI (tooltip)
- Keyboard shortcut help panel (? key)

**Dependencies:** Story 4.1

---

### Story 4.4: Edit/delete activities
**Description:** Allow users to edit or delete logged activities.

**Acceptance Criteria:**
- Edit button on each activity in timeline
- Edit modal pre-populated with existing data
- Delete button with confirmation modal
- Hard delete (permanent removal)
- Optimistic UI updates
- Success/error notifications
- Only owner can edit/delete (enforced by RLS)

**Dependencies:** Story 4.2

---

### Story 4.5: Activity filters (type, date)
**Description:** Add filtering capabilities to activity timeline.

**Acceptance Criteria:**
- Filter by activity type (dropdown)
- Filter by date range (date picker)
- Filter by contact (dropdown)
- Filter by deal (dropdown)
- Combine multiple filters
- Clear all filters button
- Filter state persists in URL params
- Show active filter count

**Dependencies:** Story 4.2

---

## Technical Notes

- Use `react-hook-form` for form management
- Keyboard shortcuts with `useHotkeys` hook
- Activity icons from Lucide React
- Store activities in `activities` table
- Index on `owner_id`, `activity_date`, `type` for filtering
- Auto-log time entries when duration is provided

## Definition of Done

- All stories completed and tested
- Quick log modal working with shortcuts
- Activity timeline displaying correctly
- Filtering functional
- Edit/delete operations working
- RLS policies enforced (users only see own activities)
- Unit tests written (>80% coverage)
- E2E tests for quick logging flow
- Performance tested with 5,000 activities
- Code reviewed and merged to main branch
