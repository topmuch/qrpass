'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Users,
  Luggage,
  CheckCircle,
  Plane,
  Bus,
  Ship,
  Train,
  MapPin,
  Calendar,
  Share2,
  Smartphone,
  Loader2,
  X,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { useAgency } from '../../layout';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// ── Brand colours ────────────────────────────────────────
const JAUNE = '#f4b400';
const BLEU_MARINE = '#1e3a5f';

// ── Types ────────────────────────────────────────────────
interface TripDetail {
  id: string;
  name: string;
  otp: string;
  otpExpiry: string;
  isUsed: boolean;
  status: string;
  departureDate: string | null;
  returnDate: string | null;
  destination: string | null;
  transportMode: string;
  totalPilgrims: number;
  totalBags: number;
  createdAt: string;
  pilgrims: { id: string; qrCode: string; fullName: string; nationality: string; hotelMecca?: string | null; hotelMedina?: string | null }[];
  bags: { id: string; qrCode: string; ownerName: string; baggageType: string }[];
  _count?: { pilgrims: number; bags: number; leaderScans: number; incidents: number };
}

type TransportMode = 'flight' | 'bus' | 'boat' | 'train';

// ── Helpers ──────────────────────────────────────────────
const TRANSPORT_LABELS: Record<TransportMode, string> = {
  flight: 'Avion', bus: 'Bus', boat: 'Bateau', train: 'Train',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  active: { label: 'Actif', variant: 'default', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  completed: { label: 'Terminé', variant: 'secondary', className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' },
  cancelled: { label: 'Annulé', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' },
  pending: { label: 'En attente', variant: 'outline', className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  } catch { return '—'; }
}

function transportIcon(mode: string) {
  const cls = 'w-4 h-4';
  switch (mode) {
    case 'flight': return <Plane className={cls} />;
    case 'bus': return <Bus className={cls} />;
    case 'boat': return <Ship className={cls} />;
    case 'train': return <Train className={cls} />;
    default: return <Plane className={cls} />;
  }
}

function buildShareMessage(name: string, otp: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `Assalamou Alaikoum,\nVoici votre code OTP pour le voyage «E ${name} » :\nOTP ${otp}\nEntrez ce code dans l'application PassHajj Manager.\nLien : ${origin}/manager\nValide 24h.`;
}

// ── Component ────────────────────────────────────────────
export default function VoyageDetailPage() {
  const { agencyId } = useAgency();
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch trip ──────────────────────────────────────
  const fetchTrip = useCallback(async () => {
    if (!agencyId || !tripId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/agency/trips/${tripId}?agencyId=${agencyId}`);
      if (!res.ok) {
        toast.error('Voyage non trouvé');
        router.replace('/agence/voyages');
        return;
      }
      const data = await res.json();
      setTrip(data.trip);
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [agencyId, tripId, router]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  // ── Regenerate OTP ───────────────────────────────────
  async function handleRegenerateOtp() {
    if (!trip) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/agency/trips/${tripId}?agencyId=${agencyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateOtp: true, agencyId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erreur'); return; }
      toast.success(`OTP régénéré : ${data.otp}`);
      fetchTrip();
    } catch { toast.error('Erreur réseau'); }
    finally { setRegenerating(false); }
  }

  // ── Delete trip ──────────────────────────────────────
  async function handleDeleteTrip() {
    if (!trip) return;
    if (!confirm(`Supprimer le voyage «E ${trip.name} » ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/agency/trips/${tripId}?agencyId=${agencyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || 'Erreur'); return; }
      toast.success(`Voyage «E ${trip.name} » supprimé`);
      router.replace('/agence/voyages');
    } catch { toast.error('Erreur réseau'); }
    finally { setDeleting(false); }
  }

  // ── Copy OTP ─────────────────────────────────────────
  async function copyOtp(otp: string) {
    try { await navigator.clipboard.writeText(otp); toast.success('OTP copié'); }
    catch { toast.error('Impossible de copier'); }
  }

  // ── Share OTP ────────────────────────────────────────
  async function shareOtp() {
    if (!trip) return;
    const message = buildShareMessage(trip.name, trip.otp);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pwaUrl = `${origin}/manager`;
    if (navigator.share) {
      try { await navigator.share({ title: `OTP Voyage — ${trip.name}`, text: message, url: pwaUrl }); return; }
      catch (err) { if ((err as DOMException).name === 'AbortError') return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: JAUNE }} />
        <span className="ml-3 text-slate-500">Chargement du voyage...</span>
      </div>
    );
  }

  if (!trip) return null;

  const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.pending;
  const pilgrimCount = trip._count?.pilgrims ?? trip.pilgrims?.length ?? trip.totalPilgrims ?? 0;
  const bagCount = trip._count?.bags ?? trip.bags?.length ?? trip.totalBags ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/agence/voyages')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${BLEU_MARINE}10`, color: BLEU_MARINE }}>
            {transportIcon(trip.transportMode)}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{trip.name}</h1>
            <p className="text-sm text-slate-400">{TRANSPORT_LABELS[(trip.transportMode as TransportMode)] ?? trip.transportMode}{trip.destination ? ` · ${trip.destination}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusCfg.variant} className={`${statusCfg.className} font-medium`}>
            {statusCfg.label}
          </Badge>
          <Button variant="destructive" size="sm" onClick={handleDeleteTrip} disabled={deleting} className="gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span className="hidden sm:inline">Supprimer</span>
          </Button>
        </div>
      </div>

      {/* ── OTP Card ─────────────────────────────────── */}
      <Card className="border-2" style={{ borderColor: `${JAUNE}40` }}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* OTP Display */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: BLEU_MARINE }}>
                Code ORP (OTP)
              </p>
              <p className="text-4xl lg:text-5xl font-bold tracking-[0.3em] font-mono" style={{ color: BLEU_MARINE }}>
                {trip.otp}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Valide 24h · Créé le {formatDate(trip.createdAt)}
              </p>
            </div>
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={shareOtp} className="gap-2 text-white" style={{ backgroundColor: '#25D366' }}>
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
              <Button variant="outline" onClick={() => copyOtp(trip.otp)} className="gap-2">
                <Copy className="w-4 h-4" />
                Copier
              </Button>
              <Button variant="outline" onClick={handleRegenerateOtp} disabled={regenerating} className="gap-2">
                {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Régénérer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: BLEU_MARINE }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: BLEU_MARINE }} />
              Pèlerins
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold" style={{ color: BLEU_MARINE }}>{pilgrimCount}</p></CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: JAUNE }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Luggage className="w-4 h-4" style={{ color: JAUNE }} />
              Bagages
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold" style={{ color: JAUNE }}>{bagCount}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Départ
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-lg font-bold text-emerald-600">{formatDate(trip.departureDate)}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-lg font-bold text-sky-600">{trip.destination || '—'}</p></CardContent>
        </Card>
      </div>

      {/* ── Pilgrims List ────────────────────────────── */}
      {trip.pilgrims && trip.pilgrims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: BLEU_MARINE }} />
              Pèlerins du voyage ({trip.pilgrims.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {trip.pilgrims.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: BLEU_MARINE }}>
                    {p.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">{p.fullName}</p>
                    <p className="text-xs text-slate-400">QR: {p.qrCode}{p.hotelMecca ? ` · ${p.hotelMecca}` : ''}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{p.nationality}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Trip Info ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations du voyage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between"><span className="text-slate-400">ID</span><span className="font-mono text-xs">{trip.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Statut</span><span>{statusCfg.label}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Transport</span><span>{TRANSPORT_LABELS[(trip.transportMode as TransportMode)] ?? trip.transportMode}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Départ</span><span>{formatDate(trip.departureDate)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Retour</span><span>{formatDate(trip.returnDate)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Destination</span><span>{trip.destination || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Créé le</span><span>{formatDate(trip.createdAt)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
