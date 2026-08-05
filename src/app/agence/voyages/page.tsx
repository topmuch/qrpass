'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plane,
  Bus,
  Ship,
  Train,
  Users,
  Luggage,
  CheckCircle,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Copy,
  KeyRound,
  Share2,
  Smartphone,
  Loader2,
  Calendar,
  MapPin,
  X,
} from 'lucide-react';
import { useAgency } from '../layout';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Brand colours ────────────────────────────────────────
const JAUNE = '#f4b400';
const BLEU_MARINE = '#1e3a5f';

// ── Types ────────────────────────────────────────────────
interface Trip {
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
  updatedAt: string;
  _count?: {
    pilgrims: number;
    bags: number;
  };
}

type TransportMode = 'flight' | 'bus' | 'boat' | 'train';
type TripStatus = 'active' | 'completed' | 'cancelled' | 'pending';

// ── Helpers ──────────────────────────────────────────────
const TRANSPORT_LABELS: Record<TransportMode, string> = {
  flight: 'Avion',
  bus: 'Bus',
  boat: 'Bateau',
  train: 'Train',
};

const TRANSPORT_ICONS: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
  boat: <Ship className="w-4 h-4" />,
  train: <Train className="w-4 h-4" />,
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  active: { label: 'Actif', variant: 'default', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  completed: { label: 'Terminé', variant: 'secondary', className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' },
  cancelled: { label: 'Annulé', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' },
  pending: { label: 'En attente', variant: 'outline', className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' },
};

function transportIcon(mode: string) {
  return TRANSPORT_ICONS[(mode as TransportMode)] ?? <Plane className="w-4 h-4" />;
}

function transportLabel(mode: string) {
  return TRANSPORT_LABELS[(mode as TransportMode)] ?? mode;
}

function statusBadge(status: string) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant={cfg.variant} className={`${cfg.className} font-medium`}>
      {cfg.label}
    </Badge>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

function buildShareMessage(name: string, otp: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    `Assalamou Alaikoum,\n` +
    `Voici votre code OTP pour le voyage \u00AB ${name} \u00BB :\n` +
    `\uD83D\uDD11 ${otp}\n` +
    `Entrez ce code dans l\u2019application PassHajj Manager.\n` +
    `\uD83D\uDCF1 Lien : ${origin}/manager\n` +
    `Valide 24h.`
  );
}

// ── Component ────────────────────────────────────────────
export default function VoyagesPage() {
  const { agencyId, agencyName } = useAgency();

  // ── Trip list state ──────────────────────────────────
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Dialog state ─────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [otpView, setOtpView] = useState<{ tripName: string; otp: string } | null>(null);

  // ── Form state ───────────────────────────────────────
  const [formName, setFormName] = useState('');
  const [formDeparture, setFormDeparture] = useState('');
  const [formReturn, setFormReturn] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formTransport, setFormTransport] = useState<TransportMode>('flight');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Regenerate state ─────────────────────────────────
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // ── Fetch trips ──────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    if (!agencyId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/agency/trips?agencyId=${agencyId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors du chargement des voyages');
        return;
      }
      const data = await response.json();
      setTrips(data.trips ?? []);
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ── Derived data ─────────────────────────────────────
  const filteredTrips = trips.filter((trip) => {
    // Search
    if (search) {
      const q = search.toLowerCase();
      const matchName = trip.name.toLowerCase().includes(q);
      const matchOtp = trip.otp.toLowerCase().includes(q);
      if (!matchName && !matchOtp) return false;
    }
    // Status filter
    if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: trips.length,
    pilgrims: trips.reduce((sum, t) => sum + (t._count?.pilgrims ?? t.totalPilgrims ?? 0), 0),
    bags: trips.reduce((sum, t) => sum + (t._count?.bags ?? t.totalBags ?? 0), 0),
    active: trips.filter((t) => t.status === 'active').length,
  };

  // ── Form validation ──────────────────────────────────
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = 'Le nom du voyage est requis';
    } else if (formName.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Create trip ──────────────────────────────────────
  async function handleCreateTrip() {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/agency/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          departureDate: formDeparture || undefined,
          returnDate: formReturn || undefined,
          destination: formDestination.trim() || undefined,
          transportMode: formTransport,
          agencyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || data.details?.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ') || 'Erreur lors de la création';
        toast.error(msg);
        return;
      }

      toast.success(`Voyage \u00AB ${formName.trim()} \u00BB créé avec succès`);

      // Switch to OTP display view
      setOtpView({ tripName: formName.trim(), otp: data.otp });

      // Reset form
      setFormName('');
      setFormDeparture('');
      setFormReturn('');
      setFormDestination('');
      setFormTransport('flight');
      setFormErrors({});

      // Refresh list
      fetchTrips();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reset dialog ─────────────────────────────────────
  function resetDialog() {
    setOtpView(null);
    setFormName('');
    setFormDeparture('');
    setFormReturn('');
    setFormDestination('');
    setFormTransport('flight');
    setFormErrors({});
    setSubmitting(false);
  }

  // ── Regenerate OTP ───────────────────────────────────
  async function handleRegenerateOtp(tripId: string, tripName: string) {
    setRegeneratingId(tripId);
    try {
      const response = await fetch(`/api/agency/trips/${tripId}?agencyId=${agencyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateOtp: true, agencyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la régénération');
        return;
      }

      toast.success(`OTP régénéré pour \u00AB ${tripName} \u00BB : ${data.otp}`);
      fetchTrips();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setRegeneratingId(null);
    }
  }

  // ── Copy OTP ─────────────────────────────────────────
  async function copyOtp(otp: string) {
    try {
      await navigator.clipboard.writeText(otp);
      toast.success('OTP copié dans le presse-papier');
    } catch {
      toast.error('Impossible de copier');
    }
  }

  // ── Copy PWA link ────────────────────────────────────
  async function copyPwaLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/manager`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Lien PWA copié');
    } catch {
      toast.error('Impossible de copier');
    }
  }

  // ── Share OTP ────────────────────────────────────────
  async function shareOtp(name: string, otp: string) {
    const message = buildShareMessage(name, otp);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pwaUrl = `${origin}/manager`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `OTP Voyage \u2014 ${name}`,
          text: message,
          url: pwaUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed – fall back to WhatsApp
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    // Fallback: WhatsApp web
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Gestion des Voyages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Créez des voyages, générez des OTP et partagez-les avec les chefs de groupe
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2 shrink-0 text-white font-semibold shadow-lg"
              style={{ backgroundColor: BLEU_MARINE }}
            >
              <KeyRound className="w-4 h-4" />
              Générer OTP + Nouveau Voyage
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            {!otpView ? (
              /* ── Create Trip Form ────────────────────── */
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" style={{ color: JAUNE }} />
                    Nouveau Voyage
                  </DialogTitle>
                  <DialogDescription>
                    Créez un voyage et générez automatiquement un OTP pour le chef de groupe.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="trip-name" className="font-medium">
                      Nom du voyage <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trip-name"
                      placeholder="ex: Hajj 2025 - Groupe 12"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={formErrors.name ? 'border-red-300 focus-visible:ring-red-400' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Departure & Return dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trip-departure" className="font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date de départ
                      </Label>
                      <Input
                        id="trip-departure"
                        type="date"
                        value={formDeparture}
                        onChange={(e) => setFormDeparture(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trip-return" className="font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date de retour
                      </Label>
                      <Input
                        id="trip-return"
                        type="date"
                        value={formReturn}
                        onChange={(e) => setFormReturn(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="space-y-2">
                    <Label htmlFor="trip-destination" className="font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Destination
                    </Label>
                    <Input
                      id="trip-destination"
                      placeholder="ex: La Mecque"
                      value={formDestination}
                      onChange={(e) => setFormDestination(e.target.value)}
                    />
                  </div>

                  {/* Transport Mode */}
                  <div className="space-y-2">
                    <Label className="font-medium">Mode de transport</Label>
                    <Select
                      value={formTransport}
                      onValueChange={(val) => setFormTransport(val as TransportMode)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flight">
                          <span className="flex items-center gap-2">
                            <Plane className="w-4 h-4" /> Avion
                          </span>
                        </SelectItem>
                        <SelectItem value="bus">
                          <span className="flex items-center gap-2">
                            <Bus className="w-4 h-4" /> Bus
                          </span>
                        </SelectItem>
                        <SelectItem value="boat">
                          <span className="flex items-center gap-2">
                            <Ship className="w-4 h-4" /> Bateau
                          </span>
                        </SelectItem>
                        <SelectItem value="train">
                          <span className="flex items-center gap-2">
                            <Train className="w-4 h-4" /> Train
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateTrip}
                    disabled={!formName.trim() || submitting}
                    className="gap-2 text-white font-semibold"
                    style={{ backgroundColor: BLEU_MARINE }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Créer le voyage & Générer OTP
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              /* ── OTP Display View ─────────────────────── */
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Voyage créé avec succès
                  </DialogTitle>
                  <DialogDescription>
                    Partagez ce code OTP avec le chef de groupe pour le voyage{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {otpView.tripName}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center gap-6">
                  {/* OTP Code */}
                  <div className="relative">
                    <div
                      className="px-8 py-5 rounded-2xl text-center"
                      style={{ backgroundColor: `${BLEU_MARINE}10`, border: `2px dashed ${BLEU_MARINE}40` }}
                    >
                      <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: BLEU_MARINE }}>
                        Code OTP
                      </p>
                      <p
                        className="text-4xl lg:text-5xl font-bold tracking-[0.3em] font-mono"
                        style={{ color: BLEU_MARINE }}
                      >
                        {otpView.otp}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">Valide 24 heures</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Button
                      onClick={() => shareOtp(otpView.tripName, otpView.otp)}
                      className="flex-1 gap-2 text-white font-semibold"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <Share2 className="w-4 h-4" />
                      Partager l&apos;OTP
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyOtp(otpView.otp)}
                      className="flex-1 gap-2 font-semibold"
                    >
                      <Copy className="w-4 h-4" />
                      Copier l&apos;OTP
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={copyPwaLink}
                    className="gap-2 w-full max-w-sm font-medium"
                  >
                    <Smartphone className="w-4 h-4" />
                    Copier le lien PWA
                  </Button>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetDialog();
                      setDialogOpen(false);
                    }}
                  >
                    Fermer
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: BLEU_MARINE }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Plane className="w-4 h-4" style={{ color: BLEU_MARINE }} />
              Total Voyages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: BLEU_MARINE }}>
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Pèlerins Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {stats.pilgrims}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: JAUNE }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Luggage className="w-4 h-4" style={{ color: JAUNE }} />
              Bagages Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: JAUNE }}>
              {stats.bags}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Voyages Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {stats.active}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom ou OTP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Trips Table ──────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: JAUNE }} />
            <span>Chargement des voyages...</span>
          </div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Plane className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              {trips.length === 0
                ? 'Aucun voyage créé'
                : 'Aucun voyage ne correspond à la recherche'}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {trips.length === 0
                ? 'Cliquez sur « Générer OTP + Nouveau Voyage » pour commencer.'
                : 'Essayez de modifier vos critères de recherche.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Voyage</TableHead>
                  <TableHead className="w-[100px]">Statut</TableHead>
                  <TableHead className="w-[120px]">OTP</TableHead>
                  <TableHead className="w-[80px] text-center">Pèlerins</TableHead>
                  <TableHead className="w-[80px] text-center">Bagages</TableHead>
                  <TableHead className="w-[120px]">Départ</TableHead>
                  <TableHead className="w-[180px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id} className="group">
                    {/* Voyage name + transport icon */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: `${BLEU_MARINE}10`, color: BLEU_MARINE }}>
                          {transportIcon(trip.transportMode)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {trip.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {transportLabel(trip.transportMode)}
                            {trip.destination ? ` · ${trip.destination}` : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{statusBadge(trip.status)}</TableCell>

                    {/* OTP */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code
                          className="font-mono text-sm font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${JAUNE}15`, color: BLEU_MARINE }}
                        >
                          {trip.otp}
                        </code>
                        <button
                          onClick={() => copyOtp(trip.otp)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          title="Copier l'OTP"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Pèlerins */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{trip._count?.pilgrims ?? trip.totalPilgrims ?? 0}</span>
                      </div>
                    </TableCell>

                    {/* Bagages */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Luggage className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{trip._count?.bags ?? trip.totalBags ?? 0}</span>
                      </div>
                    </TableCell>

                    {/* Départ */}
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(trip.departureDate)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Voir */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          asChild
                        >
                          <a href={`/agency/trips/${trip.id}`}>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Voir</span>
                          </a>
                        </Button>

                        {/* Régénérer OTP */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 hover:text-amber-600"
                          onClick={() => handleRegenerateOtp(trip.id, trip.name)}
                          disabled={regeneratingId === trip.id}
                        >
                          {regeneratingId === trip.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Régénérer</span>
                        </Button>

                        {/* Partager */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 hover:text-emerald-600"
                          onClick={() => shareOtp(trip.name, trip.otp)}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Partager</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Summary Footer ───────────────────────────── */}
      {!loading && trips.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          {filteredTrips.length} voyage{filteredTrips.length > 1 ? 's' : ''} affiché{filteredTrips.length > 1 ? 's' : ''} sur {trips.length} au total
        </p>
      )}
    </div>
  );
}
