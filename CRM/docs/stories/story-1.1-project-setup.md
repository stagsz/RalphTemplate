# Story 1.1: Project setup (Next.js 15 + Supabase + Vercel)

**Epic:** Epic 1 - Foundation & Authentication
**Story ID:** 1.1
**Status:** Todo
**Assigned To:** Dev Agent
**Estimated Time:** 1 day

---

## Description

Set up the foundational project structure with Next.js 15, integrate Supabase for backend services, and configure Vercel for deployment.

---

## Acceptance Criteria

- [ ] Next.js 15 project initialized with App Router
- [ ] Supabase project created and connected
- [ ] Vercel deployment configured
- [ ] Environment variables properly set (.env.local)
- [ ] Basic folder structure established
- [ ] Create vercel.json with basic configuration

---

## Dependencies

**Depends On:** None (first epic)
**Blocks:** Story 1.2, Story 1.5

---

## Technical Notes

- Use `npx create-next-app@latest` with TypeScript and App Router
- Create Supabase project at supabase.com (free tier)
- Connect Vercel via GitHub integration
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Basic folder structure: `/app`, `/components`, `/lib`, `/types`, `/public`
- vercel.json should include build configuration

---

## Implementation Hints

```bash
# Initialize Next.js project
npx create-next-app@latest crm --typescript --tailwind --app --use-npm

# Install Supabase client
npm install @supabase/supabase-js

# Create lib/supabase/client.ts and server.ts
```

---

## Testing Requirements

- [ ] Development server runs successfully (`npm run dev`)
- [ ] Environment variables load correctly
- [ ] Supabase connection test passes
- [ ] Vercel deployment succeeds

---

## Definition of Done

- All acceptance criteria met
- Code committed to main branch
- Vercel deployment successful
- README updated with setup instructions
