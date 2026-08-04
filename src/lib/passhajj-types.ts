// Trip data returned by the API
export interface TripData {
  tripId: string;
  tripName: string;
  agencyName: string;
  pilgrims: PilgrimData[];
  bags: BagData[];
}

export interface PilgrimData {
  id: string;
  qrCode: string; // starts with "ID-"
  fullName: string;
  bloodType?: string;
  allergies?: string;
  group?: string;
}

export interface BagData {
  id: string;
  qrCode: string; // starts with "BG-"
  ownerName: string;
  ownerId?: string; // links to a pilgrim
}

// Scan record stored locally
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

// Zone types
export type ZoneType = 'Aéroport' | 'Bus' | 'Hôtel' | 'Haram';

// Incident record
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

// Sync status
export type SyncStatus = 'online' | 'offline' | 'syncing';

// App view state
export type AppView = 'login' | 'dashboard' | 'list' | 'incidents';
