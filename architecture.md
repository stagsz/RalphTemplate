# HazOp Assistant Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **HazOp Assistant**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

#### N/A - Greenfield Project

The HazOp Assistant is a greenfield industrial safety analysis system requiring custom P&ID processing, specialized HazOps methodology implementation, and regulatory compliance features not available in standard templates. While we could consider fullstack starters like T3 Stack (Next.js + tRPC + Prisma), the specialized industrial requirements and need for custom P&ID visualization justify a ground-up architectural approach.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-02 | 1.0 | Initial architecture creation | Winston (Architect Agent) |

## High Level Architecture

### Technical Summary

The HazOp Assistant employs a **hybrid monolithic-microservice architecture** deployed using **Docker Compose**, combining a React/TypeScript frontend with a Node.js/Express backend core and specialized microservices for compute-intensive operations. The system integrates P&ID processing, systematic HazOps analysis workflows, risk assessment calculations, and professional report generation into a unified platform optimized for industrial safety engineering workflows with containerized deployment for portability and scalability.

### Platform and Infrastructure Choice

**Platform:** Docker Compose (Local Development & Production)
**Key Services:** Docker containers for all services, PostgreSQL, MinIO (S3-compatible storage), Redis, Local file storage
**Deployment Host:** Local Docker environment or any Docker-compatible host (cloud-agnostic)

### Repository Structure

**Structure:** Monorepo with integrated fullstack organization  
**Monorepo Tool:** Nx for enterprise-grade tooling with advanced caching and distributed execution  
**Package Organization:** Apps (web, api) + Shared packages (types, utils, ui-components) + Infrastructure as Code

### High Level Architecture Diagram

```mermaid
graph TB
    User[Safety Engineer] --> WebApp[React Web Application<br/>Docker Container]
    WebApp --> Nginx[Nginx Reverse Proxy<br/>Docker Container]
    Nginx --> API[Express.js API Gateway<br/>Docker Container]

    API --> Auth[JWT Authentication]
    API --> Core[Core HazOps Service]
    API --> PID[P&ID Processing Service<br/>Docker Container]
    API --> Risk[Risk Assessment Service]
    API --> Report[Report Generation Service<br/>Docker Container]

    Core --> DB[(PostgreSQL Database<br/>Docker Container)]
    PID --> Storage[MinIO S3 Storage<br/>Docker Container]
    Risk --> Cache[Redis Cache<br/>Docker Container]
    Report --> Office[Office Integration APIs]

    API --> Compliance[Regulatory DB Service]
    Compliance --> RegDB[(Compliance Database)]

    PID --> ML[Local ML Processing]
    Report --> Queue[RabbitMQ Queue<br/>Docker Container]
```

### Architectural Patterns

- **Jamstack with API Gateway:** Static React frontend with centralized API access through Express gateway - _Rationale:_ Optimal performance for P&ID visualization while maintaining secure API access for sensitive industrial data
- **Domain-Driven Design (DDD):** Organized around HazOps methodology domains (Analysis, Risk, Compliance, Reporting) - _Rationale:_ Aligns codebase structure with industrial safety engineering practices and regulatory frameworks
- **Microservice Architecture for Specialized Operations:** Dedicated services for P&ID processing and report generation - _Rationale:_ Enables independent scaling of compute-intensive operations while maintaining monolithic simplicity for core workflow
- **Repository Pattern with Unit of Work:** Abstract data access with transaction management - _Rationale:_ Ensures data integrity for audit trails required by industrial safety regulations
- **Event-Driven Architecture for Async Operations:** RabbitMQ for long-running P&ID analysis and report generation - _Rationale:_ Prevents UI blocking during complex industrial diagram processing
- **Layered Security Architecture:** Defense in depth with API Gateway, service-to-service authentication, and data encryption - _Rationale:_ Meets stringent industrial security requirements for proprietary plant information

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe React development | Essential for safety-critical calculations and complex state management in industrial applications |
| Frontend Framework | React | 18.2+ | Component-based UI development | Mature ecosystem with excellent Canvas/SVG libraries for P&ID visualization |
| UI Component Library | Mantine | 7.x | Professional component library | Industrial design patterns, accessibility compliance, and data table components |
| State Management | Zustand | 4.4+ | Lightweight state management | Simplified state management for complex HazOps analysis workflows |
| Backend Language | Node.js | 20.x LTS | Server-side JavaScript | Unified TypeScript across stack, excellent ecosystem for document processing |
| Backend Framework | Express.js | 4.18+ | Web application framework | Mature, flexible framework with extensive middleware ecosystem |
| API Style | RESTful | OpenAPI 3.0 | HTTP-based API design | Industry standard with excellent tooling for documentation and client generation |
| Database | PostgreSQL | 15+ | Primary data storage | ACID compliance for audit trails, excellent JSON support for flexible schemas |
| Cache | Redis | 7.x | Session and data caching | High performance caching for analysis states and user sessions |
| File Storage | MinIO | Latest | P&ID and document storage | S3-compatible object storage running in Docker container |
| Authentication | JWT + Passport.js | Latest | Token-based authentication | Secure, stateless authentication with refresh tokens |
| Frontend Testing | Vitest + React Testing Library | Latest | Unit and component testing | Fast test execution with excellent React integration |
| Backend Testing | Jest + Supertest | Latest | API and unit testing | Comprehensive testing framework with API testing capabilities |
| E2E Testing | Playwright | Latest | End-to-end testing | Reliable cross-browser testing for complex workflows |
| Build Tool | Vite | 5.x | Frontend build tooling | Fast development builds with excellent TypeScript support |
| Bundler | Rollup (via Vite) | Latest | Production bundling | Optimal bundle sizes for industrial application deployment |
| IaC Tool | Docker Compose | Latest | Container orchestration | Simple, declarative multi-container deployment |
| CI/CD | GitHub Actions | Latest | Continuous integration/deployment | Cloud-agnostic CI/CD with Docker support |
| Monitoring | Prometheus + Grafana | Latest | Application performance monitoring | Open-source monitoring stack running in Docker |
| Logging | Winston + Loki | Latest | Structured logging | Cloud-native logging with Grafana integration |
| Message Queue | RabbitMQ | Latest | Async message processing | Reliable message broker for long-running tasks |
| Reverse Proxy | Nginx | Latest | Load balancing & routing | High-performance reverse proxy in Docker |
| CSS Framework | Tailwind CSS | 3.x | Utility-first styling | Rapid UI development with consistent design system |

## Data Models

### User

**Purpose:** Represents safety engineers and stakeholders who conduct and review HazOps analyses

**Key Attributes:**
- id: string - Unique user identifier  
- email: string - User's email address for authentication
- name: string - Full display name
- role: UserRole - User's role (Engineer, Reviewer, Administrator)
- organization: string - Company or department affiliation
- createdAt: Date - Account creation timestamp
- lastLoginAt: Date - Last authentication timestamp

#### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

enum UserRole {
  ENGINEER = 'engineer',
  REVIEWER = 'reviewer', 
  ADMINISTRATOR = 'administrator'
}
```

#### Relationships
- One-to-many with Project (user can own multiple projects)
- Many-to-many with Project (user can collaborate on multiple projects)

### Project

**Purpose:** Container for HazOps analysis activities, representing a specific industrial system or plant area being studied

**Key Attributes:**
- id: string - Unique project identifier
- name: string - Descriptive project name
- description: string - Detailed project description
- ownerId: string - Primary project owner
- status: ProjectStatus - Current project state
- createdAt: Date - Project creation timestamp
- updatedAt: Date - Last modification timestamp

#### TypeScript Interface
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  REVIEW = 'review',
  COMPLETED = 'completed'
}
```

#### Relationships
- Many-to-one with User (owner)
- One-to-many with PIDDocument
- One-to-many with AnalysisSession

### PIDDocument

**Purpose:** Represents uploaded P&ID diagrams that serve as the basis for node identification and analysis

**Key Attributes:**
- id: string - Unique document identifier
- projectId: string - Associated project
- filename: string - Original filename
- fileUrl: string - Azure Blob Storage URL
- fileSize: number - File size in bytes
- uploadedAt: Date - Upload timestamp
- processedAt: Date - P&ID processing completion timestamp

#### TypeScript Interface
```typescript
interface PIDDocument {
  id: string;
  projectId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  processedAt: Date | null;
}
```

#### Relationships
- Many-to-one with Project
- One-to-many with AnalysisNode

### AnalysisNode

**Purpose:** Represents specific points on P&ID diagrams where HazOps analysis is conducted

**Key Attributes:**
- id: string - Unique node identifier
- pidDocumentId: string - Associated P&ID document
- nodeId: string - Human-readable node identifier (e.g., "V-101")
- description: string - Node description
- equipmentType: EquipmentType - Type of equipment/system
- xPosition: number - X coordinate on P&ID
- yPosition: number - Y coordinate on P&ID

#### TypeScript Interface
```typescript
interface AnalysisNode {
  id: string;
  pidDocumentId: string;
  nodeId: string;
  description: string;
  equipmentType: EquipmentType;
  xPosition: number;
  yPosition: number;
}

enum EquipmentType {
  VESSEL = 'vessel',
  PUMP = 'pump',
  VALVE = 'valve',
  PIPE = 'pipe',
  INSTRUMENT = 'instrument',
  CONTROL = 'control'
}
```

#### Relationships
- Many-to-one with PIDDocument
- One-to-many with HazopsAnalysis

### HazopsAnalysis

**Purpose:** Core entity representing individual HazOps analysis records following the guide word methodology

**Key Attributes:**
- id: string - Unique analysis identifier
- nodeId: string - Associated analysis node
- guideWord: GuideWord - Applied guide word
- deviation: string - Identified deviation
- causes: string[] - Potential causes
- consequences: string[] - Potential consequences  
- safeguards: string[] - Existing safeguards
- recommendations: string[] - Proposed recommendations
- riskRanking: RiskRanking - Calculated risk assessment

#### TypeScript Interface
```typescript
interface HazopsAnalysis {
  id: string;
  nodeId: string;
  guideWord: GuideWord;
  deviation: string;
  causes: string[];
  consequences: string[];
  safeguards: string[];
  recommendations: string[];
  riskRanking: RiskRanking;
  createdAt: Date;
  updatedAt: Date;
}

enum GuideWord {
  NO = 'no',
  MORE = 'more', 
  LESS = 'less',
  REVERSE = 'reverse',
  EARLY = 'early',
  LATE = 'late',
  OTHER_THAN = 'other_than'
}

interface RiskRanking {
  severity: number;
  likelihood: number;
  detectability: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
```

#### Relationships
- Many-to-one with AnalysisNode
- One-to-many with ComplianceCheck

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: HazOp Assistant API
  version: 1.0.0
  description: RESTful API for industrial safety analysis and HazOps methodology automation
servers:
  - url: https://api.hazop-assistant.com/v1
    description: Production API server
  - url: https://staging-api.hazop-assistant.com/v1
    description: Staging API server

paths:
  # Authentication endpoints
  /auth/login:
    post:
      summary: User authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  # User management
  /users/profile:
    get:
      summary: Get current user profile
      security:
        - BearerAuth: []
      responses:
        '200':
          description: User profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  # Project management endpoints
  /projects:
    get:
      summary: List user projects
      security:
        - BearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/ProjectStatus'
      responses:
        '200':
          description: Projects retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Project'
    post:
      summary: Create new project
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
      responses:
        '201':
          description: Project created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'

  /projects/{projectId}:
    get:
      summary: Get project details
      security:
        - BearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Project retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'

  # P&ID document endpoints
  /projects/{projectId}/documents:
    post:
      summary: Upload P&ID document
      security:
        - BearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '201':
          description: Document uploaded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PIDDocument'

  /projects/{projectId}/documents/{documentId}/nodes:
    get:
      summary: Get analysis nodes for document
      security:
        - BearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
        - name: documentId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Nodes retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/AnalysisNode'
    post:
      summary: Create analysis node
      security:
        - BearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
        - name: documentId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateNodeRequest'
      responses:
        '201':
          description: Node created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AnalysisNode'

  # HazOps analysis endpoints
  /nodes/{nodeId}/analyses:
    get:
      summary: Get HazOps analyses for node
      security:
        - BearerAuth: []
      parameters:
        - name: nodeId
          in: path
          required: true
          schema:
            type: string
        - name: guideWord
          in: query
          schema:
            $ref: '#/components/schemas/GuideWord'
      responses:
        '200':
          description: Analyses retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/HazopsAnalysis'
    post:
      summary: Create HazOps analysis
      security:
        - BearerAuth: []
      parameters:
        - name: nodeId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAnalysisRequest'
      responses:
        '201':
          description: Analysis created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HazopsAnalysis'

  # Risk assessment endpoints
  /analyses/{analysisId}/risk:
    put:
      summary: Update risk ranking
      security:
        - BearerAuth: []
      parameters:
        - name: analysisId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RiskRanking'
      responses:
        '200':
          description: Risk ranking updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HazopsAnalysis'

  # Compliance endpoints
  /projects/{projectId}/compliance:
    get:
      summary: Get compliance status
      security:
        - BearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
        - name: standard
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Compliance status retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ComplianceReport'

  # Report generation endpoints
  /projects/{projectId}/reports:
    post:
      summary: Generate project report
      security:
        - BearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReportRequest'
      responses:
        '202':
          description: Report generation started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReportJob'

  /reports/{jobId}/status:
    get:
      summary: Check report generation status
      security:
        - BearerAuth: []
      parameters:
        - name: jobId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Job status retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReportJob'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'
        organization:
          type: string
        createdAt:
          type: string
          format: date-time
        lastLoginAt:
          type: string
          format: date-time
          nullable: true

    UserRole:
      type: string
      enum: [engineer, reviewer, administrator]

    Project:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        ownerId:
          type: string
        status:
          $ref: '#/components/schemas/ProjectStatus'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    ProjectStatus:
      type: string
      enum: [draft, active, review, completed]

    AnalysisNode:
      type: object
      properties:
        id:
          type: string
        pidDocumentId:
          type: string
        nodeId:
          type: string
        description:
          type: string
        equipmentType:
          $ref: '#/components/schemas/EquipmentType'
        xPosition:
          type: number
        yPosition:
          type: number

    EquipmentType:
      type: string
      enum: [vessel, pump, valve, pipe, instrument, control]

    HazopsAnalysis:
      type: object
      properties:
        id:
          type: string
        nodeId:
          type: string
        guideWord:
          $ref: '#/components/schemas/GuideWord'
        deviation:
          type: string
        causes:
          type: array
          items:
            type: string
        consequences:
          type: array
          items:
            type: string
        safeguards:
          type: array
          items:
            type: string
        recommendations:
          type: array
          items:
            type: string
        riskRanking:
          $ref: '#/components/schemas/RiskRanking'

    GuideWord:
      type: string
      enum: [no, more, less, reverse, early, late, other_than]

    RiskRanking:
      type: object
      properties:
        severity:
          type: number
          minimum: 1
          maximum: 5
        likelihood:
          type: number
          minimum: 1
          maximum: 5
        detectability:
          type: number
          minimum: 1
          maximum: 5
        riskScore:
          type: number
        riskLevel:
          $ref: '#/components/schemas/RiskLevel'

    RiskLevel:
      type: string
      enum: [low, medium, high]

    CreateProjectRequest:
      type: object
      required:
        - name
        - description
      properties:
        name:
          type: string
        description:
          type: string

    CreateNodeRequest:
      type: object
      required:
        - nodeId
        - description
        - equipmentType
        - xPosition
        - yPosition
      properties:
        nodeId:
          type: string
        description:
          type: string
        equipmentType:
          $ref: '#/components/schemas/EquipmentType'
        xPosition:
          type: number
        yPosition:
          type: number

    ReportRequest:
      type: object
      required:
        - format
        - template
      properties:
        format:
          type: string
          enum: [pdf, word, excel, powerpoint]
        template:
          type: string
        includeRiskMatrix:
          type: boolean
        includeCompliance:
          type: boolean
```

## External APIs

Based on the PRD requirements and component design analysis, the HazOp Assistant requires several external API integrations for enhanced functionality:

### Email Service API
- **Purpose:** Automated notifications for analysis completion, team invitations, and system alerts
- **Documentation:** Provider-specific (SendGrid, AWS SES, or Azure Communication Services)
- **Base URL(s):** `https://api.sendgrid.com/v3/` (example for SendGrid)
- **Authentication:** API Key-based authentication
- **Rate Limits:** Varies by provider (typically 100-1000 emails/hour for free tiers)

**Key Endpoints Used:**
- `POST /mail/send` - Send transactional emails for notifications
- `GET /templates` - Retrieve email templates for consistent branding
- `POST /contactdb/recipients` - Manage email recipient lists

**Integration Notes:** Priority integration for user notifications. Email templates will include analysis completion, invitation confirmations, and system maintenance alerts.

### JWT Authentication (Local)
- **Purpose:** Secure, stateless authentication for all API endpoints
- **Library:** jsonwebtoken + Passport.js
- **Token Type:** Access tokens (15min) + Refresh tokens (7 days)
- **Algorithm:** RS256 (RSA Signature with SHA-256)
- **Storage:** Access tokens in memory, refresh tokens in httpOnly cookies

**Authentication Flow:**
1. `POST /api/auth/login` - User login with credentials, returns access + refresh tokens
2. `POST /api/auth/refresh` - Exchange refresh token for new access token
3. `POST /api/auth/logout` - Invalidate refresh token
4. All API requests include `Authorization: Bearer <access_token>` header

**Token Payload:**
```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

**Integration Notes:** Fully self-contained authentication without external dependencies. Supports role-based access control (RBAC) for engineers, reviewers, and administrators.

### File Processing Enhancement (Future Consideration)
- **Purpose:** Advanced P&ID analysis using computer vision and AI-powered component recognition
- **Technology:** Tesseract OCR + TensorFlow.js (running locally in Docker)
- **Deployment:** Docker container with Python/Node.js hybrid service
- **Performance:** Fully local processing, no cloud API costs

**Processing Pipeline:**
1. **OCR Processing** - Tesseract for extracting equipment labels and text
2. **Symbol Detection** - Custom TensorFlow model for detecting equipment symbols
3. **Connection Analysis** - OpenCV for detecting pipes and connection points
4. **Node Extraction** - Automated identification of analysis points

**Docker Service:**
```yaml
services:
  pid-processor:
    build: ./services/pid-processor
    environment:
      - TESSERACT_LANG=eng
      - MODEL_PATH=/models/pid-detector.h5
    volumes:
      - ./models:/models:ro
      - ./uploads:/uploads
```

**Integration Notes:** Phase 2 enhancement to automate P&ID component recognition. Runs entirely in local Docker environment without cloud dependencies. Would significantly improve user experience by auto-populating analysis nodes.

### Regulatory Database APIs (Future Enhancement)
- **Purpose:** Integration with industry-specific regulatory databases for compliance checking
- **Documentation:** Provider-dependent (OSHA, HSE, industry-specific databases)
- **Base URL(s):** TBD based on regulatory authority
- **Authentication:** Varies by authority (API keys, certificates, or OAuth)
- **Rate Limits:** Highly variable based on government or industry body policies

**Key Endpoints Used:**
- `GET /regulations` - Retrieve applicable regulations for specific industries
- `GET /standards` - Access relevant safety standards and guidelines
- `POST /compliance-check` - Validate analysis against regulatory requirements

**Integration Notes:** Long-term enhancement for automated compliance validation. Would require partnerships with regulatory bodies or third-party compliance services.

### External APIs Decision Summary
**Immediate Implementation Priority:**
1. **Email Service API** - Essential for user engagement and system notifications
2. **JWT Authentication** - Secure, self-contained authentication system

**Future Phase Implementation:**
3. **Computer Vision APIs** - Significant UX improvement for P&ID processing
4. **Regulatory APIs** - Advanced compliance features for specialized markets

**No External APIs for Core Functionality:** The HazOp Assistant core analysis engine is deliberately self-contained to ensure reliability and security in safety-critical applications. All hazard analysis calculations and methodology enforcement are implemented internally.

## Core Workflows

The following sequence diagrams illustrate key system workflows based on the critical user journeys identified in our PRD:

### Workflow 1: P&ID Upload and Initial Analysis Setup

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Gateway
    participant PID as P&ID Service
    participant DB as Database
    participant Storage as Azure Blob
    participant WS as WebSocket

    U->>FE: Upload P&ID file
    FE->>API: POST /api/projects/{id}/pids (file upload)
    API->>PID: Process P&ID file
    PID->>Storage: Store original file
    Storage-->>PID: File URL
    PID->>PID: Extract nodes and connections
    PID->>DB: Save P&ID metadata
    PID->>DB: Save detected nodes
    DB-->>PID: Success
    PID-->>API: Processing complete
    API->>WS: Emit "pid_processed" event
    WS->>FE: Real-time update
    FE->>U: Display interactive P&ID viewer

    Note over U,Storage: Error Handling
    alt File processing fails
        PID-->>API: Processing error
        API-->>FE: Error response
        FE->>U: Show error message
        U->>FE: Retry or upload different file
    end

    Note over U,Storage: Async Operations
    rect rgb(240, 240, 240)
        Note over PID: File processing happens asynchronously
        Note over WS: Real-time updates keep user informed
    end
```

### Workflow 2: HazOp Analysis Node Creation and Risk Assessment

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Gateway
    participant HE as HazOp Engine
    participant DB as Database
    participant NS as Notification Service

    U->>FE: Select P&ID node for analysis
    FE->>API: POST /api/analyses (create analysis)
    API->>HE: Initialize analysis session
    HE->>DB: Create analysis record
    DB-->>HE: Analysis ID
    
    loop For each guideword
        U->>FE: Enter deviation and parameters
        FE->>API: PUT /api/analyses/{id}/nodes/{nodeId}
        API->>HE: Process guideword analysis
        HE->>HE: Calculate risk rating
        HE->>HE: Apply risk matrix logic
        HE->>DB: Save analysis node
        DB-->>HE: Success
        HE-->>API: Updated risk assessment
        API-->>FE: Real-time analysis update
        FE->>U: Display updated risk matrix
    end

    U->>FE: Complete analysis session
    FE->>API: POST /api/analyses/{id}/complete
    API->>HE: Finalize analysis
    HE->>DB: Update analysis status
    HE->>NS: Send completion notification
    NS->>NS: Send email to team members
    HE-->>API: Analysis completed
    API-->>FE: Success response
    FE->>U: Show completion confirmation

    Note over U,NS: Error Handling
    alt Risk calculation fails
        HE-->>API: Calculation error
        API-->>FE: Error with details
        FE->>U: Show validation errors
        U->>FE: Correct inputs and retry
    end
```

### Workflow 3: Collaborative Real-time Analysis

```mermaid
sequenceDiagram
    participant U1 as User 1 (Lead)
    participant U2 as User 2 (Team Member)
    participant FE1 as Frontend 1
    participant FE2 as Frontend 2
    participant API as API Gateway
    participant HE as HazOp Engine
    participant WS as WebSocket
    participant DB as Database

    U1->>FE1: Start collaborative session
    FE1->>API: POST /api/analyses/{id}/collaborate
    API->>WS: Create collaboration room
    WS-->>FE1: Room created
    
    U1->>FE1: Invite team member
    FE1->>API: POST /api/analyses/{id}/invite
    API->>API: Send invitation email
    
    U2->>FE2: Join via invitation link
    FE2->>API: GET /api/analyses/{id}/join
    API->>WS: Add user to room
    WS->>FE1: User joined notification
    WS->>FE2: Session state sync
    
    par Concurrent Analysis
        U1->>FE1: Modify node analysis
        FE1->>API: PUT /api/analyses/{id}/nodes/{nodeId}
        API->>HE: Process changes
        HE->>DB: Save changes
        API->>WS: Broadcast changes
        WS->>FE2: Real-time update
        FE2->>U2: Show live changes
    and
        U2->>FE2: Add comment to node
        FE2->>API: POST /api/analyses/{id}/comments
        API->>DB: Save comment
        API->>WS: Broadcast comment
        WS->>FE1: Real-time comment
        FE1->>U1: Show new comment
    end

    Note over U1,DB: Conflict Resolution
    alt Concurrent edits detected
        API->>WS: Emit conflict warning
        WS->>FE1: Show conflict indicator
        WS->>FE2: Show conflict indicator
        U1->>FE1: Resolve conflict
        FE1->>API: Resolve with merge strategy
    end
```

### Workflow 4: Report Generation and Export

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Gateway
    participant HE as HazOp Engine
    participant RG as Report Generator
    participant DB as Database
    participant Storage as Azure Blob
    participant NS as Notification Service

    U->>FE: Request analysis report
    FE->>API: POST /api/reports/generate
    API->>RG: Initialize report generation
    RG->>DB: Fetch analysis data
    DB-->>RG: Complete analysis dataset
    RG->>RG: Apply report template
    RG->>RG: Generate visualizations
    RG->>RG: Create PDF/Word document
    RG->>Storage: Store generated report
    Storage-->>RG: Report URL
    RG->>DB: Save report metadata
    RG-->>API: Generation complete
    
    API->>NS: Send completion notification
    NS->>NS: Email report link to user
    API-->>FE: Report ready response
    FE->>U: Show download link

    U->>FE: Download report
    FE->>API: GET /api/reports/{reportId}/download
    API->>Storage: Fetch report file
    Storage-->>API: File stream
    API-->>FE: File download
    FE-->>U: Report file downloaded

    Note over U,Storage: Async Processing
    rect rgb(240, 240, 240)
        Note over RG: Large reports generated asynchronously
        Note over NS: User notified when ready
        Note over Storage: Reports cached for future downloads
    end

    Note over U,Storage: Error Handling
    alt Report generation fails
        RG-->>API: Generation error
        API->>NS: Send error notification
        NS->>NS: Email error details to user
        API-->>FE: Error response
        FE->>U: Show error with retry option
    end
```

### Workflow Integration Summary

**Cross-cutting Concerns Handled:**
- **Authentication:** JWT tokens validated at API Gateway for all requests
- **Real-time Updates:** WebSocket connections maintain live collaboration
- **Error Handling:** Comprehensive error paths with user-friendly messages
- **Async Operations:** Long-running tasks (file processing, report generation) handled asynchronously
- **Data Consistency:** Database transactions ensure consistency during complex operations
- **Audit Trail:** All analysis changes logged for compliance and review

## Database Schema

The following PostgreSQL schema definitions implement our conceptual data models with optimizations for performance, scalability, and data integrity:

### Core Entity Tables

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'analyst',
    organization VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Custom enum types
CREATE TYPE user_role AS ENUM ('admin', 'lead_analyst', 'analyst', 'viewer');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'review', 'completed', 'archived');
CREATE TYPE analysis_status AS ENUM ('draft', 'in_progress', 'completed', 'approved');
CREATE TYPE equipment_type AS ENUM ('pump', 'valve', 'reactor', 'heat_exchanger', 'pipe', 'tank', 'other');
CREATE TYPE severity_level AS ENUM ('negligible', 'minor', 'moderate', 'major', 'catastrophic');
CREATE TYPE likelihood_level AS ENUM ('rare', 'unlikely', 'possible', 'likely', 'almost_certain');

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100) NOT NULL,
    status project_status NOT NULL DEFAULT 'planning',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Project team members
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'analyst',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);
```

### P&ID and Document Management

```sql
-- P&ID Documents
CREATE TABLE pid_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    upload_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Analysis Nodes (equipment/components on P&ID)
CREATE TABLE analysis_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pid_document_id UUID NOT NULL REFERENCES pid_documents(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- Internal P&ID identifier
    description VARCHAR(500) NOT NULL,
    equipment_type equipment_type NOT NULL,
    x_position DECIMAL(10,2) NOT NULL,
    y_position DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pid_document_id, node_id)
);
```

### HazOp Analysis Core

```sql
-- HazOp Analysis Sessions
CREATE TABLE hazop_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pid_document_id UUID NOT NULL REFERENCES pid_documents(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status analysis_status NOT NULL DEFAULT 'draft',
    methodology VARCHAR(50) NOT NULL DEFAULT 'traditional',
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Individual analysis entries for each node/guideword combination
CREATE TABLE analysis_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazop_analysis_id UUID NOT NULL REFERENCES hazop_analyses(id) ON DELETE CASCADE,
    analysis_node_id UUID NOT NULL REFERENCES analysis_nodes(id) ON DELETE RESTRICT,
    guideword VARCHAR(50) NOT NULL,
    deviation TEXT NOT NULL,
    possible_causes TEXT,
    consequences TEXT,
    existing_safeguards TEXT,
    severity severity_level,
    likelihood likelihood_level,
    risk_rating INTEGER, -- Calculated field based on matrix
    recommendations TEXT,
    action_required BOOLEAN NOT NULL DEFAULT false,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Collaboration and Audit

```sql
-- Real-time collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazop_analysis_id UUID NOT NULL REFERENCES hazop_analyses(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Active participants in collaboration sessions
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, user_id)
);

-- Comments and discussions
CREATE TABLE analysis_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_entry_id UUID NOT NULL REFERENCES analysis_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail for all changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by_id UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255) -- For tracking user sessions
);
```

### Reports and Templates

```sql
-- Generated reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazop_analysis_id UUID NOT NULL REFERENCES hazop_analyses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL,
    template_used VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    generated_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parameters JSONB -- Store generation parameters
);

-- Report templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_path VARCHAR(500) NOT NULL,
    supported_formats TEXT[] NOT NULL, -- Array of supported output formats
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Optimization Indexes

```sql
-- Primary lookup indexes
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- P&ID and node indexes
CREATE INDEX idx_pid_documents_project ON pid_documents(project_id);
CREATE INDEX idx_analysis_nodes_pid ON analysis_nodes(pid_document_id);
CREATE INDEX idx_analysis_nodes_position ON analysis_nodes(x_position, y_position);

-- Analysis performance indexes
CREATE INDEX idx_hazop_analyses_project ON hazop_analyses(project_id);
CREATE INDEX idx_hazop_analyses_status ON hazop_analyses(status);
CREATE INDEX idx_analysis_entries_hazop ON analysis_entries(hazop_analysis_id);
CREATE INDEX idx_analysis_entries_node ON analysis_entries(analysis_node_id);
CREATE INDEX idx_analysis_entries_risk ON analysis_entries(risk_rating) WHERE risk_rating IS NOT NULL;

-- Collaboration indexes
CREATE INDEX idx_collaboration_sessions_analysis ON collaboration_sessions(hazop_analysis_id);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_analysis_comments_entry ON analysis_comments(analysis_entry_id);

-- Audit and reporting indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX idx_reports_analysis ON reports(hazop_analysis_id);
```

### Database Constraints and Business Rules

```sql
-- Check constraints for data validity
ALTER TABLE analysis_entries ADD CONSTRAINT check_risk_rating 
    CHECK (risk_rating IS NULL OR (risk_rating >= 1 AND risk_rating <= 25));

ALTER TABLE analysis_entries ADD CONSTRAINT check_severity_likelihood_risk 
    CHECK (
        (severity IS NULL AND likelihood IS NULL AND risk_rating IS NULL) OR
        (severity IS NOT NULL AND likelihood IS NOT NULL AND risk_rating IS NOT NULL)
    );

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hazop_analyses_updated_at BEFORE UPDATE ON hazop_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_entries_updated_at BEFORE UPDATE ON analysis_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Database Schema Summary

**Design Principles Applied:**
- **Normalization:** 3NF compliance with appropriate denormalization for performance
- **UUID Primary Keys:** Enable distributed system compatibility and avoid ID conflicts
- **Timestamp Tracking:** Comprehensive audit trails with timezone-aware timestamps
- **JSONB Flexibility:** Metadata and configuration stored as structured JSON for flexibility
- **Enum Types:** Strong typing for categorical data with database-level validation
- **Referential Integrity:** Foreign key constraints prevent orphaned data

**Performance Considerations:**
- **Strategic Indexing:** Multi-column indexes for common query patterns
- **Partial Indexes:** Conditional indexes for sparse data (e.g., risk_rating WHERE NOT NULL)
- **Query Optimization:** Index design supports both OLTP operations and analytical queries
- **Connection Pooling:** Schema supports horizontal scaling with connection pooling

**Security Features:**
- **Audit Logging:** Complete change tracking for compliance and security
- **Soft Deletes:** Critical records marked inactive rather than deleted
- **Role-Based Access:** Database-level user role enforcement
- **Data Encryption:** Schema prepared for column-level encryption of sensitive data

## Frontend Architecture

### Component Architecture

**Component Organization**

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── LoadingSpinner/
│   ├── forms/           # Form-specific components
│   │   ├── AnalysisForm/
│   │   ├── ProjectForm/
│   │   └── UserForm/
│   └── visualization/   # Data visualization components
│       ├── RiskMatrix/
│       ├── PIDViewer/
│       └── ReportChart/
├── pages/               # Route-level page components
│   ├── Dashboard/
│   ├── Projects/
│   ├── Analysis/
│   ├── Reports/
│   └── Settings/
├── layouts/             # Layout wrapper components
│   ├── MainLayout/
│   ├── AuthLayout/
│   └── AnalysisLayout/
├── hooks/               # Custom React hooks
│   ├── useAuth/
│   ├── useWebSocket/
│   ├── useAnalysis/
│   └── useDebounce/
├── services/            # API and external service integrations
│   ├── api/
│   ├── websocket/
│   └── storage/
├── store/               # State management
│   ├── auth/
│   ├── projects/
│   ├── analysis/
│   └── ui/
└── utils/               # Helper functions and constants
    ├── constants/
    ├── helpers/
    └── types/
```

**Component Template Pattern**

```typescript
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AnalysisNode, RiskRating } from '@/types/analysis';
import { analysisService } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface AnalysisNodeFormProps {
  nodeId: string;
  analysisId: string;
  onComplete?: (result: AnalysisNode) => void;
  isCollaborative?: boolean;
}

export const AnalysisNodeForm: React.FC<AnalysisNodeFormProps> = ({
  nodeId,
  analysisId,
  onComplete,
  isCollaborative = false
}) => {
  const [formData, setFormData] = useState<Partial<AnalysisNode>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Data fetching with React Query
  const { data: nodeData, isLoading, error } = useQuery({
    queryKey: ['analysisNode', nodeId],
    queryFn: () => analysisService.getAnalysisNode(nodeId),
    enabled: !!nodeId
  });

  // Real-time collaboration
  const { socket, isConnected } = useWebSocket({
    room: `analysis-${analysisId}`,
    enabled: isCollaborative
  });

  // Mutation for saving changes
  const updateNodeMutation = useMutation({
    mutationFn: analysisService.updateAnalysisNode,
    onSuccess: (result) => {
      onComplete?.(result);
      if (isCollaborative && socket) {
        socket.emit('nodeUpdated', { nodeId, data: result });
      }
    },
    onError: (error) => {
      console.error('Failed to update analysis node:', error);
    }
  });

  // Real-time updates from other users
  useEffect(() => {
    if (!socket || !isCollaborative) return;

    const handleRemoteUpdate = (data: { nodeId: string; data: AnalysisNode }) => {
      if (data.nodeId === nodeId) {
        setFormData(prev => ({ ...prev, ...data.data }));
      }
    };

    socket.on('nodeUpdated', handleRemoteUpdate);
    return () => socket.off('nodeUpdated', handleRemoteUpdate);
  }, [socket, nodeId, isCollaborative]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors = validateFormData(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    updateNodeMutation.mutate({
      id: nodeId,
      data: formData as AnalysisNode
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading analysis node</div>;

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit} className="analysis-node-form">
        {/* Form fields implementation */}
        <button type="submit" disabled={updateNodeMutation.isPending}>
          {updateNodeMutation.isPending ? 'Saving...' : 'Save Analysis'}
        </button>
        
        {isCollaborative && (
          <div className="collaboration-indicator">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        )}
      </form>
    </ErrorBoundary>
  );
};

// Helper functions
const validateFormData = (data: Partial<AnalysisNode>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!data.deviation?.trim()) {
    errors.deviation = 'Deviation description is required';
  }
  
  if (data.severity && data.likelihood && !data.riskRating) {
    errors.riskRating = 'Risk rating calculation failed';
  }
  
  return errors;
};

export default AnalysisNodeForm;
```

### State Management Architecture

**State Structure with Zustand**

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, Project, AnalysisSession } from '@/types';

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        
        login: async (email, password) => {
          try {
            const response = await authService.login(email, password);
            set({ 
              user: response.user, 
              token: response.token, 
              isAuthenticated: true 
            });
          } catch (error) {
            throw new Error('Login failed');
          }
        },
        
        logout: () => {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('auth-token');
        },
        
        refreshToken: async () => {
          const { token } = get();
          if (!token) return;
          
          try {
            const response = await authService.refreshToken(token);
            set({ token: response.token });
          } catch (error) {
            get().logout();
          }
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ token: state.token })
      }
    ),
    { name: 'auth-store' }
  )
);

// Analysis Store  
interface AnalysisState {
  currentSession: AnalysisSession | null;
  selectedNode: string | null;
  collaborators: User[];
  realTimeUpdates: Record<string, any>;
  setCurrentSession: (session: AnalysisSession) => void;
  selectNode: (nodeId: string) => void;
  updateAnalysisEntry: (nodeId: string, data: any) => void;
  addCollaborator: (user: User) => void;
  handleRealTimeUpdate: (nodeId: string, data: any) => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools((set, get) => ({
    currentSession: null,
    selectedNode: null,
    collaborators: [],
    realTimeUpdates: {},
    
    setCurrentSession: (session) => set({ currentSession: session }),
    
    selectNode: (nodeId) => set({ selectedNode: nodeId }),
    
    updateAnalysisEntry: (nodeId, data) => {
      const { currentSession } = get();
      if (!currentSession) return;
      
      set({
        currentSession: {
          ...currentSession,
          entries: currentSession.entries.map(entry =>
            entry.nodeId === nodeId ? { ...entry, ...data } : entry
          )
        }
      });
    },
    
    addCollaborator: (user) => {
      set(state => ({
        collaborators: [...state.collaborators.filter(c => c.id !== user.id), user]
      }));
    },
    
    handleRealTimeUpdate: (nodeId, data) => {
      set(state => ({
        realTimeUpdates: { ...state.realTimeUpdates, [nodeId]: data }
      }));
    }
  }), { name: 'analysis-store' })
);
```

**State Management Patterns**
- **Separation by Domain:** Auth, Projects, Analysis, UI each have dedicated stores
- **Optimistic Updates:** UI updates immediately, with rollback on API failure
- **Real-time Synchronization:** WebSocket updates merge with local state
- **Persistence Strategy:** Auth token persisted, analysis state ephemeral
- **Middleware Integration:** DevTools for debugging, persistence for critical data

### Routing Architecture

**Route Organization**

```
/                           # Landing page (public)
/login                      # Authentication (public)
/register                   # User registration (public)
/dashboard                  # Main dashboard (protected)
/projects                   # Projects list (protected)
/projects/:id               # Project details (protected)
/projects/:id/analysis      # Analysis workspace (protected)
/projects/:id/reports       # Reports management (protected)
/profile                    # User profile (protected)
/settings                   # Application settings (protected)
/admin                      # Admin panel (admin only)
```

**Protected Route Pattern**

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'lead_analyst' | 'analyst' | 'viewer';
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, token } = useAuthStore();
  const location = useLocation();

  // Show loading while checking authentication
  if (token && !user) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role) {
    const roleHierarchy = {
      'viewer': 1,
      'analyst': 2, 
      'lead_analyst': 3,
      'admin': 4
    };
    
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    
    if (userLevel < requiredLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Usage in router configuration
export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminPanel />
        </ProtectedRoute>
      } />
      
      <Route path="/projects/:id/analysis" element={
        <ProtectedRoute requiredRole="analyst">
          <AnalysisWorkspace />
        </ProtectedRoute>
      } />
    </Routes>
  </BrowserRouter>
);
```

### Frontend Services Layer

**API Client Setup**

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          try {
            await useAuthStore.getState().refreshToken();
            // Retry original request
            const originalRequest = error.config;
            const token = useAuthStore.getState().token;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(process.env.REACT_APP_API_BASE_URL || '');
```

**Service Example - Analysis Service**

```typescript
import { apiClient } from './apiClient';
import { 
  AnalysisSession, 
  AnalysisNode, 
  AnalysisEntry, 
  CreateAnalysisRequest,
  UpdateAnalysisEntryRequest 
} from '@/types/analysis';

export class AnalysisService {
  async getAnalysisByProject(projectId: string): Promise<AnalysisSession[]> {
    return apiClient.get(`/api/projects/${projectId}/analyses`);
  }

  async getAnalysisSession(id: string): Promise<AnalysisSession> {
    return apiClient.get(`/api/analyses/${id}`);
  }

  async createAnalysis(data: CreateAnalysisRequest): Promise<AnalysisSession> {
    return apiClient.post('/api/analyses', data);
  }

  async getAnalysisNode(nodeId: string): Promise<AnalysisNode> {
    return apiClient.get(`/api/analyses/nodes/${nodeId}`);
  }

  async updateAnalysisNode(data: UpdateAnalysisEntryRequest): Promise<AnalysisEntry> {
    return apiClient.put(`/api/analyses/entries/${data.id}`, data.data);
  }

  async deleteAnalysis(id: string): Promise<void> {
    return apiClient.delete(`/api/analyses/${id}`);
  }

  // Real-time collaboration methods
  async joinCollaborationSession(analysisId: string): Promise<string> {
    const response = await apiClient.post(`/api/analyses/${analysisId}/collaborate`);
    return response.sessionId;
  }

  async leaveCollaborationSession(analysisId: string): Promise<void> {
    return apiClient.delete(`/api/analyses/${analysisId}/collaborate`);
  }
}

export const analysisService = new AnalysisService();
```

### Frontend Architecture Summary

**Architecture Principles:**
- **Component Composition:** Reusable components with clear interfaces and single responsibilities
- **Type Safety:** Comprehensive TypeScript integration for compile-time error prevention
- **Performance Optimization:** React Query for caching, code splitting for bundle optimization
- **Real-time Capabilities:** WebSocket integration with state synchronization
- **Error Resilience:** Error boundaries and comprehensive error handling
- **Accessibility:** WCAG compliance built into component design patterns

## Backend Architecture

### Service Architecture

**Controller/Route Organization**

```
src/
├── controllers/          # HTTP request handlers
│   ├── auth.controller.ts
│   ├── projects.controller.ts
│   ├── analyses.controller.ts
│   ├── pids.controller.ts
│   ├── reports.controller.ts
│   └── users.controller.ts
├── services/            # Business logic layer
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── analysis.service.ts
│   ├── pid-processing.service.ts
│   ├── report.service.ts
│   ├── notification.service.ts
│   └── collaboration.service.ts
├── repositories/        # Data access layer
│   ├── base.repository.ts
│   ├── user.repository.ts
│   ├── project.repository.ts
│   ├── analysis.repository.ts
│   └── audit.repository.ts
├── middleware/          # Express middleware
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   ├── logging.middleware.ts
│   └── rate-limit.middleware.ts
├── routes/              # Route definitions
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── projects.routes.ts
│   ├── analyses.routes.ts
│   └── reports.routes.ts
├── websocket/           # WebSocket handlers
│   ├── collaboration.handler.ts
│   ├── analysis.handler.ts
│   └── notifications.handler.ts
├── utils/               # Utility functions
│   ├── logger.ts
│   ├── validation.ts
│   ├── encryption.ts
│   └── risk-calculator.ts
├── config/              # Configuration files
│   ├── database.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── websocket.ts
└── types/               # TypeScript type definitions
    ├── auth.types.ts
    ├── analysis.types.ts
    ├── project.types.ts
    └── common.types.ts
```

**Controller Template Pattern**

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AnalysisService } from '../services/analysis.service';
import { CollaborationService } from '../services/collaboration.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { CreateAnalysisRequest, UpdateAnalysisRequest } from '../types/analysis.types';
import { logger } from '../utils/logger';

export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private collaborationService: CollaborationService,
    private auditService: AuditService
  ) {}

  async createAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { projectId } = req.params;
      const analysisData = req.body as CreateAnalysisRequest;
      const userId = req.user.id;

      // Authorization check
      const hasAccess = await this.analysisService.canUserAccessProject(userId, projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to project'
        });
      }

      // Business logic
      const analysis = await this.analysisService.createAnalysis({
        ...analysisData,
        projectId,
        createdById: userId
      });

      // Audit logging
      await this.auditService.logActivity({
        userId,
        action: 'CREATE_ANALYSIS',
        resourceType: 'analysis',
        resourceId: analysis.id,
        metadata: { projectId }
      });

      logger.info(`Analysis created: ${analysis.id}`, {
        userId,
        projectId,
        analysisId: analysis.id
      });

      res.status(201).json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('Error creating analysis', {
        error: error.message,
        userId: req.user?.id,
        projectId: req.params.projectId
      });
      next(error);
    }
  }

  async updateAnalysisEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { entryId } = req.params;
      const updateData = req.body as UpdateAnalysisRequest;
      const userId = req.user.id;

      // Get existing entry for authorization
      const existingEntry = await this.analysisService.getAnalysisEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          message: 'Analysis entry not found'
        });
      }

      // Check user permissions
      const hasAccess = await this.analysisService.canUserEditAnalysis(
        userId, 
        existingEntry.hazopAnalysisId
      );
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to modify this analysis'
        });
      }

      // Update with optimistic locking
      const updatedEntry = await this.analysisService.updateAnalysisEntry(
        entryId, 
        updateData, 
        userId
      );

      // Real-time collaboration notification
      await this.collaborationService.broadcastUpdate(
        existingEntry.hazopAnalysisId,
        {
          type: 'ENTRY_UPDATED',
          entryId,
          data: updatedEntry,
          updatedBy: req.user
        }
      );

      // Audit trail
      await this.auditService.logActivity({
        userId,
        action: 'UPDATE_ANALYSIS_ENTRY',
        resourceType: 'analysis_entry',
        resourceId: entryId,
        oldValues: existingEntry,
        newValues: updatedEntry
      });

      res.json({
        success: true,
        data: updatedEntry
      });

    } catch (error) {
      if (error.name === 'OptimisticLockError') {
        return res.status(409).json({
          success: false,
          message: 'Analysis entry was modified by another user. Please refresh and try again.',
          code: 'CONFLICT'
        });
      }
      next(error);
    }
  }

  async generateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { analysisId } = req.params;
      const { format, template, options } = req.body;
      const userId = req.user.id;

      // Authorization
      const hasAccess = await this.analysisService.canUserViewAnalysis(userId, analysisId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to analysis'
        });
      }

      // Initiate async report generation
      const reportJob = await this.analysisService.generateReport({
        analysisId,
        format,
        template,
        options,
        requestedBy: userId
      });

      // Return job ID for client to track progress
      res.status(202).json({
        success: true,
        message: 'Report generation started',
        data: {
          jobId: reportJob.id,
          estimatedTime: reportJob.estimatedDuration,
          status: 'processing'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}
```

### Database Architecture

**Repository Pattern Implementation**

```typescript
import { Pool, PoolClient } from 'pg';
import { 
  AnalysisEntry, 
  CreateAnalysisEntryRequest, 
  UpdateAnalysisEntryRequest,
  AnalysisEntryFilters 
} from '../types/analysis.types';
import { BaseRepository } from './base.repository';
import { DatabaseError, NotFoundError } from '../utils/errors';

export class AnalysisRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async createAnalysisEntry(
    data: CreateAnalysisEntryRequest,
    client?: PoolClient
  ): Promise<AnalysisEntry> {
    const query = `
      INSERT INTO analysis_entries (
        hazop_analysis_id, analysis_node_id, guideword, deviation,
        possible_causes, consequences, existing_safeguards,
        severity, likelihood, risk_rating, recommendations,
        action_required, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      data.hazopAnalysisId,
      data.analysisNodeId,
      data.guideword,
      data.deviation,
      data.possibleCauses,
      data.consequences,
      data.existingSafeguards,
      data.severity,
      data.likelihood,
      data.riskRating,
      data.recommendations,
      data.actionRequired,
      data.createdById
    ];

    try {
      const result = await this.executeQuery(query, values, client);
      return this.mapRowToAnalysisEntry(result.rows[0]);
    } catch (error) {
      throw new DatabaseError(`Failed to create analysis entry: ${error.message}`);
    }
  }

  async updateAnalysisEntry(
    id: string,
    data: UpdateAnalysisEntryRequest,
    userId: string,
    client?: PoolClient
  ): Promise<AnalysisEntry> {
    // Optimistic locking with updated_at check
    const query = `
      UPDATE analysis_entries 
      SET 
        guideword = COALESCE($2, guideword),
        deviation = COALESCE($3, deviation),
        possible_causes = COALESCE($4, possible_causes),
        consequences = COALESCE($5, consequences),
        existing_safeguards = COALESCE($6, existing_safeguards),
        severity = COALESCE($7, severity),
        likelihood = COALESCE($8, likelihood),
        risk_rating = COALESCE($9, risk_rating),
        recommendations = COALESCE($10, recommendations),
        action_required = COALESCE($11, action_required),
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        id = $1 
        AND updated_at = $12
      RETURNING *
    `;

    const values = [
      id,
      data.guideword,
      data.deviation,
      data.possibleCauses,
      data.consequences,
      data.existingSafeguards,
      data.severity,
      data.likelihood,
      data.riskRating,
      data.recommendations,
      data.actionRequired,
      data.lastUpdatedAt // For optimistic locking
    ];

    try {
      const result = await this.executeQuery(query, values, client);
      
      if (result.rows.length === 0) {
        // Check if entry exists
        const existsQuery = 'SELECT updated_at FROM analysis_entries WHERE id = $1';
        const existsResult = await this.executeQuery(existsQuery, [id], client);
        
        if (existsResult.rows.length === 0) {
          throw new NotFoundError('Analysis entry not found');
        } else {
          throw new Error('OptimisticLockError');
        }
      }

      return this.mapRowToAnalysisEntry(result.rows[0]);
    } catch (error) {
      if (error.message === 'OptimisticLockError') {
        throw error;
      }
      throw new DatabaseError(`Failed to update analysis entry: ${error.message}`);
    }
  }

  async getAnalysisEntries(
    filters: AnalysisEntryFilters,
    client?: PoolClient
  ): Promise<AnalysisEntry[]> {
    let query = `
      SELECT ae.*, an.description as node_description, an.equipment_type
      FROM analysis_entries ae
      JOIN analysis_nodes an ON ae.analysis_node_id = an.id
      WHERE 1=1
    `;
    
    const values: any[] = [];
    let paramCount = 0;

    if (filters.hazopAnalysisId) {
      paramCount++;
      query += ` AND ae.hazop_analysis_id = $${paramCount}`;
      values.push(filters.hazopAnalysisId);
    }

    if (filters.riskRatingMin) {
      paramCount++;
      query += ` AND ae.risk_rating >= $${paramCount}`;
      values.push(filters.riskRatingMin);
    }

    if (filters.actionRequired !== undefined) {
      paramCount++;
      query += ` AND ae.action_required = $${paramCount}`;
      values.push(filters.actionRequired);
    }

    query += ' ORDER BY ae.created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    try {
      const result = await this.executeQuery(query, values, client);
      return result.rows.map(row => this.mapRowToAnalysisEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to fetch analysis entries: ${error.message}`);
    }
  }

  private mapRowToAnalysisEntry(row: any): AnalysisEntry {
    return {
      id: row.id,
      hazopAnalysisId: row.hazop_analysis_id,
      analysisNodeId: row.analysis_node_id,
      guideword: row.guideword,
      deviation: row.deviation,
      possibleCauses: row.possible_causes,
      consequences: row.consequences,
      existingSafeguards: row.existing_safeguards,
      severity: row.severity,
      likelihood: row.likelihood,
      riskRating: row.risk_rating,
      recommendations: row.recommendations,
      actionRequired: row.action_required,
      createdById: row.created_by_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Additional fields from join
      nodeDescription: row.node_description,
      equipmentType: row.equipment_type
    };
  }
}
```

### Authentication and Authorization

**JWT Middleware Implementation**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types/auth.types';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token required'
        });
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked'
        });
      }

      // Get fresh user data
      const user = await this.authService.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      logger.error('Authentication error', { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  };

  requireRole = (requiredRole: UserRole) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userRole = req.user.role;
      
      // Role hierarchy
      const roleHierarchy = {
        'viewer': 1,
        'analyst': 2,
        'lead_analyst': 3,
        'admin': 4
      };

      const userLevel = roleHierarchy[userRole];
      const requiredLevel = roleHierarchy[requiredRole];

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  };

  requireProjectAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const hasAccess = await this.authService.canUserAccessProject(userId, projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to project'
        });
      }

      next();
    } catch (error) {
      logger.error('Project access check failed', { 
        error: error.message, 
        userId: req.user.id,
        projectId: req.params.projectId
      });
      return res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };
}
```

### WebSocket Architecture

**Real-time Collaboration Handler**

```typescript
import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';
import { CollaborationService } from '../services/collaboration.service';
import { AnalysisService } from '../services/analysis.service';
import { logger } from '../utils/logger';

export class CollaborationHandler {
  constructor(
    private io: Server,
    private authService: AuthService,
    private collaborationService: CollaborationService,
    private analysisService: AnalysisService
  ) {}

  handleConnection = async (socket: Socket) => {
    try {
      // Authenticate WebSocket connection
      const token = socket.handshake.auth.token;
      const user = await this.authService.verifyToken(token);
      
      if (!user) {
        socket.disconnect();
        return;
      }

      socket.data.user = user;
      
      logger.info('User connected to WebSocket', { 
        userId: user.id, 
        socketId: socket.id 
      });

      // Handle analysis session joining
      socket.on('join-analysis', async (data) => {
        await this.handleJoinAnalysis(socket, data);
      });

      // Handle analysis updates
      socket.on('update-analysis-entry', async (data) => {
        await this.handleUpdateAnalysisEntry(socket, data);
      });

      // Handle cursor tracking for collaboration
      socket.on('cursor-update', async (data) => {
        await this.handleCursorUpdate(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await this.handleDisconnection(socket);
      });

    } catch (error) {
      logger.error('WebSocket connection error', { error: error.message });
      socket.disconnect();
    }
  };

  private async handleJoinAnalysis(socket: Socket, data: { analysisId: string }) {
    try {
      const { analysisId } = data;
      const user = socket.data.user;

      // Check if user can access analysis
      const hasAccess = await this.analysisService.canUserViewAnalysis(user.id, analysisId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to analysis' });
        return;
      }

      // Join analysis room
      await socket.join(`analysis-${analysisId}`);
      
      // Register user in collaboration session
      await this.collaborationService.addParticipant(analysisId, user.id);

      // Get current participants
      const participants = await this.collaborationService.getParticipants(analysisId);

      // Notify others about new participant
      socket.to(`analysis-${analysisId}`).emit('user-joined', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });

      // Send current participants to new user
      socket.emit('participants-updated', participants);

      logger.info('User joined analysis collaboration', { 
        userId: user.id, 
        analysisId 
      });

    } catch (error) {
      logger.error('Error joining analysis', { 
        error: error.message, 
        userId: socket.data.user?.id 
      });
      socket.emit('error', { message: 'Failed to join analysis' });
    }
  }

  private async handleUpdateAnalysisEntry(socket: Socket, data: any) {
    try {
      const user = socket.data.user;
      const { analysisId, entryId, changes } = data;

      // Validate access
      const hasAccess = await this.analysisService.canUserEditAnalysis(user.id, analysisId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Broadcast optimistic update to other users
      socket.to(`analysis-${analysisId}`).emit('analysis-entry-updated', {
        entryId,
        changes,
        updatedBy: {
          id: user.id,
          name: user.name
        },
        timestamp: new Date().toISOString()
      });

      logger.debug('Analysis entry update broadcast', { 
        userId: user.id, 
        analysisId, 
        entryId 
      });

    } catch (error) {
      logger.error('Error handling analysis update', { 
        error: error.message, 
        userId: socket.data.user?.id 
      });
    }
  }

  private async handleCursorUpdate(socket: Socket, data: any) {
    try {
      const user = socket.data.user;
      const { analysisId, position, elementId } = data;

      // Broadcast cursor position to other users in the analysis
      socket.to(`analysis-${analysisId}`).emit('cursor-updated', {
        userId: user.id,
        userName: user.name,
        position,
        elementId,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Error handling cursor update', { 
        error: error.message, 
        userId: socket.data.user?.id 
      });
    }
  }

  private async handleDisconnection(socket: Socket) {
    try {
      const user = socket.data.user;
      
      if (user) {
        // Remove from all collaboration sessions
        await this.collaborationService.removeParticipantFromAllSessions(user.id);
        
        logger.info('User disconnected from WebSocket', { 
          userId: user.id, 
          socketId: socket.id 
        });
      }

    } catch (error) {
      logger.error('Error handling disconnection', { 
        error: error.message, 
        userId: socket.data.user?.id 
      });
    }
  }
}
```

### Backend Architecture Summary

**Architecture Principles:**
- **Layered Architecture:** Clear separation between controllers, services, and repositories
- **Dependency Injection:** Modular design enabling testing and maintainability
- **Security-First:** Comprehensive authentication, authorization, and audit logging
- **Real-time Capabilities:** WebSocket integration for collaboration features
- **Error Resilience:** Comprehensive error handling and graceful degradation
- **Performance Optimization:** Connection pooling, query optimization, and caching strategies

## Unified Project Structure

The HazOp Assistant uses an Nx-based monorepo structure to manage the full-stack application with shared packages and Infrastructure as Code:

```
hazop-assistant/
├── .github/                           # CI/CD workflows and GitHub configuration
│   └── workflows/
│       ├── ci.yml                     # Continuous integration pipeline
│       ├── deploy-staging.yml         # Staging deployment
│       ├── deploy-production.yml      # Production deployment
│       └── security-scan.yml          # Security scanning workflow
├── apps/                              # Application packages
│   ├── web/                           # React frontend application
│   │   ├── src/
│   │   │   ├── app/                   # Main app configuration and routing
│   │   │   ├── components/            # Reusable UI components
│   │   │   │   ├── common/            # Generic components (Button, Modal, etc.)
│   │   │   │   ├── forms/             # Form-specific components
│   │   │   │   ├── visualization/     # Charts, P&ID viewer, risk matrix
│   │   │   │   └── layout/            # Layout components
│   │   │   ├── pages/                 # Route-level page components
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Projects/
│   │   │   │   ├── Analysis/
│   │   │   │   ├── Reports/
│   │   │   │   └── Settings/
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   ├── useAnalysis.ts
│   │   │   │   └── useDebounce.ts
│   │   │   ├── services/              # API client services
│   │   │   │   ├── api/               # REST API clients
│   │   │   │   ├── websocket/         # WebSocket client
│   │   │   │   └── storage/           # Local storage utilities
│   │   │   ├── store/                 # Zustand state management
│   │   │   │   ├── auth.store.ts
│   │   │   │   ├── projects.store.ts
│   │   │   │   ├── analysis.store.ts
│   │   │   │   └── ui.store.ts
│   │   │   ├── styles/                # Global styles and themes
│   │   │   │   ├── globals.css
│   │   │   │   ├── themes/
│   │   │   │   └── components.css
│   │   │   └── utils/                 # Frontend utilities
│   │   │       ├── constants.ts
│   │   │       ├── helpers.ts
│   │   │       └── validation.ts
│   │   ├── public/                    # Static assets
│   │   │   ├── favicon.ico
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── tests/                     # Frontend tests
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   ├── project.json               # Nx project configuration
│   │   ├── tsconfig.json              # TypeScript configuration
│   │   ├── tailwind.config.js         # Tailwind CSS configuration
│   │   └── vite.config.ts             # Vite build configuration
│   └── api/                           # Node.js backend application
│       ├── src/
│       │   ├── app/                   # Application entry point and configuration
│       │   │   ├── app.ts             # Express app setup
│       │   │   ├── server.ts          # Server startup
│       │   │   └── websocket.ts       # WebSocket server setup
│       │   ├── controllers/           # HTTP request handlers
│       │   │   ├── auth.controller.ts
│       │   │   ├── projects.controller.ts
│       │   │   ├── analyses.controller.ts
│       │   │   ├── pids.controller.ts
│       │   │   ├── reports.controller.ts
│       │   │   └── users.controller.ts
│       │   ├── services/              # Business logic layer
│       │   │   ├── auth.service.ts
│       │   │   ├── project.service.ts
│       │   │   ├── analysis.service.ts
│       │   │   ├── pid-processing.service.ts
│       │   │   ├── report.service.ts
│       │   │   ├── notification.service.ts
│       │   │   └── collaboration.service.ts
│       │   ├── repositories/          # Data access layer
│       │   │   ├── base.repository.ts
│       │   │   ├── user.repository.ts
│       │   │   ├── project.repository.ts
│       │   │   ├── analysis.repository.ts
│       │   │   └── audit.repository.ts
│       │   ├── middleware/             # Express middleware
│       │   │   ├── auth.middleware.ts
│       │   │   ├── validation.middleware.ts
│       │   │   ├── error.middleware.ts
│       │   │   ├── logging.middleware.ts
│       │   │   └── rate-limit.middleware.ts
│       │   ├── routes/                # Route definitions
│       │   │   ├── index.ts
│       │   │   ├── auth.routes.ts
│       │   │   ├── projects.routes.ts
│       │   │   ├── analyses.routes.ts
│       │   │   └── reports.routes.ts
│       │   ├── websocket/             # WebSocket handlers
│       │   │   ├── collaboration.handler.ts
│       │   │   ├── analysis.handler.ts
│       │   │   └── notifications.handler.ts
│       │   ├── database/              # Database configuration and migrations
│       │   │   ├── migrations/
│       │   │   ├── seeds/
│       │   │   ├── config.ts
│       │   │   └── connection.ts
│       │   ├── utils/                 # Backend utilities
│       │   │   ├── logger.ts
│       │   │   ├── validation.ts
│       │   │   ├── encryption.ts
│       │   │   ├── risk-calculator.ts
│       │   │   └── errors.ts
│       │   └── config/                # Configuration files
│       │       ├── database.ts
│       │       ├── auth.ts
│       │       ├── storage.ts
│       │       └── websocket.ts
│       ├── tests/                     # Backend tests
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── project.json               # Nx project configuration
│       ├── tsconfig.json              # TypeScript configuration
│       └── jest.config.js             # Jest testing configuration
├── libs/                              # Shared libraries
│   ├── shared/                        # Shared types and utilities
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── types/              # Shared TypeScript interfaces
│   │   │   │   │   ├── auth.types.ts
│   │   │   │   │   ├── analysis.types.ts
│   │   │   │   │   ├── project.types.ts
│   │   │   │   │   └── common.types.ts
│   │   │   │   ├── constants/         # Shared constants
│   │   │   │   │   ├── analysis.constants.ts
│   │   │   │   │   ├── risk-matrix.constants.ts
│   │   │   │   │   └── api.constants.ts
│   │   │   │   ├── utils/             # Shared utilities
│   │   │   │   │   ├── validation.utils.ts
│   │   │   │   │   ├── date.utils.ts
│   │   │   │   │   └── risk.utils.ts
│   │   │   │   └── schemas/           # Validation schemas
│   │   │   │       ├── analysis.schema.ts
│   │   │   │       ├── project.schema.ts
│   │   │   │       └── user.schema.ts
│   │   │   └── index.ts
│   │   ├── project.json
│   │   └── tsconfig.json
│   ├── ui-components/                 # Shared UI component library
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/        # Reusable components
│   │   │   │   │   ├── Button/
│   │   │   │   │   ├── Input/
│   │   │   │   │   ├── Modal/
│   │   │   │   │   ├── DataTable/
│   │   │   │   │   └── RiskMatrix/
│   │   │   │   ├── hooks/             # Shared hooks
│   │   │   │   └── utils/             # UI utilities
│   │   │   └── index.ts
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.js
│   └── config/                        # Shared configuration packages
│       ├── eslint-config/             # ESLint configuration
│       ├── typescript-config/         # TypeScript configurations
│       └── jest-config/               # Jest testing configurations
├── tools/                             # Development and build tools
│   ├── scripts/                       # Build and deployment scripts
│   │   ├── build.sh
│   │   ├── deploy.sh
│   │   ├── migrate.sh
│   │   └── seed-data.sh
│   ├── generators/                    # Nx generators for scaffolding
│   └── executors/                     # Custom Nx executors
├── infrastructure/                    # Infrastructure as Code
│   ├── terraform/                     # Terraform configurations (optional for cloud)
│   │   ├── modules/
│   │   │   ├── database/
│   │   │   ├── storage/
│   │   │   ├── compute/
│   │   │   └── networking/
│   │   ├── environments/
│   │   │   ├── development/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── docker/                        # Docker configurations
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── docker-compose.yml
│   └── kubernetes/                    # K8s deployment manifests
│       ├── web-deployment.yaml
│       ├── api-deployment.yaml
│       ├── database-deployment.yaml
│       └── ingress.yaml
├── docs/                              # Project documentation
│   ├── architecture.md               # This document
│   ├── prd/                          # Product Requirements
│   ├── stories/                      # Development stories
│   └── qa/                           # Quality assurance docs
├── .github/
│   ├── workflows/                    # CI/CD workflows
│   │   ├── build-test.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   └── CODEOWNERS
├── nx.json                           # Nx workspace configuration
├── package.json                      # Root package.json
├── tsconfig.base.json               # Base TypeScript configuration
└── README.md                        # Project overview and setup
```

### Key Design Decisions

**Monorepo Benefits:**
- **Code Sharing**: Common business logic and UI components shared across applications
- **Unified Dependencies**: Single package.json reduces version conflicts
- **Coordinated Deployment**: Deploy related changes across frontend/backend simultaneously
- **Developer Experience**: Single repository checkout, unified tooling, consistent code standards

**Library Organization:**
- **Shared Libraries**: Core business logic (hazop-analysis, risk-assessment) accessible to all applications
- **Domain-Specific Libraries**: Feature-specific libraries (auth, notifications) for targeted functionality
- **UI Component Library**: Reusable components with consistent design system
- **Configuration Libraries**: Shared linting, TypeScript, and testing configurations

**Build and Deployment:**
- **Nx Affected Commands**: Only build and test changed applications and their dependencies
- **Docker Multi-Stage**: Optimized container builds with proper layer caching
- **Infrastructure as Code**: Docker Compose for reproducible environment provisioning (Terraform optional for cloud deployments)

## Development Workflow

### BMad Method Integration

The HazOp Assistant follows the BMad Method development methodology with AI-driven agent roles:

**Agent Roles:**
- **Analyst**: Market research and competitive analysis for industrial safety platforms
- **PM (Product Manager)**: PRD maintenance and feature requirement specification  
- **PO (Product Owner)**: Epic and story management aligned with HazOp analysis workflows
- **Architect**: Technical architecture decisions and system design (this document)
- **UX Expert**: User interface specifications for complex analysis workflows
- **Dev (Developer)**: Story implementation and coding
- **QA (Test Architect)**: Risk assessment, test design, and quality gates
- **SM (Scrum Master)**: Story creation and sprint management

### Development Process

**Story-Driven Development:**

1. **Story Planning** (Scrum Master)
   ```bash
   # Create new story from epic backlog
   npx bmad-method draft
   
   # Stories created in docs/stories/ with format:
   # {epic}.{story}-{description}.md
   # Example: hazop-analysis.core-workflow-create-analysis-session.md
   ```

2. **Story Implementation** (Developer)
   ```bash
   # Create feature branch
   git checkout -b feature/hazop-analysis.core-workflow-create-analysis-session
   
   # Execute development checklist
   npx bmad-method develop-story hazop-analysis.core-workflow-create-analysis-session
   
   # Development workflow:
   # - Read story requirements and acceptance criteria
   # - Create/update backend API endpoints
   # - Implement frontend components and pages
   # - Write unit and integration tests
   # - Update documentation
   # - Generate implementation report
   ```

3. **Quality Gates** (QA Agent)
   ```bash
   # Risk assessment
   npx bmad-method risk hazop-analysis.core-workflow-create-analysis-session
   
   # Test design and strategy
   npx bmad-method design hazop-analysis.core-workflow-create-analysis-session
   
   # Trace coverage
   npx bmad-method trace hazop-analysis.core-workflow-create-analysis-session
   
   # Non-functional requirements validation
   npx bmad-method nfr hazop-analysis.core-workflow-create-analysis-session
   
   # Final quality review
   npx bmad-method review hazop-analysis.core-workflow-create-analysis-session
   ```

### Local Development Environment

**Prerequisites:**
```bash
# Required tools
node >= 18.0.0
npm >= 9.0.0
docker >= 20.0.0
docker-compose >= 2.0.0
```

**Environment Setup:**
```bash
# Clone repository
git clone https://github.com/organization/hazop-assistant.git
cd hazop-assistant

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Configure database connection, JWT secrets, email service credentials

# Start all services with Docker Compose
docker-compose up -d

# This starts:
# - PostgreSQL database (port 5432)
# - Redis cache (port 6379)
# - MinIO object storage (port 9000, console: 9001)
# - RabbitMQ message broker (port 5672, management: 15672)
# - Prometheus monitoring (port 9090)
# - Grafana dashboards (port 3003)
# - Loki logging (port 3100)

# Run database migrations
npm run migrate:dev

# Seed development data
npm run seed:dev

# Start development servers
npm run dev
# Starts both web app (3000) and API (3001) concurrently

# View all running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

**Development Commands:**
```bash
# Build specific application
nx build web
nx build api

# Run tests
nx test web
nx test api
nx test hazop-analysis  # shared library

# Run affected tests only
nx affected:test

# Lint and format
nx lint web
nx format:check

# Generate new components/services
nx generate @nx/react:component analysis-form --project=web
nx generate @nx/nest:service hazop-analysis --project=api
```

### Docker Compose Configuration

**Complete Production Setup:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend Web Application
  web:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://localhost/api
    depends_on:
      - api
    networks:
      - hazop-network
    restart: unless-stopped

  # Backend API Service
  api:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://hazop:password@postgres:5432/hazop_db
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - JWT_SECRET=${JWT_SECRET}
      - JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
      - JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
    depends_on:
      - postgres
      - redis
      - minio
      - rabbitmq
    networks:
      - hazop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=hazop
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=hazop_db
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - hazop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hazop"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis_password
    volumes:
      - redis_data:/data
    networks:
      - hazop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO Object Storage (S3-compatible)
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - hazop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # RabbitMQ Message Broker
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=rabbitmq
      - RABBITMQ_DEFAULT_PASS=rabbitmq
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - hazop-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - api
    networks:
      - hazop-network
    restart: unless-stopped

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./infrastructure/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - hazop-network
    restart: unless-stopped

  # Grafana Dashboards
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infrastructure/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./infrastructure/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    depends_on:
      - prometheus
    networks:
      - hazop-network
    restart: unless-stopped

  # Loki Logging
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./infrastructure/loki/loki-config.yml:/etc/loki/local-config.yaml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - hazop-network
    restart: unless-stopped

  # Promtail Log Collector
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./infrastructure/promtail/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - hazop-network
    restart: unless-stopped

networks:
  hazop-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  rabbitmq_data:
  prometheus_data:
  grafana_data:
  loki_data:
```

**Quick Start Commands:**

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis minio

# View logs
docker-compose logs -f api

# Scale API service
docker-compose up -d --scale api=3

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View service status
docker-compose ps

# Access services:
# - Web UI: http://localhost:3000
# - API: http://localhost:3001
# - MinIO Console: http://localhost:9001
# - RabbitMQ Management: http://localhost:15672
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3003
# - Loki: http://localhost:3100
```

**Environment Variables (.env file):**

```bash
# Database
DATABASE_URL=postgresql://hazop:password@localhost:5432/hazop_db
POSTGRES_USER=hazop
POSTGRES_PASSWORD=password
POSTGRES_DB=hazop_db

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_password

# MinIO S3
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=hazop-documents

# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:rabbitmq@localhost:5672

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Generate RSA keys for production:
# openssl genrsa -out private.key 2048
# openssl rsa -in private.key -pubout -out public.key
JWT_PRIVATE_KEY=./keys/private.key
JWT_PUBLIC_KEY=./keys/public.key

# Email Service (SendGrid example)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@hazop-assistant.com

# Application
NODE_ENV=production
PORT=3001
WEB_PORT=3000
API_URL=http://localhost:3001

# Monitoring
PROMETHEUS_ENDPOINT=http://localhost:9090
LOKI_ENDPOINT=http://localhost:3100
```

### Dockerfile Configurations

**Frontend Dockerfile (infrastructure/docker/Dockerfile.web):**

```dockerfile
# Multi-stage build for React/Next.js frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/web ./apps/web
COPY libs ./libs

# Build application
RUN npx nx build web --configuration=production

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web ./

# Install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

USER nextjs

EXPOSE 3000

CMD ["node", "main.js"]
```

**Backend API Dockerfile (infrastructure/docker/Dockerfile.api):**

```dockerfile
# Multi-stage build for Express.js backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/api ./apps/api
COPY libs ./libs

# Build application
RUN npx nx build api --configuration=production

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for healthchecks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Copy built application
COPY --from=builder --chown=apiuser:nodejs /app/dist/apps/api ./

# Install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy necessary configuration files
COPY --chown=apiuser:nodejs keys ./keys

USER apiuser

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "main.js"]
```

**Nginx Configuration (infrastructure/nginx/nginx.conf):**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream web_backend {
        server web:3000;
    }

    upstream api_backend {
        least_conn;
        server api:3001 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Frontend
        location / {
            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints
        location /api {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # CORS headers
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            add_header Access-Control-Max-Age 3600 always;

            if ($request_method = OPTIONS) {
                return 204;
            }
        }

        # Authentication endpoints - stricter rate limiting
        location /api/auth {
            limit_req zone=auth_limit burst=5 nodelay;

            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://api_backend/health;
        }
    }

    # SSL configuration (for production)
    # Uncomment and configure for HTTPS
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #
    #     # Same location blocks as above
    # }
}
```

**Database Initialization Script (infrastructure/database/init.sql):**

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS hazop;

-- Set search path
SET search_path TO hazop, public;

-- Enable row-level security
ALTER DATABASE hazop_db SET row_security = on;

-- Create initial tables (will be managed by migrations)
-- This is just for initial setup

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE hazop_db TO hazop;
GRANT ALL PRIVILEGES ON SCHEMA hazop TO hazop;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hazop TO hazop;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hazop TO hazop;

-- Create backup user (read-only)
CREATE USER hazop_backup WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE hazop_db TO hazop_backup;
GRANT USAGE ON SCHEMA hazop TO hazop_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA hazop TO hazop_backup;
```

### Production Deployment Guide

**Prerequisites for Production:**

1. **Docker Host Setup** (Linux recommended - Ubuntu 22.04 LTS or newer)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

2. **Generate JWT Keys**
```bash
# Create keys directory
mkdir -p keys

# Generate RSA key pair for JWT
openssl genrsa -out keys/private.key 4096
openssl rsa -in keys/private.key -pubout -out keys/public.key

# Secure the private key
chmod 600 keys/private.key
chmod 644 keys/public.key
```

3. **Configure Environment**
```bash
# Copy example environment file
cp .env.example .env.production

# Edit production environment variables
nano .env.production
```

**Deployment Steps:**

```bash
# 1. Clone repository on production server
git clone https://github.com/organization/hazop-assistant.git
cd hazop-assistant

# 2. Checkout production branch
git checkout main

# 3. Copy production environment
cp .env.production .env

# 4. Build Docker images
docker-compose build --no-cache

# 5. Start services
docker-compose up -d

# 6. Verify all services are running
docker-compose ps

# 7. Check service health
docker-compose logs -f api
docker-compose exec api curl -f http://localhost:3001/health

# 8. Run database migrations
docker-compose exec api npm run migrate:production

# 9. Create initial admin user
docker-compose exec api npm run seed:admin

# 10. Verify web access
curl http://localhost
```

**Post-Deployment Verification:**

```bash
# Check all containers are healthy
docker-compose ps

# View logs
docker-compose logs -f

# Test API health endpoint
curl http://localhost/api/health

# Test authentication
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Check database connectivity
docker-compose exec postgres psql -U hazop -d hazop_db -c "SELECT version();"

# Verify MinIO is accessible
curl http://localhost:9000/minio/health/live

# Check RabbitMQ
docker-compose exec rabbitmq rabbitmq-diagnostics ping
```

**Backup and Restore:**

```bash
# Backup PostgreSQL database
docker-compose exec postgres pg_dump -U hazop hazop_db > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup MinIO data
docker-compose exec minio mc mirror /data ./minio-backup-$(date +%Y%m%d-%H%M%S)

# Restore database
cat backup-20260209-120000.sql | docker-compose exec -T postgres psql -U hazop hazop_db

# Restore MinIO data
docker-compose exec minio mc mirror ./minio-backup-20260209-120000 /data
```

**SSL/TLS Configuration (Production):**

1. **Obtain SSL Certificate** (Let's Encrypt recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificates will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

2. **Update Docker Compose for SSL**
```yaml
# Add to nginx service in docker-compose.yml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

3. **Update Nginx Configuration**
```nginx
# Uncomment the SSL server block in nginx.conf
# Update paths to match Let's Encrypt certificates
```

**Monitoring and Maintenance:**

```bash
# View system resource usage
docker stats

# View application logs
docker-compose logs -f api web

# Access Grafana dashboards
# Navigate to http://your-domain:3003
# Default: admin/admin (change immediately)

# Access Prometheus metrics
# Navigate to http://your-domain:9090

# Check RabbitMQ queue status
# Navigate to http://your-domain:15672
# Default: rabbitmq/rabbitmq

# MinIO management console
# Navigate to http://your-domain:9001
# Default: minioadmin/minioadmin
```

**Scaling for Production:**

```bash
# Scale API service to 3 replicas
docker-compose up -d --scale api=3

# Scale with load balancer
# Nginx will automatically distribute traffic

# Monitor performance
docker-compose exec prometheus curl localhost:9090/api/v1/targets
```

**Update/Rollback Procedure:**

```bash
# 1. Pull latest code
git pull origin main

# 2. Backup before update
./scripts/backup-all.sh

# 3. Build new images
docker-compose build

# 4. Update services with zero-downtime
docker-compose up -d --no-deps --build web api

# 5. Run migrations if needed
docker-compose exec api npm run migrate:production

# Rollback if needed:
# 1. Checkout previous version
git checkout <previous-commit-hash>

# 2. Rebuild and restart
docker-compose build
docker-compose up -d

# 3. Restore database if needed
cat backup.sql | docker-compose exec -T postgres psql -U hazop hazop_db
```

**Security Hardening:**

```bash
# 1. Change all default passwords in .env
# 2. Restrict Docker socket access
sudo chmod 660 /var/run/docker.sock

# 3. Enable firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# 4. Set up automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 5. Enable Docker content trust
export DOCKER_CONTENT_TRUST=1

# 6. Regular security audits
docker-compose exec api npm audit
docker scan hazop-api:latest
```

**Disaster Recovery:**

```bash
# Automated backup script (add to cron)
# /opt/hazop-assistant/scripts/backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/hazop-$DATE"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec postgres pg_dump -U hazop hazop_db > $BACKUP_DIR/db.sql

# Backup MinIO
docker-compose exec minio mc mirror /data $BACKUP_DIR/minio

# Backup configuration
cp .env $BACKUP_DIR/
cp -r keys $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Upload to remote storage (optional)
# aws s3 cp $BACKUP_DIR.tar.gz s3://backup-bucket/

# Clean old backups (keep last 30 days)
find /backups -name "hazop-*.tar.gz" -mtime +30 -delete

# Add to crontab: daily at 2 AM
# 0 2 * * * /opt/hazop-assistant/scripts/backup.sh
```

### Branch Strategy and Git Workflow

**Branch Protection:**
- **main**: Production-ready code, protected, requires PR approval
- **develop**: Integration branch for feature development
- **feature/**: Feature branches following story naming convention
- **hotfix/**: Emergency production fixes
- **release/**: Release preparation branches

**Git Workflow:**
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/hazop-analysis.risk-assessment-integration

# 2. Development cycle
# - Implement story requirements
# - Write tests (TDD approach)
# - Run quality checks locally

# Local quality checks before commit
npm run test
npm run lint
npm run typecheck
npm run build

# 3. Commit with conventional commits
git add .
git commit -m "feat(hazop): implement risk assessment integration

- Add risk calculation service with severity/likelihood matrix
- Create risk assessment UI components with real-time updates
- Integrate with HazOp analysis workflow
- Add comprehensive test coverage

Closes #123"

# 4. Push and create PR
git push origin feature/hazop-analysis.risk-assessment-integration

# Create PR targeting develop branch
gh pr create --title "feat(hazop): Risk Assessment Integration" \
             --body "Implements story: hazop-analysis.risk-assessment-integration
             
## Changes
- Risk calculation service with matrix algorithms
- Real-time risk assessment UI
- Integration with analysis workflow
- Test coverage: 95%

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass  
- [ ] Manual testing completed
- [ ] QA review completed"
```

### Continuous Integration Pipeline

**GitHub Actions Workflow:**
```yaml
# .github/workflows/build-test.yml
name: Build and Test
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for Nx affected
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run affected linting
        run: npx nx affected:lint --parallel=3
      
      - name: Run affected tests
        run: npx nx affected:test --parallel=3 --ci --coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/hazop_test
      
      - name: Run affected builds
        run: npx nx affected:build --parallel=3
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

**Deployment Pipeline:**
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build applications
        run: |
          npx nx build web --configuration=staging
          npx nx build api --configuration=staging
      
      - name: Build and push Docker images
        run: |
          docker build -f infrastructure/docker/Dockerfile.web -t hazop-web:staging .
          docker build -f infrastructure/docker/Dockerfile.api -t hazop-api:staging .

          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin

          docker tag hazop-web:staging ${{ secrets.DOCKER_REGISTRY }}/hazop-web:staging
          docker tag hazop-api:staging ${{ secrets.DOCKER_REGISTRY }}/hazop-api:staging

          docker push ${{ secrets.DOCKER_REGISTRY }}/hazop-web:staging
          docker push ${{ secrets.DOCKER_REGISTRY }}/hazop-api:staging

      - name: Deploy to Docker Host
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/hazop-assistant
            docker-compose pull
            docker-compose up -d --remove-orphans
            docker-compose ps
```

### Code Quality Standards

**TypeScript Configuration:**
- Strict mode enabled with comprehensive type checking
- Path mapping for clean imports (`@/components`, `@hazop/core`)
- Consistent coding standards across monorepo

**Testing Strategy:**
- **Unit Tests**: Jest with React Testing Library for components
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for critical user workflows
- **Coverage Requirements**: Minimum 80% coverage for new code

**Code Review Process:**
1. **Automated Checks**: Linting, testing, and build validation
2. **Manual Review**: Code quality, architecture compliance, security review
3. **QA Review**: Functional testing and acceptance criteria validation
4. **Approval Requirements**: 2 approvals required (1 technical lead + 1 domain expert)

### Monitoring and Observability

**Application Performance Monitoring:**
- **Frontend**: React performance monitoring with Web Vitals
- **Backend**: Node.js performance metrics with response time tracking
- **Database**: PostgreSQL query performance and connection pooling metrics

**Logging Strategy:**
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: Error, warn, info, debug with environment-based configuration
- **Log Aggregation**: Loki + Grafana for centralized logging

**Error Tracking:**
- **Frontend**: Sentry integration for React error boundary
- **Backend**: Comprehensive error handling with context preservation
- **Alert Configuration**: Critical error notifications via email and Slack

### Security Development Practices

**Secure Development Lifecycle:**
- **Static Analysis**: ESLint security rules and SonarQube integration
- **Dependency Scanning**: npm audit and Dependabot for vulnerability detection
- **Secret Management**: Docker secrets and encrypted environment variables
- **Security Testing**: OWASP ZAP integration in CI pipeline

**Code Security Standards:**
- Input validation and sanitization for all user inputs
- SQL injection prevention with parameterized queries
- XSS protection with Content Security Policy headers
- Authentication token secure storage and transmission

## Security & Performance

### Security Architecture

**Authentication & Authorization:**

```typescript
// JWT Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  permissions: Permission[];
  organizationId: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string; // hazop-assistant
  aud: string; // hazop-assistant-api
}

// Role-Based Access Control
enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  ORG_ADMIN = 'org_admin', 
  PROJECT_MANAGER = 'project_manager',
  SAFETY_ENGINEER = 'safety_engineer',
  ANALYST = 'analyst',
  OBSERVER = 'observer'
}

// Permission-Based Authorization
enum Permission {
  // Project Management
  CREATE_PROJECT = 'project:create',
  UPDATE_PROJECT = 'project:update',
  DELETE_PROJECT = 'project:delete',
  
  // HazOp Analysis
  CREATE_ANALYSIS = 'analysis:create',
  UPDATE_ANALYSIS = 'analysis:update',
  DELETE_ANALYSIS = 'analysis:delete',
  APPROVE_ANALYSIS = 'analysis:approve',
  
  // Risk Assessment
  CREATE_RISK_ENTRY = 'risk:create',
  UPDATE_RISK_ENTRY = 'risk:update',
  APPROVE_RISK_ASSESSMENT = 'risk:approve',
  
  // User Management
  INVITE_USER = 'user:invite',
  MANAGE_USER_ROLES = 'user:manage_roles',
  
  // System Administration
  MANAGE_ORGANIZATION = 'org:manage',
  VIEW_SYSTEM_LOGS = 'system:view_logs'
}
```

**Security Middleware Implementation:**

```typescript
// Authentication Middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Verify JWT with local RSA public key
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
      issuer: 'hazop-assistant',
      audience: 'hazop-assistant-api',
      algorithms: ['RS256']
    }) as JWTPayload;
    
    // Check token blacklist (Redis)
    const isBlacklisted = await redis.get(`blacklist:${decoded.sessionId}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    // Load user permissions from database
    const user = await userService.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account inactive' });
    }
    
    req.user = {
      ...decoded,
      permissions: user.getEffectivePermissions()
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Authorization Middleware
export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission
      });
    }
    next();
  };
};

// Resource-Level Authorization
export const requireResourceAccess = (resourceType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const userId = req.user!.userId;
    
    const hasAccess = await accessControlService.checkResourceAccess({
      userId,
      resourceType,
      resourceId,
      action: req.method.toLowerCase()
    });
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to resource' });
    }
    
    next();
  };
};
```

**Data Protection & Privacy:**

```typescript
// Personal Data Encryption
export class DataEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivation = 'scrypt';
  
  async encryptPII(data: string, context: string): Promise<EncryptedData> {
    // Derive encryption key from master key + context
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(process.env.ENCRYPTION_MASTER_KEY!, salt, 32);
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher(this.algorithm, key, { ivLength: 12 });
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      context
    };
  }
  
  async decryptPII(encryptedData: EncryptedData): Promise<string> {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = crypto.scryptSync(process.env.ENCRYPTION_MASTER_KEY!, salt, 32);
    
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, key, { ivLength: 12 });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Audit Logging for Compliance
export class AuditLogger {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      action: event.action,
      result: event.result,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      organizationId: event.organizationId,
      metadata: event.metadata
    };
    
    // Store in secure audit log table
    await this.db.auditLogs.create(auditEntry);
    
    // Send to Loki for centralized logging and SIEM integration
    await this.lokiLogger.logSecurityEvent(auditEntry);
    
    // Alert on critical security events
    if (event.type === 'UNAUTHORIZED_ACCESS_ATTEMPT' || 
        event.type === 'PRIVILEGE_ESCALATION_ATTEMPT') {
      await this.alertService.sendSecurityAlert(auditEntry);
    }
  }
}
```

**API Security Implementation:**

```typescript
// Rate Limiting with Redis
export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate_limit:'
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Too many requests from this IP',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Rate limit by user ID for authenticated requests
      if (req.user?.userId) {
        return `user:${req.user.userId}`;
      }
      // Fall back to IP-based limiting
      return req.ip;
    }
  });
};

// Input Validation & Sanitization
export const validateHazopAnalysisInput = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .trim()
    .escape()
    .withMessage('Analysis name must be 1-255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .escape(),
  
  body('projectId')
    .isUUID(4)
    .withMessage('Invalid project ID format'),
  
  body('analysisNodes')
    .isArray({ min: 1, max: 50 })
    .withMessage('Must have 1-50 analysis nodes'),
  
  body('analysisNodes.*.name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape(),
  
  body('analysisNodes.*.parameters.*.value')
    .custom((value) => {
      // Sanitize parameter values to prevent injection
      const sanitized = DOMPurify.sanitize(value);
      return sanitized === value;
    })
    .withMessage('Parameter values contain invalid characters')
];

// SQL Injection Prevention
export class HazopRepository {
  async findAnalysesByProject(projectId: string, userId: string): Promise<HazopAnalysis[]> {
    // Using parameterized queries with TypeORM
    return this.repository
      .createQueryBuilder('analysis')
      .innerJoin('analysis.project', 'project')
      .innerJoin('project.members', 'member')
      .where('project.id = :projectId', { projectId })
      .andWhere('member.userId = :userId', { userId })
      .andWhere('analysis.deletedAt IS NULL')
      .orderBy('analysis.createdAt', 'DESC')
      .getMany();
  }
}
```

### Performance Architecture

**Caching Strategy:**

```typescript
// Multi-Level Caching Architecture
export class CacheManager {
  private redis: Redis;
  private memoryCache: NodeCache;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3
    });
    
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false
    });
  }
  
  // L1: Memory cache for frequently accessed data
  async getFromMemory<T>(key: string): Promise<T | null> {
    return this.memoryCache.get<T>(key) || null;
  }
  
  // L2: Redis cache for shared data across instances
  async getFromRedis<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  // Intelligent cache hierarchy
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    let result = await this.getFromMemory<T>(key);
    if (result) return result;
    
    // Fall back to Redis
    result = await this.getFromRedis<T>(key);
    if (result) {
      // Populate memory cache for next access
      this.memoryCache.set(key, result, 300);
      return result;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, value, ttl);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear from memory cache
    const keys = this.memoryCache.keys();
    keys.filter(key => key.includes(pattern)).forEach(key => {
      this.memoryCache.del(key);
    });
    
    // Clear from Redis
    const redisKeys = await this.redis.keys(`*${pattern}*`);
    if (redisKeys.length > 0) {
      await this.redis.del(...redisKeys);
    }
  }
}
```

**Database Performance Optimization:**

```sql
-- Performance-Critical Indexes
CREATE INDEX CONCURRENTLY idx_hazop_analyses_project_created 
ON hazop_analyses(project_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_analysis_entries_composite
ON analysis_entries(hazop_analysis_id, analysis_node_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_risk_assessments_severity_likelihood
ON risk_assessments(severity, likelihood, risk_rating DESC);

CREATE INDEX CONCURRENTLY idx_audit_logs_user_time
ON audit_logs(user_id, created_at DESC)
WHERE event_type IN ('UNAUTHORIZED_ACCESS_ATTEMPT', 'DATA_ACCESS', 'DATA_MODIFICATION');

-- Partial indexes for active records only
CREATE INDEX CONCURRENTLY idx_projects_active_org
ON projects(organization_id, created_at DESC)
WHERE status = 'active' AND deleted_at IS NULL;

-- GIN indexes for full-text search
CREATE INDEX CONCURRENTLY idx_hazop_analyses_search
ON hazop_analyses USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Connection pooling configuration
-- max_connections = 200
-- shared_buffers = 1GB (25% of 4GB RAM)
-- effective_cache_size = 3GB (75% of 4GB RAM)
-- work_mem = 64MB
-- maintenance_work_mem = 256MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
```

**Frontend Performance Optimization:**

```typescript
// Code Splitting and Lazy Loading
const HazopAnalysisPage = lazy(() => 
  import('../pages/HazopAnalysisPage').then(module => ({
    default: module.HazopAnalysisPage
  }))
);

const RiskAssessmentPage = lazy(() =>
  import('../pages/RiskAssessmentPage').then(module => ({
    default: module.RiskAssessmentPage  
  }))
);

// Route-based code splitting
export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Routes>
        <Route path="/analysis/:id" element={<HazopAnalysisPage />} />
        <Route path="/risk-assessment/:id" element={<RiskAssessmentPage />} />
      </Routes>
    </Suspense>
  );
};

// React Query for Data Fetching Optimization
export const useHazopAnalysis = (analysisId: string) => {
  return useQuery({
    queryKey: ['hazopAnalysis', analysisId],
    queryFn: () => hazopService.getAnalysis(analysisId),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404s or 403s
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });
};

// Optimistic Updates for Real-time Collaboration
export const useUpdateAnalysisNode = (analysisId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (update: AnalysisNodeUpdate) => 
      hazopService.updateAnalysisNode(analysisId, update),
    
    onMutate: async (newData) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(['hazopAnalysis', analysisId]);
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['hazopAnalysis', analysisId]);
      
      // Optimistically update cache
      queryClient.setQueryData(['hazopAnalysis', analysisId], (old: any) => ({
        ...old,
        nodes: old.nodes.map((node: any) => 
          node.id === newData.nodeId 
            ? { ...node, ...newData.updates }
            : node
        ),
        lastModified: new Date().toISOString()
      }));
      
      return { previousData };
    },
    
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['hazopAnalysis', analysisId], context.previousData);
      }
    },
    
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries(['hazopAnalysis', analysisId]);
    }
  });
};

// Bundle Optimization with Webpack
export const webpackConfig = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    usedExports: true,
    sideEffects: false
  }
};
```

**Real-time Performance Monitoring:**

```typescript
// Performance Monitoring Service
export class PerformanceMonitor {
  private metricsCollector: MetricsCollector;
  
  constructor() {
    this.metricsCollector = new MetricsCollector({
      prometheusEndpoint: process.env.PROMETHEUS_ENDPOINT || 'http://localhost:9090',
      pushgatewayUrl: process.env.PROMETHEUS_PUSHGATEWAY || 'http://localhost:9091'
    });
  }
  
  // API Response Time Monitoring
  trackApiPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        this.metricsCollector.trackMetric({
          name: 'api_response_time',
          value: duration,
          properties: {
            method: req.method,
            route: req.route?.path || req.path,
            statusCode: res.statusCode.toString(),
            userId: req.user?.userId || 'anonymous'
          }
        });
        
        // Alert on slow requests
        if (duration > 5000) { // 5 second threshold
          this.alertOnSlowRequest({
            method: req.method,
            path: req.path,
            duration,
            userId: req.user?.userId
          });
        }
      });
      
      next();
    };
  }
  
  // Database Query Performance
  async trackDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.metricsCollector.trackMetric({
        name: 'database_query_time',
        value: duration,
        properties: {
          queryName,
          success: 'true'
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.metricsCollector.trackMetric({
        name: 'database_query_time',
        value: duration,
        properties: {
          queryName,
          success: 'false',
          errorType: error.constructor.name
        }
      });
      
      throw error;
    }
  }
  
  // Memory Usage Monitoring
  startMemoryMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      
      this.metricsCollector.trackMetric({
        name: 'memory_usage_rss',
        value: memUsage.rss / 1024 / 1024 // Convert to MB
      });
      
      this.metricsCollector.trackMetric({
        name: 'memory_usage_heap_used',
        value: memUsage.heapUsed / 1024 / 1024
      });
      
      // Alert on high memory usage
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 400) { // 400MB threshold
        this.alertOnHighMemoryUsage(heapUsedMB);
      }
    }, 30000); // Every 30 seconds
  }
}
```

### Scalability Considerations

**Horizontal Scaling Architecture:**

```yaml
# Docker Compose Scaling Configuration
version: '3.8'

services:
  hazop-api:
    image: hazop-api:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - "3001-3003:3001"
    networks:
      - hazop-network
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - hazop-api
    networks:
      - hazop-network

networks:
  hazop-network:
    driver: bridge
```

**Load Balancing with Nginx:**

```nginx
# nginx.conf
upstream hazop_api {
    least_conn;
    server hazop-api:3001 max_fails=3 fail_timeout=30s;
    server hazop-api:3002 max_fails=3 fail_timeout=30s;
    server hazop-api:3003 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name hazop-assistant.local;

    location / {
        proxy_pass http://hazop_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Kubernetes Alternative (Optional):**

For production deployments requiring advanced orchestration, the application can be deployed to Kubernetes:

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hazop-api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hazop-api
  template:
    metadata:
      labels:
        app: hazop-api
    spec:
      containers:
      - name: hazop-api
        image: hazop-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi" 
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hazop-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hazop-api-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Performance Benchmarks & SLAs:**

| Metric | Target | Threshold | Alerting |
|--------|--------|-----------|----------|
| API Response Time (95th percentile) | < 500ms | < 1000ms | > 2000ms |
| Database Query Time (95th percentile) | < 100ms | < 250ms | > 500ms |
| Frontend Page Load (First Contentful Paint) | < 1.5s | < 2.5s | > 4s |
| WebSocket Connection Establishment | < 200ms | < 500ms | > 1s |
| System Uptime | 99.9% | 99.5% | < 99.0% |
| Memory Usage per Instance | < 400MB | < 600MB | > 800MB |
| CPU Usage per Instance | < 70% | < 85% | > 95% |
| Concurrent WebSocket Connections | 500+ | 1000+ | Monitor scaling |

**Disaster Recovery & Business Continuity:**

```typescript
// Automated Backup Strategy
export class BackupService {
  async performDailyBackup(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Database backup to Azure Blob Storage
    await this.createDatabaseBackup(`hazop-backup-${timestamp}.sql`);
    
    // File storage backup
    await this.backupFileStorage(`files-backup-${timestamp}.tar.gz`);
    
    // Configuration backup
    await this.backupConfiguration(`config-backup-${timestamp}.json`);
    
    // Test backup integrity
    await this.verifyBackupIntegrity(timestamp);
    
    // Cleanup old backups (retain 30 days)
    await this.cleanupOldBackups(30);
  }
  
  async createDatabaseBackup(filename: string): Promise<void> {
    const backupCommand = `pg_dump ${process.env.DATABASE_URL} | gzip`;

    // Upload to MinIO S3-compatible storage
    await this.minioClient.putObject(
      'backups',
      filename,
      exec(backupCommand).stdout,
      {
        'Content-Type': 'application/gzip',
        'Content-Encoding': 'gzip',
        'X-Amz-Meta-Backup-Type': 'database',
        'X-Amz-Meta-Timestamp': new Date().toISOString()
      }
    );
  }
}
```
│       ├── api/
│       ├── web/
│       ├── database/
│       └── ingress/
├── docs/                              # Documentation
│   ├── prd.md                         # Product Requirements Document
│   ├── architecture.md                # This document
│   ├── api-docs/                      # API documentation
│   ├── deployment-guide.md            # Deployment instructions
│   ├── developer-guide.md             # Development setup guide
│   └── user-manual/                   # End-user documentation
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── .eslintrc.json                     # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── nx.json                            # Nx workspace configuration
├── package.json                       # Root package.json with workspace dependencies
├── tsconfig.base.json                 # Base TypeScript configuration
├── README.md                          # Project overview and setup instructions
└── CHANGELOG.md                       # Version history and changes
```

### Key Structure Design Decisions

**Monorepo Benefits for HazOp Assistant:**
- **Code Sharing:** Shared types and utilities prevent duplication between frontend and backend
- **Coordinated Releases:** Frontend and backend can be deployed together with guaranteed compatibility
- **Developer Experience:** Single repository setup, unified tooling, and cross-project refactoring
- **Type Safety:** End-to-end TypeScript type checking from database to UI components

**Nx Workspace Advantages:**
- **Build System:** Intelligent caching and incremental builds speed up development
- **Code Generation:** Scaffolding tools ensure consistent project structure
- **Dependency Graph:** Visual understanding of project dependencies
- **Task Orchestration:** Coordinated testing, linting, and building across all projects

**Security and Compliance Structure:**
- **Separation of Concerns:** Clear boundaries between applications, libraries, and infrastructure
- **Configuration Management:** Environment-specific configurations isolated from code
- **Documentation Co-location:** Critical documentation lives with the code for maintenance
- **Infrastructure as Code:** Docker Compose enables repeatable, auditable deployments with optional Terraform for cloud providers

### Package Dependencies

**Shared Dependencies (`package.json`):**
- All projects share common development tools (TypeScript, ESLint, Prettier)
- Version consistency enforced across the monorepo
- Security scanning and dependency management centralized

**Application-Specific Dependencies:**
- Frontend: React ecosystem, state management, UI libraries
- Backend: Express, database drivers, authentication libraries
- Shared libraries: Validation schemas, utility functions

**Development Workflow Integration:**
- **Hot Reloading:** Changes in shared libraries automatically rebuild dependent applications
- **Type Checking:** Cross-project type checking ensures API contract compliance
- **Testing Strategy:** Unit tests in individual packages, integration tests at app level
