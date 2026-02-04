# CLAUDE.MD - CRM Project Context

## Project Overview

**Name:** CRM - Simple & Fast
**Version:** 1.0 MVP
**Description:** A simple, fast CRM that helps small sales teams manage contacts and close deals without the complexity and cost of enterprise solutions.

**Target Users:** Small B2B sales teams (5-50 people)
**Key Differentiators:** Lightning-fast setup, dead simple UI, affordable pricing, modern tech stack

## Tech Stack

### Frontend
- **Framework:** Next.js 15.5.6 with App Router
- **UI Library:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Styling:** Tailwind CSS 4.1.15
- **State Management:** React Context + Server State
- **Dark Mode:** Custom theme provider with system preference detection

### Backend
- **API:** Next.js API Routes + Server Actions
- **Database:** Supabase (PostgreSQL 14+)
- **Authentication:** Supabase Auth with Row Level Security
- **Storage:** Supabase Storage (CSV imports)

### Testing
- **Unit Tests:** Vitest 3.2.4 + React Testing Library
- **E2E Tests:** Playwright 1.56.1
- **Coverage Goal:** 80% for critical paths

### Deployment
- **Platform:** Vercel
- **CI/CD:** GitHub Actions
- **Environment:** Production, Staging, Development

## Project Structure

```
CRM/
├── app/                          # Next.js App Router (pages & API routes)
│   ├── (auth)/                   # Authentication pages (login, signup, reset-password)
│   ├── dashboard/                # Main dashboard page
│   ├── profile/                  # User profile management
│   ├── contacts/                 # Contact management pages
│   ├── deals/                    # Deal pipeline pages
│   ├── activities/               # Activity logging
│   ├── tasks/                    # Task management (future)
│   ├── layout.tsx                # Root layout with theme provider
│   ├── page.tsx                  # Landing/home page
│   └── actions.ts                # Shared server actions
│
├── components/                   # React components
│   ├── layout/                   # Layout components (Navigation, ThemeToggle)
│   ├── providers/                # Context providers (ThemeProvider)
│   ├── contacts/                 # Contact-specific components
│   ├── deals/                    # Deal-specific components
│   ├── activities/               # Activity-specific components
│   └── dashboard/                # Dashboard widgets and charts
│
├── lib/                          # Shared utilities and configurations
│   ├── supabase/                 # Supabase client configuration
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── auth/                     # Authentication utilities
│   │   └── permissions.ts        # RBAC and permission checks
│   └── utils.ts                  # General utilities
│
├── supabase/                     # Database schema and migrations
│   └── migrations/               # SQL migration files
│       ├── 20251022_create_users_table.sql
│       ├── 20251022_create_contacts_table.sql
│       ├── 20251022_create_deals_table.sql
│       ├── 20251022_create_activities_table.sql
│       ├── 20251022_create_admin_user.sql
│       └── 20251022_fix_users_rls.sql
│
├── __tests__/                    # Unit tests (Vitest)
├── e2e/                          # End-to-end tests (Playwright)
├── scripts/                      # Utility scripts
│   └── seed.ts                   # Database seeding script
├── docs/                         # Project documentation
│   ├── prd.md                    # Product requirements
│   ├── architecture.md           # Technical architecture
│   ├── prd/                      # Epic files
│   └── stories/                  # User stories
├── .claude/                      # Claude Code configuration
├── PRD.md                        # Main product requirements document
├── README.md                     # Project documentation
└── contacts.csv                  # Sample contact data
```

## Core Features (V1.0 MVP)

### 1. Authentication & User Management
- Email/password authentication via Supabase Auth
- Role-based access control (Admin, User)
- User profiles with timezone support
- Protected routes with middleware

### 2. Contact Management
- CRUD operations for contacts
- Global search (name, email, company)
- CSV import/export (up to 1,000 contacts)
- Custom fields (5 per contact via JSONB)
- Soft deletes (deleted_at column)

### 3. Deal Pipeline
- Visual Kanban board with drag-and-drop
- Deal stages: Lead → Qualified → Proposal → Negotiation → Closed Won/Lost
- Deal tracking (name, value, close date, probability)
- Link deals to contacts/companies
- Stage history audit trail

### 4. Activity Logging
- Quick log modal for calls, emails, meetings, notes
- Activity timeline view
- Keyboard shortcuts (C, E, M, N)
- Duration tracking
- Link activities to contacts and deals

### 5. Time Tracking
- Start/stop timer component
- Manual time entry
- Activity-based auto-tracking
- Billable hours configuration
- Approval workflow (draft, submitted, approved, rejected)
- Admin dashboard with reporting

### 6. Reporting
- Sales pipeline report (deals by stage, total value)
- Activity summary report (by user and type)
- Win/loss report (win rate, lost reasons)
- Time tracking report (billable vs non-billable)
- CSV export for all reports

## Database Schema

### Core Tables

**users**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `role` ('admin' | 'user')
- `created_at`, `updated_at`

**contacts**
- `id` (UUID, PK)
- `first_name`, `last_name` (TEXT, REQUIRED)
- `email`, `phone`, `company`, `title` (TEXT, OPTIONAL)
- `status` ('lead' | 'customer')
- `owner_id` (UUID, FK → users)
- `custom_fields` (JSONB)
- `created_at`, `updated_at`, `deleted_at`
- Indexes: email, owner, full-text search

**deals**
- `id` (UUID, PK)
- `name` (TEXT, REQUIRED)
- `amount` (DECIMAL)
- `stage` (TEXT, REQUIRED)
- `probability` (INTEGER, default 25)
- `expected_close_date` (DATE)
- `contact_id` (UUID, FK → contacts)
- `owner_id` (UUID, FK → users)
- `status` ('open' | 'won' | 'lost')
- `created_at`, `updated_at`, `deleted_at`
- Indexes: stage, owner

**activities**
- `id` (UUID, PK)
- `type` ('call' | 'email' | 'meeting' | 'note')
- `subject`, `notes` (TEXT)
- `duration_minutes` (INTEGER)
- `contact_id`, `deal_id` (UUID, FK, ON DELETE CASCADE)
- `owner_id` (UUID, FK → users)
- `activity_date` (TIMESTAMPTZ)
- `created_at`
- Indexes: contact + date, deal + date

**time_entries**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users, REQUIRED)
- `contact_id`, `deal_id` (UUID, FK, OPTIONAL)
- `activity_id` (UUID, FK → activities, ON DELETE SET NULL)
- `duration_minutes` (INTEGER, REQUIRED)
- `entry_date` (DATE)
- `notes` (TEXT)
- `is_billable` (BOOLEAN, default true)
- `status` ('draft' | 'submitted' | 'approved' | 'rejected')
- `approval_notes` (TEXT)
- `approved_by`, `approved_at`
- `created_at`, `updated_at`
- Indexes: user + date, contact, deal, status, billable

### Relationships
- Users own contacts, deals, activities, time entries
- Contacts can have multiple deals and activities
- Deals can have multiple activities
- Activities can auto-create time entries
- Time entries can be approved by admin users

## Development Conventions

### Code Style
- **TypeScript:** Strict mode enabled, use explicit types
- **React:** Server Components by default, Client Components only when needed
- **Async/Await:** Prefer over `.then()` chains
- **Error Handling:** Use try/catch, provide user-friendly error messages
- **Naming:**
  - Components: PascalCase (e.g., `ContactForm.tsx`)
  - Files: kebab-case for non-components (e.g., `auth-utils.ts`)
  - Functions: camelCase (e.g., `getUserProfile()`)
  - Database: snake_case (e.g., `created_at`)

### Server Actions
- Located in `actions.ts` files next to pages
- Use `'use server'` directive
- Always validate user permissions
- Return structured responses: `{ success: boolean, data?: T, error?: string }`
- Example pattern:
  ```typescript
  export async function createContact(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Validate and process...
    const { data, error } = await supabase.from('contacts').insert(...)
    if (error) return { success: false, error: error.message }

    return { success: true, data }
  }
  ```

### Supabase Client
- **Browser:** Use `lib/supabase/client.ts` for client components
- **Server:** Use `lib/supabase/server.ts` for server components/actions
- **Row Level Security (RLS):** All tables have RLS policies enabled
- **Authentication:** Always check `supabase.auth.getUser()` in server actions

### Styling (Tailwind CSS)
- Dark mode support via `dark:` prefix
- Responsive design: mobile-first approach
- Use Tailwind utilities, avoid custom CSS when possible
- Common classes:
  - Containers: `container mx-auto px-4`
  - Cards: `rounded-lg border bg-card p-6 shadow-sm`
  - Buttons: `rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90`
  - Inputs: `rounded-md border bg-background px-3 py-2`

### Performance Guidelines
- **Page Load:** Target P95 < 2 seconds
- **API Latency:** Target P95 < 500ms
- **Database Queries:** No query should exceed 100ms
- Use Vercel Analytics to monitor performance
- Implement loading states and optimistic updates

## Testing Strategy

### Unit Tests (Vitest)
- Location: `__tests__/` directory
- Run: `npm run test` or `npm run test:watch`
- Coverage: Components, utilities, server actions
- Use React Testing Library for component tests
- Mock Supabase client for isolated tests

### E2E Tests (Playwright)
- Location: `e2e/` directory
- Run: `npm run test:e2e` or `npm run test:e2e:ui`
- Coverage: Critical user flows (auth, contact CRUD, deal pipeline)
- Test on multiple browsers (Chromium, Firefox, WebKit)

### Test Data
- Seed script: `npm run db:seed`
- Creates 3 sample users (1 admin, 2 regular users)
- Loads contacts from `contacts.csv`
- Always reset test database before E2E tests

## Common Development Tasks

### Setup New Development Environment
```bash
# 1. Clone and install
git clone https://github.com/stagsz/CRM.git
cd CRM
npm install

# 2. Set up Supabase
# - Create project at supabase.com
# - Copy .env.local.example to .env.local
# - Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# - Add SUPABASE_SERVICE_ROLE_KEY for seed script

# 3. Run migrations (via Supabase dashboard or CLI)

# 4. Seed database
npm run db:seed

# 5. Start development server
npm run dev
```

### Adding a New Feature
1. **Check PRD:** Review `PRD.md` for feature requirements
2. **Database Changes:** Create new migration in `supabase/migrations/`
3. **Server Actions:** Add to appropriate `actions.ts` file
4. **Components:** Create reusable components in `components/`
5. **Pages:** Add to `app/` with proper layouts
6. **Tests:** Write unit tests and E2E tests
7. **Update CLAUDE.MD:** Document any new patterns or conventions

### Database Migrations
- **Naming:** `YYYYMMDD_description.sql` (e.g., `20251022_create_contacts_table.sql`)
- **RLS Policies:** Always enable RLS and create appropriate policies
- **Indexes:** Add indexes for foreign keys and frequently queried columns
- **Soft Deletes:** Use `deleted_at TIMESTAMPTZ` for soft deletes

### Environment Variables
Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For seed script only
```

## Security Best Practices

1. **Authentication:** Always verify user session in server actions
2. **Authorization:** Check user role before admin operations
3. **RLS Policies:** Database enforces access control at the row level
4. **Input Validation:** Validate all form inputs on server side
5. **SQL Injection:** Use Supabase parameterized queries (automatic)
6. **XSS Prevention:** React escapes by default, be careful with `dangerouslySetInnerHTML`
7. **CSRF Protection:** Next.js server actions have built-in protection
8. **Environment Variables:** Never commit `.env.local`, use Vercel for production secrets

## BMAD Development Workflow

This project uses **BMAD (Business Method and Development)** for structured agile development:

- **Analyst (Mary):** Market research, brainstorming
- **PM (Peter):** Product requirements, epics, stories
- **Architect (Alex):** System architecture, tech stack
- **Dev (David):** Implementation
- **QA (Quinn):** Testing strategy, test design
- **PO (Paula/Sarah):** Product owner, document alignment
- **SM (Sam):** Scrum master, sprint management

Current sprint progress tracked in `README.md` and individual epic files in `docs/prd/`.

## Current Status

**Epic 1: Foundation & Authentication** ✅ COMPLETE
- Project setup (Next.js 15 + Supabase + Vercel)
- Authentication UI (Signup, Login, Logout)
- User profile page with dark mode support
- Role-based access control (Admin, User)
- Testing infrastructure and seed data setup

**Epic 2: Contact Management** 🚧 IN PROGRESS
- Contacts table and CSV import implemented
- Working on contact CRUD operations

**Next Epics:**
- Epic 3: Deal Pipeline
- Epic 4: Activity Logging
- Epic 5: Time Tracking
- Epic 6: Reporting
- Epic 7: User Management
- Epic 8: Polish & Launch Prep

## What's NOT in V1.0

Explicitly out of scope for MVP (deferred to V2.0+):
- ❌ Email integration (Gmail, Outlook)
- ❌ Calendar integration
- ❌ Lead scoring
- ❌ Automation/workflows
- ❌ Slack/Stripe/Zapier integrations
- ❌ Native mobile apps
- ❌ Advanced permissions

## Important Notes & Gotchas

1. **Supabase Auth:** User management is handled by Supabase Auth, but we maintain a separate `users` table for profile data and roles
2. **Soft Deletes:** Always check `deleted_at IS NULL` in queries to filter deleted records
3. **Timezone Handling:** Store all timestamps in UTC, convert to user timezone in UI
4. **CSV Import Limits:** Maximum 1,000 contacts per import to prevent performance issues
5. **RLS Testing:** Use Supabase service role key in seed script to bypass RLS
6. **Dark Mode:** Theme preference stored in localStorage, syncs with system preference
7. **Middleware:** Auth middleware protects all routes except `/login`, `/signup`, and landing page
8. **Type Safety:** Database types can be generated from Supabase schema using Supabase CLI
9. **Caching:** Next.js App Router caches by default, use `revalidatePath()` after mutations
10. **Server Components:** Default to Server Components for better performance, use Client Components (`'use client'`) only when needed for interactivity

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm start                # Start production server

# Testing
npm run test             # Run unit tests once
npm run test:watch       # Run unit tests in watch mode
npm run test:e2e         # Run E2E tests headless
npm run test:e2e:ui      # Run E2E tests with Playwright UI

# Database
npm run db:seed          # Seed database with sample data

# Deployment (automatic via Vercel)
git push origin main     # Triggers production deployment
git push origin develop  # Triggers preview deployment
```

## References

- **PRD:** See `PRD.md` for complete product requirements
- **Architecture:** See `docs/architecture.md` for technical architecture (16 sections)
- **Epics:** See `docs/prd/` for detailed epic breakdowns
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind Docs:** https://tailwindcss.com/docs

## Getting Help

- **Issues:** Report bugs or feature requests on GitHub
- **Documentation:** Check `docs/` folder for detailed guides
- **Supabase Dashboard:** Monitor database, auth, and storage
- **Vercel Dashboard:** Monitor deployments and performance

---

**Last Updated:** 2026-01-09
**Status:** 🚧 V1.0 MVP - Epic 2 In Progress
