import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all QR code sets, optionally filtered by type and grouped by agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'hajj', 'identity', 'passeport', or 'all'
    const search = searchParams.get('search');
    const agencyId = searchParams.get('agencyId');

    // ─── Baggage QR sets ───
    const baggageWhere: Record<string, unknown> = {};

    if (type && type !== 'all' && type !== 'identity') {
      baggageWhere.type = type;
    }
    // If type is 'identity', skip baggage query entirely

    if (agencyId) {
      baggageWhere.agencyId = agencyId;
    }

    if (search) {
      baggageWhere.OR = [
        { reference: { contains: search.toUpperCase() } },
        { setId: { contains: search.toUpperCase() } },
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
      ];
    }

    // Get baggages (skip if type is 'identity')
    const baggages = type === 'identity' ? [] : await db.baggage.findMany({
      where: baggageWhere,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group baggages by setId
    const setsMap = new Map<string, {
      id: string;
      setId: string;
      type: string;
      agencyId: string | null;
      agencyName: string | null;
      createdAt: Date;
      qrCount: number;
      references: string[];
      status: string;
      travelerName: string | null;
      baggageIds: string[];
    }>();

    baggages.forEach((baggage) => {
      const setId = baggage.setId || baggage.reference.split('-')[0];

      if (!setsMap.has(setId)) {
        setsMap.set(setId, {
          id: setId,
          setId: setId,
          type: baggage.type,
          agencyId: baggage.agencyId,
          agencyName: baggage.agency?.name || null,
          createdAt: baggage.createdAt,
          qrCount: 0,
          references: [],
          status: 'generated',
          travelerName: baggage.travelerFirstName
            ? `${baggage.travelerFirstName} ${baggage.travelerLastName || ''}`.trim()
            : null,
          baggageIds: [],
        });
      }

      const set = setsMap.get(setId)!;
      set.qrCount++;
      set.references.push(baggage.reference);
      set.baggageIds.push(baggage.id);
    });

    // ─── Identity (Pilgrim) QR sets ───
    // Show pilgrims unless type filter explicitly excludes them
    if (type !== 'hajj' && type !== 'passeport') {
      const pilgrimWhere: Record<string, unknown> = {};
      if (agencyId) {
        pilgrimWhere.agencyId = agencyId;
      }
      if (search) {
        pilgrimWhere.OR = [
          { qrCode: { contains: search.toUpperCase() } },
          { fullName: { contains: search } },
        ];
      }

      const pilgrims = await db.pilgrim.findMany({
        where: pilgrimWhere,
        include: { agency: true },
        orderBy: { createdAt: 'desc' },
      });

      // Group pilgrims — each pilgrim is its own "set" with 1 QR
      pilgrims.forEach((pilgrim) => {
        const setId = `IDENTITY-${pilgrim.qrCode}`;
        setsMap.set(setId, {
          id: setId,
          setId: setId,
          type: 'identity',
          agencyId: pilgrim.agencyId,
          agencyName: pilgrim.agency?.name || null,
          createdAt: pilgrim.createdAt,
          qrCount: 1,
          references: [pilgrim.qrCode],
          status: pilgrim.isActive ? 'active' : 'pending_activation',
          travelerName: pilgrim.fullName && pilgrim.fullName.trim() !== '' ? pilgrim.fullName : null,
          baggageIds: [pilgrim.id],
        });
      });
    }

    // ─── Passport QR sets ───
    // Show passports unless type filter explicitly excludes them
    if (type !== 'hajj' && type !== 'identity') {
      const passportWhere: Record<string, unknown> = {};
      if (agencyId) {
        passportWhere.agencyId = agencyId;
      }
      if (search) {
        passportWhere.OR = [
          { qrCode: { contains: search.toUpperCase() } },
          { fullName: { contains: search } },
          { passportNumber: { contains: search.toUpperCase() } },
        ];
      }

      const passports = await db.passport.findMany({
        where: passportWhere,
        include: { agency: true },
        orderBy: { createdAt: 'desc' },
      });

      // Each passport is its own "set" with 1 QR
      passports.forEach((passport) => {
        const setId = `PASSEPORT-${passport.qrCode}`;
        setsMap.set(setId, {
          id: setId,
          setId: setId,
          type: 'passeport',
          agencyId: passport.agencyId,
          agencyName: passport.agency?.name || null,
          createdAt: passport.createdAt,
          qrCount: 1,
          references: [passport.qrCode],
          status: passport.isActive ? 'active' : 'pending_activation',
          travelerName: passport.fullName && passport.fullName.trim() !== '' ? passport.fullName : null,
          baggageIds: [passport.id],
        });
      });
    }

    // Convert to array and sort by date
    const sets = Array.from(setsMap.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate stats
    const stats = {
      totalSets: sets.length,
      totalQr: baggages.length + (type !== 'hajj' && type !== 'passeport' ? (await db.pilgrim.count()) : 0) + (type !== 'hajj' && type !== 'identity' ? (await db.passport.count()) : 0),
      hajjSets: sets.filter(s => s.type === 'hajj').length,
      identitySets: sets.filter(s => s.type === 'identity').length,
      passeportSets: sets.filter(s => s.type === 'passeport').length,
    };

    return NextResponse.json({
      sets,
      stats,
    });

  } catch (error) {
    console.error('Get QR codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a QR code set
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    if (!setId) {
      return NextResponse.json(
        { error: 'Set ID is required' },
        { status: 400 }
      );
    }

    console.log(`[DELETE QR] Attempting to delete set: ${setId}`);

    // Check if this is an Identity (Pilgrim) set
    if (setId.startsWith('IDENTITY-')) {
      const qrCode = setId.replace('IDENTITY-', '');
      const pilgrim = await db.pilgrim.findUnique({ where: { qrCode } });

      if (!pilgrim) {
        return NextResponse.json(
          { error: 'Pilgrim not found', setId },
          { status: 404 }
        );
      }

      await db.pilgrim.delete({ where: { id: pilgrim.id } });

      return NextResponse.json({
        success: true,
        deletedCount: 1,
        setId,
        deletedReferences: [qrCode],
      });
    }

    // Check if this is a Passport set
    if (setId.startsWith('PASSEPORT-')) {
      const qrCode = setId.replace('PASSEPORT-', '');
      const passport = await db.passport.findUnique({ where: { qrCode } });

      if (!passport) {
        return NextResponse.json(
          { error: 'Passport not found', setId },
          { status: 404 }
        );
      }

      await db.passport.delete({ where: { id: passport.id } });

      return NextResponse.json({
        success: true,
        deletedCount: 1,
        setId,
        deletedReferences: [qrCode],
      });
    }

    // Baggage set deletion
    const whereClause = {
      OR: [
        { setId: setId },
        { reference: { startsWith: `${setId}-` } }
      ]
    };

    const baggages = await db.baggage.findMany({
      where: whereClause,
      select: { id: true, reference: true }
    });

    if (baggages.length === 0) {
      console.log(`[DELETE QR] No baggages found for set: ${setId}`);
      return NextResponse.json(
        { error: 'Set not found', setId },
        { status: 404 }
      );
    }

    console.log(`[DELETE QR] Found ${baggages.length} baggages:`, baggages.map(b => b.reference));

    const baggageIds = baggages.map(b => b.id);

    const deleteResult = await db.baggage.deleteMany({
      where: { id: { in: baggageIds } }
    });

    console.log(`[DELETE QR] Successfully deleted ${deleteResult.count} baggages`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      setId,
      deletedReferences: baggages.map(b => b.reference)
    });

  } catch (error) {
    console.error('Delete QR code set error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
