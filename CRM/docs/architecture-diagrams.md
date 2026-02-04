# CRM System Architecture & Process Diagrams

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        DarkMode[Dark Mode Toggle]
    end

    subgraph "Next.js Application"
        Pages[Pages - App Router]
        Components[React Components]
        ServerActions[Server Actions]
        Middleware[Auth Middleware]

        Pages --> Components
        Pages --> ServerActions
        Components --> ServerActions
    end

    subgraph "Authentication"
        SupabaseAuth[Supabase Auth]
        RLS[Row Level Security]
        Permissions[Role-Based Access]
    end

    subgraph "Database"
        PostgreSQL[(PostgreSQL - Supabase)]
        Tables[Tables: users, contacts, deals, activities]
    end

    Browser --> Pages
    DarkMode --> Browser
    Middleware --> SupabaseAuth
    ServerActions --> SupabaseAuth
    SupabaseAuth --> RLS
    RLS --> PostgreSQL
    Permissions --> RLS
    PostgreSQL --> Tables

    style Browser fill:#3b82f6
    style PostgreSQL fill:#10b981
    style SupabaseAuth fill:#8b5cf6
```

## 2. Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ CONTACTS : owns
    USERS ||--o{ DEALS : owns
    USERS ||--o{ ACTIVITIES : creates
    CONTACTS ||--o{ DEALS : "has many"
    CONTACTS ||--o{ ACTIVITIES : "has many"
    DEALS ||--o{ ACTIVITIES : "has many"

    USERS {
        uuid id PK
        string email
        string full_name
        enum role
        timestamp created_at
    }

    CONTACTS {
        uuid id PK
        uuid owner_id FK
        string first_name
        string last_name
        string email
        string phone
        string company
        string title
        enum status
        jsonb custom_fields
        timestamp created_at
        timestamp deleted_at
    }

    DEALS {
        uuid id PK
        uuid contact_id FK
        uuid owner_id FK
        string title
        text description
        decimal amount
        enum stage
        integer probability
        date expected_close_date
        timestamp created_at
        timestamp deleted_at
    }

    ACTIVITIES {
        uuid id PK
        uuid user_id FK
        uuid contact_id FK
        uuid deal_id FK
        enum type
        string subject
        text description
        enum status
        enum priority
        timestamp due_date
        integer duration_minutes
        timestamp created_at
    }
```

## 3. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant LoginPage
    participant SupabaseAuth
    participant Middleware
    participant Dashboard

    User->>Browser: Navigate to App
    Browser->>Middleware: Check Authentication

    alt Not Authenticated
        Middleware->>LoginPage: Redirect to /login
        LoginPage->>User: Show Login Form
        User->>LoginPage: Enter Credentials
        LoginPage->>SupabaseAuth: signInWithPassword()
        SupabaseAuth-->>LoginPage: Return Session
        LoginPage->>Dashboard: Redirect to /
    else Authenticated
        Middleware->>Dashboard: Allow Access
    end

    Dashboard-->>User: Display Dashboard
```

## 4. Contact Management Flow

```mermaid
flowchart TD
    Start([User Navigates to Contacts]) --> ContactsList[Display Contacts List]
    ContactsList --> Action{User Action?}

    Action -->|Create New| CreateForm[Navigate to /contacts/new]
    Action -->|View Details| ViewContact[Navigate to /contacts/:id]
    Action -->|Search/Filter| FilterContacts[Apply Filters]

    CreateForm --> FillForm[Fill Contact Form]
    FillForm --> ValidateContact{Validate Data}
    ValidateContact -->|Invalid| ShowErrors[Display Validation Errors]
    ValidateContact -->|Valid| CreateAction[Server Action: createContact]
    CreateAction --> SaveDB[(Save to Database)]
    SaveDB --> Success[Redirect to Contact Detail]

    ViewContact --> DisplayDetails[Show Contact Information]
    DisplayDetails --> DetailAction{User Action?}
    DetailAction -->|Edit| EditForm[Navigate to /contacts/:id/edit]
    DetailAction -->|Delete| DeleteConfirm{Confirm Delete?}
    DetailAction -->|Log Activity| ActivityForm[Navigate to /contacts/:id/activities/new]

    EditForm --> UpdateForm[Update Contact Form]
    UpdateForm --> UpdateValidate{Validate?}
    UpdateValidate -->|Valid| UpdateAction[Server Action: updateContact]
    UpdateAction --> UpdateDB[(Update Database)]
    UpdateDB --> BackToDetail[Return to Contact Detail]

    DeleteConfirm -->|Yes| SoftDelete[Soft Delete - Set deleted_at]
    SoftDelete --> RedirectList[Redirect to Contacts List]

    FilterContacts --> ContactsList
    ShowErrors --> FillForm

    style SaveDB fill:#10b981
    style UpdateDB fill:#10b981
```

## 5. Deal Pipeline Flow

```mermaid
flowchart LR
    subgraph Pipeline["Deal Pipeline Stages"]
        Lead[Lead<br/>Initial Contact]
        Proposal[Proposal<br/>Sent Offer]
        Negotiation[Negotiation<br/>Discussing Terms]
        Won[Closed Won<br/>Deal Success]
        Lost[Closed Lost<br/>Deal Failed]
    end

    Lead -->|Qualify| Proposal
    Lead -->|Disqualify| Lost
    Proposal -->|Accept| Negotiation
    Proposal -->|Reject| Lost
    Negotiation -->|Agreement| Won
    Negotiation -->|No Agreement| Lost

    style Lead fill:#3b82f6
    style Proposal fill:#8b5cf6
    style Negotiation fill:#f59e0b
    style Won fill:#10b981
    style Lost fill:#ef4444
```

## 6. Activity & Task Management Flow

```mermaid
stateDiagram-v2
    [*] --> Todo: Create Activity/Task

    Todo --> InProgress: Start Work
    Todo --> Cancelled: Cancel

    InProgress --> Completed: Finish
    InProgress --> Todo: Pause/Reset
    InProgress --> Cancelled: Cancel

    Completed --> [*]
    Cancelled --> [*]

    note right of Todo
        New tasks start here
        Priority: Low/Medium/High
    end note

    note right of Completed
        Task finished
        Visible in timeline
    end note
```

## 7. Complete User Journey - Create Deal with Activity

```mermaid
sequenceDiagram
    actor User
    participant UI as Dashboard
    participant DealsPage as Deals Page
    participant DealForm as Deal Form
    participant ServerAction as Server Actions
    participant DB as Database
    participant DealDetail as Deal Detail
    participant ActivityLog as Activity Timeline

    User->>UI: Click "Deals" in Navigation
    UI->>DealsPage: Navigate to /deals
    DealsPage->>DB: Fetch all deals (getUserDeals)
    DB-->>DealsPage: Return deals grouped by stage
    DealsPage-->>User: Display Kanban Board

    User->>DealsPage: Click "Create Deal"
    DealsPage->>DealForm: Navigate to /deals/new
    DealForm->>DB: Fetch contacts for dropdown
    DB-->>DealForm: Return contacts list
    DealForm-->>User: Display Form

    User->>DealForm: Fill in deal details
    User->>DealForm: Select contact
    User->>DealForm: Enter amount & probability
    User->>DealForm: Submit form

    DealForm->>ServerAction: createDeal(formData)
    ServerAction->>DB: INSERT into deals table
    DB-->>ServerAction: Return created deal
    ServerAction-->>DealForm: Success response
    DealForm->>DealDetail: Redirect to /deals/:id

    DealDetail->>DB: Fetch deal details + activities
    DB-->>DealDetail: Return deal & empty activities
    DealDetail-->>User: Show Deal Information

    User->>DealDetail: Click "+ Log Activity"
    DealDetail->>ActivityLog: Navigate to /deals/:id/activities/new
    ActivityLog-->>User: Display Activity Form

    User->>ActivityLog: Fill activity details
    User->>ActivityLog: Submit
    ActivityLog->>ServerAction: createActivity(formData)
    ServerAction->>DB: INSERT into activities table
    DB-->>ServerAction: Success
    ServerAction-->>ActivityLog: Redirect back
    ActivityLog->>DealDetail: Return to deal detail
    DealDetail-->>User: Show updated timeline
```

## 8. Permission & Role-Based Access Control

```mermaid
flowchart TD
    UserLogin[User Logs In] --> CheckRole{Check User Role}

    CheckRole -->|Admin| AdminAccess[Full Access]
    CheckRole -->|Regular User| UserAccess[Standard Access]

    AdminAccess --> AdminFeatures[Admin Features]
    AdminFeatures --> ViewAllData[View All Users' Data]
    AdminFeatures --> ManageUsers[Manage User Roles]
    AdminFeatures --> AdminDashboard[Access Admin Dashboard]
    AdminFeatures --> AllCRUD[Full CRUD Operations]

    UserAccess --> UserFeatures[User Features]
    UserFeatures --> ViewOwnData[View Own Data Only]
    UserFeatures --> StandardCRUD[CRUD Own Records]
    UserFeatures --> NoAdminAccess[No Admin Panel]

    subgraph RLS["Row Level Security Policies"]
        OwnRecords[Can only access<br/>owner_id = current_user_id]
        AdminOverride[Admin can access<br/>all records]
    end

    ViewOwnData -.->|Enforced by| OwnRecords
    ViewAllData -.->|Enforced by| AdminOverride

    style AdminAccess fill:#8b5cf6
    style UserAccess fill:#3b82f6
    style RLS fill:#10b981
```

## 9. Dark Mode Implementation

```mermaid
flowchart LR
    User[User Action] --> Toggle[Click Theme Toggle]
    Toggle --> Provider[ThemeProvider Context]

    Provider --> GetCurrent{Current Theme?}
    GetCurrent -->|Light| SetDark[Set Dark Theme]
    GetCurrent -->|Dark| SetLight[Set Light Theme]

    SetDark --> UpdateDOM1[Add 'dark' class to HTML]
    SetLight --> UpdateDOM2[Remove 'dark' class from HTML]

    UpdateDOM1 --> SaveLocal1[Save to localStorage]
    UpdateDOM2 --> SaveLocal2[Save to localStorage]

    SaveLocal1 --> ApplyStyles1[Apply dark: prefixed styles]
    SaveLocal2 --> ApplyStyles2[Apply standard styles]

    subgraph InitialLoad["On Page Load"]
        CheckStorage[Check localStorage] --> HasPreference{Has Saved Theme?}
        HasPreference -->|Yes| LoadSaved[Load Saved Theme]
        HasPreference -->|No| UseSystem[Use System Preference]
    end

    style SetDark fill:#1f2937
    style SetLight fill:#f3f4f6
```

## 10. Tech Stack Overview

```mermaid
mindmap
  root((CRM System))
    Frontend
      Next.js 15.5.6
        App Router
        Server Components
        Client Components
      React 19.2.0
      TypeScript
      Tailwind CSS v4
        Dark Mode Support
        Responsive Design
    Backend
      Next.js Server Actions
      Supabase
        Authentication
        PostgreSQL Database
        Row Level Security
        Real-time capabilities
    Features
      Contact Management
        CRUD Operations
        Custom Fields
        Soft Delete
      Deal Pipeline
        Kanban Board
        5 Stages
        Visual Charts
      Activity Logging
        Timeline View
        Multiple Types
        Linked to Contacts/Deals
      Task Management
        Kanban Board
        Priority & Status
        Due Dates
      Admin Dashboard
        User Management
        Role Assignment
        System Stats
    UI/UX
      Dark Mode
        Theme Toggle
        Persistent Preference
      Navigation
        Sticky Nav Bar
        Quick Links
        Back to Home
      Charts
        Recharts Library
        Bar Charts
        Donut Charts
```

---

## Quick Navigation Map

```mermaid
graph LR
    Home[Home - Dashboard<br/>/] --> Contacts[Contacts<br/>/contacts]
    Home --> Deals[Deals<br/>/deals]
    Home --> Tasks[Tasks<br/>/tasks]
    Home --> Admin[Admin<br/>/admin]

    Contacts --> NewContact[New Contact<br/>/contacts/new]
    Contacts --> ContactDetail[Contact Detail<br/>/contacts/:id]
    ContactDetail --> EditContact[Edit Contact<br/>/contacts/:id/edit]
    ContactDetail --> LogContactActivity[Log Activity<br/>/contacts/:id/activities/new]

    Deals --> NewDeal[New Deal<br/>/deals/new]
    Deals --> DealDetail[Deal Detail<br/>/deals/:id]
    DealDetail --> EditDeal[Edit Deal<br/>/deals/:id/edit]
    DealDetail --> LogDealActivity[Log Activity<br/>/deals/:id/activities/new]

    Tasks --> TaskKanban[Task Kanban Board<br/>4 Columns]

    Admin --> UserManagement[User Management<br/>View All Users]

    style Home fill:#3b82f6
    style Contacts fill:#10b981
    style Deals fill:#f59e0b
    style Tasks fill:#8b5cf6
    style Admin fill:#ef4444
```
