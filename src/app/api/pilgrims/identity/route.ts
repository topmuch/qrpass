import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const pilgrims = await db.pilgrim.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agency: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ pilgrims });
  } catch (error) {
    console.error('Failed to fetch pilgrims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pilgrims' },
      { status: 500 }
    );
  }
}
