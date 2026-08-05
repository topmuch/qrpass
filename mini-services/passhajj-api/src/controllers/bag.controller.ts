// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Bag Controller
//  Full business logic for bag CRUD, QR lookup, photo, lost/found
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { createBagSchema, updateBagSchema } from '../utils/validators';
import { generateBaggageQR } from '../utils/qrGenerator';

// ═══════════════════════════════════════════════════════════════
//  LIST — Paginated bag listing with filters
// ═══════════════════════════════════════════════════════════════
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    const agencyIdQuery = req.query.agencyId;
    if (agencyIdQuery && typeof agencyIdQuery === 'string') {
      where.agencyId = agencyIdQuery;
    }

    const tripIdQuery = req.query.tripId;
    if (tripIdQuery && typeof tripIdQuery === 'string') {
      where.tripId = tripIdQuery;
    }

    const ownerIdQuery = req.query.ownerId;
    if (ownerIdQuery && typeof ownerIdQuery === 'string') {
      where.ownerId = ownerIdQuery;
    }

    const statusQuery = req.query.status;
    if (statusQuery && typeof statusQuery === 'string') {
      where.status = statusQuery;
    }

    // Search in ownerName and qrCode
    const searchQuery = req.query.search;
    if (searchQuery && typeof searchQuery === 'string') {
      where.OR = [
        { ownerName: { contains: searchQuery } },
        { qrCode: { contains: searchQuery } },
      ];
    }

    // If user is agency-scoped, restrict to their agency
    const user = (req as any).user;
    if (user?.role === 'agency' && user?.agencyId) {
      where.agencyId = user.agencyId;
    }

    const [bags, total] = await Promise.all([
      prisma.bag.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trip: {
            select: { id: true, name: true },
          },
          agency: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.bag.count({ where }),
    ]);

    res.json({
      data: bags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[bags.list]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY ID — Single bag with full details
// ═══════════════════════════════════════════════════════════════
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const bag = await prisma.bag.findUnique({
      where: { id },
      include: {
        trip: {
          select: { id: true, name: true, status: true, departureDate: true, destination: true },
        },
        agency: {
          select: { id: true, name: true, slug: true, email: true, phone: true },
        },
      },
    });

    if (!bag) {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    // If ownerId exists, fetch owner pilgrim info
    let owner = null;
    if (bag.ownerId) {
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { id: bag.ownerId },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          nationality: true,
          gender: true,
          phone: true,
          qrCode: true,
          photoUrl: true,
        },
      });
      owner = pilgrim;
    }

    res.json({
      ...bag,
      owner,
    });
  } catch (error: any) {
    console.error('[bags.getById]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY QR — Bag lookup by qrCode (for scanner)
// ═══════════════════════════════════════════════════════════════
export async function getByQR(req: Request, res: Response): Promise<void> {
  try {
    const qrCode = req.params.qrCode as string;

    const bag = await prisma.bag.findUnique({
      where: { qrCode },
      include: {
        trip: {
          select: { id: true, name: true, status: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!bag) {
      res.status(404).json({ error: 'Bagage non trouvé pour ce QR code.' });
      return;
    }

    // Fetch owner pilgrim info if available
    let owner = null;
    if (bag.ownerId) {
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { id: bag.ownerId },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          nationality: true,
          gender: true,
          phone: true,
          qrCode: true,
          photoUrl: true,
        },
      });
      owner = pilgrim;
    }

    res.json({
      ...bag,
      owner,
    });
  } catch (error: any) {
    console.error('[bags.getByQR]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  CREATE — Create a new bag
// ═══════════════════════════════════════════════════════════════
export async function create(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validate input
    const result = createBagSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // 2. Auto-generate qrCode if not provided
    const qrCode = data.qrCode || await generateBaggageQR();

    // 3. If ownerId provided, look up the pilgrim and denormalize ownerName
    let ownerName = data.ownerName;
    if (data.ownerId) {
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { id: data.ownerId },
        select: { fullName: true },
      });
      if (!pilgrim) {
        res.status(404).json({ error: 'Pèlerin (propriétaire) non trouvé.' });
        return;
      }
      ownerName = pilgrim.fullName;
    }

    // 4. Create the bag
    const bag = await prisma.bag.create({
      data: {
        qrCode,
        ownerName,
        ownerId: data.ownerId || null,
        baggageType: data.baggageType,
        baggageIndex: data.baggageIndex,
        color: data.color,
        description: data.description,
        airline: data.airline,
        flightNumber: data.flightNumber,
        destination: data.destination,
        hotelName: data.hotelName,
        roomNumber: data.roomNumber,
        agencyId: data.agencyId || null,
        tripId: data.tripId || null,
      },
      include: {
        trip: {
          select: { id: true, name: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // 5. Update trip bag counter if tripId is set
    if (data.tripId) {
      const tripBagCount = await prisma.bag.count({ where: { tripId: data.tripId } });
      await prisma.trip.update({
        where: { id: data.tripId },
        data: { totalBags: tripBagCount },
      }).catch(() => {}); // silently ignore if trip not found
    }

    res.status(201).json(bag);
  } catch (error: any) {
    console.error('[bags.create]', error);

    // Handle Prisma unique constraint errors (qrCode collision)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit : ce QR code existe déjà.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE — Update bag by ID
// ═══════════════════════════════════════════════════════════════
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Validate input
    const result = updateBagSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // Check bag exists
    const existing = await prisma.bag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    // Build update payload
    const updateData: any = {};

    if (data.qrCode !== undefined) updateData.qrCode = data.qrCode;
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
    if (data.baggageType !== undefined) updateData.baggageType = data.baggageType;
    if (data.baggageIndex !== undefined) updateData.baggageIndex = data.baggageIndex;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.airline !== undefined) updateData.airline = data.airline;
    if (data.flightNumber !== undefined) updateData.flightNumber = data.flightNumber;
    if (data.destination !== undefined) updateData.destination = data.destination;
    if (data.hotelName !== undefined) updateData.hotelName = data.hotelName;
    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
    if (data.agencyId !== undefined) updateData.agencyId = data.agencyId || null;
    if (data.tripId !== undefined) updateData.tripId = data.tripId || null;

    // If ownerId is being updated, resolve pilgrim name
    if (data.ownerId !== undefined) {
      if (data.ownerId) {
        const pilgrim = await prisma.pilgrim.findUnique({
          where: { id: data.ownerId },
          select: { fullName: true },
        });
        if (!pilgrim) {
          res.status(404).json({ error: 'Pèlerin (propriétaire) non trouvé.' });
          return;
        }
        updateData.ownerId = data.ownerId;
        updateData.ownerName = pilgrim.fullName;
      } else {
        updateData.ownerId = null;
      }
    }

    // Support status changes (e.g., mark as lost/found)
    if ((data as any).status !== undefined) {
      const validStatuses = ['pending', 'active', 'scanned', 'lost', 'found'];
      if (!validStatuses.includes((data as any).status)) {
        res.status(400).json({
          error: 'Statut invalide.',
          validStatuses,
        });
        return;
      }
      updateData.status = (data as any).status;
    }

    const updated = await prisma.bag.update({
      where: { id },
      data: updateData,
      include: {
        trip: {
          select: { id: true, name: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('[bags.update]', error);

    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit : ce QR code existe déjà.' });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  REMOVE — Delete bag by ID
// ═══════════════════════════════════════════════════════════════
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check bag exists
    const existing = await prisma.bag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    // Hard delete
    await prisma.bag.delete({ where: { id } });

    // Update trip bag counter if the bag was linked to a trip
    if (existing.tripId) {
      const tripBagCount = await prisma.bag.count({ where: { tripId: existing.tripId } });
      await prisma.trip.update({
        where: { id: existing.tripId },
        data: { totalBags: tripBagCount },
      }).catch(() => {}); // silently ignore if trip not found
    }

    res.json({
      message: 'Bagage supprimé avec succès.',
      id,
    });
  } catch (error: any) {
    console.error('[bags.remove]', error);

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPLOAD PHOTO — Upload photo for bag (multer already processed)
// ═══════════════════════════════════════════════════════════════
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check bag exists
    const existing = await prisma.bag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    // Multer should have placed the file on req.file
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: 'Aucun fichier photo fourni.' });
      return;
    }

    // Build the public URL for the uploaded photo
    const photoUrl = `/uploads/photos/${file.filename}`;

    // Update bag with photo URL
    const updated = await prisma.bag.update({
      where: { id },
      data: { photoUrl },
      include: {
        trip: {
          select: { id: true, name: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      message: 'Photo mise à jour avec succès.',
      photoUrl,
      bag: updated,
    });
  } catch (error: any) {
    console.error('[bags.uploadPhoto]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  MARK LOST — Mark bag as lost
// ═══════════════════════════════════════════════════════════════
export async function markLost(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check bag exists
    const existing = await prisma.bag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    if (existing.status === 'lost') {
      res.status(400).json({ error: 'Ce bagage est déjà marqué comme perdu.' });
      return;
    }

    // Set status to 'lost'
    const updated = await prisma.bag.update({
      where: { id },
      data: { status: 'lost' },
      include: {
        trip: {
          select: { id: true, name: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      message: 'Bagage marqué comme perdu.',
      bag: updated,
    });
  } catch (error: any) {
    console.error('[bags.markLost]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  MARK FOUND — Mark bag as found
// ═══════════════════════════════════════════════════════════════
export async function markFound(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check bag exists
    const existing = await prisma.bag.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Bagage non trouvé.' });
      return;
    }

    if (existing.status !== 'lost') {
      res.status(400).json({ error: 'Ce bagage n\'est pas marqué comme perdu.' });
      return;
    }

    // Set status to 'found'
    const updated = await prisma.bag.update({
      where: { id },
      data: { status: 'found' },
      include: {
        trip: {
          select: { id: true, name: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      message: 'Bagage marqué comme retrouvé.',
      bag: updated,
    });
  } catch (error: any) {
    console.error('[bags.markFound]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
