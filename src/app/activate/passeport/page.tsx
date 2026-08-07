'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import PhoneInput from '@/components/ui/PhoneInput';
import { COUNTRY_MAP, COUNTRIES } from '@/lib/phone';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Globe,
  Building2,
  User,
  AlertTriangle,
  Loader2,
  CheckCircle,
  MapPin,
  Hash,
  CalendarDays,
  Phone,
  Edit3,
} from 'lucide-react';

// ─── Brand constants (cloned from Identity page) ───
const BG = '#059669';
const CARD_BG = '#ffffff';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const INPUT_BG = '#f3f4f6';
const INPUT_BORDER = '#d1d5db';
const BTN_PRIMARY = '#111827';
const BTN_PRIMARY_HOVER = '#374151';
const RADIUS = '20px';

// ─── Inner component (needs useSearchParams inside Suspense) ───
function PasseportActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('code') || '';

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Identité & Passeport
  const [code, setCode] = useState(qrCode);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Step 2: Contact & Hôtel
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappCountry, setWhatsappCountry] = useState('SN');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelPhone, setHotelPhone] = useState('');
  const [hotelPhoneCountry, setHotelPhoneCountry] = useState('SA');

  // Country detection on mount
  useEffect(() => {
    fetch('/api/ip-country')
      .then((r) => r.json())
      .then((data) => {
        if (data.country && COUNTRY_MAP[data.country.toUpperCase()]) {
          const c = data.country.toUpperCase();
          setWhatsappCountry(c);
          setHotelPhoneCountry(c);
        }
      })
      .catch(() => {});
  }, []);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Photo input ref
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ─── Step labels ───
  const stepLabels: Record<1 | 2 | 3, string> = {
    1: 'ÉTAPE 1 SUR 3 — IDENTITÉ & PASSEPORT',
    2: 'ÉTAPE 2 SUR 3 — CONTACT & HÔTEL',
    3: 'ÉTAPE 3 SUR 3 — CONFIRMATION',
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
    if (!nationality.trim()) newErrors.nationality = true;
    if (!passportNumber.trim()) newErrors.passportNumber = true;
    if (!expirationDate) newErrors.expirationDate = true;
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
    if (!whatsapp.trim()) newErrors.whatsapp = true;
    if (!hotelName.trim()) newErrors.hotelName = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Veuillez remplir les champs obligatoires (WhatsApp, Hôtel)', variant: 'destructive' });
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
        }
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const payload: Record<string, unknown> = {
        qrCode: code.trim(),
        fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationality: nationality.trim(),
        passportNumber: passportNumber.trim(),
        expirationDate,
        whatsapp: whatsapp.trim(),
        hotelName: hotelName.trim(),
        hotelAddress: hotelAddress.trim() || undefined,
        hotelPhone: hotelPhone.trim() || undefined,
      };

      if (photoUrl) {
        payload.photoUrl = photoUrl;
      }

      const response = await fetch('/api/passeport/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Store activation data in sessionStorage for confirmation page
        sessionStorage.setItem(
          'activationData',
          JSON.stringify({
            type: 'passeport',
            reference: code.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            photoUrl: photoUrl || null,
            photoPreview: photoPreview || null,
            passportNumber: passportNumber.trim(),
            nationality: nationality.trim(),
            whatsapp: whatsapp.trim(),
            hotelName: hotelName.trim(),
            hotelAddress: hotelAddress.trim(),
          })
        );

        // Redirect to confirmation page
        const params = new URLSearchParams({
          type: 'passeport',
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
          title: errorData.message || errorData.error || "Erreur lors de l'activation",
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
          <Image src="/logo.png" alt="PassHajj" width={150} height={58} style={{ objectFit: 'contain', borderRadius: '14px', padding: '5px', background: 'rgba(255,255,255,0.9)' }} />
        </div>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          🛂 Sticker Passeport — Protection & Restitution
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
        {/* ═══ STEP 1: Identité & Passeport ═══ */}
        {step === 1 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#059669' }} />
              Identité & Passeport
            </div>

            {/* Alert info box */}
            <div
              className="rounded-xl p-3 mb-5 flex items-start gap-2"
              style={{ backgroundColor: '#fef9c3' }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                Ces infos seront visibles si votre passeport est perdu. Elles aideront à vous le restituer.
              </p>
            </div>

            {/* QR Code field (readonly, auto-detected) */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                QR Code *
              </label>
              {qrCode ? (
                <input
                  type="text"
                  value={code}
                  readOnly
                  className={`${inputNormalClass} bg-gray-200 cursor-not-allowed text-gray-600`}
                  style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
                />
              ) : (
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PP-XXXXXX"
                  className={errors.code ? inputErrorClass : inputNormalClass}
                  style={errors.code ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
                />
              )}
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

            {/* Nationalité (dropdown with search/filter) */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Nationalité *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nationalitySearch || nationality}
                  onChange={(e) => {
                    setNationalitySearch(e.target.value);
                    setNationality('');
                  }}
                  onFocus={() => setNationalitySearch(nationalitySearch || '')}
                  placeholder="Ex: Sénégal, Maroc, France..."
                  className={errors.nationality ? inputErrorClass : inputNormalClass}
                  style={errors.nationality ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
                />
                {nationalitySearch && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border max-h-48 overflow-y-auto z-50"
                    style={{ borderColor: INPUT_BORDER }}
                  >
                    {COUNTRIES.filter(
                      (c) =>
                        c.name.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
                        c.code.toLowerCase().includes(nationalitySearch.toLowerCase())
                    )
                      .slice(0, 10)
                      .map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setNationality(c.name);
                            setNationalitySearch('');
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="font-medium" style={{ color: TEXT }}>
                            {c.name}
                          </span>
                        </button>
                      ))}
                    {COUNTRIES.filter(
                      (c) =>
                        c.name.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
                        c.code.toLowerCase().includes(nationalitySearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-3 text-sm" style={{ color: MUTED }}>
                        Aucun pays trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* N° Passeport */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block flex items-center gap-1" style={{ color: TEXT }}>
                <Hash className="w-4 h-4" style={{ color: '#059669' }} />
                N° Passeport *
              </label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="Ex: A12345678"
                className={errors.passportNumber ? inputErrorClass : inputNormalClass}
                style={errors.passportNumber ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: MUTED }}>
                🔒 Votre numéro reste confidentiel
              </p>
            </div>

            {/* Date d'expiration du passeport */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-1.5 block flex items-center gap-1" style={{ color: TEXT }}>
                <CalendarDays className="w-4 h-4" style={{ color: '#059669' }} />
                Date d&apos;expiration *
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className={errors.expirationDate ? inputErrorClass : inputNormalClass}
                style={errors.expirationDate ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
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

        {/* ═══ STEP 2: Contact & Hôtel ═══ */}
        {step === 2 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" style={{ color: '#059669' }} />
              Contact & Hôtel
            </div>

            {/* WhatsApp */}
            <div className="mb-4">
              <PhoneInput
                countryCode={whatsappCountry}
                onCountryChange={setWhatsappCountry}
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="77 123 45 67"
                label="Numéro WhatsApp *"
                required
                dark={false}
              />
              {errors.whatsapp && (
                <p className="text-xs mt-1 text-red-500 font-medium">
                  Numéro WhatsApp requis
                </p>
              )}
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Pour être contacté si votre passeport est trouvé
              </p>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3 mb-4 mt-6">
              <div className="flex-1 h-px" style={{ backgroundColor: INPUT_BORDER }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                Hôtel
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: INPUT_BORDER }} />
            </div>

            {/* Nom de l'hôtel */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                Nom de l&apos;hôtel *
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

            {/* Adresse de l'hôtel */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block flex items-center gap-1" style={{ color: TEXT }}>
                <MapPin className="w-4 h-4" style={{ color: '#059669' }} />
                Adresse de l&apos;hôtel
              </label>
              <input
                type="text"
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                placeholder="Ex: Ibrahim Al-Jafri Street, Makkah"
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Téléphone de l'hôtel */}
            <div className="mb-4">
              <PhoneInput
                countryCode={hotelPhoneCountry}
                onCountryChange={setHotelPhoneCountry}
                value={hotelPhone}
                onChange={setHotelPhone}
                placeholder="01 234 5678"
                label="Téléphone de l'hôtel"
                dark={false}
              />
            </div>

            {/* Déposer à l'hôtel button (opens Google Maps) */}
            {(hotelName.trim() || hotelAddress.trim()) && (
              <div className="mb-6">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelName.trim() + ' ' + hotelAddress.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{ background: '#059669' }}
                >
                  <MapPin className="w-4 h-4" />
                  Déposer à l&apos;hôtel
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

        {/* ═══ STEP 3: Confirmation ═══ */}
        {step === 3 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />
              Confirmation
            </div>

            {/* Alert info box */}
            <div
              className="rounded-xl p-3 mb-5 flex items-start gap-2"
              style={{ backgroundColor: '#ecfdf5' }}
            >
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#059669' }} />
              <p className="text-sm font-medium" style={{ color: '#065f46' }}>
                Vérifiez vos informations avant d&apos;activer le sticker passeport.
              </p>
            </div>

            {/* Photo + Name Summary */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: INPUT_BORDER }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: photoPreview ? 'transparent' : INPUT_BG, overflow: 'hidden' }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Photo du pèlerin"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" style={{ color: MUTED }} />
                )}
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: TEXT }}>
                  {firstName.trim()} {lastName.trim()}
                </p>
                <p className="text-sm" style={{ color: MUTED }}>
                  {nationality}
                </p>
              </div>
            </div>

            {/* Identité & Passeport summary */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                  Identité & Passeport
                </p>
                <button
                  type="button"
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-xs font-semibold flex items-center gap-1 hover:underline"
                  style={{ color: '#059669' }}
                >
                  <Edit3 className="w-3 h-3" /> Modifier
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>Nom</span>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{lastName.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>Prénom</span>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{firstName.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>Nationalité</span>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{nationality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>N° Passeport</span>
                  <span className="text-sm font-medium font-mono" style={{ color: TEXT }}>{passportNumber.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>Expiration</span>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{expirationDate}</span>
                </div>
              </div>
            </div>

            {/* Contact & Hôtel summary */}
            <div className="mb-6 pb-5 border-b" style={{ borderColor: INPUT_BORDER }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                  Contact & Hôtel
                </p>
                <button
                  type="button"
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-xs font-semibold flex items-center gap-1 hover:underline"
                  style={{ color: '#059669' }}
                >
                  <Edit3 className="w-3 h-3" /> Modifier
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>WhatsApp</span>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{whatsapp.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: MUTED }}>Hôtel</span>
                  <span className="text-sm font-medium text-right max-w-[200px] truncate" style={{ color: TEXT }}>{hotelName.trim()}</span>
                </div>
                {hotelAddress.trim() && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: MUTED }}>Adresse</span>
                    <span className="text-sm font-medium text-right max-w-[200px] truncate" style={{ color: TEXT }}>{hotelAddress.trim()}</span>
                  </div>
                )}
                {hotelPhone.trim() && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: MUTED }}>Tél. hôtel</span>
                    <span className="text-sm font-medium" style={{ color: TEXT }}>{hotelPhone.trim()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                    Activer le Passeport
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
export default function PasseportActivatePage() {
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
      <PasseportActivateContent />
    </Suspense>
  );
}
