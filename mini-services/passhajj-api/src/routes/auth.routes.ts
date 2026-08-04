// ═══════════════════════════════════════════════════════════════
//  Auth Routes — Registration, Login, Refresh, Logout, Me
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import { authLimiter, authenticate } from '../lib';
import { register, login, refreshToken, logout, me } from '../controllers/auth.controller';

const router = express.Router();

// Public routes (rate-limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
