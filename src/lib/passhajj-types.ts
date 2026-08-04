// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Type Definitions
//  Aligned with backend API responses (Express + Prisma)
// ═══════════════════════════════════════════════════════════════

// ─── Zone types ───
export type ZoneType = 'Aéroport' | 'Bus' | 'Hôtel' | 'Haram';

// ─── Sync status ───
export type SyncStatus = 'online' | 'offline' | 'syncing';

// ─── App view state ───
export type AppView = 'login' | 'dashboard' | 'list' | 'incidents';

// ═══════════════════════════════════════════════════════════════
//  TRIP DATA (stored locally for offline access)
// ═══════════════════════════════════════════════════════════════

export interface TripData {
  tripId: string;
  tripName: string;
  tripDescription?: string;
  agencyId: string;
  agencyName: string;
  agencyPhone?: string;
  agencyWhatsapp?: string;
  status: string;
  departureDate?: string;
  returnDate?: string;
  destination?: string;
  transportMode?: string;
  airline?: string;
  flightNumber?: string;
  hotelMecca?: string;
  hotelMedina?: string;
  totalPilgrims: number;
  totalBags: number;
  scannedPilgrims: number;
  scannedBags: number;
  pilgrims: PilgrimData[];
  bags: BagData[];
  groups: GroupData[];
}

export interface PilgrimData {
  id: string;
  qrCode: string; // starts with "ID-"
  fullName: string;
  bloodType?: string;
  allergies?: string;
  groupId?: string;
  group?: { id: string; name: string };
  hotelMecca?: string;
  roomMecca?: string;
}

export interface BagData {
  id: string;
  qrCode: string; // starts with "BG-"
  ownerName: string;
  ownerId?: string; // links to a Pilgrim
  baggageType?: string; // "cabine" | "soute"
  airline?: string;
  flightNumber?: string;
  status?: string;
}

export interface GroupData {
  id: string;
  name: string;
  color?: string;
  leaderName?: string;
}

// ═══════════════════════════════════════════════════════════════
//  SCAN RECORD (stored locally, synced when online)
// ═══════════════════════════════════════════════════════════════

export interface ScanRecord {
  id: string;
  qrCode: string;
  type: 'identity' | 'baggage';
  timestamp: string;
  zone: ZoneType;
  status: 'success' | 'error' | 'duplicate';
  pilgrimName?: string;
  synced: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  INCIDENT RECORD
// ═══════════════════════════════════════════════════════════════

export interface IncidentRecord {
  id: string;
  type: 'pilgrim_sick' | 'bag_damaged' | 'bag_lost' | 'pilgrim_missing' | 'other';
  description: string;
  relatedQrCode?: string;
  relatedName?: string;
  zone: ZoneType;
  timestamp: string;
  synced: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  OFFLINE CREDENTIALS
// ═══════════════════════════════════════════════════════════════

export interface OfflineCredentials {
  otp: string;
  tripId: string;
  lastVerified: string; // ISO timestamp
}

// ═══════════════════════════════════════════════════════════════
//  BACKEND API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

/** Response from POST /api/leader/trips/verify */
export interface VerifyOtpResponse {
  success: boolean;
  data?: {
    tripId: string;
    tripName: string;
    agencyName: string;
    pilgrims: Array<{
      id: string;
      qrCode: string;
      fullName: string;
      bloodType?: string;
      allergies?: string;
      group?: string;
    }>;
    bags: Array<{
      id: string;
      qrCode: string;
      ownerName: string;
      ownerId?: string;
      baggageType?: string;
      airline?: string;
      flightNumber?: string;
      status?: string;
    }>;
  };
  error?: string;
}

/** Response from POST /api/leader/sync-scans */
export interface SyncScansResponse {
  success: boolean;
  synced: string[];  // IDs of synced records
  skipped: string[]; // IDs of duplicate/skipped records
  count: number;
}

/** Response from POST /api/leader/sync-incidents */
export interface SyncIncidentsResponse {
  success: boolean;
  synced: string[];
  skipped: string[];
  count: number;
}

/** Response from GET /api/leader/trip/:tripId/status */
export interface TripStatusResponse {
  id: string;
  name: string;
  status: string;
  totalPilgrims: number;
  totalBags: number;
  scannedPilgrims: number;
  scannedBags: number;
  recentScansCount: number;
}

// ═══════════════════════════════════════════════════════════════
//  HELPER: Transform API response → local TripData
// ═══════════════════════════════════════════════════════════════

export function transformVerifyResponse(resp: VerifyOtpResponse): TripData {
  const d = resp.data!;
  // Derive unique groups from pilgrim data
  const groupNames = [...new Set(d.pilgrims.map(p => p.group).filter(Boolean))] as string[];
  const groups: GroupData[] = groupNames.map((name, i) => ({
    id: `group-${i + 1}`,
    name,
    color: undefined,
    leaderName: undefined,
  }));

  return {
    tripId: d.tripId,
    tripName: d.tripName,
    agencyId: d.agencyName,
    agencyName: d.agencyName,
    status: 'active',
    totalPilgrims: d.pilgrims.length,
    totalBags: d.bags.length,
    scannedPilgrims: 0,
    scannedBags: 0,
    pilgrims: d.pilgrims.map((p) => ({
      id: p.id,
      qrCode: p.qrCode,
      fullName: p.fullName,
      bloodType: p.bloodType,
      allergies: p.allergies,
      group: p.group ? { id: `group-${groupNames.indexOf(p.group) + 1}`, name: p.group } : undefined,
    })),
    bags: d.bags.map((b) => ({
      id: b.id,
      qrCode: b.qrCode,
      ownerName: b.ownerName,
      ownerId: b.ownerId,
      baggageType: b.baggageType,
      airline: b.airline,
      flightNumber: b.flightNumber,
      status: b.status,
    })),
    groups,
  };
}
