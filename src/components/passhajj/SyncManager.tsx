'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePassHajjStore } from '@/lib/passhajj-store';
import { syncService } from '@/services/SyncService';
import type { SyncEvent } from '@/services/SyncService';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';

export default function SyncManager() {
  const { syncStatus, setSyncStatus, syncQueue, markSynced, pendingCount } = usePassHajjStore();
  const [justSynced, setJustSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize SyncService and listen for events
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Subscribe to sync events
    const unsubscribe = syncService.subscribe((event: SyncEvent) => {
      switch (event.type) {
        case 'online':
          setSyncStatus('online');
          break;
        case 'offline':
          setSyncStatus('offline');
          break;
        case 'sync-started':
        case 'sync-progress':
          setSyncStatus('syncing');
          break;
        case 'sync-completed':
          setSyncStatus('online');
          if (event.syncedCount && event.syncedCount > 0) {
            setJustSynced(true);
            setTimeout(() => setJustSynced(false), 2000);
          }
          setSyncError(null);
          break;
        case 'sync-error':
          setSyncStatus(navigator.onLine ? 'online' : 'offline');
          setSyncError(event.error || null);
          break;
      }
    });

    // Initialize sync service (network listeners + auto-sync)
    const cleanup = syncService.init();

    // Start auto-sync
    if (navigator.onLine) {
      syncService.startAutoSync();
    }

    return () => {
      unsubscribe();
      cleanup();
      syncService.stopAutoSync();
    };
  }, [setSyncStatus]);

  // Manual sync trigger
  const handleManualSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await syncService.performSync();
      if (result.syncedScans > 0 || result.syncedIncidents > 0) {
        // Mark items as synced in the store
        const syncedIds = syncQueue
          .slice(0, result.syncedScans)
          .map((s) => s.id);
        if (syncedIds.length > 0) {
          markSynced(syncedIds);
        }
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
      }
      setSyncStatus('online');
    } catch {
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
    }
  }, [syncQueue, markSynced, setSyncStatus]);

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {syncStatus === 'online' && pendingCount === 0 && !justSynced && (
        <>
          <Cloud className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">Synced</span>
        </>
      )}
      {syncStatus === 'online' && justSynced && (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">Synced!</span>
        </>
      )}
      {syncStatus === 'online' && pendingCount > 0 && !justSynced && (
        <button
          onClick={handleManualSync}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <Cloud className="w-4 h-4 text-amber-600" />
          <span className="text-amber-700 font-medium">{pendingCount} en attente</span>
        </button>
      )}
      {syncStatus === 'syncing' && (
        <>
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-medium">Sync...</span>
        </>
      )}
      {syncStatus === 'offline' && (
        <>
          <CloudOff className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500 font-medium">Hors ligne</span>
          {pendingCount > 0 && (
            <span className="text-xs text-amber-600 ml-1">({pendingCount})</span>
          )}
        </>
      )}
      {syncError && (
        <span className="text-xs text-red-500 flex items-center gap-1" title={syncError}>
          <AlertCircle className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}
