// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Scan Controller
//  Business logic for scan records: list, getById, stats, unsynced
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';

// ═══════════════════════════════════════════════════════════════
//  LIST — Paginated scan listing with filters
//  ?tripId= &type= &zone= &synced= &from= &to=
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

    // Filter by type (identity | baggage)
    const type = req.query.type as string | undefined;
    if (type) {
      where.type = type;
    }

    // Filter by zone
    const zone = req.query.zone as string | undefined;
    if (zone) {
      where.zone = zone;
    }

    // Filter by synced status
    if (req.query.synced !== undefined) {
      where.synced = req.query.synced === 'true';
    }

    // Date range filter (from / to on timestamp)
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (from || to) {
      where.timestamp = {};
      if (from) {
        where.timestamp.gte = new Date(from);
      }
      if (to) {
        where.timestamp.lte = new Date(to);
      }
    }

    const [scans, total] = await Promise.all([
      prisma.scanRecord.findMany({
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
      prisma.scanRecord.count({ where }),
    ]);

    // Enrich with pilgrim/bag info where available
    const results = await Promise.all(
      scans.map(async (scan) => {
        const enriched: any = { ...scan };

        // If identity scan, try to include pilgrim info
        if (scan.type === 'identity' && scan.qrCode) {
          const pilgrim = await prisma.pilgrim.findUnique({
            where: { qrCode: scan.qrCode },
            select: { id: true, fullName: true, bloodType: true, hotelMecca: true, hotelMedina: true },
          });
          if (pilgrim) {
            enriched.pilgrim = pilgrim;
          }
        }

        // If baggage scan, try to include bag info
        if (scan.type === 'baggage' && scan.qrCode) {
          const bag = await prisma.bag.findUnique({
            where: { qrCode: scan.qrCode },
            select: { id: true, ownerName: true, baggageType: true, status: true, hotelName: true },
          });
          if (bag) {
            enriched.bag = bag;
          }
        }

        return enriched;
      }),
    );

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
    console.error('[scan.list]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET BY ID — Single scan record by ID
// ═══════════════════════════════════════════════════════════════
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const scan = await prisma.scanRecord.findUnique({
      where: { id },
      include: {
        trip: {
          select: { id: true, name: true, agencyId: true },
        },
      },
    });

    if (!scan) {
      res.status(404).json({ error: 'Scan non trouvé.' });
      return;
    }

    // Enrich with pilgrim/bag info
    const enriched: any = { ...scan };

    if (scan.type === 'identity' && scan.qrCode) {
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { qrCode: scan.qrCode },
        select: {
          id: true, fullName: true, firstName: true, lastName: true,
          bloodType: true, allergies: true, hotelMecca: true, roomMecca: true,
          hotelMedina: true, roomMedina: true, group: { select: { id: true, name: true } },
        },
      });
      if (pilgrim) {
        enriched.pilgrim = pilgrim;
      }
    }

    if (scan.type === 'baggage' && scan.qrCode) {
      const bag = await prisma.bag.findUnique({
        where: { qrCode: scan.qrCode },
        select: {
          id: true, ownerName: true, ownerId: true, baggageType: true, baggageIndex: true,
          airline: true, flightNumber: true, status: true, hotelName: true, roomNumber: true,
        },
      });
      if (bag) {
        enriched.bag = bag;
      }
    }

    res.json(enriched);
  } catch (error: any) {
    console.error('[scan.getById]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET STATS — Scan statistics for a trip
//  ?tripId= (required)
//  Returns: total scans, by type, by zone, by status, timeline by hour
// ═══════════════════════════════════════════════════════════════
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const tripId = req.query.tripId as string | undefined;
    if (!tripId) {
      res.status(400).json({ error: 'Paramètre tripId requis.' });
      return;
    }

    // Verify trip exists
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      res.status(404).json({ error: 'Voyage non trouvé.' });
      return;
    }

    const baseWhere = { tripId };

    // Total scans
    const total = await prisma.scanRecord.count({ where: baseWhere });

    // Scans by type
    const byTypeRaw = await prisma.scanRecord.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true },
    });
    const byType: Record<string, number> = {};
    for (const row of byTypeRaw) {
      byType[row.type] = row._count.type;
    }

    // Scans by zone
    const byZoneRaw = await prisma.scanRecord.groupBy({
      by: ['zone'],
      where: baseWhere,
      _count: { zone: true },
    });
    const byZone: Record<string, number> = {};
    for (const row of byZoneRaw) {
      byZone[row.zone] = row._count.zone;
    }

    // Scans by status
    const byStatusRaw = await prisma.scanRecord.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { status: true },
    });
    const byStatus: Record<string, number> = {};
    for (const row of byStatusRaw) {
      byStatus[row.status] = row._count.status;
    }

    // Timeline grouped by hour (last 24h or all if few records)
    // Prisma groupBy doesn't support date truncation on SQLite,
    // so we fetch timestamps and group in JS
    const allScans = await prisma.scanRecord.findMany({
      where: baseWhere,
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    // Group by hour (YYYY-MM-DD HH:00)
    const timeline: Record<string, number> = {};
    for (const scan of allScans) {
      const d = new Date(scan.timestamp);
      const hourKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      timeline[hourKey] = (timeline[hourKey] || 0) + 1;
    }

    // Sync stats
    const syncedCount = await prisma.scanRecord.count({ where: { ...baseWhere, synced: true } });
    const unsyncedCount = await prisma.scanRecord.count({ where: { ...baseWhere, synced: false } });

    res.json({
      tripId,
      total,
      byType,
      byZone,
      byStatus,
      sync: {
        synced: syncedCount,
        unsynced: unsyncedCount,
      },
      timeline,
    });
  } catch (error: any) {
    console.error('[scan.getStats]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET UNSYNCED — All ScanRecords where synced=false
//  Optional ?tripId= filter
// ═══════════════════════════════════════════════════════════════
export async function getUnsynced(req: Request, res: Response): Promise<void> {
  try {
    const where: any = { synced: false };

    const tripId = req.query.tripId as string | undefined;
    if (tripId) {
      where.tripId = tripId;
    }

    const unsynced = await prisma.scanRecord.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        trip: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      data: unsynced,
      count: unsynced.length,
    });
  } catch (error: any) {
    console.error('[scan.getUnsynced]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
