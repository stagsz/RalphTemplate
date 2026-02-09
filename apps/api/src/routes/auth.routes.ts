/**
 * Authentication routes.
 *
 * Provides endpoints for user authentication:
 * - POST /auth/register - Register a new user
 */

import { Router } from 'express';
import { register } from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /auth/register
 * Register a new user account.
 */
router.post('/register', register);

export default router;
