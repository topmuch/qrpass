// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Incident Controller
//  Business logic for incidents: list, getById, create, update, uploadPhoto
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { createIncidentSchema } from '../utils/validators';

// ═══════════════════════════════════════════════════════════════
//  LIST — Paginated incident listing with filters
//  ?tripId= &type= &priority= &resolved= &synced=
// ═══════════════════════════════════════════════════════════════
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    // Filter by tripId
    const tripId = req.query.tripId as string | undefined;
    if (tripId) {
      where.tripId = tripId;
    }

    // Filter by type
    const type = req.query.type as string | undefined;
    if (type) {
      where.type = type;
    }

    // Filter by priority
    const priority = req.query.priority as string | undefined;
    if (priority) {
      where.priority = priority;
    }

    // Filter by resolved status
    if (req.query.resolved !== undefined) {
      where.resolved = req.query.resolved === 'true';
    }

    // Filter by synced status
    if (req.query.synced !== undefined) {
      where.synced = req.query.synced === 'true';
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          trip: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      data: incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[incident.list]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY ID — Single incident by ID
// ═══════════════════════════════════════════════════════════════
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        trip: {
          select: { id: true, name: true, agencyId: true },
        },
      },
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident non trouvé.' });
      return;
    }

    res.json(incident);
  } catch (error: any) {
    console.error('[incident.getById]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  CREATE — Create a new incident
//  Validates with createIncidentSchema.
//  If relatedQrCode is provided, tries to resolve relatedName
//  from Pilgrim or Bag.
// ═══════════════════════════════════════════════════════════════
export async function create(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const result = createIncidentSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // Verify trip exists
    const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
    if (!trip) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    // Resolve relatedName from QR code if not provided
    let relatedName = data.relatedName;

    if (data.relatedQrCode && !relatedName) {
      // Try to find a Pilgrim with this QR code
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { qrCode: data.relatedQrCode },
        select: { fullName: true },
      });
      if (pilgrim) {
        relatedName = pilgrim.fullName;
      } else {
        // Try to find a Bag with this QR code
        const bag = await prisma.bag.findUnique({
          where: { qrCode: data.relatedQrCode },
          select: { ownerName: true },
        });
        if (bag) {
          relatedName = bag.ownerName;
        }
      }
    }

    // Create the incident
    const incident = await prisma.incident.create({
      data: {
        type: data.type,
        description: data.description,
        relatedQrCode: data.relatedQrCode,
        relatedName,
        tripId: data.tripId,
        zone: data.zone,
        timestamp: new Date(data.timestamp),
        priority: data.priority,
        latitude: data.latitude,
        longitude: data.longitude,
        synced: true,        // Created server-side, already synced
        syncedAt: new Date(),
      },
    });

    res.status(201).json(incident);
  } catch (error: any) {
    console.error('[incident.create]', error);

    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit : cet incident existe déjà.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE — Update incident by ID
//  Can resolve: set resolved=true, resolvedAt, resolvedBy, resolution
// ═══════════════════════════════════════════════════════════════
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check incident exists
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident non trouvé.' });
      return;
    }

    // Build update payload from body
    const updateData: any = {};

    // Updatable fields
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.relatedQrCode !== undefined) updateData.relatedQrCode = req.body.relatedQrCode;
    if (req.body.relatedName !== undefined) updateData.relatedName = req.body.relatedName;
    if (req.body.zone !== undefined) updateData.zone = req.body.zone;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.latitude !== undefined) updateData.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updateData.longitude = req.body.longitude;
    if (req.body.photoUrl !== undefined) updateData.photoUrl = req.body.photoUrl;

    // Resolution handling
    if (req.body.resolved === true && !existing.resolved) {
      updateData.resolved = true;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = (req as any).user?.userId || null;
      if (req.body.resolution !== undefined) {
        updateData.resolution = req.body.resolution;
      }
    }

    // Allow un-resolving (set resolved=false)
    if (req.body.resolved === false && existing.resolved) {
      updateData.resolved = false;
      updateData.resolvedAt = null;
      updateData.resolvedBy = null;
      updateData.resolution = null;
    }

    // Mark as synced if updated server-side
    if (req.body.synced !== undefined) {
      updateData.synced = req.body.synced;
      if (req.body.synced === true) {
        updateData.syncedAt = new Date();
      }
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        trip: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('[incident.update]', error);

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Incident non trouvé.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPLOAD PHOTO — Upload evidence photo for an incident
//  Expects multer to have already processed the file
// ═══════════════════════════════════════════════════════════════
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check incident exists
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident non trouvé.' });
      return;
    }

    // Check that file was uploaded
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Fichier photo requis.' });
      return;
    }

    // Build photo URL path
    const photoUrl = `/uploads/incidents/${file.filename}`;

    // Update incident with photo URL
    const updated = await prisma.incident.update({
      where: { id },
      data: { photoUrl },
    });

    res.json({
      message: 'Photo téléchargée avec succès.',
      photoUrl,
      incident: updated,
    });
  } catch (error: any) {
    console.error('[incident.uploadPhoto]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
