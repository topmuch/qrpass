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

// POST - Report a found pilgrim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { pilgrimQrCode, finderName, finderPhone, latitude, longitude, message } = body;

    // Validate required fields
    if (!pilgrimQrCode || typeof pilgrimQrCode !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'pilgrimQrCode is required' },
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

    // Find pilgrim by qrCode
    const pilgrim = await db.pilgrim.findUnique({
      where: { qrCode: pilgrimQrCode },
    });

    if (!pilgrim) {
      return NextResponse.json(
        { error: 'Pilgrim not found', message: 'No pilgrim bracelet found with this QR code' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create the PilgrimReport record
    const report = await db.pilgrimReport.create({
      data: {
        pilgrimId: pilgrim.id,
        finderName: finderName.trim(),
        finderPhone: finderPhone.trim(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        message: message?.trim() || null,
      },
    });

    // Generate WhatsApp notification URL if pilgrim has groupLeaderPhone
    let whatsappUrl: string | null = null;
    if (pilgrim.groupLeaderPhone) {
      const phone = pilgrim.groupLeaderPhone.replace(/[^0-9]/g, '');
      const locationText = latitude && longitude
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : 'lieu non précisé';

      const whatsappText =
        `🆘 Signalement Pass Identity !\n\n` +
        `Un pèlerin a été trouvé et a besoin d'aide :\n` +
        `👤 Nom : ${pilgrim.fullName}\n` +
        `🩸 Groupe sanguin : ${pilgrim.bloodType || 'non renseigné'}\n` +
        `📍 Localisation : ${locationText}\n` +
        `🏥 Informations médicales : ${pilgrim.medicalInfo || 'aucune'}\n\n` +
        `Trouvé par : ${finderName.trim()}\n` +
        `📞 Téléphone : ${finderPhone.trim()}\n` +
        `${message?.trim() ? `💬 Message : ${message.trim()}\n` : ''}` +
        `\nCode QR : ${pilgrim.qrCode}`;

      whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully',
        report: {
          id: report.id,
          pilgrimId: report.pilgrimId,
          finderName: report.finderName,
          finderPhone: report.finderPhone,
          latitude: report.latitude,
          longitude: report.longitude,
          message: report.message,
          createdAt: report.createdAt.toISOString(),
        },
        whatsappUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Report pilgrim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
