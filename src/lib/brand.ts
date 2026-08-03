/**
 * PassHajj — Brand color tokens (shared across pages)
 *
 * Visual reference: Blue Navy (#1e3a8a) + Gold (#fbbf24),
 * with Dark ink (#0f172a). Premium, serious, professional.
 * PassHajj 2026 palette — Bleu Marine + Doré.
 */

export const BRAND      = '#1e3a8a';  // Bleu Marine — primary brand color
export const BRAND_LIGHT = '#3b82f6'; // Bleu clair — hover, gradients
export const ACCENT     = '#fbbf24';  // Doré — CTA, highlights, badges
export const INK        = '#0f172a';  // Noir profond — texte principal
export const SUCCESS    = '#10b981';  // Vert émeraude — succès, Identity product
export const DANGER     = '#ef4444';  // Rouge — erreurs, problème section

export const BRAND_COLORS = {
  BRAND,            // #1e3a8a  Bleu Marine principal
  BRAND_LIGHT,      // #3b82f6  Bleu clair
  ACCENT,           // #fbbf24  Doré
  INK,              // #0f172a  Noir profond
  SUCCESS,          // #10b981  Vert succès
  DANGER,           // #ef4444  Rouge erreur
  NAVY: BRAND,      // #1e3a8a  (alias)
  GOLD: ACCENT,     // #fbbf24  (alias)
  BLACK: INK,       // #0f172a  (alias)
  GREEN: SUCCESS,   // #10b981  (alias)
  BLUE: BRAND,      // #1e3a8a  (alias)
  MUTED: '#64748b', // Gris texte secondaire
  CARD: '#ffffff',  // Blanc cartes
  RADIUS: '16px',   // Border-radius standard
} as const;
