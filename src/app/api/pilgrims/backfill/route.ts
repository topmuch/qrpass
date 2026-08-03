import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/pilgrims/backfill
 * Backfill pilgrim records for existing baggage sets that don't have linked pilgrims,
 * AND fix existing pilgrims that have null agencyId by looking up their baggage set.
 *
 * Two passes:
 *  1. Create missing pilgrim records for baggage sets that have no linked pilgrim.
 *  2. Update existing pilgrims whose agencyId is null, using the agencyId from their
 *     corresponding baggage set (matched via pilgrim.qrCode === baggage.setId).
 */
export async function POST(request: NextRequest) {
  try {
    // ── PASS 1: Create missing pilgrim records ──
    const baggageSets = await db.baggage.findMany({
      where: {
        setId: { not: null },
      },
      select: {
        setId: true,
        agencyId: true,
      },
      distinct: ['setId'],
    });

    let created = 0;
    let existing = 0;

    if (baggageSets.length > 0) {
      // Check which setIds already have pilgrim records
      const setIdValues = baggageSets.map((b) => b.setId!).filter(Boolean);
      const existingPilgrims = await db.pilgrim.findMany({
        where: { qrCode: { in: setIdValues } },
        select: { qrCode: true },
      });
      const existingSet = new Set(existingPilgrims.map((p) => p.qrCode));
      existing = existingSet.size;

      // Create pilgrim records for setIds that don't have one (propagate agencyId from baggage)
      const newPilgrimData = baggageSets
        .filter((b) => b.setId && !existingSet.has(b.setId))
        .map((b) => ({
          qrCode: b.setId!,
          fullName: '',
          nationality: '',
          isActive: false,
          duration: '30d',
          agencyId: b.agencyId || null,
        }));

      // Batch insert
      const BATCH_SIZE = 200;
      for (let i = 0; i < newPilgrimData.length; i += BATCH_SIZE) {
        const batch = newPilgrimData.slice(i, i + BATCH_SIZE);
        // Check which qrCodes already exist to avoid unique constraint violations (SQLite doesn't support skipDuplicates)
        const existingCodes = await db.pilgrim.findMany({
          where: { qrCode: { in: batch.map(p => p.qrCode) } },
          select: { qrCode: true },
        });
        const existingCodeSet = new Set(existingCodes.map(p => p.qrCode));
        const newPilgrims = batch.filter(p => !existingCodeSet.has(p.qrCode));
        if (newPilgrims.length === 0) continue;
        const result = await db.pilgrim.createMany({ data: newPilgrims });
        created += result.count;
      }
    }

    // ── PASS 2: Fix existing pilgrims with null agencyId ──
    // Find pilgrims whose qrCode matches a baggage setId but agencyId is null
    const pilgrimsNeedingFix = await db.pilgrim.findMany({
      where: {
        agencyId: null,
        isActive: false, // Only fix unactivated pilgrims (generated but not yet activated)
      },
      select: { id: true, qrCode: true },
    });

    let updated = 0;
    if (pilgrimsNeedingFix.length > 0) {
      // Look up the corresponding baggage set for each pilgrim
      const qrCodes = pilgrimsNeedingFix.map((p) => p.qrCode);
      const matchingBaggages = await db.baggage.findMany({
        where: {
          setId: { in: qrCodes },
          agencyId: { not: null },
        },
        select: { setId: true, agencyId: true },
        distinct: ['setId'],
      });

      // Build a map of setId -> agencyId
      const agencyMap = new Map<string, string>();
      for (const b of matchingBaggages) {
        if (b.setId && b.agencyId) {
          agencyMap.set(b.setId, b.agencyId);
        }
      }

      // Update pilgrims that have a matching agencyId from their baggage set
      for (const pilgrim of pilgrimsNeedingFix) {
        const agencyIdFromBaggage = agencyMap.get(pilgrim.qrCode);
        if (agencyIdFromBaggage) {
          await db.pilgrim.update({
            where: { id: pilgrim.id },
            data: { agencyId: agencyIdFromBaggage },
          });
          updated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill complete: created ${created} pilgrim records, updated ${updated} pilgrims with missing agencyId`,
      created,
      updated,
      totalSets: baggageSets.length,
      alreadyExisting: existing,
    });
  } catch (error) {
    console.error('Pilgrim backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
