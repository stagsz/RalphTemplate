# Epic 1: Foundation & Authentication

**Goal:** Basic app infrastructure and user authentication

**Estimated Time:** 1 week

## Stories

### Story 1.1: Project setup (Next.js 15 + Supabase + Vercel)
**Description:** Set up the foundational project structure with Next.js 15, integrate Supabase for backend services, and configure Vercel for deployment.

**Acceptance Criteria:**
- Next.js 15 project initialized with App Router
- Supabase project created and connected
- Vercel deployment configured
- Environment variables properly set (.env.local)
- Basic folder structure established
- Create vercel.json with basic configuration

**Dependencies:** None (first epic)

---

### Story 1.2: Authentication UI (Signup, Login, Logout)
**Description:** Implement user authentication flows using Supabase Auth with email/password.

**Acceptance Criteria:**
- Signup page with email validation
- Login page with error handling
- Logout functionality
- Password reset flow
- Redirects after auth state changes
- Protected routes middleware

**Dependencies:** Story 1.1

---

### Story 1.3: User profile page
**Description:** Create a user profile page where users can view and update their information.

**Acceptance Criteria:**
- Display user email and full name
- Edit profile form
- Update profile functionality
- Success/error notifications
- Avatar placeholder

**Dependencies:** Story 1.2

---

### Story 1.4: Role-based access control (Admin, User)
**Description:** Implement role-based access control to differentiate between Admin and User roles.

**Acceptance Criteria:**
- User role stored in database
- Admin-only routes protected
- Role-based UI element visibility
- Permission checks on server actions
- Default role assignment (User) on signup

**Dependencies:** Story 1.2, Story 1.3

---

### Story 1.5: Testing infrastructure and seed data setup
**Description:** Set up testing frameworks and create seed data for development and testing environments.

**Acceptance Criteria:**
- Install Vitest and React Testing Library
- Install Playwright for E2E tests
- Create test database (separate Supabase project for testing)
- Configure test scripts in package.json (test, test:e2e, test:watch)
- Create seed data script with sample data:
  - 10 sample contacts (varied industries and statuses)
  - 5 sample deals (across all pipeline stages)
  - 20 sample activities (calls, emails, meetings, notes)
  - 3 sample users (1 admin, 2 regular users)
- Document testing strategy in README (unit, integration, E2E)
- Add test database connection to .env.test.local

**Dependencies:** Story 1.1

---

## Technical Notes

- Use Supabase Auth for authentication
- Implement RLS policies for user table
- Use Next.js middleware for route protection
- Store user metadata in Supabase profiles table

## Definition of Done

- All stories completed and tested
- Authentication flows work end-to-end
- Role-based access enforced
- Deployed to Vercel staging environment
- Code reviewed and merged to main branch
