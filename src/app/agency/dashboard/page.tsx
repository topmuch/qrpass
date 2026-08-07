'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plane,
  Users,
  Luggage,
  CheckCircle,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Calendar,
  MapPin,
  Bus,
  Ship,
  Train,
  Hotel,
  Building2,
  KeyRound,
  Share2,
  Smartphone,
} from 'lucide-react';
import { listTrips, createTrip, regenerateOTP, getAgencyUser } from '@/services/api';
import type { TripListItem, TripsListResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ─── Brand colors ───
const JAUNE = '#f4b400';
const BLEU_MARINE = '#1e3a5f';

// ─── Status helpers ───
type TripStatus = 'active' | 'completed' | 'cancelled' | 'pending';

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() as TripStatus;
  switch (s) {
    case 'active':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Actif
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Terminé
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Annulé
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          En attente
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTransportIcon(mode: string | null | undefined) {
  switch (mode?.toLowerCase()) {
    case 'flight':
    case 'avion':
      return <Plane className="w-4 h-4" />;
    case 'bus':
      return <Bus className="w-4 h-4" />;
    case 'boat':
    case 'bateau':
      return <Ship className="w-4 h-4" />;
    case 'train':
      return <Train className="w-4 h-4" />;
    default:
      return <Plane className="w-4 h-4" />;
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ─── Create Trip Form State ───
interface CreateTripForm {
  name: string;
  description: string;
  departureDate: string;
  returnDate: string;
  destination: string;
  transportMode: 'flight' | 'bus' | 'boat' | 'train' | '';
  airline: string;
  flightNumber: string;
  hotelMecca: string;
  hotelMedina: string;
}

const EMPTY_FORM: CreateTripForm = {
  name: '',
  description: '',
  departureDate: '',
  returnDate: '',
  destination: '',
  transportMode: '',
  airline: '',
  flightNumber: '',
  hotelMecca: '',
  hotelMedina: '',
};

// ═══════════════════════════════════════════════════════════════
//  Main Page Component
// ═══════════════════════════════════════════════════════════════

export default function AgencyDashboardPage() {
  const router = useRouter();

  // ─── State ───
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrips, setTotalTrips] = useState(0);
  const pageSize = 10;

  // Create trip dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTripForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createdOTP, setCreatedOTP] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number | null>(null);

  // Regenerate OTP
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Auto-refresh
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load agency user ───
  useEffect(() => {
    const user = getAgencyUser();
    if (user?.agencyId) {
      setAgencyId(user.agencyId);
    } else if (user?.agency?.id) {
      setAgencyId(user.agency.id);
    }
  }, []);

  // ─── Fetch trips ───
  const fetchTrips = useCallback(async () => {
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: pageSize,
      };
      if (agencyId) params.agencyId = agencyId;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await listTrips(params);

      let filteredData = response.data || [];

      // Client-side search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(
          (t) =>
            t.name?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.otp?.toLowerCase().includes(q)
        );
      }

      setTrips(filteredData);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalTrips(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      if (!err?.isOffline) {
        toast.error('Erreur lors du chargement des voyages');
      }
    } finally {
      setLoading(false);
    }
  }, [agencyId, currentPage, statusFilter, searchQuery]);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchTrips();
    refreshIntervalRef.current = setInterval(fetchTrips, 30000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchTrips]);

  // ─── OTP countdown (auto-close dialog after 5s) ───
  useEffect(() => {
    if (otpCountdown === null) return;
    if (otpCountdown <= 0) {
      setCreatedOTP(null);
      setOtpCountdown(null);
      setCreateDialogOpen(false);
      setCreateForm(EMPTY_FORM);
      return;
    }
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const totalVoyages = totalTrips || trips.length;
    const totalPilgrims = trips.reduce((sum, t) => sum + (t.pilgrimCount || t.totalPilgrims || 0), 0);
    const totalBags = trips.reduce((sum, t) => sum + (t.bagCount || t.totalBags || 0), 0);
    const activeVoyages = trips.filter((t) => t.status?.toLowerCase() === 'active').length;
    return { totalVoyages, totalPilgrims, totalBags, activeVoyages };
  }, [trips, totalTrips]);

  // ─── Create Trip ───
  const handleCreateTrip = async () => {
    if (!createForm.name.trim()) {
      toast.error('Le nom du voyage est requis');
      return;
    }
    if (!agencyId) {
      toast.error('Identifiant agence introuvable. Reconnectez-vous.');
      return;
    }

    setCreating(true);
    try {
      const payload: Record<string, any> = {
        name: createForm.name.trim(),
        agencyId,
      };
      if (createForm.description.trim()) payload.description = createForm.description.trim();
      if (createForm.departureDate) payload.departureDate = createForm.departureDate;
      if (createForm.returnDate) payload.returnDate = createForm.returnDate;
      if (createForm.destination.trim()) payload.destination = createForm.destination.trim();
      if (createForm.transportMode) payload.transportMode = createForm.transportMode;
      if (createForm.airline.trim()) payload.airline = createForm.airline.trim();
      if (createForm.flightNumber.trim()) payload.flightNumber = createForm.flightNumber.trim();
      if (createForm.hotelMecca.trim()) payload.hotelMecca = createForm.hotelMecca.trim();
      if (createForm.hotelMedina.trim()) payload.hotelMedina = createForm.hotelMedina.trim();

      const result = await createTrip(payload);

      const newOtp = result?.otp || result?.data?.otp || '';
      setCreatedOTP(newOtp);
      setOtpCountdown(5);

      // Add new trip to list
      if (result?.data || result?.id) {
        const newTrip = result.data || result;
        setTrips((prev) => [newTrip, ...prev]);
      }

      toast.success('Voyage créé avec succès !');
      // Refresh list in background
      fetchTrips();
    } catch (err: any) {
      console.error('Failed to create trip:', err);
      toast.error(err?.response?.data?.message || 'Erreur lors de la création du voyage');
    } finally {
      setCreating(false);
    }
  };

  // ─── Regenerate OTP ───
  const handleRegenerateOTP = async (tripId: string, tripName: string) => {
    setRegeneratingId(tripId);
    try {
      const result = await regenerateOTP(tripId);
      const newOtp = result.otp;

      // Update trip in list
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, otp: newOtp, otpExpiry: result.otpExpiry }
            : t
        )
      );

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">OTP régénéré pour {tripName}</span>
          <span className="font-mono text-lg tracking-widest">{newOtp}</span>
        </div>,
        { duration: 6000 }
      );
    } catch (err: any) {
      console.error('Failed to regenerate OTP:', err);
      toast.error(err?.response?.data?.message || 'Erreur lors de la régénération de l\'OTP');
    } finally {
      setRegeneratingId(null);
    }
  };

  // ─── Copy to clipboard ───
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié !`);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  // ─── Share OTP via Web Share API ───
  const shareOtp = async (otp: string, tripName: string) => {
    const pwaLink = typeof window !== 'undefined' ? `${window.location.origin}/manager` : 'https://passhajj.qrbags.com/manager';
    const shareData = {
      title: `Code OTP - ${tripName}`,
      text: `Assalamou Alaikoum,\n\nVoici votre code OTP pour le voyage « ${tripName} » :\n\n🔑 ${otp}\n\nEntrez ce code dans l'application PassHajj Manager pour accéder aux données du voyage.\n\n📲 Lien de l'application : ${pwaLink}\n\nCe code est valide 24h. Ne le partagez qu'avec les chefs de groupe.`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(shareData.text, 'Message OTP');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        await copyToClipboard(shareData.text, 'Message OTP');
      }
    }
  };

  // ─── Pagination controls ───
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setLoading(true);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BLEU_MARINE }}>
            Tableau de bord
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez vos voyages et suivez l&apos;activité en temps réel
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Quick Generate OTP Button */}
          <Button
            variant="outline"
            className="gap-2 font-semibold border-2 transition-all"
            style={{ borderColor: BLEU_MARINE, color: BLEU_MARINE }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline">Générer OTP</span>
          </Button>

          {/* Create Trip Button */}
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreatedOTP(null);
            setOtpCountdown(null);
            setCreateForm(EMPTY_FORM);
          }
        }}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: JAUNE }}
            >
              <Plus className="w-4 h-4" />
              Nouveau Voyage
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: BLEU_MARINE }}>
                <Plane className="w-5 h-5" />
                Créer un nouveau voyage
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du voyage. Un OTP sera généré automatiquement.
              </DialogDescription>
            </DialogHeader>

            {/* OTP Display (after creation) */}
            {createdOTP ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${JAUNE}20` }}>
                  <CheckCircle className="w-8 h-8" style={{ color: JAUNE }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: BLEU_MARINE }}>
                  Voyage créé avec succès !
                </h3>
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Code OTP du voyage</p>
                  <div
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-3xl font-bold tracking-[0.3em] font-mono"
                    style={{
                      backgroundColor: `${BLEU_MARINE}10`,
                      color: BLEU_MARINE,
                      border: `2px solid ${BLEU_MARINE}30`,
                    }}
                  >
                    {createdOTP}
                  </div>
                </div>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                  Partagez ce code avec le chef de groupe. Il l&apos;entrera dans l&apos;application PassHajj Manager.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <Button
                    className="flex-1 gap-2 text-white font-semibold"
                    style={{ backgroundColor: JAUNE }}
                    onClick={() => shareOtp(createdOTP, createForm.name || 'Voyage')}
                  >
                    <Share2 className="w-4 h-4" />
                    Partager l&apos;OTP
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => copyToClipboard(createdOTP, 'OTP')}
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const pwaLink = typeof window !== 'undefined' ? `${window.location.origin}/manager` : 'https://passhajj.qrbags.com/manager';
                      copyToClipboard(pwaLink, 'Lien PWA');
                    }}
                  >
                    <Smartphone className="w-4 h-4" />
                    Copier le lien PWA
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Fermeture automatique dans {otpCountdown}s...
                </p>
              </div>
            ) : (
              /* Create Trip Form */
              <div className="grid gap-4 py-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="trip-name" className="font-medium" style={{ color: BLEU_MARINE }}>
                    Nom du voyage <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trip-name"
                    placeholder="Ex: Hajj 2026 - Groupe A"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                  />
                </div>

                {/* Description */}
                <div className="grid gap-2">
                  <Label htmlFor="trip-desc" style={{ color: BLEU_MARINE }}>
                    Description
                  </Label>
                  <Textarea
                    id="trip-desc"
                    placeholder="Détails supplémentaires sur ce voyage..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                  />
                </div>

                {/* Dates row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="departure-date" style={{ color: BLEU_MARINE }}>
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Date de départ
                    </Label>
                    <Input
                      id="departure-date"
                      type="date"
                      value={createForm.departureDate}
                      onChange={(e) => setCreateForm((f) => ({ ...f, departureDate: e.target.value }))}
                      className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="return-date" style={{ color: BLEU_MARINE }}>
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Date de retour
                    </Label>
                    <Input
                      id="return-date"
                      type="date"
                      value={createForm.returnDate}
                      onChange={(e) => setCreateForm((f) => ({ ...f, returnDate: e.target.value }))}
                      className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div className="grid gap-2">
                  <Label htmlFor="destination" style={{ color: BLEU_MARINE }}>
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="Ex: Arabie Saoudite"
                    value={createForm.destination}
                    onChange={(e) => setCreateForm((f) => ({ ...f, destination: e.target.value }))}
                    className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                  />
                </div>

                {/* Transport */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label style={{ color: BLEU_MARINE }}>Transport</Label>
                    <Select
                      value={createForm.transportMode}
                      onValueChange={(v) =>
                        setCreateForm((f) => ({ ...f, transportMode: v as CreateTripForm['transportMode'] }))
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-[#f4b400]">
                        <SelectValue placeholder="Choisir..." />
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
                  <div className="grid gap-2">
                    <Label htmlFor="airline" style={{ color: BLEU_MARINE }}>
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      Compagnie
                    </Label>
                    <Input
                      id="airline"
                      placeholder="Ex: Saudia Airlines"
                      value={createForm.airline}
                      onChange={(e) => setCreateForm((f) => ({ ...f, airline: e.target.value }))}
                      className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="flight-number" style={{ color: BLEU_MARINE }}>
                      N° Vol
                    </Label>
                    <Input
                      id="flight-number"
                      placeholder="Ex: SV123"
                      value={createForm.flightNumber}
                      onChange={(e) => setCreateForm((f) => ({ ...f, flightNumber: e.target.value }))}
                      className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                    />
                  </div>
                </div>

                {/* Hotels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hotel-mecca" style={{ color: BLEU_MARINE }}>
                      <Hotel className="w-3.5 h-3.5 inline mr-1" />
                      Hôtel La Mecque
                    </Label>
                    <Input
                      id="hotel-mecca"
                      placeholder="Nom de l'hôtel"
                      value={createForm.hotelMecca}
                      onChange={(e) => setCreateForm((f) => ({ ...f, hotelMecca: e.target.value }))}
                      className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hotel-medina" style={{ color: BLEU_MARINE }}>
                      <Hotel className="w-3.5 h-3.5 inline mr-1" />
                      Hôtel Médine
                    </Label>
                    <Input
                      id="hotel-medina"
                      placeholder="Nom de l'hôtel"
                      value={createForm.hotelMedina}
                      onChange={(e) => setCreateForm((f) => ({ ...f, hotelMedina: e.target.value }))}
                      className="border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {!createdOTP && (
                <Button
                  onClick={handleCreateTrip}
                  disabled={creating || !createForm.name.trim()}
                  className="gap-2 text-white font-semibold"
                  style={{ backgroundColor: JAUNE }}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Créer le voyage
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            {/* Total Voyages */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: JAUNE }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Voyages
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: BLEU_MARINE }}>
                      {stats.totalVoyages}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${JAUNE}15` }}
                  >
                    <Plane className="w-5 h-5" style={{ color: JAUNE }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pèlerins Total */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: JAUNE }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Pèlerins Total
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: BLEU_MARINE }}>
                      {stats.totalPilgrims}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${JAUNE}15` }}
                  >
                    <Users className="w-5 h-5" style={{ color: JAUNE }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bagages Total */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: JAUNE }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Bagages Total
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: BLEU_MARINE }}>
                      {stats.totalBags}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${JAUNE}15` }}
                  >
                    <Luggage className="w-5 h-5" style={{ color: JAUNE }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voyages Actifs */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: JAUNE }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Voyages Actifs
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: BLEU_MARINE }}>
                      {stats.activeVoyages}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${JAUNE}15` }}
                  >
                    <CheckCircle className="w-5 h-5" style={{ color: JAUNE }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ─── Filters & Search ─── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg" style={{ color: BLEU_MARINE }}>
              Liste des voyages
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un voyage..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-full sm:w-64 border-slate-300 focus:border-[#f4b400] focus:ring-[#f4b400]/20"
                />
              </div>
              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                  setLoading(true);
                }}
              >
                <SelectTrigger className="w-full sm:w-40 border-slate-300">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ─── Table ─── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold" style={{ color: BLEU_MARINE }}>
                    Voyage
                  </TableHead>
                  <TableHead className="font-semibold" style={{ color: BLEU_MARINE }}>
                    Statut
                  </TableHead>
                  <TableHead className="font-semibold" style={{ color: BLEU_MARINE }}>
                    OTP
                  </TableHead>
                  <TableHead className="font-semibold text-center" style={{ color: BLEU_MARINE }}>
                    Pèlerins
                  </TableHead>
                  <TableHead className="font-semibold text-center" style={{ color: BLEU_MARINE }}>
                    Bagages
                  </TableHead>
                  <TableHead className="font-semibold" style={{ color: BLEU_MARINE }}>
                    Départ
                  </TableHead>
                  <TableHead className="font-semibold text-right" style={{ color: BLEU_MARINE }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  /* Skeleton rows */
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 font-mono" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : trips.length === 0 ? (
                  /* Empty state */
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Plane className="w-8 h-8 opacity-50" />
                        <p className="font-medium">Aucun voyage trouvé</p>
                        <p className="text-xs">
                          Créez votre premier voyage en cliquant sur &quot;Nouveau Voyage&quot;
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  /* Trip rows */
                  trips.map((trip, idx) => (
                    <TableRow
                      key={trip.id}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        idx % 2 === 1 ? 'bg-slate-50/50' : ''
                      }`}
                      onClick={() => router.push(`/agency/trips/${trip.id}`)}
                    >
                      {/* Voyage name + description */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${JAUNE}15` }}
                          >
                            {getTransportIcon(trip.transportMode)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: BLEU_MARINE }}>
                              {trip.name}
                            </p>
                            {trip.description && (
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                {trip.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>

                      {/* OTP */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-sm font-bold tracking-widest px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${BLEU_MARINE}08`,
                              color: BLEU_MARINE,
                            }}
                          >
                            {trip.otp}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(trip.otp, 'OTP');
                            }}
                            className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
                            title="Copier l'OTP"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Pèlerins */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {trip.pilgrimCount || trip.totalPilgrims || 0}
                        </span>
                      </TableCell>

                      {/* Bagages */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <Luggage className="w-3.5 h-3.5 text-slate-400" />
                          {trip.bagCount || trip.totalBags || 0}
                        </span>
                      </TableCell>

                      {/* Départ */}
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatDate(trip.departureDate)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-8"
                            style={{ color: BLEU_MARINE }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/agency/trips/${trip.id}`);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Voir</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-8"
                            style={{ color: JAUNE }}
                            disabled={regeneratingId === trip.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateOTP(trip.id, trip.name);
                            }}
                          >
                            {regeneratingId === trip.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">OTP</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-8"
                            style={{ color: BLEU_MARINE }}
                            onClick={(e) => {
                              e.stopPropagation();
                              shareOtp(trip.otp, trip.name);
                            }}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Partager</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ─── Pagination ─── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Page {currentPage} sur {totalPages} · {totalTrips} voyage{totalTrips > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      style={
                        currentPage === page
                          ? { backgroundColor: JAUNE, color: 'white' }
                          : {}
                      }
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
