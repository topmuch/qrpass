import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { finderReportSchema } from '@/lib/passhajj-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = finderReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { qrCode, finderName, finderPhone, message } = parsed.data;

    // Check if it's a pilgrim
    const pilgrim = await db.pilgrim.findUnique({ where: { qrCode } });
    if (pilgrim) {
      const report = await db.pilgrimReport.create({
        data: {
          pilgrimId: pilgrim.id,
          finderName,
          finderPhone,
          message: message || null,
        },
      });
      return NextResponse.json({ success: true, type: 'identity', report }, { status: 201 });
    }

    // Check if it's a bag
    const bag = await db.bag.findUnique({ where: { qrCode } });
    if (bag) {
      // Update bag scan log
      await db.scanLog.create({
        data: {
          baggageId: bag.id,
          finderName,
          finderPhone,
          message: message || null,
          context: 'finder_report',
        },
      });
      return NextResponse.json({ success: true, type: 'baggage' }, { status: 201 });
    }

    // Check legacy Baggage
    const baggage = await db.baggage.findUnique({ where: { reference: qrCode } });
    if (baggage) {
      await db.scanLog.create({
        data: {
          baggageId: baggage.id,
          finderName,
          finderPhone,
          message: message || null,
          context: 'finder_report',
        },
      });
      return NextResponse.json({ success: true, type: 'baggage' }, { status: 201 });
    }

    return NextResponse.json({ error: 'QR code non trouvé' }, { status: 404 });
  } catch (error) {
    console.error('[Finder Report] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
