'use client';

import { useState, useCallback } from 'react';
import { usePassHajjStore } from '@/lib/passhajj-store';
import { verifyOTP } from '@/services/api';
import { loadTripData, saveOfflineCredentials } from '@/services/storage';
import { transformVerifyResponse } from '@/lib/passhajj-types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WifiOff, Wifi, Loader2, LogIn, AlertCircle, Plane, Bus, Ship, Train } from 'lucide-react';
import type { TripData } from '@/lib/passhajj-types';

const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
  boat: <Ship className="w-4 h-4" />,
  train: <Train className="w-4 h-4" />,
};

export default function LoginScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const { setTrip, setView, syncStatus, trip } = usePassHajjStore();

  const isOnline = syncStatus !== 'offline';

  const handleVerify = useCallback(async () => {
    if (otp.length !== 4) {
      setError('Entrez 4 chiffres');
      return;
    }
    setLoading(true);
    setError('');
    setOfflineMode(false);

    try {
      // Call the real backend API via gateway
      const response = await verifyOTP(otp);

      if (response.success && response.data) {
        // Transform API response to local TripData format
        const tripData: TripData = transformVerifyResponse(response);

        // Save to Zustand store (which also persists to localforage)
        setTrip(tripData);

        // Save offline credentials for re-auth when offline
        await saveOfflineCredentials({
          otp,
          tripId: response.data.tripId,
          lastVerified: new Date().toISOString(),
        });

        // Navigate to dashboard
        setView('dashboard');
      } else {
        setError(response.error || 'Code OTP invalide ou expiré');
      }
    } catch (err: unknown) {
      // Network error — try offline fallback
      console.warn('[LoginScreen] Network error, trying offline fallback:', err);

      // Try loading cached trip data from localforage
      const cachedTrip = await loadTripData();
      if (cachedTrip) {
        setOfflineMode(true);
        setError('Pas de connexion. Données locales chargées.');
        setTrip(cachedTrip);
        setView('dashboard');
      } else {
        setError('Pas de connexion et aucune donnée locale. Connectez-vous d\'abord en ligne.');
      }
    } finally {
      setLoading(false);
    }
  }, [otp, trip, setTrip, setView]);

  const handleOfflineAccess = useCallback(async () => {
    const cachedTrip = await loadTripData();
    if (cachedTrip) {
      setTrip(cachedTrip);
      setView('dashboard');
    }
  }, [setTrip, setView]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#f4b400] to-[#d49b00]">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-3xl flex items-center justify-center shadow-xl">
          <span className="text-5xl">🕋</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">PassHajj</h1>
        <p className="text-white/80 text-lg font-light">Manager</p>
      </div>

      {/* Connection indicator */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-white/90" />
            <span className="text-white/90">En ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-white/70" />
            <span className="text-white/70">Hors ligne</span>
          </>
        )}
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-sm rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold text-gray-900">
            Connexion Chef de Groupe
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Entrez le code OTP fourni par votre agence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setError('');
              }}
              maxLength={4}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Error message */}
          {error && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
              offlineMode
                ? 'text-amber-700 bg-amber-50'
                : 'text-red-600 bg-red-50'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verify button */}
          <Button
            onClick={handleVerify}
            disabled={loading || otp.length !== 4}
            className="w-full h-14 text-lg font-bold rounded-xl bg-[#f4b400] hover:bg-[#daa000] text-white shadow-md transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Vérifier
              </>
            )}
          </Button>

          {/* Offline access button */}
          {!isOnline && (
            <Button
              onClick={handleOfflineAccess}
              variant="outline"
              className="w-full h-12 text-base rounded-xl border-gray-300"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Accès hors ligne
            </Button>
          )}

          {/* Transport icons decoration */}
          <div className="flex justify-center gap-3 text-gray-300">
            {Object.values(TRANSPORT_ICONS).map((icon, i) => (
              <div key={i}>{icon}</div>
            ))}
          </div>

          {/* Demo hint */}
          <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100">
            <p className="font-medium mb-1">Codes de démonstration :</p>
            <div className="flex justify-center gap-3">
              {['1234', '5678', '9999'].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setOtp(code);
                    setError('');
                  }}
                  className="px-3 py-1 bg-gray-100 rounded-lg font-mono text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-white/50 text-xs mt-8">
        PassHajj Manager v1.0 — Offline-First PWA
      </p>
    </div>
  );
}
