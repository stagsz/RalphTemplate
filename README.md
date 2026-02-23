<<<<<<< HEAD
# find.bi
=======
# HazOp Assistant
>>>>>>> fd0cfc54ecd6140dbe09febd524261d7fa94570e

An integrated platform for conducting Hazard and Operability Studies (HazOps) in the process industry. The system guides engineers through established HazOps methodology while automating documentation, risk assessment, and compliance validation.

## Features

- **P&ID Management**: Upload and annotate Piping & Instrumentation Diagrams with interactive node markers
- **Guided HazOps Analysis**: Node-by-node analysis with standard guide words (No, More, Less, Reverse, Early, Late, Other Than)
- **Risk Assessment**: Severity × Likelihood × Detectability methodology with 5×5 risk matrix visualization
- **LOPA Validation**: Layers of Protection Analysis with automatic gap analysis
- **Regulatory Compliance**: Cross-reference validation against IEC 61511, ISO 31000, OSHA PSM, EPA RMP, SEVESO III, ATEX/DSEAR, and PED
- **Report Generation**: Professional exports to Word, PDF, Excel, and PowerPoint formats
- **Real-time Collaboration**: Multi-user analysis sessions with live updates and conflict resolution
- **Role-based Access**: Administrator, Lead Analyst, Analyst, and Viewer roles

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Mantine UI |
| Backend | Node.js 20+, Express.js, TypeScript |
| Database | PostgreSQL 15+ |
| Cache | Redis 7 |
| File Storage | MinIO (S3-compatible) |
| Message Queue | RabbitMQ |
| Real-time | Socket.io |
| Authentication | JWT (RS256) + Passport.js |
| Testing | Vitest (frontend), Jest (backend), Playwright (E2E) |
| Monorepo | Nx |
| Monitoring | Prometheus, Grafana, Loki, Winston |

## Prerequisites

- **Node.js** 20.x or later
- **Docker** and Docker Compose
- **Git**

## Quick Start (Development)

### 1. Clone and Install

**Windows (PowerShell):**
```powershell
# 1. Copy template to new project folder
cp -r C:\Users\staff\find.bi C:\Users\staff\MyProject
cd C:\Users\staff\MyProject

# 2. Run interactive setup wizard (asks questions step-by-step)
.\setup_project.ps1

# 3. Review and edit PRD.json if needed

# 4. Generate implementation plan
.\loop.ps1 plan

# 5. Start building
.\loop.ps1 build
```

**Mac/Linux (Bash):**
```bash
<<<<<<< HEAD
# 1. Copy template
cp -r ~/find.bi ~/MyProject
cd ~/MyProject

# 2. Run setup wizard
./setup_project.sh

# 3. Review PRD.json

# 4. Generate plan
./loop.sh plan

# 5. Build
./loop.sh build
```

**The setup wizard will ask you:**
- Project name and description
- Project type (full-stack, backend, frontend, CLI)
- Tech stack (React, FastAPI, PostgreSQL, etc.)
- Key features you want to build
- Authentication and API needs

## What is Ralph?

Ralph is an autonomous AI development loop following an eight-step execution cycle:
1. **Orient** - Study specs and context
2. **Read** - Review implementation plan
3. **Select** - Choose next task
4. **Investigate** - Search existing code (don't assume not implemented)
5. **Implement** - Make changes
6. **Validate** - Run tests as backpressure
7. **Update** - Mark task complete, document learnings
8. **Commit** - Save with the "why"

## Files

| File | Purpose | Edit? |
|------|---------|:-----:|
| `setup_project.ps1` | **Interactive setup wizard** | Run first |
| `PRD.json` | Your product requirements | ✏️ After setup |
| `CLAUDE.md` | Project context | Auto-filled |
| `IMPLEMENTATION_PLAN.md` | Task queue | Auto-generated |
| `loop.ps1` / `loop.sh` | The autonomous loop | No |
| `PROMPT_Plan.md` | Planning mode instructions | No |
| `PROMPT_Build.md` | Build mode instructions | No |
| `AGENTS.md` | Quick reference | No |
| `evaluate_loop.ps1` | Quality/security checks | No |
| `check_prompt_injection.ps1` | Security scanner | No |
| `specs/` | (Optional) Detailed specs | Advanced |
| `hooks/` | (Optional) Git hooks | Advanced |

## Commands
=======
git clone <repository-url>
cd hazop-assistant
npm install
```

### 2. Configure Environment
>>>>>>> fd0cfc54ecd6140dbe09febd524261d7fa94570e

```bash
# Copy the example environment file
cp .env.example .env

# Generate JWT keys (required for authentication)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Convert keys to single-line format and add to .env
# Linux/macOS:
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem

# Windows PowerShell:
(Get-Content private.pem -Raw) -replace "`r`n", "\n" -replace "`n", "\n"
(Get-Content public.pem -Raw) -replace "`r`n", "\n" -replace "`n", "\n"
```

Update the `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` values in `.env` with the generated keys.

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, MinIO, and RabbitMQ
docker compose up -d
```

Wait for all services to be healthy:

```bash
docker compose ps
```

### 4. Run Database Migrations

```bash
# Run all migrations
cd apps/api
for file in ../../migrations/*.sql; do
  docker exec -i hazop-postgres psql -U hazop -d hazop < "$file"
done
cd ../..
```

Or on Windows PowerShell:

```powershell
Get-ChildItem -Path migrations -Filter *.sql | Sort-Object Name | ForEach-Object {
  Get-Content $_.FullName | docker exec -i hazop-postgres psql -U hazop -d hazop
}
```

### 5. Create Admin User

```bash
cd apps/api
npx tsx scripts/seed-admin.ts
cd ../..
```

This creates:
- **Email**: `admin@hazop.local`
- **Password**: `Admin123!`

### 6. Start the Application

```bash
# Terminal 1: Start the backend API
cd apps/api
npm run dev
# API runs on http://localhost:4000

# Terminal 2: Start the frontend
cd apps/web
npm run dev
# Frontend runs on http://localhost:5173
```

### 7. Access the Application

Open http://localhost:5173 and login with the admin credentials.

## Project Structure

```
hazop-assistant/
├── apps/
│   ├── api/                  # Express.js backend
│   │   ├── src/
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── routes/       # API routes
│   │   │   ├── middleware/   # Auth, validation
│   │   │   └── docs/         # OpenAPI/Swagger
│   │   └── Dockerfile
│   └── web/                  # React frontend
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── pages/        # Route pages
│       │   ├── hooks/        # React hooks
│       │   ├── store/        # Zustand state
│       │   └── services/     # API client
│       └── Dockerfile
├── packages/
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities
├── migrations/               # PostgreSQL migrations
├── docker/
│   ├── nginx/                # Nginx configs
│   ├── grafana/              # Dashboards
│   ├── prometheus/           # Monitoring config
│   └── loki/                 # Log aggregation
├── e2e/                      # Playwright tests
├── docker-compose.yml        # Development services
└── docker-compose.prod.yml   # Production stack
```

## Available Scripts

### Root Level

```bash
npm run build           # Build all apps
npm run test            # Run all tests
npm run test:e2e        # Run Playwright E2E tests
npm run lint            # Lint all apps
npm run typecheck       # Type-check all apps
npm run db:migrate      # Run database migrations
```

### Backend (apps/api)

```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run test            # Run Jest tests
npm run typecheck       # Type-check
npm run lint            # Lint code
```

### Frontend (apps/web)

```bash
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run test            # Run Vitest tests
npm run typecheck       # Type-check
npm run lint            # Lint code
```

## Production Deployment

### 1. Configure Production Environment

```bash
# Copy the production environment template
cp .env.production.example .env.production

# Generate strong passwords for all services
openssl rand -base64 24  # Use this to generate each password

# Generate new JWT keys (never reuse development keys!)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

Edit `.env.production` and configure:
- Database credentials (DB_USER, DB_PASSWORD)
- MinIO credentials (MINIO_ROOT_USER, MINIO_ROOT_PASSWORD)
- RabbitMQ credentials (RABBITMQ_USER, RABBITMQ_PASSWORD)
- JWT keys (JWT_PRIVATE_KEY, JWT_PUBLIC_KEY)
- Grafana admin password (GRAFANA_ADMIN_PASSWORD)

### 2. Build and Deploy

```bash
# Build Docker images
docker compose -f docker-compose.prod.yml --env-file .env.production build

# Start all services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check service health
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 3. Run Production Migrations

```bash
# After services are running, apply migrations
docker compose -f docker-compose.prod.yml exec api node dist/scripts/run-migrations.js
```

### 4. Create Admin User

```bash
docker compose -f docker-compose.prod.yml exec api node dist/scripts/seed-admin.js
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Application | http://localhost:80 | Main web application |
| Grafana | http://localhost:3001 | Monitoring dashboards |
| API Health | http://localhost:80/api/health | API health check |

## SSL/TLS Configuration

For HTTPS support:

1. Obtain SSL certificates (Let's Encrypt, commercial CA)
2. Mount certificates in the nginx container
3. Update nginx to use `default-ssl.conf.template`
4. Set `HTTP_PORT=443` in `.env.production`

See `docker/nginx/default-ssl.conf.template` for configuration details.

## Monitoring

The application includes a full monitoring stack:

- **Prometheus**: Metrics collection (http://localhost:9090)
- **Loki**: Log aggregation
- **Grafana**: Dashboards and visualization (http://localhost:3001)

Pre-built dashboards are included:
- API Overview: Request rates, latencies, error rates
- Business Metrics: Active projects, analyses, users
- Infrastructure: Container resources, database connections
- Logs: Centralized log viewing

## API Documentation

OpenAPI/Swagger documentation is available at:
- Development: http://localhost:4000/api-docs
- Production: http://localhost/api/api-docs

## Database Migrations

Migrations are tracked in the `hazop.schema_migrations` table.

```bash
# Check migration status
npm run db:migrate:status

# Run pending migrations
npm run db:migrate

# Preview migrations (dry run)
npm run db:migrate:dry-run
```

## Testing

### Unit Tests

```bash
# Backend tests
cd apps/api && npm test

# Frontend tests
cd apps/web && npm test
```

### E2E Tests

```bash
# Ensure services are running
docker compose up -d

# Start applications
cd apps/api && npm run dev &
cd apps/web && npm run dev &

# Run Playwright tests
npm run test:e2e
```

## Quality Gates

Run before committing:

```bash
# Backend
cd apps/api && npm run typecheck && npm run lint && npm test

# Frontend
cd apps/web && npm run typecheck && npm run lint && npm test

# E2E
npm run test:e2e
```

## Troubleshooting

### Database Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs hazop-postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Port Already in Use

```bash
# Find process using port (Windows)
netstat -ano | findstr :4000

# Find process using port (Linux/Mac)
lsof -i :4000

# Change port in .env (API)
PORT=4001

# Change port in vite.config.ts (Frontend)
```

### Reset Admin Password

```bash
# Connect to database
docker exec -it hazop-postgres psql -U hazop -d hazop

# Delete existing admin
DELETE FROM hazop.users WHERE email = 'admin@hazop.local';

# Exit and re-run seed script
\q
cd apps/api && npx tsx scripts/seed-admin.ts
```

## User Roles

| Role | Permissions |
|------|-------------|
| Administrator | Full system access, user management |
| Lead Analyst | Project management, analysis review/approval |
| Analyst | Conduct analyses, create reports |
| Viewer | Read-only access to projects and reports |

## License

Copyright © 2026 HazOp Systems. All rights reserved.
