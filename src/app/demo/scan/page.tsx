'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/public/PublicLayout';
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Plane,
  Luggage,
  User,
  ShieldCheck,
  RefreshCw,
  Send,
  BellRing,
} from 'lucide-react';

/* ─── Lecture / validation du token horaire ─── */
function hourLabelFromToken(token: string | null): { valid: boolean; until: string } {
  const m = /^DEMO-\d{8}-(\d{2})$/.exec(token ?? '');
  if (!m) return { valid: false, until: '—' };
  const h = parseInt(m[1], 10);
  return { valid: true, until: `${String(h).padStart(2, '0')}:59` };
}

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const { valid, until } = useMemo(() => hourLabelFromToken(token), [token]);

  const [notified, setNotified] = useState(false);
  const [scanTime, setScanTime] = useState<string>('');

  useEffect(() => {
    setScanTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const handleNotify = () => {
    setNotified(true);
  };

  return (
    <PublicLayout>
      {/* Bandeau mode démo */}
      <div className="py-3 px-4 text-center text-sm font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#92400E' }}>
        <RefreshCw className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
        Mode démo — session horaire {valid ? `valable jusqu'à ${until}` : 'expirée, regénérez le QR sur /demo'} · Réf. {token ?? 'N/A'}
      </div>

      <section className="py-10 sm:py-14 px-4" style={{ backgroundColor: '#F4F8FB' }}>
        <div className="max-w-2xl mx-auto">
          {/* Carte principale : bagage retrouvé */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header succès */}
            <div className="px-8 pt-8 pb-6 text-center relative" style={{ background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}>
              <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Bagage retrouvé !</h1>
              <p className="text-white/80 text-sm mt-2">
                Ce bagage a été scanné par un trouveur{scanTime ? ` à ${scanTime}` : ''}. Le propriétaire vient d&apos;être localisé.
              </p>
            </div>

            {/* Infos bagage */}
            <div className="px-8 py-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(37,99,235,0.08)' }}>
                  <Luggage className="w-7 h-7" style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: '#0f172a' }}>Valise rigide marine · 23 kg</p>
                  <p className="text-sm text-slate-500">Pass Bagage — Hajj &amp; Omra · Étiquette <span className="font-mono font-semibold">HAJJ26-DEMO</span></p>
                </div>
              </div>

              {/* Vol */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                  <Plane className="w-5 h-5" style={{ color: '#F59E0B' }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Vol associé</p>
                  <p className="font-semibold" style={{ color: '#0f172a' }}>TO 4402 · Djeddah → N&apos;Djaména</p>
                </div>
              </div>

              {/* Lieu de trouvaille */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                  <MapPin className="w-5 h-5" style={{ color: '#10B981' }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Position du bagage</p>
                  <p className="font-semibold" style={{ color: '#0f172a' }}>Terminal arrivées · Aéroport Hassan Djamous, N&apos;Djaména</p>
                </div>
              </div>

              {/* Propriétaire */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(37,99,235,0.08)' }}>
                  <User className="w-5 h-5" style={{ color: '#2563EB' }} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Propriétaire</p>
                  <p className="font-semibold" style={{ color: '#0f172a' }}>Ahmed M. · +235 66 •• •• 05</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-8 pb-6">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Chronologie</p>
                {[
                  { label: 'Bagage déclaré perdu par le propriétaire', time: 'Hier · 18:42', done: true, highlight: false },
                  { label: 'QR code scanné par le trouveur (cette page)', time: scanTime ? `Aujourd'hui · ${scanTime}` : "À l'instant", done: true, highlight: true },
                  { label: 'Alerte WhatsApp envoyée avec géolocalisation', time: notified ? 'Envoyée ✓' : 'En attente de confirmation', done: notified, highlight: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: item.done ? '#10B981' : '#CBD5E1' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${item.highlight ? 'text-emerald-600' : 'text-slate-600'}`}>{item.label}</p>
                      <p className="text-xs text-slate-400">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action trouveur */}
            <div className="px-8 pb-8">
              {!notified ? (
                <button
                  onClick={handleNotify}
                  className="w-full rounded-[10px] h-12 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl inline-flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Notifier le propriétaire sur WhatsApp
                </button>
              ) : (
                <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <BellRing className="w-6 h-6 mx-auto mb-2" style={{ color: '#10B981' }} />
                  <p className="font-bold text-sm" style={{ color: '#065f46' }}>Alerte envoyée au propriétaire ✓</p>
                  <p className="text-xs text-slate-500 mt-1">
                    WhatsApp : « Bonjour Ahmed, votre bagage HAJJ26-DEMO a été retrouvé au Terminal arrivées (NDJ). Position partagée. »
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-400 text-center mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Démo simulée — aucune donnée réelle n&apos;est traitée · Conforme RGPD
              </p>
            </div>
          </div>

          {/* Retour démo */}
          <div className="text-center mt-8">
            <Link href="/demo" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: '#2563EB' }}>
              <Send className="w-4 h-4" />
              Retourner à la page démo
            </Link>
            <span className="block mx-auto mt-2 text-xs text-slate-400">Le QR de la page démo se régénère automatiquement chaque heure</span>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function DemoScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F8FB' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0c1d3a' }} />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
