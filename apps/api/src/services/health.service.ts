/**
 * Health check service for monitoring service dependencies.
 *
 * Provides comprehensive health checks for:
 * - Database (PostgreSQL)
 * - Object storage (MinIO)
 * - Message queue (RabbitMQ)
 *
 * Used by Kubernetes/Docker health probes:
 * - /health - Overall health (all checks)
 * - /health/ready - Readiness probe (can accept traffic)
 * - /health/live - Liveness probe (is alive)
 */

import { testConnection as testDatabaseConnection } from '../config/database.config.js';
import { testMinIOConnection } from '../config/minio.config.js';
import { testRabbitMQConnection } from '../config/rabbitmq.config.js';
import { createLogger } from '../utils/logger.js';
import type { HealthStatus, ServiceHealth, HealthCheckResponse } from '@hazop/types';

const log = createLogger({ service: 'health' });

/**
 * Application start time for uptime calculation.
 */
const startTime = Date.now();

/**
 * Get the application version from package.json.
 */
function getVersion(): string {
  return process.env.npm_package_version || '0.0.1';
}

/**
 * Get application uptime in seconds.
 */
function getUptime(): number {
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Check a single service and return health result.
 *
 * @param name - Service name for identification
 * @param checkFn - Async function that returns true if healthy
 * @returns ServiceHealth result with timing
 */
async function checkService(
  name: string,
  checkFn: () => Promise<boolean>
): Promise<ServiceHealth> {
  const startMs = Date.now();

  try {
    const isHealthy = await Promise.race([
      checkFn(),
      new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), 5000) // 5 second timeout
      ),
    ]);

    const responseTime = Date.now() - startMs;

    if (isHealthy) {
      return {
        name,
        status: 'healthy',
        responseTime,
      };
    }

    return {
      name,
      status: 'unhealthy',
      responseTime,
      message: 'Service check returned false or timed out',
    };
  } catch (error) {
    const responseTime = Date.now() - startMs;

    log.error(`Health check failed for ${name}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      name,
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check PostgreSQL database connectivity.
 */
export async function checkDatabase(): Promise<ServiceHealth> {
  return checkService('database', testDatabaseConnection);
}

/**
 * Check MinIO object storage connectivity.
 */
export async function checkStorage(): Promise<ServiceHealth> {
  return checkService('storage', testMinIOConnection);
}

/**
 * Check RabbitMQ message queue connectivity.
 */
export async function checkMessageQueue(): Promise<ServiceHealth> {
  return checkService('messageQueue', testRabbitMQConnection);
}

/**
 * Determine overall health status from individual service health.
 *
 * - healthy: All services are healthy
 * - degraded: Some non-critical services are unhealthy
 * - unhealthy: Critical services (database) are unhealthy
 */
function determineOverallStatus(services: ServiceHealth[]): HealthStatus {
  // Database is critical - if it's down, we're unhealthy
  const database = services.find((s) => s.name === 'database');
  if (database && database.status === 'unhealthy') {
    return 'unhealthy';
  }

  // If any service is unhealthy (but not database), we're degraded
  const hasUnhealthy = services.some((s) => s.status === 'unhealthy');
  if (hasUnhealthy) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Perform comprehensive health check of all services.
 *
 * Checks all dependencies in parallel for efficiency.
 */
export async function performHealthCheck(): Promise<HealthCheckResponse> {
  // Run all checks in parallel
  const [database, storage, messageQueue] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkMessageQueue(),
  ]);

  const services = [database, storage, messageQueue];
  const status = determineOverallStatus(services);

  return {
    status,
    version: getVersion(),
    timestamp: new Date().toISOString(),
    services,
    uptime: getUptime(),
  };
}

/**
 * Readiness check - can the service accept traffic?
 *
 * Checks only critical dependencies (database).
 * Used by Kubernetes readiness probes.
 */
export async function checkReadiness(): Promise<{
  ready: boolean;
  status: HealthStatus;
  checks: ServiceHealth[];
}> {
  // For readiness, we only need database connectivity
  const database = await checkDatabase();

  const ready = database.status === 'healthy';
  const status: HealthStatus = ready ? 'healthy' : 'unhealthy';

  return {
    ready,
    status,
    checks: [database],
  };
}

/**
 * Liveness check - is the service alive?
 *
 * Simple check that the process is responding.
 * Does not check external dependencies.
 * Used by Kubernetes liveness probes.
 */
export function checkLiveness(): {
  alive: boolean;
  uptime: number;
  timestamp: string;
} {
  return {
    alive: true,
    uptime: getUptime(),
    timestamp: new Date().toISOString(),
  };
}
