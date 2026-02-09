/**
 * Authentication controller for handling auth-related HTTP requests.
 *
 * Handles:
 * - POST /auth/register - User registration
 */

import type { Request, Response } from 'express';
import { createUser, emailExists } from '../services/user.service.js';
import { getJwtService } from '../services/jwt.service.js';
import type { UserRole } from '../services/jwt.service.js';

/**
 * Validation error for a specific field.
 */
interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Request body for user registration.
 */
interface RegisterRequestBody {
  email?: string;
  password?: string;
  name?: string;
  organization?: string;
  role?: UserRole;
}

/**
 * Valid user roles for registration.
 */
const VALID_ROLES: UserRole[] = ['administrator', 'lead_analyst', 'analyst', 'viewer'];

/**
 * Validate email format.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength.
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Validate registration request body.
 * Returns an array of field errors if validation fails.
 */
function validateRegisterRequest(body: RegisterRequestBody): FieldError[] {
  const errors: FieldError[] = [];

  // Email validation
  if (!body.email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  } else if (!isValidEmail(body.email)) {
    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
  }

  // Password validation
  if (!body.password) {
    errors.push({ field: 'password', message: 'Password is required', code: 'REQUIRED' });
  } else {
    const passwordResult = validatePassword(body.password);
    if (!passwordResult.valid) {
      errors.push({ field: 'password', message: passwordResult.message!, code: 'WEAK_PASSWORD' });
    }
  }

  // Name validation
  if (!body.name) {
    errors.push({ field: 'name', message: 'Name is required', code: 'REQUIRED' });
  } else if (body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name cannot be empty', code: 'EMPTY' });
  }

  // Organization validation
  if (!body.organization) {
    errors.push({ field: 'organization', message: 'Organization is required', code: 'REQUIRED' });
  } else if (body.organization.trim().length === 0) {
    errors.push({ field: 'organization', message: 'Organization cannot be empty', code: 'EMPTY' });
  }

  // Role validation (optional, but must be valid if provided)
  if (body.role !== undefined && !VALID_ROLES.includes(body.role)) {
    errors.push({
      field: 'role',
      message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
      code: 'INVALID_VALUE',
    });
  }

  return errors;
}

/**
 * POST /auth/register
 * Register a new user account.
 *
 * Request body:
 * - email: string (required) - User's email address
 * - password: string (required) - User's password
 * - name: string (required) - User's display name
 * - organization: string (required) - User's organization
 * - role?: UserRole (optional) - Requested role (defaults to 'viewer')
 *
 * Returns:
 * - 201: User created successfully with tokens
 * - 400: Validation error
 * - 409: Email already exists
 * - 500: Internal server error
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as RegisterRequestBody;

    // Validate request body
    const validationErrors = validateRegisterRequest(body);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: validationErrors,
        },
      });
      return;
    }

    // Check if email already exists
    const exists = await emailExists(body.email!);
    if (exists) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email address already in use',
        },
      });
      return;
    }

    // Create user
    const user = await createUser({
      email: body.email!,
      password: body.password!,
      name: body.name!,
      organization: body.organization!,
      role: body.role,
    });

    // Generate tokens
    const jwtService = getJwtService();
    await jwtService.initialize();
    const tokens = await jwtService.generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle PostgreSQL unique violation (should not happen with emailExists check)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email address already in use',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
