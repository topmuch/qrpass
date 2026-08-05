// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Leader Routes
//  PWA group leader endpoints (OTP-based, no JWT required for sync)
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { otpLimiter } from '../lib';
import {
  verifyOTP,
  syncScans,
  syncIncidents,
  getTripStatus,
  getPendingSync,
} from '../controllers/leader.controller';

const router = Router();

// ─── PWA Entry Point (OTP-based login, no JWT) ───
// Rate-limited to prevent brute-force OTP guessing
router.post('/verify-otp', otpLimiter, verifyOTP);

// ─── Offline Sync Endpoints (no JWT — PWA uses tripId for auth) ───
router.post('/sync-scans', syncScans);
router.post('/sync-incidents', syncIncidents);

// ─── Trip Status & Pending Sync (read-only) ───
router.get('/trip/:tripId/status', getTripStatus);
router.get('/trip/:tripId/pending', getPendingSync);

export default router;
