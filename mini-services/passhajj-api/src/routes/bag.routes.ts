// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Bag Routes
//  Express Router with auth/role middleware
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate, authorize, uploadPhoto } from '../lib';
import {
  list,
  getById,
  getByQR,
  create,
  update,
  remove,
  uploadPhoto as uploadPhotoHandler,
  markLost,
  markFound,
} from '../controllers/bag.controller';

const router = Router();

// ─── Bag Routes ───

// List bags (authenticated)
router.get('/', authenticate, list);

// Get bag by QR code (authenticated — for scanner lookup)
router.get('/qr/:qrCode', authenticate, getByQR);

// Get single bag by ID (authenticated)
router.get('/:id', authenticate, getById);

// Create bag (admin/agency)
router.post('/', authenticate, authorize('superadmin', 'admin', 'agency'), create);

// Update bag (admin/agency)
router.put('/:id', authenticate, authorize('superadmin', 'admin', 'agency'), update);

// Delete bag (superadmin/admin only)
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), remove);

// Upload photo for bag (authenticated)
// Set uploadDir before multer processes the file
router.post('/:id/photo', authenticate, (req, _res, next) => {
  (req as any).uploadDir = 'photos';
  next();
}, uploadPhoto, uploadPhotoHandler);

// Mark bag as lost (authenticated)
router.post('/:id/mark-lost', authenticate, markLost);

// Mark bag as found (authenticated)
router.post('/:id/mark-found', authenticate, markFound);

export default router;
