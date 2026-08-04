import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;

    // Try Bag model (PWA)
    const bag = await db.bag.findUnique({
      where: { qrCode },
      include: {
        agency: { select: { id: true, name: true, phone: true } },
        trip: { select: { id: true, name: true, status: true } },
      },
    });

    if (bag) {
      return NextResponse.json({
        success: true,
        type: 'baggage',
        data: {
          qrCode: bag.qrCode,
          ownerName: bag.ownerName,
          airline: bag.airline,
          flightNumber: bag.flightNumber,
          destination: bag.destination,
          hotelName: bag.hotelName,
          roomNumber: bag.roomNumber,
          baggageType: bag.baggageType,
          agency: bag.agency,
          trip: bag.trip,
        },
      });
    }

    // Try legacy Baggage model
    const baggage = await db.baggage.findUnique({
      where: { reference: qrCode },
      include: {
        agency: { select: { id: true, name: true, phone: true } },
      },
    });

    if (baggage) {
      return NextResponse.json({
        success: true,
        type: 'baggage',
        data: {
          qrCode: baggage.reference,
          ownerName: `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim(),
          airline: baggage.airlineName,
          flightNumber: baggage.flightNumber,
          destination: baggage.destination,
          hotelName: baggage.hotelName,
          roomNumber: baggage.roomNumber,
          status: baggage.status,
          agency: baggage.agency,
        },
      });
    }

    return NextResponse.json({ error: 'Bagage non trouvé' }, { status: 404 });
  } catch (error) {
    console.error('[Finder Baggage] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
