#!/bin/bash
# =============================================================================
# HazOp Assistant - Production Environment Generator
# =============================================================================
# This script generates a production-ready .env.production file with:
# - Secure random passwords for all services
# - Fresh RSA key pair for JWT authentication
# - Proper formatting for Docker Compose
#
# Usage:
#   chmod +x scripts/generate-production-env.sh
#   ./scripts/generate-production-env.sh
#
# The script will:
#   1. Generate a new .env.production file
#   2. Create JWT keys (private.pem, public.pem)
#   3. Output instructions for deployment
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  HazOp Production Environment Generator   ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if .env.production already exists
if [ -f ".env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Aborted. No changes made."
        exit 0
    fi
    echo ""
fi

# Function to generate random password
generate_password() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 24
}

echo -e "${GREEN}[1/4]${NC} Generating secure passwords..."

DB_PASSWORD=$(generate_password)
MINIO_PASSWORD=$(generate_password)
RABBITMQ_PASSWORD=$(generate_password)
GRAFANA_PASSWORD=$(generate_password)

echo "  - Database password generated"
echo "  - MinIO password generated"
echo "  - RabbitMQ password generated"
echo "  - Grafana password generated"
echo ""

echo -e "${GREEN}[2/4]${NC} Generating JWT RSA key pair..."

# Generate RSA keys
openssl genrsa -out private.pem 2048 2>/dev/null
openssl rsa -in private.pem -pubout -out public.pem 2>/dev/null

# Convert to single-line format for .env
JWT_PRIVATE_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem)
JWT_PUBLIC_KEY=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem)

echo "  - RSA private key generated (private.pem)"
echo "  - RSA public key generated (public.pem)"
echo ""

echo -e "${GREEN}[3/4]${NC} Creating .env.production file..."

cat > .env.production << EOF
# HazOp Assistant - Production Environment
# Generated: $(date -Iseconds)
# =============================================================================
# SECURITY NOTICE: Keep this file secure and never commit to version control!
# =============================================================================

# =============================================================================
# PROJECT SETTINGS
# =============================================================================
PROJECT_NAME=hazop
VERSION=latest
REGISTRY=

# =============================================================================
# NETWORK CONFIGURATION
# =============================================================================
HTTP_PORT=80
GRAFANA_PORT=3001

# =============================================================================
# DATABASE (PostgreSQL)
# =============================================================================
DB_USER=hazop_prod
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=hazop_prod

# =============================================================================
# OBJECT STORAGE (MinIO)
# =============================================================================
MINIO_ROOT_USER=hazop_minio_admin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
MINIO_BUCKET=hazop-documents

# =============================================================================
# MESSAGE QUEUE (RabbitMQ)
# =============================================================================
RABBITMQ_USER=hazop_rabbit
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}

# =============================================================================
# AUTHENTICATION (JWT RS256)
# =============================================================================
JWT_PRIVATE_KEY=${JWT_PRIVATE_KEY}
JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=hazop-assistant
JWT_AUDIENCE=hazop-api

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=info

# =============================================================================
# MONITORING (Grafana)
# =============================================================================
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
GRAFANA_ROOT_URL=http://localhost:3001
EOF

echo "  - .env.production created"
echo ""

echo -e "${GREEN}[4/4]${NC} Cleaning up..."
# Keep the PEM files for backup/reference
mkdir -p secrets
mv private.pem secrets/jwt-private.pem
mv public.pem secrets/jwt-public.pem
echo "  - JWT keys saved to secrets/ directory"
echo ""

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}  Production environment generated!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Generated files:"
echo -e "  ${YELLOW}.env.production${NC}        - Environment variables"
echo -e "  ${YELLOW}secrets/jwt-private.pem${NC} - JWT private key (backup)"
echo -e "  ${YELLOW}secrets/jwt-public.pem${NC}  - JWT public key (backup)"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  1. Review and update values in .env.production as needed"
echo "  2. Keep secrets/ directory secure (add to .gitignore)"
echo "  3. Update GRAFANA_ROOT_URL to your actual domain"
echo ""
echo -e "${BLUE}To deploy:${NC}"
echo "  docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
echo ""
echo -e "${BLUE}To create initial admin user after deployment:${NC}"
echo "  docker exec -it hazop-api node scripts/seed-admin.js"
echo ""

# Ensure secrets directory is in .gitignore
if ! grep -q "^secrets/" .gitignore 2>/dev/null; then
    echo "secrets/" >> .gitignore
    echo -e "${GREEN}Added 'secrets/' to .gitignore${NC}"
fi

if ! grep -q "^.env.production$" .gitignore 2>/dev/null; then
    echo ".env.production" >> .gitignore
    echo -e "${GREEN}Added '.env.production' to .gitignore${NC}"
fi
