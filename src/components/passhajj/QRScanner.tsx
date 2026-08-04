'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { usePassHajjStore } from '@/lib/passhajj-store';
import { Input } from '@/components/ui/input';
import { Camera, CameraOff, AlertTriangle, CheckCircle2, XCircle, Package, Keyboard, User } from 'lucide-react';
import type { ZoneType } from '@/lib/passhajj-types';

const SCANNER_ID = 'passhajj-qr-reader';

interface ScanFeedback {
  type: 'success' | 'error' | 'duplicate' | 'baggage';
  message: string;
  name?: string;
  qrPrefix?: 'ID' | 'BG';
  visible: boolean;
}

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [feedback, setFeedback] = useState<ScanFeedback>({ type: 'success', message: '', visible: false });
  const [manualCode, setManualCode] = useState('');
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { trip, zone, addScan, showFlashCard, scannedPilgrimIds, scannedBagIds } = usePassHajjStore();

  const playSound = useCallback((type: 'green' | 'blue' | 'red') => {
    try {
      const audio = new Audio(`/sounds/beep-${type}.mp3`);
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const showFeedbackFn = useCallback((fb: Omit<ScanFeedback, 'visible'>) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ ...fb, visible: true });
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }));
    }, 2000);
  }, []);

  const handleScan = useCallback((decodedText: string) => {
    if (!trip) return;

    const now = new Date().toISOString();

    // ─── ID- prefix = Pèlerin (Identity) ───
    if (decodedText.startsWith('ID-')) {
      const pilgrim = trip.pilgrims.find((p) => p.qrCode === decodedText);

      if (!pilgrim) {
        playSound('red');
        showFeedbackFn({ type: 'error', message: 'HORS GROUPE!', name: decodedText, qrPrefix: 'ID' });
        addScan({
          qrCode: decodedText,
          type: 'identity',
          timestamp: now,
          zone: zone as ZoneType,
          status: 'error',
        });
        if (navigator.vibrate) navigator.vibrate(200);
        return;
      }

      const isDuplicate = scannedPilgrimIds.has(decodedText);
      playSound('green');
      showFeedbackFn({
        type: isDuplicate ? 'duplicate' : 'success',
        message: isDuplicate ? 'Déjà scanné' : 'Pèlerin présent',
        name: pilgrim.fullName,
        qrPrefix: 'ID',
      });

      addScan({
        qrCode: decodedText,
        type: 'identity',
        timestamp: now,
        zone: zone as ZoneType,
        status: 'success',
        pilgrimName: pilgrim.fullName,
      });

      // Show medical flash card for identity scans
      showFlashCard({
        fullName: pilgrim.fullName,
        bloodType: pilgrim.bloodType,
        allergies: pilgrim.allergies,
      });

    // ─── BG- prefix = Bagage ───
    } else if (decodedText.startsWith('BG-')) {
      const bag = trip.bags.find((b) => b.qrCode === decodedText);

      if (!bag) {
        playSound('red');
        showFeedbackFn({ type: 'error', message: 'HORS GROUPE!', name: decodedText, qrPrefix: 'BG' });
        addScan({
          qrCode: decodedText,
          type: 'baggage',
          timestamp: now,
          zone: zone as ZoneType,
          status: 'error',
        });
        if (navigator.vibrate) navigator.vibrate(200);
        return;
      }

      const isDuplicate = scannedBagIds.has(decodedText);
      playSound('blue');
      showFeedbackFn({
        type: isDuplicate ? 'duplicate' : 'baggage',
        message: isDuplicate ? 'Déjà scanné' : 'Bagage scanné',
        name: bag.ownerName,
        qrPrefix: 'BG',
      });

      addScan({
        qrCode: decodedText,
        type: 'baggage',
        timestamp: now,
        zone: zone as ZoneType,
        status: 'success',
        pilgrimName: bag.ownerName,
      });

    // ─── Unknown QR format ───
    } else {
      playSound('red');
      showFeedbackFn({ type: 'error', message: 'QR non reconnu', name: decodedText });
      if (navigator.vibrate) navigator.vibrate(100);
    }
  }, [trip, zone, addScan, playSound, showFeedbackFn, showFlashCard, scannedPilgrimIds, scannedBagIds]);

  const startScanner = useCallback(async () => {
    if (scanning) return;
    setScannerError('');

    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );

      setScanning(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur caméra';
      setScannerError(msg);
      console.error('[Scanner] Start error:', err);
    }
  }, [scanning, handleScan]);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current || !scanning) return;

    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      scannerRef.current = null;
      setScanning(false);
    } catch {
      // ignore
    }
  }, [scanning]);

  const handleManualScan = useCallback(() => {
    const code = manualCode.trim();
    if (!code) return;
    handleScan(code);
    setManualCode('');
  }, [manualCode, handleScan]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const feedbackColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    duplicate: 'bg-amber-500',
    baggage: 'bg-blue-500',
  };

  const feedbackIcons = {
    success: <CheckCircle2 className="w-6 h-6 text-white" />,
    error: <XCircle className="w-6 h-6 text-white" />,
    duplicate: <AlertTriangle className="w-6 h-6 text-white" />,
    baggage: <Package className="w-6 h-6 text-white" />,
  };

  // QR prefix icon
  const prefixIcon = feedback.qrPrefix === 'ID'
    ? <User className="w-6 h-6 text-white" />
    : feedback.qrPrefix === 'BG'
      ? <Package className="w-6 h-6 text-white" />
      : null;

  return (
    <div className="relative">
      {/* Scanner viewport */}
      <div
        id={SCANNER_ID}
        className="w-full rounded-xl overflow-hidden bg-gray-900"
        style={{ minHeight: scanning ? 280 : 0 }}
      />

      {/* Scanner controls */}
      <div className="mt-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full h-14 rounded-xl bg-gray-900 text-white text-lg font-bold flex items-center justify-center gap-2 active:bg-gray-800 transition-colors shadow-md"
          >
            <Camera className="w-6 h-6" />
            Démarrer le Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full h-12 rounded-xl bg-gray-700 text-white text-base font-semibold flex items-center justify-center gap-2 active:bg-gray-600 transition-colors"
          >
            <CameraOff className="w-5 h-5" />
            Arrêter
          </button>
        )}
      </div>

      {/* Manual input fallback */}
      <div className="mt-3 space-y-2">
        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <Keyboard className="w-3 h-3" />
          Saisie manuelle (si pas de caméra)
        </p>
        <div className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualScan();
            }}
            placeholder="ID-1234001 ou BG-12340011"
            className="h-12 rounded-xl text-base font-mono"
          />
          <button
            onClick={handleManualScan}
            disabled={!manualCode.trim()}
            className="h-12 px-4 rounded-xl bg-[#f4b400] text-white font-bold disabled:opacity-40 active:bg-[#daa000] transition-colors"
          >
            Scan
          </button>
        </div>
        {/* Quick test buttons */}
        {trip && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-gray-400">Test rapide:</span>
            {trip.pilgrims.slice(0, 3).map((p) => (
              <button
                key={p.qrCode}
                onClick={() => handleScan(p.qrCode)}
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-mono"
              >
                <User className="w-3 h-3 inline mr-0.5" />
                {p.qrCode}
              </button>
            ))}
            {trip.bags.slice(0, 2).map((b) => (
              <button
                key={b.qrCode}
                onClick={() => handleScan(b.qrCode)}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-mono"
              >
                <Package className="w-3 h-3 inline mr-0.5" />
                {b.qrCode}
              </button>
            ))}
            <button
              onClick={() => handleScan('ID-XXXX999')}
              className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-mono"
            >
              ID-XXXX999 (Hors)
            </button>
          </div>
        )}
      </div>

      {/* Scanner error */}
      {scannerError && (
        <div className="mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Caméra indisponible. Utilisez la saisie manuelle ci-dessous.</span>
        </div>
      )}

      {/* Scan feedback overlay */}
      {feedback.visible && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl ${feedbackColors[feedback.type]} transition-all duration-300`}
          style={{ zIndex: 50 }}
        >
          <div className="text-center text-white">
            {prefixIcon || feedbackIcons[feedback.type]}
            <p className="text-xl font-bold mt-2">{feedback.message}</p>
            {feedback.name && (
              <p className="text-lg font-medium mt-1 opacity-90">{feedback.name}</p>
            )}
            {feedback.qrPrefix && (
              <p className="text-sm mt-1 opacity-75">
                {feedback.qrPrefix === 'ID' ? '🪪 Pèlerin' : '🧳 Bagage'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
