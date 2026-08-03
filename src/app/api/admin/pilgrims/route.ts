import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all pilgrims (Pass Identity) for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    // Filter by agency via owner relation
    if (agencyId) {
      where.owner = { agencyId };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { qrCode: { contains: search } },
        { nationality: { contains: search } },
      ];
    }

    const pilgrims = await db.pilgrim.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            agencyId: true,
            agency: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get unique agencies for filter
    const agencies = await db.agency.findMany({
      where: {
        users: {
          some: {
            pilgrims: { some: {} },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ pilgrims, agencies });
  } catch (error) {
    console.error('Error fetching pilgrims:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pèlerins' },
      { status: 500 }
    );
  }
}
