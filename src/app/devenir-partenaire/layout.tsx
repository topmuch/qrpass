import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devenir partenaire – Agences de voyage Hajj & Omrah',
  description: 'Rejoignez le réseau PassHajj de 850+ agences partenaires. Offrez la protection bagage et identité à vos pèlerins pour le Hajj et l\'Omrah. Commission attractive, dashboard dédié.',
  keywords: ['devenir partenaire', 'agence hajj', 'agence omrah', 'partenaire passhajj', 'agence voyage mecque', 'partenaire pèlerinage'],
  openGraph: {
    title: 'Devenir partenaire PassHajj – Agences Hajj & Omrah',
    description: 'Rejoignez 850+ agences partenaires. Offrez la protection bagage et identité à vos pèlerins.',
  },
};

export default function DevenirPartenaireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
