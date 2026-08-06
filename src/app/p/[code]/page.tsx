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
  Check,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  Share,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { HAJJ_STAGES, getStageLabel, getStageDesc, getStageMessage, holySiteToStageKey, type HajjStageKey, type HajjStage } from '@/lib/hajj-stages';

// ─── Helper: Convert a stored photoUrl to a displayable URL ───
// Photos uploaded via /api/pilgrims/upload-photo are stored as /uploads/pilgrim-photos/xxx.jpg
// but the Next.js dev server doesn't serve dynamically created files from public/.
// The /api/serve-upload API serves them, so we rewrite the path.
function getPhotoDisplayUrl(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  // If it's a relative path under /uploads/, route through the serve-upload API
  if (photoUrl.startsWith('/uploads/')) {
    return `/api/serve-upload/${photoUrl.slice('/uploads/'.length)}`;
  }
  return photoUrl;
}

// ─── Brand constants ───
const BG = '#059669';
const CARD_BG = '#ffffff';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const DANGER = '#dc2626';
const SUCCESS = '#10b981';
const BLUE = '#3b82f6';
const WA_GREEN = '#25D366';
const RADIUS = '20px';
const SHADOW = '0 8px 24px rgba(0,0,0,0.12)';
const INPUT_BG = '#f3f4f6';
const INPUT_BORDER = '#d1d5db';

// ─── Pilgrim data interface ───
interface PilgrimData {
  id: string;
  qrCode: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string;
  language: string | null;
  photoUrl: string | null;
  bloodType: string | null;
  allergies: string | null;
  diseases: string | null;
  medicalInfo: string | null;
  address: string | null;
  phone: string | null;
  hotelMecca: string | null;
  roomMecca: string | null;
  hotelMedina: string | null;
  roomMedina: string | null;
  hotelCoords: { lat: number; lng: number } | string | null;
  hotelAddress: string | null;
  groupLeaderPhone: string | null;
  agencyPhone: string | null;
  hotelPhone: string | null;
  familyContact: string | null;
  hajjStage: string | null;
  alNusukDocUrl: string | null;
  isActive: boolean;
  duration: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  agency?: { name: string } | null;
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
type GpsStatus = 'idle' | 'locating' | 'success' | 'error';

// ─── i18n translations ───
const translations = {
  fr: {
    // Header
    helpLink: 'Aide ?',
    // GPS bar
    gpsLocating: '📍 Localisation en cours...',
    gpsSuccess: '📍 Position partagée avec succès',
    gpsError: '❌ Position refusée (Activez GPS)',
    gpsNotSupported: '⚠️ GPS non supporté',
    // Profile card
    identityTag: 'Pass Identity – Hajj 2026',
    // Info grid
    healthLabel: 'Santé',
    hotelLabel: 'Hôtel',
    noMedical: 'Aucune info',
    noHotel: 'Non renseigné',
    mecca: 'La Mecque',
    medina: 'Médine',
    room: 'Ch.',
    // Actions
    waBtn: 'Contacter le chef de groupe',
    callBtn: 'Appeler le chef de groupe',
    callFamily: 'Appeler la famille',
    routeToHotel: 'Itinéraire vers l\'hôtel',
    // Report
    reportBtn: 'Ce pèlerin est perdu — Cliquez ici',
    reportSubmit: 'Envoyer le signalement',
    reportName: 'Votre nom',
    reportPhone: 'Votre WhatsApp',
    reportMsg: 'Message (optionnel)',
    reportSuccess: 'Signalement envoyé !',
    // Emergency
    emerTitle: 'Urgence Médicale',
    emerDirect: 'Appel direct',
    // Footer
    footer: 'PassHajj — Protection intelligente Hajj & Omrah',
    // States
    notFound: 'Code QR non reconnu',
    notFoundDesc: 'Ce code ne correspond à aucun bracelet Pass Identity enregistré.',
    notActivated: 'Bracelet non activé',
    notActivatedDesc: 'Ce bracelet n\'a pas encore été activé par son propriétaire.',
    activateNow: 'Activer maintenant',
    expired: 'Bracelet expiré',
    expiredDesc: 'La période de validité de ce bracelet est terminée.',
    error: 'Erreur',
    errorDesc: 'Une erreur est survenue. Veuillez réessayer.',
    // Edit
    edit: 'Modifier mes infos',
    cancel: 'Annuler',
    save: 'Enregistrer',
    editPhoto: 'Changer la photo',
    uploading: 'Envoi...',
    // Reassurance
    reassuranceTitle: 'Vous êtes protégé',
    reassurance1: 'Votre chef de groupe reçoit une alerte si ce QR est scanné',
    reassurance2: 'Vos infos médicales sont accessibles aux secours en 1 clic',
    reassurance3: 'Vous pouvez modifier votre hôtel à tout moment',
    identityTitle: 'Identité Pèlerin',
    healthAlertTitle: 'Alerte Santé',
    hotelSectionTitle: 'Hôtel',
    hotelItinerary: 'Itinéraire vers l\'hôtel',
    reassureFamily: 'Rassurer la famille',
    hajjJourney: 'Mon parcours Hajj',
    hajjStageLabel: 'Étape actuelle',
    hajjNextStep: 'Prochaine étape',
    hajjCompleted: 'Terminé',
    hajjUpdateStage: 'Mettre à jour mon étape',
    reassureMessage: 'Je vais bien, je suis à Jeddah',
    reassureMedina: '💬 Bonjour je vais bien je suis à Médine',
    reassureMina: '💬 Dire à la famille que je suis à Mina',
    reassureDefault: '💬 Bonjour la famille je vais bien tout se passe bien à bientôt',
    allergiesLabel: 'Allergies',
    diseasesLabel: 'Maladies',
    otherMedicalLabel: 'Autres infos médicales',
    languageLabel: 'Langue',
    agencyLabel: 'Agence de voyage',
    firstNameLabel: 'Prénom',
    lastNameLabel: 'Nom',
    nationalityLabel: 'Nationalité',
    qrCode: 'Code QR',
    verifiedBadge: 'Vérifié ✓',
    shareProfile: 'Partager',
    shareCopied: 'Lien copié !',
    scanCount: 'Scanné {n} fois',
    createdOn: 'Créé le',
    updatedOn: 'Mis à jour le',
    callHotel: "Appeler l'Hôtel",
    pilgrimPhone: 'Téléphone',
    alNusukDoc: 'Document AlNusuk',
    addressLabel: 'Adresse',
    noMedicalInfo: 'Aucune info médicale',
    viewOnMap: 'Voir sur la carte',
  },
  en: {
    helpLink: 'Help?',
    gpsLocating: '📍 Locating...',
    gpsSuccess: '📍 Position shared successfully',
    gpsError: '❌ Location denied (Enable GPS)',
    gpsNotSupported: '⚠️ GPS not supported',
    identityTag: 'Pass Identity – Hajj 2026',
    healthLabel: 'Health',
    hotelLabel: 'Hotel',
    noMedical: 'No info',
    noHotel: 'Not specified',
    mecca: 'Mecca',
    medina: 'Medina',
    room: 'Rm.',
    waBtn: 'Contact the group leader',
    callBtn: 'Call the group leader',
    callFamily: 'Call family',
    routeToHotel: 'Route to hotel',
    reportBtn: 'This pilgrim is lost — Click here',
    reportSubmit: 'Send report',
    reportName: 'Your name',
    reportPhone: 'Your WhatsApp',
    reportMsg: 'Message (optional)',
    reportSuccess: 'Report sent!',
    emerTitle: 'Medical Emergency',
    emerDirect: 'Direct call',
    footer: 'PassHajj — Smart Hajj & Umrah Protection',
    notFound: 'QR code not recognized',
    notFoundDesc: 'This code does not match any registered Pass Identity bracelet.',
    notActivated: 'Bracelet not activated',
    notActivatedDesc: 'This bracelet has not yet been activated by its owner.',
    activateNow: 'Activate now',
    expired: 'Bracelet expired',
    expiredDesc: 'The validity period of this bracelet has ended.',
    error: 'Error',
    errorDesc: 'An error occurred. Please try again.',
    edit: 'Edit my info',
    cancel: 'Cancel',
    save: 'Save',
    editPhoto: 'Change photo',
    uploading: 'Uploading...',
    reassuranceTitle: 'You are protected',
    reassurance1: 'Your group leader receives an alert if this QR is scanned',
    reassurance2: 'Your medical info is accessible to emergency services in 1 click',
    reassurance3: 'You can change your hotel at any time',
    identityTitle: 'Pilgrim Identity',
    healthAlertTitle: 'Health Alert',
    hotelSectionTitle: 'Hotel',
    hotelItinerary: 'Route to hotel',
    reassureFamily: 'Reassure family',
    hajjJourney: 'My Hajj Journey',
    hajjStageLabel: 'Current stage',
    hajjNextStep: 'Next step',
    hajjCompleted: 'Completed',
    hajjUpdateStage: 'Update my stage',
    reassureMessage: 'I am fine, I am in Jeddah',
    reassureMedina: '💬 Hello, I am fine, I am in Medina',
    reassureMina: '💬 Tell family I am in Mina',
    reassureDefault: '💬 Hello family, I am fine, everything is going well, see you soon',
    allergiesLabel: 'Allergies',
    diseasesLabel: 'Diseases',
    otherMedicalLabel: 'Other medical info',
    languageLabel: 'Language',
    agencyLabel: 'Travel agency',
    firstNameLabel: 'First name',
    lastNameLabel: 'Last name',
    nationalityLabel: 'Nationality',
    qrCode: 'QR Code',
    verifiedBadge: 'Verified ✓',
    shareProfile: 'Share',
    shareCopied: 'Link copied!',
    scanCount: 'Scanned {n} times',
    createdOn: 'Created on',
    updatedOn: 'Updated on',
    callHotel: 'Call Hotel',
    pilgrimPhone: 'Phone',
    alNusukDoc: 'AlNusuk Document',
    addressLabel: 'Address',
    noMedicalInfo: 'No medical info',
    viewOnMap: 'View on map',
  },
  ar: {
    helpLink: 'مساعدة؟',
    gpsLocating: '📍 جاري التحديد...',
    gpsSuccess: '📍 تم مشاركة الموقع بنجاح',
    gpsError: '❌ تم رفض الموقع (فعّل GPS)',
    gpsNotSupported: '⚠️ GPS غير مدعوم',
    identityTag: 'Pass Identity – حج 2026',
    healthLabel: 'الصحة',
    hotelLabel: 'الفندق',
    noMedical: 'لا معلومات',
    noHotel: 'غير محدد',
    mecca: 'مكة المكرمة',
    medina: 'المدينة المنورة',
    room: 'غرفة',
    waBtn: 'اتصل بقائد المجموعة',
    callBtn: 'اتصل بقائد المجموعة',
    callFamily: 'اتصل بالعائلة',
    routeToHotel: 'اتجاهات إلى الفندق',
    reportBtn: 'هذا الحاج ضائع — انقر هنا',
    reportSubmit: 'إرسال البلاغ',
    reportName: 'اسمك',
    reportPhone: 'الواتساب الخاص بك',
    reportMsg: 'رسالة (اختياري)',
    reportSuccess: 'تم إرسال البلاغ!',
    emerTitle: 'طوارئ طبية',
    emerDirect: 'اتصال مباشر',
    footer: 'PassHajj — حماية ذكية للحج والعمرة',
    notFound: 'رمز QR غير معروف',
    notFoundDesc: 'هذا الرمز لا يتطابق مع أي سوار Pass Identity مسجل.',
    notActivated: 'السوار غير مفعّل',
    notActivatedDesc: 'لم يتم تفعيل هذا السوار بعد من قبل مالكه.',
    activateNow: 'تفعيل الآن',
    expired: 'السوار منتهي الصلاحية',
    expiredDesc: 'انتهت فترة صلاحية هذا السوار.',
    error: 'خطأ',
    errorDesc: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    edit: 'تعديل معلوماتي',
    cancel: 'إلغاء',
    save: 'حفظ',
    editPhoto: 'تغيير الصورة',
    uploading: 'جاري الرفع...',
    reassuranceTitle: 'أنت محمي',
    reassurance1: 'يتلقى قائد مجموعتك تنبيهًا عند مسح هذا الرمز',
    reassurance2: 'معلوماتك الطبية متاحة لخدمات الطوارئ بنقرة واحدة',
    reassurance3: 'يمكنك تغيير فندقك في أي وقت',
    identityTitle: 'هوية الحاج',
    healthAlertTitle: 'تنبيه صحي',
    hotelSectionTitle: 'الفندق',
    hotelItinerary: 'اتجاهات إلى الفندق',
    reassureFamily: 'إطمئن العائلة',
    hajjJourney: 'رحلتي في الحج',
    hajjStageLabel: 'المرحلة الحالية',
    hajjNextStep: 'المرحلة التالية',
    hajjCompleted: 'مكتمل',
    hajjUpdateStage: 'تحديث مرحلتي',
    reassureMessage: 'أنا بخير، أنا في جدة',
    reassureMedina: '💬 مرحبا، أنا بخير، أنا في المدينة المنورة',
    reassureMina: '💬 أخبر العائلة أنني في منى',
    reassureDefault: '💬 مرحبا بالعائلة، أنا بخير، كل شيء على ما يرام، أراكم قريباً',
    allergiesLabel: 'الحساسية',
    diseasesLabel: 'الأمراض',
    otherMedicalLabel: 'معلومات طبية أخرى',
    languageLabel: 'اللغة',
    agencyLabel: 'وكالة السفر',
    firstNameLabel: 'الاسم الأول',
    lastNameLabel: 'الاسم الأخير',
    nationalityLabel: 'الجنسية',
    qrCode: 'رمز QR',
    verifiedBadge: 'مُتحقق ✓',
    shareProfile: 'مشاركة',
    shareCopied: 'تم نسخ الرابط!',
    scanCount: 'تم المسح {n} مرة',
    createdOn: 'أنشئ في',
    updatedOn: 'تحديث في',
    callHotel: 'اتصل بالفندق',
    pilgrimPhone: 'الهاتف',
    alNusukDoc: 'وثيقة النسك',
    addressLabel: 'العنوان',
    noMedicalInfo: 'لا معلومات طبية',
    viewOnMap: 'عرض على الخريطة',
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

// ─── Holy site coordinates for Caméléon button ───
const HOLY_SITES = {
  medina:  { lat: 24.4687, lng: 39.6142, radiusKm: 15 },  // Medina city center
  mina:    { lat: 21.4133, lng: 39.8933, radiusKm: 5 },    // Mina tent city
  arafat:  { lat: 21.3544, lng: 39.9844, radiusKm: 5 },    // Arafat
  muzdalifah: { lat: 21.3866, lng: 39.9227, radiusKm: 4 }, // Muzdalifah
  mecca:   { lat: 21.4225, lng: 39.8262, radiusKm: 10 },   // Mecca/Kaaba
} as const;

type HolySiteKey = keyof typeof HOLY_SITES;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Detect the nearest holy site from GPS coordinates */
function detectHolySite(lat: number, lng: number): HolySiteKey | null {
  let closest: HolySiteKey | null = null;
  let closestDist = Infinity;
  for (const [key, site] of Object.entries(HOLY_SITES)) {
    const dist = haversineKm(lat, lng, site.lat, site.lng);
    if (dist < site.radiusKm && dist < closestDist) {
      closest = key as HolySiteKey;
      closestDist = dist;
    }
  }
  return closest;
}

export default function PilgrimScanPage() {
  const { code } = useParams<{ code: string }>();

  // ─── State ───
  const [state, setState] = useState<PageState>('loading');
  const [pilgrim, setPilgrim] = useState<PilgrimData | null>(null);
  const [lang, setLang] = useState<Lang>('fr');

  // ─── GPS state (auto-detect on load) ───
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [finderLat, setFinderLat] = useState<number | null>(null);
  const [finderLng, setFinderLng] = useState<number | null>(null);

  // ─── Report state ───
  const [showReport, setShowReport] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportPhone, setReportPhone] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // NOTE: Edit functionality removed from public page — only agency dashboard can edit

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

        if (data.status === 'not_found') { setState('not_found'); return; }
        if (data.status === 'not_activated') { setState('not_activated'); return; }
        if (data.status === 'expired') { setState('expired'); return; }

        if (data.pilgrim) {
          setPilgrim(data.pilgrim);
          setState('active');
          const p = data.pilgrim;
          // Edit state removed — read-only public page
          return;
        }

        setState('error');
      } catch {
        setState('error');
      }
    };

    fetchPilgrim();
  }, [code]);

  // ─── Auto GPS detection on page load ───
  useEffect(() => {
    if (state !== 'active') return;
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFinderLat(pos.coords.latitude);
        setFinderLng(pos.coords.longitude);
        setGpsStatus('success');
      },
      () => {
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [state]);

  // NOTE: Save handler removed — public page is read-only

  // NOTE: Cancel edit removed — public page is read-only

  // NOTE: Photo upload handler removed — public page is read-only

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
          latitude: finderLat,
          longitude: finderLng,
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
  }, [code, reportName, reportPhone, reportMessage, finderLat, finderLng]);

  // ─── Computed values ───
  const coords = parseCoords(pilgrim?.hotelCoords ?? null);
  const hotelLat = coords?.lat ?? DEFAULT_LAT;
  const hotelLng = coords?.lng ?? DEFAULT_LNG;

  // WhatsApp link with auto GPS
  const whatsappLeaderUrl = pilgrim?.groupLeaderPhone
    ? (() => {
        let message = `🚨 Bonjour, j'ai trouvé un pèlerin PassHajj.\nNom: ${pilgrim.fullName}\n`;
        if (finderLat && finderLng) {
          message += `📍 Localisation: https://maps.google.com/?q=${finderLat},${finderLng}`;
        } else {
          message += `📍 Localisation: Inconnue`;
        }
        return `https://wa.me/${cleanPhone(pilgrim.groupLeaderPhone)}?text=${encodeURIComponent(message)}`;
      })()
    : null;

  const hotelMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotelLat},${hotelLng}&travelmode=walking`;

  // Determine which hotel to show
  const activeHotel = pilgrim?.hotelMecca || pilgrim?.hotelMedina;
  const activeRoom = pilgrim?.hotelMecca ? pilgrim.roomMecca : pilgrim?.roomMedina;
  const activeCity = pilgrim?.hotelMecca ? t('mecca') : pilgrim?.hotelMedina ? t('medina') : null;

  // ─── Common input styles ───
  const inputClass = 'w-full h-12 px-4 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border';
  const inputStyle = { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER };

  // ─── Build initials for avatar fallback ───
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // ─── Hotel display text ───
  const hotelDisplay = activeHotel
    ? `${activeHotel}${activeRoom ? ` (${t('room')} ${activeRoom})` : ''}`
    : t('noHotel');

  return (
    <main
      dir={dir}
      className="min-h-screen flex flex-col items-center px-4 py-4"
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
          NOT ACTIVATED STATE
      ═══════════════════════════════════════════════════════════ */}
      {state === 'not_activated' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="flex items-center mb-8">
            <Image src="/logo.png" alt="PassHajj" width={150} height={58} style={{ objectFit: 'contain', borderRadius: '14px', padding: '5px', background: 'rgba(255,255,255,0.9)' }} />
          </div>
          <div className="w-full max-w-[400px] text-center">
            <div className="rounded-[24px] p-8 mb-6" style={{ background: CARD_BG, boxShadow: SHADOW }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#d1fae5' }}>
                <AlertCircle className="w-10 h-10" style={{ color: '#059669' }} />
              </div>
              <h1 className="text-[22px] font-extrabold leading-tight mb-3">{t('notActivated')}</h1>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: MUTED }}>{t('notActivatedDesc')}</p>
              <div className="py-3 px-4 rounded-xl mb-6 font-mono font-bold text-base tracking-wider" style={{ background: INPUT_BG, color: '#333', border: `1px solid ${INPUT_BORDER}` }}>
                ID: {code}
              </div>
              <Link
                href={`/activate/identity?code=${encodeURIComponent(code)}`}
                className="w-full py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: '#111827', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                <Shield className="w-5 h-5" />
                {t('activateNow')}
              </Link>
            </div>
            <div className="text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
              Propulsé par <strong>PassHajj</strong>
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
          ACTIVE STATE — TROUVEUR Design
      ═══════════════════════════════════════════════════════════ */}
      {state === 'active' && pilgrim && (
        <>
          {/* ─── HEADER ─── */}
          <div className="w-full max-w-[420px] flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Image src="/logo.png" alt="PassHajj" width={150} height={58} style={{ objectFit: 'contain', borderRadius: '14px', padding: '5px', background: 'rgba(255,255,255,0.9)' }} />
            </div>
            <div className="flex items-center gap-2">
              {/* Share Profile Button */}
              <button
                onClick={async () => {
                  const shareData = { title: `PassHajj - ${pilgrim.fullName}`, url: window.location.href };
                  if (navigator.share) {
                    try { await navigator.share(shareData); } catch { /* user cancelled */ }
                  } else {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast({ title: t('shareCopied') });
                    } catch { /* clipboard failed */ }
                  }
                }}
                className="bg-white/30 border-none px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:bg-white/50 transition-colors flex items-center gap-1"
                style={{ color: TEXT }}
              >
                <Share className="w-3 h-3" />
                {t('shareProfile')}
              </button>
              <button
                onClick={toggleLang}
                className="bg-white/30 border-none px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:bg-white/50 transition-colors"
                style={{ color: TEXT }}
              >
                {lang.toUpperCase()}
              </button>
            </div>
          </div>

          {/* ─── GPS STATUS BAR ─── */}
          {gpsStatus !== 'idle' && (
            <div
              className="w-full max-w-[420px] py-3 px-4 rounded-xl flex items-center gap-2 text-[13px] font-semibold mb-5"
              style={{
                background: gpsStatus === 'locating' ? 'rgba(255,255,255,0.4)' : gpsStatus === 'success' ? '#d1fae5' : '#fee2e2',
                color: gpsStatus === 'locating' ? '#000' : gpsStatus === 'success' ? '#065f46' : '#991b1b',
                animation: 'slideDown 0.4s ease',
              }}
            >
              {gpsStatus === 'locating' && <Loader2 className="w-4 h-4 animate-spin" />}
              {gpsStatus === 'success' && <Check className="w-4 h-4" />}
              {gpsStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              {gpsStatus === 'locating' ? t('gpsLocating') : gpsStatus === 'success' ? t('gpsSuccess') : t('gpsError')}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              READ-ONLY MODE — Public page is read-only for security
              Only agency dashboard can edit pilgrim information
          ═══════════════════════════════════════════════════════════ */}
            <>
              {/* ─── "IDENTITÉ PÈLERIN" BIG TITLE ─── */}
              <div className="w-full max-w-[420px] text-center mb-2">
                <h1 className="text-[28px] font-extrabold tracking-tight" style={{ color: TEXT }}>
                  {t('identityTitle')}
                </h1>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1"
                  style={{ background: '#f3f4f6', color: MUTED }}
                >
                  {t('identityTag')}
                </span>
              </div>

              {/* ─── PROFILE CARD — Enhanced visual ─── */}
              <div
                className="w-full max-w-[420px] rounded-[20px] text-center mb-4 overflow-hidden"
                style={{ background: CARD_BG, boxShadow: SHADOW }}
              >
                {/* Top gradient banner */}
                <div
                  className="py-5 px-6"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
                  }}
                >
                  {/* Photo — read-only, no upload on public page */}
                  <div className="inline-block mx-auto mb-3">
                      {pilgrim.photoUrl ? (
                        <img
                          src={getPhotoDisplayUrl(pilgrim.photoUrl)}
                          alt={pilgrim.fullName}
                          className="w-[110px] h-[110px] rounded-full object-cover border-4 border-white"
                          style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.dataset.error) return;
                            target.dataset.error = '1';
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-[110px] h-[110px] rounded-full border-4 border-white items-center justify-center text-3xl font-bold"
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          color: '#fff',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                          display: pilgrim.photoUrl ? 'none' : 'flex',
                          margin: pilgrim.photoUrl ? undefined : '0 auto',
                        }}
                      >
                        {getInitials(pilgrim.fullName)}
                      </div>
                  </div>

                  {/* Name + Verified Badge */}
                  <h2 className="text-[24px] font-extrabold mb-1 text-white drop-shadow-sm">{pilgrim.fullName}</h2>

                  {/* Verified Badge */}
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mb-2"
                    style={{ background: '#10b981', color: '#fff' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t('verifiedBadge')}
                  </span>

                  {/* Nationality badge */}
                  {pilgrim.nationality && (
                    <span className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold inline-block mt-1 text-white">
                      🌍 {pilgrim.nationality}
                    </span>
                  )}

                  {/* QR Code */}
                  <div className="mt-3 flex flex-col items-center">
                    <div className="bg-white rounded-xl p-1.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      <QRCodeSVG value={pilgrim.qrCode} size={80} level="M" />
                    </div>
                    <span className="text-white/80 text-[10px] font-mono mt-1">{pilgrim.qrCode}</span>
                  </div>
                </div>

                {/* Info list below name */}
                <div className="p-5 pt-4 text-left space-y-2">
                  {pilgrim.lastName && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('lastNameLabel')}</span>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>{pilgrim.lastName}</span>
                    </div>
                  )}
                  {pilgrim.firstName && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('firstNameLabel')}</span>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>{pilgrim.firstName}</span>
                    </div>
                  )}
                  {pilgrim.nationality && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('nationalityLabel')}</span>
                      <span className="text-sm font-bold" style={{ color: TEXT }}>🌍 {pilgrim.nationality}</span>
                    </div>
                  )}
                  {pilgrim.phone && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('pilgrimPhone')}</span>
                      <a href={`tel:+${cleanPhone(pilgrim.phone)}`} className="text-sm font-semibold" style={{ color: BLUE }}>{pilgrim.phone}</a>
                    </div>
                  )}
                  {pilgrim.address && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('addressLabel')}</span>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>{pilgrim.address}</span>
                    </div>
                  )}
                  {pilgrim.language && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('languageLabel')}</span>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>{pilgrim.language}</span>
                    </div>
                  )}
                  {pilgrim.agency?.name && (
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb' }}>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{t('agencyLabel')}</span>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>{pilgrim.agency.name}</span>
                    </div>
                  )}
                  {/* AlNusuk document link */}
                  {pilgrim.alNusukDocUrl && (
                    <a
                      href={pilgrim.alNusukDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold"
                      style={{ background: '#eff6ff', color: BLUE }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('alNusukDoc')}
                    </a>
                  )}
                  {/* Scan counter */}
                  <div className="flex justify-center mt-1">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#f3f4f6', color: MUTED }}>
                      {t('scanCount').replace('{n}', String((pilgrim.reports?.length ?? 0) + 1))}
                    </span>
                  </div>
                  {/* Timestamps */}
                  <div className="flex flex-col items-center gap-0.5 mt-1">
                    <span className="text-[10px]" style={{ color: MUTED }}>
                      {t('createdOn')} {new Date(pilgrim.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px]" style={{ color: MUTED }}>
                      {t('updatedOn')} {new Date(pilgrim.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

              </div>

              {/* ═══════════════════════════════════════════════════════════
                  1. ALERTE SANTÉ — 4 medical boxes: Blood, Disease, Allergies, Medicaments
              ═══════════════════════════════════════════════════════════ */}
              {/* Health Alert — show full card only if at least one medical field has data */}
              {pilgrim.bloodType || pilgrim.allergies || pilgrim.diseases || pilgrim.medicalInfo ? (
                <div
                  className="w-full max-w-[420px] rounded-[20px] p-5 mb-4"
                  style={{
                    background: '#dc2626',
                    boxShadow: '0 8px 24px rgba(220,38,38,0.35)',
                    animation: 'fadeInUp 0.4s ease forwards',
                    animationDelay: '0.05s',
                    opacity: 0,
                  }}
                >
                  <h3 className="text-[18px] font-extrabold mb-4 flex items-center gap-2 text-white">
                    <Heart className="w-6 h-6 animate-pulse" />
                    {t('healthAlertTitle')}
                  </h3>

                  {/* 4 medical boxes in 2x2 grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Blood type */}
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Droplets className="w-6 h-6 mx-auto mb-1 text-white" />
                      <span className="text-[10px] block text-white/70 mb-0.5">Groupe sanguin</span>
                      <span className="text-lg font-extrabold text-white">{pilgrim.bloodType || '—'}</span>
                    </div>

                    {/* Maladie critique */}
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-white" />
                      <span className="text-[10px] block text-white/70 mb-0.5">Maladie critique</span>
                      <span className="text-sm font-bold text-white">{pilgrim.diseases || '—'}</span>
                    </div>

                    {/* Allergies */}
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Shield className="w-6 h-6 mx-auto mb-1 text-white" />
                      <span className="text-[10px] block text-white/70 mb-0.5">Allergies</span>
                      <span className="text-sm font-bold text-white">{pilgrim.allergies || '—'}</span>
                    </div>

                    {/* Médicaments */}
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Droplets className="w-6 h-6 mx-auto mb-1 text-white" />
                      <span className="text-[10px] block text-white/70 mb-0.5">Médicaments</span>
                      <span className="text-sm font-bold text-white">{pilgrim.medicalInfo || '—'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full max-w-[420px] mb-4 flex justify-center"
                  style={{
                    animation: 'fadeInUp 0.4s ease forwards',
                    animationDelay: '0.05s',
                    opacity: 0,
                  }}
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#d1fae5', color: '#065f46' }}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t('noMedicalInfo')}
                  </span>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  1b. URGENCE MÉDICALE — direct call buttons (997 + 911)
              ═══════════════════════════════════════════════════════════ */}
              <div
                className="w-full max-w-[420px] rounded-[16px] p-5 mb-4"
                style={{ background: '#fef2f2', boxShadow: SHADOW, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.1s', opacity: 0 }}
              >
                <h3 className="text-xl font-extrabold mb-2 text-center flex items-center justify-center gap-2" style={{ color: TEXT }}>
                  <span className="text-5xl">🚑</span> {t('emerTitle')}
                </h3>
                <p className="text-base font-bold text-center mb-4" style={{ color: DANGER }}>
                  {t('emerDirect')}
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="tel:997"
                    className="flex-1 py-4 rounded-[14px] text-white font-extrabold text-xl no-underline flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: '#dc2626', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
                  >
                    <span className="text-2xl">🚑</span> 997
                  </a>
                  <a
                    href="tel:911"
                    className="flex-1 py-4 rounded-[14px] text-white font-extrabold text-xl no-underline flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: '#dc2626', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
                  >
                    👮 911
                  </a>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  2. CONTACTS — 3 contact buttons
              ═══════════════════════════════════════════════════════════ */}
              <div className="w-full max-w-[420px] flex flex-col gap-3 mb-4" style={{ animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.15s', opacity: 0 }}>
                {/* WhatsApp — Contacter le chef de groupe */}
                {whatsappLeaderUrl && (
                  <a
                    href={whatsappLeaderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-[14px] text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: WA_GREEN, boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('waBtn')}
                  </a>
                )}

                {/* Appel chef de groupe */}
                {pilgrim.groupLeaderPhone && (
                  <a
                    href={`tel:+${cleanPhone(pilgrim.groupLeaderPhone)}`}
                    className="w-full py-4 rounded-[14px] text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: BLUE, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                  >
                    <Phone className="w-5 h-5" />
                    {t('callBtn')}
                  </a>
                )}

                {/* Appel famille */}
                {pilgrim.familyContact && (
                  <a
                    href={`tel:+${cleanPhone(pilgrim.familyContact)}`}
                    className="w-full py-3.5 rounded-[14px] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: '#6366f1', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                  >
                    <Phone className="w-4 h-4" />
                    {t('callFamily')}
                  </a>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  3. HÔTEL — Hotel card with address + itinerary button
              ═══════════════════════════════════════════════════════════ */}
              <div
                className="w-full max-w-[420px] rounded-[20px] p-5 mb-4"
                style={{
                  background: CARD_BG,
                  boxShadow: SHADOW,
                  borderLeft: lang === 'ar' ? 'none' : '5px solid #3b82f6',
                  borderRight: lang === 'ar' ? '5px solid #3b82f6' : 'none',
                  animation: 'fadeInUp 0.4s ease forwards',
                  animationDelay: '0.2s',
                  opacity: 0,
                }}
              >
                <h3 className="text-[16px] font-extrabold mb-3 flex items-center gap-2" style={{ color: BLUE }}>
                  <Building2 className="w-5 h-5" />
                  {t('hotelSectionTitle')}
                </h3>

                {/* Hotel name */}
                {activeHotel ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#eff6ff' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#3b82f6' }}>
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block" style={{ color: TEXT }}>{activeHotel}</span>
                        {activeRoom && (
                          <span className="text-base font-bold block" style={{ color: TEXT }}>{t('room')} {activeRoom}</span>
                        )}
                        {activeCity && (
                          <span className="text-xs block" style={{ color: MUTED }}>{activeCity}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm mb-4" style={{ color: MUTED }}>{t('noHotel')}</p>
                )}

                {/* Itinéraire vers l'hôtel button */}
                {activeHotel && (
                  <div className="space-y-2">
                    <a
                      href={hotelMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: BLUE, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                    >
                      <Navigation className="w-4 h-4" />
                      {t('hotelItinerary')}
                    </a>

                    {/* 🏨 Appeler l'Hôtel button */}
                    {(pilgrim.hotelPhone || pilgrim.agencyPhone) && (
                      <a
                        href={`tel:${cleanPhone(pilgrim.hotelPhone || pilgrim.agencyPhone || '')}`}
                        className="w-full py-3.5 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ background: '#0ea5e9', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}
                      >
                        🏨 {t('callHotel')}
                      </a>
                    )}
                    {/* Voir sur la carte — Google Maps link */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${hotelLat},${hotelLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-[14px] font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: '#f0f9ff', color: BLUE, border: '1px solid #bfdbfe' }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {t('viewOnMap')}
                    </a>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  4. CE PÈLERIN EST PERDU — Report section
              ═══════════════════════════════════════════════════════════ */}
              <div className="w-full max-w-[420px] mb-4" style={{ animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.25s', opacity: 0 }}>
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="w-full py-4 rounded-[14px] font-extrabold text-base flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                  style={{ boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}
                >
                  <Send className="w-5 h-5" />
                  {t('reportBtn')}
                </button>

                {showReport && (
                  <div className="mt-3 rounded-[20px] p-5" style={{ background: CARD_BG, boxShadow: SHADOW }}>
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
                          <input type="text" value={reportName} onChange={(e) => setReportName(e.target.value)} className={inputClass} style={inputStyle} />
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">{t('reportPhone')} *</label>
                          <input type="tel" value={reportPhone} onChange={(e) => setReportPhone(e.target.value)} className={inputClass} style={inputStyle} />
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">{t('reportMsg')}</label>
                          <textarea value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border resize-none" style={inputStyle} />
                        </div>
                        <button
                          onClick={handleSubmitReport}
                          disabled={reportSubmitting || !reportName.trim() || !reportPhone.trim()}
                          className="w-full py-3.5 rounded-[14px] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                          style={{ background: DANGER }}
                        >
                          {reportSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                          {t('reportSubmit')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  4b. HAJJ JOURNEY TRACKER + RASSURER LA FAMILLE
                  Full Hajj stages with personalized WhatsApp notifications
              ═══════════════════════════════════════════════════════════ */}
              {pilgrim.familyContact && (
                <div className="w-full max-w-[420px] mb-4" style={{ animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
                  {(() => {
                    // Determine current stage: use hajjStage from DB, or auto-detect from GPS
                    const gpsHolySite = (finderLat && finderLng) ? detectHolySite(finderLat, finderLng) : null;
                    const gpsStageKey = holySiteToStageKey(gpsHolySite);
                    const currentStageKey = (pilgrim.hajjStage as HajjStageKey) || gpsStageKey || 'medina';
                    const currentStage = HAJJ_STAGES.find(s => s.key === currentStageKey) || HAJJ_STAGES[0];
                    const currentOrder = currentStage.order;
                    const langCode = lang === 'ar' ? 'ar' as const : lang === 'en' ? 'en' as const : 'fr' as const;
                    const nextStage = currentStage.nextKey ? HAJJ_STAGES.find(s => s.key === currentStage.nextKey) : null;

                    // WhatsApp message for current stage
                    const waMessage = getStageMessage(currentStage, langCode);

                    // GPS location suffix
                    const locationSuffix = finderLat && finderLng
                      ? (lang === 'ar' ? `\n\n📍 موقعي: https://maps.google.com/?q=${finderLat},${finderLng}` : lang === 'en' ? `\n\n📍 My location: https://maps.google.com/?q=${finderLat},${finderLng}` : `\n\n📍 Ma localisation: https://maps.google.com/?q=${finderLat},${finderLng}`)
                      : '';

                    return (
                      <div className="space-y-4">
                        {/* Hajj Journey Progress Card */}
                        <div className="rounded-[20px] p-4" style={{ background: CARD_BG, boxShadow: SHADOW }}>
                          <h3 className="text-[15px] font-extrabold mb-3 flex items-center gap-2" style={{ color: TEXT }}>
                            🕋 {t('hajjJourney')}
                          </h3>

                          {/* Current stage highlight */}
                          <div className="rounded-[14px] p-3 mb-3" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: SUCCESS }}>
                              {t('hajjStageLabel')}
                            </p>
                            <p className="text-[15px] font-bold" style={{ color: TEXT }}>
                              {currentStage.icon} {getStageLabel(currentStage, langCode)}
                            </p>
                            <p className="text-[12px] mt-1 leading-snug" style={{ color: MUTED }}>
                              {getStageDesc(currentStage, langCode)}
                            </p>
                            {nextStage && (
                              <p className="text-[12px] mt-2 font-semibold" style={{ color: SUCCESS }}>
                                ➡️ {t('hajjNextStep')}: {nextStage.icon} {getStageLabel(nextStage, langCode)}
                              </p>
                            )}
                          </div>

                          {/* Stages timeline */}
                          <div className="space-y-1 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            {HAJJ_STAGES.filter(s => s.key !== 'mecca-general' && s.key !== 'oumrah-ifrad').map((stage) => {
                              const isCompleted = stage.order < currentOrder;
                              const isCurrent = stage.key === currentStageKey;
                              return (
                                <button
                                  key={stage.key}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/pilgrims/update-stage', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ qrCode: pilgrim.qrCode, hajjStage: stage.key }),
                                      });
                                      if (res.ok) {
                                        // Update local state
                                        setPilgrim(prev => prev ? { ...prev, hajjStage: stage.key } : prev);
                                        toast({ title: lang === 'fr' ? 'Étape mise à jour !' : lang === 'en' ? 'Stage updated!' : 'تم تحديث المرحلة!' });
                                      }
                                    } catch { /* silent */ }
                                  }}
                                  className={`w-full text-left flex items-start gap-2.5 p-2 rounded-[10px] transition-all text-[12px] ${
                                    isCurrent ? 'ring-2 ring-emerald-400' : ''
                                  } ${isCompleted ? 'opacity-60' : ''}`}
                                  style={{
                                    background: isCurrent ? '#ecfdf5' : isCompleted ? '#f9fafb' : 'transparent',
                                  }}
                                >
                                  {/* Status dot */}
                                  <span className="mt-0.5 shrink-0">
                                    {isCompleted ? (
                                      <Check className="w-4 h-4" style={{ color: SUCCESS }} />
                                    ) : isCurrent ? (
                                      <span className="block w-4 h-4 rounded-full animate-pulse" style={{ background: SUCCESS }} />
                                    ) : (
                                      <span className="block w-4 h-4 rounded-full border-2" style={{ borderColor: '#d1d5db' }} />
                                    )}
                                  </span>
                                  {/* Label */}
                                  <span className={`leading-tight ${isCurrent ? 'font-bold' : isCompleted ? 'line-through' : 'font-medium'}`} style={{ color: isCurrent ? TEXT : MUTED }}>
                                    {stage.icon} {getStageLabel(stage, langCode)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rassurer la famille button — WhatsApp with Hajj stage message */}
                        <a
                          href={`https://wa.me/${cleanPhone(pilgrim.familyContact!)}?text=${encodeURIComponent(waMessage + locationSuffix)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 rounded-[14px] font-extrabold text-base flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                          style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                        >
                          <Heart className="w-5 h-5" />
                          {t('reassureFamily')}
                        </a>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  6. VOUS ÊTES PROTÉGÉ — Reassurance card
              ═══════════════════════════════════════════════════════════ */}
              <div
                className="w-full max-w-[420px] rounded-[20px] p-5 mb-4"
                style={{ background: CARD_BG, boxShadow: SHADOW, animation: 'fadeInUp 0.4s ease forwards', animationDelay: '0.35s', opacity: 0 }}
              >
                <h3 className="text-[16px] font-extrabold mb-3 flex items-center gap-2" style={{ color: TEXT }}>
                  <ShieldCheck className="w-5 h-5" style={{ color: SUCCESS }} />
                  {t('reassuranceTitle')}
                </h3>
                <ul className="space-y-2 text-[13px]" style={{ color: TEXT }}>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SUCCESS }} />
                    {t('reassurance1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SUCCESS }} />
                    {t('reassurance2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SUCCESS }} />
                    {t('reassurance3')}
                  </li>
                </ul>
              </div>
            </>

          {/* ─── FOOTER ─── */}
          <footer className="mt-auto pt-4 pb-4 text-center text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
            {t('footer')}
          </footer>

          {/* ─── Animation ─── */}
          <style jsx>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </>
      )}
    </main>
  );
}
