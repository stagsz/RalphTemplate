# HazOp Web - Production Dockerfile
# Multi-stage build: Build with Node, serve with Nginx

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time environment variable for API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace package files for dependency installation
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# Install dependencies
RUN npm ci --workspace=@hazop/web --workspace=@hazop/types --workspace=@hazop/utils

# Copy source code
COPY apps/web ./apps/web
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY tsconfig.base.json ./

# Build shared packages first
WORKDIR /app/packages/types
RUN npm run build

WORKDIR /app/packages/utils
RUN npm run build

# Build web app
WORKDIR /app/apps/web
RUN npm run build

# Stage 2: Production runtime with Nginx
FROM nginx:1.25-alpine AS runtime

# Copy custom nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Create nginx cache and temp directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
