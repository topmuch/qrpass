// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Incident Routes
//  Express Router with auth middleware
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate, uploadIncidentPhoto } from '../lib';
import { list, getById, create, update, uploadPhoto } from '../controllers/incident.controller';

const router = Router();

// ─── Incident Routes ───

// List incidents (authenticated, paginated, filterable)
router.get('/', authenticate, list);

// Get single incident by ID
router.get('/:id', authenticate, getById);

// Create a new incident
router.post('/', authenticate, create);

// Update incident (including resolve)
router.put('/:id', authenticate, update);

// Upload evidence photo for an incident
router.post('/:id/photo', authenticate, uploadIncidentPhoto, uploadPhoto);

export default router;
