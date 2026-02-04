# 4. Core Features (V1.0 MVP)

## 4.1 MUST HAVE (P0 - Launch Blockers)

### Feature 1: Contact Management
- **CRUD Operations:** Create, read, update, delete contacts
- **Fields:** Name, email, phone, company, title, status (lead/customer)
- **Search:** Global search by name, email, company
- **Import:** CSV upload (up to 1,000 contacts)
- **Export:** CSV download
- **Custom Fields:** 5 custom fields per contact

### Feature 2: Deal Pipeline
- **Visual Kanban:** Drag-and-drop pipeline board
- **Deal Stages:**
  - Lead → Qualified → Proposal → Negotiation → Closed Won/Lost
  - Customizable stage names and order
- **Deal Fields:** Name, value, close date, stage, probability
- **Deal Detail:** View/edit all deal information
- **Link to Contacts:** Associate deals with contacts/companies

### Feature 3: Activity Logging
- **Quick Log:** Log call, email, meeting, or note in <15 seconds
- **Activity Types:** Call, Email, Meeting, Note
- **Fields:** Type, date, duration, notes, related contact/deal
- **Timeline:** View all activities for a contact or deal
- **Keyboard Shortcuts:**
  - `C` = Log call
  - `E` = Log email
  - `M` = Log meeting
  - `N` = Add note

### Feature 4: Time Tracking
- **Automatic Timer:** Start/stop timer for leads and deals
- **Activity-Based Tracking:** Auto-log time when activities are created
- **Manual Time Entry:** Add/edit time entries manually
- **Billable Hours:** Mark time as billable or non-billable
- **Time Approval:** Admin can approve/reject time entries
- **Admin Dashboard:**
  - View total time per user, per lead, per deal
  - Filter by date range, user, billable status
  - Export timesheets to CSV

### Feature 5: Basic Reporting
- **Report 1: Sales Pipeline**
  - Deals by stage
  - Total value per stage
  - Filter by user, date range
- **Report 2: Activity Summary**
  - Activities logged per user
  - Breakdown by type (calls, emails, meetings)
- **Report 3: Win/Loss Report**
  - Win rate by stage
  - Lost deal reasons
  - Average deal size
- **Report 4: Time Tracking Report**
  - Total hours per user, per lead, per deal
  - Billable vs non-billable breakdown
  - Export to CSV for payroll/invoicing

### Feature 6: User Management
- **Roles:**
  - Admin: Full access, manage users, settings
  - User: Access own data, view team data
- **User Profile:** Name, email, password, timezone
- **Team View:** See all users and their activity

---
