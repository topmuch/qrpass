'use client';

import { useState, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  Apple,
  Copy,
  Check,
  QrCode,
  Wifi,
  WifiOff,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════ */

const JAUNE = '#f4b400';
const JAUNE_HOVER = '#d97706';
const BLEU_MARINE = '#1e3a5f';

const QR_SIZE = 256;

/* ══════════════════════════════════════════════════════════
   INSTALL INSTRUCTION CARD
   ══════════════════════════════════════════════════════════ */

interface InstructionStep {
  text: string;
}

function InstallCard({
  icon,
  title,
  steps,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  steps: InstructionStep[];
  accent: string;
}) {
  return (
    <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ backgroundColor: accent + '15', color: accent }}
          >
            {icon}
          </span>
          <span style={{ color: BLEU_MARINE }}>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: accent + '20', color: accent }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-slate-600 leading-relaxed">
                {step.text}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════
   ANDROID STEPS
   ══════════════════════════════════════════════════════════ */

const ANDROID_STEPS: InstructionStep[] = [
  { text: 'Ouvrez le lien dans Chrome sur votre téléphone' },
  { text: 'Appuyez sur le menu ⋮ (3 points en haut à droite)' },
  { text: 'Sélectionnez « Ajouter à l\'écran d\'accueil »' },
  { text: 'Confirmez en appuyant sur « Ajouter »' },
  { text: 'L\'app PassHajj Manager apparaît sur votre écran d\'accueil' },
];

/* ══════════════════════════════════════════════════════════
   iOS STEPS
   ══════════════════════════════════════════════════════════ */

const IOS_STEPS: InstructionStep[] = [
  { text: 'Ouvrez le lien dans Safari sur votre iPhone/iPad' },
  { text: 'Appuyez sur le bouton Partager ⬆︎ (en bas de l\'écran)' },
  { text: 'Faites défiler et sélectionnez « Sur l\'écran d\'accueil »' },
  { text: 'Nommez l\'app « PassHajj Manager » puis appuyez sur « Ajouter »' },
  { text: 'L\'app apparaît sur votre écran d\'accueil avec l\'icône PassHajj' },
];

/* ══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function PWAPage() {
  const [copied, setCopied] = useState(false);

  /** PWA URL — fixed production URL for QR code */
  const pwaUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_PWA_URL;
      if (envUrl) return envUrl;
      return 'https://passhajj.qrbags.com/manager';
    }
    return 'https://passhajj.qrbags.com/manager';
  }, []);

  /* ── Copy PWA link to clipboard ── */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pwaUrl);
      setCopied(true);
      toast.success('Lien copié dans le presse-papiers !');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pwaUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('Lien copié dans le presse-papiers !');
        setTimeout(() => setCopied(false), 2500);
      } catch {
        toast.error('Impossible de copier le lien');
      }
      document.body.removeChild(textArea);
    }
  }, [pwaUrl]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Page Title ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <QrCode className="w-6 h-6" style={{ color: JAUNE }} />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: BLEU_MARINE }}
          >
            Installer l&apos;Application PassHajj Manager
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Scannez ce QR code avec votre téléphone pour accéder à
          l&apos;application de gestion terrain{' '}
          <span className="font-medium text-slate-700">
            (fonctionne hors-ligne)
          </span>
          .
        </p>
      </motion.div>

      {/* ── QR Code Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-white rounded-xl shadow-md p-6 sm:p-8 max-w-md mx-auto">
          <CardContent className="p-0 flex flex-col items-center gap-6">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg inline-block shadow-sm border border-slate-100">
              <QRCodeSVG
                value={pwaUrl}
                size={QR_SIZE}
                level="M"
                bgColor="#ffffff"
                fgColor={BLEU_MARINE}
                includeMargin={false}
              />
            </div>

            {/* Offline badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Fonctionne sans connexion internet</span>
            </div>

            {/* Copy link button */}
            <Button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl h-12 transition-all duration-200"
              style={{
                backgroundColor: copied ? '#16a34a' : JAUNE,
              }}
              onMouseEnter={(e) => {
                if (!copied)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    JAUNE_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!copied)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    JAUNE;
              }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Lien copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le lien direct
                </>
              )}
            </Button>

            {/* URL display */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 break-all">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono select-all">{pwaUrl}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Install Instructions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2
          className="text-lg font-semibold mb-4 text-center"
          style={{ color: BLEU_MARINE }}
        >
          Instructions d&apos;installation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Android */}
          <InstallCard
            icon={<Smartphone className="w-5 h-5" />}
            title="Android"
            steps={ANDROID_STEPS}
            accent="#34a853"
          />

          {/* iOS */}
          <InstallCard
            icon={<Apple className="w-5 h-5" />}
            title="iOS (iPhone / iPad)"
            steps={IOS_STEPS}
            accent="#1d1d1f"
          />
        </div>
      </motion.div>

      {/* ── Additional Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-slate-50 border-0 shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ backgroundColor: JAUNE + '20', color: JAUNE }}
              >
                <Wifi className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  className="font-semibold text-sm"
                  style={{ color: BLEU_MARINE }}
                >
                  Mode hors-ligne activé
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Une fois installée, l&apos;application fonctionne entièrement
                  hors-ligne. Les scans et incidents sont enregistrés localement
                  et synchronisés automatiquement dès que la connexion est
                  rétablie. Aucune perte de données.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
