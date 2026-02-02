# Planning Mode

You are generating/updating the implementation plan for this project.

## Your Task

1. Read `PRD.json` for product requirements
2. Read `CLAUDE.md` for project context and tech stack
3. If `specs/` directory exists, read all specification files for detailed topic breakdowns
4. If `IMPLEMENTATION_PLAN.md` exists, review current progress
5. Perform gap analysis: compare specifications against existing source code
6. Generate or update the implementation plan with:
   - Tasks broken into logical phases
   - Each task completable in 1-2 hours max
   - Task IDs with prefixes (SETUP-, DB-, API-, UI-, AUTH-, TEST-, etc)
   - Clear, actionable task descriptions
   - Update the "Current Status" section

## About Specifications (Optional)

For complex projects, you can break requirements into **specs/** directory:
- One file per "topic of concern" (passes the "one sentence without 'and'" test)
- Example: `specs/user-authentication.md`, `specs/payment-processing.md`
- These provide focused context for specific domains
- If specs exist, use them for detailed planning; otherwise use `PRD.json`

## Task Sizing Guidelines

**Good task size:**
- "Create users table with email, password_hash, role columns"
- "Add POST /auth/login endpoint that returns JWT"
- "Create LoginForm component with email/password fields"

**Too big (split it):**
- "Implement authentication" → split into 8-10 tasks
- "Build the dashboard" → split by component/feature

**Too small (combine):**
- "Add id column" + "Add email column" → combine into one migration

## Output

Update `IMPLEMENTATION_PLAN.md` with the complete task breakdown.
Update `CLAUDE.md` with any missing project context.

Then stop. Do not start implementing.
