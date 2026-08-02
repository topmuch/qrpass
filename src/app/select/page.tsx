'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/* ─── Animation keyframes (injected once) ─── */
const animationStyles = `
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.anim-fade-in-down { animation: fadeInDown 0.6s ease-out both; }
.anim-fade-in-up   { animation: fadeInUp   0.6s ease-out both; }
.anim-fade-in      { animation: fadeIn     0.5s ease-out both; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
`;

/* ─── Product data ─── */
interface Product {
  id: string;
  icon: string;
  title: string;
  badge?: string;
  description: string;
  features: string[];
  price: string;
  priceSub: string;
  cta: string;
  href: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'baggage',
    icon: '🧳',
    title: 'PassHajj Bagage',
    description: 'Étiquette connectée pour vos valises et sacs de pèlerinage',
    features: [
      'Alerte WhatsApp si perdu',
      'Géolocalisation incluse',
      'Activation flexible (15j/30j/1an)',
      'Photo du bagage',
    ],
    price: 'À partir de 2 500 FCFA',
    priceSub: 'Protection de 15 jours',
    cta: 'Choisir Pass Bagage',
    href: '/activate/baggage',
  },
  {
    id: 'identity',
    icon: '👤',
    title: 'PassHajj Identity',
    badge: 'Nouveau',
    description: 'Bracelet d\'urgence pour pèlerins âgés ou vulnérables',
    features: [
      'Infos médicales accessibles',
      'Contacts d\'urgence',
      'Localisation GPS en 1 clic',
      'Multilingue (FR/EN/AR)',
      'Hôtel modifiable à distance',
    ],
    price: 'À partir de 5 000 FCFA',
    priceSub: 'Bracelet silicone inclus',
    cta: 'Choisir Pass Identity',
    href: '/activate/identity',
  },
];

/* ─── Inner component (needs useSearchParams inside Suspense) ─── */
function SelectPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';

  const handleChoose = (href: string) => {
    const url = code ? `${href}?code=${encodeURIComponent(code)}` : href;
    router.push(url);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#f4b400' }}
    >
      {/* Inject animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* ─── Header / Logo ─── */}
      <header className="w-full px-4 pt-6 pb-2 anim-fade-in-down">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2">
          <span
            className="inline-flex items-center px-3 py-1 rounded-lg text-white font-bold text-xl tracking-tight"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            Pass
          </span>
          <span
            className="font-bold text-xl tracking-tight"
            style={{ color: '#1a1a1a' }}
          >
            Hajj
          </span>
        </div>
        <p
          className="text-center mt-2 text-sm font-medium anim-fade-in delay-200"
          style={{ color: '#1a1a1a' }}
        >
          Votre sécurité, notre prière 🕋
        </p>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 w-full px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Title section */}
          <div className="text-center mb-8 anim-fade-in-down delay-100">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight"
              style={{ color: '#1a1a1a' }}
            >
              Que souhaitez-vous protéger ?
            </h1>
            <p
              className="mt-2 text-base sm:text-lg"
              style={{ color: '#1a1a1a', opacity: 0.85 }}
            >
              Choisissez le produit adapté à vos besoins
            </p>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCTS.map((product, idx) => (
              <div
                key={product.id}
                className={`anim-fade-in-up delay-${(idx + 2) * 100}`}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  animationDelay: `${(idx + 2) * 0.1}s`,
                }}
              >
                {/* Icon + Title row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl" role="img" aria-label={product.title}>
                    {product.icon}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      className="text-lg sm:text-xl font-bold"
                      style={{ color: '#1a1a1a' }}
                    >
                      {product.title}
                    </h2>
                    {product.badge && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: '#22c55e' }}
                      >
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p
                  className="text-sm mb-4"
                  style={{ color: '#475569' }}
                >
                  {product.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: '#1a1a1a' }}
                    >
                      <span
                        className="mt-0.5 flex-shrink-0 font-bold"
                        style={{ color: '#22c55e' }}
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Price */}
                <div
                  className="rounded-xl px-4 py-3 mb-4"
                  style={{ backgroundColor: '#fef9c3' }}
                >
                  <p
                    className="font-bold text-base"
                    style={{ color: '#1a1a1a' }}
                  >
                    {product.price}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: '#6b7280' }}
                  >
                    {product.priceSub}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleChoose(product.href)}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                  style={{
                    backgroundColor: '#1a1a1a',
                    focusRingColor: '#1a1a1a',
                  }}
                  aria-label={product.cta}
                >
                  {product.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Agency Info Box */}
          <div
            className="mt-8 rounded-2xl px-6 py-5 text-center anim-fade-in delay-500"
            style={{
              backgroundColor: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.7)',
              animationDelay: '0.5s',
            }}
          >
            <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
              Vous êtes une agence de voyage ?{' '}
              <a
                href="/agencies"
                className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: '#1a1a1a' }}
              >
                En savoir plus
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer
        className="mt-auto w-full px-4 py-5 anim-fade-in"
        style={{ animationDelay: '0.6s' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-medium mb-2"
            style={{ color: '#1a1a1a', opacity: 0.7 }}
          >
            © 2026 PassHajj · Sécurité pour pèlerins Hajj & Omrah
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a
              href="/a-propos"
              className="hover:opacity-70 transition-opacity font-medium"
              style={{ color: '#1a1a1a' }}
            >
              À propos
            </a>
            <span style={{ color: '#1a1a1a', opacity: 0.3 }}>·</span>
            <a
              href="/contact"
              className="hover:opacity-70 transition-opacity font-medium"
              style={{ color: '#1a1a1a' }}
            >
              Aide
            </a>
            <span style={{ color: '#1a1a1a', opacity: 0.3 }}>·</span>
            <a
              href="/contact"
              className="hover:opacity-70 transition-opacity font-medium"
              style={{ color: '#1a1a1a' }}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Page export (with Suspense boundary for useSearchParams) ─── */
export default function SelectPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: '#f4b400' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: '#1a1a1a', borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
              Chargement...
            </p>
          </div>
        </div>
      }
    >
      <SelectPageInner />
    </Suspense>
  );
}
