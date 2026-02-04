# CRM V1.0 MVP - All Stories Summary

**Total Stories:** 46
**Total Epics:** 8
**Estimated Timeline:** 10.4 weeks (~2.5 months)

---

## Epic 1: Foundation & Authentication (1 week, 5 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 1.1 | Project setup (Next.js 15 + Supabase + Vercel) | 1 day | Todo |
| 1.2 | Authentication UI (Signup, Login, Logout) | 2 days | Todo |
| 1.3 | User profile page | 1 day | Todo |
| 1.4 | Role-based access control (Admin, User) | 1 day | Todo |
| 1.5 | Testing infrastructure and seed data setup | 1 day | Todo |

**Key Deliverables:** Next.js 15 project, Supabase integration, Vercel deployment, Auth flows, RBAC, Testing setup

---

## Epic 2: Contact Management (2 weeks, 7 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 2.1 | Create contact form with validation | 1 day | Todo |
| 2.2 | Contact list view (table, search, filters) | 2 days | Todo |
| 2.3 | Contact detail page | 1 day | Todo |
| 2.4 | Edit/delete contact | 1 day | Todo |
| 2.5 | CSV import wizard | 2 days | Todo |
| 2.6 | CSV export | 0.5 days | Todo |
| 2.7 | Custom fields (5 per contact) | 1 day | Todo |

**Key Deliverables:** Full contact CRUD, Search/filter, CSV import/export, Custom fields

---

## Epic 3: Deal Pipeline (2 weeks, 6 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 3.1 | Pipeline Kanban board (drag-and-drop) | 3 days | Todo |
| 3.2 | Create deal form | 1 day | Todo |
| 3.3 | Deal detail page | 1 day | Todo |
| 3.4 | Edit/delete deal | 1 day | Todo |
| 3.5 | Deal stage configuration (admin) | 1 day | Todo |
| 3.6 | Link deals to contacts/companies | 0.5 days | Todo |

**Key Deliverables:** Kanban board with drag-and-drop, Deal CRUD, Stage configuration, Contact linking

---

## Epic 4: Activity Logging (1 week, 5 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 4.1 | Quick log modal (calls, emails, meetings, notes) | 2 days | Todo |
| 4.2 | Activity timeline component | 1 day | Todo |
| 4.3 | Keyboard shortcuts (C, E, M, N) | 0.5 days | Todo |
| 4.4 | Edit/delete activities | 0.5 days | Todo |
| 4.5 | Activity filters (type, date) | 1 day | Todo |

**Key Deliverables:** Quick activity logging, Timeline view, Keyboard shortcuts, Filtering

---

## Epic 5: Time Tracking (1.5 weeks, 7 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 5.1 | Start/stop timer component (persists across navigation) | 2 days | Todo |
| 5.2 | Manual time entry form | 1 day | Todo |
| 5.3 | Activity-based auto-tracking (link time to activities) | 1 day | Todo |
| 5.4 | Billable hours configuration (default per user) | 0.5 days | Todo |
| 5.5 | Time approval workflow (submit, approve, reject) | 2 days | Todo |
| 5.6 | Admin time tracking dashboard | 2 days | Todo |
| 5.7 | Time tracking report with CSV export | 1 day | Todo |

**Key Deliverables:** Timer widget, Manual entry, Auto-tracking from activities, Approval workflow, Admin dashboard

---

## Epic 6: Reporting (1 week, 5 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 6.1 | Sales pipeline report | 2 days | Todo |
| 6.2 | Activity summary report | 1 day | Todo |
| 6.3 | Win/loss report | 1 day | Todo |
| 6.4 | Time tracking report (see Epic 5.7) | N/A | Reference |
| 6.5 | CSV export for all reports | 0.5 days | Todo |

**Key Deliverables:** 3 core reports (pipeline, activity, win/loss), CSV export for all

---

## Epic 7: User Management (3 days, 4 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 7.1 | User list (admin only) | 1 day | Todo |
| 7.2 | Invite users | 1 day | Todo |
| 7.3 | Assign roles | 0.5 days | Todo |
| 7.4 | User activity log | 1 day | Todo |

**Key Deliverables:** User management UI, Invitations, Role assignment, Activity logging

---

## Epic 8: Polish & Launch Prep (1 week, 7 stories)

| Story | Title | Est | Status |
|-------|-------|-----|--------|
| 8.1 | Mobile responsive optimization | 2 days | Todo |
| 8.2 | Loading states and error handling | 1 day | Todo |
| 8.3 | Onboarding tutorial | 1 day | Todo |
| 8.4 | Performance optimization | 2 days | Todo |
| 8.5 | Security audit | 1 day | Todo |
| 8.6 | Beta testing with 10 users | 5 days | Todo |
| 8.7 | User documentation and help center | 2 days | Todo |

**Key Deliverables:** Mobile responsive, Error handling, Onboarding, Performance (Lighthouse >90), Security audit, Beta testing, User docs

---

## Story Dependencies Graph

```
Epic 1 (Foundation)
  └─> Epic 2 (Contacts)
       ├─> Epic 3 (Deals)
       │    └─> Epic 4 (Activities)
       │         └─> Epic 5 (Time Tracking)
       │              └─> Epic 6 (Reporting)
       └─> Epic 7 (User Management)

Epic 8 (Polish) depends on ALL previous epics
```

---

## Individual Story Files Created

Detailed story files available for:
- Epic 1: All 5 stories (story-1.1 through story-1.5)
- Epic 2: Stories 2.1-2.4 (4 of 7)
- Remaining stories: See epic files in `docs/prd/epic-*.md` for full details

---

## How to Use This Document

1. **For Planning:** Reference this summary for sprint planning and capacity allocation
2. **For Development:** See individual story files in `docs/stories/story-*.md` for detailed acceptance criteria
3. **For Progress Tracking:** Update Status column as stories progress (Todo → In Progress → Review → Done)
4. **For Estimation:** Use the Est column for sprint velocity calculations

---

## Notes

- All stories include detailed acceptance criteria in their epic files
- Testing requirements defined in Story 1.5
- Security requirements in Story 8.5
- User documentation in Story 8.7
- Total estimated time: **10.4 weeks** (aligns with PRD goal of 2-3 months)
