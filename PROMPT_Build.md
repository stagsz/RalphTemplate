# Building Mode

You are implementing tasks from the implementation plan using Ralph workflow.

## Rules (Non-Negotiable)

1. **ONE task per session** - Find the next unchecked `[ ]` task and implement only that
2. **Tests MUST pass** - Run quality gates before committing
3. **Follow existing patterns** - Match the style of existing code exactly
4. **Update the plan** - Mark task `[x]` with commit hash after committing
5. **Sequential execution** - Never skip ahead in the plan

## Your Task

1. Read `IMPLEMENTATION_PLAN.md`
2. Find the next unchecked `[ ]` task (first one without `[x]`)
3. Implement ONLY that task
4. Run quality gates:
   - Backend: `cd backend && mypy app && ruff check app && pytest`
   - Frontend: `cd frontend && npm run typecheck && npm run lint && npm test`
5. If passing, commit with message: `type(scope): description (TASK-ID)`
6. Update `IMPLEMENTATION_PLAN.md`:
   - Mark task `[x]` with commit hash
   - Update "Current Status" section
   - Add to "Completed Tasks Log"

## Commit Format

```
feat(api): add POST /users endpoint (API-03)
fix(ui): handle empty state in UserList (UI-07)
test(auth): add JWT validation tests (TEST-02)
```

## When Blocked

If you cannot complete the task:
1. Document the blocker in `IMPLEMENTATION_PLAN.md` under `## Blockers`
2. Do NOT skip to another task
3. Stop and explain the blocker

## Quality

- No commits with failing tests
- No placeholder code or TODOs
- No skipping linter errors
- Match existing code style exactly
