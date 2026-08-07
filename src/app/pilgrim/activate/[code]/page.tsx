'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  User,
  Heart,
  Hotel,
  Phone,
  Clock,
  Loader2,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { detectLanguageFromBrowser, LANGUAGE_DIRECTION, type Language } from '@/lib/i18n';

// Common nationalities for the dropdown
const COMMON_NATIONALITIES = [
  { value: 'Marocaine', label: '🇲🇦 Marocaine' },
  { value: 'Algérienne', label: '🇩🇿 Algérienne' },
  { value: 'Tunisienne', label: '🇹🇳 Tunisienne' },
  { value: 'Sénégalaise', label: '🇸🇳 Sénégalaise' },
  { value: 'Mauritanienne', label: '🇲🇷 Mauritanienne' },
  { value: 'Malienne', label: '🇲🇱 Malienne' },
  { value: 'Ivoirienne', label: '🇨🇮 Ivoirienne' },
  { value: 'Guinéenne', label: '🇬🇳 Guinéenne' },
  { value: 'Soudanaise', label: '🇸🇩 Soudanaise' },
  { value: 'Égyptienne', label: '🇪🇬 Égyptienne' },
  { value: 'Saoudienne', label: '🇸🇦 Saoudienne' },
  { value: 'Indonésienne', label: '🇮🇩 Indonésienne' },
  { value: 'Pakistanaise', label: '🇵🇰 Pakistanaise' },
  { value: 'Indienne', label: '🇮🇳 Indienne' },
  { value: 'Turque', label: '🇹🇷 Turque' },
  { value: 'Iranienne', label: '🇮🇷 Iranienne' },
  { value: 'Nigériane', label: '🇳🇬 Nigériane' },
  { value: 'Bangladaise', label: '🇧🇩 Bangladaise' },
  { value: 'Française', label: '🇫🇷 Française' },
  { value: 'Britannique', label: '🇬🇧 Britannique' },
  { value: 'Autre', label: '🌍 Autre' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DURATION_OPTIONS = [
  { value: '15d', labelKey: 'activate.duration15d' },
  { value: '30d', labelKey: 'activate.duration30d' },
  { value: '1y', labelKey: 'activate.duration1y' },
];

interface FormData {
  fullName: string;
  nationality: string;
  bloodType: string;
  medicalInfo: string;
  hotelMecca: string;
  roomMecca: string;
  hotelMedina: string;
  roomMedina: string;
  groupLeaderPhone: string;
  agencyPhone: string;
  familyContact: string;
  duration: string;
}

type PageState = 'loading' | 'not_found' | 'already_active' | 'form' | 'submitting' | 'success';

export default function PilgrimActivatePage() {
  const { code } = useParams();
  const router = useRouter();
  const { t, lang, dir, isLoading: translationsLoading } = useTranslation();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    nationality: '',
    bloodType: '',
    medicalInfo: '',
    hotelMecca: '',
    roomMecca: '',
    hotelMedina: '',
    roomMedina: '',
    groupLeaderPhone: '',
    agencyPhone: '',
    familyContact: '',
    duration: '30d',
  });
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);

  // Check QR code on load
  useEffect(() => {
    const checkCode = async () => {
      try {
        const response = await fetch(`/api/pilgrims/${code}`);
        if (response.ok) {
          const data = await response.json();
          if (data.active) {
            // Already active → redirect to dashboard
            router.push(`/pilgrim/dashboard/${code}`);
            return;
          }
          // Code exists but not active → show form
          setPageState('form');
        } else if (response.status === 404) {
          setPageState('not_found');
        } else {
          setPageState('not_found');
        }
      } catch (error) {
        console.error('Error checking code:', error);
        setPageState('not_found');
      }
    };

    if (code) {
      checkCode();
    }
  }, [code, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageState('submitting');

    try {
      const response = await fetch(`/api/pilgrims/activate/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          nationality: formData.nationality,
          bloodType: formData.bloodType || undefined,
          medicalInfo: formData.medicalInfo || undefined,
          hotelMecca: formData.hotelMecca || undefined,
          roomMecca: formData.roomMecca || undefined,
          hotelMedina: formData.hotelMedina || undefined,
          roomMedina: formData.roomMedina || undefined,
          groupLeaderPhone: formData.groupLeaderPhone,
          agencyPhone: formData.agencyPhone || undefined,
          familyContact: formData.familyContact || undefined,
          duration: formData.duration,
        }),
      });

      if (response.ok) {
        setPageState('success');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erreur',
          description: errorData.message || t('pilgrim.activate.submit') + ' — erreur',
          variant: 'destructive',
        });
        setPageState('form');
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'activation',
        variant: 'destructive',
      });
      setPageState('form');
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredNationalities = COMMON_NATIONALITIES.filter(
    (n) =>
      n.value.toLowerCase().includes(nationalitySearch.toLowerCase()) ||
      n.label.toLowerCase().includes(nationalitySearch.toLowerCase())
  );

  // Loading state
  if (pageState === 'loading' || translationsLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-700 to-emerald-900 flex items-center justify-center" dir={dir}>
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" />
          <p className="text-lg">Chargement...</p>
        </div>
      </main>
    );
  }

  // Not found state
  if (pageState === 'not_found') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-700 to-emerald-900 flex items-center justify-center p-4" dir={dir}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{t('pilgrim.identity.notFound')}</h1>
          <p className="text-white/70 mb-8">{t('pilgrim.identity.notFoundDesc')}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-white text-emerald-700 hover:bg-white/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </motion.div>
      </main>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-700 to-emerald-900 flex items-center justify-center p-4" dir={dir}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-emerald-400 rounded-full mb-6 shadow-lg shadow-emerald-400/30"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-3">{t('pilgrim.activate.success')}</h1>
          <p className="text-white/70 mb-8">{t('pilgrim.activate.successDesc')}</p>
          <Button
            onClick={() => router.push(`/pilgrim/dashboard/${code}`)}
            className="bg-white text-emerald-700 hover:bg-white/90 h-12 text-lg font-semibold px-8"
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            {t('pilgrim.dashboard.title')}
          </Button>
        </motion.div>
      </main>
    );
  }

  // Form state
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-700 to-emerald-900" dir={dir}>
      {/* Navigation */}
      <nav className="bg-emerald-800/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          <Badge className="bg-emerald-600/50 text-white border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Pass Identity
          </Badge>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {t('pilgrim.activate.title')}
          </h1>
          <p className="text-white/70 text-lg">
            {t('pilgrim.activate.subtitle')}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <span className="text-white/50 text-sm font-mono">QR:</span>
            <span className="text-white font-mono text-sm">{code}</span>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <motion.section
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold text-white">{t('pilgrim.personal.sectionTitle')}</h2>
                  </div>
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white/90">
                        {t('pilgrim.activate.fullName')} <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder={t('pilgrim.activate.fullNamePlaceholder')}
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                        required
                      />
                    </div>

                    {/* Nationality */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="nationality" className="text-white/90">
                        {t('pilgrim.activate.nationality')} <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="nationality"
                        placeholder={t('pilgrim.activate.nationalityPlaceholder')}
                        value={nationalitySearch || formData.nationality}
                        onChange={(e) => {
                          setNationalitySearch(e.target.value);
                          updateField('nationality', e.target.value);
                          setShowNationalityDropdown(true);
                        }}
                        onFocus={() => setShowNationalityDropdown(true)}
                        onBlur={() => {
                          // Delay to allow click on dropdown item
                          setTimeout(() => setShowNationalityDropdown(false), 200);
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                        required
                      />
                      <Globe className="absolute right-3 top-9 w-4 h-4 text-white/40" />
                      <AnimatePresence>
                        {showNationalityDropdown && filteredNationalities.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute z-50 w-full mt-1 bg-emerald-800 border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                          >
                            {filteredNationalities.map((n) => (
                              <button
                                key={n.value}
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-white/10 transition-colors text-sm"
                                onClick={() => {
                                  updateField('nationality', n.value);
                                  setNationalitySearch('');
                                  setShowNationalityDropdown(false);
                                }}
                              >
                                {n.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Blood Type */}
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('pilgrim.activate.bloodType')}</Label>
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) => updateField('bloodType', value)}
                      >
                        <SelectTrigger className="w-full bg-white/10 border-white/20 text-white focus:border-emerald-400">
                          <SelectValue placeholder={t('pilgrim.activate.bloodTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-emerald-800 border-white/20">
                          {BLOOD_TYPES.map((type) => (
                            <SelectItem key={type} value={type} className="text-white focus:bg-white/10 focus:text-white">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Medical Info */}
                    <div className="space-y-2">
                      <Label htmlFor="medicalInfo" className="text-white/90">
                        {t('pilgrim.activate.medicalInfo')}
                      </Label>
                      <Textarea
                        id="medicalInfo"
                        placeholder={t('pilgrim.activate.medicalInfoPlaceholder')}
                        value={formData.medicalInfo}
                        onChange={(e) => updateField('medicalInfo', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30 min-h-20"
                        rows={3}
                      />
                    </div>
                  </div>
                </motion.section>

                {/* Hotel/Accommodation Section */}
                <motion.section
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Hotel className="w-5 h-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold text-white">{t('pilgrim.hotel.sectionTitle')}</h2>
                  </div>
                  <div className="space-y-4">
                    {/* Mecca */}
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <p className="text-white/70 text-sm font-medium">{t('pilgrim.hotel.mecca')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="hotelMecca" className="text-white/80 text-sm">
                            {t('pilgrim.activate.hotelMecca')}
                          </Label>
                          <Input
                            id="hotelMecca"
                            placeholder={t('pilgrim.activate.hotelMeccaPlaceholder')}
                            value={formData.hotelMecca}
                            onChange={(e) => updateField('hotelMecca', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roomMecca" className="text-white/80 text-sm">
                            {t('pilgrim.activate.roomMecca')}
                          </Label>
                          <Input
                            id="roomMecca"
                            placeholder={t('pilgrim.activate.roomMeccaPlaceholder')}
                            value={formData.roomMecca}
                            onChange={(e) => updateField('roomMecca', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medina */}
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <p className="text-white/70 text-sm font-medium">{t('pilgrim.hotel.medina')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="hotelMedina" className="text-white/80 text-sm">
                            {t('pilgrim.activate.hotelMedina')}
                          </Label>
                          <Input
                            id="hotelMedina"
                            placeholder={t('pilgrim.activate.hotelMedinaPlaceholder')}
                            value={formData.hotelMedina}
                            onChange={(e) => updateField('hotelMedina', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roomMedina" className="text-white/80 text-sm">
                            {t('pilgrim.activate.roomMedina')}
                          </Label>
                          <Input
                            id="roomMedina"
                            placeholder={t('pilgrim.activate.roomMedinaPlaceholder')}
                            value={formData.roomMedina}
                            onChange={(e) => updateField('roomMedina', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Contacts Section */}
                <motion.section
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-5 h-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold text-white">{t('pilgrim.contacts.sectionTitle')}</h2>
                  </div>
                  <div className="space-y-4">
                    {/* Group Leader Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="groupLeaderPhone" className="text-white/90">
                        {t('pilgrim.activate.groupLeaderPhone')} <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="groupLeaderPhone"
                        type="tel"
                        placeholder={t('pilgrim.activate.groupLeaderPhonePlaceholder')}
                        value={formData.groupLeaderPhone}
                        onChange={(e) => updateField('groupLeaderPhone', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                        required
                      />
                    </div>

                    {/* Agency Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="agencyPhone" className="text-white/90">
                        {t('pilgrim.activate.agencyPhone')}
                      </Label>
                      <Input
                        id="agencyPhone"
                        type="tel"
                        placeholder={t('pilgrim.activate.agencyPhonePlaceholder')}
                        value={formData.agencyPhone}
                        onChange={(e) => updateField('agencyPhone', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                      />
                    </div>

                    {/* Family Contact */}
                    <div className="space-y-2">
                      <Label htmlFor="familyContact" className="text-white/90">
                        {t('pilgrim.activate.familyContact')}
                      </Label>
                      <Input
                        id="familyContact"
                        type="tel"
                        placeholder={t('pilgrim.activate.familyContactPlaceholder')}
                        value={formData.familyContact}
                        onChange={(e) => updateField('familyContact', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                      />
                    </div>
                  </div>
                </motion.section>

                {/* Duration Section */}
                <motion.section
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-emerald-300" />
                    <h2 className="text-lg font-semibold text-white">{t('pilgrim.activate.duration')}</h2>
                    <span className="text-red-400 text-sm">*</span>
                  </div>
                  <RadioGroup
                    value={formData.duration}
                    onValueChange={(value) => updateField('duration', value)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                          formData.duration === option.value
                            ? 'border-emerald-400 bg-emerald-400/10'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <RadioGroupItem
                          value={option.value}
                          className="border-white/40 text-emerald-400 data-[state=checked]:border-emerald-400"
                        />
                        <span className="text-white font-medium">{t(option.labelKey)}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </motion.section>

                {/* Info Box */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/10 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-white">
                    <Heart className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-medium">
                      {t('pilgrim.identity.title')}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">
                    {t('pilgrim.activate.successDesc')}
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    type="submit"
                    disabled={pageState === 'submitting'}
                    className="w-full bg-white text-emerald-700 hover:bg-white/90 h-12 text-lg font-semibold"
                  >
                    {pageState === 'submitting' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Activation en cours...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        {t('pilgrim.activate.submit')}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Besoin d&apos;aide ? Contactez votre agence ou{' '}
            <a href="mailto:contact@qrbags.com" className="text-white underline">
              contact@qrbags.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
