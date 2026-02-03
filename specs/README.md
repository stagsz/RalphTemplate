# Specifications Directory (Optional)

## When to Use Specs

For **complex projects** with multiple distinct domains, break down your requirements into separate specification files—one per "topic of concern."

**Simple projects**: Just use `PRD.json` at the root. Skip this directory.

**Complex projects**: Create focused specs here for better context efficiency.

## Topic of Concern Test

A valid topic passes the **"one sentence without 'and'" test**:

✅ **Good** (each is one topic):
- `user-authentication.md` - "How users sign up and log in"
- `payment-processing.md` - "How payments are processed"
- `analytics-dashboard.md` - "How analytics are displayed"

❌ **Bad** (contains multiple topics):
- `backend-and-frontend.md` - Two topics, split them
- `auth-and-payments.md` - Two topics, split them

## Example Structure

```
specs/
├── user-authentication.md     # Login, signup, password reset
├── data-export.md             # CSV/PDF export functionality
├── api-integrations.md        # Third-party API connections
└── notification-system.md     # Email and push notifications
```

## Spec File Template

Create each spec with:

1. **Overview** - What is this topic about?
2. **Requirements** - What must it do?
3. **Data Models** - What data structures are needed?
4. **Business Rules** - What validation/logic applies?
5. **Dependencies** - What does this depend on?
6. **Open Questions** - What's still unclear?

See `example-spec.md` for a template.

## How Ralph Uses Specs

**Planning Mode** (`loop.ps1 plan`):
- Reads all spec files from `specs/`
- Performs gap analysis against existing code
- Generates tasks in `IMPLEMENTATION_PLAN.md`

**Building Mode** (`loop.ps1 build`):
- References relevant specs during "Orient" step
- Uses specs for focused context on specific domains
- Keeps context window efficient by loading only relevant specs

## Benefits

- **Context efficiency**: Load only relevant domains
- **Clarity**: Each topic is self-contained
- **Collaboration**: Team members can work on separate specs
- **Evolution**: Update specs as requirements change

## Getting Started

If you don't have specs yet:
1. Start with `PRD.json` for simple projects
2. Generate specs later using: "Break down my PRD.json into separate specs, one per topic"
3. Ralph will create appropriately scoped spec files

If you have specs:
1. Put them in this directory (one `.md` file per topic)
2. Run `loop.ps1 plan` to generate the implementation plan
3. Ralph will reference them during the build loop
