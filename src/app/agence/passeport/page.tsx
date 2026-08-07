'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  QrCode,
  Shield,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Clock,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAgency } from '../layout';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Passport {
  id: string;
  qrCode: string;
  fullName: string;
  nationality: string;
  phone: string | null;
  email: string | null;
  status: 'active' | 'pending' | 'lost' | 'blocked' | 'found';
  createdAt: string;
  updatedAt: string;
}

interface PassportStats {
  total: number;
  active: number;
  pending: number;
  lost: number;
}

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  active: { label: 'Actif', bgClass: 'bg-emerald-100 dark:bg-emerald-600/10', textClass: 'text-emerald-700 dark:text-emerald-400' },
  pending: { label: 'En attente', bgClass: 'bg-amber-100 dark:bg-amber-600/10', textClass: 'text-amber-700 dark:text-amber-400' },
  lost: { label: 'Perdu', bgClass: 'bg-rose-100 dark:bg-rose-600/10', textClass: 'text-rose-700 dark:text-rose-400' },
  blocked: { label: 'Bloqué', bgClass: 'bg-slate-200 dark:bg-slate-600/20', textClass: 'text-slate-700 dark:text-slate-400' },
  found: { label: 'Retrouvé', bgClass: 'bg-blue-100 dark:bg-blue-600/10', textClass: 'text-blue-700 dark:text-blue-400' },
};

export default function PasseportPage() {
  const { agencyId } = useAgency();
  const [passports, setPassports] = useState<Passport[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<Passport[]>([]);
  const [stats, setStats] = useState<PassportStats>({ total: 0, active: 0, pending: 0, lost: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPassports();
  }, [agencyId]);

  useEffect(() => {
    filterPassports();
  }, [passports, search, statusFilter]);

  const fetchPassports = async () => {
    try {
      const params = new URLSearchParams({ agencyId });
      const response = await fetch(`/api/agency/passports?${params}`);
      const data = await response.json();
      setPassports(data.passports || []);
      setStats(data.stats || { total: 0, active: 0, pending: 0, lost: 0 });
    } catch (error) {
      console.error('Error fetching passports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPassports = () => {
    let filtered = [...passports];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.qrCode.toLowerCase().includes(searchLower) ||
        p.fullName.toLowerCase().includes(searchLower) ||
        (p.phone && p.phone.toLowerCase().includes(searchLower))
      );
    }

    setFilteredPassports(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleGenerateQR = async () => {
    if (generateCount < 1 || generateCount > 50) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/passeport/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, count: generateCount }),
      });
      if (!response.ok) throw new Error('Erreur de génération');
      const data = await response.json();
      toast({
        title: 'QR Codes générés',
        description: `${data.passports?.length || generateCount} code(s) PP- généré(s) avec succès.`,
      });
      setShowGenerateDialog(false);
      setGenerateCount(1);
      fetchPassports();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les QR codes.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (qrCode: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/passeport/${qrCode}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Erreur de mise à jour');
      toast({
        title: 'Statut mis à jour',
        description: `Passeport ${qrCode} → ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
      });
      // Refresh data
      fetchPassports();
      // Update selected passport if modal is open
      if (selectedPassport && selectedPassport.qrCode === qrCode) {
        setSelectedPassport({ ...selectedPassport, status: newStatus as Passport['status'] });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
    }
  };

  const statusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
        {config.label}
      </span>
    );
  };

  const topBarColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-600';
      case 'pending': return 'bg-amber-500';
      case 'lost': return 'bg-rose-500';
      case 'blocked': return 'bg-slate-500';
      case 'found': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Actifs' },
    { id: 'pending', label: 'En attente' },
    { id: 'lost', label: 'Perdus' },
    { id: 'found', label: 'Retrouvés' },
  ];

  const blockedCount = passports.filter(p => p.status === 'blocked').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Passeport
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestion des passeports pèlerins Hajj</p>
        </div>
        <button
          onClick={() => setShowGenerateDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-5 h-5" />
          Générer des QR
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-white/80">Total Passeport</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-sm text-white/80">Actifs</p>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-white/80">En attente</p>
        </div>
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{stats.lost}</p>
          <p className="text-sm text-white/80">Perdus</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par code QR, nom ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
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
                ? 'bg-emerald-600 text-white shadow-lg'
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
              <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-slate-500">Chargement des passeports...</span>
            </div>
          </div>
        </div>
      ) : filteredPassports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Aucun passeport trouvé</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Générez des QR codes PP- pour commencer</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPassports.map((passport) => (
              <div
                key={passport.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Top colored bar */}
                <div className={`h-2 ${topBarColor(passport.status)}`} />
                <div className="p-5">
                  {/* QR Code row + Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      href={`/found/${passport.qrCode}`}
                      className="flex items-center gap-2 font-mono text-sm font-semibold group/qr"
                      title={`Scanner ${passport.qrCode}`}
                    >
                      <QrCode className={`w-4 h-4 transition-colors ${
                        passport.status === 'active' ? 'text-emerald-600 group-hover/qr:text-emerald-700' :
                        passport.status === 'lost' ? 'text-rose-500 group-hover/qr:text-rose-600' :
                        passport.status === 'blocked' ? 'text-slate-500 group-hover/qr:text-slate-600' :
                        'text-amber-500 group-hover/qr:text-amber-600'
                      }`} />
                      <span className={`transition-colors ${
                        passport.status === 'active' ? 'text-emerald-600 group-hover/qr:text-emerald-700' :
                        passport.status === 'lost' ? 'text-rose-500 group-hover/qr:text-rose-600' :
                        passport.status === 'blocked' ? 'text-slate-500 group-hover/qr:text-slate-600' :
                        'text-amber-500 group-hover/qr:text-amber-600'
                      }`}>
                        {passport.qrCode}
                      </span>
                    </Link>
                    {statusBadge(passport.status)}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                    {passport.fullName && passport.fullName.trim() !== '' ? passport.fullName : 'Non renseigné'}
                  </h3>

                  {/* Info rows */}
                  <div className="space-y-1.5 text-sm">
                    {passport.nationality && passport.nationality.trim() !== '' && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Nationalité</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{passport.nationality}</span>
                      </div>
                    )}
                    {passport.phone && passport.phone.trim() !== '' && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Téléphone</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{passport.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Créé le</span>
                      <span className="text-slate-700 dark:text-slate-200">{formatDate(passport.createdAt)}</span>
                    </div>
                  </div>

                  {/* QR Code preview */}
                  <div className="mt-3 flex justify-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <QRCodeSVG
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/found/${passport.qrCode}`}
                        size={64}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#1e293b"
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => { setSelectedPassport(passport); setShowDetailModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-600/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <span className="text-slate-400 dark:text-slate-500 text-xs">
              {filteredPassports.length} passeport(s) affiché(s) sur {passports.length}
            </span>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPassport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Passeport
              </h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedPassport(null); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* QR Code Info */}
              <Link
                href={`/found/${selectedPassport.qrCode}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-600/5 transition-colors group/qrlink"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-600/10 rounded-xl flex items-center justify-center group-hover/qrlink:bg-emerald-200 dark:group-hover/qrlink:bg-emerald-600/20 transition-colors">
                  <QrCode className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold group-hover/qrlink:text-emerald-600 dark:group-hover/qrlink:text-emerald-400 transition-colors">{selectedPassport.qrCode}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Passeport Hajj — Cliquer pour scanner</p>
                </div>
              </Link>

              {/* QR Code SVG */}
              <div className="flex justify-center py-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/found/${selectedPassport.qrCode}`}
                    size={140}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#1e293b"
                  />
                </div>
              </div>

              {/* Name & Nationality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nom complet</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {selectedPassport.fullName && selectedPassport.fullName.trim() !== '' ? selectedPassport.fullName : 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nationalité</p>
                  <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-400" />
                    {selectedPassport.nationality && selectedPassport.nationality.trim() !== '' ? selectedPassport.nationality : 'Non renseignée'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  <div className="mt-1">{statusBadge(selectedPassport.status)}</div>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Créé le</p>
                  <p className="text-slate-800 dark:text-white font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(selectedPassport.createdAt)}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-3">Contact</p>
                <div className="space-y-2">
                  {selectedPassport.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{selectedPassport.phone}</span>
                    </div>
                  )}
                  {selectedPassport.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{selectedPassport.email}</span>
                    </div>
                  )}
                  {!selectedPassport.phone && !selectedPassport.email && (
                    <p className="text-sm text-slate-400">Aucun contact renseigné</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Mis à jour</p>
                    <p className="text-slate-800 dark:text-white text-sm">{formatDate(selectedPassport.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Code QR</p>
                    <p className="text-slate-800 dark:text-white text-sm font-mono">{selectedPassport.qrCode}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* Tester le scan */}
                <Link
                  href={`/found/${selectedPassport.qrCode}`}
                  className="block w-full text-center py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  📱 Tester le scan
                </Link>

                {/* Déclarer perdu (only if active) */}
                {selectedPassport.status === 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPassport.qrCode, 'lost')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors font-medium"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Déclarer perdu
                  </button>
                )}

                {/* Retrouver (only if lost) */}
                {selectedPassport.status === 'lost' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPassport.qrCode, 'found')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retrouvé
                  </button>
                )}

                {/* Bloquer (if active or found) */}
                {(selectedPassport.status === 'active' || selectedPassport.status === 'found') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPassport.qrCode, 'blocked')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquer
                  </button>
                )}

                {/* Débloquer (if blocked) */}
                {selectedPassport.status === 'blocked' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPassport.qrCode, 'active')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors font-medium"
                  >
                    <Shield className="w-4 h-4" />
                    Débloquer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate QR Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <Plus className="w-5 h-5 text-emerald-600" />
              Générer des QR Passeport
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Créez de nouveaux codes PP-XXXXXX pour les pèlerins de votre agence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Nombre de QR codes à générer
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="text-center text-lg font-semibold"
              />
              <p className="text-xs text-slate-400 mt-1.5">Entre 1 et 50 QR codes par génération</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Aperçu</p>
              <p className="text-lg font-mono font-bold text-emerald-600 mt-1">
                PP-{Math.random().toString(36).substring(2, 8).toUpperCase()}
              </p>
              <p className="text-xs text-slate-400 mt-1">× {generateCount} code(s)</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={generating}>Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleGenerateQR}
              disabled={generating || generateCount < 1 || generateCount > 50}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Génération...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Générer {generateCount} QR
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
