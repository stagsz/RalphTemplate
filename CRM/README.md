# CRM - Simple & Fast

A simple, fast CRM that helps small sales teams manage contacts and close deals.

## Project Overview

**Version:** 1.0 MVP
**Timeline:** 2-3 months to beta launch
**Target:** 100 beta users by Month 3

## Tech Stack

- **Frontend:** Next.js 15.5.6 with App Router, React 19.2.0, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes + Server Actions
- **Database:** Supabase (PostgreSQL 14+)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel
- **Testing:** Vitest + Playwright

## Getting Started

### Prerequisites

- Node.js 18.18+
- npm or pnpm
- Supabase account (free tier)
- Vercel account (optional, for deployment)

### Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/stagsz/CRM.git
cd CRM
npm install
```

2. **Set up Supabase:**

- Create a project at [supabase.com](https://supabase.com)
- Copy `.env.local.example` to `.env.local`
- Add your Supabase URL and anon key to `.env.local`

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
CRM/
├── app/                    # Next.js App Router
├── components/             # React UI components
├── lib/                    # Shared utilities
│   └── supabase/          # Supabase client configuration
├── types/                  # TypeScript type definitions
├── docs/                   # Project documentation
│   ├── prd.md             # Product Requirements
│   ├── architecture.md     # Technical Architecture
│   ├── prd/               # Epic files
│   └── stories/           # User stories
├── public/                 # Static assets
└── README.md              # This file
```

## Development Workflow

This project uses **BMAD (Business Method and Development)** for structured agile development.

### Current Sprint: Epic 1 - Foundation & Authentication

**Stories:**
- ✅ Story 1.1: Project setup (Next.js 15 + Supabase + Vercel)
- ✅ Story 1.2: Authentication UI (Signup, Login, Logout)
- ✅ Story 1.3: User profile page
- ✅ Story 1.4: Role-based access control (Admin, User)
- ✅ Story 1.5: Testing infrastructure and seed data setup

### BMAD Agents

- 📊 **Analyst (Mary)** - Market research, brainstorming, project briefs
- 📝 **PM (Peter)** - Product requirements, epics, stories
- 🏗️ **Architect (Alex)** - System architecture, tech stack, design
- 💻 **Dev (David)** - Implementation
- 🧪 **QA (Quinn)** - Testing strategy, test design
- 📋 **PO (Paula/Sarah)** - Product owner, document alignment
- 🎯 **SM (Sam)** - Scrum master, sprint management

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run db:seed` - Seed database with sample data

## Testing

### Testing Strategy

The project uses a comprehensive testing approach:

- **Unit Tests** - Vitest + React Testing Library for component and utility testing
- **E2E Tests** - Playwright for end-to-end user flow testing
- **Coverage Goal** - 80% code coverage for critical paths

### Running Tests

**Unit Tests:**
```bash
npm run test              # Run all unit tests once
npm run test:watch        # Run tests in watch mode (auto-rerun on changes)
```

**E2E Tests:**
```bash
npm run test:e2e          # Run E2E tests headless
npm run test:e2e:ui       # Run E2E tests with Playwright UI
```

### Seed Data

For development and testing, use the seed script to populate the database:

```bash
npm run db:seed
```

This creates:
- 3 sample users (1 admin, 2 regular users)
- Test credentials available in console output

**Important:** You need to add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file to use the seed script. Find this key in your Supabase project settings under API > Service Role.

## Deployment

### Deploying to Vercel

This project is configured for deployment on Vercel. Follow these steps to deploy:

#### 1. Prerequisites

- Vercel account (free tier available at [vercel.com](https://vercel.com))
- GitHub repository with your code
- Supabase project set up and configured

#### 2. Connect to Vercel

**Option A: Using Vercel Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js configuration
4. Configure environment variables (see below)
5. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Link your project (run from project root)
vercel link

# Deploy to production
vercel --prod
```

#### 3. Environment Variables

Add these environment variables in Vercel Dashboard (Settings > Environment Variables):

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**Optional (for seed script in preview deployments):**
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (⚠️ Never expose this publicly)

**How to add variables:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development environments
4. Redeploy after adding variables

#### 4. Verify Deployment

After deployment:
1. Visit your deployment URL (e.g., `your-project.vercel.app`)
2. Test authentication flows (signup, login)
3. Verify database connection works
4. Check that protected routes redirect correctly

#### 5. Custom Domain (Optional)

To add a custom domain:
1. Go to Vercel project settings > Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

### Deployment Configuration

The project includes `vercel.json` with optimized settings:
- Framework: Next.js (auto-detected)
- Build command: `npm run build`
- Region: `iad1` (US East - change if needed)

### Troubleshooting Deployment

**Build failures:**
- Ensure all dependencies are in `package.json`
- Check that TypeScript compiles: `npm run typecheck`
- Verify build succeeds locally: `npm run build`

**Runtime errors:**
- Verify environment variables are set correctly
- Check Vercel function logs in dashboard
- Ensure Supabase RLS policies allow access

**Database connection issues:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Test connection from local environment first

## Documentation

- **[PRD (Product Requirements)](./docs/prd.md)** - Full product specification
- **[Architecture](./docs/architecture.md)** - Technical architecture (all 16 sections)
- **[Epics & Stories](./docs/prd/)** - Detailed epic breakdowns
- **[Dev Kickoff](./docs/DEV-KICKOFF.md)** - Development guide

## Core Features (V1.0 MVP)

- ✅ Project Setup & Configuration
- ⏳ **Contact Management** - CRUD, search, CSV import/export
- ⏳ **Deal Pipeline** - Visual Kanban board with drag-and-drop
- ⏳ **Activity Logging** - Quick log calls, emails, meetings, notes
- ⏳ **Time Tracking** - Timer, manual entry, billable hours, approval workflow
- ⏳ **Basic Reporting** - Sales pipeline, activity summary, win/loss reports
- ⏳ **User Management** - Simple roles (Admin, User)

## What's NOT in V1.0

- Email integration (Gmail, Outlook) → V2.0
- Calendar integration → V2.0
- Lead scoring → V2.0
- Automation/workflows → V2.0
- Slack/Stripe/Zapier integrations → V2.0+

## Contributing

This is currently a private project. Contributions will be opened after V1.0 launch.

## License

Proprietary - All rights reserved

---

**Status:** 🚧 In Development - V1.0 MVP
**Last Updated:** October 22, 2025
