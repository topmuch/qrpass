import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/qr';

// CORS headers for cross-origin access (scan page, PWA, etc.)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST — Activate a Pass Identity bracelet
export async function POST(request: NextRequest) {
  try {
    // ── Parse request body (JSON or FormData) ──
    const contentType = request.headers.get('content-type') || '';
    let fields: Record<string, string | undefined>;

    if (contentType.includes('multipart/form-data')) {
      // FormData submission
      const formData = await request.formData();
      fields = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          fields[key] = value;
        }
        // File entries are ignored — photo upload is handled separately
        // via /api/baggage/upload-photo, and this endpoint receives the photoUrl string
      }
    } else {
      // JSON submission
      const body = await request.json();
      fields = body;
    }

    // ── Extract fields ──
    const qrCode = fields.qrCode?.trim();
    const fullName = fields.fullName?.trim();
    const bloodType = fields.bloodType?.trim();
    const medicalInfo = fields.medicalInfo?.trim();
    const hotelMecca = fields.hotelMecca?.trim();
    const roomMecca = fields.roomMecca?.trim();
    const hotelMedina = fields.hotelMedina?.trim();
    const roomMedina = fields.roomMedina?.trim();
    const groupLeaderPhone = fields.groupLeaderPhone?.trim();
    const familyContact = fields.familyContact?.trim();
    const photoUrl = fields.photoUrl?.trim();

    // ── Validate required fields ──
    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'qrCode is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'fullName is required (minimum 2 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Find pilgrim by qrCode ──
    const pilgrim = await db.pilgrim.findUnique({
      where: { qrCode },
    });

    if (!pilgrim) {
      return NextResponse.json(
        { success: false, error: 'Pilgrim not found', message: 'No pilgrim bracelet found with this QR code' },
        { status: 404, headers: corsHeaders }
      );
    }

    // ── Check if already activated ──
    if (pilgrim.isActive) {
      return NextResponse.json(
        { success: false, error: 'Already activated', message: 'This pilgrim bracelet has already been activated' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Calculate expiration date ──
    // Default 30-day duration for pilgrim bracelets.
    // Supports '15d', '30d', and '1y' durations.
    const duration = fields.duration || '30d';
    const now = new Date();
    let expiresAt: Date;

    switch (duration) {
      case '15d':
        expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        // 30-day default for pilgrim bracelets
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // ── Build update data ──
    const updateData: Record<string, unknown> = {
      fullName,
      nationality: 'Non spécifié', // Required by model but not collected in the form
      isActive: true,
      duration,
      expiresAt,
    };

    // Optional fields — only set if provided, otherwise null
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
    if (bloodType) updateData.bloodType = bloodType;
    if (medicalInfo) updateData.medicalInfo = medicalInfo;
    if (hotelMecca) updateData.hotelMecca = hotelMecca;
    if (roomMecca) updateData.roomMecca = roomMecca;
    if (hotelMedina) updateData.hotelMedina = hotelMedina;
    if (roomMedina) updateData.roomMedina = roomMedina;
    if (groupLeaderPhone) updateData.groupLeaderPhone = groupLeaderPhone;
    if (familyContact) updateData.familyContact = familyContact;

    // ── Update the pilgrim ──
    const updated = await db.pilgrim.update({
      where: { qrCode },
      data: updateData,
    });

    // ── Return success response ──
    return NextResponse.json(
      {
        success: true,
        pilgrim: {
          id: updated.id,
          qrCode: updated.qrCode,
          fullName: updated.fullName,
          nationality: updated.nationality,
          photoUrl: updated.photoUrl,
          bloodType: updated.bloodType,
          medicalInfo: updated.medicalInfo,
          hotelMecca: updated.hotelMecca,
          roomMecca: updated.roomMecca,
          hotelMedina: updated.hotelMedina,
          roomMedina: updated.roomMedina,
          groupLeaderPhone: updated.groupLeaderPhone,
          familyContact: updated.familyContact,
          isActive: updated.isActive,
          duration: updated.duration,
          expiresAt: updated.expiresAt?.toISOString() ?? null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Identity Activate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
