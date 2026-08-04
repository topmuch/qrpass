'use client';

import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import type { SyncStatus } from '@/lib/passhajj-types';

interface StatusBadgeProps {
  syncStatus: SyncStatus;
  pendingCount?: number;
  compact?: boolean;
}

export default function StatusBadge({ syncStatus, pendingCount = 0, compact = false }: StatusBadgeProps) {
  if (compact) {
    // Compact mode: just icon + small text
    return (
      <div className="flex items-center gap-1">
        {syncStatus === 'online' && (
          <>
            <Wifi className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-green-700 font-medium">
              {pendingCount > 0 ? `${pendingCount} en attente` : 'En ligne'}
            </span>
          </>
        )}
        {syncStatus === 'offline' && (
          <>
            <WifiOff className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Hors ligne</span>
          </>
        )}
        {syncStatus === 'syncing' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span className="text-xs text-blue-700 font-medium">Sync...</span>
          </>
        )}
      </div>
    );
  }

  // Full mode: badge with icon, text, and pending count
  return (
    <div className="inline-flex items-center gap-1.5">
      {syncStatus === 'online' && pendingCount === 0 && (
        <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-sm font-medium">
          <Cloud className="w-3.5 h-3.5" />
          Synced
        </div>
      )}
      {syncStatus === 'online' && pendingCount > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-sm font-medium">
          <Cloud className="w-3.5 h-3.5" />
          {pendingCount} en attente
        </div>
      )}
      {syncStatus === 'syncing' && (
        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Synchronisation...
        </div>
      )}
      {syncStatus === 'offline' && (
        <div className="flex items-center gap-1.5 bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-sm font-medium">
          <CloudOff className="w-3.5 h-3.5" />
          Hors ligne
          {pendingCount > 0 && (
            <span className="text-xs text-amber-600">({pendingCount})</span>
          )}
        </div>
      )}
    </div>
  );
}
