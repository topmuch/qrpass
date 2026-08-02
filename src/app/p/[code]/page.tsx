'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Shield,
  Phone,
  MapPin,
  MessageCircle,
  Navigation,
  Send,
  Heart,
  Building2,
  Globe,
  Pencil,
  X,
  Check,
  RotateCcw,
  Droplets,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Brand constants ───
const BG = '#f4b400';
const CARD_BG = '#ffffff';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const DANGER = '#dc2626';
const SUCCESS = '#16a34a';
const WA_GREEN = '#25D366';
const RADIUS = '20px';
const SHADOW = '0 6px 20px rgba(0,0,0,0.12)';

// ─── Pilgrim data interface ───
interface PilgrimData {
  id: string;
  qrCode: string;
  fullName: string;
  nationality: string;
  photoUrl: string | null;
  bloodType: string | null;
  medicalInfo: string | null;
  hotelMecca: string | null;
  roomMecca: string | null;
  hotelMedina: string | null;
  roomMedina: string | null;
  hotelCoords: { lat: number; lng: number } | string | null;
  groupLeaderPhone: string | null;
  agencyPhone: string | null;
  familyContact: string | null;
  alNusukDocUrl: string | null;
  isActive: boolean;
  duration: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  reports: ReportData[];
}

interface ReportData {
  id: string;
  finderName: string;
  finderPhone: string;
  latitude: number | null;
  longitude: number | null;
  message: string | null;
  createdAt: string;
}

type PageState = 'loading' | 'active' | 'not_found' | 'not_activated' | 'expired' | 'error';

// ─── i18n translations ───
const translations = {
  fr: {
    banner: "🚨 FICHE D'URGENCE / EMERGENCY / طوارئ",
    medTitle: 'INFOS MÉDICALES CRITIQUES',
    medNote: '⚠️ Ces informations sont vitales en cas d\'urgence.',
    hotelTitle: 'HÉBERGEMENT ACTUEL',
    mapBtn: 'Ouvrir dans Maps',
    waBtn: 'Contacter Chef (WhatsApp)',
    callHotel: 'Appeler Hôtel',
    callFamily: 'Appeler Famille',
    gpsBtn: 'Partager ma position GPS',
    gpsLocating: 'Localisation...',
    gpsSent: 'Envoyé !',
    emerTitle: '🇸🇦 NUMÉROS D\'URGENCE SAOUDIENS',
    footer: '© 2026 PassHajj • Données accessibles uniquement en cas d\'urgence',
    notFound: 'Code QR non reconnu',
    notFoundDesc: 'Ce code ne correspond à aucun bracelet Pass Identity enregistré.',
    notActivated: 'Bracelet non activé',
    notActivatedDesc: 'Ce bracelet n\'a pas encore été activé par son propriétaire.',
    activate: 'Activer ce bracelet',
    activateNow: 'Activer maintenant',
    expired: 'Bracelet expiré',
    expiredDesc: 'La période de validité de ce bracelet est terminée.',
    error: 'Erreur',
    errorDesc: 'Une erreur est survenue. Veuillez réessayer.',
    edit: 'Modifier',
    cancel: 'Annuler',
    save: 'Enregistrer',
    report: 'Signaler ce pèlerin',
    reportBtn: 'Envoyer le signalement',
    reportName: 'Votre nom',
    reportPhone: 'Votre WhatsApp',
    reportMsg: 'Message (optionnel)',
    reportSuccess: 'Signalement envoyé !',
    noMedical: 'Aucune information médicale renseignée',
    mecca: 'La Mecque',
    medina: 'Médine',
    room: 'Chambre',
    noHotel: 'Non renseigné',
  },
  en: {
    banner: '🚨 EMERGENCY PROFILE / FICHE D\'URGENCE / طوارئ',
    medTitle: 'CRITICAL MEDICAL INFO',
    medNote: '⚠️ Vital information for emergencies.',
    hotelTitle: 'CURRENT ACCOMMODATION',
    mapBtn: 'Open in Maps',
    waBtn: 'Contact Leader (WhatsApp)',
    callHotel: 'Call Hotel',
    callFamily: 'Call Family',
    gpsBtn: 'Share My GPS Location',
    gpsLocating: 'Locating...',
    gpsSent: 'Sent!',
    emerTitle: '🇸🇦 SAUDI EMERGENCY NUMBERS',
    footer: '© 2026 PassHajj • Data accessible only in emergencies',
    notFound: 'QR code not recognized',
    notFoundDesc: 'This code does not match any registered Pass Identity bracelet.',
    notActivated: 'Bracelet not activated',
    notActivatedDesc: 'This bracelet has not yet been activated by its owner.',
    activate: 'Activate this bracelet',
    activateNow: 'Activate now',
    expired: 'Bracelet expired',
    expiredDesc: 'The validity period of this bracelet has ended.',
    error: 'Error',
    errorDesc: 'An error occurred. Please try again.',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save',
    report: 'Report this pilgrim',
    reportBtn: 'Send report',
    reportName: 'Your name',
    reportPhone: 'Your WhatsApp',
    reportMsg: 'Message (optional)',
    reportSuccess: 'Report sent!',
    noMedical: 'No medical information provided',
    mecca: 'Mecca',
    medina: 'Medina',
    room: 'Room',
    noHotel: 'Not specified',
  },
  ar: {
    banner: '🚨 طوارئ / EMERGENCY / FICHE D\'URGENCE',
    medTitle: 'معلومات طبية حرجة',
    medNote: '⚠️ معلومات حيوية في حالات الطوارئ.',
    hotelTitle: 'الإقامة الحالية',
    mapBtn: 'فتح في الخرائط',
    waBtn: 'اتصال بالقائد (واتساب)',
    callHotel: 'اتصال بالفندق',
    callFamily: 'اتصال بالعائلة',
    gpsBtn: 'مشاركة موقعي GPS',
    gpsLocating: 'جاري التحديد...',
    gpsSent: 'تم الإرسال!',
    emerTitle: '🇸🇦 أرقام الطوارئ السعودية',
    footer: '© 2026 PassHajj • البيانات متاحة فقط في حالات الطوارئ',
    notFound: 'رمز QR غير معروف',
    notFoundDesc: 'هذا الرمز لا يتطابق مع أي سوار Pass Identity مسجل.',
    notActivated: 'السوار غير مفعّل',
    notActivatedDesc: 'لم يتم تفعيل هذا السوار بعد من قبل مالكه.',
    activate: 'تفعيل هذا السوار',
    activateNow: 'تفعيل الآن',
    expired: 'السوار منتهي الصلاحية',
    expiredDesc: 'انتهت فترة صلاحية هذا السوار.',
    error: 'خطأ',
    errorDesc: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    edit: 'تعديل',
    cancel: 'إلغاء',
    save: 'حفظ',
    report: 'الإبلاغ عن هذا الحاج',
    reportBtn: 'إرسال البلاغ',
    reportName: 'اسمك',
    reportPhone: 'الواتساب الخاص بك',
    reportMsg: 'رسالة (اختياري)',
    reportSuccess: 'تم إرسال البلاغ!',
    noMedical: 'لا توجد معلومات طبية',
    mecca: 'مكة المكرمة',
    medina: 'المدينة المنورة',
    room: 'غرفة',
    noHotel: 'غير محدد',
  },
};

type Lang = 'fr' | 'en' | 'ar';

// ─── Helper: Parse hotelCoords ───
function parseCoords(coords: { lat: number; lng: number } | string | null): { lat: number; lng: number } | null {
  if (!coords) return null;
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return { lat: coords.lat, lng: coords.lng };
  }
  if (typeof coords === 'string') {
    try {
      const parsed = JSON.parse(coords);
      if (parsed && typeof parsed === 'object' && 'lat' in parsed && 'lng' in parsed) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {
      // Try comma-separated
      const parts = coords.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    }
  }
  return null;
}

// ─── Helper: Clean phone for WhatsApp ───
function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '').replace(/^\+/g, '');
}

// ─── Default Mecca coords (Kaaba) ───
const DEFAULT_LAT = 21.4225;
const DEFAULT_LNG = 39.8262;

export default function PilgrimScanPage() {
  const { code } = useParams<{ code: string }>();

  // ─── State ───
  const [state, setState] = useState<PageState>('loading');
  const [pilgrim, setPilgrim] = useState<PilgrimData | null>(null);
  const [lang, setLang] = useState<Lang>('fr');

  // ─── Report state ───
  const [showReport, setShowReport] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportPhone, setReportPhone] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLng, setReportLng] = useState<number | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // ─── Edit state ───
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editNationality, setEditNationality] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editMedicalInfo, setEditMedicalInfo] = useState('');
  const [editHotelMecca, setEditHotelMecca] = useState('');
  const [editRoomMecca, setEditRoomMecca] = useState('');
  const [editHotelMedina, setEditHotelMedina] = useState('');
  const [editRoomMedina, setEditRoomMedina] = useState('');
  const [editGroupLeaderPhone, setEditGroupLeaderPhone] = useState('');
  const [editFamilyContact, setEditFamilyContact] = useState('');

  // ─── GPS state ───
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'sent' | 'error'>('idle');

  // ─── i18n helper ───
  const t = (key: string): string => {
    return (translations[lang] as Record<string, string>)[key] || key;
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // ─── Toggle language ───
  const toggleLang = () => {
    const langs: Lang[] = ['fr', 'en', 'ar'];
    setLang(langs[(langs.indexOf(lang) + 1) % 3]);
  };

  // ─── Fetch pilgrim data ───
  useEffect(() => {
    if (!code) return;

    const fetchPilgrim = async () => {
      try {
        const res = await fetch(`/api/pilgrims/${code}`);
        const data = await res.json();

        if (data.status === 'not_found') {
          setState('not_found');
          return;
        }

        if (data.status === 'not_activated') {
          setState('not_activated');
          return;
        }

        if (data.status === 'expired') {
          setState('expired');
          return;
        }

        if (data.pilgrim) {
          setPilgrim(data.pilgrim);
          setState('active');
          // Pre-fill edit state
          const p = data.pilgrim;
          setEditFullName(p.fullName || '');
          setEditNationality(p.nationality || '');
          setEditBloodType(p.bloodType || '');
          setEditMedicalInfo(p.medicalInfo || '');
          setEditHotelMecca(p.hotelMecca || '');
          setEditRoomMecca(p.roomMecca || '');
          setEditHotelMedina(p.hotelMedina || '');
          setEditRoomMedina(p.roomMedina || '');
          setEditGroupLeaderPhone(p.groupLeaderPhone || '');
          setEditFamilyContact(p.familyContact || '');
          return;
        }

        setState('error');
      } catch {
        setState('error');
      }
    };

    fetchPilgrim();
  }, [code]);

  // ─── Save handler ───
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/pilgrims/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          nationality: editNationality.trim(),
          bloodType: editBloodType || null,
          medicalInfo: editMedicalInfo || null,
          hotelMecca: editHotelMecca || null,
          roomMecca: editRoomMecca || null,
          hotelMedina: editHotelMedina || null,
          roomMedina: editRoomMedina || null,
          groupLeaderPhone: editGroupLeaderPhone || null,
          familyContact: editFamilyContact || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setPilgrim(data.pilgrim);
      setIsEditing(false);
      toast({ title: 'Informations mises à jour !' });
    } catch {
      toast({ title: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Cancel edit ───
  const handleCancelEdit = () => {
    if (pilgrim) {
      setEditFullName(pilgrim.fullName || '');
      setEditNationality(pilgrim.nationality || '');
      setEditBloodType(pilgrim.bloodType || '');
      setEditMedicalInfo(pilgrim.medicalInfo || '');
      setEditHotelMecca(pilgrim.hotelMecca || '');
      setEditRoomMecca(pilgrim.roomMecca || '');
      setEditHotelMedina(pilgrim.hotelMedina || '');
      setEditRoomMedina(pilgrim.roomMedina || '');
      setEditGroupLeaderPhone(pilgrim.groupLeaderPhone || '');
      setEditFamilyContact(pilgrim.familyContact || '');
    }
    setIsEditing(false);
  };

  // ─── GPS sharing ───
  const handleShareGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReportLat(pos.coords.latitude);
        setReportLng(pos.coords.longitude);
        const leaderPhone = pilgrim?.groupLeaderPhone;
        if (leaderPhone) {
          const msg = encodeURIComponent(
            `📍 Position Pèlerin: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
          );
          window.open(`https://wa.me/${cleanPhone(leaderPhone)}?text=${msg}`, '_blank');
        }
        setGpsStatus('sent');
        setTimeout(() => setGpsStatus('idle'), 2000);
      },
      () => {
        setGpsStatus('error');
        setTimeout(() => setGpsStatus('idle'), 2000);
      }
    );
  }, [pilgrim]);

  // ─── Submit report ───
  const handleSubmitReport = useCallback(async () => {
    if (!reportName.trim() || !reportPhone.trim()) return;

    setReportSubmitting(true);
    try {
      const res = await fetch('/api/pilgrims/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilgrimQrCode: code,
          finderName: reportName.trim(),
          finderPhone: reportPhone.trim(),
          latitude: reportLat,
          longitude: reportLng,
          message: reportMessage.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Report failed');
      const data = await res.json();
      setReportSuccess(true);

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    } catch {
      toast({ title: 'Erreur lors du signalement', variant: 'destructive' });
    } finally {
      setReportSubmitting(false);
    }
  }, [code, reportName, reportPhone, reportMessage, reportLat, reportLng]);

  // ─── Computed values ───
  const coords = parseCoords(pilgrim?.hotelCoords ?? null);
  const hotelLat = coords?.lat ?? DEFAULT_LAT;
  const hotelLng = coords?.lng ?? DEFAULT_LNG;

  const whatsappLeaderUrl = pilgrim?.groupLeaderPhone
    ? `https://wa.me/${cleanPhone(pilgrim.groupLeaderPhone)}?text=${encodeURIComponent(
        `🆘 Pass Identity — ${pilgrim.fullName}\nCode: ${pilgrim.qrCode}`
      )}`
    : null;

  const hotelMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotelLat},${hotelLng}&travelmode=walking`;

  // Determine which hotel to show (Mecca first, then Medina)
  const activeHotel = pilgrim?.hotelMecca || pilgrim?.hotelMedina;
  const activeRoom = pilgrim?.hotelMecca ? pilgrim.roomMecca : pilgrim?.roomMedina;
  const activeCity = pilgrim?.hotelMecca ? t('mecca') : pilgrim?.hotelMedina ? t('medina') : null;

  // ─── Common input styles ───
  const inputClass =
    'w-full h-12 px-4 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border';
  const inputStyle = { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' };

  return (
    <main
      dir={dir}
      className="min-h-screen flex flex-col items-center px-4 py-6"
      style={{ background: BG, color: TEXT }}
    >
      {/* ═══════════════════════════════════════════════════════════
          LOADING STATE
      ═══════════════════════════════════════════════════════════ */}
      {state === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full" />
          <p className="font-medium">PassHajj…</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NOT FOUND STATE
      ═══════════════════════════════════════════════════════════ */}
      {state === 'not_found' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold">{t('notFound')}</h2>
          <p className="text-sm" style={{ color: MUTED }}>{t('notFoundDesc')}</p>
          <div className="p-4 bg-black/5 rounded-xl w-full mt-2">
            <p className="text-xs font-mono break-all" style={{ color: MUTED }}>{code}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NOT ACTIVATED STATE — QRTAGS Design
      ═══════════════════════════════════════════════════════════ */}
      {state === 'not_activated' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Logo */}
          <div className="text-[28px] font-extrabold tracking-tight text-black mb-8">
            <span className="text-white bg-black px-2.5 py-1 rounded-lg mr-1.5">Pass</span>Hajj
          </div>

          {/* Card */}
          <div className="w-full max-w-[400px] text-center">
            <div
              className="rounded-[24px] p-8 mb-6"
              style={{ background: CARD_BG, boxShadow: SHADOW }}
            >
              {/* Icon circle */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: '#fff3cd' }}
              >
                <AlertCircle className="w-10 h-10" style={{ color: '#f4b400' }} />
              </div>

              {/* Title */}
              <h1 className="text-[22px] font-extrabold leading-tight mb-3">
                {t('notActivated')}
              </h1>

              {/* Description */}
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: MUTED }}>
                {t('notActivatedDesc')}
              </p>

              {/* QR Code display */}
              <div
                className="py-3 px-4 rounded-xl mb-6 font-mono font-bold text-base tracking-wider border border-dashed"
                style={{ background: '#f3f4f6', color: '#333', borderColor: '#d1d5db' }}
              >
                ID: {code}
              </div>

              {/* Activate button */}
              <Link
                href={`/activate/identity?code=${encodeURIComponent(code)}`}
                className="w-full py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: '#111827', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <Shield className="w-5 h-5" />
                {t('activateNow')}
              </Link>

              {/* Help button */}
              <Link
                href="/contact"
                className="w-full py-4 rounded-[14px] font-bold text-base flex items-center justify-center gap-2 mt-3 border-2 border-gray-200 bg-transparent hover:border-black hover:text-black transition-colors"
                style={{ color: '#666' }}
              >
                ? Besoin d&apos;aide ?
              </Link>
            </div>

            {/* Footer */}
            <div className="text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
              Propulsé par <strong>PassHajj</strong> ·{' '}
              <Link href="/confidentialite" className="text-black font-semibold">Confidentialité</Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          EXPIRED STATE
      ═══════════════════════════════════════════════════════════ */}
      {state === 'expired' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold">{t('expired')}</h2>
          <p className="text-sm" style={{ color: MUTED }}>{t('expiredDesc')}</p>
          <div className="p-4 bg-black/5 rounded-xl w-full mt-2">
            <p className="text-xs font-mono break-all" style={{ color: MUTED }}>{code}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ERROR STATE
      ═══════════════════════════════════════════════════════════ */}
      {state === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold">{t('error')}</h2>
          <p className="text-sm" style={{ color: MUTED }}>{t('errorDesc')}</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ACTIVE STATE — Full Emergency Profile
      ═══════════════════════════════════════════════════════════ */}
      {state === 'active' && pilgrim && (
        <>
          {/* ─── TOP BAR ─── */}
          <div className="w-full max-w-[460px] flex justify-between items-center mb-5">
            <div className="text-2xl font-extrabold tracking-tight text-black">
              <span className="text-white bg-black px-2 py-0.5 rounded-md mr-1">Pass</span>Hajj
            </div>
            <button
              onClick={toggleLang}
              className="bg-white/30 border-none px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1 hover:bg-white/50 transition-colors"
              style={{ color: TEXT }}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang.toUpperCase()}
            </button>
          </div>

          {/* ─── EMERGENCY BANNER ─── */}
          <div
            className="w-full max-w-[460px] text-white py-3 px-4 rounded-xl text-center font-bold text-sm mb-4"
            style={{
              background: isEditing ? '#059669' : DANGER,
              boxShadow: isEditing ? '0 4px 12px rgba(5,150,105,0.3)' : '0 4px 12px rgba(220,38,38,0.3)',
              animation: isEditing ? 'none' : 'pulse 2s infinite',
            }}
          >
            {isEditing ? '✏️ Mode Édition' : t('banner')}
          </div>

          {/* ─── EDIT MODE ─── */}
          {isEditing ? (
            <div className="w-full max-w-[460px] space-y-4">
              {/* Edit Identity Card */}
              <div
                className="rounded-[20px] p-5"
                style={{ background: CARD_BG, boxShadow: SHADOW }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Pencil className="w-5 h-5" style={{ color: '#059669' }} />
                    Identité
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-2 rounded-xl text-sm font-semibold border-2 border-black bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1 disabled:opacity-50"
                      style={{ background: '#059669' }}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {t('save')}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nom complet *</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nationalité *</label>
                    <input
                      type="text"
                      value={editNationality}
                      onChange={(e) => setEditNationality(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Groupe Sanguin</label>
                    <select
                      value={editBloodType}
                      onChange={(e) => setEditBloodType(e.target.value)}
                      className={inputClass}
                      style={{ ...inputStyle, appearance: 'none' }}
                    >
                      <option value="">—</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Infos Médicales</label>
                    <textarea
                      value={editMedicalInfo}
                      onChange={(e) => setEditMedicalInfo(e.target.value)}
                      placeholder="Allergies, maladies chroniques..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border resize-none"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Hôtel (La Mecque)</label>
                    <input
                      type="text"
                      value={editHotelMecca}
                      onChange={(e) => setEditHotelMecca(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Chambre (La Mecque)</label>
                    <input
                      type="text"
                      value={editRoomMecca}
                      onChange={(e) => setEditRoomMecca(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Hôtel (Médine)</label>
                    <input
                      type="text"
                      value={editHotelMedina}
                      onChange={(e) => setEditHotelMedina(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Chambre (Médine)</label>
                    <input
                      type="text"
                      value={editRoomMedina}
                      onChange={(e) => setEditRoomMedina(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">WhatsApp Chef de Groupe</label>
                    <input
                      type="tel"
                      value={editGroupLeaderPhone}
                      onChange={(e) => setEditGroupLeaderPhone(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Téléphone Famille</label>
                    <input
                      type="tel"
                      value={editFamilyContact}
                      onChange={(e) => setEditFamilyContact(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ─── PROFILE CARD ─── */}
              <div
                className="w-full max-w-[460px] rounded-[20px] p-6 text-center mb-4"
                style={{ background: CARD_BG, boxShadow: SHADOW }}
              >
                {/* Photo */}
                {pilgrim.photoUrl ? (
                  <img
                    src={pilgrim.photoUrl}
                    alt={pilgrim.fullName}
                    className="w-[110px] h-[110px] rounded-full object-cover border-4 border-white mx-auto mb-3"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  />
                ) : (
                  <div
                    className="w-[110px] h-[110px] rounded-full bg-gray-200 flex items-center justify-center text-4xl mx-auto mb-3 border-4 border-white"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    👤
                  </div>
                )}

                {/* Name */}
                <h1 className="text-[22px] font-extrabold mb-1">{pilgrim.fullName}</h1>

                {/* Meta tags */}
                <div className="flex justify-center gap-2 flex-wrap mt-2">
                  {pilgrim.nationality && pilgrim.nationality !== 'Non spécifié' && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">
                      🇸🇳 {pilgrim.nationality}
                    </span>
                  )}
                  {pilgrim.bloodType && (
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                      🩸 {pilgrim.bloodType}
                    </span>
                  )}
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
                  style={{ color: TEXT }}
                >
                  <Pencil className="w-4 h-4" />
                  {t('edit')}
                </button>
              </div>

              {/* ─── MEDICAL INFO CARD ─── */}
              <div
                className="w-full max-w-[460px] rounded-[20px] p-5 mb-3"
                style={{
                  background: CARD_BG,
                  boxShadow: SHADOW,
                  borderLeft: lang === 'ar' ? 'none' : '4px solid #dc2626',
                  borderRight: lang === 'ar' ? '4px solid #dc2626' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-3 font-bold text-base">
                  <Heart className="w-5 h-5" style={{ color: DANGER }} />
                  <span>{t('medTitle')}</span>
                </div>
                <div>
                  {pilgrim.medicalInfo ? (
                    <p className="font-bold text-base" style={{ color: DANGER }}>
                      {pilgrim.medicalInfo}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: MUTED }}>
                      {t('noMedical')}
                    </p>
                  )}
                  <p className="text-sm mt-2" style={{ color: MUTED }}>
                    {t('medNote')}
                  </p>
                </div>
              </div>

              {/* ─── HOTEL INFO CARD ─── */}
              <div
                className="w-full max-w-[460px] rounded-[20px] p-5 mb-3"
                style={{
                  background: CARD_BG,
                  boxShadow: SHADOW,
                  borderLeft: lang === 'ar' ? 'none' : '4px solid #3b82f6',
                  borderRight: lang === 'ar' ? '4px solid #3b82f6' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-3 font-bold text-base">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <span>{t('hotelTitle')}</span>
                </div>
                <div>
                  {activeHotel ? (
                    <>
                      <p className="font-bold text-base">{activeHotel}</p>
                      <p className="text-sm" style={{ color: MUTED }}>
                        {activeRoom ? `${t('room')} ${activeRoom} • ` : ''}{activeCity}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: MUTED }}>{t('noHotel')}</p>
                  )}
                  <a
                    href={hotelMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: '#3b82f6' }}
                  >
                    <MapPin className="w-4 h-4" />
                    {t('mapBtn')}
                  </a>
                </div>
              </div>

              {/* ─── ACTION BUTTONS GRID ─── */}
              <div className="w-full max-w-[460px] grid grid-cols-2 gap-3 mb-3">
                {/* WhatsApp Leader */}
                {whatsappLeaderUrl && (
                  <a
                    href={whatsappLeaderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 py-3.5 rounded-[14px] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: WA_GREEN }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('waBtn')}
                  </a>
                )}

                {/* Call Family */}
                {pilgrim.familyContact && (
                  <a
                    href={`tel:+${cleanPhone(pilgrim.familyContact)}`}
                    className="py-3.5 rounded-[14px] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: '#3b82f6' }}
                  >
                    <Phone className="w-4 h-4" />
                    {t('callFamily')}
                  </a>
                )}

                {/* GPS Button */}
                <button
                  onClick={handleShareGPS}
                  disabled={gpsStatus === 'locating'}
                  className="col-span-2 py-3.5 rounded-[14px] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#f59e0b' }}
                >
                  <Navigation className="w-4 h-4" />
                  {gpsStatus === 'locating' ? t('gpsLocating') : gpsStatus === 'sent' ? t('gpsSent') : t('gpsBtn')}
                </button>
              </div>

              {/* ─── REPORT SECTION ─── */}
              <div className="w-full max-w-[460px] mb-3">
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="w-full py-3 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-gray-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {t('report')}
                </button>

                {showReport && (
                  <div
                    className="mt-3 rounded-[20px] p-5"
                    style={{ background: CARD_BG, boxShadow: SHADOW }}
                  >
                    {reportSuccess ? (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#dcfce7' }}>
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="font-bold text-green-700">{t('reportSuccess')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold mb-1 block">{t('reportName')} *</label>
                          <input
                            type="text"
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">{t('reportPhone')} *</label>
                          <input
                            type="tel"
                            value={reportPhone}
                            onChange={(e) => setReportPhone(e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">{t('reportMsg')}</label>
                          <textarea
                            value={reportMessage}
                            onChange={(e) => setReportMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border resize-none"
                            style={inputStyle}
                          />
                        </div>
                        <button
                          onClick={handleSubmitReport}
                          disabled={reportSubmitting || !reportName.trim() || !reportPhone.trim()}
                          className="w-full py-3.5 rounded-[14px] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                          style={{ background: DANGER }}
                        >
                          {reportSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {t('reportBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── EMERGENCY NUMBERS ─── */}
              <div
                className="w-full max-w-[460px] rounded-2xl p-4 text-center mb-6"
                style={{ background: 'rgba(255,255,255,0.4)' }}
              >
                <h3 className="text-sm font-bold mb-2">{t('emerTitle')}</h3>
                <div className="flex justify-center gap-6 font-bold">
                  <a href="tel:997" className="text-red-600 text-lg no-underline hover:underline">
                    🚑 997
                  </a>
                  <a href="tel:911" className="text-red-600 text-lg no-underline hover:underline">
                    👮 911
                  </a>
                </div>
              </div>
            </>
          )}

          {/* ─── FOOTER ─── */}
          <footer className="mt-auto pt-4 pb-4 text-center text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
            {t('footer')}
          </footer>

          {/* ─── Pulse animation ─── */}
          <style jsx>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.9; }
            }
          `}</style>
        </>
      )}
    </main>
  );
}
