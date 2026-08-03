import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription – Créer votre compte PassHajj',
  description: 'Inscrivez-vous sur PassHajj pour protéger vos bagages et pèlerins pendant le Hajj et l\'Omrah. Création de compte rapide et gratuite.',
  keywords: ['inscription passhajj', 'créer compte', 'signup hajj', 'inscription omrah', 'devenir membre'],
  openGraph: {
    title: 'Inscription PassHajj – Hajj & Omrah',
    description: 'Créez votre compte PassHajj pour protéger vos bagages et pèlerins.',
  },
};

export default function InscrireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
