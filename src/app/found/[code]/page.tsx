'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Luggage, UserCircle, AlertCircle, Loader2, Globe, ChevronRight, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Image from 'next/image';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

// ─── Brand constants (PassHajj palette: yellow #f4b400 + white cards + black buttons) ───
const BRAND = '#f4b400';
const CARD_BG = '#ffffff';
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const INPUT_BG = '#f3f4f6';
const BTN_PRIMARY = '#111827';

interface LookupResult {
  found: boolean;
  types: ('baggage' | 'pilgrim')[];
  baggage: boolean;
  baggageStatus: string | null;
  pilgrim: boolean;
  pilgrimActive: boolean;
  pilgrimCode: string | null;
}

type PageState = 'loading' | 'selector' | 'not_found' | 'error';

// ─── Language Selector Component ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-black/10 rounded-full text-sm font-medium hover:bg-white transition-colors min-h-[36px]"
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                lang === l
                  ? 'bg-[#f4b400] text-black'
                  : 'text-black hover:bg-[#f4b400]/30'
              }`}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoundSelectorPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const { t, lang, setLang, dir } = useTranslation();
  const [state, setState] = useState<PageState>('loading');
  const [lookupData, setLookupData] = useState<LookupResult | null>(null);

  // Lookup the code
  useEffect(() => {
    if (!code) return;

    const lookup = async () => {
      try {
        const res = await fetch(`/api/pilgrims/lookup/${code}`);
        if (!res.ok) {
          setState('error');
          return;
        }

        const data: LookupResult = await res.json();
        setLookupData(data);

        if (!data.found) {
          setState('not_found');
          return;
        }

        // Smart routing: skip selector when only one type is available
        const hasBaggage = data.baggage;
        const hasActivePilgrim = data.pilgrim && data.pilgrimActive && data.pilgrimCode;

        if (hasBaggage && !hasActivePilgrim) {
          // Only baggage found (no activated pilgrim) → go directly to scan/finder page
          router.replace('/scan/' + code);
          return;
        }

        if (!hasBaggage && hasActivePilgrim) {
          // Only activated pilgrim found (no baggage) → go directly to pilgrim profile page
          router.replace('/p/' + data.pilgrimCode);
          return;
        }

        // Both types available (baggage + activated pilgrim) → show selector so user can choose
        setState('selector');
      } catch {
        setState('error');
      }
    };

    lookup();
  }, [code]);

  return (
    <div dir={dir} className="min-h-screen flex flex-col" style={{ background: BRAND }}>
      {/* ─── Header ─── */}
      <div className="w-full flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center">
          <Image src="/logo.png" alt="PassHajj" width={120} height={46} style={{ objectFit: 'contain' }} />
        </div>
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait">
          {/* ─── Loading State ─── */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full" />
              <p className="text-lg font-medium text-black">PassHajj…</p>
            </motion.div>
          )}

          {/* ─── Not Found State ─── */}
          {state === 'not_found' && (
            <motion.div
              key="not_found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-[420px] flex flex-col items-center"
            >
              <div
                className="w-full rounded-[20px] p-6 md:p-8 text-center shadow-lg"
                style={{ background: CARD_BG }}
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>
                  Code non reconnu
                </h2>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Ce code QR n&apos;est pas valide ou n&apos;existe pas dans notre système.
                </p>
                <button
                  className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-base transition-all hover:-translate-y-0.5 active:scale-[0.98] min-h-[56px]"
                  style={{ background: BTN_PRIMARY }}
                  onClick={() => router.push('/')}
                >
                  Retour à l&apos;accueil
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Error State ─── */}
          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-[420px] flex flex-col items-center"
            >
              <div
                className="w-full rounded-[20px] p-6 md:p-8 text-center shadow-lg"
                style={{ background: CARD_BG }}
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: INK }}>Erreur</h2>
                <p className="text-sm mb-6" style={{ color: MUTED }}>
                  Une erreur est survenue. Veuillez réessayer.
                </p>
                <button
                  className="w-full py-4 px-6 text-white rounded-[14px] font-bold text-base transition-all hover:-translate-y-0.5 active:scale-[0.98] min-h-[56px]"
                  style={{ background: BTN_PRIMARY }}
                  onClick={() => router.push('/')}
                >
                  Retour à l&apos;accueil
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Selector State ─── */}
          {state === 'selector' && (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-[420px] flex flex-col items-center gap-5"
            >
              {/* Header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fef3c7] flex items-center justify-center"
                >
                  <span className="text-3xl">🕋</span>
                </motion.div>
                <h1 className="text-2xl font-bold" style={{ color: INK }}>
                  Choisissez le type de pass
                </h1>
                <p className="text-sm mt-1" style={{ color: MUTED }}>
                  Sélectionnez le service que vous souhaitez consulter
                </p>
              </div>

              {/* Code display */}
              <div className="rounded-xl px-4 py-2.5" style={{ background: INPUT_BG }}>
                <p className="text-sm font-mono font-semibold" style={{ color: INK }}>{code}</p>
              </div>

              {/* Two large selector cards */}
              <div className="w-full flex flex-col gap-4">
                {/* Pass Bagage Card */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
                >
                  <div
                    className="rounded-[20px] p-5 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
                    style={{ background: CARD_BG }}
                    onClick={() => router.push('/scan/' + code)}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: BTN_PRIMARY }}
                      >
                        <Luggage className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold" style={{ color: INK }}>
                          Pass Bagage
                        </h3>
                        <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                          Protéger et retrouver vos bagages
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 shrink-0" style={{ color: MUTED }} />
                    </div>
                  </div>
                </motion.div>

                {/* Pass Identity Card */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 180 }}
                >
                  <div
                    className={`rounded-[20px] p-5 shadow-lg transition-all duration-200 ${
                      lookupData?.pilgrimActive
                        ? 'cursor-pointer hover:shadow-xl active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ background: CARD_BG }}
                    onClick={() => {
                      if (lookupData?.pilgrimActive && lookupData?.pilgrimCode) {
                        router.push('/p/' + lookupData.pilgrimCode);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: lookupData?.pilgrimActive ? '#059669' : '#9ca3af' }}
                      >
                        <UserCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold" style={{ color: INK }}>
                          Pass Identity
                        </h3>
                        <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                          {lookupData?.pilgrimActive
                            ? 'Identité et informations médicales'
                            : 'Non activé pour ce code'}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {lookupData?.pilgrimActive ? (
                          <ChevronRight className="w-5 h-5" style={{ color: MUTED }} />
                        ) : (
                          <span className="text-xs font-medium px-2 py-1 rounded" style={{ color: MUTED, background: INPUT_BG }}>Bientôt</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Trust note */}
              <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
                <Shield className="w-4 h-4" />
                <span>PassHajj · Protection intelligente Hajj & Omrah</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center text-xs pb-4" style={{ color: 'rgba(0,0,0,0.6)' }}>
        Propulsé par <strong>PassHajj</strong> ·{' '}
        <a href="/support" className="text-black font-semibold underline">Aide</a>
      </div>
    </div>
  );
}
