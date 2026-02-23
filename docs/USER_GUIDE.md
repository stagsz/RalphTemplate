# HazOp Assistant User Guide

This guide provides step-by-step instructions for conducting Hazard and Operability Studies (HazOps) using the HazOp Assistant platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Understanding HazOps Methodology](#understanding-hazops-methodology)
- [Creating a Project](#creating-a-project)
- [Managing P&ID Documents](#managing-pid-documents)
- [Conducting HazOps Analysis](#conducting-hazops-analysis)
- [Risk Assessment](#risk-assessment)
- [LOPA Analysis](#lopa-analysis)
- [Compliance Validation](#compliance-validation)
- [Generating Reports](#generating-reports)
- [Collaboration Features](#collaboration-features)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### Logging In

1. Navigate to the application URL
2. Enter your email and password
3. Click **Login**

If you forgot your password, click **Forgot password?** and follow the reset instructions.

### Dashboard Overview

After logging in, you'll see the main dashboard with:

- **Project Summary Cards**: Quick view of active, completed, and draft projects
- **Recent Analyses**: Your most recent analysis sessions
- **Risk Overview**: Distribution of risk levels across your projects
- **Pending Actions**: Analyses awaiting your review or action
- **Activity Timeline**: Recent activity across your projects

### User Roles

| Role | Capabilities |
|------|-------------|
| **Administrator** | Full system access, user management, all project access |
| **Lead Analyst** | Create projects, approve analyses, manage team members |
| **Analyst** | Conduct analyses, create entries, generate reports |
| **Viewer** | Read-only access to assigned projects and reports |

---

## Understanding HazOps Methodology

HazOps (Hazard and Operability Study) is a structured technique for identifying potential hazards in industrial processes. The methodology uses **guide words** applied to **process parameters** to systematically identify **deviations** from design intent.

### Guide Words

The system supports seven standard guide words:

| Guide Word | Meaning | Example |
|------------|---------|---------|
| **NO** | Complete negation | No flow through pump |
| **MORE** | Quantitative increase | More pressure in vessel |
| **LESS** | Quantitative decrease | Less temperature in reactor |
| **REVERSE** | Opposite direction | Reverse flow in pipeline |
| **EARLY** | Timing deviation | Early valve opening |
| **LATE** | Timing deviation | Late shutdown sequence |
| **OTHER THAN** | Qualitative deviation | Wrong composition of feed |

### Analysis Workflow

The standard HazOps analysis follows this sequence:

```
Node Selection → Guide Word → Deviation → Causes → Consequences → Safeguards → Recommendations → Risk Assessment
```

---

## Creating a Project

### New Project

1. Click **Projects** in the sidebar
2. Click **New Project** button
3. Fill in the project details:
   - **Name**: Descriptive project name
   - **Description**: Project scope and objectives
   - **Facility**: Plant or facility name
   - **Process Unit**: Specific process unit being analyzed
4. Click **Create Project**

### Project Status

Projects progress through these statuses:

| Status | Description |
|--------|-------------|
| **Planning** | Initial setup, P&ID upload phase |
| **Active** | Analysis in progress |
| **Review** | Analysis complete, awaiting approval |
| **Completed** | Approved and finalized |
| **Archived** | Historical record |

### Adding Team Members

1. Open your project
2. Go to the **Team** tab
3. Click **Add Member**
4. Search for users by name or email
5. Select their role (Lead Analyst, Analyst, or Viewer)
6. Click **Add**

---

## Managing P&ID Documents

### Uploading P&ID Documents

1. Open your project
2. Go to the **Documents** tab
3. Click **Upload Document** or drag-and-drop files
4. Supported formats: PDF, PNG, JPG, DWG
5. Wait for upload and processing to complete

### Viewing P&ID Documents

Click on any document to open the P&ID Viewer:

- **Zoom**: Use mouse wheel or +/- buttons
- **Pan**: Click and drag to move around
- **Fit to Screen**: Double-click to reset view

### Creating Analysis Nodes

Nodes represent equipment or process points on the P&ID that will be analyzed.

1. Open the P&ID viewer
2. Click **Add Node** in the toolbar
3. Click on the P&ID where the node should be placed
4. Fill in node details:
   - **Node ID**: Unique identifier (e.g., "P-101", "V-201")
   - **Description**: Equipment or process description
   - **Equipment Type**: Pump, valve, reactor, heat exchanger, pipe, tank, or other
5. Click **Save**

### Editing Nodes

- Click on any node marker to select it
- Click **Edit** to modify details
- Drag the node to reposition it on the P&ID
- Click **Delete** to remove a node

---

## Conducting HazOps Analysis

### Creating an Analysis Session

1. Open your project
2. Go to the **Analysis** tab
3. Click **New Analysis**
4. Select the P&ID document to analyze
5. Enter a name for the analysis session
6. Click **Start Analysis**

### Analysis Workspace

The workspace has two main areas:

**Left Pane**: P&ID Viewer
- View the document with zoom and pan
- Click nodes to select them for analysis
- Green indicators show nodes with complete analysis

**Right Pane**: Analysis Panel
- **Entry View**: Create and edit analysis entries
- **Summary View**: Review all entries in a table

### Step-by-Step Analysis Process

#### 1. Select a Node

Click on a node marker in the P&ID viewer. The selected node will be highlighted and its details shown in the right panel.

#### 2. Select a Guide Word

Use the tabbed interface to select a guide word:
- Each tab shows one of the seven guide words
- Green dot indicators show which guide words have entries
- Progress counter shows "X of 7 guide words analyzed"
- Use keyboard shortcuts 1-7 for quick selection

#### 3. Enter Deviation

Define what deviation from normal operation you're analyzing:

- **Parameter**: Select from common parameters (flow, pressure, temperature, level, etc.) or enter a custom parameter
- **Deviation**: Description of the deviation being analyzed

Click **Add Entry** or press **Ctrl+Enter** to create the entry.

#### 4. Select Causes

The system presents **prepared answer menus** based on the equipment type and guide word:

- **Common Causes**: Frequently occurring causes (highlighted with green badge)
- **Other Causes**: Additional causes from the database
- **Custom Causes**: Add causes not in the prepared list

Select all applicable causes using the checkboxes. The system auto-saves your selections.

#### 5. Select Consequences

After selecting causes, the consequences section appears:

- Choose from prepared consequence options
- Consider both immediate and potential escalating consequences
- Add custom consequences if needed

#### 6. Select Safeguards

Identify existing protections against the identified consequences:

- Basic Process Control Systems (BPCS)
- Alarms and operator response
- Safety Instrumented Functions (SIF)
- Physical safeguards (relief valves, dikes, etc.)
- Administrative controls (procedures, training)

#### 7. Select Recommendations

Suggest improvements or additional safeguards:

- Engineering modifications
- Additional instrumentation
- Procedure updates
- Training requirements
- Further studies needed

### Reviewing Entries

Switch to **Summary View** to see all analysis entries in a table:

| Column | Description |
|--------|-------------|
| Node ID | Equipment identifier |
| Guide Word | Applied guide word |
| Parameter | Process parameter |
| Deviation | Description of deviation |
| Causes | First 2 causes (+X more) |
| Consequences | First 2 consequences (+X more) |
| Safeguards | First 2 safeguards (+X more) |
| Recommendations | First 2 recommendations (+X more) |
| Risk Score | Calculated risk (if assessed) |

Use the filters to narrow down entries:
- Search by text
- Filter by guide word
- Filter by risk level

Click any row to return to Entry View and edit that entry.

---

## Risk Assessment

### Risk Calculation

Risk is calculated using three factors:

| Factor | Scale | Description |
|--------|-------|-------------|
| **Severity** | 1-5 | Impact of the consequence |
| **Likelihood** | 1-5 | Probability of occurrence |
| **Detectability** | 1-5 | Ability to detect before impact |

**Risk Score** = Severity × Likelihood × Detectability (Range: 1-125)

### Severity Scale

| Level | Rating | Description |
|-------|--------|-------------|
| 1 | Negligible | No injury, minimal environmental impact, <$10K damage |
| 2 | Minor | First aid injury, minor spill, $10K-$100K damage |
| 3 | Moderate | Medical treatment, contained release, $100K-$1M damage |
| 4 | Major | Serious injury, significant release, $1M-$10M damage |
| 5 | Catastrophic | Fatality, major environmental damage, >$10M damage |

### Likelihood Scale

| Level | Rating | Frequency |
|-------|--------|-----------|
| 1 | Rare | Less than once per 100 years |
| 2 | Unlikely | Once per 10-100 years |
| 3 | Possible | Once per 1-10 years |
| 4 | Likely | Once per month to year |
| 5 | Almost Certain | Weekly or more frequent |

### Detectability Scale

| Level | Rating | Description |
|-------|--------|-------------|
| 1 | Almost Certain | Continuous monitoring with automatic response |
| 2 | High | Regular monitoring, operator will likely notice |
| 3 | Moderate | Periodic checks may detect |
| 4 | Low | Unlikely to detect until incident occurs |
| 5 | Undetectable | No means of detection available |

### Risk Levels

| Risk Score | Level | Action Required |
|------------|-------|-----------------|
| 1-20 | Low (Green) | Monitor, no immediate action |
| 21-60 | Medium (Amber) | Review safeguards, consider improvements |
| 61-125 | High (Red) | Immediate action required, LOPA recommended |

### Risk Matrix

The 5×5 risk matrix provides a visual representation of risk distribution:
- Click cells to filter entries by that risk combination
- Colors indicate risk levels (green, amber, red)

### Risk Dashboard

Navigate to the Risk Dashboard to view:
- Overall risk distribution across the project
- Risk breakdown by guide word
- Highest risk entries
- Analysis summaries with risk trends

---

## LOPA Analysis

Layers of Protection Analysis (LOPA) is required when:
- Risk score exceeds the High threshold (61+)
- Additional validation of safeguard effectiveness is needed
- Compliance requires documented protection layer analysis

### Creating a LOPA Analysis

1. Open an analysis entry with High risk
2. Click **Create LOPA** or navigate to the LOPA section
3. Complete the LOPA form:

#### Scenario Details

- **Scenario Description**: Describe the hazard scenario
- **Consequence**: Describe the potential outcome

#### Initiating Event

- **Category**: Select from equipment failures, human error, external events, etc.
- **Description**: Describe the initiating event
- **Frequency**: Enter initiating event frequency (events per year)

Typical initiating event frequencies:
| Category | Typical Frequency |
|----------|-------------------|
| BPCS failure | 0.1 per year |
| Human error | 0.1-1.0 per year |
| External impact | 0.01 per year |
| Equipment failure | 0.01-0.1 per year |

#### Target Frequency

Set the acceptable frequency based on consequence severity:
| Severity | Typical Target |
|----------|----------------|
| Minor injury | 10⁻² per year |
| Serious injury | 10⁻³ per year |
| Single fatality | 10⁻⁴ per year |
| Multiple fatalities | 10⁻⁵ per year |

#### Independent Protection Layers (IPLs)

Add each protection layer with:
- **Type**: BPCS, alarm, SIF, mechanical, administrative
- **Name/Tag**: Identifier for the IPL
- **PFD**: Probability of Failure on Demand
- **Description**: How this layer provides protection
- **Independence**: Confirm independence from other layers

Typical PFD values:
| IPL Type | Typical PFD |
|----------|-------------|
| BPCS control loop | 0.1 |
| Human response to alarm | 0.1 |
| SIL 1 SIF | 0.1 |
| SIL 2 SIF | 0.01 |
| SIL 3 SIF | 0.001 |
| Relief valve | 0.01 |
| Rupture disc | 0.01 |

### LOPA Results

The results display shows:

- **Gap Analysis**: Compares achieved risk reduction to target
  - **Adequate**: IPLs meet target frequency
  - **Marginal**: Close to target, may need review
  - **Inadequate**: Additional protection required

- **Key Metrics**:
  - Initiating Event Frequency
  - Mitigated Event Likelihood
  - Target Frequency
  - Total Risk Reduction Factor

- **IPL Credit Table**: Contribution of each protection layer

- **Recommendations**: Suggested actions if gaps exist

---

## Compliance Validation

The system validates analyses against major regulatory standards:

| Standard | Jurisdiction | Focus Area |
|----------|--------------|------------|
| IEC 61511 | International | Functional safety (SIS) |
| ISO 31000 | International | Risk management |
| ISO 9001 | International | Quality management |
| ATEX/DSEAR | EU/UK | Explosive atmospheres |
| PED | EU | Pressure equipment |
| OSHA PSM | USA | Process safety management |
| EPA RMP | USA | Risk management program |
| SEVESO III | EU | Major accident hazards |

### Compliance Validation Screen

Access via **Project → Compliance → Validation View**:

1. **Overall Status Gauge**: Percentage compliance across all standards
2. **Standards Checklist**: Expandable list of each standard with:
   - Compliance percentage
   - Breakdown: Compliant / Partial / Non-Compliant / N/A / Not Assessed
3. **Filter by Standard**: Focus on specific regulations
4. **Metrics Summary**: Total standards, analyses, entries, clauses checked

### Compliance Dashboard

Access via **Project → Compliance → Dashboard View**:

- **Clause Status Distribution**: Pie chart of compliance breakdown
- **Compliance by Standard**: Stacked bar chart per standard
- **Compliance by Jurisdiction**: Progress bars by region
- **Compliance by Category**: Progress bars by regulatory type
- **Detailed Table**: Sortable breakdown of all standards

### Compliance Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Compliant | Green | Meets all requirements |
| Partially Compliant | Amber | Some requirements not met |
| Non-Compliant | Red | Does not meet requirements |
| Not Applicable | Gray | Standard does not apply |
| Not Assessed | Light Gray | Not yet evaluated |

---

## Generating Reports

### Report Formats

| Format | Best For |
|--------|----------|
| **Word (.docx)** | Detailed narrative reports, regulatory submissions |
| **PDF** | Final distribution, archive copies |
| **Excel (.xlsx)** | Data analysis, custom filtering |
| **PowerPoint (.pptx)** | Presentations, management summaries |

### Creating a Report

1. Navigate to **Project → Reports**
2. Click **Generate Report**
3. Select options:
   - **Format**: Word, PDF, Excel, or PowerPoint
   - **Template**: Standard or custom template
   - **Include Sections**: Executive summary, full analysis, risk matrix, recommendations, compliance
   - **Analyses**: Select which analyses to include
4. Click **Generate**

### Report Contents

Standard reports include:

1. **Executive Summary**: Key findings and metrics
2. **Methodology**: HazOps approach and guide words
3. **P&ID Documents**: Referenced diagrams
4. **Analysis Entries**: Complete deviation analysis table
5. **Risk Assessment**: Risk matrix and distribution
6. **LOPA Results**: Protection layer analysis
7. **Compliance Status**: Regulatory validation summary
8. **Recommendations**: Prioritized action items
9. **Appendices**: Supporting data and references

### Report Status

| Status | Description |
|--------|-------------|
| Pending | In queue for generation |
| Processing | Currently being generated |
| Completed | Ready for download |
| Failed | Generation error (retry available) |

### Downloading Reports

1. Go to **Project → Reports**
2. Find your report in the list
3. Click **Download** to save the file

---

## Collaboration Features

### Starting a Collaboration Session

1. Open an analysis in draft status
2. Click **Collaborate** in the header
3. Share the session link with team members

### Real-time Features

- **Live Updates**: See changes from other users instantly
- **User Presence**: Avatars show who's currently viewing
- **Cursor Tracking**: See where other users are working
- **Conflict Detection**: System alerts when multiple users edit the same entry

### Resolving Conflicts

When two users edit the same entry simultaneously:

1. Conflict modal appears showing both versions
2. Compare changes side-by-side
3. Choose which version to keep, or merge changes
4. Click **Resolve** to continue

### Inviting Collaborators

1. Click the collaboration indicator
2. Click **Invite**
3. Search for users by name or email
4. Click **Send Invitation**

---

## Keyboard Shortcuts

Master these shortcuts for faster analysis:

### Navigation

| Shortcut | Action |
|----------|--------|
| `Alt + ↓` | Next node |
| `Alt + ↑` | Previous node |
| `Ctrl + T` | Toggle Entry/Summary view |
| `Escape` | Clear selection (entry → guide word → node) |

### Guide Words

| Shortcut | Guide Word |
|----------|------------|
| `1` | NO |
| `2` | MORE |
| `3` | LESS |
| `4` | REVERSE |
| `5` | EARLY |
| `6` | LATE |
| `7` | OTHER THAN |

### Actions

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Submit deviation form |
| `Ctrl + N` | New entry (if in draft) |
| `?` | Show shortcuts help |

---

## Tips for Effective Analysis

### Preparation

1. **Review P&IDs thoroughly** before starting analysis
2. **Define clear node boundaries** to avoid overlap
3. **Gather process documentation** (design basis, operating procedures)
4. **Identify key process parameters** for each node type

### During Analysis

1. **Work systematically** through each node and guide word
2. **Consider all plausible scenarios**, not just the obvious ones
3. **Document safeguards accurately** with specific identifiers
4. **Cross-reference recommendations** to avoid duplication
5. **Use prepared answer menus** for consistency across team members

### Quality Assurance

1. **Review entries before completing** analysis
2. **Verify risk assessments** are consistent and justified
3. **Complete LOPA** for all high-risk scenarios
4. **Check compliance validation** before finalizing
5. **Generate draft reports** for team review

### Common Pitfalls

- Skipping guide words that seem unlikely
- Underestimating consequence severity
- Over-relying on administrative safeguards
- Incomplete documentation of assumptions
- Not updating analyses when process changes

---

## Getting Help

### In-Application Help

- Press `?` to see keyboard shortcuts
- Hover over icons for tooltips
- Click info icons for contextual help

### Support Resources

- **API Documentation**: Available at `/api/api-docs`
- **Environment Setup**: See `docs/ENVIRONMENT.md`
- **Technical Issues**: Contact your system administrator

---

## Glossary

| Term | Definition |
|------|------------|
| **BPCS** | Basic Process Control System - standard process control |
| **Consequence** | Outcome of a deviation occurring |
| **Deviation** | Departure from design or operating intent |
| **Guide Word** | Prompt used to identify deviations |
| **IPL** | Independent Protection Layer - safeguard with quantified reliability |
| **LOPA** | Layers of Protection Analysis - quantitative risk assessment |
| **Node** | Section of process/equipment being analyzed |
| **P&ID** | Piping and Instrumentation Diagram |
| **PFD** | Probability of Failure on Demand |
| **RRF** | Risk Reduction Factor |
| **Safeguard** | Measure that reduces risk |
| **SIF** | Safety Instrumented Function |
| **SIL** | Safety Integrity Level (1-4) |
| **SIS** | Safety Instrumented System |

---

*Document Version: 1.0*
*Last Updated: February 2026*
