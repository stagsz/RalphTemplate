/**
 * Database configuration for PostgreSQL connection.
 *
 * Uses the 'pg' library with a connection pool for efficient
 * database operations. Configured via environment variables.
 */

import pg from 'pg';
import { createLogger } from '../utils/logger.js';

const log = createLogger({ service: 'database' });

const { Pool } = pg;

/**
 * Database configuration loaded from environment variables.
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections: number;
}

/**
 * Load database configuration from environment variables.
 */
export function loadDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'hazop',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  };
}

/**
 * PostgreSQL connection pool.
 * Singleton instance for application-wide use.
 */
let pool: pg.Pool | null = null;

/**
 * Get or create the database connection pool.
 */
export function getPool(): pg.Pool {
  if (!pool) {
    const config = loadDatabaseConfig();
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      max: config.maxConnections,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      log.error('Unexpected database pool error', { error: err.message, stack: err.stack });
    });
  }

  return pool;
}

/**
 * Close the database connection pool.
 * Call this when shutting down the application.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test the database connection.
 * Returns true if connection is successful.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const p = getPool();
    const result = await p.query('SELECT 1 as connected');
    return result.rows[0]?.connected === 1;
  } catch (error) {
    log.error('Database connection test failed', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}
