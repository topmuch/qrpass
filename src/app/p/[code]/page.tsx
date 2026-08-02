'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Phone,
  MessageCircle,
  MapPin,
  Hotel,
  Heart,
  User,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  Navigation,
  Send,
  Loader2,
  Cross,
  Locate,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Brand constants ───
const BRAND_IDENTITY = '#059669';
const BRAND_EMERGENCY = '#EF4444';

// ─── Pilgrim data interface (matches API response) ───
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
  hotelCoords: { lat: number; lng: number } | null;
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

// ─── Helper: Parse hotelCoords → { lat, lng } ───
function parseCoords(coords: { lat: number; lng: number } | string | null): { lat: number; lng: number } | null {
  if (!coords) return null;
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return { lat: coords.lat, lng: coords.lng };
  }
  if (typeof coords === 'string') {
    try {
      const parts = coords.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

// ─── Helper: Clean phone for WhatsApp ───
function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '').replace(/^\+/g, '');
}

// ─── Stagger animation variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 180, damping: 20 } },
} as const;

export default function PilgrimScanPage() {
  const { code } = useParams<{ code: string }>();

  const { t, dir, lang } = useTranslation();

  // ─── State ───
  const [state, setState] = useState<PageState>('loading');
  const [pilgrim, setPilgrim] = useState<PilgrimData | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportPhone, setReportPhone] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLng, setReportLng] = useState<number | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showReport, setShowReport] = useState(false);

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
          return;
        }

        setState('error');
      } catch {
        setState('error');
      }
    };

    fetchPilgrim();
  }, [code]);

  // ─── Share GPS location ───
  const handleShareLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReportLat(pos.coords.latitude);
        setReportLng(pos.coords.longitude);
      },
      () => {
        // silently fail
      }
    );
  }, []);

  // ─── Submit report ───
  const handleSubmitReport = useCallback(async () => {
    if (!reportName.trim() || !reportPhone.trim()) return;

    setReportSubmitting(true);
    setReportError(false);

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

      // If WhatsApp URL is returned, open it
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }
    } catch {
      setReportError(true);
    } finally {
      setReportSubmitting(false);
    }
  }, [code, reportName, reportPhone, reportMessage, reportLat, reportLng]);
  const coords = parseCoords(pilgrim?.hotelCoords ?? null);

  // ─── WhatsApp link for group leader ───
  const whatsappLeaderUrl = pilgrim?.groupLeaderPhone
    ? `https://wa.me/${cleanPhone(pilgrim.groupLeaderPhone)}?text=${encodeURIComponent(
        `🆘 Pass Identity — ${pilgrim.fullName}\nCode: ${pilgrim.qrCode}`
      )}`
    : null;

  // ─── Google Maps link for hotel ───
  const hotelMapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : null;

  return (
    <div dir={dir} className="min-h-screen bg-gray-50 flex flex-col">
      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════════════
            LOADING STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
          >
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: BRAND_IDENTITY }} />
            <p className="text-gray-500 text-sm">PassHajj…</p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            NOT FOUND STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {state === 'not_found' && (
          <motion.div
            key="not_found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center max-w-sm mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('pilgrim.identity.notFound') || 'QR code not recognized'}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('pilgrim.identity.notFoundDesc') || 'This code does not match any registered Pass Identity bracelet.'}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-xl w-full">
              <p className="text-xs text-gray-400 font-mono break-all">{code}</p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            NOT ACTIVATED STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {state === 'not_activated' && (
          <motion.div
            key="not_activated"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center max-w-sm mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
              <Shield className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('pilgrim.identity.notActivated') || 'Bracelet not activated'}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('pilgrim.identity.notActivatedDesc') || 'This bracelet has not yet been activated by its owner.'}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-xl w-full">
              <p className="text-xs text-gray-400 font-mono break-all">{code}</p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            EXPIRED STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {state === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center max-w-sm mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('pilgrim.identity.expired') || 'Bracelet expired'}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('pilgrim.identity.expiredDesc') || 'The validity period of this bracelet has ended.'}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-xl w-full">
              <p className="text-xs text-gray-400 font-mono break-all">{code}</p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ERROR STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center max-w-sm mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Erreur</h2>
            <p className="text-gray-500 text-sm">
              Une erreur est survenue. Veuillez réessayer.
            </p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ACTIVE STATE — Full pilgrim info display
        ═══════════════════════════════════════════════════════════════════ */}
        {state === 'active' && pilgrim && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* ─── 1. EMERGENCY HEADER ─── */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-5 text-white text-center"
              style={{ backgroundColor: BRAND_EMERGENCY }}
            >
              <p className="text-lg font-bold leading-tight">
                {t('pilgrim.identity.emergencyTitle') || '🚨 EMERGENCY — Pilgrim in distress'}
              </p>
              <p className="text-sm mt-1 opacity-90">
                {t('pilgrim.identity.emergencySubtitle') || 'This pilgrim is wearing a Pass Identity bracelet. Here are their vital information.'}
              </p>
            </motion.div>

            {/* ─── Scrollable content area ─── */}
            <div className="flex-1 overflow-y-auto pb-32">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-lg mx-auto w-full p-4 flex flex-col gap-4"
              >
                {/* ─── 2. IDENTITY SECTION ─── */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4" style={{ backgroundColor: BRAND_IDENTITY + '10' }}>
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: BRAND_IDENTITY }}>
                        <User className="w-5 h-5" />
                        {t('pilgrim.personal.sectionTitle') || 'Identity'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-2">
                      {/* Full name */}
                      <p className="text-2xl font-bold text-gray-900 leading-tight">
                        {pilgrim.fullName || (t('pilgrim.identity.unknownPilgrim') || 'Unknown pilgrim')}
                      </p>

                      {/* Nationality */}
                      {pilgrim.nationality && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 shrink-0" />
                          {pilgrim.nationality}
                        </p>
                      )}

                      {/* Photo */}
                      {pilgrim.photoUrl && (
                        <div className="mt-3">
                          <img
                            src={pilgrim.photoUrl}
                            alt={pilgrim.fullName}
                            className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                          />
                        </div>
                      )}

                      {/* Blood type — prominent */}
                      {pilgrim.bloodType && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge
                            className="text-sm font-bold px-3 py-1"
                            style={{ backgroundColor: BRAND_EMERGENCY, color: 'white', border: 'none' }}
                          >
                            🩸 {pilgrim.bloodType}
                          </Badge>
                        </div>
                      )}

                      {/* Medical info */}
                      {pilgrim.medicalInfo && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-xs font-semibold text-amber-800 mb-1">
                            {t('pilgrim.personal.medicalInfo') || 'Medical information'}
                          </p>
                          <p className="text-sm text-amber-900 whitespace-pre-line">
                            {pilgrim.medicalInfo}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ─── 3. HOTEL / ACCOMMODATION SECTION ─── */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4" style={{ backgroundColor: BRAND_IDENTITY + '10' }}>
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: BRAND_IDENTITY }}>
                        <Hotel className="w-5 h-5" />
                        {t('pilgrim.hotel.sectionTitle') || 'Accommodation'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-2 space-y-3">
                      {/* Mecca */}
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          {t('pilgrim.hotel.mecca') || 'Mecca'}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {t('pilgrim.hotel.hotel')}: {pilgrim.hotelMecca || (t('pilgrim.hotel.notSpecified') || 'Not specified')}
                        </p>
                        {pilgrim.roomMecca && (
                          <p className="text-sm text-gray-600">
                            {t('pilgrim.hotel.room')}: {pilgrim.roomMecca}
                          </p>
                        )}
                      </div>

                      {/* Medina */}
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          {t('pilgrim.hotel.medina') || 'Medina'}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {t('pilgrim.hotel.hotel')}: {pilgrim.hotelMedina || (t('pilgrim.hotel.notSpecified') || 'Not specified')}
                        </p>
                        {pilgrim.roomMedina && (
                          <p className="text-sm text-gray-600">
                            {t('pilgrim.hotel.room')}: {pilgrim.roomMedina}
                          </p>
                        )}
                      </div>

                      {/* Action buttons for hotel */}
                      {(hotelMapsUrl || pilgrim.hotelMecca) && (
                        <div className="flex flex-wrap gap-2">
                          {hotelMapsUrl && (
                            <a
                              href={hotelMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors min-h-[44px]"
                            >
                              <MapPin className="w-4 h-4" />
                              {t('pilgrim.hotel.showOnMap') || 'Show on map'}
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ─── 4. EMERGENCY CONTACTS SECTION ─── */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4" style={{ backgroundColor: BRAND_EMERGENCY + '10' }}>
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: BRAND_EMERGENCY }}>
                        <Phone className="w-5 h-5" />
                        {t('pilgrim.contacts.sectionTitle') || 'Emergency contacts'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-2 space-y-3">
                      {/* Group Leader */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            {t('pilgrim.contacts.groupLeader') || 'Group leader'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {pilgrim.groupLeaderPhone || (t('pilgrim.contacts.notSpecified') || 'Not specified')}
                          </p>
                        </div>
                        {pilgrim.groupLeaderPhone && (
                          <div className="flex gap-2">
                            <a
                              href={`https://wa.me/${cleanPhone(pilgrim.groupLeaderPhone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              aria-label="WhatsApp"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </a>
                            <a
                              href={`tel:${pilgrim.groupLeaderPhone}`}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              aria-label="Call"
                            >
                              <Phone className="w-5 h-5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Agency */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            {t('pilgrim.contacts.agency') || 'Agency'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {pilgrim.agencyPhone || (t('pilgrim.contacts.notSpecified') || 'Not specified')}
                          </p>
                        </div>
                        {pilgrim.agencyPhone && (
                          <a
                            href={`tel:${pilgrim.agencyPhone}`}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            aria-label="Call"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                      </div>

                      {/* Family */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            {t('pilgrim.contacts.family') || 'Family'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {pilgrim.familyContact || (t('pilgrim.contacts.notSpecified') || 'Not specified')}
                          </p>
                        </div>
                        {pilgrim.familyContact && (
                          <a
                            href={`tel:${pilgrim.familyContact}`}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            aria-label="Call"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ─── 6. REPORT FORM (collapsible) ─── */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-md overflow-hidden">
                    <button
                      onClick={() => setShowReport(!showReport)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: BRAND_IDENTITY + '08' }}
                    >
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" style={{ color: BRAND_IDENTITY }} />
                        <span className="text-base font-semibold" style={{ color: BRAND_IDENTITY }}>
                          {t('pilgrim.actions.reportTitle') || 'Report this pilgrim'}
                        </span>
                      </div>
                      {showReport ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showReport && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <CardContent className="px-4 pb-4 pt-2 space-y-3">
                            <p className="text-sm text-gray-500">
                              {t('pilgrim.actions.reportSubtitle') || 'Have you found this pilgrim in distress? Share information to help them.'}
                            </p>

                            {/* Finder name */}
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                {t('pilgrim.actions.yourName') || 'Your name'} *
                              </label>
                              <Input
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                                placeholder={lang === 'ar' ? 'اسمك' : 'Your name'}
                                className="min-h-[44px]"
                              />
                            </div>

                            {/* Finder phone */}
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                {t('pilgrim.actions.yourPhone') || 'Your phone number'} *
                              </label>
                              <Input
                                value={reportPhone}
                                onChange={(e) => setReportPhone(e.target.value)}
                                placeholder="+212 6 12 34 56 78"
                                type="tel"
                                className="min-h-[44px]"
                              />
                            </div>

                            {/* Message */}
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                {t('pilgrim.actions.message') || 'Message (optional)'}
                              </label>
                              <Textarea
                                value={reportMessage}
                                onChange={(e) => setReportMessage(e.target.value)}
                                placeholder={lang === 'ar' ? 'رسالة...' : 'Message...'}
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Share GPS location */}
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleShareLocation}
                                className="min-h-[44px] gap-1.5"
                              >
                                <Locate className="w-4 h-4" />
                                {t('pilgrim.actions.shareLocation') || 'Share my location'}
                              </Button>
                              {reportLat !== null && reportLng !== null && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ GPS
                                </span>
                              )}
                            </div>

                            {/* Submit */}
                            <Button
                              onClick={handleSubmitReport}
                              disabled={reportSubmitting || !reportName.trim() || !reportPhone.trim()}
                              className="w-full min-h-[48px] text-base font-semibold"
                              style={{ backgroundColor: BRAND_IDENTITY }}
                            >
                              {reportSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              {t('pilgrim.actions.submit') || 'Submit report'}
                            </Button>

                            {/* Success/Error messages */}
                            {reportSuccess && (
                              <div className="p-3 bg-green-50 rounded-xl text-sm text-green-700 font-medium">
                                {t('pilgrim.actions.reportSuccess') || 'Report submitted successfully!'}
                              </div>
                            )}
                            {reportError && (
                              <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700 font-medium">
                                {t('pilgrim.actions.reportError') || 'Error submitting the report.'}
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>

                {/* ─── 7. OFFLINE FALLBACK ─── */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-md bg-gray-900 text-white">
                    <CardContent className="px-4 py-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('pilgrim.offline.emergencyNumber') || 'Emergency number'}
                      </p>
                      <a
                        href="tel:997"
                        className="text-3xl font-bold text-red-400 hover:text-red-300 transition-colors block"
                      >
                        997
                      </a>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3">
                        {t('pilgrim.offline.code') || 'Unique code'}
                      </p>
                      <p className="text-lg font-mono text-yellow-400 break-all">{code}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {lang === 'fr'
                          ? 'Sans réseau, appelez les secours et communiquez ce code.'
                          : lang === 'ar'
                          ? 'بدون شبكة، اتصل بالطوارئ وقدم هذا الرمز.'
                          : 'If no network, call emergency services and provide this code.'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>

            {/* ─── 5. STICKY ACTION BUTTONS (bottom on mobile) ─── */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50">
              <div className="max-w-lg mx-auto p-3 flex gap-2 overflow-x-auto">
                {/* WhatsApp leader */}
                {whatsappLeaderUrl && (
                  <a
                    href={whatsappLeaderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-xl text-white whitespace-nowrap min-h-[48px] shrink-0"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('pilgrim.actions.whatsappLeader') || 'Contact leader'}
                  </a>
                )}

                {/* GPS directions */}
                {hotelMapsUrl && (
                  <a
                    href={hotelMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-xl text-white whitespace-nowrap min-h-[48px] shrink-0"
                    style={{ backgroundColor: BRAND_IDENTITY }}
                  >
                    <Navigation className="w-5 h-5" />
                    {t('pilgrim.actions.openMap') || 'GPS directions'}
                  </a>
                )}

                {/* Emergency call 997 */}
                <a
                  href="tel:997"
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-bold rounded-xl text-white whitespace-nowrap min-h-[48px] shrink-0"
                  style={{ backgroundColor: BRAND_EMERGENCY }}
                >
                  <Cross className="w-5 h-5" />
                  {t('pilgrim.actions.callEmergency') || 'Call 997'}
                </a>

                {/* Report pilgrim */}
                <button
                  onClick={() => {
                    setShowReport(true);
                    // Scroll to report form
                    setTimeout(() => {
                      document
                        .querySelector('[data-report-section]')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-xl border-2 border-emerald-600 text-emerald-700 whitespace-nowrap min-h-[48px] shrink-0 bg-white hover:bg-emerald-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {t('pilgrim.actions.shareInfo') || 'Report'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
