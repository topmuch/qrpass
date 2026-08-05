// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Scan Routes
//  Express Router with auth middleware
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../lib';
import { list, getById, getStats, getUnsynced } from '../controllers/scan.controller';

const router = Router();

// ─── Scan Routes ───

// List scans (authenticated, paginated, filterable)
router.get('/', authenticate, list);

// Scan statistics for a trip (query: ?tripId=)
router.get('/stats', authenticate, getStats);

// Get all unsynced scan records (pending sync)
router.get('/unsynced', authenticate, getUnsynced);

// Get single scan by ID
router.get('/:id', authenticate, getById);

export default router;
