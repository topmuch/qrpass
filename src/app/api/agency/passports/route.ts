import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET - List all passports (Pass Passeport) for an agency
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

    // Security: agency users can only access their own agency's passports
    if (session.role === 'agency' && session.agencyId !== agencyId) {
      return NextResponse.json(
        { error: 'Accès non autorisé pour cette agence' },
        { status: 403 }
      );
    }

    // Build filter
    const filter: Record<string, unknown> = { agencyId: agencyId };

    // Support filtering
    const onlyActive = searchParams.get('onlyActive') === 'true';
    if (onlyActive) filter.isActive = true;

    // Find passports directly by agencyId (set at generation time)
    const passports = await db.passport.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const total = passports.length;
    const active = passports.filter(p => p.status === 'active').length;
    const pending = passports.filter(p => p.status === 'pending_activation').length;
    const lost = passports.filter(p => p.status === 'lost').length;

    return NextResponse.json({
      passports: passports.map(p => ({
        id: p.id,
        qrCode: p.qrCode,
        fullName: p.fullName,
        firstName: p.firstName,
        lastName: p.lastName,
        nationality: p.nationality,
        passportNumber: p.passportNumber,
        dateOfBirth: p.dateOfBirth,
        placeOfBirth: p.placeOfBirth,
        gender: p.gender,
        photoUrl: p.photoUrl,
        phone: p.phone,
        whatsapp: p.whatsapp,
        email: p.email,
        emergencyContact: p.emergencyContact,
        emergencyPhone: p.emergencyPhone,
        homeAddress: p.homeAddress,
        travelDestination: p.travelDestination,
        travelDate: p.travelDate,
        returnDate: p.returnDate,
        notes: p.notes,
        isActive: p.isActive,
        status: p.status,
        duration: p.duration,
        expiresAt: p.expiresAt?.toISOString() || null,
        tripId: p.tripId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      stats: {
        total,
        active,
        pending,
        lost,
      },
    });
  } catch (error) {
    console.error('Error fetching agency passports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
