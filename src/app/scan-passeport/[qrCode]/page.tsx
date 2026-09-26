'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
  BookOpen,
  AlertCircle,
  Shield,
  ShieldCheck,
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
  Lock,
  Languages,
  Volume2,
  Pause,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PhoneInput from '@/components/ui/PhoneInput';
import { toast } from '@/hooks/use-toast';

// ═══════════════════════════════════════════════════════════════
//  BRAND CONSTANTS — PassHajj palette
// ═══════════════════════════════════════════════════════════════

const GOLD_ACTUAL = '#D4AF37';
const NAVY = '#1e3a8a';
const NAVY_DEEP = '#0b1530';
const GOLD_SOFT = '#f7e08a';
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
//  MRZ DÉCORATIF (style ligne de lecture machine d'un passeport)
// ═══════════════════════════════════════════════════════════════

function buildMrzLines(fullName: string | null | undefined, qrCode: string): [string, string] {
  const name = (fullName || 'PASSPORT HOLDER').toUpperCase().replace(/[^A-Z ]/g, '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const surname = (parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'HOLDER').slice(0, 12);
  const given = (parts.length > 1 ? parts.slice(0, -1).join('<') : '').slice(0, 14);
  const line1 = `P<TCD${surname}<<${given}`.replace(/[^A-Z<]/g, '').padEnd(38, '<');
  const code = (qrCode || 'PP-XXXXXXXX').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  const line2 = `${code}TCD<${'<'.repeat(27)}`.slice(0, 38).padEnd(38, '<');
  return [line1, line2];
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
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  expirationDate?: string | null;
}

interface ApiResponse {
  success: boolean;
  type: string;
  status: 'active' | 'lost' | 'found' | 'not_activated' | 'expired';
  message?: string;
  data: PassportData;
}

// ═══════════════════════════════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════════════════════════════

type Lang = 'fr' | 'ar' | 'wo';

const translations: Record<string, Record<Lang, string>> = {
  passeportTrouve: {
    fr: 'PASSEPORT TROUVÉ',
    ar: 'جواز سفر تم العثور عليه',
    wo: 'Pasipoo bi ñaan',
  },
  passeportPerdu: {
    fr: 'PASSEPORT PERDU',
    ar: 'جواز سفر مفقود',
    wo: 'Pasipoo bi gën na',
  },
  passeportRetrouve: {
    fr: 'PASSEPORT RETROUVÉ',
    ar: 'جواز سفر مسترد',
    wo: 'Pasipoo bi nangoo',
  },
  contacterProprietaire: {
    fr: 'Envoyer un message (WhatsApp)',
    ar: 'اتصل بصاحب الجواز',
    wo: 'Jëndal boroom bi',
  },
  deposerHotel: {
    fr: "Déposer à l'hôtel",
    ar: 'اذهب الى الفندق',
    wo: 'Jëli otel bi',
  },
  appelerHotel: {
    fr: "Appeler l'hôtel",
    ar: 'اتصل بالفندق',
    wo: 'Wël otel bi',
  },
  signalerPasseport: {
    fr: 'Signaler ce passeport trouvé',
    ar: 'ابلغ عن الجواز',
    wo: 'Xamal sa pasipoo bi',
  },
  proprietaire: {
    fr: 'PROPRIÉTAIRE',
    ar: 'صاحب الجواز',
    wo: 'BOROOM BI',
  },
  numeroPasseport: {
    fr: 'N° passeport',
    ar: 'رقم الجواز',
    wo: 'Nomba pasipoo',
  },
  nationalite: {
    fr: 'Nationalité',
    ar: 'الجنسية',
    wo: 'Réew',
  },
  statut: {
    fr: 'Statut',
    ar: 'الحالة',
    wo: 'Stat bi',
  },
  certifieMinistere: {
    fr: 'Certifié par le Ministère du Hajj du Sénégal',
    ar: 'معتمد من وزارة الحج السنغالية',
    wo: 'Jaaru ngir Ministeer u Hajj u Senegaal',
  },
  serviceAgree: {
    fr: "Service agréé par l'Autorité saoudienne du Hajj",
    ar: 'خدمة معتمدة من السلطات السعودية للحج',
    wo: 'Servis bëgg nañu ko ndigél u Aotorité saoudienne u Hajj',
  },
  donneesCryptees: {
    fr: 'Données cryptées – conformité RGPD',
    ar: 'بيانات مشفرة – توافق RGPD',
    wo: 'Données yif – bépp RGPD',
  },
  valideJusquau: {
    fr: 'Valide jusqu\'au',
    ar: 'صالح حتى',
    wo: 'Baax ba',
  },
  securityQuestion: {
    fr: 'Quel est le nom de l\'hôtel de destination ?',
    ar: 'ما اسم فندق الوجهة؟',
    wo: 'Nan lan mo otel u destinasioŋ bi?',
  },
  securityHint: {
    fr: 'Pour votre sécurité, veuillez répondre à cette question',
    ar: 'لأمانك، يرجى الإجابة على هذا السؤال',
    wo: 'Ngir sa kaaraange, jañ nga tuumaali laaj bii',
  },
  securityError: {
    fr: 'Réponse incorrecte. Veuillez réessayer.',
    ar: 'إجابة خاطئة. يرجى المحاولة مرة أخرى.',
    wo: 'Tontu bi laaka. Jëm fii.',
  },
  subActive: {
    fr: "Merci d'avoir trouvé ce passeport ! Suivez les étapes ci-dessous pour le rendre à son propriétaire.",
    ar: 'شكرا لإيجاد هذا الجواز! اتبع الخطوات أدناه لإعادته إلى صاحبه.',
    wo: 'Jërëjëf ngir fekke pasipoo bi! Toppatikoo yoon yi ngir ko yokk boroom bi.',
  },
  subLost: {
    fr: 'Ce passeport a été signalé perdu. Merci de contacter son propriétaire pour le lui rendre.',
    ar: 'تم الإبلاغ عن فقدان هذا الجواز. يُرجى الاتصال بصاحبه لإعادته إليه.',
    wo: 'Pasipoo bi ñaan nañu ko ne mothiou. Jëndal boroom bi ngir ko yokk.',
  },
  subFound: {
    fr: 'Ce passeport a été retrouvé et son propriétaire a été notifié.',
    ar: 'تم العثور على هذا الجواز وتم إبلاغ صاحبه.',
    wo: 'Pasipoo bi nangu na ñu ko fekke te boroom bi nañu ko wax.',
  },
  stepsTitle: {
    fr: '3 étapes simples pour rendre ce passeport',
    ar: '3 خطوات بسيطة لإعادة الجواز',
    wo: 'Ñetti yoon yu woyof ngir yokk pasipoo bi',
  },
  step1Title: {
    fr: 'Contactez le propriétaire',
    ar: 'اتصل بصاحب الجواز',
    wo: 'Jëndal boroom bi',
  },
  step1Desc: {
    fr: 'Envoyez un message WhatsApp — son numéro reste confidentiel.',
    ar: 'أرسل رسالة واتساب — رقمه يبقى سريا.',
    wo: 'Yónnee bataaxal WhatsApp — nombor bi bañ koy sott.',
  },
  step2Title: {
    fr: "Déposez le passeport à son hôtel",
    ar: 'اذهب الى الفندق',
    wo: 'Jëli otel bi',
  },
  step2Desc: {
    fr: "Remettez-le à la réception de l'hôtel où il séjourne.",
    ar: 'سلّمه في استقبال الفندق الذي يقيم فيه.',
    wo: 'Joxal ko ci résepsyoŋ otel bi mu dëkk.',
  },
  step3Title: {
    fr: 'Signalez la trouvaille',
    ar: 'أبلغ عن العثور',
    wo: 'Xamal ne fekk nga ko',
  },
  step3Desc: {
    fr: 'Remplissez le formulaire — le propriétaire est notifié immédiatement.',
    ar: 'املأ الاستمارة — يُبلَّغ صاحب الجواز فورا.',
    wo: 'Fàtti form bi — boroom bi nañu ko xam lolo gaaw.',
  },
  quickContact: {
    fr: 'CONTACT RAPIDE',
    ar: 'اتصال سريع',
    wo: 'JOKKOO GAAS',
  },
  securityTitle: {
    fr: 'Vérification de sécurité',
    ar: 'تحقق أمني',
    wo: 'Séqarité',
  },
  verifier: {
    fr: 'Vérifier',
    ar: 'تحقق',
    wo: 'Sét',
  },
};

function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] || translations[key]?.fr || key;
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
    <div className="flex items-start gap-3 py-2">
      <span
        className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
        style={{ background: '#f4f6fb', border: '1px solid #edf0f6' }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{label}</p>
        <p
          className={`text-sm font-bold break-words ${mono ? 'font-mono' : ''}`}
          style={{ color: INK }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LANGUAGE SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════

function LanguageSelector({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const langs: { code: Lang; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
    { code: 'wo', label: 'WO' },
  ];

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg overflow-hidden border border-white/30"
      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 text-xs font-bold transition-all ${
            lang === l.code
              ? 'bg-white text-[#1e3a8a]'
              : 'bg-transparent text-white/85 hover:bg-white/20'
          }`}
        >
          {l.label}
        </button>
      ))}
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

  // ─── Language state ───
  const [lang, setLang] = useState<Lang>('fr');

  // ─── Fetch state ───
  const [pageState, setPageState] = useState<PageState>('loading');
  const [apiData, setApiData] = useState<ApiResponse | null>(null);

  // ─── Form state ───
  const [showForm, setShowForm] = useState(false);
  const [securityStep, setSecurityStep] = useState<'idle' | 'question' | 'form'>('idle');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityError, setSecurityError] = useState(false);
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

  // ─── QR code backup state ───
  const [backupQrUrl, setBackupQrUrl] = useState<string | null>(null);

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

  // ─── Generate backup QR code ───
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, { width: 120, margin: 1, color: { dark: INK, light: '#ffffff00' } })
        .then((url) => setBackupQrUrl(url))
        .catch(() => {});
    } catch {
      // QR generation not critical
    }
  }, []);

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

  // ─── AUDIO-GUIDE: voix trouveur adaptée au contexte (passeport trouvé) ───
  const VOICE_GATE: Record<Lang, { title: string; desc: string; btn: string; badge: string; replay: string }> = {
    fr: {
      title: 'Vous avez trouvé un passeport !',
      desc: 'Ce passeport est protégé par l\'Organe de la Gestion du Pèlerinage. Écoutez les instructions.',
      btn: 'Écouter les instructions',
      badge: 'GUIDE VOCAL',
      replay: 'Réécouter le guide vocal',
    },
    ar: {
      title: 'لقد عثرت على جواز سفر!',
      desc: 'جواز السفر هذا محمي من قبل هيئة إدارة الحج. استمع إلى التعليمات.',
      btn: 'استمع إلى التعليمات',
      badge: 'الدليل الصوتي',
      replay: 'إعادة الدليل الصوتي',
    },
    wo: {
      title: 'Nanga feeke pasipoo bi!',
      desc: 'Pasipoo bi tarmaalu na ci Organe de la Gestion du Pèlerinage. Déglu ndigël yi ngir dimaali boroom bi.',
      btn: 'Déglul ndigël yi',
      badge: 'GUIDE VOCAL',
      replay: 'Wóolal ndigël yi',
    },
  };
  const FINDER_VOICE: Record<Lang, string> = {
    fr: '/audio/passeport-finder-fr.mp3',
    ar: '/audio/passeport-finder-ar.mp3',
    wo: '/audio/passeport-finder-wo.mp3',
  };
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showVoiceGate, setShowVoiceGate] = useState(true);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState<number | null>(null);

  // Create the audio element once on mount (preload metadata only — .play() stays user-gated)
  useEffect(() => {
    const audio = new Audio(FINDER_VOICE.fr);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => setVoiceDuration(Math.round(audio.duration) || null));
    audio.addEventListener('ended', () => setVoicePlaying(false));
    voiceAudioRef.current = audio;
    return () => {
      audio.pause();
      voiceAudioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Language switch → swap audio source, stop playback
  useEffect(() => {
    const audio = voiceAudioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      setVoicePlaying(false);
    }
    if (audio) {
      audio.src = FINDER_VOICE[lang];
      audio.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const playFinderVoice = useCallback(() => {
    try {
      const audio = voiceAudioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().then(() => setVoicePlaying(true)).catch(() => setVoicePlaying(false));
    } catch { /* silent fail */ }
  }, []);

  const toggleFinderVoice = useCallback(() => {
    const audio = voiceAudioRef.current;
    if (!audio) return;
    if (voicePlaying) {
      audio.pause();
      setVoicePlaying(false);
    } else {
      audio.play().then(() => setVoicePlaying(true)).catch(() => setVoicePlaying(false));
    }
  }, [voicePlaying]);

  const handleVoiceGateTap = useCallback(() => {
    playFinderVoice();
    setShowVoiceGate(false);
  }, [playFinderVoice]);

  // ─── Security question handler ───
  const handleSecurityCheck = useCallback(() => {
    const passportData = apiData?.data;
    if (!passportData?.hotelName) {
      // No hotel name — skip security question
      setSecurityStep('form');
      return;
    }

    const answer = securityAnswer.trim().toLowerCase();
    const hotelName = passportData.hotelName.trim().toLowerCase();

    // Partial, case-insensitive match
    if (answer.length > 0 && (hotelName.includes(answer) || answer.includes(hotelName))) {
      setSecurityError(false);
      setSecurityStep('form');
    } else {
      setSecurityError(true);
    }
  }, [apiData, securityAnswer]);

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

  // ─── Hotel display helpers ───
  const hotelName = passportData?.hotelName || null;
  const hotelAddress = passportData?.hotelAddress || null;
  const hotelPhone = passportData?.hotelPhone || null;
  const hasHotel = !!(hotelName || hotelAddress);
  const hotelMapsQuery = hotelName
    ? `${hotelName}${hotelAddress ? ' ' + hotelAddress : ''}`
    : hotelAddress || passportData?.homeAddress || '';

  // ─── Format expiration date ───
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return null;
    }
  };

  const expirationFormatted = formatDate(passportData?.expirationDate);

  // Lignes MRZ décoratives (style livret passeport)
  const [mrzLine1, mrzLine2] = buildMrzLines(passportData?.fullName, qrCode || '');

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  const isRtl = lang === 'ar';

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg, #0b1530 0%, #152457 45%, #1e3a8a 100%)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Animations locales */}
      <style>{`
        @keyframes spFadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spPulseRing { 0% { transform: scale(0.85); opacity: 0.9; } 75% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes spFloaty { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
      `}</style>

      {/* Halos décoratifs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.20) 0%, transparent 65%)' }} />
        <div className="absolute top-[30%] -left-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 65%)' }} />
        <div className="absolute bottom-24 -right-16 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 65%)' }} />
      </div>
      {/* ─── Bismillah ─── */}
      <div className="w-full text-center pt-3 pb-0">
        <p
          className="text-sm font-light tracking-wide"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          بسم الله الرحمن الرحيم
        </p>
      </div>

      {/* ─── Brand Header ─── */}
      <header className="w-full flex items-center justify-between px-4 sm:px-5 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <BrandLogo width={130} />
          <Badge
            className="text-xs font-bold px-2.5 py-1 border-0"
            style={{ background: GOLD_ACTUAL, color: NAVY_DEEP }}
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Passeport
          </Badge>
        </div>
        {/* Language selector */}
        <LanguageSelector lang={lang} setLang={setLang} />
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
              {/* ─── HERO ─── */}
              <div className="text-center mb-2" style={{ animation: 'spFadeInUp 0.5s ease both' }}>
                {/* Emblème avec anneaux pulsés */}
                <div className="relative inline-flex items-center justify-center mb-4">
                  <span
                    className="absolute w-24 h-24 rounded-full"
                    style={{ border: '2px solid rgba(212,175,55,0.55)', animation: 'spPulseRing 2.6s ease-out infinite' }}
                  />
                  <span
                    className="absolute w-24 h-24 rounded-full"
                    style={{ border: '2px solid rgba(212,175,55,0.30)', animation: 'spPulseRing 2.6s ease-out infinite 1.3s' }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-[22px] flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #f7e08a 0%, #D4AF37 50%, #a97f16 100%)',
                      boxShadow: '0 12px 32px rgba(212,175,55,0.38)',
                      animation: 'spFloaty 4s ease-in-out infinite',
                    }}
                  >
                    <BookOpen className="w-10 h-10" style={{ color: NAVY_DEEP }} />
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-white">
                  {isLost
                    ? `🚨 ${t('passeportPerdu', lang)}`
                    : isFound
                      ? `✅ ${t('passeportRetrouve', lang)}`
                      : `📘 ${t('passeportTrouve', lang)}`
                  }
                </h1>
                <p
                  className="mt-2.5 text-sm md:text-base leading-relaxed max-w-md mx-auto font-medium"
                  style={{ color: 'rgba(255,255,255,0.88)' }}
                >
                  {isLost
                    ? t('subLost', lang)
                    : isFound
                      ? t('subFound', lang)
                      : t('subActive', lang)}
                </p>

                {/* Chips : validité + statut */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  {expirationFormatted && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/25"
                      style={{ background: 'rgba(255,255,255,0.10)', color: WHITE }}
                    >
                      <CalendarDays className="w-3.5 h-3.5" style={{ color: GOLD_SOFT }} />
                      {t('valideJusquau', lang)} {expirationFormatted}
                    </span>
                  )}
                  {isLost && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full" style={{ boxShadow: '0 4px 16px rgba(239,68,68,0.45)' }}>
                      🚨 PERDU
                    </span>
                  )}
                  {isFound && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full" style={{ boxShadow: '0 4px 16px rgba(59,130,246,0.45)' }}>
                      ✅ RETROUVÉ
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full" style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.45)' }}>
                      ● ACTIF
                    </span>
                  )}
                </div>

                {/* Certification */}
                <div className="mt-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/20"
                    style={{ background: 'rgba(255,255,255,0.08)', color: GOLD_SOFT }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t('certifieMinistere', lang)}
                  </span>
                </div>
              </div>

              {/* ─── STEPPER : 3 étapes pour rendre le passeport ─── */}
              {!isFound && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    animation: 'spFadeInUp 0.5s ease 0.08s both',
                  }}
                >
                  <h2 className="text-xs uppercase tracking-[0.2em] font-bold mb-5 flex items-center justify-center gap-2" style={{ color: GOLD_SOFT }}>
                    <Sparkles className="w-4 h-4" />
                    {t('stepsTitle', lang)}
                  </h2>

                  <div className="relative">
                    {/* Ligne verticale pointillée */}
                    <div
                      className="absolute start-[17px] top-5 bottom-5 border-s-2 border-dashed"
                      style={{ borderColor: 'rgba(255,255,255,0.25)' }}
                      aria-hidden="true"
                    />
                    <div className="space-y-5 relative">
                      {[
                        { title: t('step1Title', lang), desc: t('step1Desc', lang) },
                        { title: t('step2Title', lang), desc: t('step2Desc', lang) },
                        { title: t('step3Title', lang), desc: t('step3Desc', lang) },
                      ].map((s, i) => (
                        <div key={i} className="flex items-start gap-3.5 relative">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold text-sm"
                            style={{
                              background: 'linear-gradient(135deg, #f7e08a, #D4AF37)',
                              color: NAVY_DEEP,
                              boxShadow: '0 4px 14px rgba(212,175,55,0.4)',
                            }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-bold text-white">{s.title}</p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ CARD 1: PASSEPORT — style livret ═══ */}
              <div
                className="w-full rounded-[22px] overflow-hidden shadow-2xl"
                style={{ background: CARD_BG, animation: 'spFadeInUp 0.5s ease 0.12s both' }}
              >
                {/* Bande couverture */}
                <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #14265c 0%, #1e3a8a 100%)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f7e08a, #D4AF37)' }}>
                      <BookOpen className="w-5 h-5" style={{ color: NAVY_DEEP }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.28em] text-white">PASSEPORT</p>
                      <p className="text-[10px] font-bold tracking-[0.14em] font-mono" style={{ color: GOLD_SOFT }}>{qrCode}</p>
                    </div>
                  </div>
                  <Globe className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.55)' }} />
                </div>

                <div className="p-5 sm:p-6">
                <h2
                  className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"
                  style={{ color: INK }}
                >
                  <User className="w-4 h-4" />
                  {t('proprietaire', lang)}
                </h2>

                {/* Photo + Name header */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: '#f1f5f9', border: '2.5px solid #D4AF37', boxShadow: '0 6px 18px rgba(212,175,55,0.25)' }}
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
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold" style={{ color: INK }}>
                      {passportData.fullName || 'Non renseigné'}
                    </p>
                    {passportData.nationality && (
                      <p className="text-sm font-medium mt-0.5" style={{ color: MUTED }}>
                        {getFlag(passportData.nationality)} {passportData.nationality}
                      </p>
                    )}
                  </div>
                </div>


                {/* Masked Passport Number */}
                <InfoRow
                  icon={<Hash className="w-4 h-4" style={{ color: NAVY }} />}
                  label={t('numeroPasseport', lang)}
                  value={passportData.passportNumber || 'Non renseigné'}
                  mono
                />


                {/* Status Badge */}
                <div className="flex items-start gap-3 py-2">
                  <span
                    className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f4f6fb', border: '1px solid #edf0f6' }}
                  >
                    <Shield className="w-4 h-4" style={{ color: NAVY }} />
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{t('statut', lang)}</p>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1"
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
                        <InfoRow
                      icon={<CalendarDays className="w-4 h-4" style={{ color: NAVY }} />}
                      label="Date de naissance"
                      value={formatDate(passportData.dateOfBirth) || passportData.dateOfBirth}
                    />
                  </>
                )}

                {/* Expiration Date */}
                {expirationFormatted && (
                  <>
                        <InfoRow
                      icon={<CalendarDays className="w-4 h-4" style={{ color: GOLD_ACTUAL }} />}
                      label={t('valideJusquau', lang)}
                      value={expirationFormatted}
                    />
                  </>
                )}

                {/* Travel Destination */}
                {passportData.travelDestination && (
                  <>
                        <InfoRow
                      icon={<Plane className="w-4 h-4" style={{ color: NAVY }} />}
                      label="Destination"
                      value={passportData.travelDestination}
                    />
                  </>
                )}

                {/* Home Address */}
                {passportData.homeAddress && (
                  <>
                        <InfoRow
                      icon={<Home className="w-4 h-4" style={{ color: NAVY }} />}
                      label="Adresse"
                      value={passportData.homeAddress}
                    />
                  </>
                )}

                {/* Hotel Section — using dedicated hotel fields */}
                {hasHotel && (
                  <div className="mt-3 rounded-[14px] p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: '#eef2ff' }}>
                        <Building2 className="w-4 h-4" style={{ color: NAVY }} />
                      </span>
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Hôtel</p>
                    </div>
                    {hotelName && (
                      <p className="text-sm font-bold" style={{ color: INK }}>{hotelName}</p>
                    )}
                    {hotelAddress && (
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>{hotelAddress}</p>
                    )}
                    {hotelPhone && (
                      <a
                        href={`tel:${hotelPhone.replace(/[^0-9+]/g, '')}`}
                        className="text-xs mt-1.5 inline-flex items-center gap-1 font-bold"
                        style={{ color: INFO }}
                      >
                        <Phone className="w-3 h-3" />
                        {hotelPhone}
                      </a>
                    )}
                    {hotelMapsQuery && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelMapsQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] text-white"
                        style={{ background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', boxShadow: '0 6px 16px rgba(30,58,138,0.3)' }}
                      >
                        <MapPin className="w-4 h-4" />
                        {t('deposerHotel', lang)}
                      </a>
                    )}
                  </div>
                )}

                {/* Agency */}
                {passportData.agency && (
                  <>
                        <InfoRow
                      icon={<span className="text-sm">🏢</span>}
                      label="Agence"
                      value={passportData.agency.name}
                    />
                  </>
                )}

                {/* Secure Contact Note */}
                <div className="mt-4 rounded-[14px] p-4 flex items-start gap-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <span className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                    <Lock className="w-4 h-4" style={{ color: SUCCESS }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#065f46' }}>Contact sécurisé</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#047857' }}>
                      Le propriétaire sera notifié via WhatsApp. Son numéro reste confidentiel.
                    </p>
                  </div>
                </div>
                </div>

                {/* Bande MRZ décorative — style livret passeport */}
                <div className="px-5 sm:px-6 py-3.5" style={{ background: '#f1f5f9', borderTop: '1px dashed #cbd5e1' }}>
                  <p className="font-mono text-[9.5px] leading-[1.7] tracking-[0.06em] text-center break-all" style={{ color: '#64748b' }}>
                    {mrzLine1}<br />{mrzLine2}
                  </p>
                </div>
              </div>

              {/* ═══ ACTION BUTTONS: Appeler l'hôtel & Contacter le propriétaire ═══ */}
              {(isActive || isLost) && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    animation: 'spFadeInUp 0.5s ease 0.16s both',
                  }}
                >
                  <h2
                    className="text-xs uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2"
                    style={{ color: GOLD_SOFT }}
                  >
                    <Phone className="w-4 h-4" />
                    {t('quickContact', lang)}
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
                      className="w-full py-4 px-6 rounded-[16px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 min-h-[58px] text-white"
                      style={{ background: 'linear-gradient(135deg, #2be07f 0%, #25D366 55%, #1eb857 100%)', boxShadow: '0 10px 26px rgba(37,211,102,0.35)' }}
                    >
                      <MessageCircle className="w-6 h-6" />
                      {t('contacterProprietaire', lang)}
                    </a>

                    {/* Appeler l'hôtel — now uses hotelPhone if available */}
                    {hotelPhone ? (
                      <a
                        href={`tel:${hotelPhone.replace(/[^0-9+]/g, '')}`}
                        className="w-full py-4 px-6 rounded-[16px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 min-h-[58px]"
                        style={{ background: WHITE, color: NAVY }}
                      >
                        <Phone className="w-6 h-6" />
                        {t('appelerHotel', lang)} ({hotelPhone})
                      </a>
                    ) : hasHotel ? (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(hotelMapsQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-6 rounded-[16px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 min-h-[58px]"
                        style={{ background: WHITE, color: NAVY }}
                      >
                        <Building2 className="w-6 h-6" />
                        {t('appelerHotel', lang)}
                      </a>
                    ) : passportData.homeAddress ? (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(passportData.homeAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-6 rounded-[16px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 min-h-[58px]"
                        style={{ background: WHITE, color: NAVY }}
                      >
                        <Building2 className="w-6 h-6" />
                        {t('appelerHotel', lang)}
                      </a>
                    ) : null}
                  </div>

                  <p className="text-xs mt-3.5 text-center flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    Le numéro du propriétaire reste confidentiel. La mise en relation se fait via WhatsApp.
                  </p>
                </div>
              )}

              {/* ═══ CARD 2: ACTIVE PASSPORT MESSAGE ═══ */}
              {isActive && !isLost && !isFound && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6 shadow-xl text-center"
                  style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '1px solid #6ee7b7', animation: 'spFadeInUp 0.5s ease 0.2s both' }}
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
                  {/* CTA Button or Security Question or Form */}
                  {!showForm ? (
                    <button
                      onClick={() => {
                        setShowForm(true);
                        // If hotelName exists, show security question first; otherwise go directly to form
                        if (passportData?.hotelName) {
                          setSecurityStep('question');
                        } else {
                          setSecurityStep('form');
                        }
                      }}
                      className="w-full py-4 px-6 rounded-[16px] font-extrabold text-lg md:text-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2.5 min-h-[58px]"
                      style={{ background: 'linear-gradient(135deg, #f7e08a 0%, #D4AF37 55%, #c39a1f 100%)', color: NAVY_DEEP, boxShadow: '0 12px 30px rgba(212,175,55,0.4)' }}
                    >
                      <Phone className="w-5 h-5" />
                      <span>
                        {isLost ? 'Signaler que j\'ai trouvé ce passeport' : t('signalerPasseport', lang)}
                      </span>
                    </button>
                  ) : securityStep === 'question' ? (
                    /* ─── Security Question Step ─── */
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: '#fdf6e3', border: '1px solid #f0e0b0' }}>
                          <Lock className="w-4 h-4" style={{ color: GOLD_ACTUAL }} />
                        </span>
                        <h3
                          className="text-sm font-bold uppercase tracking-widest"
                          style={{ color: INK }}
                        >
                          {t('securityTitle', lang)}
                        </h3>
                      </div>
                      <p className="text-sm" style={{ color: MUTED }}>
                        {t('securityHint', lang)}
                      </p>
                      <div>
                        <label className="text-sm font-semibold mb-2 block" style={{ color: INK }}>
                          {t('securityQuestion', lang)}
                        </label>
                        <input
                          type="text"
                          placeholder={lang === 'fr' ? 'Nom de l\'hôtel...' : '...'}
                          value={securityAnswer}
                          onChange={(e) => {
                            setSecurityAnswer(e.target.value);
                            setSecurityError(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSecurityCheck();
                          }}
                          className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all min-h-[48px]"
                          style={{ background: INPUT_BG, color: INK, border: `1px solid ${securityError ? DANGER : '#d1d5db'}` }}
                          autoFocus
                        />
                        {securityError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs mt-1.5 font-semibold"
                            style={{ color: DANGER }}
                          >
                            {t('securityError', lang)}
                          </motion.p>
                        )}
                      </div>
                      <button
                        onClick={handleSecurityCheck}
                        className="w-full py-4 px-6 rounded-[16px] font-extrabold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[56px]"
                        style={{ background: 'linear-gradient(135deg, #f7e08a 0%, #D4AF37 55%, #c39a1f 100%)', color: NAVY_DEEP, boxShadow: '0 10px 26px rgba(212,175,55,0.35)' }}
                      >
                        <ShieldCheck className="w-5 h-5" />
                        {t('verifier', lang)}
                      </button>
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setSecurityStep('idle');
                          setSecurityAnswer('');
                          setSecurityError(false);
                        }}
                        className="w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all"
                        style={{ color: MUTED }}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    /* ─── Full Finder Form ─── */
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
                        className="w-full py-4 px-6 rounded-[16px] font-extrabold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[58px]"
                        style={{ background: 'linear-gradient(135deg, #f7e08a 0%, #D4AF37 55%, #c39a1f 100%)', color: NAVY_DEEP, boxShadow: '0 12px 30px rgba(212,175,55,0.4)' }}
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
                  className="w-full rounded-[22px] p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
                  style={{ background: CARD_BG, animation: 'spFadeInUp 0.45s ease both' }}
                >
                  {/* Étincelles dorées animées */}
                  {[
                    { top: '16%', left: '14%', d: 0 },
                    { top: '9%', left: '50%', d: 0.15 },
                    { top: '18%', left: '84%', d: 0.3 },
                    { top: '55%', left: '8%', d: 0.2 },
                    { top: '60%', left: '91%', d: 0.35 },
                  ].map((s, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.25, 0] }}
                      transition={{ duration: 1.4, delay: 0.3 + s.d, repeat: Infinity, repeatDelay: 1.8 }}
                      className="absolute w-2.5 h-2.5 rounded-full"
                      style={{ top: s.top, left: s.left, background: GOLD_ACTUAL }}
                      aria-hidden="true"
                    />
                  ))}
                  <motion.div
                    initial={{ scale: 0, rotate: -18 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.05 }}
                    className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: '#d1fae5', border: '3px solid #059669' }}
                  >
                    <CheckCircle className="w-10 h-10" style={{ color: SUCCESS }} />
                  </motion.div>
                  <h3 className="text-xl font-extrabold mb-2" style={{ color: SUCCESS }}>
                    Signalement envoyé ! ✓
                  </h3>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: '#065f46' }}>
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
                  className="w-full rounded-[20px] p-5 sm:p-6 shadow-xl text-center"
                  style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd', animation: 'spFadeInUp 0.5s ease 0.16s both' }}
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

              {/* ═══ BACKUP QR CODE ═══ */}
              {backupQrUrl && (
                <div
                  className="w-full rounded-[20px] p-5 sm:p-6 flex flex-col items-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                >
                  <div className="bg-white p-2.5 rounded-[14px] shadow-lg">
                    <img
                      src={backupQrUrl}
                      alt="QR Code backup"
                      className="w-28 h-28"
                    />
                  </div>
                  <p className="text-xs mt-2.5 font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    Scanner pour accéder à cette page
                  </p>
                </div>
              )}

              {/* ═══ FOOTER ═══ */}
              <div className="text-center mt-2 space-y-2">
                {/* Religious blessing */}
                <p
                  className="text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  Que cette rencontre soit bénie par le Tout-Puissant 🤲
                </p>

                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  PassHajj — Service officiel de protection des passeports
                </p>
                <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Code QR : {qrCode}
                </p>

                {/* Bottom certification */}
                <div className="pt-3 space-y-1.5">
                  <p
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t('serviceAgree', lang)}
                  </p>
                  <br />
                  <p
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {t('donneesCryptees', lang)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ AUDIO-GUIDE GATE — instructions vocales trouveur (contexte passeport) ═══ */}
        {showVoiceGate && pageState === 'loaded' && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            role="dialog"
            aria-modal="true"
            aria-label={VOICE_GATE[lang].title}
          >
            <div className="w-full max-w-[380px] rounded-[24px] overflow-hidden shadow-2xl" style={{ background: CARD_BG }}>
              {/* Top: brand + title */}
              <div className="px-6 pt-7 pb-6 text-center" style={{ background: '#1e3a8a' }}>
                <div className="inline-flex items-center justify-center mb-4 shadow-md rounded-[14px]">
                  <BrandLogo width={64} />
                </div>
                <h2 className="text-2xl font-extrabold text-white">{VOICE_GATE[lang].title}</h2>
                <p className="text-sm text-white/80 mt-2 leading-relaxed">{VOICE_GATE[lang].desc}</p>
                <span className="inline-flex items-center gap-1 mt-4 px-3 py-1 rounded-full border border-white/30 text-white text-xs font-bold tracking-widest font-mono">
                  🔊 {qrCode}
                </span>
              </div>
              {/* Bottom: big tap button + badge */}
              <div className="px-6 py-6">
                <button
                  onClick={handleVoiceGateTap}
                  className="w-full py-4 px-6 text-white rounded-[16px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2.5 min-h-[60px]"
                  style={{ background: '#1e3a8a' }}
                >
                  <Volume2 className="w-6 h-6" />
                  <span>{VOICE_GATE[lang].btn}</span>
                </button>
                <p className="mt-3 text-center text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-1.5" style={{ color: MUTED }}>
                  <Volume2 className="w-3.5 h-3.5" />
                  {VOICE_GATE[lang].badge}{voiceDuration ? ` · ${voiceDuration} S` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Floating replay button — bottom left, after gate dismissed ═══ */}
        {!showVoiceGate && pageState === 'loaded' && (
          <button
            onClick={toggleFinderVoice}
            aria-label={VOICE_GATE[lang].replay}
            title={VOICE_GATE[lang].replay}
            className="fixed bottom-[4.75rem] left-5 z-[55] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: voicePlaying ? GOLD_ACTUAL : '#ffffff',
              border: '3px solid #D4AF37',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            }}
          >
            {voicePlaying ? (
              <Pause className="w-5 h-5 animate-pulse" style={{ color: NAVY_DEEP }} />
            ) : (
              <Volume2 className="w-5 h-5" style={{ color: '#1e3a8a' }} />
            )}
          </button>
        )}
      </main>
    </div>
  );
}
