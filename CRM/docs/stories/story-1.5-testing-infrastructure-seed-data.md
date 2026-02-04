# Story 1.5: Testing infrastructure and seed data setup

**Epic:** Epic 1 - Foundation & Authentication
**Story ID:** 1.5
**Status:** Todo
**Assigned To:** Dev Agent
**Estimated Time:** 1 day

---

## Description

Set up testing frameworks and create seed data for development and testing environments.

---

## Acceptance Criteria

- [ ] Install Vitest and React Testing Library
- [ ] Install Playwright for E2E tests
- [ ] Create test database (separate Supabase project for testing)
- [ ] Configure test scripts in package.json (test, test:e2e, test:watch)
- [ ] Create seed data script with sample data:
  - 10 sample contacts (varied industries and statuses)
  - 5 sample deals (across all pipeline stages)
  - 20 sample activities (calls, emails, meetings, notes)
  - 3 sample users (1 admin, 2 regular users)
- [ ] Document testing strategy in README (unit, integration, E2E)
- [ ] Add test database connection to .env.test.local

---

## Dependencies

**Depends On:** Story 1.1
**Blocks:** All future testing work

---

## Technical Notes

- Create separate Supabase project for testing
- Use `@supabase/supabase-js` with service role key for seed data
- Seed script: `npm run db:seed`
- Test database strategy documented in architecture.md Section 16

---

## Implementation Hints

```typescript
// scripts/seed.ts - Seed data script
// vitest.config.ts - Vitest configuration
// playwright.config.ts - Playwright configuration
// .env.test.local - Test database credentials
```

---

## Testing Requirements

- [ ] `npm run test` executes unit tests
- [ ] `npm run test:e2e` executes E2E tests
- [ ] Seed script populates test database successfully
- [ ] Sample test passes

---

## Definition of Done

- All acceptance criteria met
- Testing frameworks configured
- Seed data script working
- README updated with testing instructions
- Code reviewed and merged
