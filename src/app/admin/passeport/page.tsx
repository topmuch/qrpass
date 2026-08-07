'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  QrCode,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  RotateCcw,
  X,
  ChevronDown,
  Building2,
  Globe,
  Phone,
  Mail,
  Calendar,
  StickyNote,
  Shield,
  MapPin,
  User,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Types
interface Passport {
  id: string;
  qrCode: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  nationality?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  photoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  homeAddress?: string;
  travelDestination?: string;
  travelDate?: string;
  returnDate?: string;
  notes?: string;
  isActive: boolean;
  status: string;
  duration: string;
  expiresAt?: string | null;
  agencyId?: string;
  agency?: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  lost: number;
  found: number;
  blocked: number;
}

interface Agency {
  id: string;
  name: string;
}

type StatusFilter = 'all' | 'active' | 'pending_activation' | 'lost' | 'found' | 'blocked';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: {
    label: 'Actif',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  pending_activation: {
    label: 'En attente',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  lost: {
    label: 'Perdu',
    color: 'text-red-700',
    bg: 'bg-red-100',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  found: {
    label: 'Retrouvé',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
  blocked: {
    label: 'Bloqué',
    color: 'text-slate-700',
    bg: 'bg-slate-200',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
};

export default function AdminPasseportPage() {
  // Data
  const [passports, setPassports] = useState<Passport[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, lost: 0, found: 0, blocked: 0 });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generateAgencyId, setGenerateAgencyId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchPassports();
  }, []);

  const fetchPassports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agencyFilter && agencyFilter !== 'all') params.set('agencyId', agencyFilter);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/passports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPassports(data.passports || []);
        setStats(data.stats || { total: 0, active: 0, pending: 0, lost: 0, found: 0, blocked: 0 });
        if (data.agencies) setAgencies(data.agencies);
      }
    } catch (err) {
      console.error('Failed to fetch passports:', err);
      toast({ title: 'Erreur', description: 'Impossible de charger les passeports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) fetchPassports();
  }, [statusFilter, agencyFilter, loading]);

  // Debounced search
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => fetchPassports(), 300);
    return () => clearTimeout(timer);
  }, [search, loading]);

  // Generate QR codes
  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedCodes([]);
    try {
      const body: Record<string, unknown> = { count: generateCount };
      if (generateAgencyId) body.agencyId = generateAgencyId;

      const res = await fetch('/api/passeport/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCodes(data.qrCodes || []);
        toast({ title: 'QR générés', description: `${data.generated} code(s) PP- généré(s)` });
        fetchPassports();
      } else {
        toast({ title: 'Erreur', description: data.error || 'Échec de génération', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // View detail
  const handleViewDetail = async (qrCode: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await fetch(`/api/passeport/${qrCode}`);
      const data = await res.json();
      if (res.ok && data.passport) {
        setSelectedPassport(data.passport as Passport);
      } else {
        // Fallback: use list data
        const found = passports.find(p => p.qrCode === qrCode);
        setSelectedPassport(found || null);
      }
    } catch {
      const found = passports.find(p => p.qrCode === qrCode);
      setSelectedPassport(found || null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Update status
  const handleStatusUpdate = async (qrCode: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/passeport/${qrCode}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Statut mis à jour', description: `${qrCode} → ${STATUS_CONFIG[newStatus]?.label || newStatus}` });
        // Update local data
        setPassports(prev =>
          prev.map(p => (p.qrCode === qrCode ? { ...p, status: newStatus, isActive: newStatus === 'active' } : p))
        );
        if (selectedPassport?.qrCode === qrCode) {
          setSelectedPassport(prev => prev ? { ...prev, status: newStatus, isActive: newStatus === 'active' } : prev);
        }
      } else {
        toast({ title: 'Erreur', description: data.error || 'Mise à jour échouée', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter buttons
  const filterButtons: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: stats.total },
    { key: 'active', label: 'Actifs', count: stats.active },
    { key: 'pending_activation', label: 'En attente', count: stats.pending },
    { key: 'lost', label: 'Perdus', count: stats.lost },
    { key: 'found', label: 'Retrouvés', count: stats.found },
  ];

  const statusCfg = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending_activation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Passeport — PP-XXXXXX</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stats.total} passeport{stats.total !== 1 ? 's' : ''} enregistré{stats.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Générer des QR
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatMiniCard label="Total" value={stats.total} icon={<BookOpen className="w-4 h-4" />} bg="bg-slate-100" color="text-slate-600" />
        <StatMiniCard label="Actifs" value={stats.active} icon={<CheckCircle className="w-4 h-4" />} bg="bg-emerald-100" color="text-emerald-600" />
        <StatMiniCard label="En attente" value={stats.pending} icon={<Clock className="w-4 h-4" />} bg="bg-amber-100" color="text-amber-600" />
        <StatMiniCard label="Perdus" value={stats.lost} icon={<AlertTriangle className="w-4 h-4" />} bg="bg-red-100" color="text-red-600" />
        <StatMiniCard label="Retrouvés" value={stats.found} icon={<RotateCcw className="w-4 h-4" />} bg="bg-blue-100" color="text-blue-600" />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === btn.key
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {btn.label}
              <span className={`ml-1.5 ${statusFilter === btn.key ? 'text-white/70' : 'text-slate-400'}`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 dark:border-slate-700 w-full sm:w-auto sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, QR, nationalité..."
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
          />
        </div>

        {/* Agency Filter */}
        {agencies.length > 0 && (
          <div className="relative">
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
            >
              <option value="all">Toutes les agences</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Passport Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : passports.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun passeport trouvé</p>
          <p className="text-sm mt-1">Générez des codes QR pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {passports.map((p) => {
            const cfg = statusCfg(p.status);
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Top colored bar */}
                <div className={`h-1.5 ${
                  p.status === 'active' ? 'bg-emerald-500' :
                  p.status === 'lost' ? 'bg-red-500' :
                  p.status === 'found' ? 'bg-blue-500' :
                  p.status === 'blocked' ? 'bg-slate-400' :
                  'bg-amber-400'
                }`} />

                <div className="p-5">
                  {/* QR Code + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-mono text-sm font-semibold">
                      <QrCode className={`w-4 h-4 ${cfg.color} transition-colors`} />
                      <span className={cfg.color}>{p.qrCode}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 truncate">
                    {p.fullName || 'Non renseigné'}
                  </h3>

                  {/* Info rows */}
                  <div className="space-y-1.5 text-sm">
                    {p.nationality && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Nationalité
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{p.nationality}</span>
                      </div>
                    )}
                    {p.passportNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          N° passeport
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 font-mono text-xs">{p.passportNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Agence
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 text-right truncate ml-2">
                        {p.agency?.name || '—'}
                      </span>
                    </div>
                    {p.gender && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Sexe
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{p.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(p.qrCode)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Détails
                    </button>
                    {p.status === 'lost' && (
                      <button
                        onClick={() => handleStatusUpdate(p.qrCode, 'found')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retrouvé
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button
                        onClick={() => handleStatusUpdate(p.qrCode, 'lost')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Perdu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Generate Modal ─── */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowGenerateModal(false); setGeneratedCodes([]); }} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Générer des codes PP-</h2>
                  <p className="text-xs text-slate-500">Pass Passeport</p>
                </div>
              </div>
              <button
                onClick={() => { setShowGenerateModal(false); setGeneratedCodes([]); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {generatedCodes.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {generatedCodes.length} code(s) généré(s) avec succès
                  </p>
                  <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-xl p-3 space-y-1.5 custom-scrollbar">
                    {generatedCodes.map(code => (
                      <div key={code} className="flex items-center gap-2 font-mono text-sm">
                        <QrCode className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{code}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowGenerateModal(false); setGeneratedCodes([]); }}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  {/* Count */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Nombre de codes à générer
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={generateCount}
                      onChange={(e) => setGenerateCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 100))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                    <p className="text-xs text-slate-400 mt-1">1 à 100 codes PP-XXXXXX</p>
                  </div>

                  {/* Agency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Agence (optionnel)
                    </label>
                    <div className="relative">
                      <select
                        value={generateAgencyId}
                        onChange={(e) => setGenerateAgencyId(e.target.value)}
                        className="w-full appearance-none px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                      >
                        <option value="">Aucune agence</option>
                        {agencies.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        Générer {generateCount} code(s)
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDetailModal(false); setSelectedPassport(null); }} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                {selectedPassport && (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">{selectedPassport.qrCode}</h2>
                      <p className="text-xs text-slate-500">Pass Passeport</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedPassport(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : selectedPassport ? (
                <div className="space-y-6">
                  {/* Status Section */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cfg = statusCfg(selectedPassport.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        );
                      })()}
                      <span className="text-xs text-slate-400">
                        Créé le {new Date(selectedPassport.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Status Update Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedPassport.status}
                        onChange={(e) => handleStatusUpdate(selectedPassport.qrCode, e.target.value)}
                        disabled={updatingStatus}
                        className="appearance-none px-3 py-1.5 pr-8 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer disabled:opacity-50"
                      >
                        <option value="pending_activation">En attente</option>
                        <option value="active">Actif</option>
                        <option value="lost">Perdu</option>
                        <option value="found">Retrouvé</option>
                        <option value="blocked">Bloqué</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-violet-500" />
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailRow label="Nom complet" value={selectedPassport.fullName} />
                      <DetailRow label="Prénom" value={selectedPassport.firstName} />
                      <DetailRow label="Nom" value={selectedPassport.lastName} />
                      <DetailRow label="Nationalité" value={selectedPassport.nationality} />
                      <DetailRow label="N° passeport" value={selectedPassport.passportNumber} />
                      <DetailRow label="Date de naissance" value={selectedPassport.dateOfBirth} />
                      <DetailRow label="Lieu de naissance" value={selectedPassport.placeOfBirth} />
                      <DetailRow label="Sexe" value={selectedPassport.gender === 'M' ? 'Masculin' : selectedPassport.gender === 'F' ? 'Féminin' : selectedPassport.gender} />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-violet-500" />
                      Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailRow label="Téléphone" value={selectedPassport.phone} />
                      <DetailRow label="WhatsApp" value={selectedPassport.whatsapp} />
                      <DetailRow label="Email" value={selectedPassport.email} />
                      <DetailRow label="Adresse" value={selectedPassport.homeAddress} />
                    </div>
                  </div>

                  {/* Emergency */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-violet-500" />
                      Urgence
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailRow label="Contact urgence" value={selectedPassport.emergencyContact} />
                      <DetailRow label="Tél. urgence" value={selectedPassport.emergencyPhone} />
                    </div>
                  </div>

                  {/* Travel Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-violet-500" />
                      Voyage
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailRow label="Destination" value={selectedPassport.travelDestination} />
                      <DetailRow label="Date de départ" value={selectedPassport.travelDate} />
                      <DetailRow label="Date de retour" value={selectedPassport.returnDate} />
                      <DetailRow label="Agence" value={selectedPassport.agency?.name} />
                      <DetailRow label="Durée" value={selectedPassport.duration === '1y' ? '1 an' : selectedPassport.duration === '30d' ? '30 jours' : selectedPassport.duration} />
                      <DetailRow label="Expiration" value={selectedPassport.expiresAt ? new Date(selectedPassport.expiresAt).toLocaleDateString('fr-FR') : undefined} />
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPassport.notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-violet-500" />
                        Notes
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                        {selectedPassport.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Passeport introuvable</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function StatMiniCard({
  label,
  value,
  icon,
  bg,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
        {value || '—'}
      </span>
    </div>
  );
}
