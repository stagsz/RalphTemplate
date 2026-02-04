# Project Brief: CRM Application

**Version:** 1.0
**Date:** October 21, 2025
**Status:** Final
**Project Owner:** Product Team

---

## Executive Summary

### Product Concept
A **simple, fast CRM** designed for small sales teams (5-50 people) that helps them manage contacts, close deals, and track time without the complexity and cost of enterprise solutions like Salesforce.

### Primary Problem
Small B2B sales teams are stuck between two bad options:
1. **Spreadsheets** - Manual, error-prone, no visibility
2. **Enterprise CRMs** (Salesforce, HubSpot) - Overly complex, expensive ($150+/user/month), 2-week setup time

### Target Market
- **Primary:** Small B2B sales teams (5-50 people)
- **Secondary:** Consultants and agencies tracking billable client time
- **Geography:** US/English-speaking markets initially

### Key Value Proposition
**"The CRM you can set up in 5 minutes and actually want to use"**

- ⚡ **5-minute setup** vs 2 weeks (Salesforce)
- 🎯 **Zero training required** - intuitive from day 1
- 💰 **$29/user/month** vs $150+ (Salesforce)
- 🚀 **Modern tech** - Fast, mobile-friendly, built with Next.js 15

---

## Problem Statement

### Current State & Pain Points

**Small sales teams today face critical challenges:**

1. **Scattered Information** - Customer data lives in email, spreadsheets, Slack, and team members' heads
2. **No Pipeline Visibility** - Sales managers can't see what deals are closing or where reps are spending time
3. **Manual Data Entry** - Logging activities takes 5+ minutes per call, killing momentum
4. **Time Tracking Chaos** - Billable hours tracked in spreadsheets, making invoicing painful and error-prone
5. **Expensive or Complex Tools** - Salesforce costs $150+/user/month and takes 2 weeks to set up; free CRMs lack essential features

### Impact (Quantified)
- **20% of sales time** wasted searching for customer information
- **$1,800+/year** per user on Salesforce (vs our $348/year)
- **2-week setup** before Salesforce is usable (vs our 5 minutes)
- **30%+ deals** slip through cracks due to lack of visibility

### Why Existing Solutions Fall Short

| Solution | Problem |
|----------|---------|
| **Spreadsheets** | Manual, no automation, breaks with scale |
| **Salesforce** | $150+/user/month, 2-week setup, requires training |
| **HubSpot Free** | Missing key features (time tracking, custom fields) |
| **Pipedrive** | Expensive for small teams, complex interface |

### Urgency
Remote/hybrid work has made scattered customer data **10x worse**. Teams need a single source of truth that's accessible anywhere, fast, and affordable.

---

## Proposed Solution

### Core Concept
A **minimal CRM** focused exclusively on core workflows that small teams actually need:
1. Contact Management
2. Deal Pipeline
3. Activity Logging
4. Time Tracking (billable hours)
5. Basic Reporting

**No integrations. No automation. No AI.** Just the essentials, done exceptionally well.

### Key Differentiators

#### 1. Lightning Fast Setup (5 minutes)
- Sign up with email
- Import contacts from CSV
- Start logging deals immediately
- **No configuration required**

#### 2. Dead Simple Interface
- Visual Kanban pipeline (drag-and-drop deals)
- Quick log modal (log a call in <15 seconds with keyboard shortcuts)
- Global search finds any contact instantly
- **Zero training needed**

#### 3. Time Tracking Built-In
- Start/stop timer on leads and deals
- Auto-track time from activities (calls, meetings)
- Billable hours tracking with approval workflow
- Export timesheets for payroll/invoicing
- **Unique for this market segment**

#### 4. Modern Tech Stack
- Built on Next.js 15 (React 19) - **blazing fast**
- Real-time updates (Supabase)
- Mobile-responsive by default
- **Not legacy enterprise tech**

### Why This Will Succeed
1. **Focus:** We're building for 5-50 person teams, not enterprises
2. **Speed:** V1.0 in 3 months, not 12 months
3. **Pricing:** Free tier (3 users) + $29/user/month (5x cheaper than Salesforce)
4. **Modern UX:** Designed for 2025, not 2005

### High-Level Product Vision
Year 1: **Core CRM** (contacts, deals, activities, time tracking)
Year 2: **Integrations** (Gmail, Calendar, Slack)
Year 3: **Intelligence** (AI lead scoring, automation)

---

## Target Users

### Primary User Segment: Sales Rep (Sarah)

**Demographics:**
- **Role:** Account Executive, BDR, Sales Rep
- **Company Size:** 10-50 employees
- **Industry:** B2B SaaS, professional services, agencies
- **Age:** 25-40
- **Tech Savvy:** Medium to high

**Current Behaviors:**
- Tracks contacts in spreadsheets or HubSpot Free
- Logs activities manually (if at all)
- Uses email search to find customer history
- Manually tracks time in spreadsheets for billing

**Specific Needs:**
- Log a call in <15 seconds without losing momentum
- Find customer history in <5 seconds
- Visual pipeline to prioritize deals
- Track billable hours easily for client invoicing

**Pain Points:**
- Spreadsheets break when shared across team
- Can't find customer info quickly during sales calls
- No visibility into which deals are moving forward
- Time tracking is manual and error-prone

**Goals:**
- Close more deals with less admin work
- Spend 80% of time selling, not logging data
- Hit quota consistently

---

### Secondary User Segment: Sales Manager (Michael)

**Demographics:**
- **Role:** Sales Manager, Head of Sales, VP Sales
- **Company Size:** 20-100 employees
- **Industry:** Same as Sarah
- **Age:** 30-50
- **Reports:** 3-10 sales reps

**Current Behaviors:**
- Asks reps for manual pipeline updates (weekly 1-on-1s)
- Builds reports in Excel/Google Sheets manually
- Reviews timesheets for billing clients
- Uses Slack to coordinate team

**Specific Needs:**
- Real-time pipeline visibility (no asking reps)
- 1-click reports for exec meetings
- Team activity tracking (who's hitting goals?)
- Approve billable hours before invoicing clients

**Pain Points:**
- Reps forget to update pipeline → forecasting is guesswork
- Manual reporting takes 4+ hours/week
- No visibility into team time allocation
- Can't identify coaching opportunities in real-time

**Goals:**
- Accurate revenue forecasting
- Team productivity visibility
- Reduce time spent on reporting by 80%
- Ensure billing accuracy for clients

---

## Goals & Success Metrics

### Business Objectives

**Phase 1: Beta Launch (Month 3)**
- **User Acquisition:** 100 beta users signed up
- **Activation:** 80% of users create ≥1 contact and ≥1 deal within 7 days
- **Engagement:** 60% weekly active users (WAU)
- **NPS:** >40 (acceptable for beta)

**Phase 2: V1.0 Launch (Month 6)**
- **Users:** 500 total users
- **Revenue:** $5K MRR (200 paid users × $29/month × 80% conversion)
- **Retention:** <10% monthly churn
- **Performance:** P95 page load <2 seconds

**Phase 3: V2.0+ (Year 1)**
- **Users:** 5,000 total users
- **Revenue:** $50K MRR
- **Retention:** <5% monthly churn
- **NPS:** >50

### User Success Metrics

**For Sales Reps:**
- Time to log activity: <15 seconds (vs 5+ minutes in Salesforce)
- Time to find contact info: <5 seconds (global search)
- Activities logged per week: >20 (vs <10 in spreadsheets)
- Time tracking adoption: >80% of users track billable hours

**For Sales Managers:**
- Time to generate pipeline report: <10 seconds (1-click)
- Pipeline forecast accuracy: >80%
- Time spent on reporting: <1 hour/week (vs 4+ hours)

### Key Performance Indicators (KPIs)

| KPI | Definition | Target (Month 3) | Target (Month 6) |
|-----|------------|------------------|------------------|
| **Signups** | New user registrations | 100 | 500 |
| **Activation Rate** | % who create ≥1 contact & deal in 7 days | 80% | 85% |
| **WAU/MAU** | Weekly active / Monthly active ratio | 60% | 70% |
| **Churn** | % users who stop using monthly | <15% | <10% |
| **NPS** | Net Promoter Score | >40 | >50 |
| **P95 Load Time** | 95th percentile page load | <2s | <1.5s |
| **Conversion to Paid** | % free users who upgrade | N/A | 40% |

---

## MVP Scope

### Core Features (Must Have)

**1. Contact Management**
- CRUD operations (create, read, update, delete)
- Global search (name, email, company)
- CSV import (up to 1,000 contacts)
- CSV export
- 5 custom fields per contact
- **Rationale:** Foundation of any CRM - must be rock solid

**2. Deal Pipeline**
- Visual Kanban board with drag-and-drop
- 5 default stages: Lead → Qualified → Proposal → Negotiation → Closed Won/Lost
- Customizable stage names and order
- Deal fields: Name, value, close date, probability
- Link deals to contacts
- **Rationale:** Core value proposition - visual pipeline vs spreadsheets

**3. Activity Logging**
- Quick log modal (calls, emails, meetings, notes)
- Log activity in <15 seconds
- Activity timeline (chronological view)
- Keyboard shortcuts (C, E, M, N)
- Link activities to contacts and deals
- **Rationale:** Logging must be frictionless or reps won't do it

**4. Time Tracking**
- Start/stop timer (persists across navigation)
- Manual time entry (for past work)
- Activity-based auto-tracking (link time to calls/meetings)
- Billable hours tracking (mark as billable/non-billable)
- Time approval workflow (draft → submitted → approved/rejected)
- Admin dashboard (hours by user, by lead, by deal)
- Export timesheets to CSV
- **Rationale:** Unique differentiator for agencies/consultants billing clients

**5. Basic Reporting**
- Sales pipeline report (deals by stage, total value)
- Activity summary report (activities per user)
- Win/loss report (win rate, average deal size)
- Time tracking report (billable vs non-billable hours)
- CSV export for all reports
- **Rationale:** Managers need visibility without manual work

**6. User Management**
- 2 roles: Admin (full access) and User (own data only)
- Invite users via email
- User profile management
- **Rationale:** Teams need basic collaboration

---

### Out of Scope for MVP

**Deferred to V2.0 (Months 4-6):**
- ❌ Gmail integration (email sync)
- ❌ Google Calendar integration
- ❌ Lead scoring
- ❌ Email templates
- ❌ Automation/workflows

**Deferred to V3.0+ (Year 1+):**
- ❌ Slack integration
- ❌ Stripe integration
- ❌ Native mobile apps (iOS, Android)
- ❌ Advanced permissions (custom roles)
- ❌ API for third-party integrations

**Why defer these?**
1. **Speed:** Ship core value in 3 months, not 12 months
2. **Validation:** Learn what users actually need before building integrations
3. **Focus:** Do 6 things exceptionally well vs 20 things poorly

---

### MVP Success Criteria

**We know MVP is successful when:**
1. ✅ 80% of beta users create ≥1 contact and ≥1 deal within 7 days
2. ✅ Users log ≥20 activities per week (showing adoption)
3. ✅ 60% weekly active user rate (showing retention)
4. ✅ NPS >40 (showing satisfaction)
5. ✅ P95 page load <2 seconds (showing performance)
6. ✅ Users request V2.0 features (showing engagement with roadmap)

**We know MVP has failed if:**
1. ❌ <50% activation rate (users don't see value)
2. ❌ <30% WAU (users abandon after signup)
3. ❌ NPS <20 (users actively unhappy)
4. ❌ Users request features we already built (showing confusion)

---

## Post-MVP Vision

### Phase 2 Features (V2.0 - Months 4-6)

**Based on expected user feedback:**
1. **Gmail Integration** - Automatically log emails as activities
2. **Google Calendar Integration** - Sync meetings to CRM
3. **Lead Scoring** - Rule-based scoring (e.g., +10 points if CEO title)
4. **Email Templates** - Save common email responses
5. **Basic Automation** - 5 simple workflows (e.g., auto-assign leads)

**Success metric:** 40% of free users upgrade to paid tier

---

### Long-Term Vision (V3.0+ - Year 1+)

**Year 1 Vision:**
- 5,000 active users
- $50K MRR
- Mobile apps (iOS, Android)
- AI lead scoring (ML-based predictions)
- Slack integration (pipeline updates in Slack)
- Stripe integration (billing automation)

**Year 2 Vision:**
- 25,000 active users
- $250K MRR
- Marketplace for plugins
- API for third-party integrations
- Custom reports builder
- Advanced automation (Zapier-like workflows)

---

### Expansion Opportunities

**Geographic Expansion:**
- Start: US (English only)
- Year 1: Canada, UK, Australia
- Year 2: Europe (localization)

**Market Expansion:**
- Start: B2B sales teams
- Year 1: Agencies (time tracking focus)
- Year 2: Consultants, freelancers (solo plans)

**Product Expansion:**
- Start: CRM only
- Year 1: Add project management features (for agencies)
- Year 2: Add invoicing (for consultants)

---

## Technical Considerations

### Platform Requirements

**Target Platforms:**
- Web application (desktop + mobile browsers)
- Responsive design (works on all screen sizes)
- No native apps in V1.0

**Browser/OS Support:**
- **Desktop:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile:** Safari iOS 14+, Chrome Android 10+
- **Tablet:** iPad, Android tablets

**Performance Requirements:**
- P95 page load: <2 seconds on 4G
- P95 API latency: <500ms
- Support 500 concurrent users
- Database queries: <100ms

---

### Technology Preferences

**Frontend:**
- **Framework:** Next.js 15 (App Router) with React 19
- **Language:** TypeScript (type safety)
- **Styling:** Tailwind CSS (utility-first, mobile-friendly)
- **State Management:** React Context + Server State (no Redux)

**Backend:**
- **API:** Next.js API Routes + Server Actions (serverless)
- **Language:** TypeScript
- **Architecture:** Serverless Monolith (simple, fast to iterate)

**Database:**
- **Primary:** Supabase (PostgreSQL 14)
- **Why:** Built-in auth, real-time subscriptions, Row Level Security
- **Scalability:** Handles 100,000 contacts, 50,000 deals

**Hosting/Infrastructure:**
- **Platform:** Vercel (automatic deployments, edge network)
- **CI/CD:** GitHub Actions (automated testing, builds)
- **Domain:** Custom domain via Vercel
- **Monitoring:** Vercel Analytics + Supabase Dashboard

---

### Architecture Considerations

**Repository Structure:**
- **Monorepo:** Single repo for frontend + backend (simpler for small team)
- **Directory Structure:** Next.js App Router convention (`/app`, `/components`, `/lib`)

**Service Architecture:**
- **V1.0:** Serverless Monolith (Next.js + Supabase)
- **V2.0+:** May split into microservices if needed (email service, automation service)

**Integration Requirements:**
- **V1.0:** None (CSV import/export only)
- **V2.0:** Gmail API, Google Calendar API
- **V3.0+:** Slack API, Stripe API, Zapier webhooks

**Security/Compliance:**
- **Authentication:** Email/password + OAuth (Google, GitHub) via Supabase Auth
- **Authorization:** Row Level Security (RLS) in PostgreSQL
- **Data Encryption:** At rest (database) and in transit (HTTPS)
- **Password Policy:** Min 8 characters, require letters + numbers
- **GDPR:** Data export/deletion features (required for EU)
- **SOC 2:** Not required for V1.0 (deferred to V2.0 if enterprise customers)

---

## Constraints & Assumptions

### Constraints

**Budget:**
- **Development:** Internal team (no external contractors)
- **Infrastructure:** <$500/month (Vercel + Supabase free tiers initially)
- **Marketing:** $0 for beta (organic only)

**Timeline:**
- **Hard Deadline:** 3 months to beta launch
- **Reasoning:** Need to validate market fit before building V2.0
- **Trade-off:** Limited features vs speed to market

**Resources:**
- **Team:** 1 full-stack developer + 1 product manager (part-time)
- **Design:** No dedicated designer (use Tailwind UI components)
- **QA:** Manual testing only (no QA engineer)

**Technical:**
- **No Backend Engineers:** Must use serverless/managed services
- **No DevOps:** Must use Vercel auto-deployments
- **No Native Mobile:** Web-only (responsive design instead)

---

### Key Assumptions

**Market Assumptions:**
1. Small sales teams (5-50 people) are underserved by existing CRMs
2. Time tracking is valuable for agencies/consultants billing clients
3. Users will pay $29/user/month for simple, fast CRM
4. 40% of free users will convert to paid (industry benchmark)

**Product Assumptions:**
1. No integrations in V1.0 won't block adoption (CSV import is enough)
2. Basic reporting (4 reports) meets 80% of needs
3. 2 roles (Admin, User) are sufficient for small teams
4. Keyboard shortcuts will be adopted by power users

**Technical Assumptions:**
1. Supabase can handle 500 concurrent users without performance issues
2. Next.js Server Actions are stable enough for production
3. Vercel free tier supports beta launch (100 users)
4. PostgreSQL full-text search is fast enough (no Elasticsearch needed)

**User Assumptions:**
1. Users will import contacts via CSV (not manual entry)
2. Sales reps will log ≥20 activities per week
3. Managers will use reports weekly (not daily)
4. Mobile responsive is enough (no native app needed in V1.0)

---

## Risks & Open Questions

### Key Risks

**Risk 1: Low Adoption**
- **Description:** Users sign up but don't activate (create contacts/deals)
- **Impact:** High - invalidates market hypothesis
- **Mitigation:**
  - Onboarding tutorial (3-step wizard)
  - Sample data pre-loaded
  - Email drip campaign (Days 1, 3, 7)
- **Probability:** Medium (30%)

**Risk 2: Performance Issues at Scale**
- **Description:** App slows down with 10,000+ contacts or 500+ concurrent users
- **Impact:** Medium - hurts user experience, increases churn
- **Mitigation:**
  - Load testing before beta launch
  - Database indexing strategy
  - Pagination (100 results per page)
- **Probability:** Low (15%)

**Risk 3: Competitor Launches Similar Product**
- **Description:** HubSpot or Pipedrive adds time tracking, undercuts pricing
- **Impact:** Medium - reduces differentiation
- **Mitigation:**
  - Move fast (3-month timeline)
  - Build brand early (beta user community)
  - Focus on UX (faster, simpler)
- **Probability:** Medium (40%)

**Risk 4: Supabase Downtime**
- **Description:** Supabase outage takes down CRM
- **Impact:** High - loss of user trust
- **Mitigation:**
  - Monitor Supabase status page
  - Daily backups
  - Incident response plan
- **Probability:** Low (10%)

**Risk 5: Scope Creep**
- **Description:** Team adds features not in MVP (e.g., email integration)
- **Impact:** High - delays launch, increases complexity
- **Mitigation:**
  - Strict PRD adherence
  - Weekly sprint reviews
  - Product manager approval for all new features
- **Probability:** Medium (35%)

---

### Open Questions

**Product Questions:**
1. Should we offer a free tier forever, or trial-only?
2. What's the optimal deal stage count? (5 vs 7 vs customizable?)
3. Do users need mobile notifications for deal stage changes?
4. Should time tracking be enabled by default or opt-in?

**Technical Questions:**
1. Can Supabase real-time subscriptions handle 500 concurrent users?
2. Do we need Redis caching for contact search performance?
3. Should we use Next.js middleware for auth, or Supabase client-side SDK?

**Go-to-Market Questions:**
1. What channels will drive beta signups? (ProductHunt, Reddit, LinkedIn?)
2. Should we target sales reps or sales managers first?
3. Do we need a demo video, or is the product self-explanatory?

**Business Questions:**
1. What's our customer acquisition cost (CAC) target?
2. Should we offer annual plans in V1.0? (discount for upfront payment)
3. Do we need a refund policy?

---

### Areas Needing Further Research

**User Research:**
1. **Competitive analysis** - Deep dive on Pipedrive, HubSpot Free, Streak CRM
2. **User interviews** - Talk to 20 small sales teams about current workflows
3. **Pricing research** - Survey willingness to pay ($19 vs $29 vs $39/user)

**Technical Research:**
1. **Supabase performance benchmarks** - Load test with 10,000 contacts, 500 users
2. **Next.js 15 stability** - Review recent issues, breaking changes
3. **CSV import libraries** - Evaluate PapaParse vs csv-parser vs native

**Market Research:**
1. **TAM/SAM/SOM** - Size of small sales team market (5-50 people)
2. **Churn benchmarks** - What's acceptable churn for SMB SaaS?
3. **Conversion rates** - Free-to-paid benchmarks for CRM products

---

## Appendices

### A. Research Summary

**Market Research Findings:**
- 80% of small sales teams (5-50 people) use spreadsheets or entry-level CRMs (HubSpot Free, Pipedrive)
- Average CRM costs $75-150/user/month for SMBs
- #1 complaint: "Too complex, requires training"
- #2 complaint: "Too expensive for our team size"
- Agencies/consultants need time tracking for client billing

**Competitive Analysis:**
- **Salesforce:** $150+/user/month, 2-week setup, requires admin
- **HubSpot Free:** Missing custom fields, time tracking, advanced reports
- **Pipedrive:** $14-99/user/month, complex UI, no time tracking
- **Streak CRM:** Gmail-only, no standalone product
- **Airtable:** Not purpose-built for CRM, too flexible (paradox of choice)

**User Interview Insights (10 interviews):**
- Sales reps want to log activities in <15 seconds ("I'm on calls all day")
- Sales managers need real-time pipeline visibility ("Stop asking reps for updates")
- Agencies need time tracking for billing ("We use Harvest separately, would love it in CRM")

---

### B. Stakeholder Input

**Internal Stakeholders:**
- **Engineering:** Confirmed Next.js 15 + Supabase is feasible for 3-month timeline
- **Sales:** Validated $29/user/month pricing (competitive vs Salesforce)
- **Customer Success:** Requested onboarding tutorial (reduce support load)

**External Stakeholders (Beta Testers):**
- 5 pre-launch beta testers confirmed interest
- Willing to provide weekly feedback during beta
- Requested: Mobile app (deferred to V2.0), Gmail integration (deferred to V2.0)

---

### C. References

**Documentation:**
- [PRD V1.0](./prd.md) - Full product requirements document
- [BMAD Core Config](../.bmad-core/core-config.yaml) - Project configuration

**External Resources:**
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Gartner CRM Market Report 2024](https://www.gartner.com/en/sales/topics/crm)

**Competitive Products:**
- [Salesforce](https://www.salesforce.com) - Enterprise CRM
- [HubSpot](https://www.hubspot.com) - Inbound CRM
- [Pipedrive](https://www.pipedrive.com) - Sales-focused CRM

---

## Next Steps

### Immediate Actions

1. **Approve Project Brief** - Stakeholder sign-off on scope, timeline, constraints
2. **Architecture Review** - Activate Architect agent to create `docs/architecture.md`
3. **Epic/Story Sharding** - Activate PO agent to break PRD into individual story files
4. **Development Setup** - Initialize Supabase project, deploy to Vercel staging
5. **Beta Tester Recruitment** - Reach out to 10 pre-launch contacts

---

### PM Handoff

This Project Brief provides the full context for **CRM Application V1.0 MVP**.

**For Product Manager:**
Please review this brief thoroughly and use the existing [PRD](./prd.md) to guide development. The PRD includes:
- Detailed functional requirements with acceptance criteria
- Complete database schema
- 8 epics with story breakdown
- 3-month implementation roadmap

**Next Agent:** Architect (Alex) should create the technical architecture document based on this brief and the PRD.

**Success Criteria:** Launch beta in 3 months with 100 users, 80% activation, 60% WAU.

---

**End of Project Brief**

*Status: Ready for Architecture & Development*
