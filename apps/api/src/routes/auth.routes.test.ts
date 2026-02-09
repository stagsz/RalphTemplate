/**
 * API integration tests for auth endpoints.
 *
 * Tests the full API flow through routes with mocked database services.
 * These tests complement the validation-only tests in auth.controller.test.ts.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { UserRow, User } from '../services/user.service.js';
import type { UserRole } from '../services/jwt.service.js';

// Mock implementations - must be declared before jest.unstable_mockModule
let mockEmailExists: jest.Mock<() => Promise<boolean>>;
let mockCreateUser: jest.Mock<() => Promise<User>>;
let mockFindUserByEmail: jest.Mock<() => Promise<UserRow | null>>;
let mockVerifyPassword: jest.Mock<() => Promise<boolean>>;
let mockRequestPasswordReset: jest.Mock<
  () => Promise<{ success: boolean; token?: string; userId?: string }>
>;
let mockResetPassword: jest.Mock<
  () => Promise<{
    success: boolean;
    error?: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'TOKEN_USED' | 'USER_NOT_FOUND';
  }>
>;

// Set up mocks before importing modules that depend on them
jest.unstable_mockModule('../services/user.service.js', () => {
  mockEmailExists = jest.fn<() => Promise<boolean>>();
  mockCreateUser = jest.fn<() => Promise<User>>();
  mockFindUserByEmail = jest.fn<() => Promise<UserRow | null>>();
  mockVerifyPassword = jest.fn<() => Promise<boolean>>();

  return {
    emailExists: mockEmailExists,
    createUser: mockCreateUser,
    findUserByEmail: mockFindUserByEmail,
    verifyPassword: mockVerifyPassword,
    hashPassword: jest.fn<() => Promise<string>>().mockResolvedValue('hashed'),
  };
});

jest.unstable_mockModule('../services/password-reset.service.js', () => {
  mockRequestPasswordReset = jest.fn<
    () => Promise<{ success: boolean; token?: string; userId?: string }>
  >();
  mockResetPassword = jest.fn<
    () => Promise<{
      success: boolean;
      error?: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'TOKEN_USED' | 'USER_NOT_FOUND';
    }>
  >();

  return {
    requestPasswordReset: mockRequestPasswordReset,
    resetPassword: mockResetPassword,
  };
});

// Import auth routes after setting up mocks
const { default: authRoutes } = await import('./auth.routes.js');

/**
 * Generate RSA key pair for testing JWT operations.
 */
async function generateTestKeys(): Promise<{ privateKey: string; publicKey: string }> {
  const { generateKeyPair, exportPKCS8, exportSPKI } = await import('jose');
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });

  const privateKeyPem = await exportPKCS8(privateKey);
  const publicKeyPem = await exportSPKI(publicKey);

  return { privateKey: privateKeyPem, publicKey: publicKeyPem };
}

/**
 * Create a mock user row for database responses.
 */
function createMockUserRow(overrides?: Partial<UserRow>): UserRow {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password_hash: '$2b$12$hashedpassword',
    name: 'Test User',
    role: 'analyst' as UserRole,
    organization: 'Acme Corp',
    is_active: true,
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('Auth Routes API Tests', () => {
  let app: Express;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Generate test keys and set env vars
    const keys = await generateTestKeys();
    originalEnv = { ...process.env };
    process.env.JWT_PRIVATE_KEY = keys.privateKey;
    process.env.JWT_PUBLIC_KEY = keys.publicKey;
    process.env.JWT_ISSUER = 'hazop-assistant';
    process.env.JWT_AUDIENCE = 'hazop-api';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh Express app
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
      organization: 'Acme Corp',
    };

    describe('successful registration', () => {
      it('should create user and return tokens with status 201', async () => {
        const mockUser = createMockUserRow({
          email: validRegistration.email,
          name: validRegistration.name,
          organization: validRegistration.organization,
        });

        mockEmailExists.mockResolvedValue(false);
        mockCreateUser.mockResolvedValue({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          organization: mockUser.organization,
          isActive: mockUser.is_active,
          createdAt: mockUser.created_at,
          updatedAt: mockUser.updated_at,
        });

        const response = await request(app).post('/auth/register').send(validRegistration);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(validRegistration.email);
        expect(response.body.data.user.name).toBe(validRegistration.name);
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
        expect(response.body.data.tokens.tokenType).toBe('Bearer');
        expect(response.body.data.tokens.expiresIn).toBeGreaterThan(0);
      });

      it('should register with specified role', async () => {
        const mockUser = createMockUserRow({
          email: validRegistration.email,
          role: 'lead_analyst',
        });

        mockEmailExists.mockResolvedValue(false);
        mockCreateUser.mockResolvedValue({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          organization: mockUser.organization,
          isActive: mockUser.is_active,
          createdAt: mockUser.created_at,
          updatedAt: mockUser.updated_at,
        });

        const response = await request(app)
          .post('/auth/register')
          .send({ ...validRegistration, role: 'lead_analyst' });

        expect(response.status).toBe(201);
        expect(response.body.data.user.role).toBe('lead_analyst');
      });

      it('should call emailExists and createUser with correct parameters', async () => {
        mockEmailExists.mockResolvedValue(false);
        mockCreateUser.mockResolvedValue({
          id: '123',
          email: validRegistration.email,
          name: validRegistration.name,
          role: 'viewer',
          organization: validRegistration.organization,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await request(app).post('/auth/register').send(validRegistration);

        expect(mockEmailExists).toHaveBeenCalledWith(validRegistration.email);
        expect(mockCreateUser).toHaveBeenCalledWith({
          email: validRegistration.email,
          password: validRegistration.password,
          name: validRegistration.name,
          organization: validRegistration.organization,
          role: undefined,
        });
      });
    });

    describe('email conflicts', () => {
      it('should return 409 when email already exists', async () => {
        mockEmailExists.mockResolvedValue(true);

        const response = await request(app).post('/auth/register').send(validRegistration);

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('CONFLICT');
        expect(response.body.error.message).toBe('Email address already in use');
      });

      it('should handle PostgreSQL unique violation error', async () => {
        mockEmailExists.mockResolvedValue(false);
        const pgError = new Error('duplicate key value') as Error & { code: string };
        pgError.code = '23505';
        mockCreateUser.mockRejectedValue(pgError);

        const response = await request(app).post('/auth/register').send(validRegistration);

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('CONFLICT');
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockEmailExists.mockResolvedValue(false);
        mockCreateUser.mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app).post('/auth/register').send(validRegistration);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
        expect(response.body.error.message).toBe('An unexpected error occurred');
      });
    });
  });

  describe('POST /auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'Password123',
    };

    describe('successful login', () => {
      it('should authenticate and return tokens with status 200', async () => {
        const mockUser = createMockUserRow();
        mockFindUserByEmail.mockResolvedValue(mockUser);
        mockVerifyPassword.mockResolvedValue(true);

        const response = await request(app).post('/auth/login').send(validLogin);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(mockUser.email);
        expect(response.body.data.user.name).toBe(mockUser.name);
        expect(response.body.data.user.role).toBe(mockUser.role);
        expect(response.body.data.user.organization).toBe(mockUser.organization);
        expect(response.body.data.user.isActive).toBe(true);
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
        expect(response.body.data.tokens.tokenType).toBe('Bearer');
      });

      it('should not return password_hash in response', async () => {
        const mockUser = createMockUserRow();
        mockFindUserByEmail.mockResolvedValue(mockUser);
        mockVerifyPassword.mockResolvedValue(true);

        const response = await request(app).post('/auth/login').send(validLogin);

        expect(response.status).toBe(200);
        expect(response.body.data.user.password_hash).toBeUndefined();
        expect(response.body.data.user.passwordHash).toBeUndefined();
      });
    });

    describe('authentication failures', () => {
      it('should return 401 when user not found', async () => {
        mockFindUserByEmail.mockResolvedValue(null);

        const response = await request(app).post('/auth/login').send(validLogin);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        expect(response.body.error.message).toBe('Invalid email or password');
      });

      it('should return 401 when password is incorrect', async () => {
        const mockUser = createMockUserRow();
        mockFindUserByEmail.mockResolvedValue(mockUser);
        mockVerifyPassword.mockResolvedValue(false);

        const response = await request(app).post('/auth/login').send(validLogin);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });

      it('should return 401 when account is inactive', async () => {
        const mockUser = createMockUserRow({ is_active: false });
        mockFindUserByEmail.mockResolvedValue(mockUser);

        const response = await request(app).post('/auth/login').send(validLogin);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
        expect(response.body.error.message).toBe('Account is not active');
      });
    });

    describe('error handling', () => {
      it('should return 500 on database errors', async () => {
        mockFindUserByEmail.mockRejectedValue(new Error('Connection refused'));

        const response = await request(app).post('/auth/login').send(validLogin);

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('POST /auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Generate a valid refresh token for testing
      const { createJwtService } = await import('../services/jwt.service.js');
      const jwtService = createJwtService({
        privateKey: process.env.JWT_PRIVATE_KEY!,
        publicKey: process.env.JWT_PUBLIC_KEY!,
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        issuer: process.env.JWT_ISSUER!,
        audience: process.env.JWT_AUDIENCE!,
      });
      await jwtService.initialize();
      validRefreshToken = await jwtService.generateRefreshToken({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        role: 'analyst',
      });
    });

    describe('successful refresh', () => {
      it('should return new token pair with status 200', async () => {
        const response = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken: validRefreshToken });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
        expect(response.body.data.tokens.tokenType).toBe('Bearer');
        expect(response.body.data.tokens.expiresIn).toBeGreaterThan(0);
      });

      it('should return a new access token', async () => {
        const response = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken: validRefreshToken });

        expect(response.status).toBe(200);
        // Verify the new tokens have valid structure (JWT format)
        expect(response.body.data.tokens.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
        expect(response.body.data.tokens.refreshToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      });
    });

    describe('invalid tokens', () => {
      it('should return 400 when refreshToken is missing', async () => {
        const response = await request(app).post('/auth/refresh').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'refreshToken', code: 'REQUIRED' }),
          ])
        );
      });

      it('should return 401 when refreshToken is invalid', async () => {
        const response = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken: 'invalid.token.here' });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
        expect(response.body.error.message).toBe('Invalid or expired refresh token');
      });

      it('should return 401 when using access token instead of refresh token', async () => {
        // Generate an access token
        const { createJwtService } = await import('../services/jwt.service.js');
        const jwtService = createJwtService({
          privateKey: process.env.JWT_PRIVATE_KEY!,
          publicKey: process.env.JWT_PUBLIC_KEY!,
          accessTokenExpiry: '15m',
          refreshTokenExpiry: '7d',
          issuer: process.env.JWT_ISSUER!,
          audience: process.env.JWT_AUDIENCE!,
        });
        await jwtService.initialize();
        const accessToken = await jwtService.generateAccessToken({
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          role: 'analyst',
        });

        const response = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken: accessToken });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });
  });

  describe('POST /auth/logout', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Generate a valid refresh token for testing
      const { createJwtService } = await import('../services/jwt.service.js');
      const jwtService = createJwtService({
        privateKey: process.env.JWT_PRIVATE_KEY!,
        publicKey: process.env.JWT_PUBLIC_KEY!,
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        issuer: process.env.JWT_ISSUER!,
        audience: process.env.JWT_AUDIENCE!,
      });
      await jwtService.initialize();
      validRefreshToken = await jwtService.generateRefreshToken({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        role: 'analyst',
      });
    });

    describe('successful logout', () => {
      it('should return success with status 200', async () => {
        const response = await request(app)
          .post('/auth/logout')
          .send({ refreshToken: validRefreshToken });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Logged out successfully');
      });
    });

    describe('invalid tokens', () => {
      it('should return 400 when refreshToken is missing', async () => {
        const response = await request(app).post('/auth/logout').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'refreshToken', code: 'REQUIRED' }),
          ])
        );
      });

      it('should return 401 when refreshToken is invalid', async () => {
        const response = await request(app)
          .post('/auth/logout')
          .send({ refreshToken: 'invalid.token.here' });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });
  });

  describe('POST /auth/forgot-password', () => {
    describe('successful request', () => {
      it('should return success with status 200 when user exists', async () => {
        mockRequestPasswordReset.mockResolvedValue({
          success: true,
          token: 'test-reset-token',
          userId: '123',
        });

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({ email: 'test@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('If an account with that email exists');
      });

      it('should return success even when user does not exist (prevent enumeration)', async () => {
        mockRequestPasswordReset.mockResolvedValue({ success: false });

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should include dev token in non-production environment', async () => {
        process.env.NODE_ENV = 'development';
        mockRequestPasswordReset.mockResolvedValue({
          success: true,
          token: 'test-reset-token-abc123',
          userId: '123',
        });

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({ email: 'test@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.data._dev).toBeDefined();
        expect(response.body.data._dev.token).toBe('test-reset-token-abc123');
      });
    });

    describe('validation', () => {
      it('should return 400 when email is missing', async () => {
        const response = await request(app).post('/auth/forgot-password').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email', code: 'REQUIRED' }),
          ])
        );
      });

      it('should return 400 when email format is invalid', async () => {
        const response = await request(app)
          .post('/auth/forgot-password')
          .send({ email: 'invalid-email' });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email', code: 'INVALID_FORMAT' }),
          ])
        );
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockRequestPasswordReset.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({ email: 'test@example.com' });

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('POST /auth/reset-password', () => {
    describe('successful reset', () => {
      it('should reset password and return success with status 200', async () => {
        mockResetPassword.mockResolvedValue({ success: true });

        const response = await request(app).post('/auth/reset-password').send({
          token: 'valid-reset-token',
          newPassword: 'NewPassword123',
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('Password has been reset successfully');
      });
    });

    describe('validation', () => {
      it('should return 400 when token is missing', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({ newPassword: 'NewPassword123' });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'token', code: 'REQUIRED' }),
          ])
        );
      });

      it('should return 400 when newPassword is missing', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({ token: 'some-token' });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'newPassword', code: 'REQUIRED' }),
          ])
        );
      });

      it('should return 400 when newPassword is weak', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({ token: 'some-token', newPassword: 'weak' });

        expect(response.status).toBe(400);
        expect(response.body.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'newPassword', code: 'WEAK_PASSWORD' }),
          ])
        );
      });
    });

    describe('token errors', () => {
      it('should return 400 when token is invalid', async () => {
        mockResetPassword.mockResolvedValue({ success: false, error: 'INVALID_TOKEN' });

        const response = await request(app).post('/auth/reset-password').send({
          token: 'invalid-token',
          newPassword: 'NewPassword123',
        });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should return 400 when token is expired', async () => {
        mockResetPassword.mockResolvedValue({ success: false, error: 'TOKEN_EXPIRED' });

        const response = await request(app).post('/auth/reset-password').send({
          token: 'expired-token',
          newPassword: 'NewPassword123',
        });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
        expect(response.body.error.message).toContain('expired');
      });

      it('should return 400 when token has been used', async () => {
        mockResetPassword.mockResolvedValue({ success: false, error: 'TOKEN_USED' });

        const response = await request(app).post('/auth/reset-password').send({
          token: 'used-token',
          newPassword: 'NewPassword123',
        });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });

      it('should return 400 when user not found', async () => {
        mockResetPassword.mockResolvedValue({ success: false, error: 'USER_NOT_FOUND' });

        const response = await request(app).post('/auth/reset-password').send({
          token: 'valid-token',
          newPassword: 'NewPassword123',
        });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });

    describe('error handling', () => {
      it('should return 500 on unexpected errors', async () => {
        mockResetPassword.mockRejectedValue(new Error('Database error'));

        const response = await request(app).post('/auth/reset-password').send({
          token: 'some-token',
          newPassword: 'NewPassword123',
        });

        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });
});
