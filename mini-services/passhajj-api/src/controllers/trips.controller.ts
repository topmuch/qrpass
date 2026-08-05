// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Trips Controller
//  Full business logic for trip CRUD, OTP, pilgrim & bag creation
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { createTripSchema, updateTripSchema } from '../utils/validators';
import { generateIdentityQR, generateBaggageQR, generateOTP } from '../utils/qrGenerator';

// ═══════════════════════════════════════════════════════════════
//  LIST — Paginated trip listing with filters
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

    const statusQuery = req.query.status;
    if (statusQuery && typeof statusQuery === 'string') {
      where.status = statusQuery;
    }

    // If user is agency-scoped, restrict to their agency
    const user = (req as any).user;
    if (user?.role === 'agency' && user?.agencyId) {
      where.agencyId = user.agencyId;
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agency: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { pilgrims: true, bags: true },
          },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    // Flatten counts into response
    const results = trips.map((trip: any) => ({
      ...trip,
      pilgrimCount: trip._count.pilgrims,
      bagCount: trip._count.bags,
    }));

    // Remove _count from each result
    for (const r of results) {
      delete r._count;
    }

    res.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[trips.list]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY ID — Single trip with full details
// ═══════════════════════════════════════════════════════════════
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        agency: {
          select: { id: true, name: true, slug: true, email: true, phone: true },
        },
        groups: {
          select: { id: true, name: true, color: true, leaderName: true, _count: { select: { pilgrims: true } } },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { pilgrims: true, bags: true },
        },
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    const { _count, ...tripData } = trip as any;

    res.json({
      ...tripData,
      pilgrimCount: _count.pilgrims,
      bagCount: _count.bags,
    });
  } catch (error: any) {
    console.error('[trips.getById]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  CREATE — Full trip creation with OTP, pilgrims, and bags
// ═══════════════════════════════════════════════════════════════
export async function create(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validate input
    const result = createTripSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error,
      });
      return;
    }

    const data = result.data;

    // 2. Verify agency exists
    const agency = await prisma.agency.findUnique({ where: { id: data.agencyId } });
    if (!agency) {
      res.status(404).json({ error: 'Agence non trouvée.' });
      return;
    }

    // 3. Generate 4-digit OTP
    const otp = await generateOTP();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

    // 4. Create the Trip
    const trip = await prisma.trip.create({
      data: {
        name: data.name,
        description: data.description,
        agencyId: data.agencyId,
        otp,
        otpExpiry,
        otpUsed: false,
        status: 'active',
        departureDate: data.departureDate ? new Date(data.departureDate) : null,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        destination: data.destination,
        transportMode: data.transportMode,
        airline: data.airline,
        flightNumber: data.flightNumber,
        hotelMecca: data.hotelMecca,
        hotelMedina: data.hotelMedina,
      },
    });

    // 5. Create pilgrims if provided
    const createdPilgrims: { id: string; fullName: string }[] = [];

    if (data.pilgrims && data.pilgrims.length > 0) {
      for (const pilgrimData of data.pilgrims) {
        const qrCode = await generateIdentityQR();

        const pilgrim = await prisma.pilgrim.create({
          data: {
            qrCode,
            fullName: pilgrimData.fullName,
            firstName: pilgrimData.firstName,
            lastName: pilgrimData.lastName,
            nationality: pilgrimData.nationality,
            gender: pilgrimData.gender,
            bloodType: pilgrimData.bloodType,
            allergies: pilgrimData.allergies,
            diseases: pilgrimData.diseases,
            medicalInfo: pilgrimData.medicalInfo,
            phone: pilgrimData.phone,
            familyContact: pilgrimData.familyContact,
            hotelMecca: pilgrimData.hotelMecca,
            roomMecca: pilgrimData.roomMecca,
            hotelMedina: pilgrimData.hotelMedina,
            roomMedina: pilgrimData.roomMedina,
            agencyId: trip.agencyId,
            tripId: trip.id,
          },
        });

        createdPilgrims.push({ id: pilgrim.id, fullName: pilgrim.fullName });
      }
    }

    // 6. Create bags if provided
    let createdBagsCount = 0;

    if (data.bags && data.bags.length > 0) {
      for (const bagData of data.bags) {
        const qrCode = await generateBaggageQR();

        // Resolve ownerId: if numeric (or numeric string), treat as index into createdPilgrims
        let resolvedOwnerId: string | undefined = undefined;
        if (bagData.ownerId !== undefined && bagData.ownerId !== null) {
          // Check if ownerId is a number or a numeric string representing an index
          const parsedIndex = Number(bagData.ownerId);
          if (!isNaN(parsedIndex) && Number.isInteger(parsedIndex) && parsedIndex >= 0 && parsedIndex < createdPilgrims.length) {
            // It's a valid index — resolve to actual pilgrim ID
            resolvedOwnerId = createdPilgrims[parsedIndex].id;
          } else {
            // It's a direct pilgrim ID string (cuid)
            resolvedOwnerId = String(bagData.ownerId);
          }
        }

        await prisma.bag.create({
          data: {
            qrCode,
            ownerName: bagData.ownerName,
            ownerId: resolvedOwnerId,
            baggageType: bagData.baggageType,
            baggageIndex: bagData.baggageIndex,
            color: bagData.color,
            description: bagData.description,
            airline: bagData.airline,
            flightNumber: bagData.flightNumber,
            destination: bagData.destination,
            hotelName: bagData.hotelName,
            roomNumber: bagData.roomNumber,
            agencyId: trip.agencyId,
            tripId: trip.id,
          },
        });

        createdBagsCount++;
      }
    }

    // 7. Update trip counters
    const totalPilgrims = createdPilgrims.length;
    const totalBags = createdBagsCount;

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        totalPilgrims,
        totalBags,
      },
    });

    // 8. Return the trip with OTP and counts
    res.status(201).json({
      ...trip,
      otp,
      otpExpiry,
      totalPilgrims,
      totalBags,
      createdPilgrimsCount: totalPilgrims,
      createdBagsCount: totalBags,
    });
  } catch (error: any) {
    console.error('[trips.create]', error);

    // Handle Prisma unique constraint errors (OTP collision)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit de contrainte unique. Réessayez.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE — Update trip by ID
// ═══════════════════════════════════════════════════════════════
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Validate input
    const result = updateTripSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error,
      });
      return;
    }

    const data = result.data;

    // Check trip exists
    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    // Build update payload
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.agencyId !== undefined) updateData.agencyId = data.agencyId;
    if (data.departureDate !== undefined) updateData.departureDate = data.departureDate ? new Date(data.departureDate) : null;
    if (data.returnDate !== undefined) updateData.returnDate = data.returnDate ? new Date(data.returnDate) : null;
    if (data.destination !== undefined) updateData.destination = data.destination;
    if (data.transportMode !== undefined) updateData.transportMode = data.transportMode;
    if (data.airline !== undefined) updateData.airline = data.airline;
    if (data.flightNumber !== undefined) updateData.flightNumber = data.flightNumber;
    if (data.hotelMecca !== undefined) updateData.hotelMecca = data.hotelMecca;
    if (data.hotelMedina !== undefined) updateData.hotelMedina = data.hotelMedina;

    // Allow status updates (active, completed, cancelled)
    if ((data as any).status !== undefined) {
      updateData.status = (data as any).status;
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        agency: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('[trips.update]', error);

    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  REMOVE — Soft-delete (set status='cancelled')
// ═══════════════════════════════════════════════════════════════
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check trip exists
    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    if (existing.status === 'cancelled') {
      res.status(400).json({ error: 'Ce voyage est déjà annulé.' });
      return;
    }

    // Soft-delete: set status to 'cancelled'
    const cancelled = await prisma.trip.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({
      message: 'Voyage annulé avec succès.',
      trip: cancelled,
    });
  } catch (error: any) {
    console.error('[trips.remove]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  REGENERATE OTP — Generate a new OTP for an existing trip
// ═══════════════════════════════════════════════════════════════
export async function regenerateOTP(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    // Check trip exists
    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    // Generate new OTP
    const newOtp = await generateOTP();
    const newOtpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

    // Update trip with new OTP
    const updated = await prisma.trip.update({
      where: { id },
      data: {
        otp: newOtp,
        otpExpiry: newOtpExpiry,
        otpUsed: false,
      },
    });

    res.json({
      message: 'Nouveau OTP généré avec succès.',
      otp: newOtp,
      otpExpiry: newOtpExpiry,
      tripId: updated.id,
      tripName: updated.name,
    });
  } catch (error: any) {
    console.error('[trips.regenerateOTP]', error);

    // Handle unique constraint collision (extremely unlikely)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflit OTP. Réessayez.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
