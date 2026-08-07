import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

// POST — Activate a Pass Passeport sticker
export async function POST(request: NextRequest) {
  try {
    // ── Parse request body (JSON or FormData) ──
    const contentType = request.headers.get('content-type') || '';
    let fields: Record<string, string | undefined>;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      fields = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          fields[key] = value;
        }
      }
    } else {
      const body = await request.json();
      fields = body;
    }

    // ── Extract fields ──
    const qrCode = fields.qrCode?.trim();
    const fullName = fields.fullName?.trim();
    const firstName = fields.firstName?.trim();
    const lastName = fields.lastName?.trim();
    const nationality = fields.nationality?.trim();
    const passportNumber = fields.passportNumber?.trim();
    const dateOfBirth = fields.dateOfBirth?.trim();
    const placeOfBirth = fields.placeOfBirth?.trim();
    const gender = fields.gender?.trim();
    const phone = fields.phone?.trim();
    const whatsapp = fields.whatsapp?.trim();
    const email = fields.email?.trim();
    const emergencyContact = fields.emergencyContact?.trim();
    const emergencyPhone = fields.emergencyPhone?.trim();
    const homeAddress = fields.homeAddress?.trim();
    const travelDestination = fields.travelDestination?.trim();
    const travelDate = fields.travelDate?.trim();
    const returnDate = fields.returnDate?.trim();
    const notes = fields.notes?.trim();
    const photoUrl = fields.photoUrl?.trim();
    const hotelName = fields.hotelName?.trim();
    const hotelAddress = fields.hotelAddress?.trim();
    const hotelPhone = fields.hotelPhone?.trim();
    const expirationDate = fields.expirationDate?.trim();

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

    // ── Find passport by qrCode ──
    const passport = await db.passport.findUnique({
      where: { qrCode },
    });

    if (!passport) {
      return NextResponse.json(
        { success: false, error: 'Passport not found', message: 'No passport sticker found with this QR code' },
        { status: 404, headers: corsHeaders }
      );
    }

    // ── Check if already activated ──
    if (passport.isActive) {
      return NextResponse.json(
        { success: false, error: 'Already activated', message: 'This passport sticker has already been activated' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Calculate expiration date ──
    // Default 1-year duration for passport stickers.
    // Supports '30d' and '1y' durations.
    const duration = fields.duration || '1y';
    const now = new Date();
    let expiresAt: Date;

    switch (duration) {
      case '30d':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
      default:
        // 1-year default for passport stickers
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // ── Build update data ──
    const updateData: Record<string, unknown> = {
      fullName,
      isActive: true,
      status: 'active',
      duration,
      expiresAt,
    };

    // Optional fields — only set if provided
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (nationality) updateData.nationality = nationality;
    if (passportNumber) updateData.passportNumber = passportNumber;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (placeOfBirth) updateData.placeOfBirth = placeOfBirth;
    if (gender) updateData.gender = gender;
    if (phone) updateData.phone = phone;
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (email) updateData.email = email;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (emergencyPhone) updateData.emergencyPhone = emergencyPhone;
    if (homeAddress) updateData.homeAddress = homeAddress;
    if (travelDestination) updateData.travelDestination = travelDestination;
    if (travelDate) updateData.travelDate = travelDate;
    if (returnDate) updateData.returnDate = returnDate;
    if (notes) updateData.notes = notes;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
    if (hotelName) updateData.hotelName = hotelName;
    if (hotelAddress) updateData.hotelAddress = hotelAddress;
    if (hotelPhone) updateData.hotelPhone = hotelPhone;
    if (expirationDate) updateData.expirationDate = expirationDate;

    // ── Update the passport ──
    const updated = await db.passport.update({
      where: { qrCode },
      data: updateData,
    });

    // ── Return success response ──
    return NextResponse.json(
      {
        success: true,
        passport: {
          id: updated.id,
          qrCode: updated.qrCode,
          fullName: updated.fullName,
          firstName: updated.firstName,
          lastName: updated.lastName,
          nationality: updated.nationality,
          passportNumber: updated.passportNumber,
          dateOfBirth: updated.dateOfBirth,
          placeOfBirth: updated.placeOfBirth,
          gender: updated.gender,
          photoUrl: updated.photoUrl,
          phone: updated.phone,
          whatsapp: updated.whatsapp,
          email: updated.email,
          emergencyContact: updated.emergencyContact,
          emergencyPhone: updated.emergencyPhone,
          homeAddress: updated.homeAddress,
          travelDestination: updated.travelDestination,
          travelDate: updated.travelDate,
          returnDate: updated.returnDate,
          notes: updated.notes,
          hotelName: updated.hotelName,
          hotelAddress: updated.hotelAddress,
          hotelPhone: updated.hotelPhone,
          expirationDate: updated.expirationDate,
          isActive: updated.isActive,
          status: updated.status,
          duration: updated.duration,
          expiresAt: updated.expiresAt?.toISOString() ?? null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Passeport Activate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
