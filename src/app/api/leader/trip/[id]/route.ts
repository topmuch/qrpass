import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trip = await db.trip.findUnique({
      where: { id },
      include: {
        agency: { select: { name: true, phone: true } },
        pilgrims: {
          include: {
            group: { select: { name: true } },
            leaderScans: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
        bags: {
          include: {
            leaderScans: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
        groups: true,
        leaderScans: { orderBy: { timestamp: 'desc' }, take: 50 },
        incidents: { orderBy: { timestamp: 'desc' }, take: 20 },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Voyage non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error('[Leader Trip] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
