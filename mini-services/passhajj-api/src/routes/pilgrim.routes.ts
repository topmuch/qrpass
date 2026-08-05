// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Pilgrim Routes
//  Express Router with auth/role middleware
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate, authorize, uploadPhoto } from '../lib';
import { list, getById, getByQR, create, update, remove, uploadPhoto as uploadPhotoHandler } from '../controllers/pilgrim.controller';

const router = Router();

// ─── Pilgrim Routes ───

// List pilgrims (authenticated) — supports ?agencyId= ?tripId= ?groupId= ?isActive= ?search=
router.get('/', authenticate, list);

// Get pilgrim by QR code (scanner lookup) — must come before /:id
router.get('/qr/:qrCode', authenticate, getByQR);

// Get single pilgrim by ID (authenticated)
router.get('/:id', authenticate, getById);

// Create pilgrim (admin/agency)
router.post('/', authenticate, authorize('superadmin', 'admin', 'agency'), create);

// Update pilgrim (admin/agency)
router.put('/:id', authenticate, authorize('superadmin', 'admin', 'agency'), update);

// Delete pilgrim (superadmin/admin only)
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), remove);

// Upload pilgrim photo (admin/agency)
// Set uploadDir before multer so files go to photos/ subdirectory
router.post(
  '/:id/photo',
  authenticate,
  authorize('superadmin', 'admin', 'agency'),
  (req, _res, next) => {
    (req as any).uploadDir = 'photos';
    next();
  },
  uploadPhoto,
  uploadPhotoHandler,
);

export default router;
