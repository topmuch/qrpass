import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { qrCode, hajjStage } = await req.json();

    if (!qrCode || !hajjStage) {
      return NextResponse.json({ error: 'qrCode and hajjStage are required' }, { status: 400 });
    }

    // Valid stage keys
    const validStages = [
      'medina', 'tawaf-qudum', 'saee-safa-marwa', 'mina-day1', 'arafat',
      'muzdalifah', 'lapidation-sacrifice', 'tawaf-ifadah', 'mina-day2',
      'oumrah-ifrad', 'tawaf-wida', 'mecca-general',
    ];

    if (!validStages.includes(hajjStage)) {
      return NextResponse.json({ error: 'Invalid hajjStage value' }, { status: 400 });
    }

    const pilgrim = await db.pilgrim.update({
      where: { qrCode },
      data: { hajjStage },
    });

    return NextResponse.json({ success: true, hajjStage: pilgrim.hajjStage });
  } catch (error: unknown) {
    console.error('[update-stage] Error:', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}
