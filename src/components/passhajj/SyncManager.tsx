'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePassHajjStore } from '@/lib/passhajj-store';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

export default function SyncManager() {
  const { syncStatus, setSyncStatus, syncQueue, markSynced, pendingCount } = usePassHajjStore();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [justSynced, setJustSynced] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setSyncStatus('online');
    const handleOffline = () => setSyncStatus('offline');

    setSyncStatus(navigator.onLine ? 'online' : 'offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus]);

  // Auto-sync when online
  const performSync = useCallback(async () => {
    if (syncQueue.length === 0) return;
    if (!navigator.onLine) return;

    setSyncStatus('syncing');

    try {
      const res = await fetch('/api/leader/trips/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scans: syncQueue.map((s) => ({
            id: s.id,
            qrCode: s.qrCode,
            type: s.type,
            timestamp: s.timestamp,
            zone: s.zone,
            status: s.status,
          })),
        }),
      });

      const data = await res.json();

      if (data.success && data.synced) {
        markSynced(data.synced);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
      }
    } catch {
      // Will retry next interval
    } finally {
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
    }
  }, [syncQueue, markSynced, setSyncStatus]);

  // Set up sync interval
  useEffect(() => {
    if (syncStatus === 'online' && syncQueue.length > 0) {
      performSync();
      syncIntervalRef.current = setInterval(performSync, 30000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [syncStatus, syncQueue.length, performSync]);

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
        <>
          <Cloud className="w-4 h-4 text-amber-600" />
          <span className="text-amber-700 font-medium">{pendingCount} en attente</span>
        </>
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
    </div>
  );
}
