# Epic 7: User Management

**Goal:** Team collaboration and user administration

**Estimated Time:** 3 days

## Stories

### Story 7.1: User list (admin only)
**Description:** Create an admin-only page to view all users in the system.

**Acceptance Criteria:**
- Table displaying all users
- Columns: email, full_name, role, created_at, last_login
- Search by email or name
- Filter by role (Admin, User)
- Sort by any column
- Pagination (25 users per page)
- Admin-only access (enforced by RLS and middleware)
- Empty state for no users

**Dependencies:** Story 1.4 (RBAC)

---

### Story 7.2: Invite users
**Description:** Allow admins to invite new users to the system.

**Acceptance Criteria:**
- Invite form with email field
- Email validation
- Send invitation email with signup link
- Invitation expires in 7 days
- Track invitation status (pending, accepted, expired)
- Resend invitation option
- Bulk invite (multiple emails)
- Success/error notifications

**Dependencies:** Story 7.1, Epic 1 (Authentication)

---

### Story 7.3: Assign roles
**Description:** Allow admins to change user roles.

**Acceptance Criteria:**
- Role dropdown on user list (Admin, User)
- Confirm role change modal
- Update role in database
- Immediate permission effect
- Prevent self-demotion (admin cannot remove own admin role)
- Audit log of role changes (future)
- Success notification

**Dependencies:** Story 7.1, Story 1.4 (RBAC)

---

### Story 7.4: User activity log
**Description:** Track and display user activity for admin oversight.

**Acceptance Criteria:**
- Activity log table showing: user, action, timestamp, IP address
- Actions tracked: login, logout, create/edit/delete records
- Filter by user, action type, date range
- Pagination (50 per page)
- Search by user email
- Export to CSV
- Auto-cleanup after 90 days (configurable)

**Dependencies:** Story 7.1

---

## Technical Notes

- Use Supabase Auth for invitations
- Track activity with database triggers or middleware
- Store activity log in separate table
- RLS policies restrict user management to admins
- Use email templates for invitations
- Rate limit invitation sends (max 10 per hour)

## Definition of Done

- All stories completed and tested
- User list displaying correctly (admin only)
- Invitation system working with email delivery
- Role assignment functional
- Activity log tracking key actions
- RLS policies enforced (admin-only access)
- Unit tests written (>80% coverage)
- E2E tests for user invitation and role assignment
- Code reviewed and merged to main branch
