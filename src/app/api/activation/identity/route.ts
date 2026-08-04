import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/passhajj-auth';
import { activateIdentitySchema, generateQrCode } from '@/lib/passhajj-utils';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = activateIdentitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const data = parsed.data;

    // Generate QR code if not provided
    let qrCode = data.qrCode;
    if (!qrCode.startsWith('ID-')) {
      qrCode = await generateQrCode('ID');
    }

    // Check uniqueness
    const existing = await db.pilgrim.findUnique({ where: { qrCode } });
    if (existing) {
      return NextResponse.json({ error: 'QR code déjà utilisé' }, { status: 409 });
    }

    const pilgrim = await db.pilgrim.create({
      data: {
        qrCode,
        fullName: data.fullName,
        nationality: data.nationality,
        bloodType: data.bloodType,
        allergies: data.allergies,
        medicalInfo: data.medicalInfo,
        hotelMecca: data.hotelMecca,
        roomMecca: data.roomMecca,
        isActive: true,
        agencyId: auth.agencyId,
        ownerId: auth.userId,
      },
    });

    return NextResponse.json({ success: true, pilgrim }, { status: 201 });
  } catch (error) {
    console.error('[Activate Identity] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
