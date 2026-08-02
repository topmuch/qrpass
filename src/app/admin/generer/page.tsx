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
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export default function GenererQRPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastGeneratedRefs, setLastGeneratedRefs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

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

  // Calculate QR count for display (Hajj: 3 bags per pilgrim)
  const getQrCount = () => {
    return agencyForm.travelerCount * 3;
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
      const payload = {
        context: 'agency',
        type: 'hajj' as const,
        agencyId: agencyForm.agencyId,
        travelerCount: agencyForm.travelerCount,
        count: 3,
      };

      const response = await fetch('/api/admin/baggages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`${data.generated} codes QR générés avec succès !`);
        setLastGeneratedRefs(data.references || []);
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
        <p className="text-slate-500 dark:text-slate-400 mt-1">Créez des QR codes Pass Bagage pour les pèlerins Hajj & Omrah</p>
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

      {/* Mode indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-600 text-white">
          <Building2 className="w-5 h-5" />
          <div>
            <p className="font-medium">Génération Agence — Pass Bagage Hajj</p>
            <p className="text-xs opacity-80">Chaque pèlerin reçoit 3 QR codes (1 cabine + 2 soutes)</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Form Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Génération agence Hajj
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
                <p>🕌 Pour le Hajj, chaque pèlerin reçoit automatiquement 3 bagages (1 cabine + 2 soutes)</p>
              </div>
            </>

            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
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
                {agencyForm.travelerCount * 3} QR • En attente d'attribution
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Détails</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Type</p>
                  <p className="text-slate-800 dark:text-white font-medium">Hajj (Pèlerinage)</p>
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
                  <p className="text-slate-500 dark:text-slate-400">Expiration</p>
                  <p className="text-slate-800 dark:text-white font-medium">60 jours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{getQrCount()}</p>
              <p className="text-sm text-white/80">QR à générer</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{agencies.filter(a => a.active).length}</p>
              <p className="text-sm text-white/80">Agences actives</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-amber-600 rounded-2xl p-5 text-white">
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
