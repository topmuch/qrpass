'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/* ─── Animation keyframes ─── */
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
`;

/* ─── Product data (2 bagage QR, 1 identity QR, 2 months) ─── */
interface Product {
  id: string;
  icon: string;
  title: string;
  badge?: string;
  badgeColor?: string;
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
    title: 'Pass Bagage',
    description: 'Étiquette connectée pour vos valises de soute (2 QR codes inclus)',
    features: [
      '2 QR codes pour bagages de soute',
      'Alerte WhatsApp si perdu',
      'Géolocalisation incluse',
      'Protection 2 mois dès activation',
    ],
    price: 'À partir de 2 500 FCFA',
    priceSub: 'Protection de 2 mois',
    cta: 'Choisir Pass Bagage',
    href: '/activate/baggage',
  },
  {
    id: 'identity',
    icon: '👤',
    title: 'Pass Identity',
    badge: 'Nouveau',
    badgeColor: '#10b981',
    description: 'Bracelet d\'urgence pour pèlerins (1 QR code bracelet)',
    features: [
      'Infos médicales accessibles en 1 scan',
      'Contacts d\'urgence',
      'Localisation GPS en 1 clic',
      'Hôtel modifiable à distance',
      'Protection 2 mois dès activation',
    ],
    price: 'À partir de 5 000 FCFA',
    priceSub: 'Bracelet silicone inclus',
    cta: 'Choisir Pass Identity',
    href: '/activate/identity',
  },
];

/* ─── Inner component ─── */
function SelectPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get('code') ?? '';

  const [qrReference, setQrReference] = useState(prefillCode);
  const [refValidated, setRefValidated] = useState(!!prefillCode);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateReference = async () => {
    if (!qrReference.trim()) {
      setError('Veuillez entrer votre référence QR');
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const res = await fetch(`/api/baggage/reference/${encodeURIComponent(qrReference.trim())}`);
      if (res.ok) {
        setRefValidated(true);
      } else if (res.status === 404) {
        setError('Référence QR non trouvée. Vérifiez votre code ou demandez-le à votre agence.');
      } else {
        setError('Erreur de vérification. Réessayez.');
      }
    } catch {
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setValidating(false);
    }
  };

  const handleChoose = (href: string) => {
    const url = `${href}?code=${encodeURIComponent(qrReference.trim())}`;
    router.push(url);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* ─── Header ─── */}
      <header className="w-full px-4 pt-6 pb-2 anim-fade-in-down">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2">
          <span className="font-bold text-xl tracking-tight" style={{ color: '#1e3a8a' }}>Pass</span>
          <span className="font-bold text-xl tracking-tight" style={{ color: '#f4b400' }}>Hajj</span>
        </div>
        <p className="text-center mt-2 text-sm font-medium anim-fade-in" style={{ color: '#64748b' }}>Activez votre protection</p>
      </header>

      <main className="flex-1 w-full px-4 py-6">
        <div className="max-w-3xl mx-auto">

          {/* ─── Step 1: QR Reference ─── */}
          <div className="anim-fade-in-down" style={{ animationDelay: '0.1s' }}>
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(30,58,138,0.12)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#dbeafe' }}>📲</div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Étape 1 : Entrez votre référence QR</h2>
                  <p className="text-sm" style={{ color: '#64748b' }}>Votre QR code se trouve sur l&apos;étiquette ou le bracelet fourni par votre agence</p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={qrReference}
                  onChange={(e) => { setQrReference(e.target.value); setRefValidated(false); setError(null); }}
                  placeholder="Ex: HAJJ26-MLQGY7"
                  className="flex-1 px-4 py-3 rounded-xl text-base font-medium border-2 focus:outline-none transition-colors"
                  style={{
                    borderColor: refValidated ? '#10b981' : error ? '#ef4444' : '#e2e8f0',
                    backgroundColor: refValidated ? '#f0fdf4' : '#ffffff',
                    color: '#0f172a',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') validateReference(); }}
                />
                <button
                  onClick={validateReference}
                  disabled={validating || !qrReference.trim()}
                  className="px-6 py-3 rounded-xl font-semibold text-white text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: '#1e3a8a' }}
                >
                  {validating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : refValidated ? (
                    '✓ Validé'
                  ) : (
                    'Vérifier'
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>{error}</p>
              )}
              {refValidated && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#10b981' }}>✓ Référence validée ! Choisissez votre produit ci-dessous.</p>
              )}

              <p className="mt-3 text-xs" style={{ color: '#94a3b8' }}>
                Vous n&apos;avez pas de QR code ?{' '}
                <a href="/agences" className="font-semibold underline" style={{ color: '#1e3a8a' }}>Demandez-le à votre agence de voyage</a>
              </p>
            </div>
          </div>

          {/* ─── Step 2: Product Selection ─── */}
          <div className="text-center mb-6 anim-fade-in-down" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: '#1e3a8a' }}>
              Que souhaitez-vous protéger ?
            </h1>
            <p className="mt-2 text-base sm:text-lg" style={{ color: '#64748b' }}>
              {refValidated ? 'Choisissez le produit adapté à vos besoins' : 'Validez d\'abord votre référence QR ci-dessus'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCTS.map((product, idx) => (
              <div
                key={product.id}
                className="anim-fade-in-up"
                style={{
                  backgroundColor: refValidated ? '#ffffff' : '#f8fafc',
                  borderRadius: '24px',
                  boxShadow: '0 8px 24px rgba(30,58,138,0.12)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  animationDelay: `${(idx + 3) * 0.1}s`,
                  opacity: refValidated ? 1 : 0.5,
                  transition: 'opacity 0.3s',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{product.icon}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#0f172a' }}>{product.title}</h2>
                    {product.badge && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: product.badgeColor || '#10b981' }}>{product.badge}</span>
                    )}
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: '#64748b' }}>{product.description}</p>

                <ul className="space-y-2 mb-5 flex-1">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: '#0f172a' }}>
                      <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: product.id === 'baggage' ? '#1e3a8a' : '#10b981' }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: product.id === 'baggage' ? '#dbeafe' : '#d1fae5' }}>
                  <p className="font-bold text-base" style={{ color: '#0f172a' }}>{product.price}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{product.priceSub}</p>
                </div>

                <button
                  onClick={() => handleChoose(product.href)}
                  disabled={!refValidated}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ backgroundColor: product.id === 'baggage' ? '#1e3a8a' : '#059669' }}
                >
                  {product.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Agency Info */}
          <div className="mt-8 rounded-2xl px-6 py-5 text-center anim-fade-in" style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', animationDelay: '0.5s' }}>
            <p className="text-sm font-medium" style={{ color: '#1e3a8a' }}>
              Vous êtes une agence de voyage ?{' '}
              <a href="/agences" className="font-bold underline underline-offset-2 hover:opacity-80" style={{ color: '#1e3a8a' }}>En savoir plus</a>
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full px-4 py-5 anim-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>© 2026 PassHajj · Sécurité intelligente Hajj & Omrah</p>
        </div>
      </footer>
    </div>
  );
}

export default function SelectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#1e3a8a', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: '#1e3a8a' }}>Chargement...</p>
          </div>
        </div>
      }
    >
      <SelectPageInner />
    </Suspense>
  );
}
