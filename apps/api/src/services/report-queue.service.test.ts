/**
 * Tests for Report Queue Service.
 *
 * These tests mock the RabbitMQ channel to test the service logic
 * without requiring a real RabbitMQ connection.
 */

import {
  createReportJobMessage,
  getReportQueueService,
  resetReportQueueService,
  type ReportJobMessage,
} from './report-queue.service.js';

// Mock the RabbitMQ config module
jest.mock('../config/rabbitmq.config.js', () => ({
  getChannel: jest.fn(),
  getReportQueueName: jest.fn(() => 'report-generation'),
  getReportExchangeName: jest.fn(() => 'report-exchange'),
  loadRabbitMQConfig: jest.fn(() => ({
    url: 'amqp://localhost:5672',
    user: 'hazop',
    password: 'devpassword',
    reportQueue: 'report-generation',
    reportExchange: 'report-exchange',
    deadLetterQueue: 'report-generation-dlq',
    deadLetterExchange: 'report-dlx',
    prefetchCount: 1,
    reconnectDelay: 5000,
  })),
}));

describe('Report Queue Service', () => {
  let mockChannel: {
    publish: jest.Mock;
    checkQueue: jest.Mock;
    consume: jest.Mock;
    cancel: jest.Mock;
    purgeQueue: jest.Mock;
    get: jest.Mock;
    ack: jest.Mock;
    nack: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    resetReportQueueService();

    mockChannel = {
      publish: jest.fn(() => true),
      checkQueue: jest.fn(() => ({ messageCount: 5 })),
      consume: jest.fn(() => ({ consumerTag: 'test-consumer' })),
      cancel: jest.fn(),
      purgeQueue: jest.fn(() => ({ messageCount: 3 })),
      get: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    };

    const { getChannel } = await import('../config/rabbitmq.config.js');
    (getChannel as jest.Mock).mockResolvedValue(mockChannel);
  });

  describe('createReportJobMessage', () => {
    it('should create a valid report job message', () => {
      const params = {
        reportId: 'report-123',
        analysisId: 'analysis-456',
        projectId: 'project-789',
        format: 'pdf' as const,
        template: 'default',
        name: 'Test Report',
        parameters: { includeRiskMatrix: true },
        requestedById: 'user-001',
      };

      const job = createReportJobMessage(params);

      expect(job.jobId).toBe('report-123');
      expect(job.reportId).toBe('report-123');
      expect(job.analysisId).toBe('analysis-456');
      expect(job.projectId).toBe('project-789');
      expect(job.format).toBe('pdf');
      expect(job.template).toBe('default');
      expect(job.name).toBe('Test Report');
      expect(job.parameters).toEqual({ includeRiskMatrix: true });
      expect(job.requestedById).toBe('user-001');
      expect(job.retryCount).toBe(0);
      expect(job.priority).toBe(0);
      expect(job.createdAt).toBeDefined();
    });

    it('should accept custom priority', () => {
      const params = {
        reportId: 'report-123',
        analysisId: 'analysis-456',
        projectId: 'project-789',
        format: 'word' as const,
        template: 'default',
        name: 'Urgent Report',
        parameters: {},
        requestedById: 'user-001',
        priority: 10,
      };

      const job = createReportJobMessage(params);

      expect(job.priority).toBe(10);
    });
  });

  describe('ReportQueueService', () => {
    describe('enqueue', () => {
      it('should publish a job to the queue', async () => {
        const service = getReportQueueService();
        const job: ReportJobMessage = {
          jobId: 'job-123',
          reportId: 'report-123',
          analysisId: 'analysis-456',
          projectId: 'project-789',
          format: 'pdf',
          template: 'default',
          name: 'Test Report',
          parameters: {},
          requestedById: 'user-001',
          createdAt: new Date().toISOString(),
          retryCount: 0,
          priority: 0,
        };

        const result = await service.enqueue(job);

        expect(result).toBe(true);
        expect(mockChannel.publish).toHaveBeenCalledWith(
          'report-exchange',
          'report-generation',
          expect.any(Buffer),
          expect.objectContaining({
            persistent: true,
            contentType: 'application/json',
            messageId: 'job-123',
            priority: 0,
          })
        );
      });

      it('should use custom priority when provided', async () => {
        const service = getReportQueueService();
        const job: ReportJobMessage = {
          jobId: 'job-123',
          reportId: 'report-123',
          analysisId: 'analysis-456',
          projectId: 'project-789',
          format: 'excel',
          template: 'default',
          name: 'Test Report',
          parameters: {},
          requestedById: 'user-001',
          createdAt: new Date().toISOString(),
          retryCount: 0,
          priority: 5,
        };

        await service.enqueue(job, { priority: 10 });

        expect(mockChannel.publish).toHaveBeenCalledWith(
          'report-exchange',
          'report-generation',
          expect.any(Buffer),
          expect.objectContaining({
            priority: 10,
          })
        );
      });

      it('should include expiration when provided', async () => {
        const service = getReportQueueService();
        const job: ReportJobMessage = {
          jobId: 'job-123',
          reportId: 'report-123',
          analysisId: 'analysis-456',
          projectId: 'project-789',
          format: 'powerpoint',
          template: 'default',
          name: 'Test Report',
          parameters: {},
          requestedById: 'user-001',
          createdAt: new Date().toISOString(),
          retryCount: 0,
          priority: 0,
        };

        await service.enqueue(job, { expiration: 60000 });

        expect(mockChannel.publish).toHaveBeenCalledWith(
          'report-exchange',
          'report-generation',
          expect.any(Buffer),
          expect.objectContaining({
            expiration: '60000',
          })
        );
      });
    });

    describe('getQueueLength', () => {
      it('should return the message count', async () => {
        const service = getReportQueueService();
        mockChannel.checkQueue.mockResolvedValue({ messageCount: 10 });

        const count = await service.getQueueLength();

        expect(count).toBe(10);
        expect(mockChannel.checkQueue).toHaveBeenCalledWith('report-generation');
      });
    });

    describe('getDeadLetterQueueLength', () => {
      it('should return the dead letter message count', async () => {
        const service = getReportQueueService();
        mockChannel.checkQueue.mockResolvedValue({ messageCount: 2 });

        const count = await service.getDeadLetterQueueLength();

        expect(count).toBe(2);
        expect(mockChannel.checkQueue).toHaveBeenCalledWith('report-generation-dlq');
      });
    });

    describe('consume', () => {
      it('should set up a consumer and return the consumer tag', async () => {
        const service = getReportQueueService();
        const handler = jest.fn();

        const consumerTag = await service.consume(handler);

        expect(consumerTag).toBe('test-consumer');
        expect(mockChannel.consume).toHaveBeenCalledWith(
          'report-generation',
          expect.any(Function)
        );
      });
    });

    describe('cancelConsumer', () => {
      it('should cancel the consumer', async () => {
        const service = getReportQueueService();

        await service.cancelConsumer('test-consumer');

        expect(mockChannel.cancel).toHaveBeenCalledWith('test-consumer');
      });
    });

    describe('purgeQueue', () => {
      it('should purge the main queue and return count', async () => {
        const service = getReportQueueService();
        mockChannel.purgeQueue.mockResolvedValue({ messageCount: 5 });

        const count = await service.purgeQueue();

        expect(count).toBe(5);
        expect(mockChannel.purgeQueue).toHaveBeenCalledWith('report-generation');
      });
    });

    describe('purgeDeadLetterQueue', () => {
      it('should purge the DLQ and return count', async () => {
        const service = getReportQueueService();
        mockChannel.purgeQueue.mockResolvedValue({ messageCount: 3 });

        const count = await service.purgeDeadLetterQueue();

        expect(count).toBe(3);
        expect(mockChannel.purgeQueue).toHaveBeenCalledWith('report-generation-dlq');
      });
    });

    describe('retryDeadLetter', () => {
      it('should return false when DLQ is empty', async () => {
        const service = getReportQueueService();
        mockChannel.get.mockResolvedValue(null);

        const result = await service.retryDeadLetter();

        expect(result).toBe(false);
      });

      it('should move message from DLQ to main queue', async () => {
        const service = getReportQueueService();
        const job: ReportJobMessage = {
          jobId: 'job-123',
          reportId: 'report-123',
          analysisId: 'analysis-456',
          projectId: 'project-789',
          format: 'pdf',
          template: 'default',
          name: 'Test Report',
          parameters: {},
          requestedById: 'user-001',
          createdAt: new Date().toISOString(),
          retryCount: 1,
          priority: 0,
        };

        const mockMsg = {
          content: Buffer.from(JSON.stringify(job)),
        };

        mockChannel.get.mockResolvedValue(mockMsg);
        mockChannel.publish.mockReturnValue(true);

        const result = await service.retryDeadLetter();

        expect(result).toBe(true);
        expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
        expect(mockChannel.publish).toHaveBeenCalled();

        // Verify retry count was incremented
        const publishCall = mockChannel.publish.mock.calls[0];
        const publishedJob = JSON.parse(publishCall[2].toString());
        expect(publishedJob.retryCount).toBe(2);
      });
    });
  });

  describe('getReportQueueService', () => {
    it('should return a singleton instance', () => {
      const service1 = getReportQueueService();
      const service2 = getReportQueueService();

      expect(service1).toBe(service2);
    });

    it('should return new instance after reset', () => {
      const service1 = getReportQueueService();
      resetReportQueueService();
      const service2 = getReportQueueService();

      expect(service1).not.toBe(service2);
    });
  });
});
