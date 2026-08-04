import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activer votre Pass – Bagage ou Bracelet identité',
  description: 'Activez votre Pass Bagage ou Pass Identity pour le Hajj et l\'Omrah. Étiquette QR code pour valises, bracelet d\'urgence pour pèlerins. Activation en 30 secondes.',
  keywords: ['activer pass', 'activation QR code', 'pass bagage', 'pass identity', 'activation hajj', 'activation omrah'],
  openGraph: {
    title: 'Activer votre Pass – PassHajj',
    description: 'Activez votre Pass Bagage ou Pass Identity pour le Hajj et l\'Omrah. Activation rapide et sécurisée.',
  },
};

export default function SelectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
