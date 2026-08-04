import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgency } from '@/lib/passhajj-auth';
import { createTripSchema, generateUniqueOtp } from '@/lib/passhajj-utils';

// GET - List agency's trips
export async function GET(request: NextRequest) {
  try {
    const auth = requireAgency(request);
    if (auth instanceof Response) return auth;

    const trips = await db.trip.findMany({
      where: { agencyId: auth.agencyId },
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
    const auth = requireAgency(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = createTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const data = parsed.data;

    // Generate unique OTP
    const otp = await generateUniqueOtp();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const trip = await db.trip.create({
      data: {
        name: data.name,
        agencyId: auth.agencyId!,
        otp,
        otpExpiry,
        departureDate: data.departureDate ? new Date(data.departureDate) : null,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        destination: data.destination,
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
