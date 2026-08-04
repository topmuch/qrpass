import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  // ─── Auth check ───
  const user = await getSession();
  if (!user || (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'agent')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // ─── 1. Lost baggages with GPS from ScanLogs ───
    const lostScans = await db.scanLog.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        baggage: {
          status: { in: ['lost', 'scanned'] },
        },
      },
      select: {
        latitude: true,
        longitude: true,
        city: true,
        country: true,
        location: true,
        context: true,
        createdAt: true,
        baggage: {
          select: {
            reference: true,
            status: true,
            transportMode: true,
            declaredLostAt: true,
            foundAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // ─── 2. All scans with GPS (for density) ───
    const allGpsScans = await db.scanLog.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        latitude: true,
        longitude: true,
        city: true,
        country: true,
        location: true,
        context: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // ─── 3. Declared lost baggages (no GPS but have location text) ───
    const declaredLost = await db.baggage.findMany({
      where: {
        status: 'lost',
        declaredLostAt: { not: null },
      },
      select: {
        reference: true,
        lastLocation: true,
        transportMode: true,
        declaredLostAt: true,
        foundAt: true,
        destination: true,
        scanLogs: {
          where: { latitude: { not: null } },
          select: { latitude: true, longitude: true, city: true, country: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // ─── 4. Aggregate points by proximity (cluster within ~5km) ───
    const pointMap = new Map<string, {
      lat: number;
      lng: number;
      count: number;
      lostCount: number;
      city: string | null;
      country: string | null;
      references: string[];
    }>();

    const clusterKey = (lat: number, lng: number) => {
      // Round to ~5km precision (~0.05 degrees)
      return `${(lat * 20).toFixed(0)},${(lng * 20).toFixed(0)}`;
    };

    // Process all GPS scans
    for (const scan of allGpsScans) {
      if (!scan.latitude || !scan.longitude) continue;
      const key = clusterKey(scan.latitude, scan.longitude);
      const existing = pointMap.get(key);
      if (existing) {
        existing.count++;
        if (!existing.city && scan.city) existing.city = scan.city;
        if (!existing.country && scan.country) existing.country = scan.country;
      } else {
        pointMap.set(key, {
          lat: scan.latitude,
          lng: scan.longitude,
          count: 1,
          lostCount: 0,
          city: scan.city,
          country: scan.country,
          references: [],
        });
      }
    }

    // Mark lost points
    for (const scan of lostScans) {
      if (!scan.latitude || !scan.longitude) continue;
      const key = clusterKey(scan.latitude, scan.longitude);
      const existing = pointMap.get(key);
      if (existing) {
        existing.lostCount++;
        if (scan.baggage?.reference) {
          existing.references.push(scan.baggage.reference);
        }
      }
    }

    // Process declared lost with GPS from scanlogs
    for (const bag of declaredLost) {
      if (bag.scanLogs.length > 0 && bag.scanLogs[0].latitude && bag.scanLogs[0].longitude) {
        const sl = bag.scanLogs[0];
        const key = clusterKey(sl.latitude, sl.longitude);
        const existing = pointMap.get(key);
        if (existing) {
          existing.lostCount++;
          existing.references.push(bag.reference);
        }
      }
    }

    const points = Array.from(pointMap.values())
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count);

    // ─── 5. Top cities by loss count ───
    const cityLossMap = new Map<string, { city: string; count: number; lostCount: number; country: string | null }>();
    for (const scan of lostScans) {
      const cityKey = scan.city || scan.country || 'Inconnu';
      const existing = cityLossMap.get(cityKey);
      if (existing) {
        existing.count++;
      } else {
        cityLossMap.set(cityKey, { city: cityKey, count: 1, lostCount: 0, country: scan.country });
      }
    }
    // Also count total scans per city
    for (const scan of allGpsScans) {
      const cityKey = scan.city || scan.country || 'Inconnu';
      const existing = cityLossMap.get(cityKey);
      if (existing) {
        existing.lostCount++;
      }
    }
    // Now swap: lostCount should be the loss count, count is total
    for (const [, entry] of cityLossMap) {
      const temp = entry.count;
      entry.count = entry.lostCount; // total scans
      entry.lostCount = temp; // lost scans
    }

    const topCities = Array.from(cityLossMap.values())
      .filter((c) => c.lostCount > 0)
      .sort((a, b) => b.lostCount - a.lostCount)
      .slice(0, 10);

    // ─── 6. Stats ───
    const totalLost = await db.baggage.count({ where: { status: 'lost' } });
    const totalFound = await db.baggage.count({ where: { status: 'found' } });
    const totalActive = await db.baggage.count({ where: { status: 'active' } });
    const recoveryRate = totalLost > 0 ? Math.round((totalFound / totalLost) * 100) : 0;

    // ─── 7. Transport mode breakdown ───
    const lostByTransport = await db.baggage.groupBy({
      by: ['transportMode'],
      where: { status: 'lost' },
      _count: { id: true },
    });

    // ─── 8. Timeline (last 30 days) ───
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLostScans = await db.scanLog.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        baggage: { status: { in: ['lost', 'scanned'] } },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const timelineMap = new Map<string, number>();
    for (const s of recentLostScans) {
      const day = s.createdAt.toISOString().split('T')[0];
      timelineMap.set(day, (timelineMap.get(day) || 0) + 1);
    }
    const timeline = Array.from(timelineMap.entries()).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      points,
      topCities,
      stats: {
        totalLost,
        totalFound,
        totalActive,
        recoveryRate,
      },
      lostByTransport: lostByTransport.map((item) => ({
        mode: item.transportMode,
        count: item._count.id,
      })),
      timeline,
    });
  } catch (error) {
    console.error('Heatmap API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
