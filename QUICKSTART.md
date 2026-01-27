# Ralph Template - Quick Start

## Usage

```bash
# 1. Generate the implementation plan
./loop.sh plan

# 2. Build autonomously
./loop.sh build

# Or limit iterations
./loop.sh build 20
./loop.sh 20
```

**Windows:**
```powershell
.\loop.ps1 plan
.\loop.ps1 build
.\loop.ps1 20
```

---

## Step 1: Copy This Template

```bash
cp -r D:/RalphTemplate D:/MyNewProject
cd D:/MyNewProject
git init
```

## Step 2: Define Your Project

Edit `PRD.json` - structure your requirements:
- Product name and description
- User personas
- Features list
- Tech stack
- Data models

## Step 3: Run Planning Mode

```bash
./loop.sh plan
```

This will:
1. Read `PRD.json`
2. Generate `IMPLEMENTATION_PLAN.md` with all tasks
3. Update `CLAUDE.md` with project context
4. Stop (does not start building)

Review the generated plan. Edit if needed.

## Step 4: Run Build Mode

```bash
./loop.sh build
```

This will:
1. Find next unchecked task in `IMPLEMENTATION_PLAN.md`
2. Implement it
3. Run tests
4. Commit
5. Update plan
6. Repeat until all tasks done or you press Ctrl+C

## Step 5: Monitor Progress

Check `IMPLEMENTATION_PLAN.md` for:
- Current status
- Completed tasks with commit hashes
- Any blockers

Check `ralph_log_YYYYMMDD.txt` for detailed logs.

---

## File Structure

| File | Purpose | You Edit? |
|------|---------|-----------|
| `PRD.json` | Product requirements | **YES** |
| `PROMPT_Plan.md` | Planning mode prompt | No |
| `PROMPT_Build.md` | Build mode prompt | No |
| `CLAUDE.md` | AI instructions | Auto-filled |
| `IMPLEMENTATION_PLAN.md` | Task queue | Auto-generated |
| `AGENTS.md` | Quick reference | No |
| `loop.sh` | Main loop (Mac/Linux) | No |
| `loop.ps1` | Main loop (PowerShell) | No |
| `loop.bat` | Main loop (CMD) | No |
| `evaluate_loop.ps1` | Evaluation loop | No |
| `check_prompt_injection.ps1` | Security scanner | No |

---

## Modes

### Planning Mode (`./loop.sh plan`)
- Reads `PRD.json`
- Generates/updates `IMPLEMENTATION_PLAN.md`
- Updates `CLAUDE.md` with project context
- Does NOT implement anything
- Runs once then stops

### Build Mode (`./loop.sh build`)
- Reads `IMPLEMENTATION_PLAN.md`
- Implements one task per iteration
- Commits after each task
- Loops until all tasks done or Ctrl+C

---

## Options

```bash
./loop.sh                 # Build mode, unlimited iterations
./loop.sh plan            # Planning mode
./loop.sh build           # Build mode, unlimited
./loop.sh build 20        # Build mode, max 20 iterations
./loop.sh 20              # Build mode, max 20 iterations (shorthand)
```

---

## Tips

### Be Specific in PRD.json
The more detailed your requirements, the better the generated plan.

### Review the Plan First
Always run `plan` mode first and review `IMPLEMENTATION_PLAN.md` before building.

### Limit Iterations Initially
Start with `./loop.sh 5` to see how it works before running unlimited.

### Check Logs
All output is logged to `ralph_log_YYYYMMDD.txt`.

### Resume Anytime
The plan tracks progress. Just run `./loop.sh build` again to continue.

---

## Evaluation Tools (Optional)

Run quality and security evaluations alongside Ralph to catch issues early.

### Evaluation Loop

```powershell
# Start evaluation loop (runs every 10 minutes)
.\evaluate_loop.ps1

# Custom interval and max runs
.\evaluate_loop.ps1 -IntervalMinutes 5 -MaxRuns 10
```

This runs in parallel with Ralph and checks:
- **Backend**: MyPy, Ruff, Pytest (if `backend/` exists)
- **Frontend**: TypeScript, ESLint, Tests (if `frontend/` exists)
- **Security**: Hardcoded secrets, Prompt injection
- **Git**: Working tree status

Results are logged to `evaluation_protocol_YYYYMMDD.md`.

### Prompt Injection Scanner

Scan for prompt injection vulnerabilities in AI-powered code:

```powershell
.\check_prompt_injection.ps1
```

This scans for:
- Direct user input in prompts
- Missing input validation
- Unsafe message construction
- System prompt manipulation

Report saved to `prompt_injection_report.md`.

### Running Both Loops

Open two terminals:
```powershell
# Terminal 1: Ralph build loop
.\loop.ps1 build

# Terminal 2: Evaluation loop
.\evaluate_loop.ps1
```
