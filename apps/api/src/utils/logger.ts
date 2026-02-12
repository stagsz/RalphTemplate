/**
 * Winston structured logging utility for the HazOp API.
 *
 * Provides centralized logging with:
 * - Structured JSON format for production (machine-parseable)
 * - Colorized console format for development (human-readable)
 * - Log levels: error, warn, info, http, debug
 * - Automatic timestamp and metadata enrichment
 * - Child loggers for service-specific context
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Log levels in order of severity (lowest number = highest severity).
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Colors for each log level in development.
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

/**
 * Get the current log level based on environment.
 * Production defaults to 'info', development defaults to 'debug'.
 */
function getLogLevel(): string {
  const env = process.env.NODE_ENV || 'development';
  const level = process.env.LOG_LEVEL;

  if (level) {
    return level;
  }

  return env === 'production' ? 'info' : 'debug';
}

/**
 * Development format: colorized, human-readable output.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, service, requestId, ...meta }) => {
    const serviceStr = service ? `[${service}]` : '';
    const requestIdStr = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return `${timestamp} ${level} ${serviceStr}${requestIdStr} ${message}${metaStr}`;
  })
);

/**
 * Production format: structured JSON for log aggregation systems (Loki, etc.).
 */
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

/**
 * Determine which format to use based on environment.
 */
function getFormat() {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? prodFormat : devFormat;
}

/**
 * Create the main Winston logger instance.
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  format: getFormat(),
  defaultMeta: { service: 'hazop-api' },
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

/**
 * Logger interface for type safety.
 */
export interface Logger {
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  http(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): Logger;
}

/**
 * Wrap Winston logger to provide a cleaner interface.
 */
function wrapLogger(winstonLogger: winston.Logger): Logger {
  return {
    error: (message: string, meta?: Record<string, unknown>) => {
      winstonLogger.error(message, meta);
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      winstonLogger.warn(message, meta);
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      winstonLogger.info(message, meta);
    },
    http: (message: string, meta?: Record<string, unknown>) => {
      winstonLogger.log('http', message, meta);
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      winstonLogger.debug(message, meta);
    },
    child: (meta: Record<string, unknown>): Logger => {
      return wrapLogger(winstonLogger.child(meta));
    },
  };
}

/**
 * Export the wrapped logger instance.
 */
export const log = wrapLogger(logger);

/**
 * Create a child logger with additional context (e.g., service name, request ID).
 *
 * @example
 * const authLogger = createLogger({ service: 'auth' });
 * authLogger.info('User logged in', { userId: '123' });
 */
export function createLogger(meta: Record<string, unknown>): Logger {
  return log.child(meta);
}

export default log;
