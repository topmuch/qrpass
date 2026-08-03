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

// POST - Activate a pilgrim bracelet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    // Find pilgrim by qrCode
    const pilgrim = await db.pilgrim.findUnique({
      where: { qrCode: code },
    });

    if (!pilgrim) {
      return NextResponse.json(
        { error: 'Pilgrim not found', message: 'No pilgrim bracelet found with this QR code' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already active
    if (pilgrim.isActive) {
      return NextResponse.json(
        { error: 'Already activated', message: 'This pilgrim bracelet has already been activated' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate required fields
    const { fullName, nationality, groupLeaderPhone } = body;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Validation error', message: 'fullName is required (minimum 2 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!nationality || typeof nationality !== 'string' || nationality.trim().length < 2) {
      return NextResponse.json(
        { error: 'Validation error', message: 'nationality is required (minimum 2 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!groupLeaderPhone || typeof groupLeaderPhone !== 'string' || groupLeaderPhone.trim().length < 6) {
      return NextResponse.json(
        { error: 'Validation error', message: 'groupLeaderPhone is required (minimum 6 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate expiration date: fixed 2 months (60 days) from activation or deferred date
    const activationDate = body.activationDate ? new Date(body.activationDate + 'T00:00:00') : new Date();
    const expiresAt = new Date(activationDate.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      fullName: fullName.trim(),
      nationality: nationality.trim(),
      groupLeaderPhone: groupLeaderPhone.trim(),
      isActive: true,
      duration: '60d',
      expiresAt,
    };

    // Optional fields
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl || null;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType || null;
    if (body.medicalInfo !== undefined) updateData.medicalInfo = body.medicalInfo || null;
    if (body.hotelMecca !== undefined) updateData.hotelMecca = body.hotelMecca || null;
    if (body.roomMecca !== undefined) updateData.roomMecca = body.roomMecca || null;
    if (body.hotelMedina !== undefined) updateData.hotelMedina = body.hotelMedina || null;
    if (body.roomMedina !== undefined) updateData.roomMedina = body.roomMedina || null;
    if (body.hotelCoords !== undefined) updateData.hotelCoords = body.hotelCoords || null;
    if (body.agencyPhone !== undefined) updateData.agencyPhone = body.agencyPhone || null;
    if (body.familyContact !== undefined) updateData.familyContact = body.familyContact || null;
    if (body.alNusukDocUrl !== undefined) updateData.alNusukDocUrl = body.alNusukDocUrl || null;

    // Update the pilgrim
    const updated = await db.pilgrim.update({
      where: { qrCode: code },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pilgrim bracelet activated successfully',
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
          hotelCoords: updated.hotelCoords,
          groupLeaderPhone: updated.groupLeaderPhone,
          agencyPhone: updated.agencyPhone,
          familyContact: updated.familyContact,
          alNusukDocUrl: updated.alNusukDocUrl,
          isActive: updated.isActive,
          duration: updated.duration,
          expiresAt: updated.expiresAt?.toISOString() || null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Activate pilgrim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
