import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scans, incidents } = body as {
      scans?: Array<{
        id: string;
        qrCode: string;
        type: string;
        timestamp: string;
        zone: string;
        status: string;
      }>;
      incidents?: Array<{
        id: string;
        type: string;
        description: string;
        relatedQrCode?: string;
        timestamp: string;
        zone: string;
      }>;
    };

    const syncedIds: string[] = [];

    // Process scans
    if (scans && Array.isArray(scans)) {
      for (const scan of scans) {
        // In production, save to database
        // For now, just acknowledge
        console.log(`[Sync] Scan: ${scan.qrCode} (${scan.type}) at ${scan.zone} - ${scan.timestamp}`);
        syncedIds.push(scan.id);
      }
    }

    // Process incidents
    if (incidents && Array.isArray(incidents)) {
      for (const incident of incidents) {
        console.log(`[Sync] Incident: ${incident.type} - ${incident.description} at ${incident.zone}`);
        syncedIds.push(incident.id);
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedIds,
      count: syncedIds.length,
    });
  } catch (error) {
    console.error('[Leader Sync] Error:', error);
    return NextResponse.json(
      { error: 'Erreur de synchronisation' },
      { status: 500 }
    );
  }
}
