/**
 * RabbitMQ configuration for async report generation queue.
 *
 * Uses the 'amqplib' library for connecting to RabbitMQ.
 * Configured via environment variables.
 */

import amqp from 'amqplib';
import { createLogger } from '../utils/logger.js';

const log = createLogger({ service: 'rabbitmq' });

/**
 * RabbitMQ configuration loaded from environment variables.
 */
export interface RabbitMQConfig {
  url: string;
  user: string;
  password: string;
  reportQueue: string;
  reportExchange: string;
  deadLetterQueue: string;
  deadLetterExchange: string;
  prefetchCount: number;
  reconnectDelay: number;
}

/**
 * Load RabbitMQ configuration from environment variables.
 */
export function loadRabbitMQConfig(): RabbitMQConfig {
  return {
    url: process.env.RABBITMQ_URL || 'amqp://hazop:devpassword@localhost:5672',
    user: process.env.RABBITMQ_USER || 'hazop',
    password: process.env.RABBITMQ_PASSWORD || 'devpassword',
    reportQueue: process.env.RABBITMQ_REPORT_QUEUE || 'report-generation',
    reportExchange: process.env.RABBITMQ_REPORT_EXCHANGE || 'report-exchange',
    deadLetterQueue: process.env.RABBITMQ_DLQ || 'report-generation-dlq',
    deadLetterExchange: process.env.RABBITMQ_DLX || 'report-dlx',
    prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH || '1', 10),
    reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY || '5000', 10),
  };
}

/**
 * RabbitMQ connection instance.
 * Singleton for application-wide use.
 */
let connection: amqp.Connection | null = null;

/**
 * RabbitMQ channel instance.
 * Singleton for application-wide use.
 */
let channel: amqp.Channel | null = null;

/**
 * Flag to prevent multiple reconnection attempts.
 */
let isConnecting = false;

/**
 * Get or create the RabbitMQ connection.
 */
export async function getConnection(): Promise<amqp.Connection> {
  if (connection && !isConnecting) {
    return connection;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (connection) {
      return connection;
    }
    throw new Error('RabbitMQ connection failed during wait');
  }

  isConnecting = true;

  try {
    const config = loadRabbitMQConfig();
    connection = await amqp.connect(config.url);

    // Handle connection errors
    connection.on('error', (err) => {
      log.error('RabbitMQ connection error', { error: err.message, stack: err.stack });
      connection = null;
      channel = null;
    });

    // Handle connection close
    connection.on('close', () => {
      log.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    return connection;
  } finally {
    isConnecting = false;
  }
}

/**
 * Get or create the RabbitMQ channel.
 * Sets up the report generation queue and exchanges.
 */
export async function getChannel(): Promise<amqp.Channel> {
  if (channel) {
    return channel;
  }

  const conn = await getConnection();
  const config = loadRabbitMQConfig();

  channel = await conn.createChannel();

  // Set prefetch count for fair dispatching
  await channel.prefetch(config.prefetchCount);

  // Set up dead letter exchange and queue for failed messages
  await channel.assertExchange(config.deadLetterExchange, 'direct', {
    durable: true,
  });

  await channel.assertQueue(config.deadLetterQueue, {
    durable: true,
  });

  await channel.bindQueue(
    config.deadLetterQueue,
    config.deadLetterExchange,
    config.reportQueue
  );

  // Set up main report exchange
  await channel.assertExchange(config.reportExchange, 'direct', {
    durable: true,
  });

  // Set up main report queue with dead letter configuration
  await channel.assertQueue(config.reportQueue, {
    durable: true,
    deadLetterExchange: config.deadLetterExchange,
    deadLetterRoutingKey: config.reportQueue,
  });

  await channel.bindQueue(
    config.reportQueue,
    config.reportExchange,
    config.reportQueue
  );

  // Handle channel errors
  channel.on('error', (err) => {
    log.error('RabbitMQ channel error', { error: err.message, stack: err.stack });
    channel = null;
  });

  // Handle channel close
  channel.on('close', () => {
    log.warn('RabbitMQ channel closed');
    channel = null;
  });

  return channel;
}

/**
 * Close the RabbitMQ channel.
 */
export async function closeChannel(): Promise<void> {
  if (channel) {
    try {
      await channel.close();
    } catch (error) {
      // Channel may already be closed
      log.warn('Error closing RabbitMQ channel', { error: error instanceof Error ? error.message : String(error) });
    }
    channel = null;
  }
}

/**
 * Close the RabbitMQ connection.
 * Call this when shutting down the application.
 */
export async function closeConnection(): Promise<void> {
  await closeChannel();

  if (connection) {
    try {
      await connection.close();
    } catch (error) {
      // Connection may already be closed
      log.warn('Error closing RabbitMQ connection', { error: error instanceof Error ? error.message : String(error) });
    }
    connection = null;
  }
}

/**
 * Test the RabbitMQ connection.
 * Returns true if connection is successful.
 */
export async function testRabbitMQConnection(): Promise<boolean> {
  try {
    const conn = await getConnection();
    // Check if connection is usable by creating and closing a channel
    const testChannel = await conn.createChannel();
    await testChannel.close();
    return true;
  } catch (error) {
    log.error('RabbitMQ connection test failed', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Reset the RabbitMQ connection and channel.
 * Useful for testing or reconnection scenarios.
 */
export async function resetRabbitMQConnection(): Promise<void> {
  await closeConnection();
}

/**
 * Get the report queue name from config.
 */
export function getReportQueueName(): string {
  return loadRabbitMQConfig().reportQueue;
}

/**
 * Get the report exchange name from config.
 */
export function getReportExchangeName(): string {
  return loadRabbitMQConfig().reportExchange;
}
