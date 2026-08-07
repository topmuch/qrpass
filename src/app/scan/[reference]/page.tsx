'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import {
  Luggage,
  AlertCircle,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  BedDouble,
  Navigation,
  Share,
  Loader2,
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import SuccessOverlay from '@/components/ui/SuccessOverlay';
import PhoneInput from '@/components/ui/PhoneInput';
import { toast } from '@/hooks/use-toast';

// TRANSPORT-FEATURE: Multi-transport support (real images, emojis as fallback)
import {
  safeTransportMode,
  getTransportImage,
  getTransportBlockHeader,
  TRANSPORT_ICONS,
} from '@/lib/transport';
import type { TransportMode } from '@/lib/transport';
import TransportModeSelector from '@/components/inscrire/TransportModeSelector';

// AI-FEATURE: Lazy-load ChatbotWidget (Feature #1) — doesn't block page render
const ChatbotWidget = dynamic(() => import('@/components/finder/ChatbotWidget'), {
  ssr: false,
  loading: () => null,
});

// ─── Brand constants (PassHajj palette: yellow #f4b400 + white cards + dark blue CTA) ───
const BRAND = '#f4b400';     // jaune — fond principal
const CARD_BG = '#ffffff';   // blanc — cartes
const INK = '#0f172a';       // dark text
const MUTED = '#64748b';     // gris — texte secondaire
const ACCENT = '#1e3a8a';    // dark blue — CTA button
const INPUT_BG = '#f8fafc';  // light gray — info rows
const BTN_PRIMARY = '#111827'; // noir — edit buttons

const FALLBACK_PHONE = '33745349339';

// ─── Inline i18n for the new card-based design ───
const I18N: Record<string, Record<Language, string>> = {
  title: { fr: 'BAGAGE TROUVÉ', en: 'BAGGAGE FOUND', ar: 'حقيبة وجدت' },
  subtitle: {
    fr: "Merci d'avoir trouvé ce bagage ! Le propriétaire sera contacté immédiatement.",
    en: 'Thank you for finding this baggage! The owner will be contacted immediately.',
    ar: 'شكرا على العثور على هذه الحقيبة! سيتم الاتصال بالمالك فورا.',
  },
  ownerLabel: { fr: 'PROPRIÉTAIRE', en: 'OWNER', ar: 'المالك' },
  nameLabel: { fr: 'Nom complet', en: 'Full Name', ar: 'الاسم الكامل' },
  contactLabel: { fr: 'Contact', en: 'Contact', ar: 'الاتصال' },
  secureNote: {
    fr: 'Le propriétaire sera notifié via WhatsApp. Son numéro reste confidentiel.',
    en: "The owner will be notified via WhatsApp. Their number remains confidential.",
    ar: 'سيتم إخطار المالك عبر واتساب. يظل رقمه سريا.',
  },
  photoLabel: { fr: 'Photo du bagage', en: 'Bag Photo', ar: 'صورة الحقيبة' },
  hotelLabel: { fr: 'HÉBERGEMENT', en: 'ACCOMMODATION', ar: 'الإقامة' },
  hotelNameLabel: { fr: 'Hôtel actuel', en: 'Current Hotel', ar: 'الفندق الحالي' },
  hotelAddressLabel: { fr: 'Adresse', en: 'Address', ar: 'العنوان' },
  hotelPhoneLabel: { fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' },
  roomLabel: { fr: 'Chambre', en: 'Room', ar: 'الغرفة' },
  dropAtHotel: { fr: 'Déposer à l\'hôtel', en: 'Drop off at hotel', ar: 'تسليم في الفندق' },
  dropAtHotelDesc: { fr: 'Ouvrir l\'itinéraire vers l\'hôtel', en: 'Open directions to hotel', ar: 'فتح الاتجاهات إلى الفندق' },
  flightLabel: { fr: 'DÉTAILS DU VOL', en: 'FLIGHT DETAILS', ar: 'تفاصيل الرحلة' },
  airlineLabel: { fr: 'Compagnie aérienne', en: 'Airline', ar: 'شركة الطيران' },
  flightNumLabel: { fr: 'Numéro de vol', en: 'Flight Number', ar: 'رقم الرحلة' },
  destLabel: { fr: 'Destination', en: 'Destination', ar: 'الوجهة' },
  dateLabel: { fr: 'Date de départ', en: 'Departure Date', ar: 'تاريخ المغادرة' },
  ctaText: { fr: 'Contacter le propriétaire', en: 'Contact Owner', ar: 'الاتصال بالمالك' },
  footer: {
    fr: 'PassHajj — Service officiel de protection des bagages',
    en: 'PassHajj — Official baggage protection service',
    ar: 'PassHajj — خدمة حماية الحقائب الرسمية',
  },
  lostTitle: { fr: 'BAGAGE PERDU', en: 'LOST BAGGAGE', ar: 'حقيبة مفقودة' },
  lostSubtitle: {
    fr: 'Ce bagage a été signalé perdu. Merci de le retourner à son propriétaire.',
    en: 'This baggage has been reported lost. Please return it to its owner.',
    ar: 'تم الإبلاغ عن فقدان هذه الحقيبة. يرجى إرجاعها إلى مالكها.',
  },
  // Emergency panel
  emergencyTitle: { fr: 'URGENCE — BAGAGE PERDU', en: 'URGENT — LOST BAGGAGE', ar: 'طوارئ — حقيبة مفقودة' },
  emergencyStep1: { fr: 'Contactez le propriétaire', en: 'Contact the owner', ar: 'اتصل بالمالك' },
  emergencyStep1Desc: { fr: "Utilisez WhatsApp ou le téléphone pour prévenir le propriétaire.", en: 'Use WhatsApp or phone to notify the owner.', ar: 'استخدم واتساب أو الهاتف لإخطار المالك.' },
  emergencyStep2: { fr: "Déposez le bagage à l'hôtel", en: 'Drop off at hotel', ar: 'تسليم الحقيبة في الفندق' },
  emergencyStep2Desc: { fr: "Apportez le bagage à l'hébergement du propriétaire.", en: "Bring the baggage to the owner's accommodation.", ar: 'أحضر الحقيبة إلى مكان إقامة المالك.' },
  emergencyStep3: { fr: 'Signalez comme retrouvé', en: 'Mark as found', ar: 'الإبلاغ عن العثور' },
  emergencyStep3Desc: { fr: 'Indiquez que le bagage a été retrouvé pour prévenir le propriétaire.', en: 'Indicate the baggage has been found to notify the owner.', ar: 'أشير إلى أن الحقيبة تم العثور عليها لإخطار المالك.' },
  // Mark found
  markFoundBtn: { fr: "J'ai retrouvé ce bagage ✅", en: 'I found this baggage ✅', ar: 'وجدت هذه الحقيبة ✅' },
  foundSuccess: { fr: 'Bagage marqué comme retrouvé !', en: 'Baggage marked as found!', ar: 'تم تحديد الحقيبة على أنها موجودة!' },
  foundError: { fr: 'Erreur, réessayez', en: 'Error, try again', ar: 'خطأ، حاول مرة أخرى' },
  // Mini map
  viewOnMap: { fr: 'Voir sur la carte', en: 'View on map', ar: 'عرض على الخريطة' },
  // Transport labels
  trainLabel: { fr: 'DÉTAILS DU TRAIN', en: 'TRAIN DETAILS', ar: 'تفاصيل القطار' },
  boatLabel: { fr: 'DÉTAILS DU BATEAU', en: 'BOAT DETAILS', ar: 'تفاصيل السفينة' },
  busLabel: { fr: 'DÉTAILS DU BUS', en: 'BUS DETAILS', ar: 'تفاصيل الحافلة' },
  // Scan badges
  scannedBadge: { fr: 'Scanné', en: 'Scanned', ar: 'تم المسح' },
  localizedBadge: { fr: 'Bagage localisé', en: 'Baggage located', ar: 'حقيبة محددة' },
  lostBadge: { fr: 'PERDU', en: 'LOST', ar: 'مفقود' },
  // Share
  shareBtn: { fr: 'Partager', en: 'Share', ar: 'مشاركة' },
  shareCopied: { fr: 'Lien copié !', en: 'Link copied!', ar: 'تم نسخ الرابط!' },
};

/** Shorthand to get inline i18n string */
function i18n(key: string, lang: Language): string {
  return I18N[key]?.[lang] || I18N[key]?.fr || key;
}

interface BaggageData {
  status: string;
  message?: string;
  theme?: string;
  type?: string;
  expiredAt?: string;
  agency?: string;
  baggage?: {
    reference: string;
    type: string;
    travelerName: string;
    travelerFirstName?: string;
    travelerLastName?: string;
    baggageIndex: number;
    baggageType: string;
    status: string;
    airlineName?: string;
    flightNumber?: string;
    destination?: string;
    agency?: string;
    whatsappOwner?: string;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    createdAt?: string | null;
    departureDate?: string | null;
    departureTime?: string | null;
    // TRANSPORT-FEATURE: Transport mode + conditional fields
    transportMode?: string;
    trainCompany?: string | null;
    trainNumber?: string | null;
    shipName?: string | null;
    shipCabin?: string | null;
    busCompany?: string | null;
    busLineNumber?: string | null;
    photoUrl?: string | null;
    // HOTEL-FEATURE: Accommodation info
    hotelName?: string | null;
    hotelAddress?: string | null;
    hotelPhone?: string | null;
    roomNumber?: string | null;
  };
}

// ─── Language Selector Component (light theme, brand-aware) ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-black/10 rounded-full text-sm font-medium hover:bg-white transition-colors min-h-[36px]"
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Language" className="absolute top-full right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={lang === l}
              onClick={() => {
                setLang(l);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                lang === l
                  ? 'bg-[#f4b400] text-black'
                  : 'text-black hover:bg-[#f4b400]/30'
              }`}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activation Redirect Component (harmonized with PassHajj design system) ───
// ACTIVATION-FLOW: User selects transport mode BEFORE being redirected to /inscrire?qr=REF&mode=XXX.
function ActivationRedirect({ type, reference, t, lang, setLang }: {
  type: string;
  reference: string;
  t: (key: string, params?: Record<string, string>) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<TransportMode | ''>('');

  const isHajj = type === 'hajj';

  const handleContinue = () => {
    const url = isHajj
      ? `/hajj/activate?qr=${reference}`
      : `/inscrire?qr=${reference}${selectedMode ? `&mode=${selectedMode}` : ''}`;
    router.push(url);
  };

  return (
    <main dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col items-center justify-center p-5 md:p-8" style={{ background: BRAND }}>
      <div className="relative max-w-[420px] w-full">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center">
              <Image src="/logo.png" alt="PassHajj" width={150} height={58} style={{ objectFit: 'contain', borderRadius: '14px', padding: '5px', background: 'rgba(255,255,255,0.9)' }} />
            </div>
            <div className="text-sm mt-1" style={{ color: MUTED }}>
              {isHajj ? t('inscrire.subtitle') : t('inscrire.subtitle')}
            </div>
          </div>
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        {/* ─── White Card ─── */}
        <div
          className="rounded-[18px] p-6 md:p-8 text-center shadow-lg"
          style={{ background: CARD_BG }}
        >
          {/* Icon */}
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 bg-[#fef3c7] rounded-full flex items-center justify-center mx-auto">
              {selectedMode ? (
                <Image
                  src={getTransportImage(selectedMode)}
                  alt={selectedMode}
                  width={36}
                  height={36}
                  className="mix-blend-multiply"
                />
              ) : (
                <Luggage className="w-8 h-8 text-[#f4b400]" />
              )}
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#111827] rounded-full flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#f4b400]" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: INK }}>
            {t('common.welcome')}
          </h1>
          <p className="text-sm md:text-base mb-5" style={{ color: MUTED }}>
            {t('inscrire.subtitle')}
          </p>

          {isHajj && (
            <>
              {/* Baggage type box */}
              <div className="rounded-xl p-4 mb-5" style={{ background: INPUT_BG }}>
                <p className="text-sm mb-2" style={{ color: MUTED }}>{t('common.baggage_type')}</p>
                <Badge className="text-white text-base md:text-lg px-5 py-1.5" style={{ background: BTN_PRIMARY }}>
                  {t('common.hajj_label')}
                </Badge>
              </div>
              <button
                className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[56px]"
                style={{ background: BTN_PRIMARY }}
                onClick={handleContinue}
              >
                {t('common.start_activation')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {!isHajj && (
            <>
              {/* Baggage type box */}
              <div className="rounded-xl p-4 mb-5" style={{ background: INPUT_BG }}>
                <p className="text-sm mb-2" style={{ color: MUTED }}>{t('common.baggage_type')}</p>
                <Badge className="text-white text-base md:text-lg px-5 py-1.5" style={{ background: BTN_PRIMARY }}>
                  {t('common.voyageur_label')}
                </Badge>
              </div>

              {/* Transport mode selector */}
              <div className="text-left mb-5">
                <p className="font-semibold text-sm mb-3 text-center" style={{ color: INK }}>
                  {t('transport.select_mode')}
                </p>
                <TransportModeSelector
                  selectedMode={selectedMode}
                  onSelect={setSelectedMode}
                  t={t}
                  lang={lang}
                />
              </div>

              <button
                className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[56px]"
                style={{ background: BTN_PRIMARY }}
                onClick={handleContinue}
                disabled={!selectedMode}
              >
                {t('common.start_activation')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="mt-auto pt-6 text-center text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
          Propulsé par <strong>PassHajj</strong> ·{' '}
          <a href="/support" className="text-black font-semibold underline">Aide</a>
        </div>
      </div>
    </main>
  );
}

// ─── Loading Component (harmonized with PassHajj design) ───
function LoadingScreen({ t }: { t: (key: string) => string }) {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BRAND }}>
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-medium text-black">{t('common.loading')}</p>
      </div>
    </main>
  );
}

// ─── Error Screen (harmonized with PassHajj design) ───
function ErrorScreen({
  type,
  t,
  lang,
  setLang
}: {
  type: string;
  t: (key: string) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();

  const errorConfig = {
    not_found: {
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      title: t('errors.qr_not_valid'),
      message: t('errors.qr_not_valid_desc')
    },
    blocked: {
      icon: <Shield className="w-12 h-12 text-gray-400" />,
      title: t('errors.baggage_blocked'),
      message: t('errors.baggage_blocked_desc')
    },
    expired: {
      icon: <Clock className="w-12 h-12 text-gray-400" />,
      title: t('errors.protection_expired'),
      message: t('errors.protection_expired_desc')
    }
  };

  const config = errorConfig[type as keyof typeof errorConfig] || errorConfig.not_found;

  return (
    <main className="min-h-screen flex items-center justify-center p-5 md:p-8" style={{ background: BRAND }}>
      <div className="absolute top-4 right-4">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div
        className="max-w-md w-full rounded-[18px] p-6 md:p-8 text-center shadow-lg"
        style={{ background: CARD_BG }}
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          {config.icon}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: INK }}>{config.title}</h1>
        <p className="text-base md:text-lg mb-6" style={{ color: MUTED }}>{config.message}</p>
        <button
          className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-base transition-all hover:-translate-y-0.5 active:scale-[0.98] min-h-[56px]"
          style={{ background: BTN_PRIMARY }}
          onClick={() => router.push('/')}
        >
          {t('common.back_home')}
        </button>
      </div>
    </main>
  );
}

// ─── Info Row Helper (clean label+value rows inside white cards) ───
function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: MUTED }}>{label}</p>
        <p className={`text-base font-semibold break-words ${mono ? 'font-mono tracking-widest text-lg' : ''}`} style={{ color: INK }}>{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN SCAN PAGE ───
// ═══════════════════════════════════════════════════════════════
export default function ScanPage() {
  const params = useParams();
  const reference = params.reference as string;

  const { t, lang, setLang, dir, countryCode } = useTranslation();

  const [baggageData, setBaggageData] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMarkingFound, setIsMarkingFound] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editTransportMode, setEditTransportMode] = useState<TransportMode>('flight');
  const [editAirlineName, setEditAirlineName] = useState('');
  const [editFlightNumber, setEditFlightNumber] = useState('');
  const [editTrainCompany, setEditTrainCompany] = useState('');
  const [editTrainNumber, setEditTrainNumber] = useState('');
  const [editShipName, setEditShipName] = useState('');
  const [editShipCabin, setEditShipCabin] = useState('');
  const [editBusCompany, setEditBusCompany] = useState('');
  const [editBusLineNumber, setEditBusLineNumber] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editDepartureDate, setEditDepartureDate] = useState('');
  const [editDepartureTime, setEditDepartureTime] = useState('');
  const [editPhoneCountry, setEditPhoneCountry] = useState(countryCode);
  // Edit hotel fields
  const [editHotelName, setEditHotelName] = useState('');
  const [editHotelAddress, setEditHotelAddress] = useState('');
  const [editHotelPhone, setEditHotelPhone] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');

  // Finder form state
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [finderPhoneCountry, setFinderPhoneCountry] = useState(countryCode);
  const [otherLocation, setOtherLocation] = useState('');
  // GPS is now captured INLINE inside handleWhatsApp (no separate button/state).
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SuccessOverlay state
  const [scanConfirmed, setScanConfirmed] = useState(false);
  const hasConfirmedRef = useRef(false);

  // Silent GPS auto-capture on page load
  const [autoGps, setAutoGps] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setAutoGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* silent fail */ },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }
  }, []);

  useEffect(() => {
    const fetchBaggage = async () => {
      try {
        const response = await fetch(`/api/scan/${reference}`);
        const data = await response.json();
        setBaggageData(data);
      } catch (error) {
        console.error('Error fetching baggage:', error);
        setBaggageData({ status: 'error', message: 'Erreur serveur' });
      } finally {
        setLoading(false);
      }
    };

    fetchBaggage();
  }, [reference]);

  // Trigger SuccessOverlay once when baggage loads successfully
  useEffect(() => {
    if (baggageData?.baggage?.reference && !hasConfirmedRef.current) {
      hasConfirmedRef.current = true;
      setScanConfirmed(true);
    }
  }, [baggageData?.baggage?.reference]);

  // Pre-fill edit state when baggage data loads
  useEffect(() => {
    const b = baggageData?.baggage;
    if (b) {
      setEditFirstName(b.travelerFirstName || '');
      setEditLastName(b.travelerLastName || '');
      setEditWhatsapp(b.whatsappOwner || '');
      setEditTransportMode(safeTransportMode(b.transportMode) as TransportMode);
      setEditAirlineName(b.airlineName || '');
      setEditFlightNumber(b.flightNumber || '');
      setEditTrainCompany(b.trainCompany || '');
      setEditTrainNumber(b.trainNumber || '');
      setEditShipName(b.shipName || '');
      setEditShipCabin(b.shipCabin || '');
      setEditBusCompany(b.busCompany || '');
      setEditBusLineNumber(b.busLineNumber || '');
      setEditDestination(b.destination || '');
      setEditHotelName(b.hotelName || '');
      setEditHotelAddress(b.hotelAddress || '');
      setEditHotelPhone(b.hotelPhone || '');
      setEditRoomNumber(b.roomNumber || '');
      // Format departureDate to YYYY-MM-DD for the date input
      if (b.departureDate) {
        try {
          const d = new Date(b.departureDate);
          setEditDepartureDate(d.toISOString().split('T')[0]);
        } catch {
          setEditDepartureDate('');
        }
      } else {
        setEditDepartureDate('');
      }
      setEditDepartureTime(b.departureTime || '');
    }
  }, [baggageData?.baggage?.reference]); // only re-run when baggage reference changes

  // Handle save edit
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/baggage/reference/${reference}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerFirstName: editFirstName.trim() || null,
          travelerLastName: editLastName.trim() || null,
          whatsappOwner: editWhatsapp.trim() || null,
          transportMode: editTransportMode,
          airlineName: editAirlineName.trim() || null,
          flightNumber: editFlightNumber.trim() || null,
          trainCompany: editTrainCompany.trim() || null,
          trainNumber: editTrainNumber.trim() || null,
          shipName: editShipName.trim() || null,
          shipCabin: editShipCabin.trim() || null,
          busCompany: editBusCompany.trim() || null,
          busLineNumber: editBusLineNumber.trim() || null,
          destination: editDestination.trim() || null,
          departureDate: editDepartureDate || null,
          departureTime: editDepartureTime.trim() || null,
          hotelName: editHotelName.trim() || null,
          hotelAddress: editHotelAddress.trim() || null,
          hotelPhone: editHotelPhone.trim() || null,
          roomNumber: editRoomNumber.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      // Update local state with the updated baggage data
      setBaggageData({
        ...baggageData!,
        status: baggageData!.status,
        baggage: {
          ...baggageData!.baggage!,
          travelerFirstName: data.baggage.travelerFirstName,
          travelerLastName: data.baggage.travelerLastName,
          travelerName: `${data.baggage.travelerFirstName || ''} ${data.baggage.travelerLastName || ''}`.trim(),
          whatsappOwner: data.baggage.whatsappOwner,
          transportMode: data.baggage.transportMode,
          airlineName: data.baggage.airlineName,
          flightNumber: data.baggage.flightNumber,
          trainCompany: data.baggage.trainCompany,
          trainNumber: data.baggage.trainNumber,
          shipName: data.baggage.shipName,
          shipCabin: data.baggage.shipCabin,
          busCompany: data.baggage.busCompany,
          busLineNumber: data.baggage.busLineNumber,
          destination: data.baggage.destination,
          departureDate: data.baggage.departureDate,
          departureTime: data.baggage.departureTime,
          hotelName: data.baggage.hotelName,
          hotelAddress: data.baggage.hotelAddress,
          hotelPhone: data.baggage.hotelPhone,
          roomNumber: data.baggage.roomNumber,
        },
      });
      setIsEditing(false);
      toast({ title: t('finder.edit_success') });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: t('finder.edit_error'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate WhatsApp message — friendly notification to the owner
  const generateWhatsAppMessage = useCallback((
    finderName: string,
    finderPhone: string,
    locationText: string,
    mapLink: string,
    travelerName: string,
    baggageType: string
  ) => {
    const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://qrpasss.com'}/suivi/${reference}`;

    // Extract owner's first name from full name
    const firstName = travelerName.split(' ')[0] || travelerName || '';

    // Baggage type label (voyageur/hajj) — i18n-aware
    const typeLabel = baggageType === 'hajj'
      ? t('common.hajj_label')
      : t('common.voyageur_label');

    // [Lieu] = where the bag was found (manual text, GPS coords, or fallback label)
    const location = locationText || t('whatsapp.gps_shared_label');

    // [Adresse] = current precise address (Google Maps link if GPS, else same as location, else fallback)
    const address = mapLink.startsWith('http')
      ? mapLink
      : (locationText || t('whatsapp.location_not_shared'));

    // Build message using the template
    return encodeURIComponent(
      t('whatsapp.found_message', {
        firstName,
        type: typeLabel,
        location,
        address,
        name: finderName,
        phone: finderPhone,
        url: trackingUrl,
      })
    );
  }, [reference, t]);

  // Log scan to API (shared by WhatsApp + Phone flows).
  const logScan = useCallback(async (
    sharedPos?: { lat: number; lng: number } | null,
    locText?: string
  ) => {
    try {
      await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || locText || t('finder.not_specified'),
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          message: '',
          latitude: sharedPos?.lat,
          longitude: sharedPos?.lng,
        }),
      });
    } catch (e) {
      // Continue with contact even if logging fails
      console.error('Log scan failed:', e);
    }
  }, [reference, otherLocation, finderName, finderPhone, t]);

  // Handle WhatsApp contact — GPS is captured INLINE with silent fallback to manual location.
  // Flow: validate name+phone → try GPS (10s timeout, silent fail) → log scan → open wa.me
  const handleWhatsApp = useCallback(async () => {
    // Inline validation (name + phone required; location optional since GPS is auto)
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    // Step 1: try to get GPS automatically (silent fallback if it fails)
    setIsLocating(true);
    let sharedPos: { lat: number; lng: number } | null = null;
    let locText = '';

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        sharedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locText = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      } catch {
        // Silent fallback — use manual location or "not specified"
        toast({ title: t('finder.gps_fallback_toast') });
      }
    }

    setIsLocating(false);
    setIsSubmitting(true);

    try {
      await logScan(sharedPos, locText);

      const finalLocationText = locText || otherLocation.trim() || t('finder.not_specified');
      const mapLink = sharedPos
        ? `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${sharedPos.lat},${sharedPos.lng}`
        : t('whatsapp.location_not_shared');

      const message = generateWhatsAppMessage(
        finderName,
        finderPhone,
        finalLocationText,
        mapLink,
        baggageData?.baggage?.travelerName || '',
        baggageData?.baggage?.type || 'voyageur'
      );
      const ownerNumber = baggageData?.baggage?.whatsappOwner?.replace(/\D/g, '') || FALLBACK_PHONE;
      // Use api.whatsapp.com directly instead of wa.me — wa.me corrupts 4-byte UTF-8 emojis
      const url = `https://api.whatsapp.com/send/?phone=${ownerNumber}&text=${message}`;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        window.location.href = url;
      } else {
        const newWindow = window.open(url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = url;
        }
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      toast({ title: t('finder.success_title'), description: t('finder.message_sent') });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t('errors.error_occurred'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, t, logScan, otherLocation, baggageData, generateWhatsAppMessage]);

  // Handle phone call — opens tel:${phone}. No GPS (no message to embed it in).
  const handlePhoneCall = useCallback(async () => {
    // Inline validation (same as WhatsApp: name + phone required)
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    await logScan(null, '');

    const phoneNumber = baggageData?.baggage?.whatsappOwner || FALLBACK_PHONE;
    window.location.href = `tel:${phoneNumber}`;
  }, [finderName, finderPhone, t, logScan, baggageData]);

  // Handle mark as found
  const handleMarkFound = useCallback(async () => {
    setIsMarkingFound(true);
    try {
      const res = await fetch(`/api/baggage-status/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-found' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setBaggageData(prev => {
          if (!prev?.baggage) return prev;
          return {
            ...prev,
            status: 'active',
            baggage: { ...prev.baggage, foundAt: new Date().toISOString() },
          };
        });
        toast({ title: i18n('foundSuccess', lang) });
      }
    } catch {
      toast({ title: i18n('foundError', lang), variant: 'destructive' as const });
    } finally {
      setIsMarkingFound(false);
    }
  }, [reference, lang]);

  // Handle share
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `PassHajj - ${baggageData?.baggage?.travelerName || 'Bagage'}`, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: i18n('shareCopied', lang) });
    }
  }, [baggageData, lang]);

  // Format date for display
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ─── Loading state ───
  if (loading) {
    return <LoadingScreen t={t} />;
  }

  // ─── Redirect to activation if pending ───
  if (baggageData?.status === 'pending_activation' && baggageData?.type) {
    return (
      <ActivationRedirect
        type={baggageData.type}
        reference={reference}
        t={t}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  // ─── Error states ───
  if (baggageData?.status === 'not_found') {
    return <ErrorScreen type="not_found" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'blocked') {
    return <ErrorScreen type="blocked" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'expired') {
    const expiredAt = baggageData.expiredAt || '';
    const agencyName = baggageData.agency || '';
    const urlParams = new URLSearchParams({
      ref: reference,
      ...(expiredAt && { expired: expiredAt }),
      ...(agencyName && { agency: agencyName })
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/expired?${urlParams.toString()}`;
    }
    return <LoadingScreen t={t} />;
  }

  const baggage = baggageData?.baggage;
  const isDeclaredLost = baggage?.declaredLostAt && !baggage?.foundAt;

  // ═══════════════════════════════════════════════════════════════
  // ─── MAIN RENDER — Yellow bg + White cards + Dark blue CTA (PassHajj design) ───
  // ═══════════════════════════════════════════════════════════════
  return (
    <main
      className="min-h-screen flex flex-col px-4 sm:px-5 md:px-8 pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: BRAND }}
      dir={dir}
    >
      {/* ─── Top Bar: Logo + Edit/Share/Language ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between pt-[env(safe-area-inset-top,0px)] px-0 py-2 sm:py-3" style={{ background: BRAND }}>
        {/* PassHajj Logo */}
        <Image src="/logo.png" alt="PassHajj" width={130} height={50} style={{ objectFit: 'contain', borderRadius: '12px', padding: '4px', background: 'rgba(255,255,255,0.9)' }} />
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* ✏️ Modifier button — visible only for active/lost baggage */}
          {baggage && (baggageData?.status === 'active' || baggageData?.status === 'lost') && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-black/10 rounded-full text-xs sm:text-sm font-bold hover:bg-white/80 transition-colors min-h-[32px] sm:min-h-[36px]"
              style={{ color: INK }}
            >
              <span>{t('finder.edit_btn')}</span>
            </button>
          )}
          {isEditing && (
            <span className="font-bold text-xs sm:text-sm px-2" style={{ color: INK }}>
              {t('finder.edit_title')}
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/80 border border-black/10 rounded-full text-xs sm:text-sm font-medium hover:bg-white transition-colors min-h-[32px] sm:min-h-[36px]"
            aria-label={i18n('shareBtn', lang)}
          >
            <Share className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{i18n('shareBtn', lang)}</span>
          </button>
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* SuccessOverlay — Premium scan confirmation */}
      <SuccessOverlay show={scanConfirmed} messageKey="scan.success" t={t} />

      {/* Success Toast — inline confirmation */}
      {showSuccess && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] right-3 sm:right-5 bg-[#111827] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-right duration-300 max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#f4b400]" />
            <div>
              <div className="font-bold text-lg">{t('finder.success_title')} 🎉</div>
              <div className="text-base opacity-90">{t('finder.message_sent')}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Container ─── */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col py-4 sm:py-6 md:py-2">

        {/* ═══ HEADER: Green ✓ icon + "BAGAGE TROUVÉ" + white thank-you text ═══ */}
        <div className="text-center mb-5 sm:mb-6" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 mb-3 shadow-md">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: INK }}>
            {isDeclaredLost
              ? `🚨 ${i18n('lostTitle', lang)}`
              : i18n('title', lang)}
          </h1>
          {/* White text below "Bagage trouvé" — always visible */}
          <p className="mt-2 text-sm md:text-base leading-relaxed max-w-md mx-auto font-semibold" style={{ color: '#ffffff' }}>
            {isDeclaredLost
              ? i18n('lostSubtitle', lang)
              : i18n('subtitle', lang)}
          </p>

          {/* ═══ Scan Status Badges ═══ */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {isDeclaredLost ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                🚨 {i18n('lostBadge', lang)}
              </span>
            ) : baggageData?.baggage?.status === 'scanned' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                📍 {i18n('localizedBadge', lang)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                {i18n('scannedBadge', lang)}
              </span>
            )}
          </div>
        </div>

        {/* ═══ EMERGENCY PANEL for Lost Baggage ═══ */}
        {isDeclaredLost && (
          <div
            className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg border-2"
            style={{ background: '#FEF2F2', borderColor: '#EF4444', animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.02s', opacity: 0 }}
          >
            <h2 className="text-base md:text-lg font-extrabold mb-4 flex items-center gap-2" style={{ color: '#991B1B' }}>
              🚨 {i18n('emergencyTitle', lang)}
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#991B1B' }}>📞 {i18n('emergencyStep1', lang)}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>{i18n('emergencyStep1Desc', lang)}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#991B1B' }}>🏨 {i18n('emergencyStep2', lang)}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>{i18n('emergencyStep2Desc', lang)}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">3</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#991B1B' }}>✅ {i18n('emergencyStep3', lang)}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>{i18n('emergencyStep3Desc', lang)}</p>
                </div>
              </div>
            </div>

            {/* ═══ Mark as Found Button ═══ */}
            <button
              onClick={handleMarkFound}
              disabled={isMarkingFound}
              className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[56px] mt-5"
              style={{ background: '#10b981' }}
            >
              {isMarkingFound ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{i18n('markFoundBtn', lang)}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══ CARD 1 : PROPRIÉTAIRE (white card) ═══ */}
        {baggage && !isEditing && (
          <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.05s', opacity: 0 }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: INK }}>
              <span>👤</span> {i18n('ownerLabel', lang)}
            </h2>

            {/* Full Name */}
            <InfoRow
              icon="👤"
              label={i18n('nameLabel', lang)}
              value={baggage.travelerName || t('finder.notSet')}
            />

            <div className="border-t border-gray-100 my-2" />

            {/* Contact — Secured (NEVER show WhatsApp number) */}
            <div className="flex items-start gap-3 py-2">
              <span className="text-lg flex-shrink-0 mt-0.5">🔒</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: MUTED }}>{i18n('contactLabel', lang)}</p>
                <p className="text-base font-semibold" style={{ color: INK }}>{t('finder.secure_contact')}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: MUTED }}>{i18n('secureNote', lang)}</p>
              </div>
            </div>

            {/* Baggage Photo — helps finder identify the luggage */}
            {baggage.photoUrl && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium mb-2" style={{ color: MUTED }}>📸 {i18n('photoLabel', lang)}</p>
                <img
                  src={baggage.photoUrl}
                  alt={i18n('photoLabel', lang)}
                  className="max-w-full max-h-40 object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══ CARD 2 : HÔTEL / HÉBERGEMENT (white card, NEW) ═══ */}
        {baggage && !isEditing && baggage.hotelName && (
          <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.1s', opacity: 0 }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: INK }}>
              <Building2 className="w-4 h-4" style={{ color: INK }} />
              {i18n('hotelLabel', lang)}
            </h2>

            {/* Hotel Name */}
            <InfoRow
              icon="🏨"
              label={i18n('hotelNameLabel', lang)}
              value={baggage.hotelName}
            />

            {/* Hotel Address */}
            {baggage.hotelAddress && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <InfoRow
                  icon="📍"
                  label={i18n('hotelAddressLabel', lang)}
                  value={baggage.hotelAddress}
                />
              </>
            )}

            {/* Hotel Phone */}
            {baggage.hotelPhone && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <InfoRow
                  icon="📞"
                  label={i18n('hotelPhoneLabel', lang)}
                  value={baggage.hotelPhone}
                />
              </>
            )}

            {/* Room Number */}
            {baggage.roomNumber && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <InfoRow
                  icon="🚪"
                  label={i18n('roomLabel', lang)}
                  value={baggage.roomNumber}
                />
              </>
            )}

            {/* Déposer à l'hôtel — Google Maps directions button */}
            {baggage.hotelAddress && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    const addr = encodeURIComponent(baggage.hotelAddress!);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank');
                  }}
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[48px]"
                  title={i18n('dropAtHotelDesc', lang)}
                >
                  <Navigation className="w-5 h-5" />
                  {i18n('dropAtHotel', lang)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ MINI HOTEL MAP ═══ */}
        {baggage && !isEditing && baggage.hotelAddress && (
          <div className="w-full rounded-[18px] p-4 md:p-5 mb-4 shadow-lg" style={{ background: CARD_BG, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.12s', opacity: 0 }}>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(baggage.hotelAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm min-h-[44px] border border-blue-200"
            >
              <MapPin className="w-4 h-4" />
              {i18n('viewOnMap', lang)}
            </a>
            {autoGps && (
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${autoGps.lng - 0.01},${autoGps.lat - 0.01},${autoGps.lng + 0.01},${autoGps.lat + 0.01}&layer=mapnik&marker=${autoGps.lat},${autoGps.lng}`}
                className="w-full mt-3 rounded-lg border border-gray-200"
                style={{ height: 200 }}
                loading="lazy"
                title="Map"
              />
            )}
          </div>
        )}

        {/* ═══ CARD 3 : DÉTAILS DU VOYAGE / TRANSPORT (white card) ═══ */}
        {baggage && !isEditing && (() => {
          const mode = safeTransportMode(baggage.transportMode) as TransportMode;
          const transportImg = getTransportImage(mode);
          const blockHeader = getTransportBlockHeader(mode, lang);

          // Determine mode-specific label keys
          const companyLabelKey = mode === 'flight' ? 'airlineLabel'
            : mode === 'train' ? 'transport.train_company' as string
            : mode === 'boat' ? 'transport.ship_name' as string
            : 'transport.bus_company' as string;
          const numLabelKey = mode === 'flight' ? 'flightNumLabel'
            : mode === 'train' ? 'transport.train_number' as string
            : mode === 'boat' ? 'transport.ship_cabin' as string
            : 'transport.bus_line' as string;

          const companyValue = mode === 'flight' ? baggage.airlineName
            : mode === 'train' ? baggage.trainCompany
            : mode === 'boat' ? baggage.shipName
            : baggage.busCompany;

          const numValue = mode === 'flight' ? baggage.flightNumber
            : mode === 'train' ? baggage.trainNumber
            : mode === 'boat' ? baggage.shipCabin
            : baggage.busLineNumber;

          const hasTransportInfo = companyValue || numValue || baggage.destination || baggage.departureDate || baggage.createdAt;

          if (!hasTransportInfo) return null;

          // Get localized label: use inline i18n first, then fall back to t()
          const getLabel = (key: string) => {
            const inlineVal = i18n(key, lang);
            if (inlineVal !== key) return inlineVal;
            return t(key);
          };

          return (
            <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.15s', opacity: 0 }}>
              <h2 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: INK }}>
                <Image
                  src={transportImg}
                  alt={mode}
                  width={18}
                  height={18}
                  className="mix-blend-multiply"
                />
                <span>{blockHeader}</span>
              </h2>

              {/* Company/Airline name */}
              {companyValue && (
                <InfoRow
                  icon={TRANSPORT_ICONS[mode]}
                  label={getLabel(companyLabelKey)}
                  value={companyValue}
                />
              )}

              {/* Flight/Train/Boat/Bus number */}
              {numValue && (
                <>
                  {companyValue && <div className="border-t border-gray-100 my-2" />}
                  <InfoRow
                    icon="🎫"
                    label={getLabel(numLabelKey)}
                    value={numValue}
                    mono={mode === 'flight' || mode === 'train'}
                  />
                </>
              )}

              {/* Destination */}
              {baggage.destination && (
                <>
                  {(companyValue || numValue) && <div className="border-t border-gray-100 my-2" />}
                  <InfoRow
                    icon="📍"
                    label={i18n('destLabel', lang)}
                    value={baggage.destination}
                  />
                </>
              )}

              {/* Departure Date */}
              {(baggage.departureDate || baggage.createdAt) && (
                <>
                  {(companyValue || numValue || baggage.destination) && <div className="border-t border-gray-100 my-2" />}
                  <InfoRow
                    icon="📅"
                    label={i18n('dateLabel', lang)}
                    value={`${formatDate(baggage.departureDate || baggage.createdAt)}${baggage.departureTime ? ` — ${baggage.departureTime}` : ''}`}
                  />
                </>
              )}
            </div>
          );
        })()}

        {/* ═══ EDIT MODE: CARD 1 — Owner Info (white card) ═══ */}
        {baggage && isEditing && (
          <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ background: CARD_BG }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: INK }}>
              <span>👤</span> {i18n('ownerLabel', lang)}
            </h2>

            {/* First Name */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('finder.edit_first_name')}</label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder={t('inscrire.first_name_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Last Name */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('finder.edit_last_name')}</label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder={t('inscrire.last_name_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('finder.edit_whatsapp')}</label>
              <PhoneInput
                countryCode={editPhoneCountry}
                onCountryChange={setEditPhoneCountry}
                value={editWhatsapp}
                onChange={setEditWhatsapp}
                placeholder="6 12 34 56 78"
                className="min-h-[48px]"
              />
            </div>
          </div>
        )}

        {/* ═══ EDIT MODE: CARD 2 — Hotel Info (white card, NEW) ═══ */}
        {baggage && isEditing && (
          <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ background: CARD_BG }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: INK }}>
              <Building2 className="w-4 h-4" style={{ color: INK }} />
              {i18n('hotelLabel', lang)}
            </h2>

            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('hotelNameLabel', lang)}</label>
              <input
                type="text"
                value={editHotelName}
                onChange={(e) => setEditHotelName(e.target.value)}
                placeholder="Hilton, Mövenpick..."
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('hotelAddressLabel', lang)}</label>
              <input
                type="text"
                value={editHotelAddress}
                onChange={(e) => setEditHotelAddress(e.target.value)}
                placeholder="Ibrahim Al Jafri Street, Mecca"
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('hotelPhoneLabel', lang)}</label>
              <input
                type="text"
                value={editHotelPhone}
                onChange={(e) => setEditHotelPhone(e.target.value)}
                placeholder="+966 12 557 0000"
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('roomLabel', lang)}</label>
              <input
                type="text"
                value={editRoomNumber}
                onChange={(e) => setEditRoomNumber(e.target.value)}
                placeholder="123"
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
        )}

        {/* ═══ EDIT MODE: CARD 3 — Vol / Transport (white card, simplified — no mode selector) ═══ */}
        {baggage && isEditing && (
          <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ background: CARD_BG }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2" style={{ color: INK }}>
              <span>{safeTransportMode(baggage.transportMode) === 'train' ? '🚂' : safeTransportMode(baggage.transportMode) === 'boat' ? '🚢' : safeTransportMode(baggage.transportMode) === 'bus' ? '🚌' : '✈️'}</span> {safeTransportMode(baggage.transportMode) === 'train' ? i18n('trainLabel', lang) : safeTransportMode(baggage.transportMode) === 'boat' ? i18n('boatLabel', lang) : safeTransportMode(baggage.transportMode) === 'bus' ? i18n('busLabel', lang) : i18n('flightLabel', lang)}
            </h2>

            {/* Airline */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('airlineLabel', lang)}</label>
              <input
                type="text"
                value={editAirlineName}
                onChange={(e) => setEditAirlineName(e.target.value)}
                placeholder={t('transport.airline_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Flight Number */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('flightNumLabel', lang)}</label>
              <input
                type="text"
                value={editFlightNumber}
                onChange={(e) => setEditFlightNumber(e.target.value)}
                placeholder={t('transport.flight_number_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Destination */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('destLabel', lang)}</label>
              <input
                type="text"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
                placeholder={t('transport.common_destination_placeholder')}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Departure Date */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{i18n('dateLabel', lang)}</label>
              <input
                type="date"
                value={editDepartureDate}
                onChange={(e) => setEditDepartureDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Departure Time */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('finder.edit_departure_time')}</label>
              <input
                type="time"
                value={editDepartureTime}
                onChange={(e) => setEditDepartureTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
        )}

        {/* ═══ EDIT MODE: Action Buttons (Save + Cancel) ═══ */}
        {isEditing && (
          <div className="flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Save Button — primary dark blue */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 px-6 text-white rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[56px]"
              style={{ background: ACCENT }}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('finder.edit_saving')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('finder.edit_save')}</span>
                </>
              )}
            </button>
            {/* Cancel Button — white outline */}
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="flex-1 py-4 px-6 bg-white hover:bg-gray-50 disabled:opacity-50 border-2 border-black rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:transform-none flex items-center justify-center gap-2 min-h-[56px]"
              style={{ color: INK }}
            >
              <span>{t('finder.edit_cancel')}</span>
            </button>
          </div>
        )}

        {/* ═══ CTA + FINDER FORM (white card) ═══ */}
        <div className="w-full rounded-[18px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.2s', opacity: 0 }}>

          {/* ─── BIG "📞 Contacter le propriétaire" CTA button ─── */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg md:text-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[56px]"
              style={{ background: ACCENT }}
            >
              <Phone className="w-5 h-5" />
              <span>{i18n('ctaText', lang)}</span>
            </button>
          )}

          {/* ─── Finder Form (revealed when CTA clicked) ─── */}
          {showForm && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* Finder First name */}
              <input
                type="text"
                placeholder={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />

              {/* Finder Phone */}
              <PhoneInput
                countryCode={finderPhoneCountry}
                onCountryChange={setFinderPhoneCountry}
                value={finderPhone}
                onChange={setFinderPhone}
                placeholder="6 12 34 56 78"
                required
                className="min-h-[48px]"
              />

              {/* Location (optional — GPS is auto-captured) */}
              <div>
                <input
                  type="text"
                  placeholder={t('finder.location_placeholder')}
                  value={otherLocation}
                  onChange={(e) => setOtherLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                  style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                />
              </div>

              {/* ─── Contact choice: WhatsApp (GREEN + GPS auto) + Phone (DARK BLUE) ─── */}
              <div className="pt-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-center mb-2.5" style={{ color: INK }}>
                  {t('finder.contact_choice')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* WhatsApp Button — GREEN #25D366 + GPS auto-captured on click */}
                  <button
                    onClick={handleWhatsApp}
                    disabled={isLocating || isSubmitting}
                    className="py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-70 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[52px]"
                  >
                    {isLocating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('finder.locating')}</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('finder.sending')}</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        {t('finder.by_whatsapp')}
                      </>
                    )}
                  </button>
                  {/* Phone Button — Dark blue ACCENT + white text */}
                  <button
                    onClick={handlePhoneCall}
                    disabled={isLocating || isSubmitting}
                    className="py-3.5 px-4 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[52px] disabled:opacity-70"
                    style={{ background: ACCENT }}
                  >
                    <Phone className="w-5 h-5" />
                    {t('finder.by_phone')}
                  </button>
                </div>
                <p className="text-xs text-center mt-2.5 leading-relaxed" style={{ color: MUTED }}>
                  {t('finder.gps_auto_shared')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Trust Note ─── */}
        <div className="mt-1 mb-4 text-center text-xs tracking-wide flex items-center justify-center gap-1.5" style={{ color: 'rgba(0,0,0,0.6)' }}>
          <Shield className="w-4 h-4 inline" />
          <span>{t('finder.trust_note')}</span>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="mt-auto pb-[env(safe-area-inset-bottom,8px)] pt-4 text-center text-xs font-medium" style={{ color: 'rgba(0,0,0,0.65)' }}>
        {i18n('footer', lang)}
      </footer>

      {/* ═══ Staggered Entry Animation Keyframes ═══ */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* AI-FEATURE: Chatbot Widget (Feature #1) — only on active/lost baggage */}
      {baggage && (baggageData?.status === 'active' || baggageData?.status === 'lost') && (
        <ChatbotWidget
          reference={reference}
          baggageContext={{
            destination: baggage.destination || undefined,
            city: otherLocation || undefined,
            agency: baggage.agency || undefined,
            status: baggage.status,
            transportMode: baggage.transportMode || undefined,
          }}
          locale={lang}
          t={t}
          dir={dir}
        />
      )}
    </main>
  );
}
