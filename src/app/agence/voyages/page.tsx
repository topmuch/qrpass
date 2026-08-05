'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Hotel,
  CheckSquare,
  Trash2,
  Square,
  AlertCircle,
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

interface Pilgrim {
  id: string;
  qrCode: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  nationality: string;
  hotelMecca?: string | null;
  roomMecca?: string | null;
  hotelMedina?: string | null;
  roomMedina?: string | null;
  isActive: boolean;
  tripId?: string | null;
}

type TransportMode = 'flight' | 'bus' | 'boat' | 'train';
type TripStatus = 'active' | 'completed' | 'cancelled' | 'pending';
type WizardStep = 'select-pilgrims' | 'trip-details' | 'confirmation';

// ── Grouping key ─────────────────────────────────────────
interface PilgrimGroup {
  key: string;
  hotelMecca: string;
  hotelMedina: string;
  pilgrims: Pilgrim[];
}

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

  // ── Wizard dialog state ──────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('select-pilgrims');

  // ── Pilgrims state (for wizard) ─────────────────────
  const [availablePilgrims, setAvailablePilgrims] = useState<Pilgrim[]>([]);
  const [pilgrimsLoading, setPilgrimsLoading] = useState(false);
  const [selectedPilgrimIds, setSelectedPilgrimIds] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // ── Trip form state ─────────────────────────────────
  const [formName, setFormName] = useState('');
  const [formDeparture, setFormDeparture] = useState('');
  const [formReturn, setFormReturn] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formTransport, setFormTransport] = useState<TransportMode>('flight');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── OTP result state ────────────────────────────────
  const [otpResult, setOtpResult] = useState<{ tripName: string; otp: string; pilgrimCount: number } | null>(null);

  // ── Regenerate state ─────────────────────────────────
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // ── Fetch available pilgrims (activated, not yet in a trip) ──
  const fetchAvailablePilgrims = useCallback(async () => {
    if (!agencyId) return;
    try {
      setPilgrimsLoading(true);
      const response = await fetch(`/api/agency/pilgrims?agencyId=${agencyId}&onlyActive=true&unassigned=true`);
      if (!response.ok) {
        toast.error('Erreur lors du chargement des pèlerins');
        return;
      }
      const data = await response.json();
      setAvailablePilgrims(data.pilgrims ?? []);
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setPilgrimsLoading(false);
    }
  }, [agencyId]);

  // ── Group pilgrims by hotel (Mecca + Medina) ─────────
  const pilgrimGroups = useMemo<PilgrimGroup[]>(() => {
    const groupMap = new Map<string, Pilgrim[]>();

    for (const p of availablePilgrims) {
      const mecca = p.hotelMecca || 'Non défini';
      const medina = p.hotelMedina || 'Non défini';
      const key = `${mecca}|||${medina}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(p);
    }

    // Sort groups: defined hotels first, then by hotel name
    const groups: PilgrimGroup[] = [];
    for (const [key, pilgrims] of groupMap) {
      const [mecca, medina] = key.split('|||');
      groups.push({ key, hotelMecca: mecca, hotelMedina: medina, pilgrims });
    }

    groups.sort((a, b) => {
      // "Non défini" goes last
      const aUndefined = a.hotelMecca === 'Non défini' && a.hotelMedina === 'Non défini';
      const bUndefined = b.hotelMecca === 'Non défini' && b.hotelMedina === 'Non défini';
      if (aUndefined && !bUndefined) return 1;
      if (!aUndefined && bUndefined) return -1;
      return a.key.localeCompare(b.key);
    });

    return groups;
  }, [availablePilgrims]);

  // ── Derived data ─────────────────────────────────────
  const filteredTrips = trips.filter((trip) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = trip.name.toLowerCase().includes(q);
      const matchOtp = trip.otp.toLowerCase().includes(q);
      if (!matchName && !matchOtp) return false;
    }
    if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: trips.length,
    pilgrims: trips.reduce((sum, t) => sum + (t._count?.pilgrims ?? t.totalPilgrims ?? 0), 0),
    bags: trips.reduce((sum, t) => sum + (t._count?.bags ?? t.totalBags ?? 0), 0),
    active: trips.filter((t) => t.status === 'active').length,
  };

  // ── Toggle pilgrim selection ─────────────────────────
  function togglePilgrim(pilgrimId: string) {
    setSelectedPilgrimIds(prev => {
      const next = new Set(prev);
      if (next.has(pilgrimId)) {
        next.delete(pilgrimId);
      } else {
        next.add(pilgrimId);
      }
      return next;
    });
  }

  function toggleGroupAll(groupKey: string) {
    const group = pilgrimGroups.find(g => g.key === groupKey);
    if (!group) return;

    const groupIds = group.pilgrims.map(p => p.id);
    const allSelected = groupIds.every(id => selectedPilgrimIds.has(id));

    setSelectedPilgrimIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach(id => next.delete(id));
      } else {
        groupIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  // ── Form validation ──────────────────────────────────
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = 'Le nom du voyage est requis';
    } else if (formName.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    if (!formDeparture) {
      errors.departure = 'La date de départ est requise';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Create trip with pilgrims ────────────────────────
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
          pilgrimIds: Array.from(selectedPilgrimIds),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || data.details?.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ') || 'Erreur lors de la création';
        toast.error(msg);
        return;
      }

      // Show confirmation with OTP
      setOtpResult({
        tripName: formName.trim(),
        otp: data.otp,
        pilgrimCount: selectedPilgrimIds.size,
      });
      setWizardStep('confirmation');
      fetchTrips();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Open wizard ──────────────────────────────────────
  function openWizard() {
    setWizardStep('select-pilgrims');
    setSelectedPilgrimIds(new Set());
    setExpandedGroup(null);
    setFormName('');
    setFormDeparture('');
    setFormReturn('');
    setFormDestination('');
    setFormTransport('flight');
    setFormErrors({});
    setOtpResult(null);
    setSubmitting(false);
    setWizardOpen(true);
    fetchAvailablePilgrims();
  }

  // ── Close wizard ─────────────────────────────────────
  function closeWizard() {
    setWizardOpen(false);
    setSelectedPilgrimIds(new Set());
    setOtpResult(null);
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

  // ── Delete trip ───────────────────────────────────────
  async function handleDeleteTrip(tripId: string, tripName: string) {
    if (!confirm(`Supprimer le voyage \u00AB ${tripName} \u00BB ? Cette action est irréversible.`)) return;
    setDeletingId(tripId);
    try {
      const response = await fetch(`/api/agency/trips/${tripId}?agencyId=${agencyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors de la suppression');
        return;
      }
      toast.success(`Voyage \u00AB ${tripName} \u00BB supprimé`);
      fetchTrips();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setDeletingId(null);
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
    const pwaUrl = 'https://passhajj.qrbags.com/manager';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `OTP Voyage \u2014 ${name}`,
          text: message,
          url: pwaUrl,
        });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  // ── Step indicators ──────────────────────────────────
  const steps = [
    { key: 'select-pilgrims', label: 'Sélection', icon: <Users className="w-4 h-4" /> },
    { key: 'trip-details', label: 'Détails', icon: <Calendar className="w-4 h-4" /> },
    { key: 'confirmation', label: 'Confirmation', icon: <CheckCircle className="w-4 h-4" /> },
  ] as const;

  const currentStepIndex = steps.findIndex(s => s.key === wizardStep);

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
            Sélectionnez des QR codes activés, créez un voyage et générez l&apos;ORP
          </p>
        </div>

        <Button
          onClick={openWizard}
          className="gap-2 shrink-0 text-white font-semibold shadow-lg"
          style={{ backgroundColor: BLEU_MARINE }}
        >
          <Plus className="w-4 h-4" />
          Créer le Voyage
        </Button>
      </div>

      {/* ── Wizard Dialog ─────────────────────────────── */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) closeWizard(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 mb-2">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i < currentStepIndex
                    ? 'bg-emerald-100 text-emerald-700'
                    : i === currentStepIndex
                      ? 'text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`} style={i === currentStepIndex ? { backgroundColor: BLEU_MARINE } : {}}>
                  {i < currentStepIndex ? <CheckCircle className="w-3.5 h-3.5" /> : step.icon}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Select Pilgrims ────────────────── */}
          {wizardStep === 'select-pilgrims' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: JAUNE }} />
                  Sélectionner les QR Codes activés
                </DialogTitle>
                <DialogDescription>
                  Choisissez les pèlerins activés (sans voyage) groupés par hôtel. Ils partageront le même ORP.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {pilgrimsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: JAUNE }} />
                    <span className="ml-2 text-slate-500">Chargement des pèlerins...</span>
                  </div>
                ) : availablePilgrims.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Aucun QR code activé disponible</p>
                    <p className="text-sm text-slate-400 mt-1">Les pèlerins doivent être activés et ne pas encore être assignés à un voyage.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Hotel className="w-3.5 h-3.5" />
                      {pilgrimGroups.length} groupe{pilgrimGroups.length > 1 ? 's' : ''} d&apos;hôtel · {availablePilgrims.length} pèlerin{availablePilgrims.length > 1 ? 's' : ''} disponible{availablePilgrims.length > 1 ? 's' : ''}
                    </p>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {pilgrimGroups.map((group) => {
                        const allSelected = group.pilgrims.every(p => selectedPilgrimIds.has(p.id));
                        const someSelected = group.pilgrims.some(p => selectedPilgrimIds.has(p.id));
                        const selectedInGroup = group.pilgrims.filter(p => selectedPilgrimIds.has(p.id)).length;
                        const isExpanded = expandedGroup === group.key;

                        return (
                          <Card key={group.key} className={`transition-all ${someSelected ? 'ring-2' : ''}`} style={someSelected ? { ringColor: JAUNE } : {}}>
                            {/* Group header */}
                            <button
                              className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
                            >
                              <button
                                className="shrink-0"
                                onClick={(e) => { e.stopPropagation(); toggleGroupAll(group.key); }}
                              >
                                {allSelected ? (
                                  <CheckSquare className="w-5 h-5" style={{ color: JAUNE }} />
                                ) : someSelected ? (
                                  <CheckSquare className="w-5 h-5 text-amber-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Hotel className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {group.hotelMecca === 'Non défini' && group.hotelMedina === 'Non défini'
                                      ? 'Hôtels non définis'
                                      : group.hotelMecca !== 'Non défini'
                                        ? `Mecque: ${group.hotelMecca}`
                                        : `Médine: ${group.hotelMedina}`
                                    }
                                  </span>
                                  {group.hotelMecca !== 'Non défini' && group.hotelMedina !== 'Non défini' && (
                                    <span className="text-xs text-slate-400">
                                      · Médine: {group.hotelMedina}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {group.pilgrims.length} pèlerin{group.pilgrims.length > 1 ? 's' : ''}
                                  {selectedInGroup > 0 && (
                                    <span className="font-medium" style={{ color: JAUNE }}> · {selectedInGroup} sélectionné{selectedInGroup > 1 ? 's' : ''}</span>
                                  )}
                                </p>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Expanded pilgrim list */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 dark:border-slate-800 p-2 space-y-1">
                                {group.pilgrims.map((pilgrim) => (
                                  <button
                                    key={pilgrim.id}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                      selectedPilgrimIds.has(pilgrim.id)
                                        ? 'bg-amber-50 dark:bg-amber-900/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                    onClick={() => togglePilgrim(pilgrim.id)}
                                  >
                                    {selectedPilgrimIds.has(pilgrim.id) ? (
                                      <CheckSquare className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                                    ) : (
                                      <Square className="w-4 h-4 shrink-0 text-slate-300" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                        {pilgrim.fullName}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        QR: {pilgrim.qrCode}
                                        {pilgrim.hotelMecca && ` · ${pilgrim.hotelMecca}`}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                      {pilgrim.nationality}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeWizard}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPilgrimIds.size === 0) {
                      toast.error('Sélectionnez au moins un pèlerin');
                      return;
                    }
                    setWizardStep('trip-details');
                  }}
                  disabled={selectedPilgrimIds.size === 0}
                  className="gap-2 text-white font-semibold"
                  style={{ backgroundColor: BLEU_MARINE }}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DialogFooter>

              {/* Selected count bar */}
              {selectedPilgrimIds.size > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {selectedPilgrimIds.size} pèlerin{selectedPilgrimIds.size > 1 ? 's' : ''} sélectionné{selectedPilgrimIds.size > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Trip Details ────────────────────── */}
          {wizardStep === 'trip-details' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: JAUNE }} />
                  Détails du Voyage
                </DialogTitle>
                <DialogDescription>
                  Complétez les informations du voyage pour les {selectedPilgrimIds.size} pèlerin{selectedPilgrimIds.size > 1 ? 's' : ''} sélectionné{selectedPilgrimIds.size > 1 ? 's' : ''}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Selected pilgrims summary */}
                <div className="p-3 rounded-lg border-2 border-dashed" style={{ borderColor: `${JAUNE}60`, backgroundColor: `${JAUNE}08` }}>
                  <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: JAUNE }}>
                    Pèlerins sélectionnés ({selectedPilgrimIds.size})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePilgrims
                      .filter(p => selectedPilgrimIds.has(p.id))
                      .slice(0, 10)
                      .map(p => (
                        <Badge key={p.id} variant="outline" className="text-xs">
                          {p.fullName}
                        </Badge>
                      ))}
                    {selectedPilgrimIds.size > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedPilgrimIds.size - 10} autres
                      </Badge>
                    )}
                  </div>
                </div>

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
                      Date de départ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trip-departure"
                      type="date"
                      value={formDeparture}
                      onChange={(e) => {
                        setFormDeparture(e.target.value);
                        if (formErrors.departure) setFormErrors(prev => ({ ...prev, departure: '' }));
                      }}
                      className={formErrors.departure ? 'border-red-300 focus-visible:ring-red-400' : ''}
                    />
                    {formErrors.departure && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        {formErrors.departure}
                      </p>
                    )}
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
                  onClick={() => setWizardStep('select-pilgrims')}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </Button>
                <Button
                  onClick={handleCreateTrip}
                  disabled={submitting}
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
                      Créer & Générer ORP
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── Step 3: Confirmation with OTP ──────────── */}
          {wizardStep === 'confirmation' && otpResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Voyage créé avec succès !
                </DialogTitle>
                <DialogDescription>
                  L&apos;ORP a été généré. Partagez-le avec le chef de groupe.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 flex flex-col items-center gap-6">
                {/* OTP / ORP Code */}
                <div className="relative">
                  <div
                    className="px-8 py-5 rounded-2xl text-center"
                    style={{ backgroundColor: `${BLEU_MARINE}10`, border: `2px dashed ${BLEU_MARINE}40` }}
                  >
                    <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: BLEU_MARINE }}>
                      Code ORP (OTP)
                    </p>
                    <p
                      className="text-4xl lg:text-5xl font-bold tracking-[0.3em] font-mono"
                      style={{ color: BLEU_MARINE }}
                    >
                      {otpResult.otp}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Valide 24 heures</p>
                  </div>
                </div>

                {/* Trip summary */}
                <div className="w-full max-w-sm space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voyage</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{otpResult.tripName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pèlerins</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{otpResult.pilgrimCount}</span>
                  </div>
                  {formDeparture && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Départ</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatDate(formDeparture)}</span>
                    </div>
                  )}
                  {formDestination && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formDestination}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <Button
                    onClick={() => shareOtp(otpResult.tripName, otpResult.otp)}
                    className="flex-1 gap-2 text-white font-semibold"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <Share2 className="w-4 h-4" />
                    Partager l&apos;ORP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyOtp(otpResult.otp)}
                    className="flex-1 gap-2 font-semibold"
                  >
                    <Copy className="w-4 h-4" />
                    Copier l&apos;ORP
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
                  onClick={closeWizard}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                ? 'Cliquez sur « Créer le Voyage » pour commencer.'
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
                  <TableHead className="w-[120px]">ORP</TableHead>
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

                    {/* ORP/OTP */}
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
                          title="Copier l'ORP"
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
                          <a href={`/agence/voyages/${trip.id}`}>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Voir</span>
                          </a>
                        </Button>

                        {/* Régénérer ORP */}
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

                        {/* Supprimer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 hover:text-red-600"
                          onClick={() => handleDeleteTrip(trip.id, trip.name)}
                          disabled={deletingId === trip.id}
                        >
                          {deletingId === trip.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden lg:inline">Supprimer</span>
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
