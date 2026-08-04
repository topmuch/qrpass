import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // First try with agency include, fall back to without
    let pilgrims;
    try {
      pilgrims = await db.pilgrim.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          agency: {
            select: { id: true, name: true },
          },
        },
      });
    } catch {
      // Fallback: fetch without agency relation if Prisma client is stale
      pilgrims = await db.pilgrim.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Manually attach agency info
      const agencyIds = [...new Set(pilgrims.map((p: any) => p.agencyId).filter(Boolean))];
      if (agencyIds.length > 0) {
        const agencies = await db.agency.findMany({
          where: { id: { in: agencyIds } },
          select: { id: true, name: true },
        });
        const agencyMap = new Map(agencies.map((a: any) => [a.id, a]));
        pilgrims = pilgrims.map((p: any) => ({
          ...p,
          agency: p.agencyId ? agencyMap.get(p.agencyId) || null : null,
        }));
      }
    }

    return NextResponse.json({ pilgrims });
  } catch (error) {
    console.error('Failed to fetch pilgrims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pilgrims' },
      { status: 500 }
    );
  }
}
