'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PhoneInput from '@/components/ui/PhoneInput';
import { Camera, User, Globe, ChevronRight, ChevronLeft, Luggage, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

// ─── Brand constants (from user's design) ───
const BG = '#f4b400';
const CARD_BG = '#ffffff';
const TEXT = '#0f172a';
const MUTED = '#64748b';
const INPUT_BG = '#f3f4f6';
const INPUT_BORDER = '#d1d5db';
const BTN_PRIMARY = '#111827';
const BTN_PRIMARY_HOVER = '#374151';
const SUCCESS = '#10b981';
const ACCENT = '#f4b400';
const RADIUS = '16px';

// ─── Language Selector (light, minimal) ───
function LangSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-black/10 rounded-full text-sm font-medium hover:bg-white transition-colors"
      >
        <Globe className="w-4 h-4" />
        {LANGUAGE_NAMES[lang]}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                lang === l ? 'bg-[#f4b400] text-black' : 'text-black hover:bg-[#f4b400]/30'
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

// ─── Main Component ───
function HajjActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || searchParams.get('code') || '';
  const { t, lang, setLang, dir } = useTranslation();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Identity
  const [reference, setReference] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [chefPhone, setChefPhone] = useState('');
  const [chefPhoneCountry, setChefPhoneCountry] = useState('SN');
  const [email, setEmail] = useState('');

  // Step 2: Travel
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Deferred activation
  const [deferredActivation, setDeferredActivation] = useState(false);
  const [activationDate, setActivationDate] = useState('');

  // Pre-fill reference from URL
  useEffect(() => {
    if (qrFromUrl) {
      setReference(qrFromUrl.toUpperCase());
    }
  }, [qrFromUrl]);

  // Detect country from IP for phone input
  useEffect(() => {
    fetch('/api/ip-country')
      .then(res => res.json())
      .then(data => {
        if (data.country) setChefPhoneCountry(data.country);
      })
      .catch(() => {}); // silent fallback to SN
  }, []);

  // Validate step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!reference.trim()) newErrors.reference = true;
    if (!firstName.trim()) newErrors.firstName = true;
    if (!lastName.trim()) newErrors.lastName = true;
    if (!chefPhone.trim()) newErrors.chefPhone = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // Go to step
  const goToStep = (s: 1 | 2) => {
    if (s === 2 && !validateStep1()) return;
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Photo preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submit activation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo first if selected
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('file', photoFile);
          const uploadRes = await fetch('/api/baggage/upload-photo', {
            method: 'POST',
            body: photoFormData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            photoUrl = uploadData.photoUrl;
          }
        } catch (uploadErr) {
          console.error('Photo upload error (non-blocking):', uploadErr);
          // Continue without photo — non-blocking
        }
      }

      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.toUpperCase(),
          travelerFirstName: firstName.trim(),
          travelerLastName: lastName.trim(),
          whatsappOwner: chefPhone.trim(),
          airlineName: airline.trim() || undefined,
          flightNumber: flightNumber.trim().toUpperCase() || undefined,
          destination: destination.trim() || undefined,
          transportMode: 'flight',
          photoUrl: photoUrl || undefined,
          activationDate: deferredActivation && activationDate ? activationDate : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store activation data for confirmation page
        sessionStorage.setItem('activationData', JSON.stringify({
          reference: reference.toUpperCase(),
          firstName,
          lastName,
          whatsapp: chefPhone,
          airlineName: airline,
          flightNumber,
          destination,
          type: 'hajj',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
          photoUrl: photoUrl || data.baggage?.photoUrl || null,
        }));

        // Redirect to confirmation page with URL params
        const params = new URLSearchParams({
          code: reference.toUpperCase(),
          firstName,
          lastName,
          flight: flightNumber || airline,
          destination: destination || '',
          chefPhone,
        });
        if (photoUrl) {
          params.set('photo', photoUrl);
        }
        router.push(`/activate/confirmation?${params.toString()}`);
      } else {
        const error = await response.json();
        toast({ title: error.message || "Erreur lors de l'activation", variant: 'destructive' });
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast({ title: "Erreur de connexion. Veuillez réessayer.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === 1 ? 'ÉTAPE 1 SUR 2 — IDENTITÉ' : 'ÉTAPE 2 SUR 2 — VOYAGE & PHOTO';
  const progressWidth = step === 1 ? '50%' : '100%';

  return (
    <main dir={dir} className="min-h-screen flex flex-col items-center" style={{ background: BG, color: TEXT, padding: '16px' }}>

      {/* ─── Header ─── */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-black">
            <span className="text-white bg-black px-2 py-0.5 rounded-md mr-1">Pass</span>Hajj
          </div>
          <div className="text-sm mt-1" style={{ color: MUTED }}>
            Activez votre bagage en 2 minutes
          </div>
        </div>
        <LangSelector lang={lang} setLang={setLang} />
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="w-full max-w-[420px] mb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-center mb-2" style={{ color: TEXT }}>
          {stepLabel}
        </div>
        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-300 ease-out"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="w-full max-w-[420px]">

        {/* ═══ STEP 1: Identity ═══ */}
        {step === 1 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations du Pèlerin
            </div>

            {/* QR Reference */}
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-1.5 block">Code de référence QR *</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="HAJJ26-H57N2C"
                readOnly={!!qrFromUrl}
                className={`h-12 rounded-xl text-base ${qrFromUrl ? 'bg-gray-200 cursor-not-allowed text-gray-600' : 'bg-[#f8fafc]'} ${errors.reference ? 'border-red-500' : 'border-gray-300'}`}
              />
              {qrFromUrl && (
                <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                  ✅ Code détecté automatiquement depuis l&apos;URL
                </p>
              )}
            </div>

            {/* Name */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-1.5 block">Prénom *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Ahmed"
                  className={`h-12 rounded-xl text-base bg-[#f8fafc] ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-1.5 block">Nom *</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Diop"
                  className={`h-12 rounded-xl text-base bg-[#f8fafc] ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-1.5 block">WhatsApp Chef de Groupe *</Label>
              <PhoneInput
                countryCode={chefPhoneCountry}
                onCountryChange={setChefPhoneCountry}
                value={chefPhone}
                onChange={setChefPhone}
                placeholder="77 123 45 67"
                required
              />
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Ce numéro recevra les alertes si le bagage est trouvé
              </p>
            </div>

            {/* Email */}
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-1.5 block">Email (optionnel)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="h-12 rounded-xl text-base bg-[#f8fafc] border-gray-300"
              />
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-start gap-2">
              <Luggage className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">2 bagages soute seront activés</p>
                <p className="text-xs" style={{ color: MUTED }}>Protection de 2 mois (60 jours) à partir de la date d&apos;activation</p>
              </div>
            </div>

            {/* Deferred Activation */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deferredActivation}
                    onChange={(e) => setDeferredActivation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-black/20 rounded-full peer peer-checked:bg-black after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
                <div>
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>Activation différée</p>
                  <p className="text-xs" style={{ color: MUTED }}>Choisir une date d&apos;activation future</p>
                </div>
              </div>
              {deferredActivation && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Date d&apos;activation *</Label>
                  <Input
                    type="date"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`h-12 rounded-xl text-base bg-[#f8fafc] ${errors.activationDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                    Les 60 jours commenceront à partir de cette date
                  </p>
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="w-full py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: BTN_PRIMARY }}
            >
              Suivant <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ═══ STEP 2: Travel & Photo ═══ */}
        {step === 2 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <Luggage className="w-5 h-5" />
              Détails du Voyage
            </div>

            {/* Airline */}
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-1.5 block">Compagnie Aérienne</Label>
              <Input
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="Ex: Saudia Airlines"
                className="h-12 rounded-xl text-base bg-[#f8fafc] border-gray-300"
              />
            </div>

            {/* Flight Number + Destination */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-1.5 block">Numéro de Vol</Label>
                <Input
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="SV1234"
                  className="h-12 rounded-xl text-base bg-[#f8fafc] border-gray-300 font-mono tracking-wider"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-1.5 block">Destination</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Djeddah / Médine"
                  className="h-12 rounded-xl text-base bg-[#f8fafc] border-gray-300"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="mb-4">
              <Label className="text-sm font-semibold mb-1.5 block">Photo du Bagage (recommandé)</Label>
              <label
                className="block border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center bg-gray-50 cursor-pointer hover:border-black hover:bg-white transition-colors"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="max-w-full max-h-36 rounded-xl mx-auto" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">📸 Cliquez pour ajouter une photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Aidera le trouveur à confirmer visuellement le bagage
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex-1 py-4 rounded-[14px] font-bold text-base flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Précédent
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: BTN_PRIMARY }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Activer le Bagage
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ─── Footer ─── */}
      <div className="mt-auto pt-6 text-center text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
        Propulsé par <strong>PassHajj</strong> ·{' '}
        <a href="/found" className="text-black font-semibold underline">Changer de produit</a> ·{' '}
        <a href="/support" className="text-black font-semibold underline">Aide</a>
      </div>
    </main>
  );
}

export default function HajjActivatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-black font-medium">Chargement...</p>
        </div>
      </main>
    }>
      <HajjActivateContent />
    </Suspense>
  );
}
