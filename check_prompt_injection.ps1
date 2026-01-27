# Ralph Template - Prompt Injection Security Scanner
# Scans for prompt injection vulnerabilities in AI-powered applications
# Works with any project structure - scans current directory recursively

param(
    [string]$OutputFile = "prompt_injection_report.md",
    [string]$ScanPath = "."
)

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "         Prompt Injection Security Scanner                      " -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  Scanning: $ScanPath" -ForegroundColor Gray
Write-Host ""

$findings = @()

# File extensions to scan
$codeFiles = @("*.py", "*.ts", "*.js", "*.tsx", "*.jsx")

# Directories to exclude
$excludeDirs = @("*node_modules*", "*venv*", "*.venv*", "*__pycache__*", "*dist*", "*build*")

function Get-CodeFiles {
    param([string]$Path)
    Get-ChildItem -Path $Path -Recurse -Include $codeFiles -ErrorAction SilentlyContinue |
        Where-Object {
            $file = $_
            -not ($excludeDirs | Where-Object { $file.FullName -like $_ })
        }
}

# =============================================================================
# Category 1: Direct User Input in Prompts
# =============================================================================
Write-Host "[1/5] Scanning for direct user input in prompts..." -ForegroundColor Cyan

$directPatterns = @(
    'f".*user_input.*"',
    'f".*user_message.*"',
    'f".*request\.',
    'prompt\s*\+\s*user',
    'prompt\s*\+\s*input',
    '`.*\$\{.*user.*\}.*`',           # JS template literals
    '`.*\$\{.*input.*\}.*`'
)

foreach ($pattern in $directPatterns) {
    $matchedFiles = Get-CodeFiles -Path $ScanPath |
        Select-String -Pattern $pattern -ErrorAction SilentlyContinue

    foreach ($match in $matchedFiles) {
        $findings += [PSCustomObject]@{
            Category = "Direct Input"
            Risk = "HIGH"
            File = $match.Filename
            Line = $match.LineNumber
            Description = "User input directly in prompt"
        }
    }
}

# =============================================================================
# Category 2: Missing Input Validation
# =============================================================================
Write-Host "[2/5] Checking for missing input validation..." -ForegroundColor Cyan

$aiFiles = Get-CodeFiles -Path $ScanPath |
    Select-String -Pattern "anthropic|openai|claude|ChatCompletion|createMessage" -List -ErrorAction SilentlyContinue

foreach ($file in $aiFiles) {
    $content = Get-Content $file.Path -Raw -ErrorAction SilentlyContinue

    # Python: check for pydantic/validation
    if ($file.Path -match "\.py$") {
        if ($content -match "client\.messages|ChatCompletion" -and $content -notmatch "pydantic|validate|sanitize|BaseModel") {
            $findings += [PSCustomObject]@{
                Category = "Missing Validation"
                Risk = "MEDIUM"
                File = $file.Filename
                Line = "N/A"
                Description = "AI calls without apparent input validation"
            }
        }
    }
    # TypeScript/JavaScript: check for zod/validation
    if ($file.Path -match "\.(ts|js|tsx|jsx)$") {
        if ($content -match "messages|createMessage" -and $content -notmatch "zod|validate|sanitize|schema") {
            $findings += [PSCustomObject]@{
                Category = "Missing Validation"
                Risk = "MEDIUM"
                File = $file.Filename
                Line = "N/A"
                Description = "AI calls without apparent input validation"
            }
        }
    }
}

# =============================================================================
# Category 3: Unsafe Message Construction
# =============================================================================
Write-Host "[3/5] Scanning for unsafe message construction..." -ForegroundColor Cyan

$msgPatterns = @(
    'messages.*=.*f"',
    'HumanMessage.*content.*f"',
    'role.*user.*content.*f"',
    'content:\s*`\$\{',              # JS template in content
    'messages.*push.*`\$\{'
)

foreach ($pattern in $msgPatterns) {
    $matchedFiles = Get-CodeFiles -Path $ScanPath |
        Select-String -Pattern $pattern -ErrorAction SilentlyContinue

    foreach ($match in $matchedFiles) {
        $findings += [PSCustomObject]@{
            Category = "Unsafe Messages"
            Risk = "HIGH"
            File = $match.Filename
            Line = $match.LineNumber
            Description = "Dynamic string in message content"
        }
    }
}

# =============================================================================
# Category 4: System Prompt Manipulation
# =============================================================================
Write-Host "[4/5] Checking for system prompt vulnerabilities..." -ForegroundColor Cyan

$sysPatterns = @(
    'system.*=.*\+.*user',
    'system.*=.*\+.*input',
    'SystemMessage.*content.*\{',
    'role.*system.*content.*\$\{'
)

foreach ($pattern in $sysPatterns) {
    $matchedFiles = Get-CodeFiles -Path $ScanPath |
        Select-String -Pattern $pattern -ErrorAction SilentlyContinue

    foreach ($match in $matchedFiles) {
        $findings += [PSCustomObject]@{
            Category = "System Prompt"
            Risk = "CRITICAL"
            File = $match.Filename
            Line = $match.LineNumber
            Description = "Variable in system prompt"
        }
    }
}

# =============================================================================
# Category 5: Prompt Template Files
# =============================================================================
Write-Host "[5/5] Scanning prompt templates..." -ForegroundColor Cyan

$templateFiles = Get-ChildItem -Path $ScanPath -Recurse -Include "*.py","*.ts","*.js","*.txt","*.jinja2","*.hbs" -ErrorAction SilentlyContinue |
    Where-Object {
        $file = $_
        $file.Name -match "prompt|template" -and -not ($excludeDirs | Where-Object { $file.FullName -like $_ })
    }

foreach ($file in $templateFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match "user|input|query") {
        $findings += [PSCustomObject]@{
            Category = "Template Security"
            Risk = "MEDIUM"
            File = $file.Name
            Line = "N/A"
            Description = "Template may accept user input"
        }
    }
}

# =============================================================================
# Generate Report
# =============================================================================
Write-Host ""
Write-Host "Generating report..." -ForegroundColor Cyan

$criticalCount = ($findings | Where-Object { $_.Risk -eq "CRITICAL" } | Measure-Object).Count
$highCount = ($findings | Where-Object { $_.Risk -eq "HIGH" } | Measure-Object).Count
$mediumCount = ($findings | Where-Object { $_.Risk -eq "MEDIUM" } | Measure-Object).Count

$report = "# Prompt Injection Security Report`n`n"
$report += "**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$report += "**Scanned Path**: $ScanPath`n`n"
$report += "## Summary`n`n"
$report += "| Risk Level | Count |`n"
$report += "|------------|-------|`n"
$report += "| CRITICAL | $criticalCount |`n"
$report += "| HIGH | $highCount |`n"
$report += "| MEDIUM | $mediumCount |`n"
$report += "| **Total** | **$($findings.Count)** |`n`n"
$report += "## Findings`n`n"

if ($findings.Count -eq 0) {
    $report += "No prompt injection vulnerabilities detected.`n`n"
    $report += "### Best Practices Reminder`n`n"
    $report += "- Validate all user inputs before including in prompts`n"
    $report += "- Use structured message formats, not string concatenation`n"
    $report += "- Never include user data in system prompts`n"
    $report += "- Validate and sanitize AI outputs`n"
} else {
    $report += "| Risk | Category | File | Line | Description |`n"
    $report += "|------|----------|------|------|-------------|`n"

    foreach ($finding in $findings) {
        $report += "| $($finding.Risk) | $($finding.Category) | $($finding.File) | $($finding.Line) | $($finding.Description) |`n"
    }

    $report += "`n## Remediation Guide`n`n"
    $report += "### Never concatenate user input into prompts`n`n"
    $report += "``````python`n"
    $report += "# Bad`n"
    $report += "prompt = f'Answer this: {user_input}'`n`n"
    $report += "# Good - validate and structure`n"
    $report += "validated = sanitize(user_input)`n"
    $report += "messages = [{'role': 'user', 'content': validated}]`n"
    $report += "``````n`n"
    $report += "### Input Validation`n`n"
    $report += "- Use Pydantic (Python) or Zod (TypeScript) for validation`n"
    $report += "- Limit input length`n"
    $report += "- Reject suspicious patterns like 'ignore previous instructions'`n"
}

$report += "`n---`n`n*Report generated by Ralph Security Scanner*`n"

$report | Out-File -FilePath $OutputFile -Encoding UTF8

# =============================================================================
# Console Output
# =============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor $(if ($criticalCount -gt 0) { "Red" } elseif ($highCount -gt 0) { "Yellow" } else { "Green" })

if ($findings.Count -eq 0) {
    Write-Host "No prompt injection vulnerabilities detected" -ForegroundColor Green
} else {
    Write-Host "Found $($findings.Count) potential vulnerabilities:" -ForegroundColor Yellow
    Write-Host "   CRITICAL: $criticalCount" -ForegroundColor $(if ($criticalCount -gt 0) { "Red" } else { "Gray" })
    Write-Host "   HIGH: $highCount" -ForegroundColor $(if ($highCount -gt 0) { "Yellow" } else { "Gray" })
    Write-Host "   MEDIUM: $mediumCount" -ForegroundColor $(if ($mediumCount -gt 0) { "Yellow" } else { "Gray" })
}

Write-Host ""
Write-Host "Report saved to: $OutputFile" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Gray
