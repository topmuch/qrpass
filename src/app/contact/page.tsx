'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  MessageCircle,
  Send,
  ArrowRight,
  Globe,
  Headphones
} from "lucide-react";

function ContactContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
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
          type: 'contact',
          senderName: formData.name,
          senderEmail: formData.email,
          content: { subject: formData.subject, message: formData.message },
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const NAVY = '#0c1d3a';
  const GOLD = '#f4b400';

  return (
    <>
      {/* Hero section */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY}dd)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: `${GOLD}10` }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '150px', height: '150px', borderRadius: '50%', background: `${GOLD}08` }} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contactez-nous
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Une question sur PassHajj ? Un projet de partenariat ? Notre équipe est là pour vous accompagner.
          </p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section style={{ background: '#f8fafc' }} className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20 relative z-10">
            {/* WhatsApp */}
            <a
              href="https://wa.me/33745349339"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
            >
              <div style={{ background: '#25D36615', width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle style={{ color: '#25D366' }} className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-500 text-sm mb-3">Réponse rapide garantie</p>
              <span style={{ color: '#25D366' }} className="font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Écrire sur WhatsApp <ArrowRight className="w-4 h-4" />
              </span>
            </a>

            {/* Email */}
            <a
              href="mailto:contact@qrbags.com"
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
            >
              <div style={{ background: `${GOLD}15`, width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail style={{ color: GOLD }} className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Email</h3>
              <p className="text-gray-500 text-sm mb-3">Réponse sous 24h ouvrées</p>
              <span style={{ color: NAVY }} className="font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Envoyer un email <ArrowRight className="w-4 h-4" />
              </span>
            </a>

            {/* Téléphone */}
            <a
              href="tel:+33745349339"
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
            >
              <div style={{ background: `${NAVY}10`, width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone style={{ color: NAVY }} className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-500 text-sm mb-3">+33 7 45 34 93 39</p>
              <span style={{ color: NAVY }} className="font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Appeler maintenant <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ background: '#f8fafc' }} className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info - Left side */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold mb-6" style={{ color: NAVY }}>Nos coordonnées</h2>

              {/* Adresse */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div style={{ background: `${GOLD}12`, minWidth: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin style={{ color: GOLD }} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: NAVY }}>Adresse</h3>
                  <p className="text-gray-500 text-sm">43 Rue Maryse Bastié</p>
                  <p className="text-gray-500 text-sm">78300 Poissy, France</p>
                </div>
              </div>

              {/* Horaires */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div style={{ background: `${NAVY}0a`, minWidth: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock style={{ color: NAVY }} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: NAVY }}>Horaires</h3>
                  <p className="text-gray-500 text-sm">Lun - Ven : 9h - 18h (CET)</p>
                  <p className="text-gray-500 text-sm">Support 24/7 pour les urgences</p>
                </div>
              </div>

              {/* Support */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div style={{ background: '#25D36610', minWidth: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Headphones style={{ color: '#25D366' }} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: NAVY }}>Support pèlerins</h3>
                  <p className="text-gray-500 text-sm">Assistance dédiée Hajj & Omrah</p>
                  <p className="text-gray-500 text-sm">Multilingue (FR, EN, AR)</p>
                </div>
              </div>

              {/* Site web */}
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div style={{ background: `${GOLD}12`, minWidth: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe style={{ color: GOLD }} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: NAVY }}>Site web</h3>
                  <p className="text-gray-500 text-sm">passhajjj.qrbags.com</p>
                </div>
              </div>

              {/* Map */}
              <a
                href="https://maps.google.com/?q=43+Rue+Maryse+Bastie+78300+Poissy+France"
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY}cc)` }}
                className="block rounded-xl p-5 text-center hover:shadow-lg transition-all"
              >
                <MapPin className="w-6 h-6 text-white/60 mx-auto mb-2" />
                <span className="text-white font-semibold text-sm">Voir sur Google Maps →</span>
              </a>
            </div>

            {/* Contact Form - Right side */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold mb-6" style={{ color: NAVY }}>Envoyez-nous un message</h2>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                {submitted ? (
                  <div className="text-center py-12">
                    <div style={{ background: `${GOLD}15`, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle style={{ color: '#10b981' }} className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3" style={{ color: NAVY }}>Message envoyé !</h3>
                    <p className="text-gray-500 mb-6">
                      Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      style={{ background: NAVY, color: '#fff' }}
                      className="hover:opacity-90"
                    >
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Nom *</label>
                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Email *</label>
                        <input
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Sujet</label>
                      <input
                        type="text"
                        placeholder="Objet de votre message"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: NAVY }}>Message *</label>
                      <textarea
                        placeholder="Décrivez votre demande..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 min-h-[160px] transition-all"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      style={{ background: GOLD, color: NAVY }}
                      className="w-full py-4 font-bold text-lg disabled:opacity-50 hover:opacity-90 rounded-xl"
                    >
                      {submitting ? 'Envoi en cours...' : <span className="inline-flex items-center gap-2"><Send className="w-5 h-5" /> Envoyer le message</span>}
                    </Button>

                    <p className="text-gray-400 text-sm text-center">
                      Nous répondons généralement sous 24h ouvrées.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ContactPage() {
  return (
    <PublicLayout>
      <ContactContent />
    </PublicLayout>
  );
}
