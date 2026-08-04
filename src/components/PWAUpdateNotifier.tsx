'use client';

import { useEffect } from 'react';
import usePWAUpdate from '@/hooks/usePWAUpdate';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ — PWA Update Notifier
//  Shows a toast when a new SW version is available
//  User can click "Recharger" to apply the update
// ═══════════════════════════════════════════════════════════════

export function PWAUpdateNotifier() {
  const { updateAvailable, updateApp } = usePWAUpdate();

  useEffect(() => {
    if (!updateAvailable) return;

    const toastId = toast('Nouvelle version disponible', {
      description: 'Une mise à jour est prête. Rechargez pour l\'appliquer.',
      icon: <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />,
      duration: Infinity, // Stay until user acts
      action: {
        label: 'Recharger',
        onClick: () => {
          updateApp();
        },
      },
      dismissible: true,
      style: {
        borderLeft: '4px solid #f4b400',
      },
    });

    return () => {
      toast.dismiss(toastId);
    };
  }, [updateAvailable, updateApp]);

  return null;
}
