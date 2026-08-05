import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/passhajj-auth';
import { activateBaggageSchema, generateQrCode } from '@/lib/passhajj-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = activateBaggageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const data = parsed.data;

    // Generate QR code if not provided
    let qrCode = data.qrCode;
    if (!qrCode.startsWith('BG-')) {
      qrCode = await generateQrCode('BG');
    }

    // Check uniqueness
    const existing = await db.bag.findUnique({ where: { qrCode } });
    if (existing) {
      return NextResponse.json({ error: 'QR code déjà utilisé' }, { status: 409 });
    }

    const bag = await db.bag.create({
      data: {
        qrCode,
        ownerName: data.ownerName,
        airline: data.airline,
        flightNumber: data.flightNumber,
        destination: data.destination,
        hotelName: data.hotelName,
        roomNumber: data.roomNumber,
        agencyId: auth.agencyId,
      },
    });

    return NextResponse.json({ success: true, bag }, { status: 201 });
  } catch (error) {
    console.error('[Activate Baggage] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
