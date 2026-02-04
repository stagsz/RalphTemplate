# Epic 2: Contact Management

**Goal:** Full contact lifecycle management

**Estimated Time:** 2 weeks

## Stories

### Story 2.1: Create contact form with validation
**Description:** Build a form to create new contacts with proper validation.

**Acceptance Criteria:**
- Form with fields: first_name, last_name, email, phone, company, title, status
- Client-side validation (Zod schema)
- Server-side validation
- Email format validation
- Phone number validation
- Required field indicators
- Success/error notifications
- Redirect to contact detail after creation

**Dependencies:** Epic 1 (Authentication)

---

### Story 2.2: Contact list view (table, search, filters)
**Description:** Display all contacts in a searchable, filterable table view.

**Acceptance Criteria:**
- Table with columns: Name, Email, Company, Status, Actions
- Full-text search across name, email, company
- Filter by status (Lead, Customer)
- Pagination (25 per page)
- Sort by name, created date
- Loading states
- Empty state for no contacts
- Mobile responsive table

**Dependencies:** Story 2.1

---

### Story 2.3: Contact detail page
**Description:** Show detailed information about a single contact.

**Acceptance Criteria:**
- Display all contact fields
- Related deals section
- Activity timeline for contact
- Time entries for contact
- Edit button (navigates to edit form)
- Delete button with confirmation
- Breadcrumb navigation

**Dependencies:** Story 2.1

---

### Story 2.4: Edit/delete contact
**Description:** Allow users to edit or soft-delete contacts.

**Acceptance Criteria:**
- Edit form pre-populated with existing data
- Validation on update
- Soft delete (sets deleted_at timestamp)
- Confirmation modal for delete
- Optimistic UI updates
- Cascade rules for related entities
- Restore deleted contacts (admin only)

**Dependencies:** Story 2.3

---

### Story 2.5: CSV import wizard
**Description:** Import multiple contacts from a CSV file.

**Acceptance Criteria:**
- CSV file upload (max 10MB)
- Column mapping interface
- Preview of first 5 rows
- Validation of all rows
- Error reporting for invalid rows
- Bulk insert with progress indicator
- Success summary (X contacts imported, Y skipped)
- Download error report CSV

**Dependencies:** Story 2.2

---

### Story 2.6: CSV export
**Description:** Export contacts to CSV format.

**Acceptance Criteria:**
- Export all contacts or filtered subset
- CSV format with all fields
- Filename: contacts-YYYY-MM-DD.csv
- Download triggers immediately
- Exclude deleted contacts
- Include custom fields in export

**Dependencies:** Story 2.2

---

### Story 2.7: Custom fields (5 per contact)
**Description:** Allow users to add up to 5 custom fields per contact.

**Acceptance Criteria:**
- Custom fields stored as JSONB
- UI to add/edit/remove custom fields
- Field types: text, number, date, select
- Field labels and values
- Display in contact detail page
- Include in CSV import/export
- Validation for custom field values

**Dependencies:** Story 2.3, Story 2.4

---

## Technical Notes

- Use Supabase Storage for CSV file uploads
- Implement full-text search with PostgreSQL `to_tsvector`
- Use Tanstack Table for table component
- Custom fields stored in `custom_fields` JSONB column
- Soft delete with `deleted_at` timestamp

## Definition of Done

- All stories completed and tested
- Contact CRUD operations working
- CSV import/export functional
- Custom fields working
- RLS policies enforced
- Unit tests written (>80% coverage)
- E2E tests for critical flows
- Performance tested with 10,000 contacts
- Code reviewed and merged to main branch
