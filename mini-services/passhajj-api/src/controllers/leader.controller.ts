// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Leader Controller
//  Business logic for PWA group leader endpoints (OTP-based auth)
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { verifyOtpSchema, syncScansSchema, createIncidentSchema } from '../utils/validators';

// ─────────────────────────────────────────────────────────────────
//  verifyOTP — PWA entry point: OTP login → full trip data dump
// ─────────────────────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate OTP input
    const result = verifyOtpSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const { otp } = result.data;

    // 2. Find trip with matching OTP that hasn't expired and is active
    const trip = await prisma.trip.findFirst({
      where: {
        otp,
        otpExpiry: { gt: new Date() },
        status: 'active',
      },
    });

    if (!trip) {
      res.status(401).json({ error: 'Code OTP invalide ou expiré' });
      return;
    }

    // 3. Load FULL trip data for offline PWA cache

    // Agency name
    const agency = await prisma.agency.findUnique({
      where: { id: trip.agencyId },
      select: { id: true, name: true, phone: true, whatsapp: true },
    });

    // All pilgrims for this trip
    const pilgrims = await prisma.pilgrim.findMany({
      where: { tripId: trip.id },
      select: {
        id: true,
        qrCode: true,
        fullName: true,
        bloodType: true,
        allergies: true,
        groupId: true,
        group: { select: { id: true, name: true } },
        hotelMecca: true,
        roomMecca: true,
      },
    });

    // All bags for this trip
    const bags = await prisma.bag.findMany({
      where: { tripId: trip.id },
      select: {
        id: true,
        qrCode: true,
        ownerName: true,
        ownerId: true,
        baggageType: true,
        airline: true,
        flightNumber: true,
        status: true,
      },
    });

    // All groups for this trip
    const groups = await prisma.pilgrimGroup.findMany({
      where: { tripId: trip.id },
      select: {
        id: true,
        name: true,
        color: true,
        leaderName: true,
      },
    });

    // 4. Mark trip as otpUsed (audit trail)
    await prisma.trip.update({
      where: { id: trip.id },
      data: { otpUsed: true },
    });

    // 5. Return complete trip data for PWA IndexedDB cache
    res.json({
      success: true,
      trip: {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        status: trip.status,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        destination: trip.destination,
        transportMode: trip.transportMode,
        airline: trip.airline,
        flightNumber: trip.flightNumber,
        hotelMecca: trip.hotelMecca,
        hotelMedina: trip.hotelMedina,
        totalPilgrims: trip.totalPilgrims,
        totalBags: trip.totalBags,
        scannedPilgrims: trip.scannedPilgrims,
        scannedBags: trip.scannedBags,
        otpUsed: true,
        createdAt: trip.createdAt,
      },
      agency,
      pilgrims,
      bags,
      groups,
    });
  } catch (error) {
    console.error('[verifyOTP] Error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────
//  syncScans — Sync offline scan records from PWA to server
// ─────────────────────────────────────────────────────────────────
export const syncScans = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate input
    const result = syncScansSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const { tripId, scans } = result.data;
    const synced: string[] = [];
    const skipped: string[] = [];

    // 2. Process each scan
    for (const scan of scans) {
      const scanTimestamp = new Date(scan.timestamp);

      // 2a. Dedup: check if ScanRecord with same qrCode and timestamp (within 1s) exists
      const existing = await prisma.scanRecord.findFirst({
        where: {
          qrCode: scan.qrCode,
          tripId,
          timestamp: {
            gte: new Date(scanTimestamp.getTime() - 1000),
            lte: new Date(scanTimestamp.getTime() + 1000),
          },
        },
      });

      if (existing) {
        // 2b. Duplicate → skip
        skipped.push(scan.id);
        continue;
      }

      // 2c. Resolve the scan: find linked entity
      let pilgrimId: string | null = null;
      let pilgrimName: string | null = scan.pilgrimName || null;
      let bagId: string | null = null;

      if (scan.type === 'identity') {
        const pilgrim = await prisma.pilgrim.findUnique({
          where: { qrCode: scan.qrCode },
          select: { id: true, fullName: true },
        });
        if (pilgrim) {
          pilgrimId = pilgrim.id;
          pilgrimName = pilgrim.fullName;
        }
      } else if (scan.type === 'baggage') {
        const bag = await prisma.bag.findUnique({
          where: { qrCode: scan.qrCode },
          select: { id: true, ownerName: true },
        });
        if (bag) {
          bagId = bag.id;
          if (!pilgrimName) pilgrimName = bag.ownerName;
        }
      }

      // 2d. Create ScanRecord
      const scanRecord = await prisma.scanRecord.create({
        data: {
          qrCode: scan.qrCode,
          type: scan.type,
          tripId,
          zone: scan.zone,
          timestamp: scanTimestamp,
          status: scan.status,
          pilgrimName,
          pilgrimId,
          bagId,
          synced: true,
          syncedAt: new Date(),
          deviceInfo: scan.deviceInfo,
        },
      });

      // 2e. Update trip counters if entity was found
      if (scan.type === 'identity' && pilgrimId) {
        await prisma.trip.update({
          where: { id: tripId },
          data: { scannedPilgrims: { increment: 1 } },
        });
      } else if (scan.type === 'baggage' && bagId) {
        await prisma.trip.update({
          where: { id: tripId },
          data: { scannedBags: { increment: 1 } },
        });
      }

      // 2f. Add to synced array (use server-generated ID)
      synced.push(scanRecord.id);
    }

    // 3. Return results
    res.json({
      success: true,
      synced,
      skipped,
      count: synced.length,
    });
  } catch (error) {
    console.error('[syncScans] Error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────
//  syncIncidents — Sync offline incident reports from PWA
// ─────────────────────────────────────────────────────────────────
export const syncIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { incidents } = req.body as { incidents: unknown[] };

    if (!Array.isArray(incidents) || incidents.length === 0) {
      res.status(400).json({ error: 'Tableau d\'incidents requis.' });
      return;
    }

    const synced: string[] = [];
    const skipped: string[] = [];

    for (const incidentData of incidents) {
      // Validate each incident
      const result = createIncidentSchema.safeParse(incidentData);
      if (!result.success) {
        // Skip invalid incidents
        continue;
      }

      const data = result.data;
      const incidentTimestamp = new Date(data.timestamp);

      // Dedup: check for existing incident with same type + relatedQrCode + timestamp (±1s)
      const existing = await prisma.incident.findFirst({
        where: {
          type: data.type,
          relatedQrCode: data.relatedQrCode ?? null,
          tripId: data.tripId,
          timestamp: {
            gte: new Date(incidentTimestamp.getTime() - 1000),
            lte: new Date(incidentTimestamp.getTime() + 1000),
          },
        },
      });

      if (existing) {
        skipped.push(existing.id);
        continue;
      }

      // Create Incident record
      const incident = await prisma.incident.create({
        data: {
          type: data.type,
          description: data.description,
          relatedQrCode: data.relatedQrCode,
          relatedName: data.relatedName,
          tripId: data.tripId,
          zone: data.zone,
          timestamp: incidentTimestamp,
          priority: data.priority,
          latitude: data.latitude,
          longitude: data.longitude,
          synced: true,
          syncedAt: new Date(),
        },
      });

      synced.push(incident.id);
    }

    res.json({
      success: true,
      synced,
      skipped,
      count: synced.length,
    });
  } catch (error) {
    console.error('[syncIncidents] Error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────
//  getTripStatus — Current trip stats for dashboard
// ─────────────────────────────────────────────────────────────────
export const getTripStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        name: true,
        status: true,
        totalPilgrims: true,
        totalBags: true,
        scannedPilgrims: true,
        scannedBags: true,
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    // Count recent scans (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScansCount = await prisma.scanRecord.count({
      where: {
        tripId: tripId as string,
        timestamp: { gte: twentyFourHoursAgo },
      },
    });

    res.json({
      ...trip,
      recentScansCount,
    });
  } catch (error) {
    console.error('[getTripStatus] Error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────────
//  getPendingSync — Items that haven't been synced yet
// ─────────────────────────────────────────────────────────────────
export const getPendingSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const tripId = req.params.tripId as string;

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });

    if (!trip) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    // Pending scan records
    const pendingScans = await prisma.scanRecord.findMany({
      where: { tripId, synced: false },
      orderBy: { timestamp: 'desc' },
    });

    // Pending incidents
    const pendingIncidents = await prisma.incident.findMany({
      where: { tripId, synced: false },
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      tripId,
      pendingScans: {
        count: pendingScans.length,
        items: pendingScans,
      },
      pendingIncidents: {
        count: pendingIncidents.length,
        items: pendingIncidents,
      },
      totalPending: pendingScans.length + pendingIncidents.length,
    });
  } catch (error) {
    console.error('[getPendingSync] Error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};
