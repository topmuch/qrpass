import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// CORS headers for scan page access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Retrieve pilgrim info for the scan page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const pilgrim = await db.pilgrim.findUnique({
      where: { qrCode: code },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!pilgrim) {
      return NextResponse.json(
        { status: 'not_found', message: 'Pilgrim not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if not activated
    if (!pilgrim.isActive) {
      return NextResponse.json(
        {
          status: 'not_activated',
          message: 'This pilgrim bracelet has not been activated yet',
          qrCode: pilgrim.qrCode,
        },
        { headers: corsHeaders }
      );
    }

    // Check if expired
    if (pilgrim.expiresAt && new Date() > pilgrim.expiresAt) {
      return NextResponse.json(
        {
          status: 'expired',
          message: 'This pilgrim bracelet has expired',
          qrCode: pilgrim.qrCode,
          expiredAt: pilgrim.expiresAt.toISOString(),
          fullName: pilgrim.fullName,
          nationality: pilgrim.nationality,
        },
        { headers: corsHeaders }
      );
    }

    // Return full pilgrim data (excluding sensitive owner info)
    return NextResponse.json(
      {
        status: 'active',
        pilgrim: {
          id: pilgrim.id,
          qrCode: pilgrim.qrCode,
          fullName: pilgrim.fullName,
          nationality: pilgrim.nationality,
          photoUrl: pilgrim.photoUrl,
          bloodType: pilgrim.bloodType,
          medicalInfo: pilgrim.medicalInfo,
          hotelMecca: pilgrim.hotelMecca,
          roomMecca: pilgrim.roomMecca,
          hotelMedina: pilgrim.hotelMedina,
          roomMedina: pilgrim.roomMedina,
          hotelCoords: pilgrim.hotelCoords,
          groupLeaderPhone: pilgrim.groupLeaderPhone,
          agencyPhone: pilgrim.agencyPhone,
          familyContact: pilgrim.familyContact,
          alNusukDocUrl: pilgrim.alNusukDocUrl,
          isActive: pilgrim.isActive,
          duration: pilgrim.duration,
          expiresAt: pilgrim.expiresAt?.toISOString() || null,
          createdAt: pilgrim.createdAt.toISOString(),
          updatedAt: pilgrim.updatedAt.toISOString(),
          reports: pilgrim.reports.map((r) => ({
            id: r.id,
            finderName: r.finderName,
            finderPhone: r.finderPhone,
            latitude: r.latitude,
            longitude: r.longitude,
            message: r.message,
            createdAt: r.createdAt.toISOString(),
          })),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get pilgrim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT - Update pilgrim info (for dashboard)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    // Check if pilgrim exists
    const existing = await db.pilgrim.findUnique({
      where: { qrCode: code },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pilgrim not found' },
        { status: 404 }
      );
    }

    // Prepare update data — only allow specific fields
    const updateData: Record<string, unknown> = {};

    if (body.hotelMecca !== undefined) updateData.hotelMecca = body.hotelMecca || null;
    if (body.roomMecca !== undefined) updateData.roomMecca = body.roomMecca || null;
    if (body.hotelMedina !== undefined) updateData.hotelMedina = body.hotelMedina || null;
    if (body.roomMedina !== undefined) updateData.roomMedina = body.roomMedina || null;
    if (body.hotelCoords !== undefined) updateData.hotelCoords = body.hotelCoords || null;
    if (body.groupLeaderPhone !== undefined) updateData.groupLeaderPhone = body.groupLeaderPhone || null;
    if (body.agencyPhone !== undefined) updateData.agencyPhone = body.agencyPhone || null;
    if (body.familyContact !== undefined) updateData.familyContact = body.familyContact || null;
    if (body.medicalInfo !== undefined) updateData.medicalInfo = body.medicalInfo || null;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType || null;

    // Update the pilgrim
    const updated = await db.pilgrim.update({
      where: { qrCode: code },
      data: updateData,
    });

    // Invalidate any pilgrim cache by returning no-store headers
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
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Update pilgrim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
