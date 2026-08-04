'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { agencyLogin } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  QrCode,
  Plane,
  Luggage,
  Globe,
  ShieldCheck,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════ */

const STATS = [
  { value: '2M+', label: 'Bagages protégés' },
  { value: '850+', label: 'Agences partenaires' },
  { value: '45+', label: 'Pays couverts' },
  { value: '99.9%', label: 'Disponibilité' },
];

/* ══════════════════════════════════════════════════════════
   FLOATING ICON COMPONENT
   ══════════════════════════════════════════════════════════ */

function FloatingIcon({
  icon: Icon,
  className,
  delay = 0,
  duration = 6,
}: {
  icon: React.ElementType;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0.08, 0.18, 0.08],
        scale: [0.85, 1.1, 0.85],
        y: [0, -18, 0],
        rotate: [0, 8, -4, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className="w-full h-full text-yellow-300/40" strokeWidth={1.2} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   FRAMER MOTION VARIANTS
   ══════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function AgencyLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  /* ── Submit handler ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await agencyLogin(email, password);

      if (result?.user && result?.accessToken) {
        router.push('/agency/dashboard');
      } else {
        setError('Réponse inattendue du serveur.');
      }
    } catch (err: any) {
      console.error('Agency login error:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.offlineMessage ||
        'Identifiants incorrects. Veuillez réessayer.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Fill demo credentials ── */
  const fillDemo = () => {
    setEmail('agence@qrpass.com');
    setPassword('agence123');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ══════════════════════════════════════════════════
          LEFT PANEL — Immersive Branding (desktop)
          ══════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[52%] min-h-screen flex-col overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-[#f4b400]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1d3a]/80 via-transparent to-[#1e3a5f]/60" />
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-[15%] -left-16 w-[340px] h-[340px] rounded-full bg-yellow-400/15 blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[20%] right-[-40px] w-[400px] h-[400px] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse"
          style={{ animationDelay: '1.2s' }}
        />
        <div
          className="absolute top-[55%] left-[35%] w-[500px] h-[500px] rounded-full bg-yellow-300/8 blur-[150px] animate-pulse"
          style={{ animationDelay: '2.4s' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Floating travel silhouettes */}
        <FloatingIcon icon={Globe} className="top-[18%] right-[12%] w-14 h-14" delay={0} duration={7} />
        <FloatingIcon icon={Plane} className="top-[32%] left-[8%] w-11 h-11" delay={1.5} duration={8} />
        <FloatingIcon icon={Luggage} className="bottom-[28%] right-[18%] w-12 h-12" delay={2.8} duration={6.5} />
        <FloatingIcon icon={QrCode} className="top-[60%] left-[22%] w-10 h-10" delay={0.8} duration={9} />
        <FloatingIcon icon={Plane} className="bottom-[42%] left-[55%] w-8 h-8" delay={3.5} duration={7.5} />
        <FloatingIcon icon={ShieldCheck} className="top-[12%] left-[42%] w-7 h-7" delay={4.2} duration={8.5} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo */}
          <div className="flex items-center">
            <Link href="/" className="group">
              <motion.div
                className="w-[72px] h-[72px] rounded-2xl bg-white/[0.1] backdrop-blur-md p-2.5 border border-white/[0.15] flex items-center justify-center group-hover:bg-white/[0.16] transition-all duration-300 shadow-xl shadow-black/10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="w-full h-full rounded-lg bg-[#f4b400] flex items-center justify-center">
                  <span className="text-[#1e3a5f] font-extrabold text-xl">PH</span>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Middle: Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* QR icon illustration */}
            <motion.div
              className="relative mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f4b400] to-[#d49b00] flex items-center justify-center shadow-2xl shadow-amber-700/40">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              {/* Decorative dots */}
              <div
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#f4b400] animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
              <div
                className="absolute -bottom-1.5 -right-5 w-3.5 h-3.5 rounded-full bg-yellow-300/70 animate-bounce"
                style={{ animationDelay: '1s' }}
              />
              <div
                className="absolute top-1 -left-3 w-3 h-3 rounded-full bg-white/20 animate-bounce"
                style={{ animationDelay: '1.6s' }}
              />
            </motion.div>

            <motion.h2
              className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              Protégez chaque
              <br />
              <span className="bg-gradient-to-r from-[#f4b400] via-[#f4b400] to-[#d49b00] bg-clip-text text-transparent">
                bagage, en toute
              </span>
              <br />
              sérénité.
            </motion.h2>

            <motion.p
              className="text-white/50 text-lg leading-relaxed mb-10 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              Gérez vos bagages, vos clients et vos QR codes depuis un seul
              tableau de bord intuitif.
            </motion.p>

            {/* Stats row */}
            <motion.div
              className="grid grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className="text-center py-3 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.06]"
                >
                  <p className="text-white font-bold text-lg xl:text-xl">
                    {stat.value}
                  </p>
                  <p className="text-white/30 text-[10px] xl:text-xs mt-1 leading-tight px-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom: Tagline */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="border-l-2 pl-5"
              style={{ borderColor: 'rgba(244, 180, 0, 0.5)' }}
            >
              <p className="text-white/60 text-sm italic leading-relaxed">
                &ldquo;PassHajj a transformé notre gestion de bagages. Zéro perte depuis 2 ans.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f4b400] to-[#d49b00] flex items-center justify-center shadow-lg shadow-amber-700/30">
                  <span className="text-white text-xs font-bold">FD</span>
                </div>
                <div>
                  <p className="text-white/85 text-xs font-medium">Fatou Diallo</p>
                  <p className="text-white/35 text-[10px]">Agence Hajj Express</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT PANEL — Login Form
          ══════════════════════════════════════════════════ */}
      <div
        className="w-full lg:w-[48%] min-h-screen flex items-center justify-center px-6 py-12 sm:px-10 relative"
        style={{
          background:
            'linear-gradient(180deg, #f8fafc 0%, #fefce8 50%, #f8fafc 100%)',
        }}
      >
        {/* Subtle decorative circles */}
        <div
          className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #f4b400, transparent)' }}
        />
        <div
          className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #1e3a5f, transparent)' }}
        />

        <motion.div
          className="w-full max-w-[420px] relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile Logo */}
          <motion.div
            className="lg:hidden flex flex-col items-center mb-8"
            variants={itemVariants}
          >
            <div className="w-16 h-16 rounded-2xl p-2 flex items-center justify-center shadow-lg mb-4" style={{ background: 'linear-gradient(135deg, #1e3a5f, #0c1d3a)' }}>
              <div className="w-full h-full rounded-lg bg-[#f4b400] flex items-center justify-center">
                <span className="text-[#1e3a5f] font-extrabold text-lg">PH</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#1e3a5f] text-center">
              Protégez chaque bagage
            </h2>
            <p className="text-slate-500 text-sm mt-1 text-center">
              Gérez vos bagages et QR codes simplement
            </p>
          </motion.div>

          {/* Mobile Stats (compact) */}
          <motion.div
            className="lg:hidden grid grid-cols-4 gap-2 mb-8"
            variants={itemVariants}
          >
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="text-center py-2 rounded-lg bg-white/80 border border-slate-100 shadow-sm"
              >
                <p className="text-[#1e3a5f] font-bold text-sm">{stat.value}</p>
                <p className="text-slate-400 text-[9px] mt-0.5 leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Badge */}
          <motion.div className="flex items-center gap-2 mb-6" variants={itemVariants}>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #0c1d3a)' }}
            >
              <Building2 className="w-3 h-3" />
              Agence
            </span>
          </motion.div>

          {/* Header */}
          <motion.div className="mb-8" variants={itemVariants}>
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1e3a5f' }}>
              Bienvenue
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Connectez-vous à votre espace agence pour gérer vos bagages et QR
              codes
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card
              className="rounded-2xl shadow-xl border"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderColor: 'rgba(244,180,0,0.12)',
              }}
            >
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="agency-email"
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#1e3a5f' }}
                    >
                      Email
                    </Label>
                    <div
                      className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                        focusedField === 'email'
                          ? 'shadow-[0_0_0_3px_rgba(244,180,0,0.12)]'
                          : ''
                      }`}
                      style={{
                        borderColor: focusedField === 'email' ? '#f4b400' : '#e2e8f0',
                        backgroundColor: focusedField === 'email' ? '#fff' : '#f8fafc',
                      }}
                    >
                      <div
                        className="pl-4 transition-colors duration-200"
                        style={{ color: focusedField === 'email' ? '#f4b400' : '#94a3b8' }}
                      >
                        <Mail className="w-[18px] h-[18px]" />
                      </div>
                      <Input
                        id="agency-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent border-none outline-none placeholder-slate-400 py-3.5 px-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={{ color: '#1e3a5f' }}
                        placeholder="vous@agence.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="agency-password"
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#1e3a5f' }}
                    >
                      Mot de passe
                    </Label>
                    <div
                      className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                        focusedField === 'password'
                          ? 'shadow-[0_0_0_3px_rgba(244,180,0,0.12)]'
                          : ''
                      }`}
                      style={{
                        borderColor: focusedField === 'password' ? '#f4b400' : '#e2e8f0',
                        backgroundColor: focusedField === 'password' ? '#fff' : '#f8fafc',
                      }}
                    >
                      <div
                        className="pl-4 transition-colors duration-200"
                        style={{ color: focusedField === 'password' ? '#f4b400' : '#94a3b8' }}
                      >
                        <Lock className="w-[18px] h-[18px]" />
                      </div>
                      <Input
                        id="agency-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent border-none outline-none placeholder-slate-400 py-3.5 px-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={{ color: '#1e3a5f' }}
                        placeholder="Entrez votre mot de passe"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pr-4 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ color: focusedField === 'password' ? '#f4b400' : '#94a3b8' }}
                        tabIndex={-1}
                        aria-label={
                          showPassword
                            ? 'Masquer le mot de passe'
                            : 'Afficher le mot de passe'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot password link */}
                  <div className="flex items-center justify-end">
                    <Link
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm font-semibold transition-colors hover:underline"
                      style={{ color: '#f4b400' }}
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <motion.div whileTap={loading ? {} : { scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full font-semibold py-3.5 px-4 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all duration-300 h-auto"
                      style={{
                        background: 'linear-gradient(135deg, #f4b400, #d49b00)',
                        color: '#1e3a5f',
                        boxShadow: '0 4px 14px rgba(244,180,0,0.35)',
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Connexion en cours...
                        </>
                      ) : (
                        <>
                          Se connecter
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Demo Account Card */}
          <motion.div
            className="mt-6 p-4 rounded-xl border"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(244,180,0,0.15)',
            }}
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #0c1d3a)' }}
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>
                    Compte démo
                  </p>
                  <p className="text-[10px] font-mono leading-relaxed text-slate-400">
                    agence@qrpass.com / agence123
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg text-white active:scale-[0.97] transition-all duration-200 shadow-sm"
                style={{ background: '#1e3a5f' }}
              >
                Remplir
              </button>
            </div>
          </motion.div>

          {/* Switch to Admin */}
          <motion.div
            className="mt-8 text-center text-sm text-slate-500"
            variants={itemVariants}
          >
            Vous êtes administrateur ?{' '}
            <Link
              href="/admin/connexion"
              className="font-semibold transition-colors hover:underline"
              style={{ color: '#f4b400' }}
            >
              Connexion SuperAdmin
            </Link>
          </motion.div>

          {/* Bottom links */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400"
            variants={itemVariants}
          >
            <Link
              href="/cgu"
              className="hover:text-slate-600 transition-colors"
            >
              CGU
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/confidentialite"
              className="hover:text-slate-600 transition-colors"
            >
              Confidentialité
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/contact"
              className="hover:text-slate-600 transition-colors"
            >
              Aide
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
