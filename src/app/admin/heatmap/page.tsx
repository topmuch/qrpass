'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  TrendingDown,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Train,
  Ship,
  Bus,
  RefreshCw,
  BarChart3,
  Globe,
} from 'lucide-react';
import type { HeatmapPoint } from '@/components/admin/LossHeatmap';

// Dynamic import for Leaflet (no SSR)
const LossHeatmap = dynamic(
  () => import('@/components/admin/LossHeatmap'),
  { ssr: false, loading: () => (
    <div className="w-full h-[500px] bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        <span>Chargement de la carte...</span>
      </div>
    </div>
  )}
);

// ─── Types ───
interface HeatmapData {
  points: HeatmapPoint[];
  topCities: { city: string; count: number; lostCount: number; country: string | null }[];
  stats: {
    totalLost: number;
    totalFound: number;
    totalActive: number;
    recoveryRate: number;
  };
  lostByTransport: { mode: string; count: number }[];
  timeline: { date: string; count: number }[];
}

const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  train: <Train className="w-4 h-4" />,
  boat: <Ship className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
};

const TRANSPORT_LABELS: Record<string, string> = {
  flight: 'Avion',
  train: 'Train',
  boat: 'Bateau',
  bus: 'Bus',
};

export default function HeatmapPage() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/heatmap?XTransformPort=3000');
      if (!res.ok) throw new Error('Erreur chargement données');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Loading State ───
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f4b400]/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#f4b400]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Heatmap des Pertes</h1>
        </div>
        <div className="w-full h-[500px] bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#f4b400] rounded-full animate-spin" />
            <span>Chargement des données de perte...</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Heatmap des Pertes</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium">
            <RefreshCw className="w-4 h-4 inline mr-2" />Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { points, topCities, stats, lostByTransport, timeline } = data;
  const hasData = points.length > 0;

  // Max for timeline chart
  const maxTimeline = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f4b400]/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-[#f4b400]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Heatmap des Pertes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Zones à risque &middot; Insights pour les agences</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#f4b400] text-black rounded-xl hover:bg-[#f4b400]/90 transition-colors text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          label="Total pertes"
          value={stats.totalLost}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="Total retrouvés"
          value={stats.totalFound}
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          label="Bagages actifs"
          value={stats.totalActive}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-[#f4b400]/20"
          iconColor="text-[#f4b400]"
          label="Taux récupération"
          value={`${stats.recoveryRate}%`}
        />
      </div>

      {/* ─── Map + Sidebar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#f4b400]" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Carte de densité</span>
            </div>
            <span className="text-xs text-slate-400">{points.length} zones</span>
          </div>
          <div className="h-[500px]">
            <LossHeatmap points={points} />
          </div>
        </div>

        {/* Sidebar: Top Cities + Transport */}
        <div className="space-y-6">
          {/* Top Cities */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[#f4b400]" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top villes à risque</h3>
            </div>
            {topCities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {topCities.map((city, idx) => (
                  <div key={city.city} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      idx === 1 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                      idx === 2 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{city.city}</div>
                      <div className="text-xs text-slate-400">{city.country || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">{city.lostCount}</div>
                      <div className="text-[10px] text-slate-400">pertes</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transport Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#f4b400]" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pertes par transport</h3>
            </div>
            {lostByTransport.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {lostByTransport.map((item) => {
                  const total = lostByTransport.reduce((s, i) => s + i.count, 0);
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={item.mode} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          {TRANSPORT_ICONS[item.mode] || <Package className="w-4 h-4" />}
                          {TRANSPORT_LABELS[item.mode] || item.mode}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#f4b400] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Timeline ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-[#f4b400]" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pertes sur 30 jours</h3>
          <span className="text-xs text-slate-400 ml-auto">{timeline.length} jours avec activité</span>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Aucune perte enregistrée sur les 30 derniers jours</p>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {timeline.map((day) => {
              const height = Math.max(4, (day.count / maxTimeline) * 100);
              return (
                <div
                  key={day.date}
                  className="flex-1 min-w-[8px] group relative"
                  title={`${day.date}: ${day.count} pertes`}
                >
                  <div
                    className="w-full bg-[#f4b400] rounded-t-sm hover:bg-red-500 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {day.date.slice(5)}: {day.count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Empty State ─── */}
      {!hasData && (
        <div className="bg-[#f4b400]/5 border border-[#f4b400]/20 rounded-2xl p-8 text-center">
          <MapPin className="w-12 h-12 text-[#f4b400] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Aucune donnée GPS de perte</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            La heatmap se remplira automatiquement quand des bagages seront signalés perdus avec une position GPS.
            Les scans effectués via la page de suivi enregistrent les coordonnées.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card Sub-component ───
function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}
