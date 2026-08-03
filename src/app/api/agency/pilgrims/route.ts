import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all pilgrims (Pass Identity) for an agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Find users belonging to this agency, then get their pilgrims
    const pilgrims = await db.pilgrim.findMany({
      where: {
        owner: {
          agencyId: agencyId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      pilgrims: pilgrims.map(p => ({
        id: p.id,
        qrCode: p.qrCode,
        fullName: p.fullName,
        nationality: p.nationality,
        photoUrl: p.photoUrl,
        bloodType: p.bloodType,
        medicalInfo: p.medicalInfo,
        hotelMecca: p.hotelMecca,
        roomMecca: p.roomMecca,
        hotelMedina: p.hotelMedina,
        roomMedina: p.roomMedina,
        groupLeaderPhone: p.groupLeaderPhone,
        agencyPhone: p.agencyPhone,
        familyContact: p.familyContact,
        alNusukDocUrl: p.alNusukDocUrl,
        isActive: p.isActive,
        duration: p.duration,
        expiresAt: p.expiresAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching agency pilgrims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
