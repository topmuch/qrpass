'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Luggage,
  AlertCircle,
  Phone,
  MapPin,
  MessageCircle,
  Navigation,
  Heart,
  Building2,
  Droplets,
  AlertTriangle,
  Shield,
  Globe,
  Hash,
  Plane,
  Hotel,
  FolderOpen,
  ScanLine,
  RotateCcw,
} from 'lucide-react';
import { finderLookup } from '@/services/api';
import type {
  FinderResult,
  FinderIdentityResult,
  FinderBaggageResult,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import GPSButton from '@/components/finder/GPSButton';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════
//  BRAND CONSTANTS — Jaune / Blanc / Bleu Marine
// ═══════════════════════════════════════════════════════════════

const YELLOW = '#f4b400';
const NAVY = '#1e3a5f';
const WHITE = '#ffffff';
const INK = '#0f172a';
const MUTED = '#64748b';
const GREEN_IDENTITY = '#059669';
const BLUE_BAGGAGE = '#2563eb';
const DANGER = '#dc2626';
const WARNING = '#f59e0b';

// ═══════════════════════════════════════════════════════════════
//  NATIONALITY → FLAG EMOJI MAPPING
// ═══════════════════════════════════════════════════════════════

const NATIONALITY_FLAGS: Record<string, string> = {
  // Maghreb
  'MA': '🇲🇦', 'DZ': '🇩🇿', 'TN': '🇹🇳', 'LY': '🇱🇾', 'MR': '🇲🇷',
  // Moyen-Orient
  'SA': '🇸🇦', 'AE': '🇦🇪', 'KW': '🇰🇼', 'QA': '🇶🇦', 'BH': '🇧🇭', 'OM': '🇴🇲',
  'IQ': '🇮🇶', 'SY': '🇸🇾', 'JO': '🇯🇴', 'LB': '🇱🇧', 'PS': '🇵🇸', 'IR': '🇮🇷', 'TR': '🇹🇷',
  // Afrique
  'SN': '🇸🇳', 'ML': '🇲🇱', 'GN': '🇬🇳', 'CM': '🇨🇲', 'NG': '🇳🇬', 'TD': '🇹🇩',
  'NE': '🇳🇪', 'BF': '🇧🇫', 'CI': '🇨🇮', 'BJ': '🇧🇯', 'TG': '🇹🇬', 'GA': '🇬🇦',
  'CG': '🇨🇬', 'CD': '🇨🇩', 'ET': '🇪🇹', 'KE': '🇰🇪', 'TZ': '🇹🇿', 'UG': '🇺🇬',
  'SD': '🇸🇩', 'EG': '🇪🇬', 'SO': '🇸🇴', 'DJ': '🇩🇯', 'KM': '🇰🇲', 'MG': '🇲🇬',
  'MU': '🇲🇺', 'ZA': '🇿🇦', 'GH': '🇬🇭', 'SL': '🇸🇱', 'LR': '🇱🇷', 'GM': '🇬🇲',
  'GW': '🇬🇼', 'CV': '🇨🇻', 'ST': '🇸🇹', 'GQ': '🇬🇶', 'CF': '🇨🇫', 'MW': '🇲🇼',
  'ZM': '🇿🇲', 'ZW': '🇿🇼', 'MZ': '🇲🇿', 'AO': '🇦🇴', 'RW': '🇷🇼', 'BI': '🇧🇮',
  // Europe
  'FR': '🇫🇷', 'GB': '🇬🇧', 'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱',
  'BE': '🇧🇪', 'PT': '🇵🇹', 'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴',
  'DK': '🇩🇰', 'PL': '🇵🇱', 'RU': '🇷🇺', 'UA': '🇺🇦',
  // Asie
  'ID': '🇮🇩', 'MY': '🇲🇾', 'PK': '🇵🇰', 'BD': '🇧🇩', 'IN': '🇮🇳', 'AF': '🇦🇫',
  'UZ': '🇺🇿', 'KZ': '🇰🇿', 'CN': '🇨🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'TH': '🇹🇭',
  'PH': '🇵🇭', 'VN': '🇻🇳', 'SG': '🇸🇬', 'BN': '🇧🇳',
  // Amériques
  'US': '🇺🇸', 'CA': '🇨🇦', 'BR': '🇧🇷', 'AR': '🇦🇷', 'MX': '🇲🇽',
  // Océanie
  'AU': '🇦🇺', 'NZ': '🇳🇿',
  // Noms communs français
  'Maroc': '🇲🇦', 'Algérie': '🇩🇿', 'Tunisie': '🇹🇳', 'Libye': '🇱🇾',
  'Mauritanie': '🇲🇷', 'Arabie Saoudite': '🇸🇦', 'Égypte': '🇪🇬',
  'Soudan': '🇸🇩', 'Sénégal': '🇸🇳', 'Mali': '🇲🇱', 'Guinée': '🇬🇳',
  'Cameroun': '🇨🇲', 'Nigeria': '🇳🇬', 'Niger': '🇳🇪', 'Tchad': '🇹🇩',
  'Burkina Faso': '🇧🇫', 'Côte d\'Ivoire': '🇨🇮', 'Bénin': '🇧🇯',
  'Togo': '🇹🇬', 'Gabon': '🇬🇦', 'Congo': '🇨🇬', 'Éthiopie': '🇪🇹',
  'Kenya': '🇰🇪', 'Tanzanie': '🇹🇿', 'Ouganda': '🇺🇬', 'Ghana': '🇬🇭',
  'Afrique du Sud': '🇿🇦', 'France': '🇫🇷', 'Inde': '🇮🇳', 'Pakistan': '🇵🇰',
  'Indonésie': '🇮🇩', 'Malaisie': '🇲🇾', 'Turquie': '🇹🇷', 'Iran': '🇮🇷',
  'Irak': '🇮🇶', 'Jordanie': '🇯🇴', 'Liban': '🇱🇧', 'Syrie': '🇸🇾',
  'Émirats Arabes Unis': '🇦🇪', 'Koweït': '🇰🇼', 'Qatar': '🇶🇦', 'Bahreïn': '🇧🇭',
  'Oman': '🇴🇲', 'Yémen': '🇾🇪', 'Palestine': '🇵🇸', 'Afghanistan': '🇦🇫',
};

function getFlag(nationality: string | null | undefined): string {
  if (!nationality) return '🌍';
  return NATIONALITY_FLAGS[nationality] || NATIONALITY_FLAGS[nationality.toUpperCase()] || '🌍';
}

// ═══════════════════════════════════════════════════════════════
//  BAGGAGE STATUS CONFIG
// ═══════════════════════════════════════════════════════════════

const BAGGAGE_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  with_me: { label: 'Avec moi', color: '#059669', bgColor: '#d1fae5' },
  lost: { label: 'Perdu', color: '#dc2626', bgColor: '#fee2e2' },
  found: { label: 'Retrouvé', color: '#2563eb', bgColor: '#dbeafe' },
  delivered: { label: 'Livré', color: '#059669', bgColor: '#d1fae5' },
  in_transit: { label: 'En transit', color: '#f59e0b', bgColor: '#fef3c7' },
};

function getBaggageStatusConfig(status: string | null | undefined) {
  if (!status) return { label: 'Inconnu', color: MUTED, bgColor: '#f1f5f9' };
  return BAGGAGE_STATUS_MAP[status] || { label: status, color: MUTED, bgColor: '#f1f5f9' };
}

// ═══════════════════════════════════════════════════════════════
//  BAGGAGE TYPE CONFIG
// ═══════════════════════════════════════════════════════════════

const BAGGAGE_TYPE_MAP: Record<string, { label: string; icon: string }> = {
  cabine: { label: 'Cabine', icon: '🎒' },
  soute: { label: 'Soute', icon: '🧳' },
  main: { label: 'Main', icon: '👜' },
  other: { label: 'Autre', icon: '📦' },
};

// ═══════════════════════════════════════════════════════════════
//  PHOTO URL HELPER — Rewrite /uploads/ paths through serve-upload API
// ═══════════════════════════════════════════════════════════════

function getPhotoDisplayUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('/uploads/')) {
    return `/api/serve-upload/${photoUrl.slice('/uploads/'.length)}`;
  }
  return photoUrl;
}

// ═══════════════════════════════════════════════════════════════
//  PAGE STATES
// ═══════════════════════════════════════════════════════════════

type PageState = 'loading' | 'loaded' | 'not_found' | 'not_activated' | 'invalid' | 'network_error';

// ═══════════════════════════════════════════════════════════════
//  ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// ═══════════════════════════════════════════════════════════════
//  SKELETON LOADERS
// ═══════════════════════════════════════════════════════════════

function IdentitySkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Avatar skeleton */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* Info rows */}
      <div className="space-y-3 px-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      {/* Hotel skeletons */}
      <div className="space-y-3 px-2">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      {/* Button skeletons */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function BaggageSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Bag icon skeleton */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Skeleton className="w-20 h-20 rounded-2xl" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* Detail rows */}
      <div className="space-y-3 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      {/* Button skeletons */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN FINDER PAGE
// ═══════════════════════════════════════════════════════════════

export default function FinderPage() {
  const { type, code } = useParams<{ type: string; code: string }>();

  // ─── Synchronous validation (computed during render, not in effect) ───
  const isValidType = type === 'identity' || type === 'baggage';
  const isValidPrefix =
    (type === 'identity' && code?.startsWith('ID-')) ||
    (type === 'baggage' && code?.startsWith('BG-'));
  const isParamValid = isValidType && isValidPrefix;

  // ─── Fetch state: null = loading, FinderResult = success, string = error key ───
  const [fetchResult, setFetchResult] = useState<{
    status: 'loading' | 'loaded' | 'not_found' | 'not_activated' | 'network_error';
    data: FinderResult | null;
  }>({ status: isParamValid && code ? 'loading' : 'not_found', data: null });

  // ─── Data Loading (only runs when params are valid) ───
  useEffect(() => {
    if (!code || !isParamValid) return;

    let cancelled = false;

    finderLookup(code)
      .then((result) => {
        if (cancelled) return;
        if (result.type === 'identity' && !result.isActive) {
          setFetchResult({ status: 'not_activated', data: result });
        } else {
          setFetchResult({ status: 'loaded', data: result });
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setFetchResult({ status: 'not_found', data: null });
        } else if (!err?.response || err?.isOffline) {
          setFetchResult({ status: 'network_error', data: null });
        } else {
          setFetchResult({ status: 'not_found', data: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, type, isParamValid]);

  // Derive page state from param validity + fetch result
  const state: PageState = !code || !isParamValid ? 'invalid' : fetchResult.status;
  const data = fetchResult.data;

  const handleRetry = useCallback(() => {
    if (!code || !isParamValid) return;
    setFetchResult({ status: 'loading', data: null });
    finderLookup(code)
      .then((result) => {
        if (result.type === 'identity' && !result.isActive) {
          setFetchResult({ status: 'not_activated', data: result });
        } else {
          setFetchResult({ status: 'loaded', data: result });
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) setFetchResult({ status: 'not_found', data: null });
        else if (!err?.response || err?.isOffline) setFetchResult({ status: 'network_error', data: null });
        else setFetchResult({ status: 'not_found', data: null });
      });
  }, [code, isParamValid]);

  // ─── Derive accent color from type ───
  const accent = type === 'identity' ? GREEN_IDENTITY : BLUE_BAGGAGE;

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex flex-col" style={{ background: YELLOW }}>
      {/* ─── Brand Header ─── */}
      <header className="w-full flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="PassHajj"
            width={140}
            height={52}
            style={{
              objectFit: 'contain',
              borderRadius: '12px',
              padding: '4px',
              background: 'rgba(255,255,255,0.9)',
            }}
          />
          <Badge
            className="text-xs font-semibold px-2.5 py-1 border-0"
            style={{ background: NAVY, color: WHITE }}
          >
            <ScanLine className="w-3 h-3 mr-1" />
            QR Finder
          </Badge>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8 pt-2">
        <AnimatePresence mode="wait">
          {/* ─── LOADING STATE ─── */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <Card className="rounded-2xl shadow-lg border-0" style={{ background: WHITE }}>
                <CardContent className="p-0">
                  {type === 'identity' ? <IdentitySkeleton /> : <BaggageSkeleton />}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── INVALID QR STATE ─── */}
          {state === 'invalid' && (
            <motion.div
              key="invalid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <Card className="rounded-2xl shadow-lg border-0" style={{ background: WHITE }}>
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#fee2e2' }}
                  >
                    <AlertCircle className="w-10 h-10" style={{ color: DANGER }} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                    QR invalide
                  </h2>
                  <p className="text-sm mb-2" style={{ color: MUTED }}>
                    Ce code QR n&apos;est pas valide.
                  </p>
                  <p className="text-xs mb-6" style={{ color: MUTED }}>
                    Les codes valides commencent par <code className="font-mono font-semibold px-1 py-0.5 rounded" style={{ background: '#f1f5f9' }}>ID-</code> (identité) ou <code className="font-mono font-semibold px-1 py-0.5 rounded" style={{ background: '#f1f5f9' }}>BG-</code> (bagage).
                  </p>
                  <Link href="/">
                    <Button
                      className="w-full font-bold text-white rounded-xl h-12"
                      style={{ background: NAVY }}
                    >
                      Retour à l&apos;accueil
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── NOT FOUND / NOT ACTIVATED STATE ─── */}
          {(state === 'not_found' || state === 'not_activated') && (
            <motion.div
              key={state}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <Card className="rounded-2xl shadow-lg border-0" style={{ background: WHITE }}>
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: state === 'not_activated' ? '#fef3c7' : '#fee2e2' }}
                  >
                    {state === 'not_activated' ? (
                      <Shield className="w-10 h-10" style={{ color: WARNING }} />
                    ) : (
                      <AlertCircle className="w-10 h-10" style={{ color: DANGER }} />
                    )}
                  </motion.div>

                  {state === 'not_activated' ? (
                    <>
                      <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                        QR non activé
                      </h2>
                      <p className="text-sm mb-6" style={{ color: MUTED }}>
                        Ce bracelet d&apos;identification n&apos;a pas encore été activé.
                        Activez-le pour accéder aux informations du pèlerin.
                      </p>
                      <Link href={`/activate/identity?code=${encodeURIComponent(code)}`}>
                        <Button
                          className="w-full font-bold text-white rounded-xl h-12 mb-3"
                          style={{ background: GREEN_IDENTITY }}
                        >
                          Activer ce QR
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                        QR invalide ou non activé
                      </h2>
                      <p className="text-sm mb-6" style={{ color: MUTED }}>
                        Ce code QR n&apos;existe pas dans notre système ou n&apos;a pas été activé.
                      </p>
                      <Link href="/activate/identity">
                        <Button
                          className="w-full font-bold text-white rounded-xl h-12 mb-3"
                          style={{ background: accent }}
                        >
                          Activer un QR
                        </Button>
                      </Link>
                    </>
                  )}

                  <Link href="/">
                    <Button
                      variant="outline"
                      className="w-full font-semibold rounded-xl h-12"
                    >
                      Retour à l&apos;accueil
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── NETWORK ERROR STATE ─── */}
          {state === 'network_error' && (
            <motion.div
              key="network_error"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <Card className="rounded-2xl shadow-lg border-0" style={{ background: WHITE }}>
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#fef3c7' }}
                  >
                    <AlertTriangle className="w-10 h-10" style={{ color: WARNING }} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                    Erreur réseau
                  </h2>
                  <p className="text-sm mb-6" style={{ color: MUTED }}>
                    Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.
                  </p>
                  <Button
                    onClick={handleRetry}
                    className="w-full font-bold text-white rounded-xl h-12"
                    style={{ background: accent }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── LOADED STATE — IDENTITY ─── */}
          {state === 'loaded' && data?.type === 'identity' && (
            <IdentityView data={data} accent={accent} code={code} />
          )}

          {/* ─── LOADED STATE — BAGGAGE ─── */}
          {state === 'loaded' && data?.type === 'baggage' && (
            <BaggageView data={data} accent={accent} code={code} />
          )}
        </AnimatePresence>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-auto text-center text-xs pb-4 px-4" style={{ color: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>PassHajj · Protection intelligente Hajj &amp; Omrah</span>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  IDENTITY VIEW COMPONENT
// ═══════════════════════════════════════════════════════════════

function IdentityView({
  data,
  accent,
  code,
}: {
  data: FinderIdentityResult;
  accent: string;
  code: string;
}) {
  const photoUrl = getPhotoDisplayUrl(data.photoUrl);
  const initials = data.fullName
    ? data.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'P';

  const hasMedicalInfo = data.bloodType || data.allergies || data.diseases;

  return (
    <motion.div
      key="identity-loaded"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-md"
    >
      <Card className="rounded-2xl shadow-lg border-0 overflow-hidden" style={{ background: WHITE }}>
        {/* Accent strip */}
        <div className="h-1.5 w-full" style={{ background: accent }} />

        <CardContent className="p-0">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-0"
          >
            {/* ─── Avatar & Name ─── */}
            <motion.div variants={itemVariants} custom={0} className="flex flex-col items-center pt-6 pb-4 px-6">
              <Avatar className="w-24 h-24 mb-3 ring-4 ring-offset-2" style={{ '--tw-ring-color': accent } as any}>
                {photoUrl && <AvatarImage src={photoUrl} alt={data.fullName} />}
                <AvatarFallback
                  className="text-2xl font-bold"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold text-center" style={{ color: INK }}>
                {data.fullName}
              </h1>
              {data.nationality && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-lg">{getFlag(data.nationality)}</span>
                  <span className="text-sm font-medium" style={{ color: MUTED }}>
                    {data.nationality}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} custom={1}>
              <Separator />
            </motion.div>

            {/* ─── Medical Info ─── */}
            {hasMedicalInfo && (
              <motion.div variants={itemVariants} custom={2} className="px-6 py-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: MUTED }}>
                  <Heart className="w-3.5 h-3.5" />
                  Informations médicales
                </h3>

                <div className="flex flex-wrap gap-2">
                  {data.bloodType && (
                    <Badge
                      className="font-semibold text-sm px-3 py-1 border-0"
                      style={{ background: '#fee2e2', color: DANGER }}
                    >
                      <Droplets className="w-3.5 h-3.5 mr-1" />
                      {data.bloodType}
                    </Badge>
                  )}
                  {data.allergies && (
                    <Badge
                      className="font-semibold text-sm px-3 py-1 border-0"
                      style={{ background: '#fef3c7', color: '#92400e' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Allergies: {data.allergies}
                    </Badge>
                  )}
                  {data.diseases && (
                    <Badge
                      className="font-semibold text-sm px-3 py-1 border-0"
                      style={{ background: '#fef3c7', color: '#92400e' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Maladies: {data.diseases}
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}

            {hasMedicalInfo && (
              <motion.div variants={itemVariants} custom={3}>
                <Separator />
              </motion.div>
            )}

            {/* ─── Group ─── */}
            {data.group && (
              <motion.div variants={itemVariants} custom={4} className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: data.group.color || accent }}
                  />
                  <span className="text-sm font-medium" style={{ color: MUTED }}>Groupe:</span>
                  <span className="text-sm font-semibold" style={{ color: INK }}>
                    {data.group.name}
                  </span>
                </div>
              </motion.div>
            )}

            {/* ─── Hotels ─── */}
            {(data.hotelMecca || data.hotelMedina) && (
              <motion.div variants={itemVariants} custom={5} className="px-6 py-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: MUTED }}>
                  <Hotel className="w-3.5 h-3.5" />
                  Hébergement
                </h3>

                {data.hotelMecca && (
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">🕋</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: INK }}>
                        La Mecque — {data.hotelMecca}
                      </p>
                      {data.roomMecca && (
                        <p className="text-xs" style={{ color: MUTED }}>
                          Chambre {data.roomMecca}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {data.hotelMedina && (
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5">🕌</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: INK }}>
                        Médine — {data.hotelMedina}
                      </p>
                      {data.roomMedina && (
                        <p className="text-xs" style={{ color: MUTED }}>
                          Chambre {data.roomMedina}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Active Incidents ─── */}
            {data.activeIncidents && data.activeIncidents.length > 0 && (
              <>
                <motion.div variants={itemVariants} custom={6}>
                  <Separator />
                </motion.div>
                <motion.div variants={itemVariants} custom={7} className="px-6 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: DANGER }}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Incidents actifs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.activeIncidents.map((incident: any, idx: number) => (
                      <Badge
                        key={incident.id || idx}
                        className="font-medium text-xs px-2.5 py-1 border-0"
                        style={{ background: '#fee2e2', color: DANGER }}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {incident.type || 'Incident'}{incident.description ? `: ${incident.description.slice(0, 40)}` : ''}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            <motion.div variants={itemVariants} custom={8}>
              <Separator />
            </motion.div>

            {/* ─── Action Buttons ─── */}
            <motion.div variants={itemVariants} custom={9} className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Contacter chef */}
                <Button
                  onClick={() => {
                    toast.info('Fonctionnalité à venir', { description: 'Contact chef de groupe bientôt disponible.' });
                  }}
                  className="font-semibold text-white rounded-xl h-12 text-sm"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Contacter chef
                </Button>

                {/* Appeler famille */}
                <Button
                  onClick={() => {
                    toast.info('Fonctionnalité à venir', { description: 'Contact famille bientôt disponible.' });
                  }}
                  variant="outline"
                  className="font-semibold rounded-xl h-12 text-sm"
                >
                  <Phone className="w-4 h-4 mr-1.5" />
                  Appeler famille
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Itinéraire hôtel */}
                <Button
                  onClick={() => {
                    const query = data.hotelMecca
                      ? encodeURIComponent(data.hotelMecca)
                      : 'Mecca,Saudi+Arabia';
                    window.open(
                      `https://maps.google.com/?q=${query}`,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                  variant="outline"
                  className="font-semibold rounded-xl h-12 text-sm"
                >
                  <Navigation className="w-4 h-4 mr-1.5" />
                  Itinéraire hôtel
                </Button>

                {/* Signaler perdu */}
                <Link href={`/finder/report?code=${encodeURIComponent(code)}&type=identity`} className="w-full">
                  <Button
                    className="w-full font-semibold text-white rounded-xl h-12 text-sm"
                    style={{ background: DANGER }}
                  >
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    Signaler perdu
                  </Button>
                </Link>
              </div>

              {/* GPS Location Share */}
              <GPSButton
                label="Partager ma position"
                className="w-full rounded-xl h-12 text-sm"
              />
            </motion.div>

            {/* ─── QR Code badge ─── */}
            <motion.div variants={itemVariants} custom={10} className="px-6 pb-4 flex items-center justify-center">
              <span className="text-xs font-mono font-medium px-3 py-1.5 rounded-full" style={{ background: '#f1f5f9', color: MUTED }}>
                {data.qrCode}
              </span>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BAGGAGE VIEW COMPONENT
// ═══════════════════════════════════════════════════════════════

function BaggageView({
  data,
  accent,
  code,
}: {
  data: FinderBaggageResult;
  accent: string;
  code: string;
}) {
  const photoUrl = getPhotoDisplayUrl(data.photoUrl);
  const statusConfig = getBaggageStatusConfig(data.status);
  const baggageType = data.baggageType
    ? BAGGAGE_TYPE_MAP[data.baggageType] || { label: data.baggageType, icon: '📦' }
    : null;

  return (
    <motion.div
      key="baggage-loaded"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-md"
    >
      <Card className="rounded-2xl shadow-lg border-0 overflow-hidden" style={{ background: WHITE }}>
        {/* Accent strip */}
        <div className="h-1.5 w-full" style={{ background: accent }} />

        <CardContent className="p-0">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-0"
          >
            {/* ─── Bag Icon & Owner ─── */}
            <motion.div variants={itemVariants} custom={0} className="flex flex-col items-center pt-6 pb-4 px-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: `${accent}12` }}
              >
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={data.ownerName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Luggage className="w-10 h-10" style={{ color: accent }} />
                )}
              </div>
              <h1 className="text-xl font-bold text-center" style={{ color: INK }}>
                {data.ownerName}
              </h1>
              <p className="text-xs font-medium mt-1" style={{ color: MUTED }}>
                Propriétaire
              </p>
            </motion.div>

            <motion.div variants={itemVariants} custom={1}>
              <Separator />
            </motion.div>

            {/* ─── Bag Details ─── */}
            <motion.div variants={itemVariants} custom={2} className="px-6 py-4 space-y-3">
              {/* Type & Status row */}
              <div className="flex flex-wrap gap-2 items-center">
                {baggageType && (
                  <Badge
                    className="font-semibold text-sm px-3 py-1 border-0"
                    style={{ background: `${accent}15`, color: accent }}
                  >
                    {baggageType.icon} {baggageType.label}
                  </Badge>
                )}
                {data.baggageIndex != null && (
                  <Badge
                    variant="outline"
                    className="font-medium text-sm px-3 py-1"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    Index {data.baggageIndex}
                  </Badge>
                )}
                <Badge
                  className="font-semibold text-sm px-3 py-1 border-0"
                  style={{ background: statusConfig.bgColor, color: statusConfig.color }}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Color */}
              {data.color && (
                <div className="flex items-center gap-2.5">
                  <span className="text-sm" style={{ color: MUTED }}>Couleur:</span>
                  <span className="text-sm font-medium" style={{ color: INK }}>{data.color}</span>
                </div>
              )}

              {/* Description */}
              {data.description && (
                <div className="flex items-start gap-2.5">
                  <span className="text-sm shrink-0" style={{ color: MUTED }}>Description:</span>
                  <span className="text-sm font-medium" style={{ color: INK }}>{data.description}</span>
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} custom={3}>
              <Separator />
            </motion.div>

            {/* ─── Flight Info ─── */}
            {(data.airline || data.flightNumber || data.destination) && (
              <motion.div variants={itemVariants} custom={4} className="px-6 py-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: MUTED }}>
                  <Plane className="w-3.5 h-3.5" />
                  Vol
                </h3>

                {data.airline && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm" style={{ color: MUTED }}>Compagnie:</span>
                    <span className="text-sm font-medium" style={{ color: INK }}>{data.airline}</span>
                  </div>
                )}
                {data.flightNumber && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm" style={{ color: MUTED }}>N° vol:</span>
                    <span className="text-sm font-semibold font-mono" style={{ color: INK }}>
                      {data.flightNumber}
                    </span>
                  </div>
                )}
                {data.destination && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                    <span className="text-sm font-medium" style={{ color: INK }}>{data.destination}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Hotel Info ─── */}
            {(data.hotelName || data.roomNumber) && (
              <motion.div variants={itemVariants} custom={5} className="px-6 py-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: MUTED }}>
                  <Building2 className="w-3.5 h-3.5" />
                  Hôtel
                </h3>
                {data.hotelName && (
                  <p className="text-sm font-semibold" style={{ color: INK }}>{data.hotelName}</p>
                )}
                {data.roomNumber && (
                  <p className="text-xs" style={{ color: MUTED }}>Chambre {data.roomNumber}</p>
                )}
              </motion.div>
            )}

            {/* ─── Active Incidents ─── */}
            {data.activeIncidents && data.activeIncidents.length > 0 && (
              <>
                <motion.div variants={itemVariants} custom={6}>
                  <Separator />
                </motion.div>
                <motion.div variants={itemVariants} custom={7} className="px-6 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: DANGER }}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Incidents actifs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.activeIncidents.map((incident: any, idx: number) => (
                      <Badge
                        key={incident.id || idx}
                        className="font-medium text-xs px-2.5 py-1 border-0"
                        style={{ background: '#fee2e2', color: DANGER }}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {incident.type || 'Incident'}{incident.description ? `: ${incident.description.slice(0, 40)}` : ''}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            <motion.div variants={itemVariants} custom={8}>
              <Separator />
            </motion.div>

            {/* ─── Action Buttons ─── */}
            <motion.div variants={itemVariants} custom={9} className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Contacter propriétaire */}
                <Button
                  onClick={() => {
                    toast.info('Fonctionnalité à venir', { description: 'Contact propriétaire bientôt disponible.' });
                  }}
                  className="font-semibold text-white rounded-xl h-12 text-sm"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Contacter propriétaire
                </Button>

                {/* Signaler perdu */}
                <Link href={`/finder/report?code=${encodeURIComponent(code)}&type=baggage`} className="w-full">
                  <Button
                    className="w-full font-semibold text-white rounded-xl h-12 text-sm"
                    style={{ background: DANGER }}
                  >
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    Signaler perdu
                  </Button>
                </Link>
              </div>

              {/* GPS Location Share */}
              <GPSButton
                label="Partager ma position"
                className="w-full rounded-xl h-12 text-sm"
              />
            </motion.div>

            {/* ─── QR Code badge ─── */}
            <motion.div variants={itemVariants} custom={10} className="px-6 pb-4 flex items-center justify-center">
              <span className="text-xs font-mono font-medium px-3 py-1.5 rounded-full" style={{ background: '#f1f5f9', color: MUTED }}>
                {data.qrCode}
              </span>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
