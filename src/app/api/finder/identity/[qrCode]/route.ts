import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;

    const pilgrim = await db.pilgrim.findUnique({
      where: { qrCode },
      include: {
        agency: { select: { id: true, name: true, phone: true } },
        trip: { select: { id: true, name: true, status: true } },
        group: { select: { id: true, name: true, leaderPhone: true } },
      },
    });

    if (!pilgrim) {
      return NextResponse.json({ error: 'Pèlerin non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      type: 'identity',
      data: {
        qrCode: pilgrim.qrCode,
        fullName: pilgrim.fullName,
        nationality: pilgrim.nationality,
        bloodType: pilgrim.bloodType,
        allergies: pilgrim.allergies,
        medicalInfo: pilgrim.medicalInfo,
        hotelMecca: pilgrim.hotelMecca,
        roomMecca: pilgrim.roomMecca,
        hotelMedina: pilgrim.hotelMedina,
        roomMedina: pilgrim.roomMedina,
        phone: pilgrim.phone,
        familyContact: pilgrim.familyContact,
        groupLeaderPhone: pilgrim.groupLeaderPhone,
        agency: pilgrim.agency,
        trip: pilgrim.trip,
        group: pilgrim.group,
        isActive: pilgrim.isActive,
      },
    });
  } catch (error) {
    console.error('[Finder Identity] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
