# AGENTS.md - Quick Reference

## Start Building

```
Read PROMPT.md and PRD.json. Generate IMPLEMENTATION_PLAN.md with all tasks.
Update CLAUDE.md with project details. Then begin Ralph workflow.
```

## Continue

```
Continue.
```

## The Loop (Eight Steps)

```
┌──────────────────────────────────┐
│ 1. Orient: study specs           │
│ 2. Read: review plan              │
│ 3. Select: choose next task      │
│ 4. Investigate: search code      │
│    (500 parallel subagents)      │
│ 5. Implement: make changes       │
│ 6. Validate: run tests           │
│    (1 subagent for builds)       │
│ 7. Update: mark [x] + log        │
│ 8. Commit: save with "why"       │
└──────────────────────────────────┘
```

**Critical**: Step 4 - Don't assume not implemented. Search first.

## Task Prefixes

| Prefix | Area |
|--------|------|
| SETUP- | Project initialization |
| DB- | Database models/migrations |
| API- | Backend endpoints |
| AUTH- | Authentication |
| UI- | Frontend components |
| TEST- | Test coverage |
| INT- | Integrations |
| EXP- | Export/reporting |

## Commit Format

```
<type>(<scope>): <description> (<TASK-ID>)
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`

## Commands

### Check Progress
```
What's the current status?
```

### Pause
```
Stop after this task.
```

### Handle Blocker
```
I've decided: [decision]. Continue.
```

## Rules

1. ONE task at a time
2. Tests MUST pass
3. Follow existing patterns
4. Update plan after commit
5. Never skip tasks
