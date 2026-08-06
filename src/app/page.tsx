'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  QrCode,
  BatteryCharging,
  Smartphone,
  MapPin,
  MessageCircle,
  Lock,
  Clock,
  Users,
  Plane,
  Ship,
  Train,
  Bus,
  CheckCircle,
  ArrowRight,
  Star,
  WifiOff,
  Sparkles,
  Heart,
  Globe,
  Phone,
  Mail,
  ChevronRight,
  Luggage,
  UserCheck,
  BookOpen,
  Send,
  Navigation,
  ShieldCheck,
  Siren,
  ScanLine,
  AlertTriangle,
  Droplets,
  ChevronDown,
  BadgeCheck,
  Fingerprint,
  BookCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavigation, PublicFooter } from '@/components/public/PublicLayout';

/* ══════════════════════════════════════════════════════════
   BRAND — HMC-inspired palette adapted to PassHajj
   Navy → Bleu Marine #1e3a5f
   Sky  → Jaune #f4b400
   ══════════════════════════════════════════════════════════ */
const NAVY = '#1e3a5f';
const NAVY_DARK = '#0f2240';
const NAVY_LIGHT = '#2e5a8f';
const JAUNE = '#f4b400';
const JAUNE_DARK = '#d97706';
const JAUNE_LIGHT = '#fcd34d';
const BG_LIGHT = '#f9fcfe';
const BG_TINTED = '#f0f7ff';
const INK = '#0b111f';
const MUTED = '#515963';

/* Serif font utility — uses Playfair_Display from layout */
const serif = 'font-[family-name:var(--font-playfair)]';

/* ══════════════════════════════════════════════════════════
   ANIMATION VARIANTS — subtle, HMC-style
   ══════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ══════════════════════════════════════════════════════════
   OVERLINE — Small uppercase label (HMC signature)
   ══════════════════════════════════════════════════════════ */
function Overline({ children, color = JAUNE }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block text-xs font-semibold uppercase tracking-[2.4px] mb-3"
      style={{ color }}
    >
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   BLUR ORB — Decorative blur circle (HMC signature)
   ══════════════════════════════════════════════════════════ */
function BlurOrb({
  size = 'h-40 w-40',
  color = JAUNE,
  opacity = 0.25,
  position = '-top-20 -right-20',
}: {
  size?: string;
  color?: string;
  opacity?: number;
  position?: string;
}) {
  return (
    <div
      className={`absolute ${size} rounded-full blur-3xl pointer-events-none ${position}`}
      style={{ backgroundColor: color, opacity }}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   HERO — Full viewport, background image + gradient overlay
   ══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background image — PassHajj products (valise, bracelet, passeport) */}
      <Image
        src="/passhajj-products.png"
        alt="PassHajj — Valise, Bracelet & Passeport avec QR code"
        fill
        sizes="100vw"
        className="absolute inset-0 w-full h-full object-cover"
        priority
      />

      {/* Gradient overlays — HMC style multi-layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 via-[#1e3a5f]/65 to-[#1e3a5f]/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f]/80 via-transparent to-[#1e3a5f]/40" />

      {/* Decorative blur orbs */}
      <BlurOrb size="h-96 w-96" color={JAUNE} opacity={0.12} position="top-0 right-0 translate-x-1/3 -translate-y-1/4" />
      <BlurOrb size="h-64 w-64" color={JAUNE} opacity={0.08} position="bottom-0 left-0 -translate-x-1/3 translate-y-1/4" />

      {/* Pulsing dot (HMC signature) */}
      <div className="absolute bottom-32 right-16 hidden lg:block">
        <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: JAUNE_LIGHT }} />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="max-w-2xl">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0}>
              <Overline color={JAUNE_LIGHT}>Protection bagages & pèlerins</Overline>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className={`text-4xl sm:text-5xl lg:text-7xl font-semibold text-white leading-[1.08] tracking-tight mb-6 ${serif}`}
            >
              Protégez chaque bagage,{' '}
              <span style={{ color: JAUNE }}>en toute sérénité</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-white/85 leading-relaxed mb-10 max-w-xl"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              La première solution sans application, sans batterie, sans GPS.
              Un simple QR code pour protéger, retrouver et notifier — instantanément.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
              <Link href="/hajj-omra" className="group">
                <Button
                  size="lg"
                  className="rounded-[10px] px-6 h-12 text-sm font-medium shadow-lg transition-all duration-300 group-hover:shadow-xl"
                  style={{ backgroundColor: JAUNE, color: NAVY }}
                >
                  Hajj & Omra
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/demo" className="group">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-[10px] px-6 h-12 text-sm font-medium border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  Voir la démo
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats row — HMC style */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10"
          >
            {[
              { value: '10 000+', label: 'Bagages protégés' },
              { value: '98%', label: 'Taux de récupération' },
              { value: '500+', label: 'Agences partenaires' },
              { value: '45+', label: 'Pays couverts' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: JAUNE_LIGHT }}>
                  {stat.value}
                </p>
                <p className="text-white/60 text-xs uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   ABOUT SECTION — 2-column grid (HMC style)
   ══════════════════════════════════════════════════════════ */
function AboutSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_LIGHT }}>
      <BlurOrb size="h-40 w-40" color={JAUNE} opacity={0.15} position="-top-20 -right-20" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl relative">
              <Image
                src="/images/landing-v2/hero-family-travel.png"
                alt="Famille de voyageurs protégés par PassHajj"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Number overlay — HMC style */}
            <div className="absolute -bottom-4 -right-4 sm:bottom-6 sm:right-6 bg-white rounded-2xl shadow-xl p-4 sm:p-5">
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>+30</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Secondes</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Overline>À propos de PassHajj</Overline>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className={`text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-6 ${serif}`}
              style={{ color: INK }}
            >
              Un voyageur ne devrait jamais perdre son bagage — ni sa sérénité
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg leading-relaxed mb-8"
              style={{ color: MUTED }}
            >
              Créée par MMASOLUTION, PassHajj est la première solution de protection
              intelligente des bagages pour les pèlerins et voyageurs. Zéro application,
              zéro batterie, zéro GPS — un QR code suffit.
            </motion.p>
            <motion.ul variants={fadeUp} custom={3} className="space-y-3">
              {[
                'Activation en 30 secondes',
                'Alertes WhatsApp avec géolocalisation',
                'Chiffrement AES-256 — Conforme RGPD',
                'Fonctionne dans 45+ pays',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: JAUNE }} />
                  <span className="text-sm font-medium" style={{ color: INK }}>{item}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   NOS PASS — 3 fully developed product sections
   ══════════════════════════════════════════════════════════ */

/* ─── Pass Bagage — Full Detail Section ─── */
function PassBagageSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_TINTED }}>
      <BlurOrb size="h-64 w-64" color="#f59e0b" opacity={0.08} position="-bottom-24 -left-24" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 sm:p-10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl" />
              <div className="relative text-center">
                <span className="text-8xl block mb-6">🧳</span>
                <div className="bg-white rounded-2xl p-6 inline-block shadow-xl">
                  <div className="w-32 h-32 mx-auto bg-amber-50 rounded-xl flex items-center justify-center border-2 border-dashed border-amber-300">
                    <QrCode className="w-20 h-20 text-amber-600" />
                  </div>
                </div>
                <p className="mt-4 text-white/90 font-medium text-sm">Autocollant résistant eau & chaleur</p>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Overline color="#f59e0b">Pass Bagage</Overline>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className={`text-3xl sm:text-4xl font-semibold leading-tight tracking-tight mb-6 ${serif}`}
              style={{ color: INK }}
            >
              Votre bagage est perdu ?{' '}
              <span style={{ color: '#f59e0b' }}>On le retrouve.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg leading-relaxed mb-8"
              style={{ color: MUTED }}
            >
              Un QR code autocollant résistant que vous collez sur votre valise. Si quelqu&apos;un trouve votre bagage au tapis roulant,
              il scanne le code avec son téléphone et <strong style={{ color: INK }}>vous recevez instantanément une alerte WhatsApp</strong> avec
              sa position GPS. Pas d&apos;application à télécharger, pas de batterie nécessaire.
            </motion.p>

            {/* How it works — 3 steps */}
            <motion.div variants={fadeUp} custom={3} className="space-y-5 mb-8">
              {[
                { num: '1', title: 'Collez le QR code sur votre bagage', desc: 'Autocollant résistant à l\'eau, la chaleur et les chocs' },
                { num: '2', title: 'Quelqu\'un le trouve et scanne le code', desc: 'Un simple scan avec n\'importe quel smartphone' },
                { num: '3', title: 'Vous recevez une alerte WhatsApp + GPS', desc: 'Position exacte, nom du trouveur, message personnalisé' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold shadow-sm" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: INK }}>{step.title}</p>
                    <p className="text-sm" style={{ color: MUTED }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Key features */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: <MessageCircle className="w-5 h-5" />, label: 'Alerte WhatsApp instantanée' },
                { icon: <MapPin className="w-5 h-5" />, label: 'Position GPS du trouveur' },
                { icon: <Smartphone className="w-5 h-5" />, label: 'Sans application' },
                { icon: <BatteryCharging className="w-5 h-5" />, label: 'Sans batterie' },
                { icon: <ShieldCheck className="w-5 h-5" />, label: 'Taux récupération 98%' },
                { icon: <Clock className="w-5 h-5" />, label: 'Valide 1 an (Hajj complet)' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#fffbeb' }}>
                  <span style={{ color: '#f59e0b' }}>{feat.icon}</span>
                  <span className="text-sm font-medium" style={{ color: INK }}>{feat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Scenarios */}
            <motion.div variants={fadeUp} custom={5}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#f59e0b' }}>
                Scénarios fréquents
              </h4>
              <div className="space-y-2">
                {[
                  'Valise égarée sur le tapis roulant à l\'aéroport de Jeddah',
                  'Sac confisqué lors du contrôle de sécurité',
                  'Bagage mélangé avec celui d\'un autre pèlerin à l\'hôtel',
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                    <span className="text-sm" style={{ color: MUTED }}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pass Identity — Full Detail Section ─── */
function PassIdentitySection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: '#f0fdf4' }}>
      <BlurOrb size="h-64 w-64" color="#10b981" opacity={0.08} position="-bottom-24 -right-24" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="lg:order-1"
          >
            <motion.div variants={fadeUp}>
              <Overline color="#10b981">Pass Identity</Overline>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className={`text-3xl sm:text-4xl font-semibold leading-tight tracking-tight mb-6 ${serif}`}
              style={{ color: INK }}
            >
              Votre carte d&apos;identité médicale,{' '}
              <span style={{ color: '#10b981' }}>accessible en 1 scan</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg leading-relaxed mb-8"
              style={{ color: MUTED }}
            >
              Un QR code que vous portez en bracelet, carte ou pendentif. En cas de malaise ou d&apos;urgence,
              les secours scannent le code et accèdent <strong style={{ color: INK }}>immédiatement à vos informations médicales</strong> :
              groupe sanguin, allergies, maladies chroniques, contact d&apos;urgence. Le bouton
              <strong style={{ color: INK }}> &quot;Rassurer la famille&quot;</strong> envoie automatiquement un message
              WhatsApp adapté à votre position GPS.
            </motion.p>

            {/* How it works — 3 steps */}
            <motion.div variants={fadeUp} custom={3} className="space-y-5 mb-8">
              {[
                { num: '1', title: 'Portez le bracelet / carte QR code', desc: 'Bracelet résistant, carte plastifiée ou pendentif' },
                { num: '2', title: 'Les secours scannent en cas d\'urgence', desc: 'Groupe sanguin, allergies, maladies — tout est accessible' },
                { num: '3', title: 'Appel direct 997/911 + rassurer la famille', desc: 'Boutons d\'appel d\'urgence et message WhatsApp automatique' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold shadow-sm" style={{ backgroundColor: '#10b981', color: '#fff' }}>
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: INK }}>{step.title}</p>
                    <p className="text-sm" style={{ color: MUTED }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Key features */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: <Droplets className="w-5 h-5" />, label: 'Groupe sanguin' },
                { icon: <AlertTriangle className="w-5 h-5" />, label: 'Allergies & maladies' },
                { icon: <Siren className="w-5 h-5" />, label: 'Appel 997 / 911 direct' },
                { icon: <Heart className="w-5 h-5" />, label: 'Rassurer la famille' },
                { icon: <MapPin className="w-5 h-5" />, label: 'Messages GPS adaptés' },
                { icon: <Navigation className="w-5 h-5" />, label: 'Itinéraire vers l\'hôtel' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#ecfdf5' }}>
                  <span style={{ color: '#10b981' }}>{feat.icon}</span>
                  <span className="text-sm font-medium" style={{ color: INK }}>{feat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Icons on QR code explanation */}
            <motion.div variants={fadeUp} custom={5}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#10b981' }}>
                Icônes sur le QR code
              </h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#ecfdf5' }}>
                  <span className="text-2xl">✉️</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: INK }}>Côté gauche</p>
                    <p className="text-xs" style={{ color: MUTED }}>Scannez pour écrire à votre famille</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
                  <span className="text-2xl">⚕️</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: INK }}>Côté droit</p>
                    <p className="text-xs" style={{ color: MUTED }}>Profil santé pour les secours</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual — Medical ID card image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative lg:order-2"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-200/50">
              <Image
                src="/medical-id-card.png"
                alt="PassHajj — Carte d'identité médicale avec QR code"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Glow */}
            <div className="absolute -inset-4 -z-10 rounded-3xl blur-2xl opacity-15" style={{ background: 'radial-gradient(ellipse, #10b981 0%, transparent 70%)' }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Pass Passeport — Full Detail Section ─── */
function PassPasseportSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_TINTED }}>
      <BlurOrb size="h-64 w-64" color="#3b82f6" opacity={0.08} position="-top-24 -right-24" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-8 sm:p-10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl" />
              <div className="relative text-center">
                <span className="text-8xl block mb-6">📘</span>
                {/* Simulated passport */}
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <BookCheck className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-bold text-blue-800">PASSEPORT</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                        <QrCode className="w-12 h-12 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-blue-800">QR code collé sur</p>
                        <p className="text-xs font-medium text-blue-800">la couverture du passeport</p>
                        <p className="text-[10px] text-blue-500 mt-1">En cas de perte, scannez !</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Overline color="#3b82f6">Pass Passeport</Overline>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className={`text-3xl sm:text-4xl font-semibold leading-tight tracking-tight mb-6 ${serif}`}
              style={{ color: INK }}
            >
              Passeport perdu ?{' '}
              <span style={{ color: '#3b82f6' }}>On vous alerte instantanément</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg leading-relaxed mb-8"
              style={{ color: MUTED }}
            >
              Un QR code discret que vous collez sur la couverture de votre passeport. En cas de perte ou de vol —
              situation fréquente à Jeddah, Médine ou lors des rituels — celui qui le trouve scanne le code et
              <strong style={{ color: INK }}> vous êtes alerté immédiatement via WhatsApp</strong> avec sa position GPS.
              Le passeport est le document le plus critique du voyage : le protéger est essentiel.
            </motion.p>

            {/* How it works — 3 steps */}
            <motion.div variants={fadeUp} custom={3} className="space-y-5 mb-8">
              {[
                { num: '1', title: 'Collez le QR code sur votre passeport', desc: 'Autocollant discret, ne gêne ni la lecture ni les tampons' },
                { num: '2', title: 'Quelqu\'un trouve votre passeport et scanne', desc: 'Un simple scan — pas besoin de chercher le propriétaire' },
                { num: '3', title: 'Alerte WhatsApp + position GPS du trouveur', desc: 'Vous savez immédiatement où récupérer votre passeport' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold shadow-sm" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: INK }}>{step.title}</p>
                    <p className="text-sm" style={{ color: MUTED }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Key features */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: <Fingerprint className="w-5 h-5" />, label: 'QR code discret' },
                { icon: <MessageCircle className="w-5 h-5" />, label: 'Alerte WhatsApp' },
                { icon: <MapPin className="w-5 h-5" />, label: 'Position GPS' },
                { icon: <ShieldCheck className="w-5 h-5" />, label: 'Sans app / sans batterie' },
                { icon: <BadgeCheck className="w-5 h-5" />, label: 'Infos de contact' },
                { icon: <Globe className="w-5 h-5" />, label: 'Hajj, Omra & voyages' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#eff6ff' }}>
                  <span style={{ color: '#3b82f6' }}>{feat.icon}</span>
                  <span className="text-sm font-medium" style={{ color: INK }}>{feat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Scenarios */}
            <motion.div variants={fadeUp} custom={5}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#3b82f6' }}>
                Pourquoi c&apos;est critique
              </h4>
              <div className="space-y-2">
                {[
                  'Sans passeport : impossible de prendre le vol retour',
                  'Passeport perdu pendant les rituels (Mina, Arafat, Muzdalifah)',
                  'Vol ou perte lors des transferts Jeddah ↔ Médine ↔ Mecque',
                  'Démarches consulales longues et coûteuses à Jeddah',
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3b82f6' }} />
                    <span className="text-sm" style={{ color: MUTED }}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Nos Pass — Header section with 3 mini-cards ─── */
function NosPassSection() {
  return (
    <>
      {/* Section header */}
      <section className="relative pt-20 pb-8 overflow-hidden" style={{ backgroundColor: BG_TINTED }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <Overline>Nos Pass</Overline>
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 ${serif}`}
              style={{ color: INK }}
            >
              3 QR codes, 3 protections, 1 sérénité
            </h2>
            <p className="text-lg mt-4 max-w-2xl mx-auto" style={{ color: MUTED }}>
              Chaque Pass protège un aspect essentiel de votre voyage. Un simple scan suffit.
            </p>
          </motion.div>

          {/* 3 mini-cards as visual anchor */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto"
          >
            {[
              { emoji: '🧳', title: 'Pass Bagage', color: '#f59e0b', bg: '#fffbeb' },
              { emoji: '🪪', title: 'Pass Identity', color: '#10b981', bg: '#ecfdf5' },
              { emoji: '📘', title: 'Pass Passeport', color: '#3b82f6', bg: '#eff6ff' },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl p-5 border border-slate-100 shadow-sm"
                style={{ backgroundColor: p.bg }}
              >
                <span className="text-4xl block mb-2">{p.emoji}</span>
                <h3 className="font-semibold" style={{ color: p.color }}>{p.title}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Full detail sections */}
      <PassBagageSection />
      <PassIdentitySection />
      <PassPasseportSection />
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   RASSURER LA FAMILLE — Prominent section explaining Caméléon
   ══════════════════════════════════════════════════════════ */
function RassurerLaFamilleSection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: NAVY_DARK }}>
      {/* Decorative orbs */}
      <BlurOrb size="h-96 w-96" color={JAUNE} opacity={0.1} position="top-0 right-0 translate-x-1/3 -translate-y-1/4" />
      <BlurOrb size="h-72 w-72" color="#10b981" opacity={0.08} position="bottom-0 left-0 -translate-x-1/3 translate-y-1/4" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Overline color={JAUNE_LIGHT}>Fonctionnalité phare</Overline>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className={`text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-6 text-white ${serif}`}
            >
              Rassurer la famille,{' '}
              <span style={{ color: JAUNE }}>automatiquement</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg leading-relaxed mb-8 text-white/80"
            >
              Le bouton <strong className="text-white">&quot;Rassurer la famille&quot;</strong> est le cœur de Pass Identity.
              Il utilise la <strong className="text-white">géolocalisation GPS</strong> pour adapter automatiquement
              le message envoyé à votre famille via WhatsApp — sans que vous n&apos;ayez rien à taper.
            </motion.p>

            {/* How it works */}
            <motion.div variants={fadeUp} custom={3} className="space-y-4 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: JAUNE }}>
                Comment ça marche ?
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: JAUNE, color: NAVY }}>1</div>
                <div>
                  <p className="text-sm font-semibold text-white">Le GPS détecte votre position</p>
                  <p className="text-xs text-white/60">Médine, Mina, Arafat, Mecque…</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: JAUNE, color: NAVY }}>2</div>
                <div>
                  <p className="text-sm font-semibold text-white">Le message s&apos;adapte automatiquement</p>
                  <p className="text-xs text-white/60">Le bouton devient &quot;caméléon&quot; : il change de texte selon où vous êtes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: JAUNE, color: NAVY }}>3</div>
                <div>
                  <p className="text-sm font-semibold text-white">Un clic = message WhatsApp envoyé</p>
                  <p className="text-xs text-white/60">Avec votre position GPS et l&apos;étape suivante du Hajj</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              <Link href="/hajj-omra" className="group">
                <Button size="lg" className="rounded-[10px] px-6 h-12 text-sm font-medium shadow-lg transition-all" style={{ backgroundColor: JAUNE, color: NAVY }}>
                  Découvrir Pass Identity
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Example messages card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5" style={{ color: JAUNE }} />
                Exemples de messages automatiques
              </h3>

              <div className="space-y-4">
                {/* Medina */}
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: '#10b981' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>Médine</span>
                  </div>
                  <p className="text-sm text-white/90 italic">
                    &quot;Bonjour la famille, je suis à Médine, tout se passe bien, je me repose avant le Hajj, à très bientôt inch&apos;Allah&quot;
                  </p>
                </div>

                {/* Mina */}
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: JAUNE }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: JAUNE }}>Mina</span>
                  </div>
                  <p className="text-sm text-white/90 italic">
                    &quot;Bonjour la famille, actuellement je suis en train de faire le Hajj à Mina, la prochaine étape c&apos;est Arafat, sinon tout se passe bien je vais super bien merci&quot;
                  </p>
                </div>

                {/* Arafat */}
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">Arafat</span>
                  </div>
                  <p className="text-sm text-white/90 italic">
                    &quot;Bonjour la famille, je suis à Arafat pour le jour le plus important du Hajj, la prochaine étape c&apos;est Muzdalifah, tout se passe bien alhamdulillah&quot;
                  </p>
                </div>

                {/* Mecque */}
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Mecque</span>
                  </div>
                  <p className="text-sm text-white/90 italic">
                    &quot;Bonjour la famille, je suis à la Mecque pour le Tawaf, tout se passe bien alhamdulillah, à très bientôt inch&apos;Allah&quot;
                  </p>
                </div>
              </div>

              {/* WhatsApp indicator */}
              <div className="mt-6 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#25D36620' }}>
                <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
                <span className="text-sm font-medium" style={{ color: '#25D366' }}>Envoyé automatiquement via WhatsApp</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SOLUTIONS — Numbered cards (HMC style 01/02/03)
   ══════════════════════════════════════════════════════════ */
function SolutionsSection() {
  const solutions = [
    {
      num: '01',
      title: 'Sans Application',
      subtitle: 'ZÉRO FRICTION',
      desc: "Aucun téléchargement, aucune inscription. Le QR code suffit — universel et instantané sur tout smartphone.",
      icon: Smartphone,
      gradient: 'from-violet-600 to-purple-500',
      href: '/fonctionnalites/sans-application',
    },
    {
      num: '02',
      title: 'Sans Batterie',
      subtitle: 'AUTONOMIE ILLIMITÉE',
      desc: "Pas de charge, pas de GPS tracker. Autonomie illimitée pour 5€/an — contre 30-150€+ pour un tracker.",
      icon: BatteryCharging,
      gradient: 'from-amber-600 to-yellow-500',
      href: '/fonctionnalites/sans-batterie',
    },
    {
      num: '03',
      title: 'Alertes WhatsApp',
      subtitle: 'NOTIFICATION INSTANTANÉE',
      desc: "Alerte WhatsApp avec carte interactive, position GPS du trouveur, et message personnalisé.",
      icon: MessageCircle,
      gradient: 'from-emerald-600 to-teal-500',
      href: '/fonctionnalites/alertes-whatsapp',
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_TINTED }}>
      <BlurOrb size="h-64 w-64" color={JAUNE} opacity={0.1} position="-bottom-24 -left-24" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <Overline>Découvrez notre univers</Overline>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight ${serif}`}
            style={{ color: INK }}
          >
            Une protection complète, sans compromis
          </h2>
          <p className="text-lg mt-4 max-w-2xl mx-auto" style={{ color: MUTED }}>
            Chaque fonctionnalité élimine la friction et maximise la récupération.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid lg:grid-cols-3 gap-8"
        >
          {solutions.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.num}
                variants={fadeUp}
                custom={i}
                className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:border-transparent transition-all duration-300"
              >
                {/* Gradient header */}
                <div className={`h-44 bg-gradient-to-br ${s.gradient} relative flex items-center justify-center`}>
                  <div className="bg-gradient-to-t from-black/40 to-transparent absolute inset-0" />
                  {/* Number */}
                  <span className="relative text-7xl font-bold text-white/20 select-none">{s.num}</span>
                  {/* Icon */}
                  <div className="absolute top-4 right-4 h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {/* Subtitle badge */}
                  <span className="absolute top-4 left-4 rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white tracking-wide">
                    {s.subtitle}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <h3 className={`text-xl font-semibold mb-3 ${serif}`} style={{ color: INK }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: MUTED }}>
                    {s.desc}
                  </p>
                  <Link
                    href={s.href}
                    className="group/link inline-flex items-center gap-1.5 text-sm font-medium transition-all"
                    style={{ color: NAVY }}
                  >
                    En savoir plus
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>

                <BlurOrb size="h-32 w-32" color={JAUNE} opacity={0.1} position="-top-16 -right-16" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   FEATURES GRID — Secondary features (HMC formations-style)
   ══════════════════════════════════════════════════════════ */
function FeaturesGrid() {
  const features = [
    {
      title: 'Géolocalisation Temps Réel',
      desc: 'Position GPS captée lors du scan. Précision 3-10m, couverture mondiale.',
      icon: MapPin,
      gradient: 'from-blue-600 to-cyan-500',
      href: '/fonctionnalites/geolocalisation',
    },
    {
      title: 'Sécurité RGPD',
      desc: 'Chiffrement AES-256, serveurs ISO 27001 en France, conformité CNIL.',
      icon: Lock,
      gradient: 'from-indigo-600 to-blue-500',
      href: '/fonctionnalites/securite-rgpd',
    },
    {
      title: 'Mode Hors-ligne',
      desc: "L'appli terrain fonctionne sans internet. Synchronisation automatique au retour de connexion.",
      icon: WifiOff,
      gradient: 'from-rose-600 to-red-500',
      href: '/manager',
    },
    {
      title: 'Hajj & Omra',
      desc: 'Solution dédiée pèlerins : 3 bagages inclus, 2 QR soute, alertes WhatsApp.',
      icon: Heart,
      gradient: 'from-emerald-600 to-teal-500',
      href: '/hajj-omra',
    },
    {
      title: 'Voyageurs Standard',
      desc: 'Forfaits 4€/7j ou 7€/an pour voyageurs indépendants. Aucune agence requise.',
      icon: Globe,
      gradient: 'from-amber-600 to-orange-500',
      href: '/voyageurs-standard',
    },
    {
      title: 'Dashboard Agence',
      desc: 'Gestion des voyages, OTP, stats de scan, groupes et synchronisation en temps réel.',
      icon: Shield,
      gradient: 'from-violet-600 to-purple-500',
      href: '/agency/login',
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_LIGHT }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <Overline>Explorez</Overline>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight ${serif}`} style={{ color: INK }}>
            Fonctionnalités & Solutions
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group relative flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:border-transparent transition-all duration-300"
              >
                {/* Gradient header */}
                <div className={`h-36 bg-gradient-to-br ${f.gradient} relative flex items-center justify-center`}>
                  <div className="bg-gradient-to-t from-black/40 to-transparent absolute inset-0" />
                  <Icon className="w-12 h-12 text-white/80 relative" />
                  <div className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  <h3 className={`text-lg font-semibold mb-2 ${serif}`} style={{ color: INK }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: MUTED }}>{f.desc}</p>
                  <Link href={f.href} className="group/link inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: NAVY }}>
                    Découvrir
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   HOW IT WORKS — 4 steps (HMC-style)
   ══════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { num: '01', title: 'Recevez votre QR', desc: "Votre agence vous remet des QR codes PassHajj — un par bagage enregistré.", icon: QrCode },
    { num: '02', title: 'Activez en 30 secondes', desc: "Scannez ou entrez le code. Remplissez les infos essentielles. C'est fait.", icon: Clock },
    { num: '03', title: 'Voyagez serein', desc: "Votre bagage est protégé. Pas de batterie, pas d'application, pas de GPS.", icon: Heart },
    { num: '04', title: 'Soyez notifié', desc: "Si quelqu'un scanne votre QR, alerte WhatsApp avec la position GPS.", icon: MessageCircle },
  ];

  return (
    <section id="comment" className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_TINTED }}>
      <BlurOrb size="h-40 w-40" color={NAVY} opacity={0.08} position="-top-20 -left-20" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-16">
          <Overline>Comment ça marche</Overline>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight ${serif}`} style={{ color: INK }}>
            4 étapes. 30 secondes. Zéro friction.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={i} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px border-t border-dashed" style={{ borderColor: `${NAVY}20` }} />
                )}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 shadow-lg" style={{ backgroundColor: NAVY }}>
                  <Icon className="w-10 h-10" style={{ color: JAUNE }} />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center shadow-md" style={{ backgroundColor: JAUNE, color: NAVY }}>
                    {step.num}
                  </span>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${serif}`} style={{ color: INK }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   TRANSPORT — Compact band
   ══════════════════════════════════════════════════════════ */
function TransportSection() {
  const transports = [
    { icon: Plane, label: 'Avion' },
    { icon: Ship, label: 'Bateau' },
    { icon: Bus, label: 'Bus' },
    { icon: Train, label: 'Train' },
  ];

  return (
    <section className="py-10 border-y" style={{ backgroundColor: BG_LIGHT, borderColor: '#d7dfe5' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: MUTED }}>
          Compatible avec tous les modes de transport
        </p>
        <div className="flex flex-wrap justify-center gap-8 sm:gap-14">
          {transports.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div key={t.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3" style={{ color: MUTED }}>
                <Icon className="w-7 h-7" />
                <span className="font-semibold text-sm">{t.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   PRICING — 3-column (HMC product cards style)
   ══════════════════════════════════════════════════════════ */
function PricingSection() {
  return (
    <section id="tarifs" className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_TINTED }}>
      <BlurOrb size="h-64 w-64" color={JAUNE} opacity={0.08} position="-bottom-24 -right-24" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-16">
          <Overline>Nos offres</Overline>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight ${serif}`} style={{ color: INK }}>
            Une solution pour chaque voyageur
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Hajj & Omra */}
          <motion.div variants={fadeUp} custom={0}>
            <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:border-transparent transition-all duration-300">
              <div className="h-36 bg-gradient-to-br from-[#1e3a5f] to-[#2e5a8f] relative flex items-center justify-center">
                <div className="bg-gradient-to-t from-black/40 to-transparent absolute inset-0" />
                <span className="relative text-5xl">🕋</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className={`text-xl font-semibold mb-1 ${serif}`} style={{ color: INK }}>Hajj & Omra</h3>
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: MUTED }}>Via votre agence</p>
                <div className="text-center mb-6 py-4 rounded-xl" style={{ backgroundColor: BG_TINTED }}>
                  <span className="text-3xl font-bold" style={{ color: NAVY }}>Inclus</span>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>dans votre forfait voyage</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['3 bagages protégés', '2 QR codes soute', 'Activation 30 secondes', 'Alertes WhatsApp', 'Géré par l\'agence', '98% récupération'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: INK }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/hajj-omra" className="group/link">
                  <Button className="w-full rounded-[10px] h-11 text-sm font-medium transition-all" style={{ backgroundColor: NAVY, color: '#fff' }}>
                    Découvrir
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Voyage unique */}
          <motion.div variants={fadeUp} custom={1}>
            <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:border-transparent transition-all duration-300">
              <div className="h-36 bg-gradient-to-br from-amber-600 to-yellow-500 relative flex items-center justify-center">
                <div className="bg-gradient-to-t from-black/40 to-transparent absolute inset-0" />
                <span className="relative text-5xl">✈️</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className={`text-xl font-semibold mb-1 ${serif}`} style={{ color: INK }}>Voyage unique</h3>
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: MUTED }}>Voyageurs indépendants</p>
                <div className="text-center mb-6 py-4 rounded-xl" style={{ backgroundColor: BG_TINTED }}>
                  <span className="text-3xl font-bold" style={{ color: NAVY }}>4€</span>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>7 jours</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['1-2 bagages protégés', '2 QR codes', 'Alertes WhatsApp', 'Notification email', 'Sans app / batterie / GPS', 'Support 24/7'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: INK }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/voyageurs-standard" className="group/link">
                  <Button className="w-full rounded-[10px] h-11 text-sm font-medium transition-all" style={{ backgroundColor: JAUNE, color: NAVY }}>
                    Commander
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Multi-voyages — POPULAIRE */}
          <motion.div variants={fadeUp} custom={2}>
            <div className="group relative flex flex-col h-full bg-white rounded-2xl border-2 overflow-hidden hover:shadow-2xl transition-all duration-300" style={{ borderColor: JAUNE }}>
              <div className="absolute top-0 right-0 z-10 text-xs font-bold px-4 py-1.5 rounded-bl-xl" style={{ backgroundColor: JAUNE, color: NAVY }}>POPULAIRE</div>
              <div className="h-36 bg-gradient-to-br from-[#1e3a5f] to-[#2e5a8f] relative flex items-center justify-center">
                <div className="bg-gradient-to-t from-black/40 to-transparent absolute inset-0" />
                <span className="relative text-5xl">🌍</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className={`text-xl font-semibold mb-1 ${serif}`} style={{ color: INK }}>Multi-voyages</h3>
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: MUTED }}>Voyageurs fréquents</p>
                <div className="text-center mb-6 py-4 rounded-xl" style={{ backgroundColor: BG_TINTED }}>
                  <span className="text-3xl font-bold" style={{ color: NAVY }}>7€</span>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>1 an</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {['1-2 bagages protégés', '2 QR codes', 'Support prioritaire', 'Statistiques de scan', 'Sans app / batterie / GPS', 'RGPD certifié'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: INK }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: JAUNE }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/voyageurs-standard" className="group/link">
                  <Button className="w-full rounded-[10px] h-11 text-sm font-medium transition-all" style={{ backgroundColor: NAVY, color: '#fff' }}>
                    Commander
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   TESTIMONIALS — Carousel-style (HMC)
   ══════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Mamadou Diallo', role: 'Pèlerin Hajj 2025', text: "Grâce à PassHajj, j'ai retrouvé mon bagage en moins de 2 heures à l'aéroport de Jeddah. Je ne voyagerai plus sans !", tag: 'Hajj' },
    { name: 'Amadou Diallo', role: 'Agence Pèlerins du Sénégal', text: "PassHajj a réduit nos pertes de bagages de 90%. L'activation prend 30 secondes, nos clients sont conquis.", tag: 'Agence' },
    { name: 'Sophie Martin', role: 'Voyageuse fréquente', text: "Simple, efficace, pas cher. J'ai choisi le forfait multi-voyages et je suis tranquille pour l'année.", tag: 'Standard' },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: BG_LIGHT }}>
      <BlurOrb size="h-40 w-40" color={NAVY} opacity={0.08} position="-top-20 -right-20" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center mb-16">
          <Overline>Témoignages</Overline>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight ${serif}`} style={{ color: INK }}>
            Ils nous font confiance
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} variants={fadeUp} custom={i} className="relative rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: BG_TINTED, borderColor: '#d7dfe5' }}>
              {/* Quote mark */}
              <span className={`text-5xl leading-none absolute top-4 left-6 ${serif}`} style={{ color: `${JAUNE}30` }}>&ldquo;</span>
              {/* Tag */}
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4" style={{ backgroundColor: `${JAUNE}15`, color: JAUNE }}>
                {t.tag}
              </span>
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: JAUNE }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 italic" style={{ color: MUTED }}>
                {t.text}
              </p>
              <div>
                <p className="font-semibold text-sm" style={{ color: INK }}>{t.name}</p>
                <p className="text-xs" style={{ color: MUTED }}>{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   CTA — Glassmorphism on dark (HMC "Parlons" style)
   ══════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: NAVY_DARK }}>
      {/* Blur orbs */}
      <BlurOrb size="h-96 w-96" color={JAUNE} opacity={0.12} position="top-0 right-0 translate-x-1/3 -translate-y-1/4" />
      <BlurOrb size="h-72 w-72" color={JAUNE_LIGHT} opacity={0.08} position="bottom-0 left-0 -translate-x-1/3 translate-y-1/4" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
          <motion.div variants={fadeUp}>
            <Overline color={JAUNE_LIGHT}>Prêt ?</Overline>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className={`text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-6 ${serif}`}
          >
            Protégeons vos bagages, ensemble
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Rejoignez plus de 500 agences et 10 000 voyageurs qui voyagent sereins avec PassHajj.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hajj-omra" className="group">
              <Button size="lg" className="rounded-[10px] px-6 h-12 text-sm font-medium shadow-lg transition-all" style={{ backgroundColor: JAUNE, color: NAVY }}>
                Hajj & Omra
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/devenir-partenaire" className="group">
              <Button size="lg" variant="outline" className="rounded-[10px] px-6 h-12 text-sm font-medium border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all">
                Devenir partenaire
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN HOME PAGE
   ══════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BG_LIGHT }}>
      <PublicNavigation />
      <main className="flex-1 pt-16">
        <HeroSection />
        <AboutSection />
        <NosPassSection />
        <RassurerLaFamilleSection />
        <SolutionsSection />
        <FeaturesGrid />
        <HowItWorksSection />
        <TransportSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  );
}
