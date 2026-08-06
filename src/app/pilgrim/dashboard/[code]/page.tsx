'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
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
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  User,
  Heart,
  Hotel,
  Phone,
  Pencil,
  X,
  Save,
  Loader2,
  AlertCircle,
  QrCode,
  Calendar,
  Clock,
  Droplets,
  Mail,
  Activity,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { detectLanguageFromBrowser, LANGUAGE_DIRECTION, type Language } from '@/lib/i18n';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface PilgrimData {
  id: string;
  code: string;
  fullName: string;
  nationality: string;
  bloodType: string | null;
  medicalInfo: string | null;
  hotelMecca: string | null;
  roomMecca: string | null;
  hotelMedina: string | null;
  roomMedina: string | null;
  groupLeaderPhone: string;
  agencyPhone: string | null;
  familyContact: string | null;
  duration: string;
  active: boolean;
  status: 'active' | 'inactive' | 'expired';
  expiresAt: string | null;
  activatedAt: string | null;
  updatedAt: string | null;
}

interface EditFormData {
  bloodType: string;
  medicalInfo: string;
  hotelMecca: string;
  roomMecca: string;
  hotelMedina: string;
  roomMedina: string;
  groupLeaderPhone: string;
  agencyPhone: string;
  familyContact: string;
}

type PageState = 'loading' | 'not_found' | 'view' | 'editing' | 'saving';

export default function PilgrimDashboardPage() {
  const { code } = useParams();
  const router = useRouter();
  const { t, lang, dir, isLoading: translationsLoading } = useTranslation();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [pilgrimData, setPilgrimData] = useState<PilgrimData | null>(null);
  const [editData, setEditData] = useState<EditFormData>({
    bloodType: '',
    medicalInfo: '',
    hotelMecca: '',
    roomMecca: '',
    hotelMedina: '',
    roomMedina: '',
    groupLeaderPhone: '',
    agencyPhone: '',
    familyContact: '',
  });

  // Fetch pilgrim data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/pilgrims/${code}`);
        if (response.ok) {
          const data = await response.json();
          setPilgrimData(data);
          setEditData({
            bloodType: data.bloodType || '',
            medicalInfo: data.medicalInfo || '',
            hotelMecca: data.hotelMecca || '',
            roomMecca: data.roomMecca || '',
            hotelMedina: data.hotelMedina || '',
            roomMedina: data.roomMedina || '',
            groupLeaderPhone: data.groupLeaderPhone || '',
            agencyPhone: data.agencyPhone || '',
            familyContact: data.familyContact || '',
          });
          setPageState('view');
        } else {
          setPageState('not_found');
        }
      } catch (error) {
        console.error('Error fetching pilgrim data:', error);
        setPageState('not_found');
      }
    };

    if (code) {
      fetchData();
    }
  }, [code]);

  const handleEdit = () => {
    // Reset edit data to current values
    if (pilgrimData) {
      setEditData({
        bloodType: pilgrimData.bloodType || '',
        medicalInfo: pilgrimData.medicalInfo || '',
        hotelMecca: pilgrimData.hotelMecca || '',
        roomMecca: pilgrimData.roomMecca || '',
        hotelMedina: pilgrimData.hotelMedina || '',
        roomMedina: pilgrimData.roomMedina || '',
        groupLeaderPhone: pilgrimData.groupLeaderPhone || '',
        agencyPhone: pilgrimData.agencyPhone || '',
        familyContact: pilgrimData.familyContact || '',
      });
    }
    setPageState('editing');
  };

  const handleCancel = () => {
    // Reset edit data
    if (pilgrimData) {
      setEditData({
        bloodType: pilgrimData.bloodType || '',
        medicalInfo: pilgrimData.medicalInfo || '',
        hotelMecca: pilgrimData.hotelMecca || '',
        roomMecca: pilgrimData.roomMecca || '',
        hotelMedina: pilgrimData.hotelMedina || '',
        roomMedina: pilgrimData.roomMedina || '',
        groupLeaderPhone: pilgrimData.groupLeaderPhone || '',
        agencyPhone: pilgrimData.agencyPhone || '',
        familyContact: pilgrimData.familyContact || '',
      });
    }
    setPageState('view');
  };

  const handleSave = async () => {
    setPageState('saving');
    try {
      const response = await fetch(`/api/pilgrims/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodType: editData.bloodType || undefined,
          medicalInfo: editData.medicalInfo || undefined,
          hotelMecca: editData.hotelMecca || undefined,
          roomMecca: editData.roomMecca || undefined,
          hotelMedina: editData.hotelMedina || undefined,
          roomMedina: editData.roomMedina || undefined,
          groupLeaderPhone: editData.groupLeaderPhone || undefined,
          agencyPhone: editData.agencyPhone || undefined,
          familyContact: editData.familyContact || undefined,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPilgrimData(updatedData);
        setPageState('view');
        toast({
          title: t('pilgrim.dashboard.updateSuccess'),
          description: '',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: t('pilgrim.dashboard.updateError'),
          description: errorData.message || 'Erreur',
          variant: 'destructive',
        });
        setPageState('editing');
      }
    } catch (error) {
      console.error('Error saving pilgrim data:', error);
      toast({
        title: t('pilgrim.dashboard.updateError'),
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
      setPageState('editing');
    }
  };

  const updateEditField = (field: keyof EditFormData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('pilgrim.dashboard.active')}
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {t('pilgrim.dashboard.inactive')}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('pilgrim.dashboard.expired')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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

  if (!pilgrimData) return null;

  const isEditing = pageState === 'editing' || pageState === 'saving';
  const isSaving = pageState === 'saving';

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
          <div className="flex items-center gap-2">
            {getStatusBadge(pilgrimData.status)}
            <Badge className="bg-emerald-600/50 text-white border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Pass Identity
            </Badge>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header with QR Code and Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t('pilgrim.dashboard.title')}
          </h1>
          <p className="text-white/70 text-lg mb-4">
            {t('pilgrim.dashboard.subtitle')}
          </p>
        </motion.div>

        {/* QR Code & Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code with flanking icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Envelope icon — indicates pilgrim can scan to write family */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[8px] text-emerald-300 font-medium leading-tight text-center">Famille</span>
                  </div>
                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-4">
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pilgrim/${code}`}
                      size={120}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#059669"
                    />
                  </div>
                  {/* Caduceus/medical icon — indicates health profile for emergency */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-[8px] text-red-300 font-medium leading-tight text-center">Santé</span>
                  </div>
                </div>
                {/* Status Info */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <QrCode className="w-4 h-4 text-white/60" />
                    <span className="text-white/60 text-sm">{t('pilgrim.dashboard.qrCode')}</span>
                    <span className="text-white font-mono text-sm bg-white/10 px-2 py-0.5 rounded">{code}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-white/60 text-sm">{t('pilgrim.dashboard.status')}:</span>
                    {getStatusBadge(pilgrimData.status)}
                  </div>
                  {pilgrimData.expiresAt && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Calendar className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">{t('pilgrim.dashboard.expiresAt')}:</span>
                      <span className="text-white text-sm font-medium">{formatDate(pilgrimData.expiresAt)}</span>
                    </div>
                  )}
                  {pilgrimData.updatedAt && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Clock className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">{t('pilgrim.dashboard.lastUpdated')}:</span>
                      <span className="text-white/80 text-sm">{formatDate(pilgrimData.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Info Section (Read-Only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-emerald-300" />
                {t('pilgrim.personal.sectionTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">{t('pilgrim.personal.fullName')}</p>
                  <p className="text-white font-medium">{pilgrimData.fullName}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">{t('pilgrim.personal.nationality')}</p>
                  <p className="text-white font-medium">{pilgrimData.nationality}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medical Info Section (Editable) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-emerald-300" />
                  {t('pilgrim.personal.medicalInfo')}
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('pilgrim.activate.bloodType')}</Label>
                      <Select
                        value={editData.bloodType}
                        onValueChange={(value) => updateEditField('bloodType', value)}
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
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('pilgrim.personal.medicalInfo')}</Label>
                      <Textarea
                        value={editData.medicalInfo}
                        onChange={(e) => updateEditField('medicalInfo', e.target.value)}
                        placeholder={t('pilgrim.activate.medicalInfoPlaceholder')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30 min-h-20"
                        rows={3}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-white/60 text-sm mb-1 flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        {t('pilgrim.personal.bloodType')}
                      </p>
                      <p className="text-white font-medium">
                        {pilgrimData.bloodType || (
                          <span className="text-white/40 italic">{t('pilgrim.personal.noMedicalInfo')}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">{t('pilgrim.personal.medicalInfo')}</p>
                      <p className="text-white">
                        {pilgrimData.medicalInfo || (
                          <span className="text-white/40 italic">{t('pilgrim.personal.noMedicalInfo')}</span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hotel/Accommodation Section (Editable) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Hotel className="w-5 h-5 text-emerald-300" />
                  {t('pilgrim.hotel.sectionTitle')}
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Mecca */}
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <p className="text-white/70 text-sm font-medium">{t('pilgrim.hotel.mecca')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">{t('pilgrim.activate.hotelMecca')}</Label>
                          <Input
                            value={editData.hotelMecca}
                            onChange={(e) => updateEditField('hotelMecca', e.target.value)}
                            placeholder={t('pilgrim.activate.hotelMeccaPlaceholder')}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">{t('pilgrim.activate.roomMecca')}</Label>
                          <Input
                            value={editData.roomMecca}
                            onChange={(e) => updateEditField('roomMecca', e.target.value)}
                            placeholder={t('pilgrim.activate.roomMeccaPlaceholder')}
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
                          <Label className="text-white/80 text-sm">{t('pilgrim.activate.hotelMedina')}</Label>
                          <Input
                            value={editData.hotelMedina}
                            onChange={(e) => updateEditField('hotelMedina', e.target.value)}
                            placeholder={t('pilgrim.activate.hotelMedinaPlaceholder')}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">{t('pilgrim.activate.roomMedina')}</Label>
                          <Input
                            value={editData.roomMedina}
                            onChange={(e) => updateEditField('roomMedina', e.target.value)}
                            placeholder={t('pilgrim.activate.roomMedinaPlaceholder')}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Mecca */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm font-medium mb-2">{t('pilgrim.hotel.mecca')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-white/50 text-xs mb-1">{t('pilgrim.hotel.hotel')}</p>
                          <p className="text-white font-medium">
                            {pilgrimData.hotelMecca || <span className="text-white/40 italic">{t('pilgrim.hotel.notSpecified')}</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs mb-1">{t('pilgrim.hotel.room')}</p>
                          <p className="text-white font-medium">
                            {pilgrimData.roomMecca || <span className="text-white/40 italic">{t('pilgrim.hotel.notSpecified')}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Medina */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm font-medium mb-2">{t('pilgrim.hotel.medina')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-white/50 text-xs mb-1">{t('pilgrim.hotel.hotel')}</p>
                          <p className="text-white font-medium">
                            {pilgrimData.hotelMedina || <span className="text-white/40 italic">{t('pilgrim.hotel.notSpecified')}</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs mb-1">{t('pilgrim.hotel.room')}</p>
                          <p className="text-white font-medium">
                            {pilgrimData.roomMedina || <span className="text-white/40 italic">{t('pilgrim.hotel.notSpecified')}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contacts Section (Editable) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-emerald-300" />
                  {t('pilgrim.contacts.sectionTitle')}
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('pilgrim.activate.groupLeaderPhone')}</Label>
                      <Input
                        type="tel"
                        value={editData.groupLeaderPhone}
                        onChange={(e) => updateEditField('groupLeaderPhone', e.target.value)}
                        placeholder={t('pilgrim.activate.groupLeaderPhonePlaceholder')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('pilgrim.activate.agencyPhone')}</Label>
                      <Input
                        type="tel"
                        value={editData.agencyPhone}
                        onChange={(e) => updateEditField('agencyPhone', e.target.value)}
                        placeholder={t('pilgrim.activate.agencyPhonePlaceholder')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('pilgrim.activate.familyContact')}</Label>
                      <Input
                        type="tel"
                        value={editData.familyContact}
                        onChange={(e) => updateEditField('familyContact', e.target.value)}
                        placeholder={t('pilgrim.activate.familyContactPlaceholder')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 focus:ring-emerald-400/30"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-white/60 text-xs">{t('pilgrim.contacts.groupLeader')}</p>
                        <p className="text-white font-medium">
                          {pilgrimData.groupLeaderPhone || <span className="text-white/40 italic">{t('pilgrim.contacts.notSpecified')}</span>}
                        </p>
                      </div>
                      {pilgrimData.groupLeaderPhone && (
                        <a
                          href={`tel:${pilgrimData.groupLeaderPhone}`}
                          className="text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-white/60 text-xs">{t('pilgrim.contacts.agency')}</p>
                        <p className="text-white font-medium">
                          {pilgrimData.agencyPhone || <span className="text-white/40 italic">{t('pilgrim.contacts.notSpecified')}</span>}
                        </p>
                      </div>
                      {pilgrimData.agencyPhone && (
                        <a
                          href={`tel:${pilgrimData.agencyPhone}`}
                          className="text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-white/60 text-xs">{t('pilgrim.contacts.family')}</p>
                        <p className="text-white font-medium">
                          {pilgrimData.familyContact || <span className="text-white/40 italic">{t('pilgrim.contacts.notSpecified')}</span>}
                        </p>
                      </div>
                      {pilgrimData.familyContact && (
                        <a
                          href={`tel:${pilgrimData.familyContact}`}
                          className="text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit / Save / Cancel Buttons */}
        <AnimatePresence>
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 mb-8"
            >
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white h-12"
              >
                <X className="w-4 h-4 mr-2" />
                {t('pilgrim.dashboard.cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-white text-emerald-700 hover:bg-white/90 h-12 font-semibold"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('pilgrim.dashboard.save')}
                  </span>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-8"
            >
              <Button
                onClick={handleEdit}
                className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-12"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t('pilgrim.dashboard.editInfo')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Section */}
        <div className="text-center pb-8">
          <p className="text-white/60 text-sm">
            Besoin d&apos;aide ? Contactez votre agence ou{' '}
            <a href="mailto:contact@qrpass.com" className="text-white underline">
              contact@qrpass.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
