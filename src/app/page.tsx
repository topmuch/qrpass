'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import type { Language } from '@/lib/i18n';

const LandingChatbotWidget = dynamic(
  () => import('@/components/finder/LandingChatbotWidget'),
  { ssr: false, loading: () => null }
);
import TrackingWidget from '@/components/home/TrackingWidget';
import {
  Luggage,
  QrCode,
  Shield,
  Heart,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Smartphone,
  Users,
  Headphones,
  ScanLine,
  Globe,
  Phone,
  ChevronRight,
  ChevronLeft,
  LucideIcon,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Brand Constants
   ────────────────────────────────────────────── */
const BRAND = {
  primary: '#8e44ad',
  primaryDark: '#6c3483',
  secondary: '#27ae60',
  accent: '#c0392b',
  background: '#f8f9fa',
  cardShadow: '0 4px 12px rgba(142, 68, 173, 0.15)',
} as const;

/* ──────────────────────────────────────────────
   Animated Counter
   ────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ──────────────────────────────────────────────
   Fade-in wrapper
   ────────────────────────────────────────────── */
function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
  };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════ */
function Navigation() {
  const { t, lang, setLang, dir } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'ar', label: 'AR', flag: '🇸🇦' },
  ];

  return (
    <nav
      dir={dir}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-md'
          : 'bg-white/70 backdrop-blur-lg'
      }`}
      style={{ borderBottom: scrolled ? `1px solid ${BRAND.primary}15` : 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/images/passhajj-logo.png"
              alt="PassHajj"
              width={140}
              height={48}
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          {/* Language selector + Buttons (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    lang === l.code
                      ? 'bg-white text-[#8e44ad] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label={`Switch to ${l.label}`}
                >
                  <span className="mr-1">{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>

            <Link href="/agence/connexion">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-[#8e44ad] font-medium text-sm"
              >
                {t('homepage.nav.login')}
              </Button>
            </Link>
            <Link href="/inscrire">
              <Button
                className="text-white font-semibold text-sm rounded-full px-6 h-10 shadow-lg transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${BRAND.primary}40`,
                }}
              >
                {t('homepage.nav.register')}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700 p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-gray-100 space-y-1">
                {/* Language selector mobile */}
                <div className="flex items-center gap-1 px-3 pb-3">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                        lang === l.code
                          ? 'bg-[#8e44ad] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className="mr-1">{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
                </div>

                <hr className="border-gray-100 my-2" />

                <Link href="/agence/connexion" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-gray-600 font-medium justify-start"
                  >
                    {t('homepage.nav.login')}
                  </Button>
                </Link>
                <Link href="/inscrire" onClick={() => setIsOpen(false)}>
                  <Button
                    className="w-full text-white font-medium rounded-full mt-1"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
                    }}
                  >
                    {t('homepage.nav.register')}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   HERO SECTION
   ══════════════════════════════════════════════ */
function HeroSection() {
  const { t, dir } = useTranslation();

  return (
    <section
      dir={dir}
      className="relative pt-20 lg:pt-24 overflow-hidden min-h-[90vh] flex items-center"
    >
      {/* Background image with violet overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/passhajj-hero-bg.png"
          alt="PassHajj - Pèlerinage"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, rgba(142, 68, 173, 0.85) 0%, rgba(108, 52, 131, 0.9) 50%, rgba(39, 174, 96, 0.75) 100%)`,
          }}
        />
      </div>

      {/* Decorative geometric pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-20 left-10 w-32 h-32 border-2 border-white rounded-full"
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-32 right-20 w-24 h-24 border-2 border-white rounded-full"
          style={{ animation: 'pulse 3s ease-in-out infinite 1s' }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-16 h-16 border border-white rounded-full"
          style={{ animation: 'pulse 5s ease-in-out infinite 0.5s' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Title */}
          <FadeIn direction="up" delay={0}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-4 leading-[1.05] tracking-[-0.02em]">
              {t('homepage.hero.title')}
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn direction="up" delay={0.15}>
            <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-10 font-light">
              {t('homepage.hero.subtitle')}
            </p>
          </FadeIn>

          {/* Product cards */}
          <FadeIn direction="up" delay={0.3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10 max-w-2xl mx-auto">
              {/* PassHajj Bagage Card */}
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3 }}
                className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-6 text-center cursor-pointer"
                style={{ boxShadow: BRAND.cardShadow }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center">
                  <Luggage className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  PassHajj Bagage
                </h3>
                <p className="text-sm text-white/75">
                  {t('homepage.products.bagage.description')}
                </p>
              </motion.div>

              {/* PassHajj Identity Card */}
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3 }}
                className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-6 text-center cursor-pointer"
                style={{ boxShadow: BRAND.cardShadow }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  PassHajj Identity
                </h3>
                <p className="text-sm text-white/75">
                  {t('homepage.products.identity.description')}
                </p>
              </motion.div>
            </div>
          </FadeIn>

          {/* Main CTA */}
          <FadeIn direction="up" delay={0.45}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/hajj/activate">
                <Button
                  className="bg-white hover:bg-gray-50 text-[#8e44ad] font-bold text-base px-8 py-4 rounded-full shadow-xl transition-all duration-300 hover:scale-[1.03] gap-2 h-14"
                  style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
                >
                  <QrCode className="w-5 h-5" />
                  {t('homepage.hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-white/70 text-sm">
              <Link
                href="/agence/connexion"
                className="underline hover:text-white transition-colors"
              >
                {t('homepage.hero.login')}
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   PRODUCTS SECTION
   ══════════════════════════════════════════════ */
function ProductCard({
  icon: Icon,
  secondaryIcon: SecondaryIcon,
  title,
  description,
  features,
  learnMoreHref,
  activateHref,
  accentColor,
  delay = 0,
}: {
  icon: LucideIcon;
  secondaryIcon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  learnMoreHref: string;
  activateHref: string;
  accentColor: string;
  delay?: number;
}) {
  const { t, dir } = useTranslation();

  return (
    <FadeIn direction="up" delay={delay}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl overflow-hidden h-full flex flex-col"
        style={{ boxShadow: BRAND.cardShadow }}
      >
        {/* Card header with gradient */}
        <div
          className="px-6 py-8 text-white text-center"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${BRAND.primaryDark} 100%)`,
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <SecondaryIcon className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-white/80 text-sm mt-1">{description}</p>
        </div>

        {/* Features list */}
        <div className="px-6 py-6 flex-1" dir={dir}>
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: accentColor }}
                />
                <span className="text-gray-700 text-sm leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3" dir={dir}>
          <Link href={learnMoreHref} className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-full font-semibold text-sm border-gray-200 hover:border-[#8e44ad] hover:text-[#8e44ad] transition-all"
            >
              {t('homepage.products.learn_more')}
            </Button>
          </Link>
          <Link href={activateHref} className="flex-1">
            <Button
              className="w-full text-white font-semibold text-sm rounded-full transition-all hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${BRAND.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${accentColor}40`,
              }}
            >
              {t('homepage.products.activate_now')}
            </Button>
          </Link>
        </div>
      </motion.div>
    </FadeIn>
  );
}

function ProductsSection() {
  const { t, dir } = useTranslation();

  const bagageFeatures = [
    t('homepage.products.bagage.feature1'),
    t('homepage.products.bagage.feature2'),
    t('homepage.products.bagage.feature3'),
    t('homepage.products.bagage.feature4'),
  ];

  const identityFeatures = [
    t('homepage.products.identity.feature1'),
    t('homepage.products.identity.feature2'),
    t('homepage.products.identity.feature3'),
    t('homepage.products.identity.feature4'),
  ];

  return (
    <section dir={dir} className="py-16 md:py-24" style={{ background: BRAND.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn direction="up">
          <div className="text-center mb-12">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-4"
              style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)` }}
            >
              {t('homepage.products.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              {t('homepage.products.title')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('homepage.products.subtitle')}
            </p>
          </div>
        </FadeIn>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          <ProductCard
            icon={Luggage}
            secondaryIcon={QrCode}
            title={t('homepage.products.bagage.title')}
            description={t('homepage.products.bagage.description')}
            features={bagageFeatures}
            learnMoreHref="/hajj-omra"
            activateHref="/hajj/activate"
            accentColor={BRAND.primary}
            delay={0}
          />
          <ProductCard
            icon={Shield}
            secondaryIcon={Heart}
            title={t('homepage.products.identity.title')}
            description={t('homepage.products.identity.description')}
            features={identityFeatures}
            learnMoreHref="/hajj-omra"
            activateHref="/pilgrim/activate"
            accentColor={BRAND.secondary}
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   HOW IT WORKS SECTION
   ══════════════════════════════════════════════ */
function StepsSection() {
  const { t, dir } = useTranslation();

  const steps = [
    {
      number: '1',
      icon: ScanLine,
      title: t('homepage.steps.step1.title'),
      description: t('homepage.steps.step1.description'),
      color: BRAND.primary,
    },
    {
      number: '2',
      icon: Luggage,
      title: t('homepage.steps.step2.title'),
      description: t('homepage.steps.step2.description'),
      color: BRAND.secondary,
    },
    {
      number: '3',
      icon: MapPin,
      title: t('homepage.steps.step3.title'),
      description: t('homepage.steps.step3.description'),
      color: BRAND.accent,
    },
  ];

  return (
    <section dir={dir} className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn direction="up">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-4"
              style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)` }}
            >
              {t('homepage.steps.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              {t('homepage.steps.title')}
            </h2>
          </div>
        </FadeIn>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {steps.map((step, idx) => (
            <FadeIn key={idx} direction="up" delay={idx * 0.15}>
              <div className="text-center relative">
                {/* Connector line (desktop only) */}
                {idx < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] opacity-20"
                    style={{
                      background: `linear-gradient(90deg, ${step.color}, ${steps[idx + 1].color})`,
                    }}
                  />
                )}

                {/* Step number circle */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}15, ${step.color}25)`,
                      border: `2px solid ${step.color}30`,
                    }}
                  >
                    <step.icon
                      className="w-10 h-10"
                      style={{ color: step.color }}
                    />
                  </div>
                  <span
                    className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: step.color }}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   STATS SECTION
   ══════════════════════════════════════════════ */
function StatsSection() {
  const { t, dir } = useTranslation();

  const stats = [
    { value: 10000, suffix: '+', label: t('homepage.stats.pilgrims') },
    { value: 98, suffix: '%', label: t('homepage.stats.recovery') },
    { value: 15, suffix: '+', label: t('homepage.stats.countries') },
    { value: 24, suffix: '/7', label: t('homepage.stats.support') },
  ];

  return (
    <section
      dir={dir}
      className="py-14 md:py-20"
      style={{
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <FadeIn key={idx} direction="up" delay={idx * 0.1}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/70 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   AGENCIES SECTION (B2B)
   ══════════════════════════════════════════════ */
function AgenciesSection() {
  const { t, dir } = useTranslation();

  const features = [
    {
      icon: Users,
      title: t('homepage.agencies.feature1_title'),
      description: t('homepage.agencies.feature1_desc'),
    },
    {
      icon: Globe,
      title: t('homepage.agencies.feature2_title'),
      description: t('homepage.agencies.feature2_desc'),
    },
    {
      icon: Headphones,
      title: t('homepage.agencies.feature3_title'),
      description: t('homepage.agencies.feature3_desc'),
    },
  ];

  return (
    <section dir={dir} className="py-16 md:py-24" style={{ background: BRAND.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <FadeIn direction="left">
            <div>
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-4"
                style={{ background: BRAND.secondary }}
              >
                {t('homepage.agencies.badge')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                {t('homepage.agencies.title')}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {t('homepage.agencies.description')}
              </p>

              <Link href="/devenir-partenaire">
                <Button
                  className="text-white font-bold text-base px-8 py-4 rounded-full shadow-xl transition-all duration-300 hover:scale-[1.03] gap-2 h-14"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.secondary} 0%, #1e8449 100%)`,
                    boxShadow: `0 8px 30px ${BRAND.secondary}40`,
                  }}
                >
                  {t('homepage.agencies.cta')}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>

          {/* Right - Feature cards */}
          <FadeIn direction="right" delay={0.2}>
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: dir === 'rtl' ? -6 : 6, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl p-5 flex items-start gap-4"
                  style={{ boxShadow: BRAND.cardShadow }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND.primary}15, ${BRAND.primary}25)`,
                    }}
                  >
                    <feature.icon
                      className="w-6 h-6"
                      style={{ color: BRAND.primary }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════ */
function Footer() {
  const { t, lang, setLang, dir } = useTranslation();

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
  ];

  return (
    <footer
      dir={dir}
      className="bg-gray-900 text-white"
      style={{ borderTop: `3px solid ${BRAND.primary}` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Image
              src="/images/passhajj-logo.png"
              alt="PassHajj"
              width={120}
              height={40}
              className="h-8 w-auto brightness-0 invert"
            />
            <p className="text-gray-400 text-sm text-center md:text-left">
              {t('homepage.footer.copyright')}
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/mentions-legales"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t('homepage.footer.legal')}
            </Link>
            <Link
              href="/confidentialite"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t('homepage.footer.privacy')}
            </Link>
            <Link
              href="/contact"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t('homepage.footer.contact')}
            </Link>
          </div>

          {/* Language flags */}
          <div className="flex items-center gap-2 text-sm">
            {languages.map((l, idx) => (
              <span key={l.code} className="flex items-center">
                <button
                  onClick={() => setLang(l.code)}
                  className={`transition-colors ${
                    lang === l.code ? 'text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
                {idx < languages.length - 1 && (
                  <span className="ml-2 text-gray-600">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════
   MAIN HOMEPAGE
   ══════════════════════════════════════════════ */
export default function HomePage() {
  const { dir, isLoading } = useTranslation();

  // Show loading state while translations load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.background }}>
        <div className="text-center">
          <Image
            src="/images/passhajj-logo.png"
            alt="PassHajj"
            width={120}
            height={40}
            className="h-10 w-auto mx-auto mb-4 animate-pulse"
          />
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: BRAND.primary, borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col"
      style={{ direction: dir }}
    >
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <TrackingWidget />
        <ProductsSection />
        <StepsSection />
        <StatsSection />
        <AgenciesSection />
      </main>
      <Footer />
      <LandingChatbotWidget />
    </div>
  );
}
