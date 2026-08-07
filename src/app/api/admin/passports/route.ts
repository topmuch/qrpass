import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all passports (Pass Passeport) for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (agencyId) {
      where.agencyId = agencyId;
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { qrCode: { contains: search } },
        { nationality: { contains: search } },
        { passportNumber: { contains: search } },
      ];
    }

    const passports = await db.passport.findMany({
      where,
      include: {
        agency: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Stats
    const total = passports.length;
    const active = passports.filter(p => p.status === 'active').length;
    const pending = passports.filter(p => p.status === 'pending_activation').length;
    const lost = passports.filter(p => p.status === 'lost').length;
    const found = passports.filter(p => p.status === 'found').length;
    const blocked = passports.filter(p => p.status === 'blocked').length;

    // Agencies for filter
    const agencies = await db.agency.findMany({
      where: {
        passports: { some: {} },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

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
        agencyId: p.agencyId,
        agency: p.agency ? { name: p.agency.name } : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      stats: { total, active, pending, lost, found, blocked },
      agencies,
    });
  } catch (error) {
    console.error('Error fetching admin passports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des passeports' },
      { status: 500 }
    );
  }
}
