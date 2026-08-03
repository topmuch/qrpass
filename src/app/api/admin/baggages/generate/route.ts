import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReferencesBulk, generateUniqueSetId } from '@/lib/qr';
import { db } from '@/lib/db';

// Schema for agency generation — Hajj only
const agencySchema = z.object({
  context: z.literal('agency'),
  type: z.literal('hajj'),
  passType: z.enum(['bagage', 'identity']).optional(), // 'bagage' = 2 soute QR only
  agencyId: z.string().min(1),
  count: z.number().min(1).max(2),
  travelerCount: z.number().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = agencySchema.parse(body);

    // Generate for agency — Hajj only (Pass Bagage: 2 soute QR per pilgrim)
    const result = await generateBaggagesBatch({
      type: 'hajj',
      agencyId: validatedData.agencyId,
      travelerCount: validatedData.travelerCount,
      count: validatedData.count,
    });

    return NextResponse.json({
      success: true,
      generated: result.length,
      references: result
    });
  } catch (error) {
    console.error('Generate QR error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate baggages for agency using BATCH INSERT for high performance.
 * Pass Bagage: 2 bags per pilgrim (soute only, no cabine)
 */
async function generateBaggagesBatch(options: {
  type: 'hajj';
  agencyId: string;
  travelerCount: number;
  count: 1 | 2;
}): Promise<string[]> {
  const { type, agencyId, travelerCount, count } = options;
  const totalBaggages = travelerCount * count;

  console.log(`[GENERATE] Starting bulk generation: ${travelerCount} pilgrims × ${count} bags = ${totalBaggages} QR codes`);

  // Pre-generate all set IDs with uniqueness check (async, checks pilgrim table)
  const setIds: string[] = [];
  for (let t = 0; t < travelerCount; t++) {
    setIds.push(await generateUniqueSetId(type));
  }

  // Generate ALL references in bulk
  const allReferences = await generateReferencesBulk(type, totalBaggages);

  // Build all baggage data
  const allData: Array<{
    reference: string;
    type: string;
    setId: string;
    agencyId: string | null;
    baggageIndex: number;
    baggageType: string;
    status: string;
  }> = [];

  let refIndex = 0;
  for (let t = 0; t < travelerCount; t++) {
    const setId = setIds[t];
    for (let i = 0; i < count; i++) {
      allData.push({
        reference: allReferences[refIndex++],
        type,
        setId,
        agencyId,
        baggageIndex: i + 1,
        // All bags are soute only (no cabine)
        baggageType: 'soute',
        status: 'pending_activation',
      });
    }
  }

  // Batch insert in chunks of 200 for memory efficiency
  const BATCH_SIZE = 200;
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    await db.baggage.createMany({ data: batch });
    console.log(`[GENERATE] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} baggages (total: ${Math.min(i + BATCH_SIZE, allData.length)}/${allData.length})`);
  }

  // Create a Pilgrim record per set (Pass Identity linked to the baggage set)
  // The pilgrim's qrCode = the setId, so the selector page can find it
  const pilgrimData = setIds.map((setId) => ({
    qrCode: setId,
    fullName: '', // Will be filled during activation
    nationality: '', // Will be filled during activation
    isActive: false,
    duration: '60d', // Fixed 2 months
  }));

  // Batch insert pilgrims in chunks of 200
  // Note: skipDuplicates is not supported by SQLite, so we filter out existing qrCodes first
  for (let i = 0; i < pilgrimData.length; i += BATCH_SIZE) {
    const batch = pilgrimData.slice(i, i + BATCH_SIZE);
    // Check which qrCodes already exist to avoid unique constraint violations
    const existingCodes = await db.pilgrim.findMany({
      where: { qrCode: { in: batch.map(p => p.qrCode) } },
      select: { qrCode: true },
    });
    const existingSet = new Set(existingCodes.map(p => p.qrCode));
    const newPilgrims = batch.filter(p => !existingSet.has(p.qrCode));
    if (newPilgrims.length > 0) {
      await db.pilgrim.createMany({ data: newPilgrims });
    }
    console.log(`[GENERATE] Inserted pilgrims batch ${Math.floor(i / BATCH_SIZE) + 1}: ${newPilgrims.length} new pilgrims (${existingSet.size} duplicates skipped)`);
  }

  console.log(`[GENERATE] Complete: ${totalBaggages} QR codes + ${travelerCount} pilgrim identities generated for ${travelerCount} pilgrims`);
  return allReferences;
}

// GET - Get all baggages (for QR codes list)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500');

    const where: Record<string, unknown> = {};

    if (agencyId) {
      where.agencyId = agencyId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const baggages = await db.baggage.findMany({
      where,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
