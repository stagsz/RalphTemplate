# Story 1.4: Role-based access control (Admin, User)

**Epic:** Epic 1 - Foundation & Authentication
**Story ID:** 1.4
**Status:** Todo
**Assigned To:** Dev Agent
**Estimated Time:** 1 day

---

## Description

Implement role-based access control to differentiate between Admin and User roles.

---

## Acceptance Criteria

- [ ] User role stored in database
- [ ] Admin-only routes protected
- [ ] Role-based UI element visibility
- [ ] Permission checks on server actions
- [ ] Default role assignment (User) on signup

---

## Dependencies

**Depends On:** Story 1.2, Story 1.3
**Blocks:** Epic 7 (User Management)

---

## Technical Notes

- Add `role` column to users/profiles table
- Update RLS policies to check role
- Create helper function `requireAdmin()`
- Use conditional rendering for admin UI elements

---

## Testing Requirements

- [ ] New users default to 'user' role
- [ ] Admin routes return 403 for non-admins
- [ ] Admin UI elements hidden from regular users
- [ ] Server actions enforce role checks

---

## Definition of Done

- All acceptance criteria met
- RLS policies updated
- Unit tests for permission checks
- Code reviewed and merged
