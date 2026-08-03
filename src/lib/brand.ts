/**
 * PassHajj — Brand color tokens (shared across pages)
 *
 * Visual reference: Yellow background (#f4b400) + Dark text (#0f172a),
 * Green accent (#10b981). High-contrast, modern, mobile-first.
 * Unified PassHajj palette — replaces the old QRPass blue+yellow scheme.
 */

export const BRAND   = '#f4b400';  // Jaune PassHajj — fonds principaux, headers, boutons primary
export const ACCENT  = '#10b981';  // Vert émeraude — badges "Nouveau", checks, succès
export const INK     = '#0f172a';  // Noir profond — texte principal, boutons primary, bordures

export const BRAND_COLORS = {
  BRAND,           // #f4b400  Jaune principal
  ACCENT,          // #10b981  Vert accent
  INK,             // #0f172a  Noir profond
  YELLOW: BRAND,   // #f4b400  (alias)
  GREEN: ACCENT,   // #10b981  (alias)
  BLACK: INK,      // #0f172a  (alias)
  BLUE: '#1e40af', // Bleu secondaire (liens, info) — utilisation rare
  MUTED: '#475569', // Gris texte secondaire
  CARD: '#ffffff', // Blanc cartes
  RADIUS: '20px',  // Border-radius standard
} as const;
