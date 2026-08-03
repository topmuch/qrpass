import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/pilgrims/backfill
 * Backfill pilgrim records for existing baggage sets that don't have linked pilgrims.
 * This is a one-time migration endpoint to create Pilgrim records for baggage
 * sets that were generated before the Pass Identity feature was implemented.
 * 
 * The pilgrim's qrCode is set to the baggage's setId, linking them together.
 */
export async function POST(request: NextRequest) {
  try {
    // Find all distinct setId values from baggage that don't have a linked pilgrim
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

    if (baggageSets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No baggage sets found to backfill',
        created: 0,
      });
    }

    // Check which setIds already have pilgrim records
    const setIdValues = baggageSets.map((b) => b.setId!).filter(Boolean);
    const existingPilgrims = await db.pilgrim.findMany({
      where: { qrCode: { in: setIdValues } },
      select: { qrCode: true },
    });
    const existingSet = new Set(existingPilgrims.map((p) => p.qrCode));

    // Create pilgrim records for setIds that don't have one
    const newPilgrimData = baggageSets
      .filter((b) => b.setId && !existingSet.has(b.setId))
      .map((b) => ({
        qrCode: b.setId!,
        fullName: '',
        nationality: '',
        isActive: false,
        duration: '30d',
      }));

    if (newPilgrimData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All baggage sets already have linked pilgrim records',
        created: 0,
        existing: existingSet.size,
      });
    }

    // Batch insert
    const BATCH_SIZE = 200;
    let created = 0;
    for (let i = 0; i < newPilgrimData.length; i += BATCH_SIZE) {
      const batch = newPilgrimData.slice(i, i + BATCH_SIZE);
      const result = await db.pilgrim.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += result.count;
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} pilgrim records for existing baggage sets`,
      created,
      totalSets: baggageSets.length,
      alreadyExisting: existingSet.size,
    });
  } catch (error) {
    console.error('Pilgrim backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
