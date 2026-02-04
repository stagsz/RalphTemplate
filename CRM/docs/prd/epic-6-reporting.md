# Epic 6: Reporting

**Goal:** Basic sales insights and analytics

**Estimated Time:** 1 week

## Stories

### Story 6.1: Sales pipeline report
**Description:** Create a report showing the health and value of the sales pipeline.

**Acceptance Criteria:**
- Summary cards: total deals, total value, weighted value, avg deal size
- Pipeline by stage table: stage name, # deals, total value, avg days in stage
- Conversion funnel visualization
- Filter by owner, date range, deal status
- Sort by stage order
- Drill-down to deal list by clicking stage
- Export to CSV
- Print-friendly view

**Dependencies:** Epic 3 (Deal Pipeline)

---

### Story 6.2: Activity summary report
**Description:** Generate reports on team activity and productivity.

**Acceptance Criteria:**
- Summary cards: total activities, calls, emails, meetings, notes
- Activities by type (pie chart)
- Activities over time (line chart)
- Activity leaderboard by user
- Filter by date range, user, activity type
- Export to CSV
- Shows duration totals for calls and meetings

**Dependencies:** Epic 4 (Activity Logging)

---

### Story 6.3: Win/loss report
**Description:** Analyze won and lost deals to identify patterns.

**Acceptance Criteria:**
- Summary cards: win rate, total won, total lost, avg win amount
- Won vs lost deals comparison
- Win rate by stage (where deals were won)
- Loss reasons (future: require reason on status=lost)
- Filter by date range, owner, deal amount
- Trends over time (monthly win rate)
- Export to CSV

**Dependencies:** Epic 3 (Deal Pipeline)

---

### Story 6.4: Time tracking report
**Description:** Time tracking report with billing insights (see Epic 5, Story 5.7).

**Note:** This story is implemented in Epic 5, Story 5.7. Referenced here for completeness.

**Dependencies:** Epic 5 (Time Tracking)

---

### Story 6.5: CSV export for all reports
**Description:** Ensure all reports have CSV export functionality.

**Acceptance Criteria:**
- Export button on every report
- CSV includes all visible columns
- CSV respects current filters
- Filename pattern: {report-name}-YYYY-MM-DD.csv
- Download triggers immediately
- Include summary totals in CSV
- Handle large datasets (>10,000 rows)

**Dependencies:** Story 6.1, Story 6.2, Story 6.3

---

## Technical Notes

- Use Recharts for visualizations
- Server-side report generation for performance
- Cache report data (5 minute TTL)
- Use materialized views for complex aggregations (future optimization)
- Export uses streaming for large datasets
- Reports accessible to all users (filtered by RLS)

## Definition of Done

- All stories completed and tested
- Sales pipeline report working with visualizations
- Activity summary report functional
- Win/loss report displaying insights
- CSV export working for all reports
- Reports render in < 2 seconds for typical dataset
- RLS policies enforced (users see own data)
- Unit tests written (>80% coverage)
- E2E tests for report generation
- Performance tested with 5,000 deals and 10,000 activities
- Code reviewed and merged to main branch
