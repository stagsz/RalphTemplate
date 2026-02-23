/**
 * Socket.io configuration for real-time collaboration.
 *
 * Provides configuration settings for WebSocket connections,
 * including CORS, timeouts, and connection limits.
 */

import type { CorsOptions } from 'cors';

/**
 * Socket.io server configuration.
 */
export interface SocketConfig {
  /** CORS configuration (same as Express) */
  cors: CorsOptions;

  /** Ping timeout in milliseconds */
  pingTimeout: number;

  /** Ping interval in milliseconds */
  pingInterval: number;

  /** Maximum HTTP buffer size for payloads */
  maxHttpBufferSize: number;

  /** Connection timeout in milliseconds */
  connectTimeout: number;

  /** Allow upgrades from HTTP to WebSocket */
  allowUpgrades: boolean;

  /** Transports to use */
  transports: ('polling' | 'websocket')[];
}

/**
 * Load Socket.io configuration from environment variables.
 */
export function loadSocketConfig(): SocketConfig {
  // CORS configuration matching Express app
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : /^http:\/\/localhost:\d+$/;

  return {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Ping timeout: how long to wait for pong response before considering connection dead
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '20000', 10),
    // Ping interval: how often to send ping packets
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
    // Max HTTP buffer size: 1MB default, prevents large payload attacks
    maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_BUFFER_SIZE || '1048576', 10),
    // Connection timeout: how long to wait for initial connection
    connectTimeout: parseInt(process.env.SOCKET_CONNECT_TIMEOUT || '45000', 10),
    // Allow protocol upgrades
    allowUpgrades: true,
    // Start with polling for compatibility, upgrade to websocket
    transports: ['polling', 'websocket'],
  };
}

/**
 * Default socket configuration.
 */
export const defaultSocketConfig = loadSocketConfig();
