import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CORS headers for scan page access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Lookup a QR code across both Baggage and Pilgrim tables
// Used by /found/:code selector page to determine what type of item was scanned
// Also checks if a baggage's setId links to a Pilgrim record (Pass Identity)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Direct parallel lookups
    const [baggage, pilgrim] = await Promise.all([
      db.baggage.findUnique({ where: { reference: code } }),
      db.pilgrim.findUnique({ where: { qrCode: code } }),
    ]);

    const types: ('baggage' | 'pilgrim')[] = [];
    let linkedPilgrimCode: string | null = null;
    let linkedPilgrimActive = false;

    if (baggage) {
      types.push('baggage');
      // Check if there's a linked pilgrim via the baggage's setId
      // The pilgrim's qrCode is set to the setId when generating baggage
      if (baggage.setId) {
        const linkedPilgrim = await db.pilgrim.findUnique({
          where: { qrCode: baggage.setId },
        });
        if (linkedPilgrim) {
          linkedPilgrimCode = linkedPilgrim.qrCode;
          linkedPilgrimActive = linkedPilgrim.isActive;
          if (!types.includes('pilgrim')) {
            types.push('pilgrim');
          }
        }
      }
    }

    if (pilgrim) {
      if (!types.includes('pilgrim')) {
        types.push('pilgrim');
      }
      // If found directly by pilgrim code, no need for linkedPilgrimCode
      // The code itself IS the pilgrim code
      if (!linkedPilgrimCode) {
        linkedPilgrimCode = pilgrim.qrCode;
        linkedPilgrimActive = pilgrim.isActive;
      }
    }

    const found = types.length > 0;

    return NextResponse.json(
      {
        found,
        types,
        baggage: !!baggage,
        baggageStatus: baggage?.status ?? null,
        pilgrim: types.includes('pilgrim'),
        pilgrimActive: linkedPilgrimActive,
        // The pilgrim code to use for Pass Identity link
        // This is the setId (which is the pilgrim's qrCode) when found via baggage
        pilgrimCode: linkedPilgrimCode,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Pilgrim lookup error:', error);
    return NextResponse.json(
      { found: false, types: [], baggage: false, pilgrim: false, pilgrimCode: null, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
