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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Parallel lookups for better performance
    const [baggage, pilgrim] = await Promise.all([
      db.baggage.findUnique({ where: { reference: code } }),
      db.pilgrim.findUnique({ where: { qrCode: code } }),
    ]);

    const types: ('baggage' | 'pilgrim')[] = [];
    if (baggage) types.push('baggage');
    if (pilgrim) types.push('pilgrim');

    const found = types.length > 0;

    return NextResponse.json(
      {
        found,
        types,
        baggage: !!baggage,
        pilgrim: !!pilgrim,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Pilgrim lookup error:', error);
    return NextResponse.json(
      { found: false, types: [], baggage: false, pilgrim: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
