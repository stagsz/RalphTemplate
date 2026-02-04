# 7. Tech Stack

## 7.1 Architecture
**Approach:** Serverless Monolith (Next.js App Router)

## 7.2 Stack
```
Frontend:
- Framework: Next.js 15 (App Router)
- UI Library: React 19
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: React Context + Server State

Backend:
- API: Next.js API Routes + Server Actions
- Language: TypeScript

Database:
- Primary: Supabase (PostgreSQL 14)
- Features: Row Level Security, Real-time subscriptions

Authentication:
- Provider: Supabase Auth
- Methods: Email/password, OAuth (Google, GitHub)

Storage:
- Files: Supabase Storage (for CSV imports)

Deployment:
- Platform: Vercel
- CI/CD: GitHub Actions
- Domain: Custom domain via Vercel

Monitoring:
- Analytics: Vercel Analytics
- Errors: Vercel Logs + Supabase Dashboard
```

---
