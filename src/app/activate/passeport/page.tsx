'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import PhoneInput from '@/components/ui/PhoneInput';
import { COUNTRY_MAP, COUNTRIES } from '@/lib/phone';
import {
  ChevronRight,
  ChevronLeft,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Plane,
  Phone,
  MessageCircle,
} from 'lucide-react';

// ─── Brand constants ───
const BG = '#f4b400';
const CARD_BG = '#ffffff';
const TEXT = '#0f172a';
const MUTED = '#6b7280';
const INPUT_BG = '#f3f4f6';
const INPUT_BORDER = '#d1d5db';
const BTN_PRIMARY = '#0f172a';
const BTN_PRIMARY_HOVER = '#1e293b';
const RADIUS = '20px';

// ─── Inner component (needs useSearchParams inside Suspense) ───
function PasseportActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCodeParam = searchParams.get('code') || '';
  const { t } = useTranslation();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Passport Information
  const [code, setCode] = useState(qrCodeParam);
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | ''>('');

  // Step 2: Contact & Travel Info
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [travelDestination, setTravelDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  // Country codes for PhoneInput (detected from IP on mount)
  const [phoneCountry, setPhoneCountry] = useState('SN');
  const [whatsappCountry, setWhatsappCountry] = useState('SN');
  const [emergencyCountry, setEmergencyCountry] = useState('SN');

  // IP-based country detection on mount
  useEffect(() => {
    fetch('/api/ip-country')
      .then((r) => r.json())
      .then((data) => {
        if (data.country && COUNTRY_MAP[data.country.toUpperCase()]) {
          setPhoneCountry(data.country.toUpperCase());
          setWhatsappCountry(data.country.toUpperCase());
          setEmergencyCountry(data.country.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // ─── Step labels ───
  const stepLabels: Record<1 | 2, string> = {
    1: t('passeport.step1Label') || 'ÉTAPE 1 SUR 2 — INFORMATIONS PASSEPORT',
    2: t('passeport.step2Label') || 'ÉTAPE 2 SUR 2 — CONTACT & VOYAGE',
  };

  // ─── Progress widths ───
  const progressWidths: Record<1 | 2, string> = {
    1: '50%',
    2: '100%',
  };

  // ─── Validate step 1 ───
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!code.trim()) newErrors.code = true;
    if (!fullName.trim()) newErrors.fullName = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: t('passeport.validationRequired') || 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // ─── Validate step 2 ───
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!phone.trim()) newErrors.phone = true;
    if (!whatsapp.trim()) newErrors.whatsapp = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: t('passeport.validationContact') || 'Veuillez renseigner au moins un numéro de téléphone et WhatsApp',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // ─── Navigate to step ───
  const goToStep = (s: 1 | 2) => {
    if (s === 2 && !validateStep1()) return;
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Submit activation ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        qrCode: code.trim(),
        fullName: fullName.trim(),
        nationality: nationality.trim() || undefined,
        passportNumber: passportNumber.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        placeOfBirth: placeOfBirth.trim() || undefined,
        gender: gender || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        homeAddress: homeAddress.trim() || undefined,
        travelDestination: travelDestination.trim() || undefined,
        travelDate: travelDate || undefined,
        returnDate: returnDate || undefined,
        notes: notes.trim() || undefined,
      };

      const response = await fetch('/api/passeport/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();

        // Store activation data in sessionStorage for success page
        sessionStorage.setItem(
          'activationData',
          JSON.stringify({
            type: 'passeport',
            reference: code.trim(),
            fullName: fullName.trim(),
            nationality: nationality.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim(),
          })
        );

        // Redirect to success page
        router.push(`/success?type=passeport&code=${encodeURIComponent(code.trim())}`);
      } else {
        const errorData = await response.json();
        toast({
          title: errorData.message || errorData.error || t('passeport.activationError') || "Erreur lors de l'activation",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast({
        title: t('passeport.connectionError') || 'Erreur de connexion. Veuillez réessayer.',
        variant: 'destructive',
      });
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
          <Image
            src="/logo.png"
            alt="PassHajj"
            width={150}
            height={58}
            style={{
              objectFit: 'contain',
              borderRadius: '14px',
              padding: '5px',
              background: 'rgba(255,255,255,0.9)',
            }}
          />
        </div>
        <p className="text-sm mt-1 font-medium" style={{ color: TEXT }}>
          🛂 {t('passeport.subtitle') || 'Protection de votre passeport'}
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
        {/* ═══ STEP 1: Passport Information ═══ */}
        {step === 1 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('passeport.step1Title') || 'Informations du Passeport'}
            </div>

            {/* QR Code illustration */}
            <div className="flex items-center justify-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#fef3c7' }}
              >
                <ShieldCheck className="w-8 h-8" style={{ color: BG }} />
              </div>
            </div>

            {/* QR Code field */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                QR Code *
              </label>
              {qrCodeParam ? (
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
              {qrCodeParam && (
                <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                  Code détecté automatiquement depuis l&apos;URL
                </p>
              )}
              {!qrCodeParam && (
                <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                  Saisissez le code PP- indiqué sur votre autocollant
                </p>
              )}
            </div>

            {/* Info box */}
            <div
              className="rounded-xl p-3 mb-5 flex items-start gap-2"
              style={{ backgroundColor: '#fef9c3' }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                {t('passeport.infoNote') || "Ces informations aideront à vous identifier si votre passeport est perdu."}
              </p>
            </div>

            {/* Nom complet */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.fullName') || 'Nom complet'} *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('passeport.fullNamePlaceholder') || 'Ex: Ahmed Diop'}
                className={errors.fullName ? inputErrorClass : inputNormalClass}
                style={errors.fullName ? undefined : { backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Nationalité */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.nationality') || 'Nationalité'}
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
                  placeholder={t('passeport.nationalityPlaceholder') || 'Ex: Sénégal, Maroc, France...'}
                  className={inputNormalClass}
                  style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
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

            {/* N° passeport (optional, with privacy note) */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.passportNumber') || 'N° passeport'}{' '}
                <span className="font-normal" style={{ color: MUTED }}>
                  ({t('passeport.optional') || 'optionnel'})
                </span>
              </label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder={t('passeport.passportNumberPlaceholder') || 'Ex: A12345678'}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: MUTED }}>
                🔒 {t('passeport.privacyNote') || 'Votre numéro reste confidentiel'}
              </p>
            </div>

            {/* Date de naissance */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.dateOfBirth') || 'Date de naissance'}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Lieu de naissance */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.placeOfBirth') || 'Lieu de naissance'}
              </label>
              <input
                type="text"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder={t('passeport.placeOfBirthPlaceholder') || 'Ex: Dakar'}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Sexe (M/F) */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.gender') || 'Sexe'}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`flex-1 py-3 rounded-xl font-bold text-base transition-all border-2 ${
                    gender === 'M'
                      ? 'text-white border-transparent'
                      : 'bg-white text-black border-gray-300 hover:border-gray-400'
                  }`}
                  style={gender === 'M' ? { background: BTN_PRIMARY } : undefined}
                >
                  {t('passeport.male') || 'M'}
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`flex-1 py-3 rounded-xl font-bold text-base transition-all border-2 ${
                    gender === 'F'
                      ? 'text-white border-transparent'
                      : 'bg-white text-black border-gray-300 hover:border-gray-400'
                  }`}
                  style={gender === 'F' ? { background: BTN_PRIMARY } : undefined}
                >
                  {t('passeport.female') || 'F'}
                </button>
              </div>
            </div>

            {/* Suivant button */}
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="w-full py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: BTN_PRIMARY }}
            >
              {t('passeport.next') || 'Continuer'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ═══ STEP 2: Contact & Travel Info ═══ */}
        {step === 2 && (
          <div
            className="rounded-[20px] p-6 shadow-lg mb-4"
            style={{ background: CARD_BG }}
          >
            <div className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plane className="w-5 h-5" />
              {t('passeport.step2Title') || 'Contact & Voyage'}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <PhoneInput
                countryCode={phoneCountry}
                onCountryChange={setPhoneCountry}
                value={phone}
                onChange={setPhone}
                placeholder="77 123 45 67"
                label={`${t('passeport.phone') || 'Téléphone'} *`}
                required
                dark={false}
              />
              {errors.phone && (
                <p className="text-xs mt-1 text-red-500 font-medium">
                  {t('passeport.phoneRequired') || 'Numéro de téléphone requis'}
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="mb-4">
              <PhoneInput
                countryCode={whatsappCountry}
                onCountryChange={setWhatsappCountry}
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="77 123 45 67"
                label={`${t('passeport.whatsapp') || 'WhatsApp'} *`}
                required
                dark={false}
              />
              {errors.whatsapp && (
                <p className="text-xs mt-1 text-red-500 font-medium">
                  {t('passeport.whatsappRequired') || 'Numéro WhatsApp requis'}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.email') || 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('passeport.emailPlaceholder') || 'Ex: ahmed@example.com'}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Emergency contact name */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.emergencyContact') || 'Contact d\'urgence'}
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder={t('passeport.emergencyContactPlaceholder') || 'Ex: Fatou Diop'}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Emergency phone */}
            <div className="mb-4">
              <PhoneInput
                countryCode={emergencyCountry}
                onCountryChange={setEmergencyCountry}
                value={emergencyPhone}
                onChange={setEmergencyPhone}
                placeholder="33 800 00 00"
                label={t('passeport.emergencyPhone') || 'Téléphone d\'urgence'}
                dark={false}
              />
            </div>

            {/* Home address */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.homeAddress') || 'Adresse domicile'}
              </label>
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder={t('passeport.homeAddressPlaceholder') || 'Ex: 12 Rue Faidherbe, Dakar'}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Travel destination */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.travelDestination') || 'Destination de voyage'}
              </label>
              <input
                type="text"
                value={travelDestination}
                onChange={(e) => setTravelDestination(e.target.value)}
                placeholder={t('passeport.travelDestinationPlaceholder') || 'Ex: Arabie Saoudite'}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Travel date */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.travelDate') || 'Date de départ'}
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Return date */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.returnDate') || 'Date de retour'}
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className={inputNormalClass}
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: TEXT }}>
                {t('passeport.notes') || 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('passeport.notesPlaceholder') || 'Informations supplémentaires...'}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-base outline-none transition-colors focus:ring-2 focus:ring-black/20 border resize-none"
                style={{ backgroundColor: INPUT_BG, borderColor: INPUT_BORDER }}
              />
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
                <ChevronLeft className="w-5 h-5" /> {t('passeport.previous') || 'Précédent'}
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
                    {t('passeport.activating') || 'Activation...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('passeport.activate') || 'Activer le Passeport'}
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
          {t('passeport.changeProduct') || 'Changer de produit'}
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
