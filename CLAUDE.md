# CLAUDE.md

## Ralph Workflow

This project uses the **Ralph autonomous AI methodology**.

### Rules (Non-Negotiable)

1. **ONE task per iteration** - Never multi-task
2. **Tests MUST pass** - No commits with failing tests
3. **Follow existing patterns** - Match the style of existing code
4. **Update the plan** - Mark tasks [x] with commit hash after each commit
5. **Sequential execution** - Never skip ahead

### The Loop

```
1. Read IMPLEMENTATION_PLAN.md
2. Find next unchecked [ ] task
3. Implement ONLY that task
4. Run tests and linters
5. If passing → commit
6. Mark task [x] with commit hash
7. IMMEDIATELY continue to next task
8. Only stop if blocked
```

### Quality Gates

Run before every commit:

```bash
# Backend (Python)
cd backend && mypy app && ruff check app && pytest

# Frontend (Node)
cd frontend && npm run typecheck && npm run lint && npm test
```

### Commit Format

```
<type>(<scope>): <description> (<TASK-ID>)

Types: feat, fix, test, refactor, docs, chore
```

### When Blocked

1. Document blocker in IMPLEMENTATION_PLAN.md under `## Blockers`
2. Stop and report
3. Do NOT skip to another task
4. Wait for user decision

---

## Project Overview

**Simple CRM** - A fast, lightweight CRM for small sales teams. Features contact management, deal pipeline tracking, activity logging, and task management with a clean, modern UI.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Recharts |
| Backend | Next.js Server Actions, Supabase |
| Database | PostgreSQL (via Supabase) with Row Level Security |
| Auth | Supabase Auth with role-based access (admin/user) |
| Testing | Vitest (unit), Playwright (e2e), Testing Library |

---

## Domain Knowledge

### CRM Entities
- **Contact**: A person in the CRM (lead or customer). Has first_name, last_name, email, phone, company, title, status, custom_fields
- **Deal**: A sales opportunity linked to a contact. Has title, amount, stage (lead → proposal → negotiation → closed-won/lost), probability, expected_close_date
- **Activity**: An interaction or task. Types: call, meeting, email, note, task. Linked to a contact and/or deal
- **User**: Application user with role (admin or user). Admins can see all data; users see only their own

### Deal Stages
1. `lead` - Initial qualification
2. `proposal` - Proposal sent
3. `negotiation` - In negotiation
4. `closed-won` - Deal won
5. `closed-lost` - Deal lost

### Activity Statuses
- `todo` - Not started
- `in_progress` - Currently working
- `completed` - Done
- `cancelled` - Cancelled

### Project Structure
```
CRM/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup, reset)
│   ├── activities/        # Activity actions
│   ├── contacts/          # Contact pages & actions
│   ├── dashboard/         # Dashboard page
│   ├── deals/             # Deal pages & actions
│   ├── profile/           # User profile
│   └── tasks/             # Task Kanban board
├── components/            # React components
├── lib/                   # Utilities & Supabase clients
├── supabase/migrations/   # Database migrations
└── __tests__/             # Unit tests
```

