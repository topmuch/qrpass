import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgency } from '@/lib/passhajj-auth';
import { getSession } from '@/lib/session';
import { createTripSchema, generateUniqueOtp } from '@/lib/passhajj-utils';

export const dynamic = 'force-dynamic';

/**
 * Resolve agencyId from either JWT Bearer token or session cookie
 */
async function resolveAgencyId(request: NextRequest): Promise<{ agencyId: string } | Response> {
  // 1. Try JWT Bearer auth first (for /agency/ route)
  try {
    const auth = requireAgency(request);
    if (!(auth instanceof Response) && auth.agencyId) {
      return { agencyId: auth.agencyId };
    }
  } catch {
    // JWT auth failed, try session
  }

  // 2. Try cookie session auth (for /agence/ route)
  const session = await getSession();
  if (session && (session.role === 'agency' || session.role === 'admin' || session.role === 'superadmin')) {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId') || session.agencyId;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID requis' }, { status: 400 });
    }
    // Security: agency users can only access their own data
    if (session.role === 'agency' && session.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }
    return { agencyId };
  }

  // Neither auth method worked
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
}

// GET - List agency's trips
export async function GET(request: NextRequest) {
  try {
    const result = await resolveAgencyId(request);
    if (result instanceof Response) return result;
    const { agencyId } = result;

    const trips = await db.trip.findMany({
      where: { agencyId },
      include: {
        _count: { select: { pilgrims: true, bags: true, leaderScans: true, incidents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, trips });
  } catch (error) {
    console.error('[Agency Trips GET] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Create a new trip with OTP
export async function POST(request: NextRequest) {
  try {
    const result = await resolveAgencyId(request);
    if (result instanceof Response) return result;
    const { agencyId } = result;

    const body = await request.json();
    const parsed = createTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: parsed.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, { status: 400 });
    }

    const data = parsed.data;

    // Generate unique OTP
    const otp = await generateUniqueOtp();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const trip = await db.trip.create({
      data: {
        name: data.name,
        agencyId,
        otp,
        otpExpiry,
        departureDate: data.departureDate ? new Date(data.departureDate) : null,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        destination: data.destination || null,
        transportMode: data.transportMode,
      },
    });

    return NextResponse.json({
      success: true,
      trip,
      otp, // Return OTP so agency can share it with group leader
    }, { status: 201 });
  } catch (error) {
    console.error('[Agency Trips POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
