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

<!-- FILL THIS IN: 2-3 sentences describing what you're building -->

**{{PROJECT_NAME}}** - {{PROJECT_DESCRIPTION}}

---

## Tech Stack

<!-- FILL THIS IN: Your chosen technologies -->

| Layer | Technology |
|-------|------------|
| Frontend | |
| Backend | |
| Database | |
| Auth | |
| Other | |

---

## Domain Knowledge

<!-- FILL THIS IN: Domain-specific terms, conventions, data formats -->

