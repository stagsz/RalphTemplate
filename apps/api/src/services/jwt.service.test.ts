/**
 * Unit tests for JWT service with RS256 token generation and validation.
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { createJwtService, type JwtService, type TokenUser } from './jwt.service.js';
import type { JwtConfig } from '../config/jwt.config.js';

/**
 * Generate RSA key pair for testing.
 * Uses jose's generateKeyPair to create valid RS256 keys at runtime.
 * Keys are generated with extractable: true to allow PEM export.
 */
async function generateTestKeys(): Promise<{ privateKey: string; publicKey: string }> {
  const { generateKeyPair, exportPKCS8, exportSPKI } = await import('jose');
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });

  const privateKeyPem = await exportPKCS8(privateKey);
  const publicKeyPem = await exportSPKI(publicKey);

  return { privateKey: privateKeyPem, publicKey: publicKeyPem };
}

describe('JwtService', () => {
  let jwtService: JwtService;
  let testConfig: JwtConfig;
  let testUser: TokenUser;

  beforeAll(async () => {
    // Generate real test keys
    const keys = await generateTestKeys();

    testConfig = {
      privateKey: keys.privateKey,
      publicKey: keys.publicKey,
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      issuer: 'test-issuer',
      audience: 'test-audience',
    };
  });

  beforeEach(async () => {
    jwtService = createJwtService(testConfig);
    await jwtService.initialize();

    testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      role: 'analyst',
    };
  });

  describe('initialize()', () => {
    it('should initialize successfully with valid keys', async () => {
      const service = createJwtService(testConfig);
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should throw error with invalid private key', async () => {
      const invalidConfig = {
        ...testConfig,
        privateKey: 'invalid-key',
      };
      const service = createJwtService(invalidConfig);
      await expect(service.initialize()).rejects.toThrow('Failed to initialize JWT keys');
    });

    it('should throw error with invalid public key', async () => {
      const invalidConfig = {
        ...testConfig,
        publicKey: 'invalid-key',
      };
      const service = createJwtService(invalidConfig);
      await expect(service.initialize()).rejects.toThrow('Failed to initialize JWT keys');
    });
  });

  describe('generateAccessToken()', () => {
    it('should generate a valid access token', async () => {
      const token = await jwtService.generateAccessToken(testUser);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include correct claims in access token', async () => {
      const token = await jwtService.generateAccessToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.sub).toBe(testUser.id);
        expect(result.payload.email).toBe(testUser.email);
        expect(result.payload.role).toBe(testUser.role);
        expect(result.payload.type).toBe('access');
        expect(result.payload.iat).toBeDefined();
        expect(result.payload.exp).toBeDefined();
      }
    });

    it('should throw error if service not initialized', async () => {
      const uninitializedService = createJwtService(testConfig);
      await expect(uninitializedService.generateAccessToken(testUser)).rejects.toThrow(
        'JwtService not initialized'
      );
    });
  });

  describe('generateRefreshToken()', () => {
    it('should generate a valid refresh token', async () => {
      const token = await jwtService.generateRefreshToken(testUser);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include correct claims in refresh token', async () => {
      const token = await jwtService.generateRefreshToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.sub).toBe(testUser.id);
        expect(result.payload.email).toBe(testUser.email);
        expect(result.payload.role).toBe(testUser.role);
        expect(result.payload.type).toBe('refresh');
      }
    });
  });

  describe('generateTokenPair()', () => {
    it('should generate both access and refresh tokens', async () => {
      const tokenPair = await jwtService.generateTokenPair(testUser);

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.expiresIn).toBe(15 * 60); // 15 minutes in seconds
      expect(tokenPair.tokenType).toBe('Bearer');
    });

    it('should generate different tokens for access and refresh', async () => {
      const tokenPair = await jwtService.generateTokenPair(testUser);

      expect(tokenPair.accessToken).not.toBe(tokenPair.refreshToken);
    });
  });

  describe('verifyToken()', () => {
    it('should verify a valid token', async () => {
      const token = await jwtService.generateAccessToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(true);
    });

    it('should reject an invalid token', async () => {
      const result = await jwtService.verifyToken('invalid.token.here');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
      }
    });

    it('should reject a token signed with different key', async () => {
      // Generate new keys for a different service
      const otherKeys = await generateTestKeys();
      const otherConfig = { ...testConfig, ...otherKeys };
      const otherService = createJwtService(otherConfig);
      await otherService.initialize();

      const token = await otherService.generateAccessToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(false);
    });

    it('should reject a token with wrong issuer', async () => {
      const otherConfig = { ...testConfig, issuer: 'other-issuer' };
      const otherService = createJwtService(otherConfig);
      await otherService.initialize();

      const token = await otherService.generateAccessToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(false);
    });

    it('should reject a token with wrong audience', async () => {
      const otherConfig = { ...testConfig, audience: 'other-audience' };
      const otherService = createJwtService(otherConfig);
      await otherService.initialize();

      const token = await otherService.generateAccessToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(false);
    });
  });

  describe('verifyAccessToken()', () => {
    it('should accept a valid access token', async () => {
      const token = await jwtService.generateAccessToken(testUser);
      const result = await jwtService.verifyAccessToken(token);

      expect(result.valid).toBe(true);
    });

    it('should reject a refresh token', async () => {
      const token = await jwtService.generateRefreshToken(testUser);
      const result = await jwtService.verifyAccessToken(token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('Token is not an access token');
      }
    });
  });

  describe('verifyRefreshToken()', () => {
    it('should accept a valid refresh token', async () => {
      const token = await jwtService.generateRefreshToken(testUser);
      const result = await jwtService.verifyRefreshToken(token);

      expect(result.valid).toBe(true);
    });

    it('should reject an access token', async () => {
      const token = await jwtService.generateAccessToken(testUser);
      const result = await jwtService.verifyRefreshToken(token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('Token is not a refresh token');
      }
    });
  });

  describe('getAccessTokenExpiry()', () => {
    it('should return expiry time in seconds', () => {
      expect(jwtService.getAccessTokenExpiry()).toBe(15 * 60); // 15 minutes
    });
  });

  describe('getRefreshTokenExpiry()', () => {
    it('should return expiry time in seconds', () => {
      expect(jwtService.getRefreshTokenExpiry()).toBe(7 * 24 * 60 * 60); // 7 days
    });
  });

  describe('token expiry', () => {
    it('should create access token with correct expiry', async () => {
      const token = await jwtService.generateAccessToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        const expectedExpiry = result.payload.iat + 15 * 60;
        expect(result.payload.exp).toBe(expectedExpiry);
      }
    });

    it('should create refresh token with correct expiry', async () => {
      const token = await jwtService.generateRefreshToken(testUser);
      const result = await jwtService.verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        const expectedExpiry = result.payload.iat + 7 * 24 * 60 * 60;
        expect(result.payload.exp).toBe(expectedExpiry);
      }
    });
  });
});

describe('parseDuration', () => {
  // Import parseDuration for testing
  let parseDuration: (duration: string) => number;

  beforeAll(async () => {
    const config = await import('../config/jwt.config.js');
    parseDuration = config.parseDuration;
  });

  it('should parse seconds', () => {
    expect(parseDuration('30s')).toBe(30);
  });

  it('should parse minutes', () => {
    expect(parseDuration('15m')).toBe(15 * 60);
  });

  it('should parse hours', () => {
    expect(parseDuration('2h')).toBe(2 * 60 * 60);
  });

  it('should parse days', () => {
    expect(parseDuration('7d')).toBe(7 * 24 * 60 * 60);
  });

  it('should throw error for invalid format', () => {
    expect(() => parseDuration('invalid')).toThrow('Invalid duration format');
    expect(() => parseDuration('15')).toThrow('Invalid duration format');
    expect(() => parseDuration('m15')).toThrow('Invalid duration format');
  });
});
