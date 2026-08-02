'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  Check,
  RotateCcw,
  Droplets,
  Upload,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Brand constants ───
const BG = '#f4b400';
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
    emerTitle: 'Numéros d\'Urgence Saoudiens',
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
    emerTitle: 'Saudi Emergency Numbers',
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
    emerTitle: 'أرقام الطوارئ السعودية',
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

  // ─── Photo upload state ───
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Photo upload handler ───
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !code) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/pilgrims/upload-photo', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.photoUrl;

      const updateRes = await fetch(`/api/pilgrims/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl }),
      });
      if (!updateRes.ok) throw new Error('Update failed');
      const updateData = await updateRes.json();

      setPilgrim(updateData.pilgrim);
      toast({ title: 'Photo mise à jour !' });
    } catch {
      toast({ title: 'Erreur lors du téléchargement de la photo', variant: 'destructive' });
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

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
          <div className="text-[28px] font-extrabold tracking-tight text-black mb-8">
            <span className="text-white bg-black px-2.5 py-1 rounded-lg mr-1.5">Pass</span>Hajj
          </div>
          <div className="w-full max-w-[400px] text-center">
            <div className="rounded-[24px] p-8 mb-6" style={{ background: CARD_BG, boxShadow: SHADOW }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#fff3cd' }}>
                <AlertCircle className="w-10 h-10" style={{ color: '#f4b400' }} />
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
            <div className="text-[22px] font-extrabold tracking-tight text-black">
              <span className="text-white bg-black px-1.5 py-0.5 rounded-md mr-1">Pass</span>Hajj
            </div>
            <div className="flex items-center gap-3">
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
              EDIT MODE
          ═══════════════════════════════════════════════════════════ */}
          {isEditing ? (
            <div className="w-full max-w-[420px] space-y-4">
              <div className="rounded-[20px] p-5" style={{ background: CARD_BG, boxShadow: SHADOW }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Pencil className="w-5 h-5" style={{ color: '#059669' }} />
                    Identité
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleCancelEdit} className="px-3 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 bg-white text-black hover:bg-gray-50 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1 disabled:opacity-50" style={{ background: '#059669' }}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {t('save')}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nom complet *</label>
                    <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nationalité *</label>
                    <input type="text" value={editNationality} onChange={(e) => setEditNationality(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Groupe Sanguin</label>
                    <select value={editBloodType} onChange={(e) => setEditBloodType(e.target.value)} className={inputClass} style={{ ...inputStyle, appearance: 'none' }}>
                      <option value="">—</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Infos Médicales</label>
                    <textarea value={editMedicalInfo} onChange={(e) => setEditMedicalInfo(e.target.value)} placeholder="Allergies, maladies chroniques..." rows={3} className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border resize-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Hôtel (La Mecque)</label>
                    <input type="text" value={editHotelMecca} onChange={(e) => setEditHotelMecca(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Chambre (La Mecque)</label>
                    <input type="text" value={editRoomMecca} onChange={(e) => setEditRoomMecca(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Hôtel (Médine)</label>
                    <input type="text" value={editHotelMedina} onChange={(e) => setEditHotelMedina(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Chambre (Médine)</label>
                    <input type="text" value={editRoomMedina} onChange={(e) => setEditRoomMedina(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">WhatsApp Chef de Groupe</label>
                    <input type="tel" value={editGroupLeaderPhone} onChange={(e) => setEditGroupLeaderPhone(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Téléphone Famille</label>
                    <input type="tel" value={editFamilyContact} onChange={(e) => setEditFamilyContact(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ─── PROFILE CARD ─── */}
              <div
                className="w-full max-w-[420px] rounded-[20px] p-6 text-center mb-4"
                style={{ background: CARD_BG, boxShadow: SHADOW }}
              >
                {/* Photo — clickable for upload */}
                <div className="relative inline-block mx-auto mb-4">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="relative group cursor-pointer disabled:opacity-50"
                    type="button"
                  >
                    {pilgrim.photoUrl ? (
                      <img
                        src={pilgrim.photoUrl}
                        alt={pilgrim.fullName}
                        className="w-[100px] h-[100px] rounded-full object-cover border-4 border-white"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-[100px] h-[100px] rounded-full border-4 border-white items-center justify-center text-2xl font-bold"
                      style={{
                        background: '#eee',
                        color: TEXT,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        display: pilgrim.photoUrl ? 'none' : 'flex',
                        margin: pilgrim.photoUrl ? undefined : '0 auto',
                      }}
                    >
                      {getInitials(pilgrim.fullName)}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
                    </div>
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoChange} className="hidden" />
                </div>

                {/* Name */}
                <h1 className="text-[22px] font-extrabold mb-1">{pilgrim.fullName}</h1>

                {/* Tag */}
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#f3f4f6', color: MUTED }}
                >
                  {t('identityTag')}
                </span>

                {/* Badges */}
                <div className="flex justify-center gap-2 flex-wrap mt-3">
                  {pilgrim.bloodType && (
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      {pilgrim.bloodType}
                    </span>
                  )}
                  {pilgrim.nationality && pilgrim.nationality !== 'Non spécifié' && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold" style={{ color: MUTED }}>
                      {pilgrim.nationality}
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

              {/* ─── INFO GRID (2 columns) ─── */}
              <div className="w-full max-w-[420px] grid grid-cols-2 gap-3 mb-4">
                {/* Health */}
                <div
                  className="rounded-[16px] p-4 text-center"
                  style={{
                    background: '#fef2f2',
                    boxShadow: SHADOW,
                    borderLeft: lang === 'ar' ? 'none' : '4px solid #dc2626',
                    borderRight: lang === 'ar' ? '4px solid #dc2626' : 'none',
                  }}
                >
                  <span className="text-xl block mb-2">🏥</span>
                  <span className="text-xs block mb-1" style={{ color: MUTED }}>{t('healthLabel')}</span>
                  <span className="text-sm font-bold block" style={{ color: DANGER }}>
                    {pilgrim.medicalInfo || t('noMedical')}
                  </span>
                  {pilgrim.bloodType && (
                    <span className="text-xs font-bold block mt-1" style={{ color: DANGER }}>
                      🩸 {pilgrim.bloodType}
                    </span>
                  )}
                </div>

                {/* Hotel */}
                <div
                  className="rounded-[16px] p-4 text-center"
                  style={{
                    background: '#eff6ff',
                    boxShadow: SHADOW,
                    borderLeft: lang === 'ar' ? 'none' : '4px solid #3b82f6',
                    borderRight: lang === 'ar' ? '4px solid #3b82f6' : 'none',
                  }}
                >
                  <span className="text-xl block mb-2">🏨</span>
                  <span className="text-xs block mb-1" style={{ color: MUTED }}>{t('hotelLabel')}</span>
                  <span className="text-sm font-bold block" style={{ color: TEXT }}>
                    {activeHotel || t('noHotel')}
                  </span>
                  {activeRoom && activeCity && (
                    <span className="text-xs block mt-1" style={{ color: MUTED }}>
                      {t('room')} {activeRoom} • {activeCity}
                    </span>
                  )}
                </div>
              </div>

              {/* ─── REASSURANCE SECTION ─── */}
              <div
                className="w-full max-w-[420px] rounded-[16px] p-4 mb-4"
                style={{ background: 'rgba(255,255,255,0.5)' }}
              >
                <h3 className="text-[15px] font-extrabold mb-2.5 flex items-center gap-2" style={{ color: TEXT }}>
                  <ShieldCheck className="w-5 h-5" style={{ color: SUCCESS }} />
                  {t('reassuranceTitle')}
                </h3>
                <ul className="space-y-1.5 text-[13px]" style={{ color: TEXT }}>
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

              {/* ─── ACTION BUTTONS ─── */}
              <div className="w-full max-w-[420px] flex flex-col gap-3 mb-4">
                {/* WhatsApp — Contacter le chef */}
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

                {/* Call Chef */}
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

                {/* Call Family */}
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

                {/* Itinéraire vers l'hôtel */}
                {activeHotel && (
                  <a
                    href={hotelMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-gray-50 transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    {t('routeToHotel')}
                  </a>
                )}
              </div>

              {/* ─── REPORT SECTION ─── */}
              <div className="w-full max-w-[420px] mb-4">
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

              {/* ─── EMERGENCY NUMBERS ─── */}
              <div
                className="w-full max-w-[420px] rounded-[16px] p-5 mb-6"
                style={{ background: '#fef2f2', boxShadow: SHADOW }}
              >
                <h3 className="text-sm font-bold mb-3 text-center" style={{ color: TEXT }}>
                  {t('emerTitle')}
                </h3>
                <div className="flex justify-center gap-4">
                  <a
                    href="tel:997"
                    className="flex-1 py-4 rounded-[14px] text-white font-extrabold text-xl no-underline flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: '#dc2626', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
                  >
                    🚑 997
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
            </>
          )}

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
          `}</style>
        </>
      )}
    </main>
  );
}
