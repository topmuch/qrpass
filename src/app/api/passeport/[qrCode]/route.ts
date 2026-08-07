import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CORS headers for scan page access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Retrieve passport info for the scan page / dashboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;

    const passport = await db.passport.findUnique({
      where: { qrCode },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        agency: {
          select: { name: true, phone: true },
        },
      },
    });

    if (!passport) {
      return NextResponse.json(
        { status: 'not_found', message: 'Passport not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if not activated
    if (!passport.isActive) {
      return NextResponse.json(
        {
          status: 'not_activated',
          message: 'This passport sticker has not been activated yet',
          qrCode: passport.qrCode,
        },
        { headers: corsHeaders }
      );
    }

    // Check if expired
    if (passport.expiresAt && new Date() > passport.expiresAt) {
      return NextResponse.json(
        {
          status: 'expired',
          message: 'This passport sticker has expired',
          qrCode: passport.qrCode,
          expiredAt: passport.expiresAt.toISOString(),
          fullName: passport.fullName,
          nationality: passport.nationality,
        },
        { headers: corsHeaders }
      );
    }

    // Return full passport data
    return NextResponse.json(
      {
        status: 'active',
        passport: {
          id: passport.id,
          qrCode: passport.qrCode,
          fullName: passport.fullName,
          firstName: passport.firstName,
          lastName: passport.lastName,
          nationality: passport.nationality,
          passportNumber: passport.passportNumber,
          dateOfBirth: passport.dateOfBirth,
          placeOfBirth: passport.placeOfBirth,
          gender: passport.gender,
          photoUrl: passport.photoUrl,
          phone: passport.phone,
          whatsapp: passport.whatsapp,
          email: passport.email,
          emergencyContact: passport.emergencyContact,
          emergencyPhone: passport.emergencyPhone,
          homeAddress: passport.homeAddress,
          travelDestination: passport.travelDestination,
          travelDate: passport.travelDate,
          returnDate: passport.returnDate,
          notes: passport.notes,
          isActive: passport.isActive,
          status: passport.status,
          duration: passport.duration,
          expiresAt: passport.expiresAt?.toISOString() || null,
          createdAt: passport.createdAt.toISOString(),
          updatedAt: passport.updatedAt.toISOString(),
          agency: passport.agency ? { name: passport.agency.name, phone: passport.agency.phone } : null,
          reports: passport.reports.map((r) => ({
            id: r.id,
            finderName: r.finderName,
            finderPhone: r.finderPhone,
            finderEmail: r.finderEmail,
            latitude: r.latitude,
            longitude: r.longitude,
            location: r.location,
            message: r.message,
            createdAt: r.createdAt.toISOString(),
          })),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get passport error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
