import Image from 'next/image';

/**
 * BrandLogo — logo PassHajj harmonisé sur tout le site.
 * Traitement unique : coins arrondis 14px, padding 5px, fond blanc translucide.
 * Utiliser <BrandLogo /> (150px) ou <BrandLogo width={120} /> pour les en-têtes compacts.
 */
const LOGO_STYLE: React.CSSProperties = {
  objectFit: 'contain',
  borderRadius: '14px',
  padding: '5px',
  background: 'rgba(255,255,255,0.9)',
};

export default function BrandLogo({ width = 150 }: { width?: number }) {
  // Ratio original du fichier logo : 150 × 58
  const height = Math.round((width * 58) / 150);
  return (
    <Image
      src="/logo-passhajj.png"
      alt="PassHajj"
      width={width}
      height={height}
      style={LOGO_STYLE}
    />
  );
}
