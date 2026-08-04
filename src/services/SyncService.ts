// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Sync Service
//  Monitors network status and auto-syncs pending data
// ═══════════════════════════════════════════════════════════════

import { syncScans, syncIncidents } from './api';
import {
  loadPendingScans,
  clearPendingScans,
  savePendingScans,
  loadPendingIncidents,
  clearPendingIncidents,
  savePendingIncidents,
  saveLastSyncTimestamp,
} from './storage';
import type { ScanRecord, IncidentRecord, SyncStatus } from '@/lib/passhajj-types';

// ─── Sync Event Types ───
export type SyncEventType =
  | 'online'
  | 'offline'
  | 'sync-started'
  | 'sync-completed'
  | 'sync-error'
  | 'sync-progress';

export interface SyncEvent {
  type: SyncEventType;
  pendingScans: number;
  pendingIncidents: number;
  syncedCount?: number;
  skippedCount?: number;
  error?: string;
}

type SyncListener = (event: SyncEvent) => void;

// ═══════════════════════════════════════════════════════════════
//  SYNC SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private currentTripId: string | null = null;

  // Auto-sync interval in ms (30 seconds)
  private readonly SYNC_INTERVAL = 30_000;
  // Retry backoff in ms (5 seconds)
  private readonly RETRY_DELAY = 5_000;

  // ─── Subscribe to sync events ───
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[SyncService] Listener error:', err);
      }
    });
  }

  // ─── Set current trip ID for sync context ───
  setTripId(tripId: string | null): void {
    this.currentTripId = tripId;
  }

  // ─── Initialize: listen for network changes ───
  init(): () => void {
    const handleOnline = () => {
      console.log('[SyncService] Network online — triggering sync');
      this.emit({ type: 'online', pendingScans: 0, pendingIncidents: 0 });
      // Sync on reconnect after a short delay
      setTimeout(() => this.performSync(), 1000);
    };

    const handleOffline = () => {
      console.log('[SyncService] Network offline');
      this.emit({ type: 'offline', pendingScans: 0, pendingIncidents: 0 });
      this.stopAutoSync();
    };

    // Set initial state
    if (navigator.onLine) {
      this.startAutoSync();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      this.stopAutoSync();
    };
  }

  // ─── Start periodic auto-sync ───
  startAutoSync(): void {
    if (this.syncInterval) return; // Already running

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.performSync();
      }
    }, this.SYNC_INTERVAL);

    // Also perform immediate sync if online
    if (navigator.onLine && !this.isSyncing) {
      this.performSync();
    }
  }

  // ─── Stop periodic auto-sync ───
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ─── Perform full sync (scans + incidents) ───
  async performSync(): Promise<{ syncedScans: number; syncedIncidents: number }> {
    if (this.isSyncing) return { syncedScans: 0, syncedIncidents: 0 };
    if (!navigator.onLine) return { syncedScans: 0, syncedIncidents: 0 };

    this.isSyncing = true;
    let syncedScans = 0;
    let syncedIncidents = 0;

    try {
      // ─── 1. Sync Scans ───
      const pendingScans = await loadPendingScans();
      this.emit({
        type: 'sync-progress',
        pendingScans: pendingScans.length,
        pendingIncidents: 0,
      });

      if (pendingScans.length > 0 && this.currentTripId) {
        try {
          const result = await syncScans(
            this.currentTripId,
            pendingScans.map((s) => ({
              id: s.id,
              qrCode: s.qrCode,
              type: s.type,
              timestamp: s.timestamp,
              zone: s.zone,
              status: s.status,
              pilgrimName: s.pilgrimName,
              deviceInfo: JSON.stringify({
                userAgent: navigator.userAgent,
                appVersion: '1.0.0',
              }),
            }))
          );

          if (result.success) {
            syncedScans = result.synced.length;
            // Remove synced items from pending
            const syncedIds = new Set(result.synced);
            const remainingScans = pendingScans.filter((s) => !syncedIds.has(s.id));
            await savePendingScans(remainingScans);
            console.log(`[SyncService] Synced ${syncedScans} scans, ${result.skipped.length} skipped`);
          }
        } catch (scanErr: unknown) {
          console.error('[SyncService] Scan sync error:', scanErr);
          // Keep pending scans for next retry
        }
      }

      // ─── 2. Sync Incidents ───
      const pendingIncidents = await loadPendingIncidents();

      if (pendingIncidents.length > 0 && this.currentTripId) {
        try {
          const result = await syncIncidents(
            pendingIncidents.map((inc) => ({
              type: inc.type,
              description: inc.description,
              relatedQrCode: inc.relatedQrCode,
              relatedName: inc.relatedName,
              tripId: this.currentTripId!,
              zone: inc.zone,
              timestamp: inc.timestamp,
              priority: 'normal',
            }))
          );

          if (result.success) {
            syncedIncidents = result.synced.length;
            const syncedIds = new Set(result.synced);
            const remainingIncidents = pendingIncidents.filter(
              (inc) => !syncedIds.has(inc.id)
            );
            await savePendingIncidents(remainingIncidents);
            console.log(`[SyncService] Synced ${syncedIncidents} incidents`);
          }
        } catch (incErr: unknown) {
          console.error('[SyncService] Incident sync error:', incErr);
        }
      }

      // ─── 3. Update last sync timestamp ───
      if (syncedScans > 0 || syncedIncidents > 0) {
        await saveLastSyncTimestamp(new Date().toISOString());
      }

      const finalPendingScans = await loadPendingScans();
      const finalPendingIncidents = await loadPendingIncidents();

      this.emit({
        type: 'sync-completed',
        pendingScans: finalPendingScans.length,
        pendingIncidents: finalPendingIncidents.length,
        syncedCount: syncedScans + syncedIncidents,
      });

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de synchronisation';
      console.error('[SyncService] Sync failed:', err);
      this.emit({
        type: 'sync-error',
        pendingScans: 0,
        pendingIncidents: 0,
        error: errorMsg,
      });
    } finally {
      this.isSyncing = false;
    }

    return { syncedScans, syncedIncidents };
  }

  // ─── Get pending counts ───
  async getPendingCounts(): Promise<{ scans: number; incidents: number }> {
    const scans = await loadPendingScans();
    const incidents = await loadPendingIncidents();
    return { scans: scans.length, incidents: incidents.length };
  }

  // ─── Check if currently syncing ───
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

// ─── Singleton instance ───
export const syncService = new SyncService();
