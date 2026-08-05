'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Link as LinkIcon,
  Users,
  Luggage,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  CopyCheck,
  Plane,
  Bus,
  Ship,
  Train,
  Hotel,
  MapPin,
  CalendarDays,
  Timer,
  XCircle,
  Flag,
  Globe,
} from 'lucide-react';
import { getTrip, getScanStats, regenerateOTP, cancelTrip, updateTrip } from '@/services/api';
import type { TripDetail, ScanStats } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

// ─── Theme constants ───
const JAUNE = '#f4b400';
const BLEU_MARINE = '#1e3a5f';

// ─── Helper: status badge config ───
function getStatusConfig(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Actif', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'completed':
      return { label: 'Terminé', bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' };
    case 'cancelled':
      return { label: 'Annulé', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
    case 'pending':
      return { label: 'En attente', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  }
}

// ─── Helper: transport icon ───
function TransportIcon({ mode }: { mode?: string | null }) {
  const cls = 'w-4 h-4';
  switch (mode) {
    case 'flight': return <Plane className={cls} />;
    case 'bus': return <Bus className={cls} />;
    case 'boat': return <Ship className={cls} />;
    case 'train': return <Train className={cls} />;
    default: return <Globe className={cls} />;
  }
}

// ─── Helper: format date ───
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Helper: compute remaining time string ───
function computeRemaining(expiryIso: string): string {
  const diff = new Date(expiryIso).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Helper: OTP countdown ───
function useOtpCountdown(expiryIso?: string | null) {
  const initialValue = expiryIso ? computeRemaining(expiryIso) : 'Expiré';
  const [remaining, setRemaining] = useState<string>(initialValue);

  useEffect(() => {
    if (!expiryIso) return;

    const tick = () => {
      setRemaining(computeRemaining(expiryIso));
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiryIso]);

  return remaining;
}

// ═══════════════════════════════════════════════════════════════
//  SKELETON LOADER
// ═══════════════════════════════════════════════════════════════

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        {/* Main content skeleton */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  // ─── State ───
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);

  // ─── OTP countdown ───
  const otpCountdown = useOtpCountdown(trip?.otpExpiry);

  // ─── Data loading ───
  const loadData = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    try {
      const [tripData, statsData] = await Promise.all([
        getTrip(tripId),
        getScanStats(tripId).catch(() => null), // scan stats may not be available
      ]);
      setTrip(tripData);
      setScanStats(statsData);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Erreur lors du chargement du voyage';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Copy OTP ───
  const handleCopyOtp = async () => {
    if (!trip?.otp) return;
    try {
      await navigator.clipboard.writeText(trip.otp);
      setOtpCopied(true);
      toast.success('OTP copié dans le presse-papiers');
      setTimeout(() => setOtpCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier l\'OTP');
    }
  };

  // ─── Copy PWA link ───
  const handleCopyPwaLink = async () => {
    if (!trip?.otp) return;
    const link = `${window.location.origin}/?otp=${trip.otp}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Lien PWA copié dans le presse-papiers');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  // ─── Regenerate OTP ───
  const handleRegenerateOtp = async () => {
    if (!tripId) return;
    setRegenerating(true);
    try {
      const result = await regenerateOTP(tripId);
      toast.success(`Nouveau OTP généré : ${result.otp}`);
      // Reload trip data to reflect new OTP
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de la régénération de l\'OTP');
    } finally {
      setRegenerating(false);
    }
  };

  // ─── Cancel trip ───
  const handleCancelTrip = async () => {
    if (!tripId) return;
    setCancelling(true);
    try {
      await cancelTrip(tripId);
      toast.success('Voyage annulé avec succès');
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de l\'annulation du voyage');
    } finally {
      setCancelling(false);
    }
  };

  // ─── Mark as completed ───
  const handleMarkCompleted = async () => {
    if (!tripId) return;
    setCompleting(true);
    try {
      await updateTrip(tripId, { status: 'completed' });
      toast.success('Voyage marqué comme terminé');
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de la mise à jour du voyage');
    } finally {
      setCompleting(false);
    }
  };

  // ─── Loading state ───
  if (loading) return <PageSkeleton />;

  // ─── Error state ───
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: BLEU_MARINE }}>
              Voyage introuvable
            </h2>
            <p className="text-gray-500 text-sm">
              {error || 'Ce voyage n\'existe pas ou vous n\'avez pas accès à cette ressource.'}
            </p>
            <Button
              asChild
              className="mt-2"
              style={{ backgroundColor: JAUNE, color: BLEU_MARINE }}
            >
              <Link href="/agency/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Derived data ───
  const statusConfig = getStatusConfig(trip.status);
  const isOtpExpired = trip.otpExpiry ? new Date(trip.otpExpiry).getTime() < Date.now() : true;
  const identityScans = scanStats?.byType?.identity ?? 0;
  const baggageScans = scanStats?.byType?.baggage ?? 0;
  const totalScans = scanStats?.total ?? 0;

  // Zone labels
  const zoneLabels: Record<string, string> = {
    Aéroport: 'Aéroport',
    Bus: 'Bus',
    Hôtel: 'Hôtel',
    Haram: 'Haram',
  };

  // Timeline entries (sorted chronologically, last 10)
  const timelineEntries = scanStats?.timeline
    ? Object.entries(scanStats.timeline)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-10)
    : [];

  // Sync progress
  const syncedCount = scanStats?.sync?.synced ?? 0;
  const unsyncedCount = scanStats?.sync?.unsynced ?? 0;
  const syncTotal = syncedCount + unsyncedCount;
  const syncProgress = syncTotal > 0 ? Math.round((syncedCount / syncTotal) * 100) : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="shrink-0 rounded-lg border-gray-200 hover:border-0"
            style={{ color: BLEU_MARINE }}
          >
            <Link href="/agency/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate" style={{ color: BLEU_MARINE }}>
              {trip.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{trip.agency?.name || 'Agence'}</p>
          </div>
          <Badge
            className={`${statusConfig.bg} ${statusConfig.text} border-0 px-3 py-1 text-sm font-semibold`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-1.5 inline-block`} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pèlerins */}
          <Card className="rounded-xl border-0 shadow-sm" style={{ borderTop: `3px solid ${JAUNE}` }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pèlerins</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${JAUNE}20` }}>
                  <Users className="w-4 h-4" style={{ color: JAUNE }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: BLEU_MARINE }}>{trip.pilgrimCount}</p>
            </CardContent>
          </Card>

          {/* Total Bagages */}
          <Card className="rounded-xl border-0 shadow-sm" style={{ borderTop: `3px solid ${BLEU_MARINE}` }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bagages</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BLEU_MARINE}15` }}>
                  <Luggage className="w-4 h-4" style={{ color: BLEU_MARINE }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: BLEU_MARINE }}>{trip.bagCount}</p>
            </CardContent>
          </Card>

          {/* Scans Total */}
          <Card className="rounded-xl border-0 shadow-sm" style={{ borderTop: '3px solid #10b981' }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scans Total</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
                  <ScanLine className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: BLEU_MARINE }}>{totalScans}</p>
            </CardContent>
          </Card>

          {/* Scans Synchronisés */}
          <Card className="rounded-xl border-0 shadow-sm" style={{ borderTop: '3px solid #8b5cf6' }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Synchronisés</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: BLEU_MARINE }}>{syncedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* ═══ MAIN CONTENT GRID ═══ */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ─── LEFT COLUMN (2/3) ─── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ─── TRIP INFO CARD ─── */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: `${BLEU_MARINE}08` }}>
                <CardTitle className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Informations du voyage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Description */}
                {trip.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{trip.description}</p>
                )}

                {/* Trip details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {/* Dates */}
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                    <span className="text-gray-500 shrink-0">Départ :</span>
                    <span className="font-medium text-gray-800 truncate">{formatDate(trip.departureDate)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                    <span className="text-gray-500 shrink-0">Retour :</span>
                    <span className="font-medium text-gray-800 truncate">{formatDate(trip.returnDate)}</span>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                    <span className="text-gray-500 shrink-0">Destination :</span>
                    <span className="font-medium text-gray-800">{trip.destination || '—'}</span>
                  </div>

                  {/* Transport */}
                  <div className="flex items-center gap-2.5">
                    <TransportIcon mode={trip.transportMode} />
                    <span className="text-gray-500 shrink-0">Transport :</span>
                    <span className="font-medium text-gray-800 capitalize">{trip.transportMode || '—'}</span>
                  </div>

                  {/* Airline */}
                  {trip.airline && (
                    <div className="flex items-center gap-2.5">
                      <Plane className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      <span className="text-gray-500 shrink-0">Compagnie :</span>
                      <span className="font-medium text-gray-800">{trip.airline}</span>
                    </div>
                  )}

                  {/* Flight Number */}
                  {trip.flightNumber && (
                    <div className="flex items-center gap-2.5">
                      <Flag className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      <span className="text-gray-500 shrink-0">Vol :</span>
                      <span className="font-medium text-gray-800">{trip.flightNumber}</span>
                    </div>
                  )}

                  {/* Hotels */}
                  {trip.hotelMecca && (
                    <div className="flex items-center gap-2.5">
                      <Hotel className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      <span className="text-gray-500 shrink-0">Hôtel La Mecque :</span>
                      <span className="font-medium text-gray-800">{trip.hotelMecca}</span>
                    </div>
                  )}
                  {trip.hotelMedina && (
                    <div className="flex items-center gap-2.5">
                      <Hotel className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      <span className="text-gray-500 shrink-0">Hôtel Médine :</span>
                      <span className="font-medium text-gray-800">{trip.hotelMedina}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* OTP Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: BLEU_MARINE }}>Code OTP</span>
                    {isOtpExpired && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expiré</Badge>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* OTP Display */}
                    <div
                      className="flex items-center gap-3 px-5 py-3 rounded-xl"
                      style={{ backgroundColor: `${JAUNE}15`, border: `1.5px dashed ${JAUNE}` }}
                    >
                      <span
                        className="text-3xl font-mono font-bold tracking-[0.3em]"
                        style={{ color: BLEU_MARINE }}
                      >
                        {trip.otp}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyOtp}
                        className="h-8 w-8 rounded-lg hover:bg-white/60"
                        style={{ color: BLEU_MARINE }}
                      >
                        {otpCopied ? <CopyCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <Timer className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${isOtpExpired ? 'text-red-500' : 'text-gray-600'}`}>
                        {otpCountdown}
                      </span>
                    </div>
                  </div>

                  {/* OTP Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateOtp}
                      disabled={regenerating}
                      className="rounded-lg border-gray-200 text-gray-700 hover:text-gray-900"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
                      {regenerating ? 'Régénération...' : 'Régénérer l\'OTP'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPwaLink}
                      className="rounded-lg border-gray-200 text-gray-700 hover:text-gray-900"
                    >
                      {linkCopied ? (
                        <CopyCheck className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {linkCopied ? 'Lien copié !' : 'Copier le lien PWA'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── SCAN BREAKDOWN CARD ─── */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: `${BLEU_MARINE}08` }}>
                <CardTitle className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Répartition des scans
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* By Type */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Par type</h4>
                  <div className="flex gap-4">
                    {[
                      { label: 'Identité', count: identityScans, color: JAUNE },
                      { label: 'Bagage', count: baggageScans, color: BLEU_MARINE },
                    ].map((item) => {
                      const pct = totalScans > 0 ? (item.count / totalScans) * 100 : 0;
                      return (
                        <div key={item.label} className="flex-1 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.label}</span>
                            <span className="font-semibold" style={{ color: BLEU_MARINE }}>{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* By Zone */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Par zone</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['Aéroport', 'Bus', 'Hôtel', 'Haram'] as const).map((zone) => {
                      const count = scanStats?.byZone?.[zone] ?? 0;
                      const zoneColors: Record<string, string> = {
                        Aéroport: '#3b82f6',
                        Bus: '#f59e0b',
                        Hôtel: '#8b5cf6',
                        Haram: '#10b981',
                      };
                      return (
                        <div
                          key={zone}
                          className="text-center p-3 rounded-xl"
                          style={{ backgroundColor: `${zoneColors[zone]}10` }}
                        >
                          <p className="text-xl font-bold" style={{ color: zoneColors[zone] }}>{count}</p>
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">{zoneLabels[zone] || zone}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* By Status */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Par statut</h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'success', label: 'Succès', icon: CheckCircle2, color: '#10b981', bg: '#10b98115' },
                      { key: 'error', label: 'Erreur', icon: AlertCircle, color: '#ef4444', bg: '#ef444415' },
                      { key: 'duplicate', label: 'Doublon', icon: Copy, color: '#f59e0b', bg: '#f59e0b15' },
                    ].map((item) => {
                      const count = scanStats?.byStatus?.[item.key] ?? 0;
                      return (
                        <div
                          key={item.key}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                          style={{ backgroundColor: item.bg }}
                        >
                          <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: item.color }}>{count}</p>
                            <p className="text-[10px] text-gray-500 -mt-0.5">{item.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Sync Status */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Synchronisation</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-gray-600">Synchronisés</span>
                      </div>
                      <span className="font-semibold" style={{ color: BLEU_MARINE }}>{syncedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-gray-600">Non synchronisés</span>
                      </div>
                      <span className="font-semibold text-amber-600">{unsyncedCount}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Progression</span>
                        <span className="font-semibold">{syncProgress}%</span>
                      </div>
                      <Progress
                        value={syncProgress}
                        className="h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── TIMELINE CARD ─── */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: `${BLEU_MARINE}08` }}>
                <CardTitle className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Chronologie des scans
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {timelineEntries.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Aucune donnée de scan disponible</p>
                ) : (
                  <div className="space-y-0">
                    {timelineEntries.map(([hour, count], idx) => (
                      <div key={hour}>
                        <div className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: `${JAUNE}20`, color: BLEU_MARINE }}
                            >
                              {hour.slice(0, 2)}
                            </div>
                            <span className="text-sm text-gray-600">{hour}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: BLEU_MARINE }}>{count}</span>
                            <span className="text-[10px] text-gray-400">scans</span>
                          </div>
                        </div>
                        {idx < timelineEntries.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── RIGHT COLUMN (1/3) ─── */}
          <div className="space-y-6">

            {/* ─── GROUPS CARD ─── */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: `${BLEU_MARINE}08` }}>
                <CardTitle className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Groupes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {trip.groups.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun groupe défini</p>
                ) : (
                  <div className="space-y-1 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {trip.groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: group.color || JAUNE }}
                          />
                          <span className="text-sm font-medium text-gray-800 truncate">{group.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold" style={{ color: BLEU_MARINE }}>
                            {group._count.pilgrims}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── ACTIONS CARD ─── */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: `${BLEU_MARINE}08` }}>
                <CardTitle className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {trip.status === 'active' && (
                  <>
                    <Button
                      className="w-full rounded-lg font-medium"
                      style={{ backgroundColor: JAUNE, color: BLEU_MARINE }}
                      onClick={handleMarkCompleted}
                      disabled={completing}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {completing ? 'Mise à jour...' : 'Marquer comme terminé'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full rounded-lg font-medium"
                      onClick={handleCancelTrip}
                      disabled={cancelling}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {cancelling ? 'Annulation...' : 'Annuler le voyage'}
                    </Button>
                  </>
                )}

                {trip.status === 'completed' && (
                  <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-sky-50 text-sky-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Ce voyage est terminé</span>
                  </div>
                )}

                {trip.status === 'cancelled' && (
                  <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-red-50 text-red-700 text-sm">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Ce voyage a été annulé</span>
                  </div>
                )}

                {/* Refresh data */}
                <Button
                  variant="outline"
                  className="w-full rounded-lg border-gray-200 text-gray-600 hover:text-gray-900"
                  onClick={loadData}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rafraîchir les données
                </Button>
              </CardContent>
            </Card>

            {/* ─── QUICK INFO CARD ─── */}
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-3" style={{ backgroundColor: `${BLEU_MARINE}08` }}>
                <CardTitle className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Résumé rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé le</span>
                  <span className="font-medium text-gray-800">{formatDate(trip.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Mis à jour le</span>
                  <span className="font-medium text-gray-800">{formatDate(trip.updatedAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">OTP utilisé</span>
                  <span className="font-medium text-gray-800">{trip.otpUsed ? 'Oui' : 'Non'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Groupes</span>
                  <span className="font-medium" style={{ color: BLEU_MARINE }}>{trip.groups.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
