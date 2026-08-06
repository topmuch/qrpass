'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Luggage,
  Search,
  Eye,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  QrCode,
  X,
  ShoppingCart,
  Send,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  Users,
  Package,
  Sparkles,
  Lightbulb,
  RefreshCw,
  Plus,
  Pencil,
  Plane,
  Train,
  Ship,
  Bus,
  Globe,
  Calendar,
  Heart,
  Shield,
  Hotel,
  Phone,
  ScanLine,
  Building2,
  Download,
  ExternalLink,
} from "lucide-react";
import { useAgency } from '../layout';
import { isActive, isPending, isLost, isFound, normalizeStatus } from '@/lib/status';
import LatestNewsWidget from '@/components/LatestNewsWidget';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Baggage {
  id: string;
  reference: string;
  type: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  // Founder information
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
  // Transport fields
  transportMode?: string;
  airlineName?: string | null;
  flightNumber?: string | null;
  trainCompany?: string | null;
  trainNumber?: string | null;
  shipName?: string | null;
  shipCabin?: string | null;
  busCompany?: string | null;
  busLineNumber?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
}

interface PassIdentity {
  id: string;
  qrCode: string;
  fullName: string;
  nationality: string;
  photoUrl: string | null;
  bloodType: string | null;
  allergies: string | null;
  diseases: string | null;
  medicalInfo: string | null;
  hotelMecca: string | null;
  roomMecca: string | null;
  hotelMedina: string | null;
  roomMedina: string | null;
  hotelPhone: string | null;
  groupLeaderPhone: string | null;
  agencyPhone: string | null;
  familyContact: string | null;
  alNusukDocUrl: string | null;
  isActive: boolean;
  duration: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  scanned: number;
  lost: number;
  found: number;
}

// Modern Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBg,
  trend
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; isUp: boolean };
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isUp ? 'text-blue-600' : 'text-rose-500'}`}>
            {trend.isUp ? <TrendingUp className="w-4 h-4" aria-hidden="true" /> : <TrendingUp className="w-4 h-4 rotate-180" aria-hidden="true" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value === 0 ? '—' : value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// KPI Card Component - Colored
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  colorVariant
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  colorVariant: 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'red' | 'pink' | 'indigo';
}) {
  const chartBars = Array.from({ length: 12 }, (_, i) => ({
    height: 20 + Math.random() * 80,
  }));

  return (
    <div className={`kpi-card kpi-card-${colorVariant} p-6 opacity-0 animate-slide-up`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <span className="text-white">{icon}</span>
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <p className="text-3xl font-bold text-white">{value === 0 ? '—' : value}</p>
        <p className="text-sm font-medium text-white/90 mt-1">{title}</p>
        <p className="text-xs text-white/70 mt-1">{subtitle}</p>
      </div>
      
      <div className="mini-chart-bars mt-4">
        {chartBars.map((bar, i) => (
          <div 
            key={i} 
            className="mini-chart-bar" 
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// AI Suggestions Component
function AISuggestions({ agencyId, stats }: { agencyId: string; stats: Stats }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/suggestions?agencyId=${agencyId}`);
      const data = await response.json();
      if (data.success && data.suggestion) {
        if (typeof data.suggestion === 'object') {
          const s = data.suggestion;
          setSuggestion(`Nous vous recommandons ${s.recommended} QR codes pour votre prochaine campagne. Basé sur: ${s.basedOn}`);
        } else {
          setSuggestion(data.suggestion);
        }
      } else {
        setError('Impossible de charger les suggestions');
      }
    } catch (err) {
      console.error('Error fetching AI suggestion:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [agencyId]);

  const handleDismiss = (index: number) => {
    setDismissedSuggestions(prev => new Set([...prev, index]));
  };

  const getContextualSuggestions = (): { icon: string; title: string; text: string; color: string }[] => {
    const suggestions: { icon: string; title: string; text: string; color: string }[] = [];

    if (stats.lost > 0) {
      suggestions.push({
        icon: '⚠️',
        title: 'Bagages perdus',
        text: `Vous avez ${stats.lost} bagage(s) signalé(s) comme perdu(s). Contactez rapidement les voyageurs concernés.`,
        color: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
      });
    }

    if (stats.pending > 5) {
      suggestions.push({
        icon: '⏳',
        title: 'Activation en attente',
        text: `${stats.pending} bagages sont en attente d'activation. Envoyez un rappel aux voyageurs.`,
        color: 'bg-amber-50 dark:bg-blue-600/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-blue-500'
      });
    }

    if (stats.scanned > 0) {
      suggestions.push({
        icon: '🔍',
        title: 'Scans récents',
        text: `${stats.scanned} bagage(s) ont été scanné(s) récemment. Vérifiez les localisations.`,
        color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
      });
    }

    if (stats.total > 0 && stats.pending === 0 && stats.lost === 0) {
      suggestions.push({
        icon: '✅',
        title: 'Excellent !',
        text: 'Tous vos bagages sont actifs et bien suivis. Continuez comme ça !',
        color: 'bg-emerald-50 dark:bg-blue-600/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-blue-500'
      });
    }

    return suggestions;
  };

  const contextualSuggestions = getContextualSuggestions();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Suggestions IA</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Recommandations personnalisées</p>
          </div>
        </div>
        <button
          onClick={fetchSuggestion}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {contextualSuggestions.map((sugg, index) => (
          !dismissedSuggestions.has(index) && (
            <div key={index} className={`p-4 rounded-xl border ${sugg.color} relative group`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{sugg.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{sugg.title}</p>
                  <p className="text-sm opacity-80">{sugg.text}</p>
                </div>
                <button
                  onClick={() => handleDismiss(index)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  title="Masquer cette notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        ))}
      </div>

      {loading && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400 text-sm">Analyse en cours...</span>
          </div>
        </div>
      )}

      {suggestion && !loading && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-blue-600/10 dark:to-blue-500/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-1">Conseil IA</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-xl">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}
    </div>
  );
}

// Advertisement Banner Component
function AdBanner() {
  const [ads, setAds] = useState<Array<{
    id: string;
    title: string;
    imageUrl: string;
    linkUrl: string | null;
    targetScope: string;
  }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/advertisements');
        const data = await res.json();
        if (data.advertisements && data.advertisements.length > 0) {
          setAds(data.advertisements);
        }
      } catch (err) {
        console.error('Error fetching ads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (loading || ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {ad.imageUrl ? (
        <a href={ad.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-40 object-cover" />
          {ad.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-sm font-medium">{ad.title}</p>
            </div>
          )}
        </a>
      ) : (
        <a href={ad.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block p-6 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-blue-600/10 dark:to-blue-500/10 text-center">
          <p className="text-slate-800 dark:text-white font-semibold">{ad.title}</p>
        </a>
      )}
      {ads.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {ads.map((_, i) => (
            <button key={i} onClick={() => setCurrentIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgencyDashboardPage() {
  const { agencyId, agencyName } = useAgency();
  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [filteredBaggages, setFilteredBaggages] = useState<Baggage[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    scanned: 0,
    lost: 0,
    found: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [baggageToDelete, setBaggageToDelete] = useState<Baggage | null>(null);
  
  // Baggage Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // Pass Identity State
  const [passIdentities, setPassIdentities] = useState<PassIdentity[]>([]);
  const [passIdLoading, setPassIdLoading] = useState(true);
  const [passIdEditOpen, setPassIdEditOpen] = useState(false);
  const [passIdEditLoading, setPassIdEditLoading] = useState(false);
  const [selectedPassId, setSelectedPassId] = useState<PassIdentity | null>(null);
  const [passIdForm, setPassIdForm] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'baggages' | 'passidentity'>('baggages');
  const [qrPreviewPilgrim, setQrPreviewPilgrim] = useState<PassIdentity | null>(null);

  // Command Modal State
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [commandForm, setCommandForm] = useState({
    type: 'hajj',
    count: 10,
    notes: ''
  });
  const [commandSubmitting, setCommandSubmitting] = useState(false);
  const [commandSuccess, setCommandSuccess] = useState(false);

  // Fetch on mount + auto-refresh every 15 seconds for real-time data
  useEffect(() => {
    if (!agencyId) return;
    fetchBaggages();
    fetchPassIdentities();
    const interval = setInterval(() => {
      fetchBaggages();
    }, 15000);
    return () => clearInterval(interval);
  }, [agencyId]);

  // Listen for openCommandModal event from header
  useEffect(() => {
    const handleOpenCommandModal = () => {
      setShowCommandModal(true);
    };
    window.addEventListener('openCommandModal', handleOpenCommandModal);
    return () => window.removeEventListener('openCommandModal', handleOpenCommandModal);
  }, []);

  useEffect(() => {
    filterBaggages();
  }, [baggages, search, statusFilter]);

  const fetchBaggages = async () => {
    try {
      if (!agencyId) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        agencyId: agencyId,
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      if (!response.ok) {
        console.error('Failed to fetch baggages:', response.status);
        setBaggages([]);
        setStats({ total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 });
        return;
      }
      const data = await response.json();

      setBaggages(data.baggages || []);
      setStats(data.stats || { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 });
    } catch (error) {
      console.error('Error fetching baggages:', error);
      setBaggages([]);
      setStats({ total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchPassIdentities = async () => {
    if (!agencyId) {
      console.warn('[fetchPassIdentities] No agencyId available — skipping fetch');
      return;
    }
    setPassIdLoading(true);
    try {
      console.log('[fetchPassIdentities] Fetching pilgrims for agencyId:', agencyId);
      const response = await fetch(`/api/agency/pilgrims?agencyId=${agencyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[fetchPassIdentities] Received', data.pilgrims?.length ?? 0, 'pilgrims');
        setPassIdentities(data.pilgrims || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[fetchPassIdentities] API error:', response.status, errorData);
        setPassIdentities([]);
      }
    } catch (error) {
      console.error('Error fetching Pass Identity data:', error);
      setPassIdentities([]);
    } finally {
      setPassIdLoading(false);
    }
  };

  const filterBaggages = () => {
    let filtered = [...baggages];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.reference.toLowerCase().includes(searchLower) ||
        `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBaggages(filtered);
  };

  const activatedBaggages = filteredBaggages.filter(b =>
    isActive(b.status) || b.travelerFirstName !== null || isLost(b.status) || isFound(b.status) || normalizeStatus(b.status) === 'blocked'
  );
  const pendingBaggages = filteredBaggages.filter(b =>
    isPending(b.status) && b.travelerFirstName === null && b.travelerLastName === null
  );

  const handleDeleteBaggage = async () => {
    if (!baggageToDelete) return;

    try {
      await fetch(`/api/baggage/${baggageToDelete.id}`, {
        method: 'DELETE',
      });

      setBaggages(baggages.filter(b => b.id !== baggageToDelete.id));
      setShowDeleteModal(false);
      setBaggageToDelete(null);
    } catch (error) {
      console.error('Error deleting baggage:', error);
    }
  };

  const handleCommandSubmit = async () => {
    setCommandSubmitting(true);
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'commande_agence',
          agencyId: agencyId,
          senderName: agencyName,
          content: {
            type: commandForm.type,
            count: commandForm.count,
            notes: commandForm.notes,
          },
        }),
      });
      setCommandSuccess(true);
      setTimeout(() => {
        setShowCommandModal(false);
        setCommandSuccess(false);
        setCommandForm({ type: 'hajj', count: 10, notes: '' });
      }, 2000);
    } catch (error) {
      console.error('Error sending command:', error);
    } finally {
      setCommandSubmitting(false);
    }
  };

  // Baggage Edit handlers
  const openBaggageEdit = (baggage: Baggage) => {
    setEditForm({
      travelerFirstName: baggage.travelerFirstName || '',
      travelerLastName: baggage.travelerLastName || '',
      whatsappOwner: baggage.whatsappOwner || '',
      transportMode: baggage.transportMode || 'flight',
      airlineName: baggage.airlineName || '',
      flightNumber: baggage.flightNumber || '',
      trainCompany: baggage.trainCompany || '',
      trainNumber: baggage.trainNumber || '',
      shipName: baggage.shipName || '',
      shipCabin: baggage.shipCabin || '',
      busCompany: baggage.busCompany || '',
      busLineNumber: baggage.busLineNumber || '',
      destination: baggage.destination || '',
      departureDate: baggage.departureDate ? new Date(baggage.departureDate).toISOString().split('T')[0] : '',
      departureTime: baggage.departureTime || '',
      status: baggage.status,
    });
    setSelectedBaggage(baggage);
    setEditOpen(true);
  };

  const handleBaggageEditSubmit = async () => {
    if (!selectedBaggage) return;
    setEditLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (editForm.travelerFirstName !== undefined) body.travelerFirstName = editForm.travelerFirstName || null;
      if (editForm.travelerLastName !== undefined) body.travelerLastName = editForm.travelerLastName || null;
      if (editForm.whatsappOwner !== undefined) body.whatsappOwner = editForm.whatsappOwner || null;
      if (editForm.transportMode !== undefined) body.transportMode = editForm.transportMode;
      if (editForm.airlineName !== undefined) body.airlineName = editForm.airlineName || null;
      if (editForm.flightNumber !== undefined) body.flightNumber = editForm.flightNumber || null;
      if (editForm.trainCompany !== undefined) body.trainCompany = editForm.trainCompany || null;
      if (editForm.trainNumber !== undefined) body.trainNumber = editForm.trainNumber || null;
      if (editForm.shipName !== undefined) body.shipName = editForm.shipName || null;
      if (editForm.shipCabin !== undefined) body.shipCabin = editForm.shipCabin || null;
      if (editForm.busCompany !== undefined) body.busCompany = editForm.busCompany || null;
      if (editForm.busLineNumber !== undefined) body.busLineNumber = editForm.busLineNumber || null;
      if (editForm.destination !== undefined) body.destination = editForm.destination || null;
      if (editForm.departureDate !== undefined) body.departureDate = editForm.departureDate || null;
      if (editForm.departureTime !== undefined) body.departureTime = editForm.departureTime || null;
      if (editForm.status !== undefined) body.status = editForm.status;

      const response = await fetch(`/api/baggage/${selectedBaggage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setEditOpen(false);
        fetchBaggages();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating baggage:', error);
      alert('Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  // Pass Identity Edit handlers
  const openPassIdEdit = (pilgrim: PassIdentity) => {
    setPassIdForm({
      fullName: pilgrim.fullName || '',
      nationality: pilgrim.nationality || '',
      bloodType: pilgrim.bloodType || '',
      allergies: pilgrim.allergies || '',
      diseases: pilgrim.diseases || '',
      medicalInfo: pilgrim.medicalInfo || '',
      hotelMecca: pilgrim.hotelMecca || '',
      roomMecca: pilgrim.roomMecca || '',
      hotelMedina: pilgrim.hotelMedina || '',
      roomMedina: pilgrim.roomMedina || '',
      hotelPhone: pilgrim.hotelPhone || '',
      groupLeaderPhone: pilgrim.groupLeaderPhone || '',
      agencyPhone: pilgrim.agencyPhone || '',
      familyContact: pilgrim.familyContact || '',
      alNusukDocUrl: pilgrim.alNusukDocUrl || '',
    });
    setSelectedPassId(pilgrim);
    setPassIdEditOpen(true);
  };

  const handlePassIdEditSubmit = async () => {
    if (!selectedPassId) return;
    setPassIdEditLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (passIdForm.fullName !== undefined) body.fullName = passIdForm.fullName;
      if (passIdForm.nationality !== undefined) body.nationality = passIdForm.nationality;
      if (passIdForm.bloodType !== undefined) body.bloodType = passIdForm.bloodType || null;
      if (passIdForm.allergies !== undefined) body.allergies = passIdForm.allergies || null;
      if (passIdForm.diseases !== undefined) body.diseases = passIdForm.diseases || null;
      if (passIdForm.medicalInfo !== undefined) body.medicalInfo = passIdForm.medicalInfo || null;
      if (passIdForm.hotelMecca !== undefined) body.hotelMecca = passIdForm.hotelMecca || null;
      if (passIdForm.roomMecca !== undefined) body.roomMecca = passIdForm.roomMecca || null;
      if (passIdForm.hotelMedina !== undefined) body.hotelMedina = passIdForm.hotelMedina || null;
      if (passIdForm.roomMedina !== undefined) body.roomMedina = passIdForm.roomMedina || null;
      if (passIdForm.hotelPhone !== undefined) body.hotelPhone = passIdForm.hotelPhone || null;
      if (passIdForm.groupLeaderPhone !== undefined) body.groupLeaderPhone = passIdForm.groupLeaderPhone || null;
      if (passIdForm.agencyPhone !== undefined) body.agencyPhone = passIdForm.agencyPhone || null;
      if (passIdForm.familyContact !== undefined) body.familyContact = passIdForm.familyContact || null;
      if (passIdForm.alNusukDocUrl !== undefined) body.alNusukDocUrl = passIdForm.alNusukDocUrl || null;

      const response = await fetch(`/api/pilgrims/${selectedPassId.qrCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setPassIdEditOpen(false);
        fetchPassIdentities();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating pilgrim:', error);
      alert('Erreur lors de la modification');
    } finally {
      setPassIdEditLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_activation: { label: 'En attente', className: 'bg-amber-100 dark:bg-blue-600/10 text-amber-700 dark:text-blue-500' },
      active: { label: 'Actif', className: 'bg-emerald-100 dark:bg-blue-600/10 text-emerald-700 dark:text-blue-500' },
      scanned: { label: 'Scanné', className: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      lost: { label: 'Perdu', className: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' },
      found: { label: 'Retrouvé', className: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' },
      blocked: { label: 'Bloqué', className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Activés' },
    { id: 'pending_activation', label: 'En attente' },
    { id: 'scanned', label: 'Scannés' },
    { id: 'lost', label: 'Perdus' },
    { id: 'found', label: 'Retrouvés' },
  ];

  // Multicolored KPI Cards
  const kpiCards = [
    {
      title: 'Total bagages',
      value: stats.total,
      subtitle: 'Tous les bagages',
      icon: <Luggage className="w-6 h-6 text-white" />,
      colorVariant: 'purple' as const,
    },
    {
      title: 'Scannés',
      value: stats.scanned + stats.active,
      subtitle: 'Bagages actifs',
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      colorVariant: 'cyan' as const,
    },
    {
      title: 'En attente',
      value: stats.pending,
      subtitle: 'À activer',
      icon: <Clock className="w-6 h-6 text-white" />,
      colorVariant: 'orange' as const,
    },
    {
      title: 'Perdus',
      value: stats.lost,
      subtitle: 'Signalés perdus',
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      colorVariant: 'red' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Bienvenue, <span className="text-blue-600">{agencyName}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Suivi en temps réel de vos bagages Hajj 2026</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('baggages')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'baggages'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <Luggage className="w-4 h-4" />
            Bagages
          </span>
        </button>
        <button
          onClick={() => setActiveTab('passidentity')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'passidentity'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Pass Identity
          </span>
        </button>
      </div>

      {activeTab === 'baggages' && (
        <>
          {/* Multicolored KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((card, index) => (
              <div key={index} className={`stagger-${index + 1}`}>
                <KPICard {...card} />
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          <div className="mb-8">
            <AISuggestions agencyId={agencyId} stats={stats} />
          </div>

          {/* Latest News Widget */}
          <div className="mb-8">
            <LatestNewsWidget />
          </div>

          {/* Advertisement Banner */}
          <div className="mb-8">
            <AdBanner />
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  statusFilter === btn.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-slate-500">Chargement...</span>
                </div>
              </div>
            </div>
          ) : filteredBaggages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">Aucun bagage trouvé</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                    {search || statusFilter !== 'all'
                      ? 'Essayez de modifier vos filtres.'
                      : 'Vos bagages apparaîtront ici une fois générés.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1 — Bagages activés */}
              {activatedBaggages.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-blue-600/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                        Bagages activés ({activatedBaggages.length})
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    {activatedBaggages.map((baggage) => (
                      <div
                        key={baggage.id}
                        className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all ${
                          isLost(baggage.status) ? 'ring-2 ring-rose-300 dark:ring-rose-700' : ''
                        }`}
                      >
                        {/* Header row: Luggage icon + traveler name + status badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                              <Luggage className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {baggage.travelerFirstName || baggage.travelerLastName ? (
                              <div className="min-w-0">
                                <span className="font-medium text-slate-800 dark:text-white truncate block">
                                  {baggage.travelerFirstName} {baggage.travelerLastName}
                                </span>
                                {baggage.whatsappOwner && (
                                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{baggage.whatsappOwner}</p>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                                Non assigné
                              </span>
                            )}
                          </div>
                          {getStatusBadge(baggage.status)}
                        </div>

                        {/* QR reference */}
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <QrCode className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs">{baggage.reference}</span>
                          </div>

                          {/* Transport mode + destination */}
                          {(baggage.transportMode || baggage.destination) && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              {baggage.transportMode === 'flight' && <Plane className="w-3 h-3 text-slate-400 shrink-0" />}
                              {baggage.transportMode === 'train' && <Train className="w-3 h-3 text-slate-400 shrink-0" />}
                              {baggage.transportMode === 'boat' && <Ship className="w-3 h-3 text-slate-400 shrink-0" />}
                              {baggage.transportMode === 'bus' && <Bus className="w-3 h-3 text-slate-400 shrink-0" />}
                              {!baggage.transportMode && <Globe className="w-3 h-3 text-slate-400 shrink-0" />}
                              <span className="truncate">{baggage.destination || baggage.transportMode || ''}</span>
                            </div>
                          )}

                          {/* Last scan date */}
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3 shrink-0" />
                            {baggage.lastScanDate ? (
                              <span className="text-xs">
                                {formatDateTime(baggage.lastScanDate)}
                                {baggage.lastLocation && (
                                  <span className="text-slate-400 dark:text-slate-500 ml-1 flex items-center gap-0.5 inline-flex">
                                    <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
                                    {baggage.lastLocation}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs">Jamais scanné</span>
                            )}
                          </div>

                          {/* Founder info */}
                          {baggage.founderName && (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <ScanLine className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-xs truncate">{baggage.founderName}</span>
                              {baggage.founderPhone && (
                                <a
                                  href={`https://wa.me/${baggage.founderPhone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-0.5 shrink-0"
                                >
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer: action buttons */}
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border-blue-200"
                            onClick={() => {
                              setSelectedBaggage(baggage);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir détails
                          </Button>
                          <button
                            onClick={() => openBaggageEdit(baggage)}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-colors group"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                          </button>
                          {isActive(baggage.status) && (
                            <button
                              onClick={async () => {
                                if (confirm('Déclarer ce bagage comme perdu ?')) {
                                  try {
                                    const res = await fetch(`/api/baggage/${baggage.id}/declare-lost`, { method: 'PUT' });
                                    if (res.ok) fetchBaggages();
                                  } catch (error) {
                                    console.error('Error declaring lost:', error);
                                  }
                                }
                              }}
                              className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group"
                              title="Déclarer perdu"
                            >
                              <AlertTriangle className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                            </button>
                          )}
                          {isLost(baggage.status) && (
                            <button
                              onClick={async () => {
                                if (confirm('Marquer ce bagage comme retrouvé ?')) {
                                  try {
                                    const res = await fetch(`/api/baggage/${baggage.id}/mark-found`, { method: 'PUT' });
                                    if (res.ok) fetchBaggages();
                                  } catch (error) {
                                    console.error('Error marking found:', error);
                                  }
                                }
                              }}
                              className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-blue-600/10 transition-colors group"
                              title="Marquer comme retrouvé"
                            >
                              <CheckCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setBaggageToDelete(baggage);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      {activatedBaggages.length} bagage(s) activé(s)
                    </span>
                  </div>
                </div>
              )}

              {/* Section 2 — QR en attente d'activation */}
              {pendingBaggages.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-blue-600/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                        QR en attente d'activation ({pendingBaggages.length})
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    {pendingBaggages.map((baggage) => (
                      <div
                        key={baggage.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
                      >
                        {/* Header row: Luggage icon + "Non assigné" badge + "En attente" badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                              <Luggage className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                              Non assigné
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            ⚪ En attente
                          </span>
                        </div>

                        {/* QR reference */}
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <QrCode className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs">{baggage.reference}</span>
                          </div>

                          {/* Baggage type */}
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Package className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-xs capitalize">{baggage.baggageType || 'Soute'}</span>
                          </div>

                          {/* Creation date */}
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="text-xs">{formatDate(baggage.createdAt)}</span>
                          </div>
                        </div>

                        {/* Footer: action buttons */}
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl border-amber-200"
                            onClick={() => openBaggageEdit(baggage)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Attribuer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border-blue-200"
                            onClick={() => {
                              setSelectedBaggage(baggage);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir détails
                          </Button>
                          <button
                            onClick={() => {
                              setBaggageToDelete(baggage);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      {pendingBaggages.length} QR en attente d'activation
                    </span>
                  </div>
                </div>
              )}

              {/* Footer global */}
              <div className="text-center mt-4">
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  {filteredBaggages.length} bagage(s) affiché(s) sur {baggages.length}
                </span>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'passidentity' && (
        <>
          {/* Pass Identity Section */}
          <div className="flex gap-2 mb-6">
            <Button
              variant="outline"
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
              onClick={fetchPassIdentities}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${passIdLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Pass Identity Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Total Pass Identity</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{passIdentities.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Activés</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{passIdentities.filter(p => p.isActive).length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">En attente</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{passIdentities.filter(p => !p.isActive).length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Avec hébergement</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{passIdentities.filter(p => p.hotelMecca || p.hotelMedina).length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Pass Identity Cards */}
          {passIdLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : passIdentities.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Aucun Pass Identity trouvé</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Les Pass Identity apparaîtront ici une fois générés</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {passIdentities.map((pilgrim) => (
                <div
                  key={pilgrim.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-white truncate">{pilgrim.fullName}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pilgrim.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                      {pilgrim.isActive ? '✅ Actif' : '⚪ En attente'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <ScanLine className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs">{pilgrim.qrCode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{pilgrim.nationality}</span>
                    </div>
                    {pilgrim.bloodType && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Heart className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Groupe sanguin: {pilgrim.bloodType}</span>
                      </div>
                    )}
                    {(pilgrim.hotelMecca || pilgrim.hotelMedina) && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Hotel className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{pilgrim.hotelMecca || pilgrim.hotelMedina}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border-emerald-200"
                      onClick={() => setQrPreviewPilgrim(pilgrim)}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR Code
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border-blue-200"
                      onClick={() => openPassIdEdit(pilgrim)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Command Modal */}
      {showCommandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-blue-600/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Commander vos QR codes</h3>
              </div>
              <button
                onClick={() => { setShowCommandModal(false); setCommandSuccess(false); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {commandSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Demande envoyée !</h4>
                <p className="text-slate-500 dark:text-slate-400">Notre équipe vous contactera sous 24h.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Type de QR codes</label>
                  <select
                    value={commandForm.type}
                    onChange={(e) => setCommandForm({ ...commandForm, type: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    <option value="hajj">Hajj 2026 (3 QR/pèlerin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Nombre de pèlerins</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={commandForm.count}
                    onChange={(e) => setCommandForm({ ...commandForm, count: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    placeholder="Ex: 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Remarques (optionnel)</label>
                  <textarea
                    rows={3}
                    value={commandForm.notes}
                    onChange={(e) => setCommandForm({ ...commandForm, notes: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                    placeholder="Ex: livraison urgente, dates de départ..."
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    <strong className="text-slate-800 dark:text-white">Estimation :</strong> {' '}
                    {commandForm.type === 'hajj'
                      ? `${commandForm.count * 3} QR codes (${commandForm.count} pèlerins × 3)`
                      : `${commandForm.count} QR codes`
                    }
                  </p>
                </div>
                <button
                  onClick={handleCommandSubmit}
                  disabled={commandSubmitting}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {commandSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Détails du bagage</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedBaggage(null); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 dark:bg-blue-600/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold">{selectedBaggage.reference}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedBaggage.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Pèlerin</p>
                  {selectedBaggage.travelerFirstName || selectedBaggage.travelerLastName ? (
                    <p className="text-slate-800 dark:text-white font-medium">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</p>
                  ) : (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-blue-600/20 text-amber-600 dark:text-blue-500 rounded-full text-xs font-medium">
                      À attribuer
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Type</p>
                  <p className="text-slate-800 dark:text-white">{selectedBaggage.baggageType} #{selectedBaggage.baggageIndex}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">WhatsApp</p>
                {selectedBaggage.whatsappOwner ? (
                  <p className="text-slate-800 dark:text-white">{selectedBaggage.whatsappOwner}</p>
                ) : (
                  <span className="text-amber-600 dark:text-blue-500 text-sm">Non renseigné</span>
                )}
              </div>

              {/* Quick Edit for unassigned baggages */}
              {(!selectedBaggage.travelerFirstName && !selectedBaggage.travelerLastName) && (
                <div className="p-4 bg-amber-50 dark:bg-blue-600/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <h4 className="text-amber-700 dark:text-blue-500 font-medium mb-3">Attribuer ce bagage</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Prénom"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                        onChange={(e) => setSelectedBaggage({ ...selectedBaggage, travelerFirstName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Nom"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                        onChange={(e) => setSelectedBaggage({ ...selectedBaggage, travelerLastName: e.target.value })}
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="WhatsApp (ex: +33612345678)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                      onChange={(e) => setSelectedBaggage({ ...selectedBaggage, whatsappOwner: e.target.value })}
                    />
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/baggage/${selectedBaggage.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              travelerFirstName: selectedBaggage.travelerFirstName,
                              travelerLastName: selectedBaggage.travelerLastName,
                              whatsappOwner: selectedBaggage.whatsappOwner,
                              status: 'active'
                            }),
                          });
                          if (res.ok) {
                            fetchBaggages();
                            setShowDetailModal(false);
                          }
                        } catch (error) {
                          console.error('Error updating baggage:', error);
                        }
                      }}
                      className="w-full py-2 bg-[#2563EB] hover:bg-[#ff9f00] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  {getStatusBadge(selectedBaggage.status)}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Créé le</p>
                  <p className="text-slate-800 dark:text-white">{formatDate(selectedBaggage.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Dernier scan</p>
                <p className="text-slate-800 dark:text-white">{formatDateTime(selectedBaggage.lastScanDate)}</p>
                {selectedBaggage.lastLocation && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {selectedBaggage.lastLocation}
                  </p>
                )}
              </div>

              {/* Founder Information */}
              {selectedBaggage.founderName && (
                <div className="p-4 bg-emerald-50 dark:bg-blue-600/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-emerald-700 dark:text-blue-500 font-medium">Trouvé par</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 dark:text-white font-medium">{selectedBaggage.founderName}</span>
                      {selectedBaggage.founderAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          le {formatDate(selectedBaggage.founderAt)}
                        </span>
                      )}
                    </div>
                    {selectedBaggage.founderPhone && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${selectedBaggage.founderPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Contacter sur WhatsApp
                        </a>
                        <span className="text-slate-600 dark:text-slate-400 text-sm">{selectedBaggage.founderPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Expire le</p>
                <p className="text-slate-800 dark:text-white">{formatDate(selectedBaggage.expiresAt)}</p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href={`/found/${selectedBaggage.reference}`}
                  className="block w-full text-center py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-medium"
                >
                  Tester le scan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && baggageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold">Supprimer ce bagage ?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{baggageToDelete.reference}</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Cette action est irréversible. Le bagage de <strong className="text-slate-700 dark:text-slate-300">{baggageToDelete.travelerFirstName || 'Non renseigné'} {baggageToDelete.travelerLastName || ''}</strong> sera définitivement supprimé.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setBaggageToDelete(null); }}
                  className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteBaggage}
                  className="flex-1 py-2 px-4 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Baggage Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <Pencil className="w-5 h-5 text-blue-600" />
              Modifier le bagage
              {selectedBaggage && (
                <span className="text-sm font-normal text-slate-500 font-mono">({selectedBaggage.reference})</span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Voyageur */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Informations du voyageur
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Prénom</Label>
                  <Input
                    value={editForm.travelerFirstName || ''}
                    onChange={(e) => setEditForm({ ...editForm, travelerFirstName: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Prénom du voyageur"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Nom</Label>
                  <Input
                    value={editForm.travelerLastName || ''}
                    onChange={(e) => setEditForm({ ...editForm, travelerLastName: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Nom du voyageur"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-600 dark:text-slate-400 text-xs">WhatsApp</Label>
                <Input
                  value={editForm.whatsappOwner || ''}
                  onChange={(e) => setEditForm({ ...editForm, whatsappOwner: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  placeholder="+33612345678"
                />
              </div>
            </div>

            {/* Transport */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Informations de transport
              </h4>
              <div className="space-y-1.5">
                <Label className="text-slate-600 dark:text-slate-400 text-xs">Mode de transport</Label>
                <Select
                  value={editForm.transportMode || 'flight'}
                  onValueChange={(value) => setEditForm({ ...editForm, transportMode: value })}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="flight">✈️ Avion</SelectItem>
                    <SelectItem value="train">🚆 Train</SelectItem>
                    <SelectItem value="boat">🚢 Bateau</SelectItem>
                    <SelectItem value="bus">🚌 Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editForm.transportMode === 'flight' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Compagnie aérienne</Label>
                    <Input
                      value={editForm.airlineName || ''}
                      onChange={(e) => setEditForm({ ...editForm, airlineName: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="Air France, Royal Air Maroc..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Numéro de vol</Label>
                    <Input
                      value={editForm.flightNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, flightNumber: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="AF1234"
                    />
                  </div>
                </div>
              )}

              {editForm.transportMode === 'train' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Compagnie ferroviaire</Label>
                    <Input
                      value={editForm.trainCompany || ''}
                      onChange={(e) => setEditForm({ ...editForm, trainCompany: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="SNCF, ONCF..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Numéro de train</Label>
                    <Input
                      value={editForm.trainNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, trainNumber: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="TGV 6123"
                    />
                  </div>
                </div>
              )}

              {editForm.transportMode === 'boat' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Nom du navire</Label>
                    <Input
                      value={editForm.shipName || ''}
                      onChange={(e) => setEditForm({ ...editForm, shipName: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="MSC Fantasia..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Cabine</Label>
                    <Input
                      value={editForm.shipCabin || ''}
                      onChange={(e) => setEditForm({ ...editForm, shipCabin: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="Pont 4, Cabine 312"
                    />
                  </div>
                </div>
              )}

              {editForm.transportMode === 'bus' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Compagnie de bus</Label>
                    <Input
                      value={editForm.busCompany || ''}
                      onChange={(e) => setEditForm({ ...editForm, busCompany: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="CTM, Supratours..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-400 text-xs">Ligne / Trajet</Label>
                    <Input
                      value={editForm.busLineNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, busLineNumber: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      placeholder="Ligne 45, Casa → Marrakech"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Destination</Label>
                  <Input
                    value={editForm.destination || ''}
                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Jeddah, Médine..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Date de départ</Label>
                  <Input
                    type="date"
                    value={editForm.departureDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, departureDate: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Heure de départ</Label>
                  <Input
                    type="time"
                    value={editForm.departureTime || ''}
                    onChange={(e) => setEditForm({ ...editForm, departureTime: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Statut
              </h4>
              <div className="space-y-1.5">
                <Select
                  value={editForm.status || 'pending_activation'}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="pending_activation">En attente</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="scanned">Scanné</SelectItem>
                    <SelectItem value="lost">Perdu</SelectItem>
                    <SelectItem value="found">Retrouvé</SelectItem>
                    <SelectItem value="blocked">Bloqué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBaggageEditSubmit}
              disabled={editLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass Identity Edit Dialog */}
      <Dialog open={passIdEditOpen} onOpenChange={setPassIdEditOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <Pencil className="w-5 h-5 text-blue-600" />
              Modifier le Pass Identity
              {selectedPassId && (
                <span className="text-sm font-normal text-slate-500 font-mono">({selectedPassId.qrCode})</span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Identité */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Identité
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Nom complet</Label>
                  <Input
                    value={passIdForm.fullName || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, fullName: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Nom complet"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Nationalité</Label>
                  <Input
                    value={passIdForm.nationality || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, nationality: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Nationalité"
                  />
                </div>
              </div>
            </div>

            {/* Santé */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Santé
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Groupe sanguin</Label>
                  <Select
                    value={passIdForm.bloodType || ''}
                    onValueChange={(value) => setPassIdForm({ ...passIdForm, bloodType: value })}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectItem value="">Non renseigné</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Maladie critique</Label>
                  <Input
                    value={passIdForm.diseases || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, diseases: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Diabète, hypertension..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Allergies</Label>
                  <Input
                    value={passIdForm.allergies || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, allergies: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Pénicilline, arachide..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Médicaments</Label>
                  <Input
                    value={passIdForm.medicalInfo || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, medicalInfo: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Insuline, metformine..."
                  />
                </div>
              </div>
            </div>

            {/* Hébergement */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Hébergement
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Hôtel à La Mecque</Label>
                  <Input
                    value={passIdForm.hotelMecca || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, hotelMecca: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Nom de l'hôtel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">N° Chambre Mecque</Label>
                  <Input
                    value={passIdForm.roomMecca || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, roomMecca: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-lg font-bold"
                    placeholder="N° chambre"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Hôtel à Médine</Label>
                  <Input
                    value={passIdForm.hotelMedina || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, hotelMedina: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="Nom de l'hôtel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">N° Chambre Médine</Label>
                  <Input
                    value={passIdForm.roomMedina || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, roomMedina: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-lg font-bold"
                    placeholder="N° chambre"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">☎️ Téléphone de l'hôtel</Label>
                  <Input
                    value={passIdForm.hotelPhone || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, hotelPhone: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="+966 12 557 0000"
                  />
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contacts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">📱 Chef de groupe (indicatif + n°)</Label>
                  <Input
                    value={passIdForm.groupLeaderPhone || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, groupLeaderPhone: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="+213 555 123 456"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">📱 Agence (indicatif + n°)</Label>
                  <Input
                    value={passIdForm.agencyPhone || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, agencyPhone: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="+966 12 557 0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">📱 Famille (indicatif + n°)</Label>
                  <Input
                    value={passIdForm.familyContact || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, familyContact: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Document AlNusuk (URL)</Label>
                  <Input
                    value={passIdForm.alNusukDocUrl || ''}
                    onChange={(e) => setPassIdForm({ ...passIdForm, alNusukDocUrl: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPassIdEditOpen(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePassIdEditSubmit}
              disabled={passIdEditLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {passIdEditLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Pencil className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Modal for Pass Identity */}
      {qrPreviewPilgrim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setQrPreviewPilgrim(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">QR Code Pass Identity</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{qrPreviewPilgrim.qrCode}</p>
                </div>
              </div>
              <button
                onClick={() => setQrPreviewPilgrim(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              {/* QR Code with flanking icons */}
              <div className="flex items-center gap-3 mb-4">
                {/* Envelope icon — family */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-lg">✉️</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium text-center">Famille</span>
                </div>
                {/* QR Code */}
                <div className="bg-white rounded-xl p-4 border-2 border-emerald-200">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${qrPreviewPilgrim.qrCode}`}
                    size={160}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#059669"
                  />
                </div>
                {/* Medical icon — health */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="text-lg">⚕️</span>
                  </div>
                  <span className="text-[9px] text-red-600 dark:text-red-400 font-medium text-center">Santé</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{qrPreviewPilgrim.fullName}</p>
              {qrPreviewPilgrim.bloodType && (
                <p className="text-xs text-slate-500 dark:text-slate-400">🩸 Groupe sanguin : {qrPreviewPilgrim.bloodType}</p>
              )}
              <div className="flex gap-2 mt-4 w-full">
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${qrPreviewPilgrim.qrCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir le profil
                </a>
                <button
                  onClick={() => {
                    const svg = document.querySelector('#qr-preview-svg');
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const blob = new Blob([svgData], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pass-identity-${qrPreviewPilgrim.qrCode}.svg`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
