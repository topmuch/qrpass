'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Heart,
  Building2,
  User,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// ─── Brand constants ───
const BG = '#f4b400';
const CARD_BG = '#ffffff';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const INPUT_BG = '#f3f4f6';
const INPUT_BORDER = '#d1d5db';
const BTN_PRIMARY = '#111827';
const BTN_PRIMARY_HOVER = '#374151';
const RADIUS = '20px';

// ─── Blood type options ───
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Inconnu'];

// ─── City options ───
const CITIES = [
  { value: 'mecca', label: 'La Mecque' },
  { value: 'medina', label: 'Médine' },
];

// ─── Inner component (needs useSearchParams inside Suspense) ───
function IdentityActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('code') || '';

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Identité
  const [code, setCode] = useState(qrCode);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');

  // Step 2: Santé
  const [bloodType, setBloodType] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');

  // Step 3: Logement & Contacts
  const [hotelName, setHotelName] = useState('');
  const [city, setCity] = useState('mecca');
  const [roomNumber, setRoomNumber] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Deferred activation
  const [deferredActivation, setDeferredActivation] = useState(false);
  const [activationDate, setActivationDate] = useState('');

  // Photo input ref
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ─── Step labels ───
  const stepLabels: Record<1 | 2 | 3, string> = {
    1: 'ÉTAPE 1 SUR 3 — IDENTITÉ',
    2: 'ÉTAPE 2 SUR 3 — SANTÉ',
    3: 'ÉTAPE 3 SUR 3 — LOGEMENT',
  };

  // ─── Progress widths ───
  const progressWidths: Record<1 | 2 | 3, string> = {
    1: '33%',
    2: '66%',
    3: '100%',
  };

  // ─── Validate step 1 ───
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!code.trim()) newErrors.code = true;
    if (!firstName.trim()) newErrors.firstName = true;
    if (!lastName.trim()) newErrors.lastName = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // ─── Validate step 2 ───
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!bloodType) newErrors.bloodType = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Veuillez sélectionner votre groupe sanguin', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // ─── Validate step 3 ───
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!hotelName.trim()) newErrors.hotelName = true;
    if (!roomNumber.trim()) newErrors.roomNumber = true;
    if (!leaderPhone.trim()) newErrors.leaderPhone = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // ─── Navigate to step ───
  const goToStep = (s: 1 | 2 | 3) => {
    if (s === 2 && !validateStep1()) return;
    if (s === 3 && !validateStep2()) return;
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Photo change handler ───
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ─── Submit activation ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) return;

    setLoading(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo first if selected
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('file', photoFile);
          const uploadRes = await fetch('/api/pilgrims/upload-photo', {
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

      // Build the API payload
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const payload: Record<string, unknown> = {
        fullName,
        nationality: 'Non spécifié', // Required by API but not in form
        groupLeaderPhone: leaderPhone.trim(),
        bloodType: bloodType === 'Inconnu' ? 'Unknown' : bloodType,
        medicalInfo: medicalInfo.trim() || undefined,
        familyContact: familyPhone.trim() || undefined,
      };

      if (photoUrl) {
        payload.photoUrl = photoUrl;
      }

      // Add deferred activation date if selected
      if (deferredActivation && activationDate) {
        payload.activationDate = activationDate;
      }

      // Map hotel/room based on city
      if (city === 'mecca') {
        payload.hotelMecca = hotelName.trim();
        payload.roomMecca = roomNumber.trim();
      } else {
        payload.hotelMedina = hotelName.trim();
        payload.roomMedina = roomNumber.trim();
      }

      const response = await fetch(`/api/pilgrims/activate/${encodeURIComponent(code.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Store activation data in sessionStorage for confirmation page (including base64 preview)
        sessionStorage.setItem('activationData', JSON.stringify({
          type: 'identity',
          reference: code.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          photoUrl: photoUrl || null,
          photoPreview: photoPreview || null,
          bloodType,
          hotel: hotelName,
          room: roomNumber,
          leaderPhone,
        }));

        // Redirect to confirmation page
        const params = new URLSearchParams({
          type: 'identity',
          code: code.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        if (photoUrl) {
          params.set('photo', photoUrl);
        }
        router.push(`/activate/confirmation?${params.toString()}`);
      } else {
        const errorData = await response.json();
        toast({
          title: errorData.message || "Erreur lors de l'activation",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast({ title: 'Erreur de connexion. Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Common input styles ───
  const inputBaseClass =
    'w-full h-12 px-4 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20';
  const inputNormalClass = `${inputBaseClass} border`;
  const inputErrorClass = `${inputBaseClass} border-2 border-red-500`;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-6"
      style={{ background: BG, color: TEXT }}
    >
      {/* ─── Header / Logo ─── */}
      <div className="w-full max-w-[420px] mb-5">
        <div className="text-2xl font-extrabold tracking-tight text-black">
          <span className="text-white bg-black px-2 py-0.5 rounded-md mr-1">Pass</span>Hajj
        </div>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Bracelet d&apos;Urgence &amp; Identification
        </p>
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="w-full max-w-[420px] mb-5">
        <div
          className="text-xs font-semibold uppercase tracking-wider text-center mb-2"
          style={{ color: TEXT }}
        >
          {stepLabels[step]}
        </div>
        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-300 ease-out"
            style={{ width: progressWidths[step] }}
          />
        </div>
      </div>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="w-full max-w-[420px]">
        {/* ═══ STEP 1: Identité du Pèlerin ═══ */}
        {step === 1 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Identité du Pèlerin
            </div>

            {/* Alert info box */}
            <div
              className="rounded-xl p-3 mb-5 flex items-start gap-2"
              style={{ backgroundColor: '#fef9c3' }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                Ces infos seront visibles en cas d&apos;urgence.
              </p>
            </div>

            {/* QR Code field (readonly, auto-detected) */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                QR Code *
              </label>
              <input
                type="text"
                value={code}
                readOnly
                className={`${inputNormalClass} bg-gray-200 cursor-not-allowed text-gray-600`}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              {qrCode && (
                <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                  Code détecté automatiquement depuis l&apos;URL
                </p>
              )}
            </div>

            {/* Photo upload (circular preview) */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Photo
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center shrink-0 transition-colors hover:border-black"
                  style={{
                    borderColor: photoPreview ? '#10b981' : INPUT_BORDER,
                    backgroundColor: photoPreview ? 'transparent' : INPUT_BG,
                    overflow: 'hidden',
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Photo du pèlerin"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-6 h-6" style={{ color: MUTED }} />
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium" style={{ color: TEXT }}>
                    Cliquez pour ajouter
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    JPG, PNG — max 10 Mo
                  </p>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Prénom */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Prénom *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Ahmed"
                className={errors.firstName ? inputErrorClass : inputNormalClass}
                style={errors.firstName ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Nom */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Nom *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Diop"
                className={errors.lastName ? inputErrorClass : inputNormalClass}
                style={errors.lastName ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Âge */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Âge
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex: 65"
                min="0"
                max="150"
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Optionnel
              </p>
            </div>

            {/* Suivant button */}
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

        {/* ═══ STEP 2: Informations Médicales ═══ */}
        {step === 2 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Informations Médicales
            </div>

            {/* Groupe Sanguin */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Groupe Sanguin *
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className={errors.bloodType ? inputErrorClass : inputNormalClass}
                style={
                  errors.bloodType
                    ? undefined
                    : {
                        backgroundColor: INPUT_BG,
                        borderColor: INPUT_BORDER,
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                      }
                }
              >
                <option value="">Sélectionnez...</option>
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            {/* Allergies & Maladies Chroniques */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Allergies &amp; Maladies Chroniques
              </label>
              <textarea
                value={medicalInfo}
                onChange={(e) => setMedicalInfo(e.target.value)}
                placeholder="Ex: Allergie à la pénicilline, diabète type 2, hypertension..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border resize-none"
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Ces infos seront visibles par les secours.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 py-4 rounded-[14px] font-bold text-base flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Précédent
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="flex-[2] py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: BTN_PRIMARY }}
              >
                Suivant <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Logement & Contacts ═══ */}
        {step === 3 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Logement &amp; Contacts
            </div>

            {/* Nom de l'Hôtel */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Nom de l&apos;Hôtel Actuel *
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Ex: Hilton Suites Makkah"
                className={errors.hotelName ? inputErrorClass : inputNormalClass}
                style={errors.hotelName ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Ville */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Ville *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputNormalClass}
                style={{
                  backgroundColor: INPUT_BG,
                  borderColor: INPUT_BORDER,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                }}
              >
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* N° Chambre */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                N° Chambre *
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Ex: 412"
                className={errors.roomNumber ? inputErrorClass : inputNormalClass}
                style={errors.roomNumber ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* WhatsApp Chef de Groupe */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                WhatsApp Chef de Groupe *
              </label>
              <input
                type="tel"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                placeholder="+221 77 123 45 67"
                className={errors.leaderPhone ? inputErrorClass : inputNormalClass}
                style={errors.leaderPhone ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Ce numéro recevra les alertes d&apos;urgence
              </p>
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
                  <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-black/20 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
                <div>
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>Activation différée</p>
                  <p className="text-xs" style={{ color: MUTED }}>Choisir une date d&apos;activation future</p>
                </div>
              </div>
              {deferredActivation && (
                <div>
                  <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                    Date d&apos;activation *
                  </label>
                  <input
                    type="date"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={inputNormalClass}
                    style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                    Les 60 jours commenceront à partir de cette date
                  </p>
                </div>
              )}
            </div>

            {/* Téléphone Famille */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Téléphone Famille (Pays)
              </label>
              <input
                type="tel"
                value={familyPhone}
                onChange={(e) => setFamilyPhone(e.target.value)}
                placeholder="+221 33 800 00 00"
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Optionnel
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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
                    Activation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Activer le Bracelet
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ─── Sticky Footer ─── */}
      <footer className="mt-auto pt-8 pb-4 text-center text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
        Propulsé par <strong>PassHajj</strong> ·{' '}
        <Link href="/select" className="text-black font-semibold underline">
          Changer de produit
        </Link>
      </footer>
    </main>
  );
}

// ─── Page export (with Suspense boundary for useSearchParams) ───
export default function IdentityActivatePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: BG }}
        >
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full mx-auto mb-4" />
            <p className="text-black font-medium">Chargement...</p>
          </div>
        </main>
      }
    >
      <IdentityActivateContent />
    </Suspense>
  );
}
