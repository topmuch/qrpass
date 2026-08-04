import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgency } from '@/lib/passhajj-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAgency(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const trip = await db.trip.findFirst({
      where: { id, agencyId: auth.agencyId },
      include: {
        pilgrims: { orderBy: { fullName: 'asc' } },
        bags: { orderBy: { ownerName: 'asc' } },
        groups: { include: { _count: { select: { pilgrims: true } } } },
        leaderScans: { orderBy: { timestamp: 'desc' }, take: 100 },
        incidents: { orderBy: { timestamp: 'desc' }, take: 50 },
        _count: { select: { pilgrims: true, bags: true, leaderScans: true, incidents: true } },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Voyage non trouvé' }, { status: 404 });
    }

    // Compute stats
    const identityScans = trip.leaderScans.filter(s => s.type === 'identity' && s.status === 'success');
    const bagScans = trip.leaderScans.filter(s => s.type === 'baggage' && s.status === 'success');
    const uniquePilgrimsScanned = new Set(identityScans.map(s => s.qrCode)).size;
    const uniqueBagsScanned = new Set(bagScans.map(s => s.qrCode)).size;

    return NextResponse.json({
      success: true,
      trip,
      stats: {
        totalPilgrims: trip._count.pilgrims,
        totalBags: trip._count.bags,
        pilgrimsScanned: uniquePilgrimsScanned,
        bagsScanned: uniqueBagsScanned,
        totalScans: trip._count.leaderScans,
        totalIncidents: trip._count.incidents,
      },
    });
  } catch (error) {
    console.error('[Agency Trip Detail] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
