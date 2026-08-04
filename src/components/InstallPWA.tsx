'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'passhajj_install_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Theme colors ─────────────────────────────────────────────────────────────
const JAUNE = '#f4b400';
const BLEU_MARINE = '#1e3a5f';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type BannerType = 'standard' | 'ios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if the app is already running in standalone / installed mode */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) {
    return true;
  }
  return false;
}

/** Detect iOS Safari (not Chrome on iOS, not standalone) */
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua);
  const isNotChrome = !/CriOS|FxiOS/.test(ua);
  const isNotStandalone = !isStandalone();
  return isIOS && isSafari && isNotChrome && isNotStandalone;
}

/** Check if running inside an iframe */
function isIframe(): boolean {
  if (typeof window === 'undefined') return false;
  return window !== window.top;
}

/** Check if the banner was dismissed recently (within 24h) */
function wasRecentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (isNaN(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

/** Store the current dismissal timestamp */
function storeDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable – silently ignore
  }
}

/**
 * Evaluate once on mount whether we should show the banner and which type.
 * Returns null when the banner should NOT appear.
 */
function evaluateBannerType(): BannerType | null {
  if (typeof window === 'undefined') return null;
  if (isIframe() || isStandalone() || wasRecentlyDismissed()) return null;
  if (isIOSSafari()) return 'ios';
  // For standard browsers, the banner will appear when beforeinstallprompt fires
  return null;
}

// ─── useInstallPrompt hook ───────────────────────────────────────────────────

/**
 * A headless hook that exposes install-prompt capabilities without any UI.
 * Returns `{ canInstall, promptInstall }`.
 *
 * - `canInstall` is true when a deferred `beforeinstallprompt` has been captured.
 * - `promptInstall()` triggers the native install dialog and returns the outcome.
 */
export function useInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return null;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    // Once consumed, the prompt cannot be reused
    deferredPromptRef.current = null;
    setCanInstall(false);

    return outcome;
  }, []);

  return { canInstall, promptInstall };
}

// ─── InstallPWA component ────────────────────────────────────────────────────

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerType, setBannerType] = useState<BannerType | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // ── Check iOS / hidden conditions on mount ────────────────────────────
    // These browser APIs (iframe, standalone, iOS detection) are only
    // available at runtime, so we must set state in the mount effect.
    const initialType = evaluateBannerType();
    if (initialType === 'ios') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time browser API detection not available during SSR
      setBannerType('ios');
      setVisible(true);
    }

    // ── Listen for the standard beforeinstallprompt event ─────────────────
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setBannerType('standard');
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // ── Dismiss helper ────────────────────────────────────────────────────────

  const dismissBanner = useCallback(() => {
    setVisible(false);
    storeDismissal();
  }, []);

  // ── Install handler (standard PWA) ────────────────────────────────────────

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // Prompt can only be used once
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      toast.success('App installée !', {
        icon: '🎉',
      });
      setVisible(false);
    } else {
      // User dismissed the native dialog – treat as "later"
      dismissBanner();
    }
  }, [deferredPrompt, dismissBanner]);

  // ── "Plus tard" handler ───────────────────────────────────────────────────

  const handleLater = useCallback(() => {
    dismissBanner();
  }, [dismissBanner]);

  // ── Derived values ────────────────────────────────────────────────────────

  const isIOS = bannerType === 'ios';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {visible && bannerType && (
        <motion.div
          key="install-pwa-banner"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          {/* Jaune background with safe-area padding for iOS */}
          <div
            className="w-full px-4 pt-4 pb-4 relative"
            style={{
              backgroundColor: JAUNE,
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Close X button top-right */}
            <button
              type="button"
              onClick={handleLater}
              aria-label="Fermer"
              className="absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ color: 'white' }}
            >
              <X className="h-5 w-5" />
            </button>

            {!isIOS ? (
              /* ────── Standard PWA install banner ────── */
              <div className="flex items-center gap-3 pr-6">
                <Download className="h-6 w-6 shrink-0" style={{ color: 'white' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: 'white' }}>
                    📲 Installez l&apos;app pour un accès rapide et hors-ligne.
                  </p>
                </div>
              </div>
            ) : (
              /* ────── iOS Safari manual install instructions ────── */
              <div className="flex items-start gap-3 pr-6">
                <Share className="h-6 w-6 shrink-0 mt-0.5" style={{ color: 'white' }} />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'white' }}>
                    Pour installer :
                  </p>
                  <ol
                    className="text-sm space-y-1.5 list-none"
                    style={{ color: 'white' }}
                  >
                    <li className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: BLEU_MARINE, color: 'white' }}
                      >
                        1
                      </span>
                      <span>Appuyez sur l&apos;icône Partager ⬆︎</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: BLEU_MARINE, color: 'white' }}
                      >
                        2
                      </span>
                      <span>Puis &quot;Sur l&apos;écran d&apos;accueil&quot;</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* ── Action buttons ── */}
            <div className="mt-3 flex items-center gap-2">
              {!isIOS ? (
                <>
                  {/* "Installer" – primary button */}
                  <Button
                    type="button"
                    onClick={handleInstall}
                    className="h-9 px-4 rounded-full text-sm font-semibold transition-transform active:scale-95"
                    style={{
                      backgroundColor: 'white',
                      color: BLEU_MARINE,
                    }}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Installer
                  </Button>

                  {/* "Plus tard" – ghost button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleLater}
                    className="h-9 px-4 rounded-full text-sm font-medium border transition-transform active:scale-95"
                    style={{
                      color: 'white',
                      borderColor: 'white',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Plus tard
                  </Button>
                </>
              ) : (
                /* iOS: only "Compris" dismiss button */
                <Button
                  type="button"
                  onClick={handleLater}
                  className="h-9 px-4 rounded-full text-sm font-semibold transition-transform active:scale-95"
                  style={{
                    backgroundColor: 'white',
                    color: BLEU_MARINE,
                  }}
                >
                  Compris
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
