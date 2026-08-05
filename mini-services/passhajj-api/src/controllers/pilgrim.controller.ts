// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Pilgrim Controller
//  Full business logic for pilgrim CRUD + QR lookup + photo upload
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { createPilgrimSchema, updatePilgrimSchema } from '../utils/validators';
import { generateIdentityQR } from '../utils/qrGenerator';

// ═══════════════════════════════════════════════════════════════
//  LIST — Paginated pilgrim listing with filters
// ═══════════════════════════════════════════════════════════════
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    // Filter by agencyId
    const agencyIdQuery = req.query.agencyId;
    if (agencyIdQuery && typeof agencyIdQuery === 'string') {
      where.agencyId = agencyIdQuery;
    }

    // Filter by tripId
    const tripIdQuery = req.query.tripId;
    if (tripIdQuery && typeof tripIdQuery === 'string') {
      where.tripId = tripIdQuery;
    }

    // Filter by groupId
    const groupIdQuery = req.query.groupId;
    if (groupIdQuery && typeof groupIdQuery === 'string') {
      where.groupId = groupIdQuery;
    }

    // Filter by isActive
    if (req.query.isActive === 'true') {
      where.isActive = true;
    } else if (req.query.isActive === 'false') {
      where.isActive = false;
    }

    // Search in fullName and qrCode
    const searchQuery = req.query.search;
    if (searchQuery && typeof searchQuery === 'string') {
      where.OR = [
        { fullName: { contains: searchQuery, mode: 'insensitive' } },
        { qrCode: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // If user is agency-scoped, restrict to their agency
    const user = (req as any).user;
    if (user?.role === 'agency' && user?.agencyId) {
      where.agencyId = user.agencyId;
    }

    const [pilgrims, total] = await Promise.all([
      prisma.pilgrim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          group: {
            select: { id: true, name: true },
          },
          trip: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.pilgrim.count({ where }),
    ]);

    res.json({
      data: pilgrims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[pilgrim.list]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY ID — Single pilgrim with group, trip, agency info
// ═══════════════════════════════════════════════════════════════
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const pilgrim = await prisma.pilgrim.findUnique({
      where: { id },
      include: {
        group: {
          select: { id: true, name: true, color: true, leaderName: true },
        },
        trip: {
          select: { id: true, name: true, status: true },
        },
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!pilgrim) {
      res.status(404).json({ error: 'Pèlerin non trouvé.' });
      return;
    }

    res.json(pilgrim);
  } catch (error: any) {
    console.error('[pilgrim.getById]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY QR — Lookup pilgrim by qrCode (scanner flash card)
//  Includes medical info for the flash card display
// ═══════════════════════════════════════════════════════════════
export async function getByQR(req: Request, res: Response): Promise<void> {
  try {
    const qrCode = req.params.qrCode as string;

    const pilgrim = await prisma.pilgrim.findUnique({
      where: { qrCode },
      include: {
        group: {
          select: { id: true, name: true, color: true },
        },
        trip: {
          select: { id: true, name: true, hotelMecca: true, hotelMedina: true },
        },
        agency: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!pilgrim) {
      res.status(404).json({ error: 'Pèlerin non trouvé pour ce QR code.' });
      return;
    }

    // Return pilgrim with medical info prominently for flash card
    res.json({
      ...pilgrim,
      medical: {
        bloodType: pilgrim.bloodType,
        allergies: pilgrim.allergies,
        diseases: pilgrim.diseases,
        medicalInfo: pilgrim.medicalInfo,
      },
    });
  } catch (error: any) {
    console.error('[pilgrim.getByQR]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  CREATE — Create a new pilgrim
//  Auto-generates qrCode if not provided
// ═══════════════════════════════════════════════════════════════
export async function create(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validate input
    const result = createPilgrimSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // 2. Auto-generate qrCode if not provided
    let qrCode = data.qrCode;
    if (!qrCode) {
      qrCode = await generateIdentityQR();
    } else {
      // Verify qrCode uniqueness if provided
      const existing = await prisma.pilgrim.findUnique({ where: { qrCode } });
      if (existing) {
        res.status(409).json({
          error: 'Ce QR code est déjà utilisé par un autre pèlerin.',
          field: 'qrCode',
        });
        return;
      }
    }

    // 3. Create the pilgrim
    const pilgrim = await prisma.pilgrim.create({
      data: {
        qrCode,
        fullName: data.fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        nationality: data.nationality,
        language: data.language,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        passportNo: data.passportNo,
        bloodType: data.bloodType,
        allergies: data.allergies,
        diseases: data.diseases,
        medicalInfo: data.medicalInfo,
        phone: data.phone,
        familyContact: data.familyContact,
        hotelMecca: data.hotelMecca,
        roomMecca: data.roomMecca,
        hotelMedina: data.hotelMedina,
        roomMedina: data.roomMedina,
        agencyId: data.agencyId,
        tripId: data.tripId,
        groupId: data.groupId,
        ownerId: (req as any).user?.userId,
      },
    });

    // 4. Update trip counter if tripId is set
    if (data.tripId) {
      await prisma.trip.update({
        where: { id: data.tripId },
        data: { totalPilgrims: { increment: 1 } },
      });
    }

    res.status(201).json(pilgrim);
  } catch (error: any) {
    console.error('[pilgrim.create]', error);

    // Handle Prisma unique constraint violation (qrCode collision)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit de contrainte unique. Réessayez.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE — Update pilgrim by ID
// ═══════════════════════════════════════════════════════════════
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Validate input
    const result = updatePilgrimSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // Check pilgrim exists
    const existing = await prisma.pilgrim.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Pèlerin non trouvé.' });
      return;
    }

    // If qrCode is being updated, check uniqueness
    if (data.qrCode && data.qrCode !== existing.qrCode) {
      const qrConflict = await prisma.pilgrim.findUnique({ where: { qrCode: data.qrCode } });
      if (qrConflict) {
        res.status(409).json({
          error: 'Ce QR code est déjà utilisé par un autre pèlerin.',
          field: 'qrCode',
        });
        return;
      }
    }

    // Build update payload — only include defined fields
    const updateData: any = {};

    if (data.qrCode !== undefined) updateData.qrCode = data.qrCode;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.passportNo !== undefined) updateData.passportNo = data.passportNo;
    if (data.bloodType !== undefined) updateData.bloodType = data.bloodType;
    if (data.allergies !== undefined) updateData.allergies = data.allergies;
    if (data.diseases !== undefined) updateData.diseases = data.diseases;
    if (data.medicalInfo !== undefined) updateData.medicalInfo = data.medicalInfo;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.familyContact !== undefined) updateData.familyContact = data.familyContact;
    if (data.hotelMecca !== undefined) updateData.hotelMecca = data.hotelMecca;
    if (data.roomMecca !== undefined) updateData.roomMecca = data.roomMecca;
    if (data.hotelMedina !== undefined) updateData.hotelMedina = data.hotelMedina;
    if (data.roomMedina !== undefined) updateData.roomMedina = data.roomMedina;
    if (data.agencyId !== undefined) updateData.agencyId = data.agencyId;
    if (data.tripId !== undefined) updateData.tripId = data.tripId;
    if (data.groupId !== undefined) updateData.groupId = data.groupId;

    const updated = await prisma.pilgrim.update({
      where: { id },
      data: updateData,
      include: {
        group: {
          select: { id: true, name: true },
        },
        trip: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('[pilgrim.update]', error);

    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit de contrainte unique.' });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Pèlerin non trouvé.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  REMOVE — Delete pilgrim by ID (hard delete)
// ═══════════════════════════════════════════════════════════════
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check pilgrim exists
    const existing = await prisma.pilgrim.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Pèlerin non trouvé.' });
      return;
    }

    // Delete the pilgrim
    await prisma.pilgrim.delete({ where: { id } });

    // Decrement trip counter if pilgrim was in a trip
    if (existing.tripId) {
      await prisma.trip.update({
        where: { id: existing.tripId },
        data: { totalPilgrims: { decrement: 1 } },
      }).catch(() => {
        // Trip may have been deleted already; ignore error
      });
    }

    res.json({
      message: 'Pèlerin supprimé avec succès.',
      id,
    });
  } catch (error: any) {
    console.error('[pilgrim.remove]', error);

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Pèlerin non trouvé.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPLOAD PHOTO — Upload photo for pilgrim via multer
//  Updates photoUrl field on the pilgrim record
// ═══════════════════════════════════════════════════════════════
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check that a file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier téléchargé.' });
      return;
    }

    // Verify pilgrim exists
    const existing = await prisma.pilgrim.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Pèlerin non trouvé.' });
      return;
    }

    // Build the photo URL path
    const photoUrl = `/uploads/photos/${req.file.filename}`;

    // Update pilgrim with new photo URL
    const updated = await prisma.pilgrim.update({
      where: { id },
      data: { photoUrl },
    });

    res.json({
      message: 'Photo mise à jour avec succès.',
      photoUrl,
      pilgrim: updated,
    });
  } catch (error: any) {
    console.error('[pilgrim.uploadPhoto]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
