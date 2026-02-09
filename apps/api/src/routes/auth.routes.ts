/**
 * Authentication routes.
 *
 * Provides endpoints for user authentication:
 * - POST /auth/register - Register a new user
 * - POST /auth/login - Authenticate a user
 * - POST /auth/refresh - Refresh access token
 */

import { Router } from 'express';
import { register, login, refresh } from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /auth/register
 * Register a new user account.
 */
router.post('/register', register);

/**
 * POST /auth/login
 * Authenticate a user and return tokens.
 */
router.post('/login', login);

/**
 * POST /auth/refresh
 * Refresh access token using a valid refresh token.
 */
router.post('/refresh', refresh);

export default router;
