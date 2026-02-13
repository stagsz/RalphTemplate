# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used in the HazOp Assistant application.

## Quick Start

### Development Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Generate JWT keys (see [Authentication](#authentication-jwt-with-rs256) section)

3. Start services:
   ```bash
   docker compose up -d
   npm run dev
   ```

### Production Setup

1. Copy the production example:
   ```bash
   cp .env.production.example .env.production
   ```

2. Generate new JWT keys (never reuse development keys!)

3. Update all `CHANGE_ME_*` placeholders with strong passwords

4. Deploy:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

---

## Variable Reference

### Project Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROJECT_NAME` | No | `hazop` | Project name used for Docker container naming and labels |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `VERSION` | No | `latest` | Docker image version tag for production builds |
| `REGISTRY` | No | *(empty)* | Container registry prefix (e.g., `ghcr.io/myorg/`) |

---

### Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | API server HTTP port |
| `HTTP_PORT` | No | `80` | Nginx reverse proxy port (production) |
| `CORS_ORIGIN` | No | `http://localhost:5174` | Allowed CORS origin for API requests |
| `FRONTEND_URL` | No | `http://localhost:5174` | Frontend URL for CORS in production |

---

### Database (PostgreSQL)

The application uses PostgreSQL 15+ as its primary database.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes* | `postgresql://hazop:devpassword@localhost:5432/hazop` | Full PostgreSQL connection string |
| `DB_HOST` | No | `localhost` | Database server hostname |
| `DB_PORT` | No | `5432` | Database server port |
| `DB_NAME` | No | `hazop` | Database name |
| `DB_USER` | No | `postgres` | Database username |
| `DB_PASSWORD` | No | `postgres` | Database password |
| `DB_SSL` | No | `false` | Enable SSL/TLS connection (`true`/`false`) |
| `DB_MAX_CONNECTIONS` | No | `10` | Maximum connection pool size |

**Note:** Either `DATABASE_URL` or individual `DB_*` variables can be used. Individual variables take precedence for connection configuration.

**Production recommendation:** Use `DB_MAX_CONNECTIONS=20` or higher based on expected load.

---

### Cache (Redis)

Redis 7.x is used for caching and session management.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | No | `redis://localhost:6379/0` | Full Redis connection URL |

The URL format is: `redis://[user:password@]host:port/database`

---

### Object Storage (MinIO)

MinIO provides S3-compatible storage for P&ID documents and generated reports.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINIO_ENDPOINT` | No | `localhost` | MinIO server hostname |
| `MINIO_PORT` | No | `9000` | MinIO server port |
| `MINIO_ROOT_USER` | No | `minioadmin` | MinIO admin username (access key) |
| `MINIO_ROOT_PASSWORD` | No | `minioadmin` | MinIO admin password (secret key) |
| `MINIO_BUCKET` | No | `hazop-documents` | Bucket name for storing documents |
| `MINIO_USE_SSL` | No | `false` | Enable TLS connection (`true`/`false`) |

**Production security:** Use credentials with at least 16 characters. Generate with:
```bash
openssl rand -base64 24
```

---

### Message Queue (RabbitMQ)

RabbitMQ 3.x handles asynchronous report generation jobs.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RABBITMQ_URL` | No | `amqp://hazop:devpassword@localhost:5672` | Full AMQP connection URL |
| `RABBITMQ_USER` | No | `hazop` | RabbitMQ username |
| `RABBITMQ_PASSWORD` | No | `devpassword` | RabbitMQ password |
| `RABBITMQ_REPORT_QUEUE` | No | `report-generation` | Queue name for report jobs |
| `RABBITMQ_REPORT_EXCHANGE` | No | `report-exchange` | Exchange name for report routing |
| `RABBITMQ_DLQ` | No | `report-generation-dlq` | Dead letter queue for failed jobs |
| `RABBITMQ_DLX` | No | `report-dlx` | Dead letter exchange |
| `RABBITMQ_PREFETCH` | No | `1` | Prefetch count for fair job dispatching |
| `RABBITMQ_RECONNECT_DELAY` | No | `5000` | Reconnection delay in milliseconds |

---

### Authentication (JWT with RS256)

The application uses RS256 asymmetric JWT signing for security.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_PRIVATE_KEY` | **Yes** | - | RSA private key in PEM format (with `\n` escapes) |
| `JWT_PUBLIC_KEY` | **Yes** | - | RSA public key in PEM format (with `\n` escapes) |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token lifetime |
| `JWT_ISSUER` | No | `hazop-assistant` | Token issuer claim (iss) |
| `JWT_AUDIENCE` | No | `hazop-api` | Token audience claim (aud) |

#### Generating JWT Keys

**Step 1: Generate a 2048-bit RSA private key**
```bash
openssl genrsa -out private.pem 2048
```

**Step 2: Extract the public key**
```bash
openssl rsa -in private.pem -pubout -out public.pem
```

**Step 3: Convert to single-line format for .env file**

Linux/macOS:
```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem
```

Windows PowerShell:
```powershell
(Get-Content private.pem -Raw) -replace "`r`n", "\n" -replace "`n", "\n"
(Get-Content public.pem -Raw) -replace "`r`n", "\n" -replace "`n", "\n"
```

**Step 4: Set in .env file**
```
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIj...\n-----END PUBLIC KEY-----
```

**Duration format:** Supports `s` (seconds), `m` (minutes), `h` (hours), `d` (days).
Examples: `15m`, `1h`, `7d`, `30d`

---

### WebSocket (Socket.io)

Real-time collaboration features use Socket.io for WebSocket connections.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOCKET_PING_TIMEOUT` | No | `20000` | Ping timeout in ms (connection considered dead if no pong) |
| `SOCKET_PING_INTERVAL` | No | `25000` | Ping interval in ms (how often to send keep-alive) |
| `SOCKET_MAX_BUFFER_SIZE` | No | `1048576` | Maximum HTTP buffer size (1MB default) |
| `SOCKET_CONNECT_TIMEOUT` | No | `45000` | Initial connection timeout in ms |

---

### Logging & Monitoring

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `debug` (dev) / `info` (prod) | Winston log level |
| `LOKI_HOST` | No | - | Loki server URL for log aggregation (e.g., `http://loki:3100`) |
| `LOKI_BATCH_SIZE` | No | `10` | Number of logs to batch before sending to Loki |
| `LOKI_BATCH_INTERVAL` | No | `1000` | Batch flush interval in milliseconds |

**Available log levels** (in order of severity):
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages (recommended for production)
- `http` - HTTP request logging
- `debug` - Debug information (recommended for development)

---

### Monitoring Dashboard (Grafana)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GRAFANA_ADMIN_USER` | No | `admin` | Grafana administrator username |
| `GRAFANA_ADMIN_PASSWORD` | No | `admin` | Grafana administrator password |
| `GRAFANA_ROOT_URL` | No | `http://localhost:3001` | Public URL for Grafana |
| `GRAFANA_PORT` | No | `3001` | Grafana server port |

**Production security:** Change the default admin credentials immediately after deployment.

---

### Frontend (Vite)

Frontend environment variables must be prefixed with `VITE_` to be exposed to the client bundle.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:4000` | Backend API URL |
| `VITE_WS_URL` | No | *(uses VITE_API_URL)* | WebSocket server URL (if different from API) |

**Note:** These variables are embedded at build time. Changes require rebuilding the frontend.

---

## Docker Compose Configuration

### Development (docker-compose.yml)

The development Docker Compose file reads variables from the root `.env` file. Services are configured with internal networking:

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
```

### Production (docker-compose.prod.yml)

Production uses `.env.production` and configures services with:
- Internal Docker networking (services reference each other by hostname)
- Healthchecks for all services
- Resource limits
- Persistent volumes

Example internal service references:
```yaml
# API service environment
DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
REDIS_URL: redis://redis:6379/0
```

---

## Environment Files

| File | Purpose | Git tracked |
|------|---------|-------------|
| `.env` | Development configuration | **No** |
| `.env.example` | Development template | Yes |
| `.env.production` | Production configuration | **No** |
| `.env.production.example` | Production template | Yes |
| `.env.test` | Test configuration | Optional |
| `apps/api/.env` | API-specific overrides | **No** |

---

## Security Checklist

Before deploying to production:

- [ ] Generated new JWT RSA key pair (never reuse development keys)
- [ ] Changed all default passwords (`CHANGE_ME_*` placeholders)
- [ ] Set `DB_PASSWORD` to a strong unique value (16+ characters)
- [ ] Set `MINIO_ROOT_PASSWORD` to a strong unique value
- [ ] Set `RABBITMQ_PASSWORD` to a strong unique value
- [ ] Set `GRAFANA_ADMIN_PASSWORD` to a strong unique value
- [ ] Configured `FRONTEND_URL` with actual domain
- [ ] Set `LOG_LEVEL=info` or `warn` for production
- [ ] Reviewed firewall rules for internal service ports
- [ ] Configured SSL/TLS or use a load balancer with SSL termination

Generate strong passwords:
```bash
openssl rand -base64 24
```

---

## Troubleshooting

### JWT Key Issues

**Error:** `JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables must be set`

**Solution:** Ensure the keys are properly formatted with `\n` escape sequences (not actual newlines) in the .env file.

### Database Connection Failed

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solutions:**
1. Ensure PostgreSQL is running: `docker compose ps`
2. Check `DATABASE_URL` or `DB_HOST` points to correct hostname
3. In Docker, use `postgres` (service name) instead of `localhost`

### MinIO Connection Failed

**Error:** `S3: Access Denied`

**Solutions:**
1. Verify `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` match MinIO service configuration
2. Ensure the bucket exists or `MINIO_BUCKET` is correct
3. Check MinIO is running: `docker compose ps`

### RabbitMQ Connection Failed

**Error:** `ECONNREFUSED` or `ACCESS_REFUSED`

**Solutions:**
1. Verify `RABBITMQ_URL` contains correct credentials
2. Ensure RabbitMQ is running: `docker compose ps`
3. In Docker, use `rabbitmq` hostname instead of `localhost`

### Loki Logs Not Appearing

**Solutions:**
1. Verify `LOKI_HOST` is reachable from the API container
2. Check Loki container logs: `docker compose logs loki`
3. Ensure `LOG_LEVEL` allows the logs you expect to see
