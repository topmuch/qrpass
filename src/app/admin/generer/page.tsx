'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  RefreshCw,
  CheckCircle,
  Building2,
  Package,
  AlertCircle,
  Shield,
  Archive,
  Loader2,
  Luggage,
  UserRound,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

// Types
interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

type PassType = 'bagage' | 'identity';

export default function GenererQRPage() {
  const { isSuperAdmin } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastGeneratedRefs, setLastGeneratedRefs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Pass type selection — only superadmin can choose Identity
  const [passType, setPassType] = useState<PassType>('bagage');

  // Agency form — Hajj only
  const [agencyForm, setAgencyForm] = useState({
    agencyId: '',
    travelerCount: 1,
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate QR count for display
  // Bagage: 2 QR soute per pilgrim | Identity: 1 QR bracelet per pilgrim
  const getQrCount = () => {
    const perPilgrim = passType === 'bagage' ? 2 : 1;
    return agencyForm.travelerCount * perPilgrim;
  };

  // Validate agency form
  const validateAgencyForm = (): boolean => {
    if (!agencyForm.agencyId) {
      setErrorMessage('Veuillez sélectionner une agence');
      return false;
    }
    return true;
  };

  // Export generated QR codes as ZIP
  const handleExportGenerated = async () => {
    if (lastGeneratedRefs.length === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/baggages/generate?limit=2000');
      const data = await response.json();
      const baggages = data.baggages || [];

      const refSet = new Set(lastGeneratedRefs);
      const matchingSetIds = new Set<string>();
      for (const baggage of baggages) {
        if (refSet.has(baggage.reference) && baggage.setId) {
          matchingSetIds.add(baggage.setId);
        }
      }

      if (matchingSetIds.size === 0) {
        alert('Impossible de trouver les sets générés');
        setIsExporting(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      let exportResponse: Response;
      try {
        exportResponse = await fetch('/api/admin/baggages/export-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setIds: Array.from(matchingSetIds) }),
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('Délai d\'attente dépassé. L\'export est trop volumineux.');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!exportResponse.ok) {
        const errorData = await exportResponse.json().catch(() => ({ error: 'Export échoué' }));
        throw new Error(errorData.error || 'Export failed');
      }

      const contentType = exportResponse.headers.get('Content-Type');
      if (contentType && !contentType.includes('zip') && !contentType.includes('octet-stream')) {
        const errorData = await exportResponse.json().catch(() => ({ error: 'Réponse invalide' }));
        throw new Error(errorData.error || 'Le serveur n\'a pas renvoyé un fichier ZIP');
      }

      const contentDisposition = exportResponse.headers.get('Content-Disposition');
      let filename = 'QRPass-export.zip';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) ||
                      contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }

      const blob = await exportResponse.blob();

      if (blob.size === 0) {
        throw new Error('Le fichier ZIP est vide. Aucun QR code n\'a été généré.');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Erreur lors de l\'export ZIP: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateQR = async () => {
    setErrorMessage('');

    if (!validateAgencyForm()) {
      return;
    }

    setQrGenerating(true);

    try {
      const endpoint = passType === 'identity'
        ? '/api/pilgrims/generate'
        : '/api/admin/baggages/generate';

      const payload = passType === 'identity'
        ? {
            count: agencyForm.travelerCount,
          }
        : {
            context: 'agency',
            type: 'hajj' as const,
            passType: 'bagage' as const,
            agencyId: agencyForm.agencyId,
            travelerCount: agencyForm.travelerCount,
            count: 2,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const refs = data.references || data.qrCodes || [];
        setSuccessMessage(`${data.generated || refs.length} codes QR générés avec succès !`);
        setLastGeneratedRefs(refs);
        setTimeout(() => {
          setSuccessMessage('');
          setLastGeneratedRefs([]);
        }, 10000);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setErrorMessage('Erreur lors de la génération des QR codes');
    } finally {
      setQrGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Génération de QR Codes</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Créez des QR codes Pass Bagage ou Pass Identity pour les pèlerins Hajj</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
          {lastGeneratedRefs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={handleExportGenerated}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e7e34] to-[#0d5e34] text-white rounded-lg hover:from-[#228b22] hover:to-[#1e7e34] transition-all text-sm shadow-lg shadow-green-900/20 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Exporter en ZIP ({lastGeneratedRefs.length} QR)
                  </>
                )}
              </button>
              <a
                href="/admin/qrcodes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <QrCode className="w-4 h-4" />
                Voir tous les QR codes
              </a>
            </div>
          )}
        </div>
      )}

      {/* Pass Type Selection */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPassType('bagage')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              passType === 'bagage'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              passType === 'bagage' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <Luggage className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className={`font-semibold text-sm ${passType === 'bagage' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                Pass Bagage
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">2 QR soute par pèlerin</p>
            </div>
          </button>
          <button
            onClick={() => isSuperAdmin && setPassType('identity')}
            disabled={!isSuperAdmin}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              passType === 'identity'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300'
            } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              passType === 'identity' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <UserRound className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className={`font-semibold text-sm ${passType === 'identity' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                Pass Identity
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSuperAdmin ? '1 QR bracelet par pèlerin' : '🔒 Superadmin uniquement'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Superadmin-only notice for Identity */}
      {passType === 'identity' && !isSuperAdmin && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Pass Identity est réservé aux superadministrateurs. Les agences peuvent uniquement générer des Pass Bagage.
        </div>
      )}

      {/* Mode indicator */}
      <div className="mb-6">
        <div className={`flex items-center gap-3 p-4 rounded-xl text-white ${
          passType === 'bagage' ? 'bg-[#1e3a8a]' : 'bg-emerald-600'
        }`}>
          {passType === 'bagage' ? <Luggage className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
          <div>
            <p className="font-medium">
              {passType === 'bagage' ? 'Génération Agence — Pass Bagage Hajj' : 'Génération Agence — Pass Identity Hajj'}
            </p>
            <p className="text-xs opacity-80">
              {passType === 'bagage'
                ? 'Chaque pèlerin reçoit 2 QR codes soute'
                : 'Chaque pèlerin reçoit 1 QR code bracelet d\'identification'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Form Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              {passType === 'bagage' ? (
                <><Luggage className="w-5 h-5 text-amber-600" /> Génération Pass Bagage</>
              ) : (
                <><UserRound className="w-5 h-5 text-blue-600" /> Génération Pass Identity</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agency Form */}
            <>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Agence partenaire *</Label>
                <Select
                  value={agencyForm.agencyId}
                  onValueChange={(v) => setAgencyForm({ ...agencyForm, agencyId: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                    <SelectValue placeholder="Sélectionner une agence" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {agencies.filter(a => a.active).map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Nombre de pèlerins</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={agencyForm.travelerCount}
                  onChange={(e) => setAgencyForm({ ...agencyForm, travelerCount: parseInt(e.target.value) || 1 })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300">
                {passType === 'bagage' ? (
                  <p>🧳 Pour le Hajj, chaque pèlerin reçoit 2 QR codes bagage soute</p>
                ) : (
                  <p>👤 Pour le Hajj, chaque pèlerin reçoit 1 QR code bracelet d&apos;identification (PH-P-XXXXX)</p>
                )}
              </div>
            </>

            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}

            <Button
              className={`w-full text-white rounded-xl ${
                passType === 'bagage' ? 'bg-[#1e3a8a] hover:bg-[#3b82f6]' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              onClick={handleGenerateQR}
              disabled={qrGenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", qrGenerating ? 'animate-spin' : '')} />
              {qrGenerating ? 'Génération en cours...' : `Générer ${getQrCount()} codes QR`}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-600 dark:text-slate-300 text-sm">QR à générer</span>
                <Badge variant="secondary" className="text-lg font-bold">
                  {getQrCount()}
                </Badge>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {getQrCount()} QR • {passType === 'bagage' ? 'Pass Bagage' : 'Pass Identity'} • En attente d&apos;attribution
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Détails</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Type</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {passType === 'bagage' ? 'Pass Bagage (Soute)' : 'Pass Identity (Bracelet)'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Statut</p>
                  <p className="text-slate-800 dark:text-white font-medium">En attente d'activation</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-3">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Agence</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {agencies.find(a => a.id === agencyForm.agencyId)?.name || 'Non sélectionnée'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Durée</p>
                  <p className="text-slate-800 dark:text-white font-medium">2 mois (60 jours)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{getQrCount()}</p>
              <p className="text-sm text-white/80">QR à générer</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{agencies.filter(a => a.active).length}</p>
              <p className="text-sm text-white/80">Agences actives</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#fbbf24] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <p className="text-lg font-bold">Anti-fraude</p>
              <p className="text-sm text-white/80">Codes uniques</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
