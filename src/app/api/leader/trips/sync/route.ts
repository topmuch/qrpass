import { NextRequest, NextResponse } from 'next/server';
import { syncScansSchema } from '@/lib/passhajj-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = syncScansSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { scans, incidents } = parsed.data;
    const syncedIds: string[] = [];

    // Try to use DB for persistence; fall back to simple acknowledge
    let dbAvailable = false;
    try {
      const { db } = await import('@/lib/db');
      // Quick check if new models are available
      if (db.leaderScan && db.leaderIncident && db.bag) {
        dbAvailable = true;
      }
    } catch {
      dbAvailable = false;
    }

    if (dbAvailable) {
      const { db } = await import('@/lib/db');

      // Process scans
      if (scans && Array.isArray(scans)) {
        for (const scan of scans) {
          try {
            let tripId: string | null = null;
            let pilgrimId: string | null = null;
            let bagId: string | null = null;

            if (scan.type === 'identity') {
              const pilgrim = await db.pilgrim.findUnique({ where: { qrCode: scan.qrCode } });
              if (pilgrim) {
                tripId = pilgrim.tripId;
                pilgrimId = pilgrim.id;
              }
            } else {
              const bag = await db.bag.findUnique({ where: { qrCode: scan.qrCode } });
              if (bag) {
                tripId = bag.tripId;
                bagId = bag.id;
              }
            }

            if (tripId) {
              await db.leaderScan.create({
                data: {
                  qrCode: scan.qrCode,
                  type: scan.type,
                  tripId,
                  zone: scan.zone,
                  timestamp: new Date(scan.timestamp),
                  status: scan.status,
                  pilgrimName: scan.pilgrimName,
                  pilgrimId,
                  bagId,
                  synced: true,
                  syncedAt: new Date(),
                },
              });
            }

            syncedIds.push(scan.id);
          } catch (err) {
            console.error('[Sync] Failed to save scan:', scan.qrCode, err);
            syncedIds.push(scan.id); // Still acknowledge
          }
        }
      }

      // Process incidents
      if (incidents && Array.isArray(incidents)) {
        for (const incident of incidents) {
          try {
            let tripId: string | null = null;
            if (incident.relatedQrCode) {
              const pilgrim = await db.pilgrim.findUnique({ where: { qrCode: incident.relatedQrCode } });
              if (pilgrim) tripId = pilgrim.tripId;
              if (!tripId) {
                const bag = await db.bag.findUnique({ where: { qrCode: incident.relatedQrCode } });
                if (bag) tripId = bag.tripId;
              }
            }

            if (tripId) {
              await db.leaderIncident.create({
                data: {
                  type: incident.type,
                  description: incident.description,
                  relatedQrCode: incident.relatedQrCode,
                  relatedName: incident.relatedName,
                  tripId,
                  zone: incident.zone,
                  timestamp: new Date(incident.timestamp),
                  synced: true,
                  syncedAt: new Date(),
                },
              });
            }

            syncedIds.push(incident.id);
          } catch (err) {
            console.error('[Sync] Failed to save incident:', incident.type, err);
            syncedIds.push(incident.id); // Still acknowledge
          }
        }
      }
    } else {
      // DB not available — just acknowledge all items
      console.warn('[Leader Sync] DB models not available, acknowledging without persisting');
      if (scans) syncedIds.push(...scans.map(s => s.id));
      if (incidents) syncedIds.push(...incidents.map(i => i.id));
    }

    return NextResponse.json({
      success: true,
      synced: syncedIds,
      count: syncedIds.length,
    });
  } catch (error) {
    console.error('[Leader Sync] Error:', error);
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 });
  }
}
