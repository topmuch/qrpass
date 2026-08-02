'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Luggage, UserCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Brand constants ───
const BRAND_BAGGAGE = '#0047d6'; // blue for baggage
const BRAND_IDENTITY = '#059669'; // green for identity

interface LookupResult {
  found: boolean;
  types: ('baggage' | 'pilgrim')[];
  baggage: boolean;
  pilgrim: boolean;
  pilgrimCode: string | null; // The actual pilgrim qrCode to use for Pass Identity link
}

type PageState = 'loading' | 'selector' | 'not_found' | 'error';

export default function FoundSelectorPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const { t, dir } = useTranslation();
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

        // Always show selector — user chooses between Pass Bagage and Pass Identity
        setState('selector');
      } catch {
        setState('error');
      }
    };

    lookup();
  }, [code]);

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
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
            <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
            <p className="text-gray-500 text-sm">QRPass…</p>
          </motion.div>
        )}

        {/* ─── Not Found State ─── */}
        {state === 'not_found' && (
          <motion.div
            key="not_found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Code non reconnu
            </h2>
            <p className="text-gray-500 text-sm">
              Ce code QR n&apos;est pas valide ou n&apos;existe pas dans notre système.
            </p>
          </motion.div>
        )}

        {/* ─── Error State ─── */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Erreur</h2>
            <p className="text-gray-500 text-sm">
              Une erreur est survenue. Veuillez réessayer.
            </p>
          </motion.div>
        )}

        {/* ─── Selector State ─── */}
        {state === 'selector' && (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md flex flex-col items-center gap-6"
          >
            {/* Header */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg"
              >
                <span className="text-3xl">🕋</span>
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900">
                QRPass
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Choisissez le type de pass
              </p>
            </div>

            {/* Code display */}
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-sm font-mono text-gray-600">{code}</p>
            </div>

            {/* Two large selector cards */}
            <div className="w-full flex flex-col gap-4">
              {/* Pass Bagage Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
              >
                <Card
                  className="cursor-pointer border-2 border-transparent hover:border-blue-400 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                  onClick={() => router.push('/scan/' + code)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: BRAND_BAGGAGE }}
                      >
                        <Luggage className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold text-gray-900">
                          Pass Bagage
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Protéger et retrouver vos bagages
                        </p>
                      </div>
                      <div className="shrink-0">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pass Identity Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 180 }}
              >
                <Card
                  className={`border-2 border-transparent transition-all duration-200 shadow-md hover:shadow-lg ${
                    lookupData?.pilgrim
                      ? 'cursor-pointer hover:border-emerald-400 active:scale-[0.98]'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (lookupData?.pilgrim && lookupData?.pilgrimCode) {
                      router.push('/p/' + lookupData.pilgrimCode);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: BRAND_IDENTITY }}
                      >
                        <UserCircle className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold text-gray-900">
                          Pass Identity
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {lookupData?.pilgrim
                            ? 'Identité et informations médicales'
                            : 'Non activé pour ce code'}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {lookupData?.pilgrim ? (
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Bientôt</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Footer hint */}
            <p className="text-xs text-gray-400 text-center">
              QRPass — Protection intelligente Hajj & Omrah
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
