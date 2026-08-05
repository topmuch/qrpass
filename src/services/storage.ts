// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Typed LocalForage Storage Service
//  Offline-first persistent storage for PWA
// ═══════════════════════════════════════════════════════════════

import localforage from 'localforage';
import type {
  TripData,
  ScanRecord,
  IncidentRecord,
  OfflineCredentials,
} from '@/lib/passhajj-types';

// ─── Storage Keys ───
export const STORAGE_KEYS = {
  TRIP_DATA: 'trip_data',
  SCANS: 'scans',
  PENDING_SCANS: 'pending_scans',
  INCIDENTS: 'incidents',
  PENDING_INCIDENTS: 'pending_incidents',
  CREDENTIALS: 'offline_credentials',
  ZONE: 'current_zone',
  LAST_SYNC: 'last_sync_timestamp',
} as const;

// ─── Create isolated localforage instance ───
const storage = localforage.createInstance({
  name: 'passhajj-manager',
  storeName: 'pwa_data',
  description: 'PassHajj Manager offline-first PWA storage',
});

// ═══════════════════════════════════════════════════════════════
//  TRIP DATA
// ═══════════════════════════════════════════════════════════════

export async function saveTripData(trip: TripData): Promise<void> {
  await storage.setItem(STORAGE_KEYS.TRIP_DATA, trip);
}

export async function loadTripData(): Promise<TripData | null> {
  return storage.getItem<TripData | null>(STORAGE_KEYS.TRIP_DATA);
}

export async function clearTripData(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.TRIP_DATA);
}

// ═══════════════════════════════════════════════════════════════
//  SCAN RECORDS
// ═══════════════════════════════════════════════════════════════

export async function saveScans(scans: ScanRecord[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.SCANS, scans);
}

export async function loadScans(): Promise<ScanRecord[]> {
  const scans = await storage.getItem<ScanRecord[]>(STORAGE_KEYS.SCANS);
  return Array.isArray(scans) ? scans : [];
}

// ═══════════════════════════════════════════════════════════════
//  PENDING SCANS (offline sync queue)
// ═══════════════════════════════════════════════════════════════

export async function savePendingScans(scans: ScanRecord[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.PENDING_SCANS, scans);
}

export async function loadPendingScans(): Promise<ScanRecord[]> {
  const scans = await storage.getItem<ScanRecord[]>(STORAGE_KEYS.PENDING_SCANS);
  return Array.isArray(scans) ? scans : [];
}

export async function clearPendingScans(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.PENDING_SCANS);
}

// ═══════════════════════════════════════════════════════════════
//  INCIDENT RECORDS
// ═══════════════════════════════════════════════════════════════

export async function saveIncidents(incidents: IncidentRecord[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.INCIDENTS, incidents);
}

export async function loadIncidents(): Promise<IncidentRecord[]> {
  const incidents = await storage.getItem<IncidentRecord[]>(STORAGE_KEYS.INCIDENTS);
  return Array.isArray(incidents) ? incidents : [];
}

// ═══════════════════════════════════════════════════════════════
//  PENDING INCIDENTS (offline sync queue)
// ═══════════════════════════════════════════════════════════════

export async function savePendingIncidents(incidents: IncidentRecord[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.PENDING_INCIDENTS, incidents);
}

export async function loadPendingIncidents(): Promise<IncidentRecord[]> {
  const incidents = await storage.getItem<IncidentRecord[]>(STORAGE_KEYS.PENDING_INCIDENTS);
  return Array.isArray(incidents) ? incidents : [];
}

export async function clearPendingIncidents(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.PENDING_INCIDENTS);
}

// ═══════════════════════════════════════════════════════════════
//  OFFLINE CREDENTIALS (for re-auth when offline)
// ═══════════════════════════════════════════════════════════════

export async function saveOfflineCredentials(creds: OfflineCredentials): Promise<void> {
  await storage.setItem(STORAGE_KEYS.CREDENTIALS, creds);
}

export async function loadOfflineCredentials(): Promise<OfflineCredentials | null> {
  return storage.getItem<OfflineCredentials | null>(STORAGE_KEYS.CREDENTIALS);
}

// ═══════════════════════════════════════════════════════════════
//  ZONE PREFERENCE
// ═══════════════════════════════════════════════════════════════

export async function saveZone(zone: string): Promise<void> {
  await storage.setItem(STORAGE_KEYS.ZONE, zone);
}

export async function loadZone(): Promise<string | null> {
  return storage.getItem<string | null>(STORAGE_KEYS.ZONE);
}

// ═══════════════════════════════════════════════════════════════
//  LAST SYNC TIMESTAMP
// ═══════════════════════════════════════════════════════════════

export async function saveLastSyncTimestamp(ts: string): Promise<void> {
  await storage.setItem(STORAGE_KEYS.LAST_SYNC, ts);
}

export async function loadLastSyncTimestamp(): Promise<string | null> {
  return storage.getItem<string | null>(STORAGE_KEYS.LAST_SYNC);
}

// ═══════════════════════════════════════════════════════════════
//  FULL CLEAR (logout)
// ═══════════════════════════════════════════════════════════════

export async function clearAllData(): Promise<void> {
  await storage.clear();
}
