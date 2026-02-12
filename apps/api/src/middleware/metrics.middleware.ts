/**
 * Prometheus metrics middleware for the HazOp API.
 *
 * Collects HTTP request metrics including:
 * - Request count (by method, path, status code)
 * - Request duration (histogram)
 *
 * Also provides custom business metrics registration.
 */
import { Request, Response, NextFunction } from 'express';
import client, {
  Counter,
  Histogram,
  Gauge,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

// Create a custom registry for our metrics
const register = new Registry();

// Add default Node.js metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register });

// HTTP request counter - counts total requests by method, route, and status
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram - measures request latency
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Active HTTP requests gauge
const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [register],
});

// Business metrics - Projects
const projectsTotal = new Gauge({
  name: 'hazop_projects_total',
  help: 'Total number of projects',
  labelNames: ['status'],
  registers: [register],
});

// Business metrics - Analyses
const analysesTotal = new Gauge({
  name: 'hazop_analyses_total',
  help: 'Total number of HazOp analyses',
  labelNames: ['status'],
  registers: [register],
});

// Business metrics - Risk entries by level
const riskEntriesByLevel = new Gauge({
  name: 'hazop_risk_entries_by_level',
  help: 'Number of analysis entries by risk level',
  labelNames: ['risk_level'],
  registers: [register],
});

// Business metrics - Documents uploaded
const documentsUploaded = new Counter({
  name: 'hazop_documents_uploaded_total',
  help: 'Total number of P&ID documents uploaded',
  registers: [register],
});

// Business metrics - Reports generated
const reportsGenerated = new Counter({
  name: 'hazop_reports_generated_total',
  help: 'Total number of reports generated',
  labelNames: ['format'],
  registers: [register],
});

// Business metrics - Active collaboration sessions
const activeCollaborationSessions = new Gauge({
  name: 'hazop_active_collaboration_sessions',
  help: 'Number of active collaboration sessions',
  registers: [register],
});

// Business metrics - Connected WebSocket clients
const connectedWebSocketClients = new Gauge({
  name: 'hazop_websocket_clients_connected',
  help: 'Number of connected WebSocket clients',
  registers: [register],
});

/**
 * Normalizes a request path to a route pattern.
 * Replaces UUIDs and numeric IDs with placeholders.
 */
function normalizeRoute(path: string): string {
  // Replace UUIDs with :id placeholder
  let normalized = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ':id'
  );
  // Replace numeric IDs with :id placeholder
  normalized = normalized.replace(/\/\d+(?=\/|$)/g, '/:id');
  return normalized;
}

/**
 * Express middleware that collects HTTP request metrics.
 * Should be added early in the middleware chain.
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip metrics endpoint itself to avoid recursion
  if (req.path === '/metrics') {
    next();
    return;
  }

  // Track in-flight requests
  httpRequestsInFlight.inc();

  // Start timer for request duration
  const startTime = process.hrtime.bigint();

  // Hook into response finish to record metrics
  res.on('finish', () => {
    httpRequestsInFlight.dec();

    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationSeconds = durationNs / 1e9;

    const route = normalizeRoute(req.path);
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record request count
    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    // Record request duration
    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      durationSeconds
    );
  });

  next();
}

/**
 * Returns the Prometheus registry for the metrics endpoint.
 */
export function getMetricsRegistry(): Registry {
  return register;
}

/**
 * Returns Prometheus metrics in text format.
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Returns the content type for Prometheus metrics.
 */
export function getMetricsContentType(): string {
  return register.contentType;
}

// Export individual metric collectors for use in other services
export const metrics = {
  // HTTP metrics (automatically collected by middleware)
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInFlight,

  // Business metrics (to be updated by services)
  projectsTotal,
  analysesTotal,
  riskEntriesByLevel,
  documentsUploaded,
  reportsGenerated,
  activeCollaborationSessions,
  connectedWebSocketClients,

  // Utility functions
  register,
  getMetrics,
  getMetricsContentType,
};

export default metricsMiddleware;
