# Story 1.2: Authentication UI (Signup, Login, Logout)

**Epic:** Epic 1 - Foundation & Authentication
**Story ID:** 1.2
**Status:** Todo
**Assigned To:** Dev Agent
**Estimated Time:** 2 days

---

## Description

Implement user authentication flows using Supabase Auth with email/password.

---

## Acceptance Criteria

- [ ] Signup page with email validation
- [ ] Login page with error handling
- [ ] Logout functionality
- [ ] Password reset flow
- [ ] Redirects after auth state changes
- [ ] Protected routes middleware

---

## Dependencies

**Depends On:** Story 1.1
**Blocks:** Story 1.3, Story 1.4

---

## Technical Notes

- Use Supabase Auth for email/password authentication
- Implement Next.js middleware for route protection
- Store auth session in cookies (httpOnly)
- Use Server Components for protected routes
- Redirect unauthenticated users to /login

---

## Implementation Hints

```typescript
// app/(auth)/login/page.tsx
// app/(auth)/signup/page.tsx
// middleware.ts - Protected route middleware
// lib/supabase/server.ts - Server-side auth helpers
```

---

## Testing Requirements

- [ ] User can sign up with valid email/password
- [ ] User can log in with correct credentials
- [ ] Invalid credentials show error message
- [ ] User can log out successfully
- [ ] Password reset email sends correctly
- [ ] Protected routes redirect to login when not authenticated

---

## Definition of Done

- All acceptance criteria met
- Authentication flows tested end-to-end
- RLS policies created for users table
- Code reviewed and merged
