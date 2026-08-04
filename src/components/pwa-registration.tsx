'use client';

import { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ — PWA Service Worker Registration
//  Registers the SW, dispatches update events, handles online/offline
// ═══════════════════════════════════════════════════════════════

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[PassHajj] SW registered:', registration.scope);

        // ─── Listen for SW updates ───
        registration.addEventListener('updatefound', () => {
          const newWorker = registration!.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available — dispatch custom event for usePWAUpdate hook
              console.log('[PassHajj] New SW version available');
              window.dispatchEvent(
                new CustomEvent('pwa-update-available', {
                  detail: { registration: registration },
                })
              );
            }
          });
        });

        // ─── Periodic update check (every 60s) ───
        const updateInterval = setInterval(() => {
          registration?.update().catch(() => {});
        }, 60_000);

        // ─── Check for waiting worker on load ───
        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent('pwa-update-available', {
              detail: { registration },
            })
          );
        }

        return () => clearInterval(updateInterval);
      } catch (error) {
        console.error('[PassHajj] SW registration failed:', error);
      }
    };

    window.addEventListener('load', registerSW);

    // ─── Handle online/offline status ───
    const handleOnline = () => {
      console.log('[PassHajj] Back online');
      window.dispatchEvent(new Event('pwa-online'));
      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          return reg.sync.register('sync-pending-scans');
        }).catch(() => {});
      }
    };

    const handleOffline = () => {
      console.log('[PassHajj] Gone offline');
      window.dispatchEvent(new Event('pwa-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('load', registerSW);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}

// ═══════════════════════════════════════════════════════════════
//  Hook: Check if app is running as installed PWA
// ═══════════════════════════════════════════════════════════════

export function usePWAInstall() {
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS =
      'standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone: boolean }).standalone;

    if (isStandalone || isInWebAppiOS) {
      console.log('[PassHajj] Running as PWA');
      document.body.classList.add('pwa-mode');
    }
  }, []);
}
