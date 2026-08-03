'use client';

import Link from 'next/link';

export default function AgencesPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f4b400' }}>
      {/* Header */}
      <header className="w-full px-4 pt-6 pb-2">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-white font-bold text-xl tracking-tight" style={{ backgroundColor: '#0f172a' }}>Pass</span>
          <span className="font-bold text-xl tracking-tight" style={{ color: '#0f172a' }}>Hajj</span>
        </div>
        <p className="text-center mt-2 text-sm font-medium" style={{ color: '#0f172a' }}>Espace Agences de Voyage</p>
      </header>

      <main className="flex-1 w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-3" style={{ color: '#0f172a' }}>
            🏢 Espace Agences
          </h1>
          <p className="text-center text-base mb-10 max-w-xl mx-auto" style={{ color: '#475569' }}>
            Offrez à vos pèlerins une protection premium avec PassHajj. Gérez vos QR codes, suivez vos bagages et centralisez vos alertes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Connexion */}
            <div className="rounded-2xl p-8 flex flex-col" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ backgroundColor: '#fef3c7' }}>🔑</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>Se connecter</h2>
              <p className="text-sm mb-6 flex-1" style={{ color: '#475569' }}>
                Accédez à votre tableau de bord pour gérer vos pèlerins, déclarer des pertes et consulter vos alertes.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Dashboard baggages en temps réel',
                  'Déclarer / retrouver des bagages perdus',
                  'Modifier les infos hôtel des pèlerins',
                  'Assistance prioritaire WhatsApp',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#0f172a' }}>
                    <span className="font-bold" style={{ color: '#10b981' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/agence/connexion"
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-base text-center transition-all hover:opacity-90 block"
                style={{ backgroundColor: '#0f172a' }}
              >
                Connexion Agence
              </Link>
            </div>

            {/* Devenir Partenaire */}
            <div className="rounded-2xl p-8 flex flex-col" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ backgroundColor: '#d1fae5' }}>🤝</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>Devenir partenaire</h2>
              <p className="text-sm mb-6 flex-1" style={{ color: '#475569' }}>
                Rejoignez le réseau PassHajj et offrez à vos clients une sécurité inégalée pendant le Hajj et l&apos;Omrah.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Génération illimitée de QR codes',
                  'Dashboard groupe personnalisé',
                  'Alertes centralisées pour vos pèlerins',
                  'Support dédié & formation incluse',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#0f172a' }}>
                    <span className="font-bold" style={{ color: '#10b981' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/devenir-partenaire"
                className="w-full py-3 px-6 rounded-xl font-semibold text-base text-center transition-all hover:opacity-90 block border-2"
                style={{ borderColor: '#0f172a', color: '#0f172a', backgroundColor: 'transparent' }}
              >
                Devenir Partenaire
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full px-4 py-5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-medium" style={{ color: '#0f172a', opacity: 0.5 }}>© 2026 PassHajj · Protection intelligente Hajj & Omrah</p>
        </div>
      </footer>
    </div>
  );
}
