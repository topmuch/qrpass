'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Globe, CheckCircle, Loader2, ChevronDown, Luggage } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Brand constants (Blue Navy + Gold) ───
const BG = '#fbbf24';
const CARD_BG = '#ffffff';
const TEXT = '#0f172a';
const MUTED = '#6b7280';
const INPUT_BG = '#f8fafc';
const INPUT_BORDER = '#e2e8f0';
const PRIMARY = '#1e3a8a';
const PRIMARY_LIGHT = '#3b82f6';
const RADIUS = '20px';

// ─── Country codes with flags ───
const COUNTRY_CODES = [
  { value: '+221', flag: '🇸🇳', label: 'Sénégal' },
  { value: '+225', flag: '🇨🇮', label: "Côte d'Ivoire" },
  { value: '+237', flag: '🇨🇲', label: 'Cameroun' },
  { value: '+212', flag: '🇲🇦', label: 'Maroc' },
  { value: '+213', flag: '🇩🇿', label: 'Algérie' },
  { value: '+216', flag: '🇹🇳', label: 'Tunisie' },
  { value: '+226', flag: '🇧🇫', label: 'Burkina Faso' },
  { value: '+223', flag: '🇲🇱', label: 'Mali' },
  { value: '+227', flag: '🇳🇪', label: 'Niger' },
  { value: '+966', flag: '🇸🇦', label: 'Arabie Saoudite' },
  { value: '+33', flag: '🇫🇷', label: 'France' },
  { value: '+1', flag: '🇺🇸', label: 'USA/Canada' },
  { value: '+44', flag: '🇬🇧', label: 'Royaume-Uni' },
  { value: '+32', flag: '🇧🇪', label: 'Belgique' },
  { value: '+49', flag: '🇩🇪', label: 'Allemagne' },
];

// Map country codes from IP detection to dial codes
const COUNTRY_TO_DIAL: Record<string, string> = {
  SN: '+221', CI: '+225', CM: '+237', MA: '+212',
  DZ: '+213', TN: '+216', BF: '+226', ML: '+223',
  NE: '+227', SA: '+966', FR: '+33', BE: '+32',
  CA: '+1', US: '+1', GB: '+44', DE: '+49',
};

// ─── Airlines for autocomplete ───
const AIRLINES = [
  'Saudia Airlines', 'Air France', 'Emirates', 'Qatar Airways',
  'Turkish Airlines', 'Ethiopian Airlines', 'Royal Air Maroc',
  'Air Algérie', 'Tunisair', 'EgyptAir', 'Kenya Airways',
  'Lufthansa', 'British Airways', 'KLM', 'Air Sénégal',
  'Royal Jordanian', 'Kuwait Airways', 'Oman Air',
  'Gulf Air', 'Flynas', 'flydubai', 'Wizz Air',
  'Mauritania Airlines', 'Air Côte d\'Ivoire', 'Camair-Co',
];

// ─── Destinations ───
const DESTINATIONS = [
  { value: 'Jeddah', label: '🕌 Djeddah (La Mecque)' },
  { value: 'Medina', label: '🕋 Médine' },
  { value: 'Riyadh', label: '🏙️ Riyad' },
];

// ─── Language support ───
type Lang = 'fr' | 'en' | 'ar';
const LANG_NAMES: Record<Lang, string> = { fr: 'Français', en: 'English', ar: 'العربية' };

function LangSelector({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-black/10 rounded-full text-sm font-medium hover:bg-white transition-colors"
      >
        <Globe className="w-4 h-4" />
        {LANG_NAMES[lang]}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                lang === l ? 'bg-[#fbbf24] text-black' : 'text-black hover:bg-[#fbbf24]/30'
              }`}
            >
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Translations ───
const T = {
  fr: {
    title: '🧳 Informations du Bagage',
    subtitle: 'Activez votre bagage en 1 minute',
    qrCode: 'Code QR',
    qrDetected: '✅ Code détecté depuis l\'URL',
    qrPlaceholder: 'Détection automatique...',
    fullName: 'Votre nom complet *',
    fullNamePlaceholder: 'Ex: Ahmed Ndiaye',
    whatsapp: 'WhatsApp (Chef de groupe) *',
    whatsappHint: '📱 Indicatif détecté automatiquement',
    phonePlaceholder: '77 123 45 67',
    email: 'Email (optionnel)',
    emailPlaceholder: 'email@exemple.com',
    airline: 'Compagnie aérienne *',
    airlinePlaceholder: 'Rechercher (ex: Saudia, Air France...)',
    flightNumber: 'Numéro de vol *',
    flightPlaceholder: 'Ex: SV1234',
    destination: 'Destination *',
    destinationPlaceholder: 'Choisir...',
    departure: 'Date et heure de départ *',
    photo: 'Photo du bagage (recommandé)',
    photoClick: '📸 Cliquez pour ajouter une photo',
    photoHint: 'Aide le trouveur à identifier votre valise',
    activate: '✅ Activer mon Bagage',
    activating: '⏳ Activation en cours...',
    errorTitle: 'Erreur d\'activation',
    errorMsg: 'Vérifiez votre connexion et réessayez.',
    footer: 'Propulsé par',
    changeProduct: 'Changer de produit',
    help: 'Aide',
    infoTitle: '2 bagages soute seront activés',
    infoDesc: 'Protection de 2 mois (60 jours) à partir de la date d\'activation',
    deferred: 'Activation différée',
    deferredHint: 'Choisir une date d\'activation future',
    deferredDate: 'Date d\'activation *',
    deferredDateHint: 'Les 60 jours commenceront à partir de cette date',
  },
  en: {
    title: '🧳 Baggage Information',
    subtitle: 'Activate your baggage in 1 minute',
    qrCode: 'QR Code',
    qrDetected: '✅ Code detected from URL',
    qrPlaceholder: 'Automatic detection...',
    fullName: 'Your full name *',
    fullNamePlaceholder: 'Ex: Ahmed Ndiaye',
    whatsapp: 'WhatsApp (Group leader) *',
    whatsappHint: '📱 Country code auto-detected',
    phonePlaceholder: '77 123 45 67',
    email: 'Email (optional)',
    emailPlaceholder: 'email@example.com',
    airline: 'Airline *',
    airlinePlaceholder: 'Search (e.g: Saudia, Air France...)',
    flightNumber: 'Flight number *',
    flightPlaceholder: 'Ex: SV1234',
    destination: 'Destination *',
    destinationPlaceholder: 'Choose...',
    departure: 'Departure date and time *',
    photo: 'Baggage photo (recommended)',
    photoClick: '📸 Click to add a photo',
    photoHint: 'Helps the finder identify your luggage',
    activate: '✅ Activate my Baggage',
    activating: '⏳ Activating...',
    errorTitle: 'Activation error',
    errorMsg: 'Check your connection and try again.',
    footer: 'Powered by',
    changeProduct: 'Change product',
    help: 'Help',
    infoTitle: '2 checked baggages will be activated',
    infoDesc: '2-month protection (60 days) from activation date',
    deferred: 'Deferred activation',
    deferredHint: 'Choose a future activation date',
    deferredDate: 'Activation date *',
    deferredDateHint: '60 days will start from this date',
  },
  ar: {
    title: '🧳 معلومات الأمتعة',
    subtitle: 'فعّل أمتعتك في دقيقة واحدة',
    qrCode: 'رمز QR',
    qrDetected: '✅ تم اكتشاف الرمز من الرابط',
    qrPlaceholder: 'اكتشاف تلقائي...',
    fullName: 'الاسم الكامل *',
    fullNamePlaceholder: 'مثال: أحمد نداي',
    whatsapp: 'واتساب (قائد المجموعة) *',
    whatsappHint: '📱 رمز الدولة مكتشف تلقائياً',
    phonePlaceholder: '77 123 45 67',
    email: 'البريد الإلكتروني (اختياري)',
    emailPlaceholder: 'email@example.com',
    airline: 'شركة الطيران *',
    airlinePlaceholder: 'بحث (مثال: السعودية، إير فرانس...)',
    flightNumber: 'رقم الرحلة *',
    flightPlaceholder: 'مثال: SV1234',
    destination: 'الوجهة *',
    destinationPlaceholder: 'اختر...',
    departure: 'تاريخ ووقت المغادرة *',
    photo: 'صورة الأمتعة (موصى بها)',
    photoClick: '📸 انقر لإضافة صورة',
    photoHint: 'يساعد من وجد الحقيبة في التعرف عليها',
    activate: '✅ تفعيل أمتعتي',
    activating: '⏳ جاري التفعيل...',
    errorTitle: 'خطأ في التفعيل',
    errorMsg: 'تحقق من اتصالك وحاول مرة أخرى.',
    footer: 'بدعم من',
    changeProduct: 'تغيير المنتج',
    help: 'مساعدة',
    infoTitle: 'سيتم تفعيل 2 حقائب سجع',
    infoDesc: 'حماية لمدة شهرين (60 يوماً) من تاريخ التفعيل',
    deferred: 'تفعيل مؤجل',
    deferredHint: 'اختر تاريخ تفعيل مستقبلي',
    deferredDate: 'تاريخ التفعيل *',
    deferredDateHint: 'ستبدأ الـ 60 يوماً من هذا التاريخ',
  },
};

// ─── Main Component ───
function BaggageActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('code') || searchParams.get('qr') || '';

  // Language
  const [lang, setLang] = useState<Lang>('fr');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = T[lang];

  // Form state
  const [reference, setReference] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+221');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Deferred activation
  const [deferredActivation, setDeferredActivation] = useState(false);
  const [activationDate, setActivationDate] = useState('');

  // Autocomplete state
  const [airlineResults, setAirlineResults] = useState<string[]>([]);
  const [showAirlineResults, setShowAirlineResults] = useState(false);
  const airlineRef = useRef<HTMLDivElement>(null);

  // Country code dropdown
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Pre-fill QR from URL
  useEffect(() => {
    if (qrFromUrl) {
      setReference(qrFromUrl.toUpperCase());
    }
  }, [qrFromUrl]);

  // Detect country by IP
  useEffect(() => {
    async function detectCountry() {
      try {
        const res = await fetch('/api/detect-country');
        if (res.ok) {
          const data = await res.json();
          const dial = COUNTRY_TO_DIAL[data.countryCode];
          if (dial) {
            setCountryCode(dial);
          }
        }
      } catch {
        // Silently fail, keep default +221
      }
    }
    detectCountry();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (airlineRef.current && !airlineRef.current.contains(e.target as Node)) {
        setShowAirlineResults(false);
      }
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Airline autocomplete handler
  const handleAirlineInput = useCallback((value: string) => {
    setAirline(value);
    if (value.length < 2) {
      setAirlineResults([]);
      setShowAirlineResults(false);
      return;
    }
    const filtered = AIRLINES.filter(a => a.toLowerCase().includes(value.toLowerCase()));
    setAirlineResults(filtered);
    setShowAirlineResults(filtered.length > 0);
  }, []);

  const selectAirline = useCallback((name: string) => {
    setAirline(name);
    setShowAirlineResults(false);
  }, []);

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

  // Form validation
  const validate = (): boolean => {
    if (!reference.trim()) {
      toast({ title: 'Code QR requis', variant: 'destructive' });
      return false;
    }
    if (!fullName.trim()) {
      toast({ title: 'Nom complet requis', variant: 'destructive' });
      return false;
    }
    if (!phone.trim()) {
      toast({ title: 'Numéro WhatsApp requis', variant: 'destructive' });
      return false;
    }
    if (!airline.trim()) {
      toast({ title: 'Compagnie aérienne requise', variant: 'destructive' });
      return false;
    }
    if (!flightNumber.trim()) {
      toast({ title: 'Numéro de vol requis', variant: 'destructive' });
      return false;
    }
    if (!destination) {
      toast({ title: 'Destination requise', variant: 'destructive' });
      return false;
    }
    if (!departureDate) {
      toast({ title: 'Date de départ requise', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Split fullName into firstName and lastName for API compatibility
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Upload photo first if selected
      let photoUrl: string | null = null;
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
        } catch {
          // Non-blocking, continue without photo
        }
      }

      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.toUpperCase(),
          travelerFirstName: firstName,
          travelerLastName: lastName,
          whatsappOwner: `${countryCode}${phone.trim()}`,
          airlineName: airline.trim(),
          flightNumber: flightNumber.trim().toUpperCase(),
          destination,
          departureDate,
          departureTime: departureTime || undefined,
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
          whatsapp: `${countryCode}${phone.trim()}`,
          airlineName: airline,
          flightNumber,
          destination,
          type: 'hajj',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
          photoUrl: photoUrl || data.baggage?.photoUrl || null,
        }));

        const params = new URLSearchParams({
          code: reference.toUpperCase(),
          firstName,
          lastName,
          flight: flightNumber,
          destination,
          chefPhone: `${countryCode}${phone.trim()}`,
        });
        if (photoUrl) params.set('photo', photoUrl);
        router.push(`/activate/confirmation?${params.toString()}`);
      } else {
        const error = await response.json();
        toast({ title: error.message || t.errorTitle, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <main dir={dir} className="min-h-screen flex flex-col items-center" style={{ background: BG, color: TEXT, padding: '16px' }}>

      {/* ─── Header ─── */}
      <div className="w-full max-w-[480px] flex items-center justify-between mb-6 animate-[fadeInDown_0.5s_ease]">
        <div>
          <div className="text-[28px] font-extrabold tracking-tight text-black">
            <span className="text-white bg-black px-2 py-0.5 rounded-md mr-1">Pass</span>Hajj
          </div>
          <div className="text-sm mt-1 text-black/60">{t.subtitle}</div>
        </div>
        <LangSelector lang={lang} setLang={setLang} />
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="w-full max-w-[480px] mb-5">
        <div className="h-1 bg-white/40 rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full" style={{ width: '50%', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* ─── Form Card ─── */}
      <form onSubmit={handleSubmit} className="w-full max-w-[480px]">
        <div
          className="rounded-[20px] p-7 shadow-[0_8px_24px_rgba(0,0,0,0.12)] mb-4 animate-[fadeInUp_0.5s_ease_0.2s_both]"
          style={{ background: CARD_BG }}
        >
          <div className="text-lg font-bold mb-5 flex items-center gap-2">
            {t.title}
          </div>

          {/* QR Code (Auto-détecté) */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.qrCode}</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              readOnly={!!qrFromUrl}
              placeholder={t.qrPlaceholder}
              className={`h-[52px] rounded-xl text-[15px] ${qrFromUrl ? 'bg-[#f1f5f9] cursor-not-allowed text-gray-600' : 'bg-[#f8fafc]'} border-[#e2e8f0]`}
            />
            {qrFromUrl && (
              <p className="text-xs mt-1.5 text-gray-500">{t.qrDetected}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.fullName}</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              required
              className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
            />
          </div>

          {/* WhatsApp with Country Code */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.whatsapp}</Label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <div className="relative" ref={countryRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="h-[52px] w-[110px] flex items-center justify-center gap-1 border-[1.5px] border-[#e2e8f0] rounded-xl bg-[#f8fafc] text-[15px] font-semibold hover:bg-white hover:border-[#1e3a8a] transition-colors"
                >
                  {COUNTRY_CODES.find(c => c.value === countryCode)?.flag} {countryCode}
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-50" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[220px] bg-white border border-[#e2e8f0] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-h-[240px] overflow-y-auto z-50">
                    {COUNTRY_CODES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => { setCountryCode(c.value); setShowCountryDropdown(false); }}
                        className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#f8fafc] transition-colors ${
                          countryCode === c.value ? 'bg-[#1e3a8a]/5 font-semibold' : ''
                        }`}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span>{c.value}</span>
                        <span className="text-gray-400 text-xs">{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Phone Number */}
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                required
                className="flex-1 h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
              />
            </div>
            <p className="text-xs mt-1.5 text-gray-500">{t.whatsappHint}</p>
          </div>

          {/* Email (optional) */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.email}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
            />
          </div>

          {/* Airline Autocomplete */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.airline}</Label>
            <div className="relative" ref={airlineRef}>
              <Input
                value={airline}
                onChange={(e) => handleAirlineInput(e.target.value)}
                placeholder={t.airlinePlaceholder}
                required
                autoComplete="off"
                className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
              />
              {showAirlineResults && airlineResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-h-[200px] overflow-y-auto z-10">
                  {airlineResults.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => selectAirline(a)}
                      className="w-full px-3.5 py-3 text-left text-sm hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-b-0"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flight Number */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.flightNumber}</Label>
            <Input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder={t.flightPlaceholder}
              required
              className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] font-mono tracking-wider focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
            />
          </div>

          {/* Destination */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.destination}</Label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full h-[52px] px-3.5 border-[1.5px] border-[#e2e8f0] rounded-xl bg-[#f8fafc] text-[15px] outline-none transition-colors focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10 appearance-none cursor-pointer"
            >
              <option value="">{t.destinationPlaceholder}</option>
              {DESTINATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Departure Date & Time */}
          <div className="mb-5">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.departure}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={today}
                required
                className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
              />
              <Input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#f8fafc] rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
            <Luggage className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t.infoTitle}</p>
              <p className="text-xs text-gray-500">{t.infoDesc}</p>
            </div>
          </div>

          {/* Deferred Activation */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={deferredActivation}
                  onChange={(e) => setDeferredActivation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-[#1e3a8a]/20 rounded-full peer peer-checked:bg-[#1e3a8a] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
              <div>
                <p className="text-sm font-semibold" style={{ color: TEXT }}>{t.deferred}</p>
                <p className="text-xs text-gray-500">{t.deferredHint}</p>
              </div>
            </div>
            {deferredActivation && (
              <div className="mt-3">
                <Label className="text-[13px] font-semibold mb-1.5 block">{t.deferredDate}</Label>
                <Input
                  type="date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  min={today}
                  className="h-[52px] rounded-xl text-[15px] bg-[#f8fafc] border-[#e2e8f0] focus:border-[#1e3a8a] focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/10"
                />
                <p className="text-xs mt-1.5 text-gray-500">{t.deferredDateHint}</p>
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <Label className="text-[13px] font-semibold mb-1.5 block">{t.photo}</Label>
            <label className="block border-2 border-dashed border-[#e2e8f0] rounded-2xl p-6 text-center bg-[#fafafa] cursor-pointer hover:border-[#1e3a8a] hover:bg-white transition-colors">
              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu" className="max-w-[150px] max-h-[150px] rounded-xl mx-auto" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">{t.photoClick}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            <p className="text-xs mt-1.5 text-gray-500">{t.photoHint}</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-[14px] text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(30,58,138,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            style={{ background: PRIMARY }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.activating}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {t.activate}
              </>
            )}
          </button>
        </div>
      </form>

      {/* ─── Footer ─── */}
      <div className="mt-auto pt-6 text-center text-xs text-black/50">
        {t.footer} <strong>PassHajj</strong> ·{' '}
        <a href="/select" className="text-black font-semibold underline">{t.changeProduct}</a> ·{' '}
        <a href="/contact" className="text-black font-semibold underline">{t.help}</a>
      </div>

      {/* ─── Keyframe animations (injected via style) ─── */}
      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

// ─── Page Export with Suspense ───
export default function ActivateBaggagePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-black font-medium">Chargement...</p>
        </div>
      </main>
    }>
      <BaggageActivateContent />
    </Suspense>
  );
}
