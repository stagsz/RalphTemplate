/**
 * Tests for the health check service.
 */

import * as databaseConfig from '../config/database.config.js';
import * as minioConfig from '../config/minio.config.js';
import * as rabbitmqConfig from '../config/rabbitmq.config.js';
import {
  checkDatabase,
  checkStorage,
  checkMessageQueue,
  performHealthCheck,
  checkReadiness,
  checkLiveness,
} from './health.service.js';

// Mock the config modules
jest.mock('../config/database.config.js');
jest.mock('../config/minio.config.js');
jest.mock('../config/rabbitmq.config.js');

const mockedDatabaseConfig = databaseConfig as jest.Mocked<typeof databaseConfig>;
const mockedMinioConfig = minioConfig as jest.Mocked<typeof minioConfig>;
const mockedRabbitmqConfig = rabbitmqConfig as jest.Mocked<typeof rabbitmqConfig>;

describe('Health Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabase', () => {
    it('should return healthy when database is connected', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(true);

      const result = await checkDatabase();

      expect(result.name).toBe('database');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeDefined();
      expect(typeof result.responseTime).toBe('number');
    });

    it('should return unhealthy when database check returns false', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(false);

      const result = await checkDatabase();

      expect(result.name).toBe('database');
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBeDefined();
    });

    it('should return unhealthy when database check throws', async () => {
      mockedDatabaseConfig.testConnection.mockRejectedValue(new Error('Connection refused'));

      const result = await checkDatabase();

      expect(result.name).toBe('database');
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Connection refused');
    });
  });

  describe('checkStorage', () => {
    it('should return healthy when MinIO is connected', async () => {
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(true);

      const result = await checkStorage();

      expect(result.name).toBe('storage');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeDefined();
    });

    it('should return unhealthy when MinIO check returns false', async () => {
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(false);

      const result = await checkStorage();

      expect(result.name).toBe('storage');
      expect(result.status).toBe('unhealthy');
    });

    it('should return unhealthy when MinIO check throws', async () => {
      mockedMinioConfig.testMinIOConnection.mockRejectedValue(new Error('S3 error'));

      const result = await checkStorage();

      expect(result.name).toBe('storage');
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('S3 error');
    });
  });

  describe('checkMessageQueue', () => {
    it('should return healthy when RabbitMQ is connected', async () => {
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(true);

      const result = await checkMessageQueue();

      expect(result.name).toBe('messageQueue');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeDefined();
    });

    it('should return unhealthy when RabbitMQ check returns false', async () => {
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(false);

      const result = await checkMessageQueue();

      expect(result.name).toBe('messageQueue');
      expect(result.status).toBe('unhealthy');
    });

    it('should return unhealthy when RabbitMQ check throws', async () => {
      mockedRabbitmqConfig.testRabbitMQConnection.mockRejectedValue(new Error('AMQP error'));

      const result = await checkMessageQueue();

      expect(result.name).toBe('messageQueue');
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('AMQP error');
    });
  });

  describe('performHealthCheck', () => {
    it('should return healthy when all services are healthy', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(true);
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(true);
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(true);

      const result = await performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.services).toHaveLength(3);
      expect(result.version).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy when database is down', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(false);
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(true);
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(true);

      const result = await performHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.services).toHaveLength(3);
    });

    it('should return degraded when non-critical service is down', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(true);
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(false);
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(true);

      const result = await performHealthCheck();

      expect(result.status).toBe('degraded');
    });

    it('should return degraded when RabbitMQ is down but database is up', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(true);
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(true);
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(false);

      const result = await performHealthCheck();

      expect(result.status).toBe('degraded');
    });

    it('should include valid ISO timestamp', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(true);
      mockedMinioConfig.testMinIOConnection.mockResolvedValue(true);
      mockedRabbitmqConfig.testRabbitMQConnection.mockResolvedValue(true);

      const result = await performHealthCheck();

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('checkReadiness', () => {
    it('should return ready when database is healthy', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(true);

      const result = await checkReadiness();

      expect(result.ready).toBe(true);
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].name).toBe('database');
    });

    it('should return not ready when database is unhealthy', async () => {
      mockedDatabaseConfig.testConnection.mockResolvedValue(false);

      const result = await checkReadiness();

      expect(result.ready).toBe(false);
      expect(result.status).toBe('unhealthy');
    });

    it('should return not ready when database check throws', async () => {
      mockedDatabaseConfig.testConnection.mockRejectedValue(new Error('DB error'));

      const result = await checkReadiness();

      expect(result.ready).toBe(false);
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('checkLiveness', () => {
    it('should always return alive', () => {
      const result = checkLiveness();

      expect(result.alive).toBe(true);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should include valid ISO timestamp', () => {
      const result = checkLiveness();

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should have increasing uptime on subsequent calls', async () => {
      const result1 = checkLiveness();

      // Wait a small amount of time
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result2 = checkLiveness();

      expect(result2.uptime).toBeGreaterThanOrEqual(result1.uptime);
    });
  });
});
