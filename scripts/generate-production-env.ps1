# =============================================================================
# HazOp Assistant - Production Environment Generator (Windows PowerShell)
# =============================================================================
# This script generates a production-ready .env.production file with:
# - Secure random passwords for all services
# - Fresh RSA key pair for JWT authentication
# - Proper formatting for Docker Compose
#
# Usage:
#   .\scripts\generate-production-env.ps1
#
# Requirements:
#   - PowerShell 5.1+
#   - OpenSSL (install via: winget install openssl or choco install openssl)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  HazOp Production Environment Generator   " -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslPath) {
    Write-Host "Error: OpenSSL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install via: winget install openssl" -ForegroundColor Yellow
    Write-Host "Or: choco install openssl" -ForegroundColor Yellow
    exit 1
}

# Check if .env.production already exists
if (Test-Path ".env.production") {
    Write-Host "Warning: .env.production already exists!" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to overwrite it? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Aborted. No changes made."
        exit 0
    }
    Write-Host ""
}

# Function to generate random password
function Generate-Password {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $base64 = [Convert]::ToBase64String($bytes)
    return $base64.Substring(0, 24) -replace '[/+=]', ''
}

Write-Host "[1/4] Generating secure passwords..." -ForegroundColor Green

$DB_PASSWORD = Generate-Password
$MINIO_PASSWORD = Generate-Password
$RABBITMQ_PASSWORD = Generate-Password
$GRAFANA_PASSWORD = Generate-Password

Write-Host "  - Database password generated"
Write-Host "  - MinIO password generated"
Write-Host "  - RabbitMQ password generated"
Write-Host "  - Grafana password generated"
Write-Host ""

Write-Host "[2/4] Generating JWT RSA key pair..." -ForegroundColor Green

# Generate RSA keys
& openssl genrsa -out private.pem 2048 2>$null
& openssl rsa -in private.pem -pubout -out public.pem 2>$null

# Convert to single-line format for .env
$privateKeyContent = Get-Content "private.pem" -Raw
$publicKeyContent = Get-Content "public.pem" -Raw

# Replace newlines with literal \n for .env file
$JWT_PRIVATE_KEY = $privateKeyContent -replace "`r`n", "\n" -replace "`n", "\n"
$JWT_PRIVATE_KEY = $JWT_PRIVATE_KEY.TrimEnd("\n")

$JWT_PUBLIC_KEY = $publicKeyContent -replace "`r`n", "\n" -replace "`n", "\n"
$JWT_PUBLIC_KEY = $JWT_PUBLIC_KEY.TrimEnd("\n")

Write-Host "  - RSA private key generated (private.pem)"
Write-Host "  - RSA public key generated (public.pem)"
Write-Host ""

Write-Host "[3/4] Creating .env.production file..." -ForegroundColor Green

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"

$envContent = @"
# HazOp Assistant - Production Environment
# Generated: $timestamp
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
DB_PASSWORD=$DB_PASSWORD
DB_NAME=hazop_prod

# =============================================================================
# OBJECT STORAGE (MinIO)
# =============================================================================
MINIO_ROOT_USER=hazop_minio_admin
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_BUCKET=hazop-documents

# =============================================================================
# MESSAGE QUEUE (RabbitMQ)
# =============================================================================
RABBITMQ_USER=hazop_rabbit
RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD

# =============================================================================
# AUTHENTICATION (JWT RS256)
# =============================================================================
JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY
JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY
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
GRAFANA_ADMIN_PASSWORD=$GRAFANA_PASSWORD
GRAFANA_ROOT_URL=http://localhost:3001
"@

$envContent | Out-File -FilePath ".env.production" -Encoding utf8NoBOM

Write-Host "  - .env.production created"
Write-Host ""

Write-Host "[4/4] Cleaning up..." -ForegroundColor Green

# Keep the PEM files for backup/reference
if (-not (Test-Path "secrets")) {
    New-Item -ItemType Directory -Path "secrets" | Out-Null
}
Move-Item -Path "private.pem" -Destination "secrets\jwt-private.pem" -Force
Move-Item -Path "public.pem" -Destination "secrets\jwt-public.pem" -Force

Write-Host "  - JWT keys saved to secrets\ directory"
Write-Host ""

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  Production environment generated!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Generated files:"
Write-Host "  .env.production         - Environment variables" -ForegroundColor Yellow
Write-Host "  secrets\jwt-private.pem - JWT private key (backup)" -ForegroundColor Yellow
Write-Host "  secrets\jwt-public.pem  - JWT public key (backup)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Important:" -ForegroundColor Yellow
Write-Host "  1. Review and update values in .env.production as needed"
Write-Host "  2. Keep secrets\ directory secure (add to .gitignore)"
Write-Host "  3. Update GRAFANA_ROOT_URL to your actual domain"
Write-Host ""
Write-Host "To deploy:" -ForegroundColor Blue
Write-Host "  docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
Write-Host ""
Write-Host "To create initial admin user after deployment:" -ForegroundColor Blue
Write-Host "  docker exec -it hazop-api node scripts/seed-admin.js"
Write-Host ""

# Ensure secrets directory and .env.production are in .gitignore
$gitignorePath = ".gitignore"
$gitignoreContent = if (Test-Path $gitignorePath) { Get-Content $gitignorePath -Raw } else { "" }

$updated = $false

if ($gitignoreContent -notmatch "(?m)^secrets/") {
    Add-Content -Path $gitignorePath -Value "secrets/"
    Write-Host "Added 'secrets/' to .gitignore" -ForegroundColor Green
    $updated = $true
}

if ($gitignoreContent -notmatch "(?m)^\.env\.production$") {
    Add-Content -Path $gitignorePath -Value ".env.production"
    Write-Host "Added '.env.production' to .gitignore" -ForegroundColor Green
    $updated = $true
}
