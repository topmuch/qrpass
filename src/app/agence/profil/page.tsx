'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  CheckCircle,
  Key,
  Shield,
  Calendar,
  Crown
} from "lucide-react";
import { useAgency } from '../layout';

// ─── Brand palette: yellow accent + harmonious neutrals ───
const GOLD = '#f4b400';       // primary accent
const NAVY = '#0c1d3a';       // dark navy — headings, strong text
const CREAM = '#fefce8';      // very light yellow tint — subtle card bg
const WARM_WHITE = '#fffbeb'; // warm white — secondary card bg
const SLATE = '#475569';      // medium gray — secondary text
const LIGHT_BORDER = '#fde68a'; // soft gold border

export default function ProfilPage() {
  const { agencyData, userName, userEmail } = useAgency();
  const [form, setForm] = useState({
    name: agencyData?.name || '',
    email: agencyData?.email || userEmail || '',
    phone: agencyData?.phone || '',
    address: agencyData?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Profil de l&apos;agence</h1>
        <p className="mt-1" style={{ color: SLATE }}>Gérez les informations de votre agence</p>
      </div>

      {success && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981' }}
        >
          <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
          <span className="font-medium" style={{ color: '#065f46' }}>Modifications enregistrées avec succès !</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Agency Info — Clean card with gold accent */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#ffffff', border: `1px solid #e2e8f0`, borderLeft: `4px solid ${GOLD}` }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${GOLD}15` }}
            >
              <Building className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: NAVY }}>Informations de l&apos;agence</h2>
              <p className="text-sm" style={{ color: SLATE }}>Ces informations apparaîtront sur vos documents</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>
                  <User className="w-4 h-4 inline mr-2" style={{ color: GOLD }} />
                  Nom de l&apos;agence
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                  style={{ backgroundColor: CREAM, border: `1px solid ${LIGHT_BORDER}`, color: NAVY }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>
                  <Mail className="w-4 h-4 inline mr-2" style={{ color: GOLD }} />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                  style={{ backgroundColor: CREAM, border: `1px solid ${LIGHT_BORDER}`, color: NAVY }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>
                  <Phone className="w-4 h-4 inline mr-2" style={{ color: GOLD }} />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                  style={{ backgroundColor: CREAM, border: `1px solid ${LIGHT_BORDER}`, color: NAVY }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>
                  <MapPin className="w-4 h-4 inline mr-2" style={{ color: GOLD }} />
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                  style={{ backgroundColor: CREAM, border: `1px solid ${LIGHT_BORDER}`, color: NAVY }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 hover:opacity-90 shadow-sm"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change — Clean card with navy accent */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#ffffff', border: `1px solid #e2e8f0`, borderLeft: `4px solid ${NAVY}` }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${NAVY}0d` }}
            >
              <Key className="w-5 h-5" style={{ color: NAVY }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: NAVY }}>Changer le mot de passe</h2>
              <p className="text-sm" style={{ color: SLATE }}>Mettez à jour votre mot de passe régulièrement</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Mot de passe actuel</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: NAVY }}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: NAVY }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: NAVY }}
                />
              </div>
            </div>

            <button
              type="button"
              className="py-3 px-6 rounded-xl font-semibold transition-all hover:opacity-90 shadow-sm text-white"
              style={{ backgroundColor: NAVY }}
            >
              Changer le mot de passe
            </button>
          </form>
        </div>

        {/* Account Stats — Distinct cards with unique accent colors */}
        <div className="grid md:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" style={{ color: '#10b981' }} />
              <p className="text-sm font-medium" style={{ color: '#065f46' }}>Statut du compte</p>
            </div>
            <p className="text-xl font-bold" style={{ color: '#047857' }}>Actif</p>
          </div>
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: CREAM, border: `1px solid ${LIGHT_BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: GOLD }} />
              <p className="text-sm font-medium" style={{ color: '#92400e' }}>Membre depuis</p>
            </div>
            <p className="text-xl font-bold" style={{ color: NAVY }}>Jan 2024</p>
          </div>
          <div
            className="p-5 rounded-2xl"
            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <p className="text-sm font-medium" style={{ color: '#1e40af' }}>Abonnement</p>
            </div>
            <p className="text-xl font-bold" style={{ color: NAVY }}>Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
