'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  AlertCircle,
  Shield,
  MapPin,
  Loader2,
  CheckCircle,
  User,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Hash,
  CalendarDays,
  Flag,
  Home,
  Plane,
  RotateCcw,
  Building2,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PhoneInput from '@/components/ui/PhoneInput';
import { toast } from '@/hooks/use-toast';

// ═══════════════════════════════════════════════════════════════
//  BRAND CONSTANTS — PassHajj palette
// ═══════════════════════════════════════════════════════════════

const GOLD = '#059669';
const INK = '#0f172a';
const MUTED = '#64748b';
const WHITE = '#ffffff';
const CARD_BG = '#ffffff';
const INPUT_BG = '#f8fafc';
const DANGER = '#dc2626';
const SUCCESS = '#059669';
const INFO = '#2563eb';

// ═══════════════════════════════════════════════════════════════
//  NATIONALITY → FLAG EMOJI MAPPING
// ═══════════════════════════════════════════════════════════════

const NATIONALITY_FLAGS: Record<string, string> = {
  'MA': '🇲🇦', 'DZ': '🇩🇿', 'TN': '🇹🇳', 'LY': '🇱🇾', 'MR': '🇲🇷',
  'SA': '🇸🇦', 'AE': '🇦🇪', 'KW': '🇰🇼', 'QA': '🇶🇦', 'BH': '🇧🇭', 'OM': '🇴🇲',
  'IQ': '🇮🇶', 'SY': '🇸🇾', 'JO': '🇯🇴', 'LB': '🇱🇧', 'PS': '🇵🇸', 'IR': '🇮🇷', 'TR': '🇹🇷',
  'SN': '🇸🇳', 'ML': '🇲🇱', 'GN': '🇬🇳', 'CM': '🇨🇲', 'NG': '🇳🇬', 'TD': '🇹🇩',
  'NE': '🇳🇪', 'BF': '🇧🇫', 'CI': '🇨🇮', 'BJ': '🇧🇯', 'TG': '🇹🇬', 'GA': '🇬🇦',
  'EG': '🇪🇬', 'SD': '🇸🇩', 'ET': '🇪🇹', 'KE': '🇰🇪', 'GH': '🇬🇭', 'ZA': '🇿🇦',
  'FR': '🇫🇷', 'GB': '🇬🇧', 'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱',
  'BE': '🇧🇪', 'PT': '🇵🇹', 'CH': '🇨🇭', 'US': '🇺🇸', 'CA': '🇨🇦', 'BR': '🇧🇷',
  'IN': '🇮🇳', 'PK': '🇵🇰', 'ID': '🇮🇩', 'MY': '🇲🇾', 'CN': '🇨🇳', 'JP': '🇯🇵',
  'AU': '🇦🇺', 'RU': '🇷🇺', 'UA': '🇺🇦', 'PL': '🇵🇱', 'SE': '🇸🇪', 'NO': '🇳🇴',
  // French names
  'Maroc': '🇲🇦', 'Algérie': '🇩🇿', 'Tunisie': '🇹🇳', 'France': '🇫🇷',
  'Arabie Saoudite': '🇸🇦', 'Égypte': '🇪🇬', 'Sénégal': '🇸🇳', 'Mali': '🇲🇱',
  'Guinée': '🇬🇳', 'Cameroun': '🇨🇲', 'Nigeria': '🇳🇬', 'Inde': '🇮🇳',
  'Pakistan': '🇵🇰', 'Indonésie': '🇮🇩', 'Turquie': '🇹🇷', 'Iran': '🇮🇷',
  'Émirats Arabes Unis': '🇦🇪', 'Koweït': '🇰🇼', 'Jordanie': '🇯🇴',
  'Liban': '🇱🇧', 'Soudan': '🇸🇩', 'Éthiopie': '🇪🇹', 'Ghana': '🇬🇭',
};

function getFlag(nationality: string | null | undefined): string {
  if (!nationality) return '🌍';
  return NATIONALITY_FLAGS[nationality] || NATIONALITY_FLAGS[nationality.toUpperCase()] || '🌍';
}

// ═══════════════════════════════════════════════════════════════
//  PASSPORT STATUS CONFIG
// ═══════════════════════════════════════════════════════════════

const PASSPORT_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Actif', color: SUCCESS, bgColor: '#d1fae5' },
  lost: { label: 'Perdu', color: DANGER, bgColor: '#fee2e2' },
  found: { label: 'Retrouvé', color: INFO, bgColor: '#dbeafe' },
  pending_activation: { label: 'Non activé', color: '#f59e0b', bgColor: '#fef3c7' },
  blocked: { label: 'Bloqué', color: MUTED, bgColor: '#f1f5f9' },
};

function getStatusConfig(status: string) {
  return PASSPORT_STATUS_MAP[status] || { label: status, color: MUTED, bgColor: '#f1f5f9' };
}

// ═══════════════════════════════════════════════════════════════
//  DATA TYPES
// ═══════════════════════════════════════════════════════════════

interface PassportData {
  id: string;
  qrCode: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  homeAddress?: string | null;
  travelDestination?: string | null;
  travelDate?: string | null;
  returnDate?: string | null;
  notes?: string | null;
  agency?: { id: string; name: string; phone: string } | null;
  isActive: boolean;
  passportStatus?: string;
}

interface ApiResponse {
  success: boolean;
  type: string;
  status: 'active' | 'lost' | 'found' | 'not_activated' | 'expired';
  message?: string;
  data: PassportData;
}

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

// ═══════════════════════════════════════════════════════════════
//  SKELETON LOADER
// ═══════════════════════════════════════════════════════════════

function PassportSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-5 space-y-4">
      <div className="flex flex-col items-center gap-3 pt-4">
        <Skeleton className="w-20 h-20 rounded-2xl" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3 px-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid grid-cols-1 gap-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  INFO ROW COMPONENT
// ═══════════════════════════════════════════════════════════════

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: MUTED }}>{label}</p>
        <p
          className={`text-sm font-semibold break-words ${mono ? 'font-mono' : ''}`}
          style={{ color: INK }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════

type PageState = 'loading' | 'loaded' | 'not_found' | 'not_activated' | 'expired' | 'network_error';

export default function PassportFinderPage() {
  const params = useParams<{ qrCode: string }>();
  const qrCode = params.qrCode;

  // ─── Fetch state ───
  const [pageState, setPageState] = useState<PageState>('loading');
  const [apiData, setApiData] = useState<ApiResponse | null>(null);

  // ─── Form state ───
  const [showForm, setShowForm] = useState(false);
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [finderPhoneCountry, setFinderPhoneCountry] = useState('FR');
  const [finderEmail, setFinderEmail] = useState('');
  const [locationText, setLocationText] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // ─── Fetch passport data ───
  useEffect(() => {
    if (!qrCode) return;

    let cancelled = false;

    fetch(`/api/finder/passeport/${qrCode}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw { code: 'not_found' };
          throw { code: 'server_error' };
        }
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (cancelled) return;
        if (data.status === 'not_activated') {
          setPageState('not_activated');
        } else if (data.status === 'expired') {
          setPageState('expired');
        } else {
          setPageState('loaded');
        }
        setApiData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.code === 'not_found') {
          setPageState('not_found');
        } else {
          setPageState('network_error');
        }
      });

    return () => { cancelled = true; };
  }, [qrCode]);

  // ─── Auto-detect GPS on mount ───
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      () => {
        // Silent — user can type location manually
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ─── GPS Button handler ───
  const handleGetGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Géolocalisation non disponible',
        variant: 'destructive',
      });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setIsLocating(false);
        toast({ title: 'Position obtenue ✓' });
      },
      () => {
        setIsLocating(false);
        toast({
          title: 'Impossible d\'obtenir la position',
          description: 'Vérifiez les autorisations de localisation.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // ─── Submit report ───
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!finderName.trim() || finderName.trim().length < 2) {
      toast({ title: 'Veuillez entrer votre nom', variant: 'destructive' });
      return;
    }
    if (!finderPhone.trim() || finderPhone.trim().length < 6) {
      toast({ title: 'Veuillez entrer un numéro de téléphone valide', variant: 'destructive' });
      return;
    }

    const passportId = apiData?.data?.id;
    if (!passportId) {
      toast({ title: 'Erreur : identifiant passeport introuvable', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/finder/passeport/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportId,
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          finderEmail: finderEmail.trim() || undefined,
          latitude: gpsCoords?.lat ?? undefined,
          longitude: gpsCoords?.lng ?? undefined,
          location: locationText.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erreur serveur');
      }

      const result = await res.json();

      setReportSubmitted(true);
      toast({
        title: 'Signalement envoyé ! ✓',
        description: 'Le propriétaire du passeport sera contacté.',
      });

      // If WhatsApp URL returned, open it
      if (result.whatsappUrl) {
        setTimeout(() => {
          window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur lors de l\'envoi',
        description: error.message || 'Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiData, finderName, finderPhone, finderEmail, gpsCoords, locationText, message]);

  // ─── Retry ───
  const handleRetry = useCallback(() => {
    if (!qrCode) return;
    setPageState('loading');
    setApiData(null);
    fetch(`/api/finder/passeport/${qrCode}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw { code: 'not_found' };
          throw { code: 'server_error' };
        }
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (data.status === 'not_activated') {
          setPageState('not_activated');
        } else if (data.status === 'expired') {
          setPageState('expired');
        } else {
          setPageState('loaded');
        }
        setApiData(data);
      })
      .catch((err) => {
        if (err?.code === 'not_found') {
          setPageState('not_found');
        } else {
          setPageState('network_error');
        }
      });
  }, [qrCode]);

  // ─── Derived values ───
  const passportData = apiData?.data;
  const isLost = apiData?.status === 'lost';
  const isFound = apiData?.status === 'found';
  const isActive = apiData?.status === 'active';

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex flex-col" style={{ background: GOLD }}>
      {/* ─── Brand Header ─── */}
      <header className="w-full flex items-center justify-between px-4 sm:px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="PassHajj"
            width={130}
            height={48}
            style={{
              objectFit: 'contain',
              borderRadius: '12px',
              padding: '4px',
              background: 'rgba(255,255,255,0.9)',
            }}
          />
          <Badge
            className="text-xs font-semibold px-2.5 py-1 border-0"
            style={{ background: INK, color: WHITE }}
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Passeport
          </Badge>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8 pt-2">
        <AnimatePresence mode="wait">
          {/* ═══ LOADING STATE ═══ */}
          {pageState === 'loading' && (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="rounded-[20px] shadow-lg border-0" style={{ background: WHITE }}>
                <PassportSkeleton />
              </div>
            </motion.div>
          )}

          {/* ═══ NOT FOUND STATE ═══ */}
          {pageState === 'not_found' && (
            <motion.div
              key="not_found"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="rounded-[20px] shadow-lg p-8 text-center" style={{ background: WHITE }}>
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
                  Passeport non trouvé
                </h2>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Ce code QR ne correspond à aucun passeport dans notre système.
                </p>
                <p className="text-xs mb-6" style={{ color: MUTED }}>
                  Les codes valides commencent par{' '}
                  <code
                    className="font-mono font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: '#f1f5f9' }}
                  >
                    PP-
                  </code>
                </p>
                <Button
                  onClick={handleRetry}
                  className="w-full font-bold text-white rounded-xl h-12"
                  style={{ background: INK }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ NOT ACTIVATED STATE ═══ */}
          {pageState === 'not_activated' && (
            <motion.div
              key="not_activated"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="rounded-[20px] shadow-lg p-8 text-center" style={{ background: WHITE }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: '#fef3c7' }}
                >
                  <Shield className="w-10 h-10" style={{ color: '#f59e0b' }} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                  Passeport non activé
                </h2>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Ce passeport n&apos;est pas encore activé.
                  L&apos;activation est nécessaire pour accéder aux informations du propriétaire.
                </p>
                <a href={`/activate/passeport?code=${encodeURIComponent(qrCode || '')}`}>
                  <Button
                    className="w-full font-bold text-white rounded-xl h-12 mb-3"
                    style={{ background: INFO }}
                  >
                    Activer ce passeport
                  </Button>
                </a>
              </div>
            </motion.div>
          )}

          {/* ═══ EXPIRED STATE ═══ */}
          {pageState === 'expired' && (
            <motion.div
              key="expired"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="rounded-[20px] shadow-lg p-8 text-center" style={{ background: WHITE }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: '#fef3c7' }}
                >
                  <AlertCircle className="w-10 h-10" style={{ color: '#f59e0b' }} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                  Passeport expiré
                </h2>
                <p className="text-sm mb-2" style={{ color: MUTED }}>
                  Ce passeport a expiré et n&apos;est plus valide.
                </p>
                {passportData?.fullName && (
                  <p className="text-sm font-semibold mb-4" style={{ color: INK }}>
                    Propriétaire : {passportData.fullName}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ NETWORK ERROR STATE ═══ */}
          {pageState === 'network_error' && (
            <motion.div
              key="network_error"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="rounded-[20px] shadow-lg p-8 text-center" style={{ background: WHITE }}>
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
                  Erreur de connexion
                </h2>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Impossible de charger les informations du passeport.
                  Vérifiez votre connexion internet et réessayez.
                </p>
                <Button
                  onClick={handleRetry}
                  className="w-full font-bold text-white rounded-xl h-12"
                  style={{ background: INK }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ LOADED STATE ═══ */}
          {pageState === 'loaded' && passportData && (
            <motion.div
              key="loaded"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md flex flex-col gap-4"
            >
              {/* ─── Header Section ─── */}
              <div className="text-center mb-1">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-md"
                  style={{ background: GOLD }}
                >
                  <Globe className="w-9 h-9 text-white" />
                </div>
                <h1
                  className="text-2xl md:text-3xl font-extrabold leading-tight"
                  style={{ color: INK }}
                >
                  {isLost ? '🚨 PASSEPORT PERDU' : isFound ? '✅ PASSEPORT RETROUVÉ' : '📘 PASSEPORT TROUVÉ'}
                </h1>
                <p
                  className="mt-2 text-sm md:text-base leading-relaxed max-w-md mx-auto font-semibold"
                  style={{ color: WHITE }}
                >
                  {isLost
                    ? 'Ce passeport a été signalé perdu. Merci de le retourner à son propriétaire.'
                    : isFound
                      ? 'Ce passeport a été signalé comme retrouvé. Le propriétaire a été notifié.'
                      : 'Merci d\'avoir trouvé ce passeport ! Le propriétaire sera contacté immédiatement.'}
                </p>

                {/* Status Badge */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  {isLost && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      🚨 PERDU
                    </span>
                  )}
                  {isFound && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      ✅ RETROUVÉ
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                      ● ACTIF
                    </span>
                  )}
                </div>
              </div>

              {/* ═══ CARD 1: PASSPORT INFO ═══ */}
              <div
                className="w-full rounded-[20px] p-5 sm:p-6 shadow-lg"
                style={{ background: CARD_BG }}
              >
                <h2
                  className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"
                  style={{ color: INK }}
                >
                  <User className="w-4 h-4" />
                  PROPRIÉTAIRE
                </h2>

                {/* Photo + Name header */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
                    style={{ background: '#f1f5f9' }}
                  >
                    {passportData.photoUrl ? (
                      <img
                        src={passportData.photoUrl}
                        alt={passportData.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8" style={{ color: MUTED }} />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: INK }}>
                      {passportData.fullName || 'Non renseigné'}
                    </p>
                    {passportData.nationality && (
                      <p className="text-sm" style={{ color: MUTED }}>
                        {getFlag(passportData.nationality)} {passportData.nationality}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 my-2" />

                {/* Masked Passport Number */}
                <InfoRow
                  icon={<Hash className="w-4 h-4" style={{ color: GOLD }} />}
                  label="N° passeport"
                  value={passportData.passportNumber || 'Non renseigné'}
                  mono
                />

                <div className="border-t border-gray-100 my-2" />

                {/* Status Badge */}
                <div className="flex items-start gap-3 py-1.5">
                  <span className="flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" style={{ color: GOLD }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: MUTED }}>Statut</p>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5"
                      style={{
                        color: getStatusConfig(passportData.passportStatus || apiData?.status || 'active').color,
                        background: getStatusConfig(passportData.passportStatus || apiData?.status || 'active').bgColor,
                      }}
                    >
                      {getStatusConfig(passportData.passportStatus || apiData?.status || 'active').label}
                    </span>
                  </div>
                </div>

                {/* Gender */}
                {passportData.gender && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<span className="text-sm">{passportData.gender === 'M' ? '👨' : '👩'}</span>}
                      label="Sexe"
                      value={passportData.gender === 'M' ? 'Masculin' : 'Féminin'}
                    />
                  </>
                )}

                {/* Date of Birth */}
                {passportData.dateOfBirth && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<CalendarDays className="w-4 h-4" style={{ color: GOLD }} />}
                      label="Date de naissance"
                      value={passportData.dateOfBirth}
                    />
                  </>
                )}

                {/* Travel Destination */}
                {passportData.travelDestination && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<Plane className="w-4 h-4" style={{ color: GOLD }} />}
                      label="Destination"
                      value={passportData.travelDestination}
                    />
                  </>
                )}

                {/* Home Address */}
                {passportData.homeAddress && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<Home className="w-4 h-4" style={{ color: GOLD }} />}
                      label="Adresse"
                      value={passportData.homeAddress}
                    />
                  </>
                )}

                {/* Hotel Address */}
                {passportData.homeAddress && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<Building2 className="w-4 h-4" style={{ color: GOLD }} />}
                      label="Hôtel"
                      value={passportData.travelDestination ? `${passportData.travelDestination} — ${passportData.homeAddress}` : passportData.homeAddress}
                    />
                    {/* Déposer à l'hôtel button */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(passportData.homeAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{ background: '#7c3aed' }}
                    >
                      <MapPin className="w-4 h-4" />
                      Déposer à l&apos;hôtel
                    </a>
                  </>
                )}

                {/* Hotel Phone */}
                {passportData.emergencyPhone && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<Phone className="w-4 h-4" style={{ color: GOLD }} />}
                      label="Téléphone hôtel"
                      value={passportData.emergencyPhone}
                    />
                  </>
                )}

                {/* Agency */}
                {passportData.agency && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <InfoRow
                      icon={<span className="text-sm">🏢</span>}
                      label="Agence"
                      value={passportData.agency.name}
                    />
                  </>
                )}

                {/* Secure Contact Note */}
                <div className="border-t border-gray-100 my-2" />
                <div className="flex items-start gap-3 py-1.5">
                  <span className="text-lg flex-shrink-0 mt-0.5">🔒</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: MUTED }}>Contact</p>
                    <p className="text-sm font-semibold" style={{ color: INK }}>Contact sécurisé</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: MUTED }}>
                      Le propriétaire sera notifié via WhatsApp. Son numéro reste confidentiel.
                    </p>
                  </div>
                </div>
              </div>

              {/* ═══ ACTION BUTTONS: Appeler l'hôtel & Contacter le propriétaire ═══ */}
              {(isActive || isLost) && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6 shadow-lg"
                  style={{ background: CARD_BG }}
                >
                  <h2
                    className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"
                    style={{ color: INK }}
                  >
                    <Phone className="w-4 h-4" />
                    CONTACT RAPIDE
                  </h2>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Contacter le propriétaire via WhatsApp */}
                    <a
                      href={passportData.whatsapp
                        ? `https://wa.me/${passportData.whatsapp.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent("Bonjour, j'ai trouvé votre passeport. Pouvez-vous me contacter pour sa restitution ?")}`
                        : passportData.phone
                          ? `tel:${passportData.phone.replace(/[^0-9+]/g, '')}`
                          : '#'
                      }
                      target={passportData.whatsapp ? '_blank' : undefined}
                      rel={passportData.whatsapp ? 'noopener noreferrer' : undefined}
                      className="w-full py-4 px-6 rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 min-h-[56px] text-white"
                      style={{ background: '#25D366' }}
                    >
                      <MessageCircle className="w-6 h-6" />
                      Contacter le propriétaire
                    </a>

                    {/* Appeler l'hôtel */}
                    {passportData.homeAddress && (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(passportData.homeAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-6 rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 min-h-[56px] text-white"
                        style={{ background: INK }}
                      >
                        <Building2 className="w-6 h-6" />
                        Appeler l&apos;hôtel
                      </a>
                    )}
                  </div>

                  <p className="text-xs mt-3 text-center" style={{ color: MUTED }}>
                    🔒 Le numéro du propriétaire reste confidentiel. La mise en relation se fait via WhatsApp.
                  </p>
                </div>
              )}

              {/* ═══ CARD 2: ACTIVE PASSPORT MESSAGE ═══ */}
              {isActive && !isLost && !isFound && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6 shadow-lg text-center"
                  style={{ background: '#d1fae5' }}
                >
                  <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: SUCCESS }} />
                  <h3 className="text-lg font-bold mb-2" style={{ color: SUCCESS }}>
                    Ce passeport est actif
                  </h3>
                  <p className="text-sm" style={{ color: '#065f46' }}>
                    Ce passeport n&apos;a pas été signalé perdu.
                    Si vous l&apos;avez trouvé, vous pouvez le signaler ci-dessous.
                  </p>
                </div>
              )}

              {/* ═══ CARD 3: FINDER FORM (LOST or ACTIVE with report option) ═══ */}
              {(isLost || isActive) && !reportSubmitted && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6 shadow-lg"
                  style={{ background: CARD_BG }}
                >
                  {/* CTA Button or Form */}
                  {!showForm ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg md:text-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[56px]"
                      style={{ background: INK }}
                    >
                      <Phone className="w-5 h-5" />
                      <span>
                        {isLost ? 'Signaler que j\'ai trouvé ce passeport' : 'Signaler ce passeport trouvé'}
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <h3
                        className="text-sm font-bold uppercase tracking-widest mb-1"
                        style={{ color: INK }}
                      >
                        📝 Vos informations
                      </h3>

                      {/* Finder Name */}
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>
                          Votre nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Votre nom complet"
                          value={finderName}
                          onChange={(e) => setFinderName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                          style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                          required
                        />
                      </div>

                      {/* Finder Phone */}
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                          countryCode={finderPhoneCountry}
                          onCountryChange={setFinderPhoneCountry}
                          value={finderPhone}
                          onChange={setFinderPhone}
                          placeholder="6 12 34 56 78"
                          required
                        />
                      </div>

                      {/* Finder Email (optional) */}
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>
                          Email <span className="text-gray-400">(optionnel)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="votre@email.com"
                          value={finderEmail}
                          onChange={(e) => setFinderEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                          style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                        />
                      </div>

                      {/* Location (auto-detected via GPS) */}
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Localisation
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Lieu où le passeport a été trouvé"
                            value={locationText}
                            onChange={(e) => setLocationText(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                            style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                          />
                          <button
                            type="button"
                            onClick={handleGetGps}
                            disabled={isLocating}
                            className="flex-shrink-0 px-3 py-3 rounded-xl text-white font-semibold transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
                            style={{ background: INK }}
                            title="Détecter ma position GPS"
                          >
                            {isLocating ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : gpsCoords ? (
                              <MapPin className="w-5 h-5 text-[#f4b400]" />
                            ) : (
                              <MapPin className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {gpsCoords && (
                          <p className="text-xs mt-1" style={{ color: SUCCESS }}>
                            ✓ Position détectée ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
                          </p>
                        )}
                      </div>

                      {/* Message textarea */}
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: MUTED }}>
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          Message <span className="text-gray-400">(optionnel)</span>
                        </label>
                        <textarea
                          placeholder="Informations supplémentaires (lieu exact, état du passeport...)"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all resize-none"
                          style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[56px]"
                        style={{ background: INK }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Envoyer le signalement
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ REPORT SUBMITTED SUCCESS ═══ */}
              {reportSubmitted && (
                <div
                  className="w-full rounded-[20px] p-6 sm:p-8 shadow-lg text-center"
                  style={{ background: '#d1fae5' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  >
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: SUCCESS }} />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: SUCCESS }}>
                    Signalement envoyé ! ✓
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#065f46' }}>
                    Merci pour votre aide. Le propriétaire du passeport a été notifié
                    et sera contacté avec les informations que vous avez fournies.
                  </p>
                  <p className="text-xs" style={{ color: '#065f46' }}>
                    Si WhatsApp s&apos;est ouvert, vous pouvez envoyer un message directement
                    au propriétaire pour coordonner la restitution.
                  </p>
                </div>
              )}

              {/* ═══ CARD: FOUND PASSPORT INFO ═══ */}
              {isFound && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6 shadow-lg text-center"
                  style={{ background: '#dbeafe' }}
                >
                  <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: INFO }} />
                  <h3 className="text-lg font-bold mb-2" style={{ color: INFO }}>
                    Ce passeport a été retrouvé
                  </h3>
                  <p className="text-sm" style={{ color: '#1e3a8a' }}>
                    Le propriétaire a déjà été notifié que son passeport a été retrouvé.
                    Merci pour votre aide !
                  </p>
                </div>
              )}

              {/* ═══ FOOTER ═══ */}
              <div className="text-center mt-2">
                <p className="text-xs font-medium" style={{ color: INK }}>
                  PassHajj — Service officiel de protection des passeports
                </p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  Code QR : {qrCode}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
