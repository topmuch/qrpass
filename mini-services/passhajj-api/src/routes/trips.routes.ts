// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Trips Routes
//  Express Router with auth/role middleware
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate, authorize } from '../lib';
import { list, getById, create, update, remove, regenerateOTP } from '../controllers/trips.controller';

const router = Router();

// ─── Trip Routes ───

// List trips (authenticated)
router.get('/', authenticate, list);

// Get single trip by ID (authenticated)
router.get('/:id', authenticate, getById);

// Create trip (admin/agency)
router.post('/', authenticate, authorize('superadmin', 'admin', 'agency'), create);

// Update trip (admin/agency)
router.put('/:id', authenticate, authorize('superadmin', 'admin', 'agency'), update);

// Soft-delete trip (superadmin/admin only)
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), remove);

// Regenerate OTP for a trip (admin/agency)
router.post('/:id/regenerate-otp', authenticate, authorize('superadmin', 'admin', 'agency'), regenerateOTP);

export default router;
