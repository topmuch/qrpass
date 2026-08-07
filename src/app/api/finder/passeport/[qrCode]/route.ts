import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Finder lookup: returns passport info for the scan page (masks sensitive data)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;

    const passport = await db.passport.findUnique({
      where: { qrCode },
      include: {
        agency: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!passport) {
      return NextResponse.json({ error: 'Passeport non trouvé' }, { status: 404 });
    }

    // Check if not activated
    if (!passport.isActive) {
      return NextResponse.json({
        success: true,
        type: 'passeport',
        status: 'not_activated',
        message: 'Ce passeport n\'a pas encore été activé',
        data: {
          qrCode: passport.qrCode,
        },
      });
    }

    // Check if expired
    if (passport.expiresAt && new Date() > passport.expiresAt) {
      return NextResponse.json({
        success: true,
        type: 'passeport',
        status: 'expired',
        message: 'Ce passeport a expiré',
        data: {
          qrCode: passport.qrCode,
          fullName: passport.fullName,
          nationality: passport.nationality,
          expiredAt: passport.expiresAt.toISOString(),
        },
      });
    }

    // Mask passport number for privacy — show only last 3 chars if present
    const maskedPassportNumber = passport.passportNumber
      ? '***' + passport.passportNumber.slice(-3)
      : null;

    // Determine top-level status based on DB status field
    const topLevelStatus = passport.status === 'lost' ? 'lost'
      : passport.status === 'found' ? 'found'
      : 'active';

    // Return passport info but NOT sensitive data like full passportNumber
    return NextResponse.json({
      success: true,
      type: 'passeport',
      status: topLevelStatus,
      data: {
        id: passport.id,
        qrCode: passport.qrCode,
        fullName: passport.fullName,
        firstName: passport.firstName,
        lastName: passport.lastName,
        nationality: passport.nationality,
        passportNumber: maskedPassportNumber,
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
        agency: passport.agency,
        isActive: passport.isActive,
        passportStatus: passport.status,
      },
    });
  } catch (error) {
    console.error('[Finder Passeport] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
