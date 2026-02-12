/**
 * Report queue service for async report generation.
 *
 * Provides methods to enqueue report generation jobs and consume them.
 * Uses RabbitMQ for reliable message delivery with dead letter queues
 * for failed message handling.
 */

import {
  getChannel,
  getReportQueueName,
  getReportExchangeName,
  loadRabbitMQConfig,
} from '../config/rabbitmq.config.js';
import type {
  ReportFormat,
  ReportParameters,
} from '@hazop/types';

/**
 * Report generation job message structure.
 * This is the payload sent to the queue.
 */
export interface ReportJobMessage {
  /** Unique job ID (same as report ID) */
  jobId: string;

  /** ID of the report record in the database */
  reportId: string;

  /** ID of the HazOps analysis to generate report from */
  analysisId: string;

  /** ID of the project containing the analysis */
  projectId: string;

  /** Output format for the report */
  format: ReportFormat;

  /** Template identifier to use */
  template: string;

  /** Report name */
  name: string;

  /** Report generation parameters */
  parameters: ReportParameters;

  /** ID of the user who requested the report */
  requestedById: string;

  /** Timestamp when the job was created */
  createdAt: string;

  /** Number of retry attempts (starts at 0) */
  retryCount: number;

  /** Priority level (higher = more urgent, default = 0) */
  priority: number;
}

/**
 * Options for enqueuing a report job.
 */
export interface EnqueueOptions {
  /** Priority level (higher = more urgent, default = 0) */
  priority?: number;

  /** Message TTL in milliseconds (optional) */
  expiration?: number;
}

/**
 * Result from consuming a report job.
 */
export interface ConsumeResult {
  /** The job message */
  job: ReportJobMessage;

  /** Acknowledge the message as successfully processed */
  ack: () => void;

  /** Reject the message (requeue or dead-letter based on requeue flag) */
  nack: (requeue?: boolean) => void;
}

/**
 * Report queue service class for managing report generation jobs.
 */
export class ReportQueueService {
  /**
   * Enqueue a report generation job.
   *
   * @param job - The report job message
   * @param options - Optional queue options
   * @returns True if the message was successfully published
   */
  async enqueue(job: ReportJobMessage, options?: EnqueueOptions): Promise<boolean> {
    const channel = await getChannel();
    const exchangeName = getReportExchangeName();
    const queueName = getReportQueueName();

    const messageBuffer = Buffer.from(JSON.stringify(job));

    const publishOptions: Record<string, unknown> = {
      persistent: true, // Survive broker restarts
      contentType: 'application/json',
      timestamp: Date.now(),
      messageId: job.jobId,
      priority: options?.priority ?? job.priority ?? 0,
    };

    if (options?.expiration) {
      publishOptions.expiration = String(options.expiration);
    }

    return channel.publish(
      exchangeName,
      queueName,
      messageBuffer,
      publishOptions
    );
  }

  /**
   * Get the number of messages waiting in the report queue.
   *
   * @returns The message count
   */
  async getQueueLength(): Promise<number> {
    const channel = await getChannel();
    const queueName = getReportQueueName();

    const queueInfo = await channel.checkQueue(queueName);
    return queueInfo.messageCount;
  }

  /**
   * Get the number of messages in the dead letter queue.
   *
   * @returns The dead letter message count
   */
  async getDeadLetterQueueLength(): Promise<number> {
    const channel = await getChannel();
    const config = loadRabbitMQConfig();

    const queueInfo = await channel.checkQueue(config.deadLetterQueue);
    return queueInfo.messageCount;
  }

  /**
   * Start consuming report generation jobs.
   *
   * @param handler - Callback function to process each job
   * @returns Consumer tag for cancellation
   */
  async consume(
    handler: (result: ConsumeResult) => Promise<void>
  ): Promise<string> {
    const channel = await getChannel();
    const queueName = getReportQueueName();

    const consumer = await channel.consume(queueName, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const job: ReportJobMessage = JSON.parse(msg.content.toString());

        const result: ConsumeResult = {
          job,
          ack: () => channel.ack(msg),
          nack: (requeue = false) => channel.nack(msg, false, requeue),
        };

        await handler(result);
      } catch (error) {
        console.error('Error processing report job:', error);
        // Don't requeue malformed messages
        channel.nack(msg, false, false);
      }
    });

    return consumer.consumerTag;
  }

  /**
   * Cancel a consumer.
   *
   * @param consumerTag - The consumer tag returned from consume()
   */
  async cancelConsumer(consumerTag: string): Promise<void> {
    const channel = await getChannel();
    await channel.cancel(consumerTag);
  }

  /**
   * Purge all messages from the report queue.
   * Use with caution - this will delete all pending jobs.
   *
   * @returns The number of messages purged
   */
  async purgeQueue(): Promise<number> {
    const channel = await getChannel();
    const queueName = getReportQueueName();

    const result = await channel.purgeQueue(queueName);
    return result.messageCount;
  }

  /**
   * Purge all messages from the dead letter queue.
   *
   * @returns The number of messages purged
   */
  async purgeDeadLetterQueue(): Promise<number> {
    const channel = await getChannel();
    const config = loadRabbitMQConfig();

    const result = await channel.purgeQueue(config.deadLetterQueue);
    return result.messageCount;
  }

  /**
   * Move a message from dead letter queue back to the main queue.
   * This is useful for retrying failed jobs after fixing issues.
   *
   * @returns True if a message was moved, false if DLQ is empty
   */
  async retryDeadLetter(): Promise<boolean> {
    const channel = await getChannel();
    const config = loadRabbitMQConfig();

    const msg = await channel.get(config.deadLetterQueue, { noAck: false });

    if (!msg) {
      return false;
    }

    try {
      const job: ReportJobMessage = JSON.parse(msg.content.toString());

      // Increment retry count
      job.retryCount = (job.retryCount || 0) + 1;

      // Re-enqueue to main queue
      const success = await this.enqueue(job);

      if (success) {
        channel.ack(msg);
        return true;
      } else {
        channel.nack(msg, false, true);
        return false;
      }
    } catch (error) {
      console.error('Error retrying dead letter:', error);
      channel.nack(msg, false, true);
      return false;
    }
  }
}

/**
 * Singleton instance of the report queue service.
 */
let reportQueueService: ReportQueueService | null = null;

/**
 * Get the singleton report queue service instance.
 */
export function getReportQueueService(): ReportQueueService {
  if (!reportQueueService) {
    reportQueueService = new ReportQueueService();
  }
  return reportQueueService;
}

/**
 * Reset the report queue service instance.
 * Useful for testing.
 */
export function resetReportQueueService(): void {
  reportQueueService = null;
}

/**
 * Create a report job message from creation parameters.
 *
 * @param params - The parameters for creating a report job
 * @returns A fully formed report job message
 */
export function createReportJobMessage(params: {
  reportId: string;
  analysisId: string;
  projectId: string;
  format: ReportFormat;
  template: string;
  name: string;
  parameters: ReportParameters;
  requestedById: string;
  priority?: number;
}): ReportJobMessage {
  return {
    jobId: params.reportId,
    reportId: params.reportId,
    analysisId: params.analysisId,
    projectId: params.projectId,
    format: params.format,
    template: params.template,
    name: params.name,
    parameters: params.parameters,
    requestedById: params.requestedById,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    priority: params.priority ?? 0,
  };
}
