import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET - List all pilgrims (Pass Identity) for an agency
export async function GET(request: NextRequest) {
  try {
    // Authenticate: verify the user is logged in and is an agency user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (session.role !== 'agency' && session.role !== 'superadmin' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Security: agency users can only access their own agency's pilgrims
    if (session.role === 'agency' && session.agencyId !== agencyId) {
      return NextResponse.json(
        { error: 'Accès non autorisé pour cette agence' },
        { status: 403 }
      );
    }

    // Find pilgrims directly by agencyId (set at generation time)
    const pilgrims = await db.pilgrim.findMany({
      where: {
        agencyId: agencyId,
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
