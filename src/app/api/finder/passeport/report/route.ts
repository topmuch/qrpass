import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CORS headers for scan page access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Report a found passport
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      passportId,
      finderName,
      finderPhone,
      finderEmail,
      latitude,
      longitude,
      location,
      message,
    } = body;

    // Validate required fields
    if (!passportId || typeof passportId !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'passportId is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!finderName || typeof finderName !== 'string' || finderName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Validation error', message: 'finderName is required (minimum 2 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!finderPhone || typeof finderPhone !== 'string' || finderPhone.trim().length < 6) {
      return NextResponse.json(
        { error: 'Validation error', message: 'finderPhone is required (minimum 6 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find passport by ID
    const passport = await db.passport.findUnique({
      where: { id: passportId },
    });

    if (!passport) {
      return NextResponse.json(
        { error: 'Passport not found', message: 'No passport found with this ID' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create the PassportReport record
    const report = await db.passportReport.create({
      data: {
        passportId: passport.id,
        finderName: finderName.trim(),
        finderPhone: finderPhone.trim(),
        finderEmail: finderEmail?.trim() || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        location: location?.trim() || null,
        message: message?.trim() || null,
      },
    });

    // Update passport status to "found" since someone reported it
    if (passport.status === 'lost') {
      await db.passport.update({
        where: { id: passport.id },
        data: { status: 'found' },
      });
    }

    // Generate WhatsApp notification URL if passport owner has whatsapp number
    let whatsappUrl: string | null = null;
    if (passport.whatsapp || passport.phone) {
      const phone = (passport.whatsapp || passport.phone || '').replace(/[^0-9]/g, '');
      const locationText = latitude && longitude
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : location || 'lieu non précisé';

      const whatsappText =
        `🆘 Signalement Pass Passeport !\n\n` +
        `Votre passeport a été trouvé :\n` +
        `👤 Nom : ${passport.fullName}\n` +
        `📍 Localisation : ${locationText}\n\n` +
        `Trouvé par : ${finderName.trim()}\n` +
        `📞 Téléphone : ${finderPhone.trim()}\n` +
        `${finderEmail?.trim() ? `📧 Email : ${finderEmail.trim()}\n` : ''}` +
        `${message?.trim() ? `💬 Message : ${message.trim()}\n` : ''}` +
        `\nCode QR : ${passport.qrCode}`;

      whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully',
        report: {
          id: report.id,
          passportId: report.passportId,
          finderName: report.finderName,
          finderPhone: report.finderPhone,
          finderEmail: report.finderEmail,
          latitude: report.latitude,
          longitude: report.longitude,
          location: report.location,
          message: report.message,
          createdAt: report.createdAt.toISOString(),
        },
        whatsappUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Passeport Report] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
