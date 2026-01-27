# Ralph Build Template

Autonomous AI-driven development using the Ralph workflow.
Based on [Geoff Huntley's Ralph methodology](https://ghuntley.com/ralph/).

## Quick Start

```bash
# 1. Copy template
cp -r D:/RalphTemplate D:/MyProject
cd D:/MyProject

# 2. Edit PRD.json with your requirements

# 3. Generate plan
./loop.sh plan          # or .\loop.ps1 plan on Windows

# 4. Build
./loop.sh build         # or .\loop.ps1 build on Windows
```

## What is Ralph?

Ralph is an autonomous AI development loop:
1. **Plan** - Generate implementation tasks from requirements
2. **Build** - Execute one task at a time, commit, repeat
3. **Track** - Progress tracked in `IMPLEMENTATION_PLAN.md`

## Files

| Edit | File | Purpose |
|:----:|------|---------|
| ✏️ | `PRD.json` | Your product requirements |
| | `PROMPT_Plan.md` | Planning mode instructions |
| | `PROMPT_Build.md` | Build mode instructions |
| | `CLAUDE.md` | Project context (auto-filled) |
| | `IMPLEMENTATION_PLAN.md` | Task queue (auto-generated) |
| | `loop.sh` / `loop.ps1` | The autonomous loop |
| | `evaluate_loop.ps1` | Quality/security evaluation loop |
| | `check_prompt_injection.ps1` | Prompt injection scanner |

## Commands

```bash
./loop.sh plan          # Generate implementation plan
./loop.sh build         # Build autonomously (unlimited)
./loop.sh build 20      # Build max 20 iterations
./loop.sh 20            # Shorthand for above
```

Press `Ctrl+C` to stop.

## Evaluation Tools (Optional)

Run quality and security checks alongside Ralph:

```powershell
# Run evaluation loop (checks every 10 minutes)
.\evaluate_loop.ps1

# Custom interval (every 5 minutes, max 10 runs)
.\evaluate_loop.ps1 -IntervalMinutes 5 -MaxRuns 10

# Run prompt injection scan only
.\check_prompt_injection.ps1
```

Checks performed:
- **Code Quality**: MyPy, Ruff, ESLint, TypeScript
- **Testing**: Pytest, Vitest
- **Security**: Hardcoded secrets, Prompt injection vulnerabilities
- **Git**: Working tree status

Reports are saved to `evaluation_protocol_YYYYMMDD.md`.

## Logs

Output is logged to `ralph_log_YYYYMMDD.txt`.

## Documentation

See `QUICKSTART.md` for detailed instructions.
