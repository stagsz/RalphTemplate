/**
 * JWT Service for RS256 token generation and validation.
 *
 * Uses asymmetric RS256 algorithm for signing JWTs:
 * - Private key signs access and refresh tokens
 * - Public key verifies tokens (can be distributed to other services)
 *
 * Token types:
 * - Access token: Short-lived (default 15m), used for API authorization
 * - Refresh token: Long-lived (default 7d), used to obtain new access tokens
 */

import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { loadJwtConfig, parseDuration, type JwtConfig } from '../config/jwt.config.js';

/**
 * Key type derived from jose library's importPKCS8 return type.
 */
type JoseKeyType = Awaited<ReturnType<typeof importPKCS8>>;

/**
 * User role type matching @hazop/types UserRole.
 */
export type UserRole = 'administrator' | 'lead_analyst' | 'analyst' | 'viewer';

/**
 * JWT payload structure matching @hazop/types JwtPayload.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

/**
 * Token pair structure matching @hazop/types TokenPair.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * User data required for token generation.
 */
export interface TokenUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Result of token verification.
 */
export interface TokenVerifyResult {
  valid: true;
  payload: JwtPayload;
}

/**
 * Error result of token verification.
 */
export interface TokenVerifyError {
  valid: false;
  error: string;
}

export type VerifyResult = TokenVerifyResult | TokenVerifyError;

/**
 * JWT Service class for generating and verifying RS256 JWTs.
 */
export class JwtService {
  private privateKey: JoseKeyType | null = null;
  private publicKey: JoseKeyType | null = null;
  private config: JwtConfig;
  private initialized = false;

  constructor(config?: JwtConfig) {
    this.config = config || loadJwtConfig();
  }

  /**
   * Initialize the service by importing RSA keys.
   * Must be called before generating or verifying tokens.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.privateKey = await importPKCS8(this.config.privateKey, 'RS256');
      this.publicKey = await importSPKI(this.config.publicKey, 'RS256');
      this.initialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize JWT keys: ${message}`);
    }
  }

  /**
   * Ensure the service is initialized.
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.privateKey || !this.publicKey) {
      throw new Error('JwtService not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate an access token for a user.
   */
  async generateAccessToken(user: TokenUser): Promise<string> {
    this.ensureInitialized();

    const expiresIn = parseDuration(this.config.accessTokenExpiry);
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({
      email: user.email,
      role: user.role,
      type: 'access' as const,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .sign(this.privateKey!);

    return token;
  }

  /**
   * Generate a refresh token for a user.
   */
  async generateRefreshToken(user: TokenUser): Promise<string> {
    this.ensureInitialized();

    const expiresIn = parseDuration(this.config.refreshTokenExpiry);
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({
      email: user.email,
      role: user.role,
      type: 'refresh' as const,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .sign(this.privateKey!);

    return token;
  }

  /**
   * Generate both access and refresh tokens for a user.
   */
  async generateTokenPair(user: TokenUser): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDuration(this.config.accessTokenExpiry),
      tokenType: 'Bearer',
    };
  }

  /**
   * Verify a token and return its payload.
   */
  async verifyToken(token: string): Promise<VerifyResult> {
    this.ensureInitialized();

    try {
      const { payload } = await jwtVerify(token, this.publicKey!, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Validate required claims
      if (!payload.sub || !payload.email || !payload.role || !payload.type) {
        return {
          valid: false,
          error: 'Token missing required claims',
        };
      }

      const jwtPayload: JwtPayload = {
        sub: payload.sub as string,
        email: payload.email as string,
        role: payload.role as UserRole,
        type: payload.type as 'access' | 'refresh',
        iat: payload.iat as number,
        exp: payload.exp as number,
      };

      return {
        valid: true,
        payload: jwtPayload,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token verification failed';
      return {
        valid: false,
        error: message,
      };
    }
  }

  /**
   * Verify an access token specifically.
   * Returns error if token is not an access token.
   */
  async verifyAccessToken(token: string): Promise<VerifyResult> {
    const result = await this.verifyToken(token);

    if (!result.valid) {
      return result;
    }

    if (result.payload.type !== 'access') {
      return {
        valid: false,
        error: 'Token is not an access token',
      };
    }

    return result;
  }

  /**
   * Verify a refresh token specifically.
   * Returns error if token is not a refresh token.
   */
  async verifyRefreshToken(token: string): Promise<VerifyResult> {
    const result = await this.verifyToken(token);

    if (!result.valid) {
      return result;
    }

    if (result.payload.type !== 'refresh') {
      return {
        valid: false,
        error: 'Token is not a refresh token',
      };
    }

    return result;
  }

  /**
   * Get the access token expiry time in seconds.
   */
  getAccessTokenExpiry(): number {
    return parseDuration(this.config.accessTokenExpiry);
  }

  /**
   * Get the refresh token expiry time in seconds.
   */
  getRefreshTokenExpiry(): number {
    return parseDuration(this.config.refreshTokenExpiry);
  }
}

// Singleton instance for application-wide use
let jwtServiceInstance: JwtService | null = null;

/**
 * Get the singleton JWT service instance.
 * The service must be initialized before use.
 */
export function getJwtService(): JwtService {
  if (!jwtServiceInstance) {
    jwtServiceInstance = new JwtService();
  }
  return jwtServiceInstance;
}

/**
 * Initialize the JWT service with custom config (for testing).
 */
export function createJwtService(config: JwtConfig): JwtService {
  return new JwtService(config);
}
