# Epic 3: Deal Pipeline

**Goal:** Visual deal management and tracking

**Estimated Time:** 2 weeks

## Stories

### Story 3.1: Pipeline Kanban board (drag-and-drop)
**Description:** Create a visual Kanban board for managing deals across pipeline stages.

**Acceptance Criteria:**
- Columns for each stage: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
- Drag-and-drop between stages
- Deal cards show: name, amount, contact, probability, expected close date
- Update stage on drop (optimistic UI)
- Stage totals at column header
- Mobile: horizontal scroll
- Loading states
- Empty state for each column

**Dependencies:** Epic 1 (Authentication)

---

### Story 3.2: Create deal form
**Description:** Build a form to create new deals with validation.

**Acceptance Criteria:**
- Form fields: name, amount, stage, probability, expected_close_date, contact_id
- Dropdown to select linked contact
- Stage dropdown with all pipeline stages
- Probability slider (0-100%)
- Date picker for expected close date
- Validation (required fields, amount > 0)
- Success/error notifications
- Redirect to deal detail after creation

**Dependencies:** Epic 2 (Contact Management - to link contacts)

---

### Story 3.3: Deal detail page
**Description:** Show detailed information about a single deal.

**Acceptance Criteria:**
- Display all deal fields
- Linked contact information with link
- Activity timeline for deal
- Time entries for deal
- Edit button (navigates to edit form)
- Delete button with confirmation
- Breadcrumb navigation
- Visual indicator for deal status (open/won/lost)

**Dependencies:** Story 3.2

---

### Story 3.4: Edit/delete deal
**Description:** Allow users to edit or soft-delete deals.

**Acceptance Criteria:**
- Edit form pre-populated with existing data
- Validation on update
- Soft delete (sets deleted_at timestamp)
- Confirmation modal for delete
- Optimistic UI updates
- Mark deal as won/lost (status field)
- Restore deleted deals (admin only)

**Dependencies:** Story 3.3

---

### Story 3.5: Deal stage configuration (admin)
**Description:** Allow admins to configure custom pipeline stages.

**Acceptance Criteria:**
- Admin-only settings page
- Add/edit/delete stages
- Reorder stages (drag-and-drop)
- Stage name and color
- Default stages on first setup
- Validation (min 3 stages, max 10)
- Prevent deletion of stages with active deals

**Dependencies:** Story 3.1, Story 1.4 (RBAC)

---

### Story 3.6: Link deals to contacts/companies
**Description:** Associate deals with contacts and companies.

**Acceptance Criteria:**
- Contact dropdown in deal form
- Auto-populate company from selected contact
- Display linked contact in deal detail
- Show all deals on contact detail page
- Filter deals by contact
- Unlink contact option (set to null)

**Dependencies:** Story 3.2, Epic 2 (Contact Management)

---

## Technical Notes

- Use `@dnd-kit/core` for drag-and-drop functionality
- Store stages in database table for configurability
- Optimistic updates with Zustand state management
- Calculate weighted pipeline value (amount × probability)
- Index on stage and owner_id for fast queries

## Definition of Done

- All stories completed and tested
- Kanban board drag-and-drop working smoothly
- Deal CRUD operations functional
- Stage configuration working for admins
- Contact linking implemented
- RLS policies enforced
- Unit tests written (>80% coverage)
- E2E tests for critical flows
- Performance tested with 1,000 deals across stages
- Code reviewed and merged to main branch
