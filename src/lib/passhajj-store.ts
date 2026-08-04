import { create } from 'zustand';
import localforage from 'localforage';
import type {
  TripData, ScanRecord, IncidentRecord, ZoneType, SyncStatus, AppView
} from './passhajj-types';

// Configure localforage
const store = localforage.createInstance({
  name: 'passhajj-manager',
  storeName: 'app_data',
});

interface FlashCard {
  fullName: string;
  bloodType?: string;
  allergies?: string;
  visible: boolean;
}

interface PassHajjState {
  // Navigation
  view: AppView;
  setView: (view: AppView) => void;

  // Trip
  trip: TripData | null;
  setTrip: (trip: TripData) => void;
  clearTrip: () => void;

  // Zone
  zone: ZoneType;
  setZone: (zone: ZoneType) => void;

  // Scans
  scans: ScanRecord[];
  addScan: (scan: Omit<ScanRecord, 'id' | 'synced'>) => void;

  // Incidents
  incidents: IncidentRecord[];
  addIncident: (incident: Omit<IncidentRecord, 'id' | 'synced'>) => void;

  // Flash card
  flashCard: FlashCard;
  showFlashCard: (data: { fullName: string; bloodType?: string; allergies?: string }) => void;
  hideFlashCard: () => void;

  // Sync
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  syncQueue: ScanRecord[];
  markSynced: (ids: string[]) => void;
  pendingCount: number;

  // List filters
  listFilter: 'all' | 'present' | 'missing' | 'bags';
  setListFilter: (filter: 'all' | 'present' | 'missing' | 'bags') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Derived
  scannedPilgrimIds: Set<string>;
  scannedBagIds: Set<string>;

  // Init
  initialized: boolean;
  initialize: () => Promise<void>;
}

export const usePassHajjStore = create<PassHajjState>((set, get) => ({
  // Navigation
  view: 'login',
  setView: (view) => set({ view }),

  // Trip
  trip: null,
  setTrip: (trip) => {
    set({ trip });
    store.setItem('trip', trip);
  },
  clearTrip: () => {
    set({ trip: null, scans: [], incidents: [], syncQueue: [], scannedPilgrimIds: new Set(), scannedBagIds: new Set() });
    store.removeItem('trip');
    store.removeItem('scans');
    store.removeItem('incidents');
  },

  // Zone
  zone: 'Aéroport',
  setZone: (zone) => set({ zone }),

  // Scans
  scans: [],
  addScan: (scanData) => {
    const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const scan: ScanRecord = { ...scanData, id, synced: false };
    const state = get();

    // Check for duplicate
    const isDuplicate = state.scans.some(
      s => s.qrCode === scan.qrCode && s.type === scan.type && s.status === 'success'
    );

    if (isDuplicate && scan.status === 'success') {
      // Mark as duplicate instead
      scan.status = 'duplicate';
    }

    const newScans = [scan, ...state.scans];
    const newSyncQueue = scan.status === 'success' ? [scan, ...state.syncQueue] : [...state.syncQueue];

    // Update scanned sets
    const newPilgrimIds = new Set(state.scannedPilgrimIds);
    const newBagIds = new Set(state.scannedBagIds);
    if (scan.type === 'identity' && scan.status === 'success') {
      newPilgrimIds.add(scan.qrCode);
    }
    if (scan.type === 'baggage' && scan.status === 'success') {
      newBagIds.add(scan.qrCode);
    }

    set({
      scans: newScans,
      syncQueue: newSyncQueue,
      scannedPilgrimIds: newPilgrimIds,
      scannedBagIds: newBagIds,
      pendingCount: newSyncQueue.length,
    });

    store.setItem('scans', newScans);
  },

  // Incidents
  incidents: [],
  addIncident: (incidentData) => {
    const id = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const incident: IncidentRecord = { ...incidentData, id, synced: false };
    const newIncidents = [incident, ...get().incidents];
    set({ incidents: newIncidents });
    store.setItem('incidents', newIncidents);
  },

  // Flash card
  flashCard: { fullName: '', visible: false },
  showFlashCard: (data) => {
    set({ flashCard: { ...data, visible: true } });
    setTimeout(() => {
      set((s) => ({ flashCard: { ...s.flashCard, visible: false } }));
    }, 2500);
  },
  hideFlashCard: () => set((s) => ({ flashCard: { ...s.flashCard, visible: false } })),

  // Sync
  syncStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  syncQueue: [],
  markSynced: (ids) => {
    const state = get();
    const idSet = new Set(ids);
    const newScans = state.scans.map(s => idSet.has(s.id) ? { ...s, synced: true } : s);
    const newSyncQueue = state.syncQueue.filter(s => !idSet.has(s.id));
    set({
      scans: newScans,
      syncQueue: newSyncQueue,
      pendingCount: newSyncQueue.length,
    });
    store.setItem('scans', newScans);
  },
  pendingCount: 0,

  // List filters
  listFilter: 'all',
  setListFilter: (listFilter) => set({ listFilter }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Derived
  scannedPilgrimIds: new Set<string>(),
  scannedBagIds: new Set<string>(),

  // Init
  initialized: false,
  initialize: async () => {
    if (get().initialized) return;
    try {
      const [trip, scans, incidents] = await Promise.all([
        store.getItem<TripData | null>('trip'),
        store.getItem<ScanRecord[]>('scans'),
        store.getItem<IncidentRecord[]>('incidents'),
      ]);

      const safeScans = Array.isArray(scans) ? scans : [];
      const safeIncidents = Array.isArray(incidents) ? incidents : [];

      // Rebuild scanned sets
      const pilgrimIds = new Set<string>();
      const bagIds = new Set<string>();
      const syncQueueItems: ScanRecord[] = [];

      for (const s of safeScans) {
        if (s.type === 'identity' && s.status === 'success') pilgrimIds.add(s.qrCode);
        if (s.type === 'baggage' && s.status === 'success') bagIds.add(s.qrCode);
        if (!s.synced && s.status === 'success') syncQueueItems.push(s);
      }

      set({
        trip,
        scans: safeScans,
        incidents: safeIncidents,
        scannedPilgrimIds: pilgrimIds,
        scannedBagIds: bagIds,
        syncQueue: syncQueueItems,
        pendingCount: syncQueueItems.length,
        view: trip ? 'dashboard' : 'login',
        initialized: true,
      });
    } catch (err) {
      console.error('[PassHajj] Failed to initialize store:', err);
      set({ initialized: true });
    }
  },
}));
