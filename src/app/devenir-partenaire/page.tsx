'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  QrCode,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  CheckCircle,
  Send,
  ArrowRight,
  Shield,
  TrendingUp,
  Award,
} from "lucide-react";
import { PublicNavigation, PublicFooter } from '@/components/public/PublicLayout';

/* ══════════════════════════════════════════════════════════
   BRAND — same palette as main site
   ══════════════════════════════════════════════════════════ */
const NAVY = '#1e3a5f';
const JAUNE = '#f4b400';
const JAUNE_DARK = '#d97706';

// Hero Section
function HeroSection() {
  return (
    <section className="pt-28 pb-20 px-4 bg-gradient-to-br from-[#f9fcfe] via-white to-[#f0f7ff] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1e3a5f]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#f4b400]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="px-4 py-2 bg-[#f4b400]/10 border border-[#f4b400]/30 text-[#d97706] text-sm rounded-full font-medium">
            🤝 Programme Partenaire
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[#0b111f] mb-6">
          Devenez partenaire <span className="text-[#1e3a5f]">PassHajj</span>
        </h1>

        <p className="text-[#515963] max-w-2xl mx-auto mb-8 text-lg">
          Rejoignez plus de 500 agences de voyage et organisateurs de Hajj qui protègent déjà les bagages de leurs clients avec nos QR codes intelligents.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#formulaire">
            <button className="bg-[#1e3a5f] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#0f2240] shadow-lg shadow-[#1e3a5f]/20 transition-all hover:scale-105 inline-flex items-center gap-2">
              📩 Demander un devis
            </button>
          </a>
          <a href="#avantages">
            <button className="border-2 border-[#1e3a5f] text-[#1e3a5f] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#1e3a5f]/5 transition-all inline-flex items-center gap-2">
              📊 Voir les avantages
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}

// Why Partner Section
function WhyPartnerSection() {
  const cards = [
    {
      title: "Revenus supplémentaires",
      desc: "Gagnez jusqu'à 3€ par QR code vendu — sans investissement.",
      icon: <TrendingUp className="w-8 h-8" />,
    },
    {
      title: "Service clé en main",
      desc: "Nous fournissons les QR codes, le dashboard, le support 24/7.",
      icon: <Shield className="w-8 h-8" />,
    },
    {
      title: "Confiance renforcée",
      desc: "Vos clients retrouvent leurs bagages en moins de 2h — votre réputation s'élève.",
      icon: <Award className="w-8 h-8" />,
    },
  ];

  return (
    <section id="avantages" className="py-20 px-4 bg-[#f0f7ff]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">
            Pourquoi collaborer avec nous ?
          </h2>
          <p className="text-[#515963] text-lg">
            Trois raisons de devenir partenaire PassHajj
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-[#f4b400]/50 shadow-sm hover:shadow-md transition-all hover:scale-105 group"
            >
              <div className="text-[#1e3a5f] mb-4 group-hover:scale-110 transition-transform">{card.icon}</div>
              <h3 className="text-xl font-bold text-[#0b111f] mb-2">{card.title}</h3>
              <p className="text-[#515963]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Who Can Partner Section
function WhoCanPartnerSection() {
  const partners = [
    { icon: "✈️", label: "Agences de voyages (Hajj, Omra, tourisme)" },
    { icon: "🕋", label: "Tour-opérateurs" },
    { icon: "🤝", label: "Organisateurs de pèlerinage" },
    { icon: "🛫", label: "Compagnies aériennes (B2B)" },
    { icon: "🕌", label: "Associations religieuses" },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">
            Qui peut devenir partenaire ?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-[#f9fcfe] p-4 rounded-xl border border-slate-200 hover:border-[#1e3a5f]/30 transition-all"
            >
              <span className="text-3xl">{partner.icon}</span>
              <span className="text-[#0b111f] font-medium">{partner.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Amadou Diallo",
      role: "Directeur, Pèlerins du Sénégal",
      text: "PassHajj a réduit de 90% les pertes de bagages lors du Hajj 2025. Un service révolutionnaire.",
      avatar: "AD"
    },
    {
      name: "Sophie Martin",
      role: "Responsable client, Voyage Senegal",
      text: "Simple, efficace et pas cher. Nos clients adorent la notification WhatsApp instantanée.",
      avatar: "SM"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#f0f7ff]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[#1e3a5f] mb-12">
          Ce que disent nos partenaires
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-[#0b111f]">{t.name}</div>
                  <div className="text-[#515963] text-sm">{t.role}</div>
                </div>
              </div>
              <p className="text-[#515963] italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-[#f4b400]">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Form Section
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partenaire',
          senderName: formData.name,
          senderEmail: formData.email,
          content: {
            agence: formData.company,
            message: formData.message,
          },
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="formulaire" className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#f9fcfe] rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-bold text-[#0b111f] mb-2">Prêt à booster votre offre ?</h3>
          <p className="text-[#515963] mb-8">
            Remplissez ce formulaire — nous vous répondrons sous 24h avec un devis personnalisé.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-[#f4b400] mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-[#0b111f] mb-2">Demande envoyée !</h4>
              <p className="text-[#515963]">Nous vous contacterons sous 24h avec votre devis personnalisé.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Votre nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-[#0b111f] placeholder-slate-400 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/30 transition-colors"
                required
              />
              <input
                type="email"
                placeholder="Votre email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-[#0b111f] placeholder-slate-400 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/30 transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Votre agence / entreprise"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-[#0b111f] placeholder-slate-400 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/30 transition-colors"
                required
              />
              <textarea
                placeholder="Message (ex: nombre de pèlerins, pays, besoins...)"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-4 bg-white border border-slate-300 rounded-xl text-[#0b111f] placeholder-slate-400 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/30 transition-colors resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1e3a5f] text-white py-4 rounded-xl font-bold hover:bg-[#0f2240] transition-all hover:scale-[1.02] shadow-lg shadow-[#1e3a5f]/20 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// Main Page Component
export default function DevenirPartenairePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavigation />
      <main className="flex-1 pt-20">
        <HeroSection />
        <WhyPartnerSection />
        <WhoCanPartnerSection />
        <TestimonialsSection />
        <ContactFormSection />
      </main>
      <PublicFooter />
    </div>
  );
}
