// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Finder Routes
//  PUBLIC router — No authentication required
//  QR code lookup for identity/baggage
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { lookup } from '../controllers/finder.controller';

const router = Router();

// ─── Finder Routes (PUBLIC, no auth) ───

// GET /:qrCode — Lookup a QR code (identity or baggage)
router.get('/:qrCode', lookup);

export default router;
