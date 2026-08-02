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

// ─── Brand constants (PassHajj palette: yellow #f4b400 + white cards + black buttons) ───
const BRAND = '#f4b400';   // jaune — fond principal
const CARD_BG = '#ffffff'; // blanc — cartes
const INK = '#1a1a1a';     // noir — texte, boutons
const MUTED = '#6b7280';   // gris — texte secondaire
const INPUT_BG = '#f3f4f6'; // gris clair — inputs
const BTN_PRIMARY = '#111827'; // noir — boutons principaux

const FALLBACK_PHONE = '33745349339';

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
            <div className="text-2xl font-extrabold tracking-tight text-black">
              <span className="text-white bg-black px-2 py-0.5 rounded-md mr-1">Pass</span>Hajj
            </div>
            <div className="text-sm mt-1" style={{ color: MUTED }}>
              {isHajj ? t('inscrire.subtitle') : t('inscrire.subtitle')}
            </div>
          </div>
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        {/* ─── White Card ─── */}
        <div
          className="rounded-[20px] p-6 md:p-8 text-center shadow-lg"
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
        className="max-w-md w-full rounded-[20px] p-6 md:p-8 text-center shadow-lg"
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

// ─── Info Encart Helper (light gray bg, for white cards) ───
function InfoEncart({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-xl p-3 mb-2.5 last:mb-0 ${className}`} style={{ background: INPUT_BG }}>
      {children}
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

  // NOTE: GPS sharing now happens inline inside handleWhatsApp (silent fallback to manual location).
  // The dedicated "Partager ma position GPS" button was removed per refonte-6 brief.

  // Generate WhatsApp message — new template (refonte-7): friendly notification to the owner
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

    // Build message using the template (refonte-7)
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
  // sharedPos/locText are passed as params (no longer state) — GPS is captured inline in handleWhatsApp.
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
      // Use api.whatsapp.com directly instead of wa.me — wa.me corrupts 4-byte UTF-8 emojis (🎉📍👤📞💬👉💪)
      // during its redirect to api.whatsapp.com (replaces them with U+FFFD replacement character).
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

  // NOTE: validateFinderForm was removed — validation is now inlined in handleWhatsApp/handlePhoneCall.
  // Location is no longer required (GPS is auto-captured inside handleWhatsApp).

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
  // ─── MAIN RENDER — Yellow bg + White cards + Black accents (PassHajj design) ───
  // ═══════════════════════════════════════════════════════════════
  return (
    <main
      className="min-h-screen flex flex-col px-4 sm:px-5 md:px-8 pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: BRAND }}
      dir={dir}
    >
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between pt-[env(safe-area-inset-top,0px)] px-0 py-2 sm:py-3 md:py-4" style={{ background: BRAND }}>
        {/* ✏️ Modifier button — visible only for active/lost baggage */}
        {baggage && (baggageData?.status === 'active' || baggageData?.status === 'lost') && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-black/10 rounded-full text-sm font-bold hover:bg-white/80 transition-colors min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
            style={{ color: INK }}
          >
            <span>{t('finder.edit_btn')}</span>
          </button>
        )}
        {isEditing && (
          <div className="font-bold text-sm sm:text-base" style={{ color: INK }}>
            {t('finder.edit_title')}
          </div>
        )}
        {(!baggage || (baggageData?.status !== 'active' && baggageData?.status !== 'lost')) && <div />}
        <LanguageSelector lang={lang} setLang={setLang} />
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

        {/* ═══ 🏷️ TITRE : ✅ BAGAGE TROUVÉ ═══ */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight" style={{ color: INK }}>
            {isDeclaredLost
              ? `🚨 ${t('finder.lost_badge')}`
              : `✅ ${t('finder.success_badge')}`}
          </h1>
          <p className="mt-2 text-sm md:text-base leading-relaxed max-w-md mx-auto" style={{ color: MUTED }}>
            {isDeclaredLost
              ? t('finder.lost_description')
              : t('finder.bagage_trouve_desc')}
          </p>
        </div>

        {/* ═══ 🟦 BLOC 1 : IDENTITÉ PROPRIÉTAIRE (white card) ═══ */}
        {baggage && !isEditing && (
          <div className="w-full rounded-[20px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
              <span>👤</span> {t('finder.owner_section')}
            </h2>

            {/* Full Name — kept */}
            <InfoEncart>
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: MUTED }}>{t('finder.fullName')}</p>
                  <p className="text-base md:text-lg font-bold" style={{ color: INK }}>{baggage.travelerName || t('finder.notSet')}</p>
                </div>
              </div>
            </InfoEncart>

            {/* NOTE: Agency + Baggage Type REMOVED per refonte-4 brief */}

            {/* Contact — Secured (NEVER show WhatsApp number) */}
            <InfoEncart className="mb-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: MUTED }}>{t('finder.contact_label')}</p>
                  <p className="text-base font-bold" style={{ color: INK }}>{t('finder.secure_contact')}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{t('finder.contact_reveal_note')}</p>
                </div>
              </div>
            </InfoEncart>
          </div>
        )}

        {/* ═══ 🟦 EDIT MODE: BLOC 1 — Owner Info (white card) ═══ */}
        {baggage && isEditing && (
          <div className="w-full rounded-[20px] p-5 md:p-6 mb-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ background: CARD_BG }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
              <span>👤</span> {t('finder.owner_section')}
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

        {/* ═══ 🟦 BLOC 2 : DÉTAILS DU VOYAGE (white card, transport images) ═══ */}
        {baggage && !isEditing && (() => {
          const mode = safeTransportMode(baggage.transportMode) as TransportMode;
          const transportImg = getTransportImage(mode);
          const blockHeader = getTransportBlockHeader(mode, lang);

          return (
            <div className="w-full rounded-[20px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG }}>
              <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
                <Image
                  src={transportImg}
                  alt={mode}
                  width={18}
                  height={18}
                  className="mix-blend-multiply"
                />
                <span>{blockHeader}</span>
              </h2>

              {/* TRANSPORT-FEATURE: Flight info */}
              {mode === 'flight' && (baggage.airlineName || baggage.flightNumber) && (
                <InfoEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.airlineName && (
                        <div className="mb-1.5">
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.airline')}</p>
                          <p className="text-base font-bold" style={{ color: INK }}>{baggage.airlineName}</p>
                        </div>
                      )}
                      {baggage.flightNumber && (
                        <div>
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.flight_number')}</p>
                          <p className="text-xl font-bold font-mono tracking-widest" style={{ color: INK }}>{baggage.flightNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#fef3c7] border border-[#f4b400]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="flight"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </InfoEncart>
              )}

              {/* TRANSPORT-FEATURE: Train info */}
              {mode === 'train' && (baggage.trainCompany || baggage.trainNumber) && (
                <InfoEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.trainCompany && (
                        <div className="mb-1.5">
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.train_company')}</p>
                          <p className="text-base font-bold" style={{ color: INK }}>{baggage.trainCompany}</p>
                        </div>
                      )}
                      {baggage.trainNumber && (
                        <div>
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.train_number')}</p>
                          <p className="text-xl font-bold font-mono tracking-widest" style={{ color: INK }}>{baggage.trainNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#fef3c7] border border-[#f4b400]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="train"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </InfoEncart>
              )}

              {/* TRANSPORT-FEATURE: Boat info */}
              {mode === 'boat' && (baggage.shipName || baggage.shipCabin) && (
                <InfoEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.shipName && (
                        <div className="mb-1.5">
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.ship_name')}</p>
                          <p className="text-base font-bold" style={{ color: INK }}>{baggage.shipName}</p>
                        </div>
                      )}
                      {baggage.shipCabin && (
                        <div>
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.ship_cabin')}</p>
                          <p className="text-base font-bold" style={{ color: INK }}>{baggage.shipCabin}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#fef3c7] border border-[#f4b400]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="boat"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </InfoEncart>
              )}

              {/* TRANSPORT-FEATURE: Bus info */}
              {mode === 'bus' && (baggage.busCompany || baggage.busLineNumber) && (
                <InfoEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.busCompany && (
                        <div className="mb-1.5">
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.bus_company')}</p>
                          <p className="text-base font-bold" style={{ color: INK }}>{baggage.busCompany}</p>
                        </div>
                      )}
                      {baggage.busLineNumber && (
                        <div>
                          <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.bus_line')}</p>
                          <p className="text-base font-bold" style={{ color: INK }}>{baggage.busLineNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#fef3c7] border border-[#f4b400]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="bus"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </InfoEncart>
              )}

              {/* Destination */}
              {baggage.destination && (
                <InfoEncart>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.common_destination')}</p>
                      <p className="text-base font-bold" style={{ color: INK }}>{baggage.destination}</p>
                    </div>
                  </div>
                </InfoEncart>
              )}

              {/* Departure Date */}
              {(baggage.departureDate || baggage.createdAt) && (
                <InfoEncart className="mb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: MUTED }}>{t('transport.common_departure_date')}</p>
                      <p className="text-base font-bold" style={{ color: INK }}>
                        {formatDate(baggage.departureDate || baggage.createdAt)}{baggage.departureTime ? ` — ${baggage.departureTime}` : ''}
                      </p>
                    </div>
                  </div>
                </InfoEncart>
              )}
            </div>
          );
        })()}

        {/* ═══ 🟦 EDIT MODE: BLOC 2 — Transport Details (white card) ═══ */}
        {baggage && isEditing && (
          <div className="w-full rounded-[20px] p-5 md:p-6 mb-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ background: CARD_BG }}>
            <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
              <span>✈️</span> {t('finder.edit_transport_mode')}
            </h2>

            {/* Transport Mode Selector */}
            <div className="mb-4">
              <TransportModeSelector
                selectedMode={editTransportMode}
                onSelect={setEditTransportMode}
                t={t}
                lang={lang}
              />
            </div>

            {/* Flight-specific fields */}
            {editTransportMode === 'flight' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.airline')}</label>
                  <input
                    type="text"
                    value={editAirlineName}
                    onChange={(e) => setEditAirlineName(e.target.value)}
                    placeholder={t('transport.airline_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.flight_number')}</label>
                  <input
                    type="text"
                    value={editFlightNumber}
                    onChange={(e) => setEditFlightNumber(e.target.value)}
                    placeholder={t('transport.flight_number_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            )}

            {/* Train-specific fields */}
            {editTransportMode === 'train' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.train_company')}</label>
                  <input
                    type="text"
                    value={editTrainCompany}
                    onChange={(e) => setEditTrainCompany(e.target.value)}
                    placeholder={t('transport.train_company_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.train_number')}</label>
                  <input
                    type="text"
                    value={editTrainNumber}
                    onChange={(e) => setEditTrainNumber(e.target.value)}
                    placeholder={t('transport.train_number_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            )}

            {/* Boat-specific fields */}
            {editTransportMode === 'boat' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.ship_name')}</label>
                  <input
                    type="text"
                    value={editShipName}
                    onChange={(e) => setEditShipName(e.target.value)}
                    placeholder={t('transport.ship_name_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.ship_cabin')}</label>
                  <input
                    type="text"
                    value={editShipCabin}
                    onChange={(e) => setEditShipCabin(e.target.value)}
                    placeholder={t('transport.ship_cabin_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            )}

            {/* Bus-specific fields */}
            {editTransportMode === 'bus' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.bus_company')}</label>
                  <input
                    type="text"
                    value={editBusCompany}
                    onChange={(e) => setEditBusCompany(e.target.value)}
                    placeholder={t('transport.bus_company_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('transport.bus_line')}</label>
                  <input
                    type="text"
                    value={editBusLineNumber}
                    onChange={(e) => setEditBusLineNumber(e.target.value)}
                    placeholder={t('transport.bus_line_placeholder')}
                    className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            )}

            {/* Destination — common to all modes */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('finder.edit_destination')}</label>
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
              <label className="text-xs font-medium mb-1 block" style={{ color: MUTED }}>{t('finder.edit_departure_date')}</label>
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

        {/* ═══ 🟦 EDIT MODE: Action Buttons (Save + Cancel) ═══ */}
        {isEditing && (
          <div className="flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Save Button — primary black */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 px-6 text-white rounded-[14px] font-bold text-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[56px]"
              style={{ background: BTN_PRIMARY }}
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

        {/* ═══ 🟡 BLOC 3 : ENCART FINDER (white card) ═══ */}
        <div className="w-full rounded-[20px] p-5 md:p-6 mb-4 shadow-lg" style={{ background: CARD_BG }}>

          {/* ─── 1. BIG "📞 Contacter le propriétaire" CTA button (FIRST) ─── */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-lg md:text-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[56px]"
              style={{ background: BTN_PRIMARY }}
            >
              <Phone className="w-5 h-5" />
              <span>{t('finder.contact_owner_cta')}</span>
            </button>
          )}

          {/* ─── 2 + 3. Form (revealed when CTA clicked): GPS button + form fields ─── */}
          {showForm && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* GPS Success/Error indicators + dedicated GPS button REMOVED per refonte-6 brief.
                  GPS is now captured automatically inside the WhatsApp button click (silent fallback to manual location). */}

              {/* ─── Form fields: prénom, téléphone, lieu ─── */}

              {/* First name */}
              <input
                type="text"
                placeholder={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f4b400] focus:border-transparent transition-all min-h-[48px]"
                    style={{ background: INPUT_BG, color: INK, border: '1px solid #d1d5db' }}
              />

              {/* Phone (PhoneInput with dark=false but on yellow bg → white input) */}
              <PhoneInput
                countryCode={finderPhoneCountry}
                onCountryChange={setFinderPhoneCountry}
                value={finderPhone}
                onChange={setFinderPhone}
                placeholder="6 12 34 56 78"
                required
                className="min-h-[48px]"
              />

              {/* Location */}
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

              {/* ─── Contact choice: WhatsApp (GREEN + GPS auto) + Phone (BLACK) ─── */}
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
                  {/* Phone Button — BLACK + white text (consistent with primary CTA) */}
                  <button
                    onClick={handlePhoneCall}
                    disabled={isLocating || isSubmitting}
                    className="py-3.5 px-4 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[52px] disabled:opacity-70"
                    style={{ background: BTN_PRIMARY }}
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
