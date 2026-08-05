import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgency } from '@/lib/passhajj-auth';
import { getSession } from '@/lib/session';
import { generateUniqueOtp } from '@/lib/passhajj-utils';

export const dynamic = 'force-dynamic';

/**
 * Resolve agencyId from either JWT Bearer token or session cookie
 */
async function resolveAgencyId(request: NextRequest): Promise<{ agencyId: string } | Response> {
  // 1. Try JWT Bearer auth first
  try {
    const auth = requireAgency(request);
    if (!(auth instanceof Response) && auth.agencyId) {
      return { agencyId: auth.agencyId };
    }
  } catch {
    // JWT auth failed, try session
  }

  // 2. Try cookie session auth
  const session = await getSession();
  if (session && (session.role === 'agency' || session.role === 'admin' || session.role === 'superadmin')) {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId') || session.agencyId;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID requis' }, { status: 400 });
    }
    if (session.role === 'agency' && session.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }
    return { agencyId };
  }

  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await resolveAgencyId(request);
    if (result instanceof Response) return result;
    const { agencyId } = result;

    const { id } = await params;

    const trip = await db.trip.findFirst({
      where: { id, agencyId },
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

// PATCH - Update trip (including regenerate OTP)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await resolveAgencyId(request);
    if (result instanceof Response) return result;
    const { agencyId } = result;

    const { id } = await params;
    const body = await request.json();

    // Check trip exists and belongs to this agency
    const existing = await db.trip.findFirst({ where: { id, agencyId } });
    if (!existing) {
      return NextResponse.json({ error: 'Voyage non trouvé' }, { status: 404 });
    }

    // Regenerate OTP
    if (body.regenerateOtp) {
      const otp = await generateUniqueOtp();
      const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const trip = await db.trip.update({
        where: { id },
        data: { otp, otpExpiry, isUsed: false },
      });

      return NextResponse.json({ success: true, trip, otp, otpExpiry: otpExpiry.toISOString() });
    }

    // General update
    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.destination) updateData.destination = body.destination;
    if (body.transportMode) updateData.transportMode = body.transportMode;
    if (body.departureDate) updateData.departureDate = new Date(body.departureDate);
    if (body.returnDate) updateData.returnDate = new Date(body.returnDate);
    if (body.status) updateData.status = body.status;

    const trip = await db.trip.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error('[Agency Trip PATCH] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
