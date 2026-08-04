import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contactez PassHajj – Support pèlerins & agences',
  description: 'Contactez l\'équipe PassHajj pour toute question sur la protection de vos bagages et pèlerins pendant le Hajj et l\'Omrah. Support disponible en français, anglais et arabe. WhatsApp, email, téléphone.',
  keywords: ['contact passhajj', 'support hajj', 'aide omrah', 'service client pèlerinage', 'whatsapp passhajj'],
  openGraph: {
    title: 'Contactez PassHajj – Support Hajj & Omrah',
    description: 'Support disponible 24/7 pour les urgences. Réponse sous 24h ouvrées.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
