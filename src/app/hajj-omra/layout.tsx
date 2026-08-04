import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hajj & Omrah – Guide du pèlerin',
  description: 'Tout savoir sur le Hajj et l\'Omrah : rituels, préparation, conseils pratiques pour les pèlerins. Protégez vos bagages et votre identité avec PassHajj pendant votre pèlerinage à la Mecque.',
  keywords: ['guide hajj', 'guide omrah', 'pèlerinage mecque', 'rituels hajj', 'préparation omrah', 'conseils pèlerin', 'ihram', 'tawaf', 'sa\'i'],
  openGraph: {
    title: 'Guide Hajj & Omrah – PassHajj',
    description: 'Guide complet du pèlerin pour le Hajj et l\'Omrah. Préparation, rituels, conseils.',
  },
};

export default function HajjOmraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
