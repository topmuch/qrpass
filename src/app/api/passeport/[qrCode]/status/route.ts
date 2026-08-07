import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Update passport status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending_activation', 'active', 'lost', 'found', 'blocked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Valid values: pending_activation, active, lost, found, blocked' },
        { status: 400 }
      );
    }

    // Find passport by qrCode
    const passport = await db.passport.findUnique({
      where: { qrCode },
    });

    if (!passport) {
      return NextResponse.json(
        { error: 'Passport not found' },
        { status: 404 }
      );
    }

    // Update passport status
    const updated = await db.passport.update({
      where: { qrCode },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      passport: {
        id: updated.id,
        qrCode: updated.qrCode,
        fullName: updated.fullName,
        status: updated.status,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating passport status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
