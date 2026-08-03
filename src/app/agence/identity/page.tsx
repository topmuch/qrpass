'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserRound,
  Search,
  Eye,
  QrCode,
  X,
  Clock,
  CheckCircle,
  Heart,
  Phone,
} from "lucide-react";
import { useAgency } from '../layout';

interface Pilgrim {
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
  groupLeaderPhone: string | null;
  agencyPhone: string | null;
  familyContact: string | null;
  isActive: boolean;
  duration: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function IdentityPage() {
  const { agencyId, agencyName } = useAgency();
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [filteredPilgrims, setFilteredPilgrims] = useState<Pilgrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPilgrims();
  }, [agencyId]);

  useEffect(() => {
    filterPilgrims();
  }, [pilgrims, search, statusFilter]);

  const fetchPilgrims = async () => {
    try {
      const params = new URLSearchParams({ agencyId });
      const response = await fetch(`/api/agency/pilgrims?${params}`);
      const data = await response.json();
      setPilgrims(data.pilgrims || []);
    } catch (error) {
      console.error('Error fetching pilgrims:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPilgrims = () => {
    let filtered = [...pilgrims];

    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.isActive);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(p => !p.isActive);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.qrCode.toLowerCase().includes(searchLower) ||
        p.fullName.toLowerCase().includes(searchLower) ||
        p.nationality.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPilgrims(filtered);
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

  const activePilgrims = filteredPilgrims.filter(p => p.isActive);
  const pendingPilgrims = filteredPilgrims.filter(p => !p.isActive);

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Activés' },
    { id: 'pending', label: 'En attente' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <UserRound className="w-7 h-7 text-emerald-600" />
            Pass Identity
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bracelets d&apos;identification des pèlerins Hajj</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <UserRound className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{pilgrims.length}</p>
          <p className="text-sm text-white/80">Total Identity</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{pilgrims.filter(p => p.isActive).length}</p>
          <p className="text-sm text-white/80">Activés</p>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{pilgrims.filter(p => !p.isActive).length}</p>
          <p className="text-sm text-white/80">En attente</p>
        </div>
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold">{pilgrims.filter(p => p.bloodType).length}</p>
          <p className="text-sm text-white/80">Groupe sanguin</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par code QR, nom ou nationalité..."
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
              <span className="text-slate-500">Chargement des Pass Identity...</span>
            </div>
          </div>
        </div>
      ) : filteredPilgrims.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <UserRound className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Aucun Pass Identity trouvé</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Les QR codes Identity sont générés par le SuperAdmin</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Section 1 — Activated Pilgrims */}
          {activePilgrims.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-600/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                    Bracelets activés ({activePilgrims.length})
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Code QR</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Pèlerin</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Groupe sanguin</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden lg:table-cell">Hôtel Mecque</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Statut</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePilgrims.map((pilgrim) => (
                      <tr key={pilgrim.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-600/10 flex items-center justify-center">
                              <QrCode className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-slate-800 dark:text-white font-mono font-medium">{pilgrim.qrCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-slate-800 dark:text-white font-medium">
                              {pilgrim.fullName && pilgrim.fullName.trim() !== '' ? pilgrim.fullName : 'Non renseigné'}
                            </span>
                            {pilgrim.nationality && pilgrim.nationality.trim() !== '' && (
                              <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">({pilgrim.nationality})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {pilgrim.bloodType ? (
                            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">{pilgrim.bloodType}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {pilgrim.hotelMecca ? (
                            <span className="text-slate-600 dark:text-slate-300 text-sm">{pilgrim.hotelMecca}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">Actif</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => { setSelectedPilgrim(pilgrim); setShowDetailModal(true); }}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{activePilgrims.length} bracelet(s) activé(s)</span>
              </div>
            </div>
          )}

          {/* Section 2 — Pending Pilgrims */}
          {pendingPilgrims.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-600/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                    QR en attente d&apos;activation ({pendingPilgrims.length})
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Code QR</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Pèlerin</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Nationalité</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Créé le</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Statut</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPilgrims.map((pilgrim) => (
                      <tr key={pilgrim.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-600/10 flex items-center justify-center">
                              <QrCode className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-slate-800 dark:text-white font-mono font-medium">{pilgrim.qrCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {pilgrim.fullName && pilgrim.fullName.trim() !== '' ? (
                            <span className="text-slate-800 dark:text-white font-medium">{pilgrim.fullName}</span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-500 rounded-full text-xs font-medium">Non activé</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-slate-600 dark:text-slate-300 text-sm">
                            {pilgrim.nationality && pilgrim.nationality.trim() !== '' ? pilgrim.nationality : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-slate-400 dark:text-slate-500 text-sm">{formatDate(pilgrim.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-600/10 text-amber-700 dark:text-amber-400">En attente</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => { setSelectedPilgrim(pilgrim); setShowDetailModal(true); }}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{pendingPilgrims.length} QR en attente d&apos;activation</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-4">
            <span className="text-slate-400 dark:text-slate-500 text-xs">
              {filteredPilgrims.length} Pass Identity affiché(s) sur {pilgrims.length}
            </span>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPilgrim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserRound className="w-5 h-5 text-emerald-600" />
                Pass Identity
              </h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedPilgrim(null); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* QR Code Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-600/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold">{selectedPilgrim.qrCode}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Pass Identity Hajj</p>
                </div>
              </div>

              {/* Name & Nationality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nom complet</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {selectedPilgrim.fullName && selectedPilgrim.fullName.trim() !== '' ? selectedPilgrim.fullName : 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nationalité</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {selectedPilgrim.nationality && selectedPilgrim.nationality.trim() !== '' ? selectedPilgrim.nationality : 'Non renseignée'}
                  </p>
                </div>
              </div>

              {/* Blood Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Groupe sanguin</p>
                  {selectedPilgrim.bloodType ? (
                    <span className="inline-block px-2.5 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold mt-1">{selectedPilgrim.bloodType}</span>
                  ) : (
                    <p className="text-slate-400">—</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  {selectedPilgrim.isActive ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 mt-1">Actif</span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-600/10 text-amber-700 dark:text-amber-400 mt-1">En attente d&apos;activation</span>
                  )}
                </div>
              </div>

              {/* Medical Info */}
              {selectedPilgrim.medicalInfo && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Informations médicales</p>
                  <p className="text-slate-800 dark:text-white text-sm mt-1">{selectedPilgrim.medicalInfo}</p>
                </div>
              )}

              {/* Accommodation */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-3">Hébergement</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Mecque</p>
                    <p className="text-slate-800 dark:text-white text-sm font-medium">
                      {selectedPilgrim.hotelMecca || '—'}{selectedPilgrim.roomMecca ? ` (Ch. ${selectedPilgrim.roomMecca})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Médine</p>
                    <p className="text-slate-800 dark:text-white text-sm font-medium">
                      {selectedPilgrim.hotelMedina || '—'}{selectedPilgrim.roomMedina ? ` (Ch. ${selectedPilgrim.roomMedina})` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-3">Contacts</p>
                <div className="space-y-2">
                  {selectedPilgrim.groupLeaderPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Chef de groupe: {selectedPilgrim.groupLeaderPhone}</span>
                    </div>
                  )}
                  {selectedPilgrim.familyContact && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Famille: {selectedPilgrim.familyContact}</span>
                    </div>
                  )}
                  {selectedPilgrim.agencyPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Agence: {selectedPilgrim.agencyPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Créé le</p>
                    <p className="text-slate-800 dark:text-white text-sm">{formatDate(selectedPilgrim.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Expiration</p>
                    <p className="text-slate-800 dark:text-white text-sm">{selectedPilgrim.expiresAt ? formatDate(selectedPilgrim.expiresAt) : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* Tester le scan - opens the /found/ page */}
                <Link
                  href={`/found/${selectedPilgrim.qrCode}`}
                  className="block w-full text-center py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  📱 Tester le scan
                </Link>

                {/* View public profile (only if activated) */}
                {selectedPilgrim.isActive && (
                  <Link
                    href={`/p/${selectedPilgrim.qrCode}`}
                    className="block w-full text-center py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    👤 Voir le profil public
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
