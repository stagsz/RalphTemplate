/**
 * Tests for RabbitMQ configuration.
 */

import { loadRabbitMQConfig, getReportQueueName, getReportExchangeName } from './rabbitmq.config.js';

describe('RabbitMQ Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadRabbitMQConfig', () => {
    it('should return default configuration when no env vars are set', () => {
      delete process.env.RABBITMQ_URL;
      delete process.env.RABBITMQ_USER;
      delete process.env.RABBITMQ_PASSWORD;
      delete process.env.RABBITMQ_REPORT_QUEUE;
      delete process.env.RABBITMQ_REPORT_EXCHANGE;
      delete process.env.RABBITMQ_DLQ;
      delete process.env.RABBITMQ_DLX;
      delete process.env.RABBITMQ_PREFETCH;
      delete process.env.RABBITMQ_RECONNECT_DELAY;

      const config = loadRabbitMQConfig();

      expect(config.url).toBe('amqp://hazop:devpassword@localhost:5672');
      expect(config.user).toBe('hazop');
      expect(config.password).toBe('devpassword');
      expect(config.reportQueue).toBe('report-generation');
      expect(config.reportExchange).toBe('report-exchange');
      expect(config.deadLetterQueue).toBe('report-generation-dlq');
      expect(config.deadLetterExchange).toBe('report-dlx');
      expect(config.prefetchCount).toBe(1);
      expect(config.reconnectDelay).toBe(5000);
    });

    it('should use environment variables when set', () => {
      process.env.RABBITMQ_URL = 'amqp://test:test@rabbitmq:5672';
      process.env.RABBITMQ_USER = 'testuser';
      process.env.RABBITMQ_PASSWORD = 'testpass';
      process.env.RABBITMQ_REPORT_QUEUE = 'custom-queue';
      process.env.RABBITMQ_REPORT_EXCHANGE = 'custom-exchange';
      process.env.RABBITMQ_DLQ = 'custom-dlq';
      process.env.RABBITMQ_DLX = 'custom-dlx';
      process.env.RABBITMQ_PREFETCH = '5';
      process.env.RABBITMQ_RECONNECT_DELAY = '10000';

      const config = loadRabbitMQConfig();

      expect(config.url).toBe('amqp://test:test@rabbitmq:5672');
      expect(config.user).toBe('testuser');
      expect(config.password).toBe('testpass');
      expect(config.reportQueue).toBe('custom-queue');
      expect(config.reportExchange).toBe('custom-exchange');
      expect(config.deadLetterQueue).toBe('custom-dlq');
      expect(config.deadLetterExchange).toBe('custom-dlx');
      expect(config.prefetchCount).toBe(5);
      expect(config.reconnectDelay).toBe(10000);
    });

    it('should parse numeric values correctly', () => {
      process.env.RABBITMQ_PREFETCH = '10';
      process.env.RABBITMQ_RECONNECT_DELAY = '3000';

      const config = loadRabbitMQConfig();

      expect(typeof config.prefetchCount).toBe('number');
      expect(typeof config.reconnectDelay).toBe('number');
      expect(config.prefetchCount).toBe(10);
      expect(config.reconnectDelay).toBe(3000);
    });
  });

  describe('getReportQueueName', () => {
    it('should return the default queue name', () => {
      delete process.env.RABBITMQ_REPORT_QUEUE;
      const queueName = getReportQueueName();
      expect(queueName).toBe('report-generation');
    });

    it('should return custom queue name from env', () => {
      process.env.RABBITMQ_REPORT_QUEUE = 'my-custom-queue';
      const queueName = getReportQueueName();
      expect(queueName).toBe('my-custom-queue');
    });
  });

  describe('getReportExchangeName', () => {
    it('should return the default exchange name', () => {
      delete process.env.RABBITMQ_REPORT_EXCHANGE;
      const exchangeName = getReportExchangeName();
      expect(exchangeName).toBe('report-exchange');
    });

    it('should return custom exchange name from env', () => {
      process.env.RABBITMQ_REPORT_EXCHANGE = 'my-custom-exchange';
      const exchangeName = getReportExchangeName();
      expect(exchangeName).toBe('my-custom-exchange');
    });
  });
});
