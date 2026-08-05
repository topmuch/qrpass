// ═══════════════════════════════════════════════════════════════
//  Agency Routes — Express Router with auth/role guards
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import { authenticate, authorize } from '../lib';
import { list, getById, getBySlug, create, update, remove } from '../controllers/agency.controller';

const router = express.Router();

// ─── Public-ish (authenticated) read endpoints ───

// GET / — List all agencies (paginated, optional ?active=true/false filter)
router.get('/', authenticate, list);

// GET /slug/:slug — Get agency by slug (for public pages)
router.get('/slug/:slug', authenticate, getBySlug);

// GET /:id — Get single agency by ID
router.get('/:id', authenticate, getById);

// ─── Admin-only write endpoints ───

// POST / — Create a new agency
router.post('/', authenticate, authorize('superadmin', 'admin'), create);

// PUT /:id — Update agency by ID
router.put('/:id', authenticate, authorize('superadmin', 'admin'), update);

// DELETE /:id — Soft-delete agency (set active=false)
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), remove);

export default router;
