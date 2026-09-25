'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  MapPin,
  Smartphone,
  RefreshCw,
  Clock,
  ShieldCheck,
  ScanLine,
  BellRing,
  ArrowRight,
  BatteryCharging,
  WifiOff,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TOKEN HORAIRE — le QR change chaque heure (reset 1h)
   ══════════════════════════════════════════════════════════ */
function buildHourToken(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  return `DEMO-${y}${m}${d}-${h}`;
}

function msUntilNextHour(date: Date): number {
  const next = new Date(date);
  next.setHours(date.getHours() + 1, 0, 0, 0);
  return next.getTime() - date.getTime();
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/* ─── Étapes de la démo ─── */
const DEMO_STEPS = [
  {
    icon: ScanLine,
    title: '1. Scannez le QR code',
    text: 'Pointez l\'appareil photo de votre téléphone sur le QR code affiché ci-dessus. Aucune application à installer.',
    color: '#2563EB',
  },
  {
    icon: MapPin,
    title: '2. Le bagage est identifié',
    text: 'La page du bagage s\'ouvre instantanément : propriétaire, vol, itinéraire et statut « bagage retrouvé ».',
    color: '#F59E0B',
  },
  {
    icon: BellRing,
    title: '3. Le propriétaire est alerté',
    text: 'Une alerte WhatsApp avec la géolocalisation est envoyée au propriétaire. La boucle est bouclée.',
    color: '#10B981',
  },
];

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  // Horloge : tick chaque seconde (compte à rebours + reset horaire auto)
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const token = useMemo(() => (now ? buildHourToken(now) : null), [now]);
  const countdown = now ? formatCountdown(msUntilNextHour(now)) : '--:--';
  const validUntil = useMemo(() => {
    if (!now) return null;
    const end = new Date(now);
    end.setMinutes(59, 59, 999);
    return end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, [now]);

  const demoUrl = useMemo(() => {
    if (!token || typeof window === 'undefined') return '';
    return `${window.location.origin}/demo/scan?t=${token}`;
  }, [token]);

  return (
    <PublicLayout>
      {/* ─── Hero Démo ─── */}
      <section className="relative overflow-hidden py-14 sm:py-20" style={{ background: 'linear-gradient(135deg, #0c1d3a 0%, #1e3a5f 55%, #254a75 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Démo live — active en ce moment
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Essayez PassHajj <span style={{ color: '#FCD34D' }}>en conditions réelles</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto">
            Scannez ce QR code avec votre téléphone comme le ferait une personne qui retrouve votre bagage.
            La démo se réinitialise <strong className="text-white">automatiquement chaque heure</strong> avec un nouveau code.
          </p>
        </div>
      </section>

      {/* ─── QR + instructions ─── */}
      <section className="py-14 sm:py-20" style={{ backgroundColor: '#F4F8FB' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Carte QR */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'linear-gradient(90deg, #F59E0B, #FCD34D, #F59E0B)' }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>Bagage démo n° HAJJ26-DEMO</h2>
              <p className="text-sm text-slate-500 mb-6">Scannez avec l&apos;appareil photo ou Google Lens</p>

              <div className="inline-block rounded-2xl border-4 p-5 mb-6" style={{ borderColor: '#0c1d3a', backgroundColor: '#fff' }}>
                {mounted && token ? (
                  <QRCodeSVG
                    value={demoUrl}
                    size={220}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#0c1d3a"
                  />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-slate-50 rounded-xl">
                    <QrCode className="w-16 h-16 text-slate-300 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Compte à rebours de réinitialisation */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563EB' }}>
                <RefreshCw className="w-4 h-4" />
                Nouveau QR dans&nbsp;<span className="tabular-nums font-bold">{countdown}</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Session démo valable jusqu&apos;à {validUntil ?? '—'} (reset toutes les 1h)
              </p>

              <Link
                href={`/demo/scan?t=${token ?? ''}`}
                className="mt-6 inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-[10px] px-6 h-12 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                style={{ backgroundColor: '#0c1d3a' }}
              >
                <Smartphone className="w-4 h-4" />
                Ouvrir la démo sur cet appareil
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Étapes */}
            <div className="space-y-5">
              {DEMO_STEPS.map((step) => (
                <div key={step.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.color}14` }}>
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1" style={{ color: '#0f172a' }}>{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl p-6 border border-dashed" style={{ borderColor: '#c7d6e8', backgroundColor: 'rgba(37,99,235,0.03)' }}>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong style={{ color: '#0f172a' }}>Sans application, sans batterie, sans GPS :</strong>{' '}
                  le QR code imprimé sur l&apos;étiquette du bagage suffit. Celui de la démo expire chaque heure
                  — exactement comme un QR réellement éphémère de PassHajj.
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><BatteryCharging className="w-4 h-4 text-emerald-500" /> Zéro batterie</span>
                  <span className="inline-flex items-center gap-1.5"><WifiOff className="w-4 h-4 text-emerald-500" /> Fonctionne hors ligne</span>
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Données chiffrées</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-14 px-4" style={{ backgroundColor: '#0c1d3a' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Convaincu ? Protégez vos bagages dès aujourd&apos;hui
          </h2>
          <p className="text-white/60 mb-8">
            Commandez vos QR codes PassHajj ou proposez la solution à vos pèlerins.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/hajj-omra"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] px-6 h-12 text-sm font-semibold shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: '#F59E0B', color: '#0c1d3a' }}
            >
              Hajj &amp; Omra
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/devenir-partenaire"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] px-6 h-12 text-sm font-semibold bg-transparent! border-white/40! text-white! hover:bg-white/10! hover:text-white! transition-all"
            >
              Devenir partenaire
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
