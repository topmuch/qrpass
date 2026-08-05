'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PWAUpdateEventDetail {
  registration: ServiceWorkerRegistration;
}

interface PWAUpdateEvent extends CustomEvent {
  detail: PWAUpdateEventDetail;
}

interface UsePWAUpdateReturn {
  updateAvailable: boolean;
  updateApp: () => void;
}

export default function usePWAUpdate(): UsePWAUpdateReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const handleUpdateAvailable = useCallback((reg: ServiceWorkerRegistration) => {
    registrationRef.current = reg;
    setUpdateAvailable(true);
  }, []);

  // Listen for the custom event dispatched by the SW registration logic
  useEffect(() => {
    const onPWAUpdateEvent = (event: Event) => {
      const customEvent = event as PWAUpdateEvent;
      if (customEvent.detail?.registration) {
        handleUpdateAvailable(customEvent.detail.registration);
      }
    };

    window.addEventListener('pwa-update-available', onPWAUpdateEvent);

    return () => {
      window.removeEventListener('pwa-update-available', onPWAUpdateEvent);
    };
  }, [handleUpdateAvailable]);

  // Fallback: listen directly to navigator.serviceWorker for update detection
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let newWorker: ServiceWorker | null = null;

    const onUpdateFound = () => {
      const reg = navigator.serviceWorker.controller
        ? null // We'll get the registration from the ready promise
        : null;

      // We need the active registration to check for updates
      navigator.serviceWorker.ready.then((registration) => {
        if (!navigator.serviceWorker.controller) {
          // No controller means SW is installing for the first time, not an update
          return;
        }

        // If there's a waiting worker, it's an update
        if (registration.waiting) {
          handleUpdateAvailable(registration);
          return;
        }

        // Listen for the new worker to install
        const handleStateChange = () => {
          if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
            handleUpdateAvailable(registration);
          }
        };

        if (registration.installing) {
          newWorker = registration.installing;
          newWorker.addEventListener('statechange', handleStateChange);
        }

        // Also listen for future updatefound events on this registration
        const onUpdateFoundOnReg = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          newWorker = installingWorker;
          const onStateChange = () => {
            if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
              handleUpdateAvailable(registration);
              newWorker?.removeEventListener('statechange', onStateChange);
            }
          };
          installingWorker.addEventListener('statechange', onStateChange);
        };

        registration.addEventListener('updatefound', onUpdateFoundOnReg);

        // Store cleanup for this registration listener
        // (We'll clean it up when the effect disposes)
        (registration as ServiceWorkerRegistration & { _cleanupUpdateFound?: () => void })._cleanupUpdateFound = () => {
          registration.removeEventListener('updatefound', onUpdateFoundOnReg);
        };
      });
    };

    // Check immediately
    onUpdateFound();

    // Also set up a periodic check (every 60s) for service worker updates
    const intervalId = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      }).catch(() => {
        // Silently ignore update check failures
      });
    }, 60_000);

    return () => {
      clearInterval(intervalId);
      // Clean up any registration listeners
      navigator.serviceWorker.ready.then((registration) => {
        const cleanup = (registration as ServiceWorkerRegistration & { _cleanupUpdateFound?: () => void })._cleanupUpdateFound;
        if (cleanup) cleanup();
      }).catch(() => {});
    };
  }, [handleUpdateAvailable]);

  const updateApp = useCallback(() => {
    const registration = registrationRef.current;

    if (!registration) {
      // Fallback: just reload
      window.location.reload();
      return;
    }

    const waitingWorker = registration.waiting;

    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and activate
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }

    // Listen for controller change to reload the page
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Safety timeout: if controllerchange doesn't fire within 5s, reload anyway
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      // Only reload if we haven't already
      if (registrationRef.current) {
        window.location.reload();
      }
    }, 5_000);
  }, []);

  return { updateAvailable, updateApp };
}
