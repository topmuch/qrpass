'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavigation, PublicFooter } from '@/components/public/PublicLayout';

/* ══════════════════════════════════════════════════════════
   BRAND COLORS
   ══════════════════════════════════════════════════════════ */
const JAUNE = '#f4b400';
const BLEU_MARINE = '#1e3a5f';

/* ══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ══════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ══════════════════════════════════════════════════════════
   HERO SECTION
   ══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#1a3355] to-[#0f2240]" />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#f4b400]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f4b400]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-[#f4b400]" />
                Protection intelligente des bagages
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
            >
              Protégez chaque bagage,{' '}
              <span className="text-[#f4b400]">en toute sérénité</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-white/70 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
            >
              La première solution sans application, sans batterie, sans GPS.
              Un simple QR code pour protéger, retrouver et notifier — instantanément.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/hajj-omra">
                <Button
                  size="lg"
                  className="bg-[#f4b400] hover:bg-[#d97706] text-[#1e3a5f] font-bold text-base rounded-xl px-8 h-14 shadow-xl shadow-[#f4b400]/25 hover:shadow-[#f4b400]/40 transition-all duration-300"
                >
                  Hajj & Omra
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold text-base rounded-xl px-8 h-14 backdrop-blur-sm transition-all duration-300"
                >
                  Voir la démo
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start text-white/60 text-sm"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                10 000+ bagages protégés
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                98% de récupération
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#f4b400]" />
                500+ agences
              </span>
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:flex justify-center items-center"
          >
            <div className="relative w-[420px] h-[420px]">
              {/* Rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#f4b400]/20 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-6 rounded-full border border-white/10" />

              {/* Center QR code visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-white rounded-2xl shadow-2xl flex items-center justify-center p-6">
                  <QrCode className="w-full h-full text-[#1e3a5f]" strokeWidth={1.5} />
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-8 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <WifiOff className="w-3.5 h-3.5" />
                Hors-ligne
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-12 left-2 bg-[#f4b400] text-[#1e3a5f] px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                30 secondes
              </motion.div>

              <motion.div
                animate={{ y: [-3, 7, -3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-24 -left-4 bg-white text-[#1e3a5f] px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                WhatsApp
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   TRUST BAR (Stats)
   ══════════════════════════════════════════════════════════ */
function TrustBar() {
  const stats = [
    { value: '10 000+', label: 'Bagages protégés', icon: Shield },
    { value: '98%', label: 'Taux de récupération', icon: CheckCircle },
    { value: '500+', label: 'Agences partenaires', icon: Users },
    { value: '24/7', label: 'Support disponible', icon: Phone },
  ];

  return (
    <section className="relative -mt-1 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f4b400]/10 mb-3">
                  <Icon className="w-5 h-5 text-[#f4b400]" />
                </div>
                <p
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                  style={{ color: BLEU_MARINE }}
                >
                  {stat.value}
                </p>
                <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SOLUTIONS SECTION
   ══════════════════════════════════════════════════════════ */
function SolutionsSection() {
  const features = [
    {
      icon: Smartphone,
      title: 'Sans Application',
      desc: "Aucun téléchargement, aucune inscription. Le QR code suffit — universel et instantané.",
      color: '#8b5cf6',
      href: '/fonctionnalites/sans-application',
    },
    {
      icon: BatteryCharging,
      title: 'Sans Batterie',
      desc: "Pas de charge, pas de GPS tracker. Autonomie illimitée, coût minimal (5€/an).",
      color: '#f59e0b',
      href: '/fonctionnalites/sans-batterie',
    },
    {
      icon: MapPin,
      title: 'Géolocalisation',
      desc: "Position GPS temps réel captée lors du scan. Précision 3-10m, couverture mondiale.",
      color: '#10b981',
      href: '/fonctionnalites/geolocalisation',
    },
    {
      icon: MessageCircle,
      title: 'Alertes WhatsApp',
      desc: "Notification instantanée avec carte interactive, message du trouveur et GPS.",
      color: '#25D366',
      href: '/fonctionnalites/alertes-whatsapp',
    },
    {
      icon: Lock,
      title: 'Sécurité RGPD',
      desc: "Chiffrement AES-256, serveurs ISO 27001 en France, conformité CNIL. Zéro revente de données.",
      color: '#3b82f6',
      href: '/fonctionnalites/securite-rgpd',
    },
    {
      icon: WifiOff,
      title: 'Mode Hors-ligne',
      desc: "L'appli terrain fonctionne sans internet. Scans et incidents synchronisés au retour de connexion.",
      color: '#ef4444',
      href: '/manager',
    },
  ];

  return (
    <section id="solutions" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: JAUNE }}
          >
            Solutions
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: BLEU_MARINE }}
          >
            Une protection complète, sans compromis
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Chaque fonctionnalité est conçue pour éliminer la friction et maximiser la récupération.
          </p>
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
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Link
                  href={f.href}
                  className="group block bg-white rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-lg border border-slate-100 hover:border-slate-200 transition-all duration-300 h-full"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: f.color + '12', color: f.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: BLEU_MARINE }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">
                    {f.desc}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold transition-all duration-200 group-hover:gap-2"
                    style={{ color: f.color }}
                  >
                    En savoir plus
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   HOW IT WORKS SECTION
   ══════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Recevez votre QR',
      desc: "Votre agence vous remet des QR codes PassHajj — un par bagage enregistré.",
      icon: QrCode,
      image: '/images/landing-v2/step-receive.jpg',
    },
    {
      num: '02',
      title: 'Activez en 30 secondes',
      desc: "Scannez ou entrez le code. Remplissez les infos essentielles. C'est fait.",
      icon: Clock,
      image: '/images/landing-v2/step-activate.jpg',
    },
    {
      num: '03',
      title: 'Voyagez serein',
      desc: "Votre bagage est protégé. Pas de batterie, pas d'application, pas de GPS.",
      icon: Heart,
      image: '/images/landing-v2/step-travel.jpg',
    },
    {
      num: '04',
      title: 'Soyez notifié',
      desc: "Si quelqu'un scanne votre QR, vous recevez une alerte WhatsApp avec la position GPS.",
      icon: MessageCircle,
      image: '/images/landing-v2/step-notify.jpg',
    },
  ];

  return (
    <section id="comment" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: JAUNE }}
          >
            Comment ça marche
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: BLEU_MARINE }}
          >
            4 étapes. 30 secondes. Zéro friction.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
                className="relative group"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px bg-slate-200" />
                )}

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1e3a5f] mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Icon className="w-8 h-8 text-[#f4b400]" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#f4b400] text-[#1e3a5f] rounded-lg text-xs font-extrabold flex items-center justify-center shadow-md">
                      {step.num}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: BLEU_MARINE }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCTS / PRICING SECTION
   ══════════════════════════════════════════════════════════ */
function PricingSection() {
  return (
    <section id="tarifs" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: JAUNE }}
          >
            Nos offres
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: BLEU_MARINE }}
          >
            Une solution pour chaque voyageur
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {/* Hajj & Omra */}
          <motion.div variants={fadeUp} custom={0}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
              <div className="bg-[#1e3a5f] p-6 text-center">
                <span className="text-2xl">🕋</span>
                <h3 className="text-xl font-bold text-white mt-2">
                  Hajj & Omra
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Via votre agence
                </p>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <span
                    className="text-4xl font-extrabold"
                    style={{ color: BLEU_MARINE }}
                  >
                    Inclus
                  </span>
                  <p className="text-slate-400 text-sm mt-1">
                    dans votre forfait voyage
                  </p>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {[
                    '3 bagages protégés',
                    '2 QR codes soute',
                    'Activation 30 secondes',
                    'Alertes WhatsApp',
                    'Géré par l\'agence',
                    '98% récupération',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/hajj-omra" className="block">
                  <Button className="w-full bg-[#1e3a5f] hover:bg-[#15304d] text-white font-semibold rounded-xl h-12 transition-all">
                    Découvrir
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Voyage unique */}
          <motion.div variants={fadeUp} custom={1}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
              <div className="bg-[#f4b400] p-6 text-center">
                <span className="text-2xl">✈️</span>
                <h3 className="text-xl font-bold text-[#1e3a5f] mt-2">
                  Voyage unique
                </h3>
                <p className="text-[#1e3a5f]/60 text-sm mt-1">
                  Voyageurs indépendants
                </p>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <span
                    className="text-4xl font-extrabold"
                    style={{ color: BLEU_MARINE }}
                  >
                    4€
                  </span>
                  <p className="text-slate-400 text-sm mt-1">7 jours</p>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {[
                    '1-2 bagages protégés',
                    '2 QR codes',
                    'Alertes WhatsApp',
                    'Notification email',
                    'Sans app / batterie / GPS',
                    'Support 24/7',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/voyageurs-standard" className="block">
                  <Button className="w-full bg-[#f4b400] hover:bg-[#d97706] text-[#1e3a5f] font-semibold rounded-xl h-12 transition-all">
                    Commander
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Multi-voyages */}
          <motion.div variants={fadeUp} custom={2}>
            <div className="relative bg-white rounded-2xl shadow-sm border-2 border-[#f4b400] overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 bg-[#f4b400] text-[#1e3a5f] text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                POPULAIRE
              </div>
              <div className="bg-[#1e3a5f] p-6 text-center">
                <span className="text-2xl">🌍</span>
                <h3 className="text-xl font-bold text-white mt-2">
                  Multi-voyages
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Voyageurs fréquents
                </p>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <span
                    className="text-4xl font-extrabold"
                    style={{ color: BLEU_MARINE }}
                  >
                    7€
                  </span>
                  <p className="text-slate-400 text-sm mt-1">1 an</p>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {[
                    '1-2 bagages protégés',
                    '2 QR codes',
                    'Support prioritaire',
                    'Statistiques de scan',
                    'Sans app / batterie / GPS',
                    'RGPD certifié',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/voyageurs-standard" className="block">
                  <Button className="w-full bg-[#1e3a5f] hover:bg-[#15304d] text-white font-semibold rounded-xl h-12 transition-all">
                    Commander
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
   TRANSPORT PARTNERS
   ══════════════════════════════════════════════════════════ */
function TransportSection() {
  const transports = [
    { icon: Plane, label: 'Avion', image: '/images/landing-v2/transport-avion.jpg' },
    { icon: Ship, label: 'Bateau', image: '/images/landing-v2/transport-bateau.jpg' },
    { icon: Bus, label: 'Bus', image: '/images/landing-v2/transport-bus.jpg' },
    { icon: Train, label: 'Train', image: '/images/landing-v2/transport-train.jpg' },
  ];

  return (
    <section className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-slate-400 text-sm font-medium uppercase tracking-wider mb-8">
          Compatible avec tous les modes de transport
        </p>
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
          {transports.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-slate-400"
              >
                <Icon className="w-8 h-8" />
                <span className="font-semibold text-base">{t.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   TESTIMONIALS SECTION
   ══════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Mamadou Diallo',
      role: 'Pèlerin Hajj 2025',
      text: "Grâce à PassHajj, j'ai retrouvé mon bagage en moins de 2 heures à l'aéroport de Jeddah. Je ne voyagerai plus sans !",
      rating: 5,
    },
    {
      name: 'Amadou Diallo',
      role: 'Agence Pèlerins du Sénégal',
      text: "PassHajj a réduit nos pertes de bagages de 90%. L'activation prend 30 secondes, nos clients sont conquis.",
      rating: 5,
    },
    {
      name: 'Sophie Martin',
      role: 'Voyageuse fréquente',
      text: "Simple, efficace, pas cher. J'ai choisi le forfait multi-voyages et je suis tranquille pour l'année.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: JAUNE }}
          >
            Témoignages
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            style={{ color: BLEU_MARINE }}
          >
            Ils nous font confiance
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              custom={i}
              className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 text-[#f4b400] fill-[#f4b400]"
                  />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p
                  className="font-bold text-sm"
                  style={{ color: BLEU_MARINE }}
                >
                  {t.name}
                </p>
                <p className="text-slate-400 text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   CTA SECTION
   ══════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-[#1e3a5f] via-[#1a3355] to-[#0f2240] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f4b400]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
            Prêt à protéger vos bagages&nbsp;?
          </h2>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Rejoignez plus de 500 agences et 10 000 voyageurs qui voyagent sereins avec PassHajj.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hajj-omra">
              <Button
                size="lg"
                className="bg-[#f4b400] hover:bg-[#d97706] text-[#1e3a5f] font-bold text-base rounded-xl px-8 h-14 shadow-xl shadow-[#f4b400]/25 transition-all"
              >
                Hajj & Omra
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-base rounded-xl px-8 h-14 backdrop-blur-sm transition-all"
              >
                Devenir partenaire
              </Button>
            </Link>
          </div>
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
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavigation />
      <main className="flex-1 pt-16">
        <HeroSection />
        <TrustBar />
        <SolutionsSection />
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
