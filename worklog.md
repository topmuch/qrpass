---
Task ID: 1
Agent: main
Task: Replace homepage with new premium landing page (Blue Navy + Gold palette) + implement all CODE TOUT changes

Work Log:
- Replaced /src/app/page.tsx with comprehensive landing page featuring Blue Navy (#1e3a8a) + Gold (#fbbf24) palette
- Updated all 3 locale files (fr.json, en.json, ar.json) with new comprehensive translation keys for: stats, problem section, product cards with how-it-works steps + use cases, comparison table, testimonials, agencies CTA
- Updated /src/lib/brand.ts to new Blue Navy + Gold palette with SUCCESS, DANGER, BRAND_LIGHT exports
- Created /src/app/agencies/page.tsx as redirect to /agences
- Updated /src/app/agences/page.tsx with new brand colors, Identity QR superadmin-only note
- Updated /src/app/select/page.tsx with new brand colors (navy blue, not yellow)
- Activation form (/hajj/activate) already had 2-month duration, deferred activation, 2 bagage QR, no cabin
- Updated /src/app/admin/generer/page.tsx: added useAuth() for isSuperAdmin check, disabled Identity QR for non-superadmins with lock icon and notice, updated colors to brand navy/gold
- Updated /src/app/admin/qrcodes/page.tsx: changed QR set icons to 🧳/👤 emoji, added Pass type badges with navy/emerald colors, removed cabine from ZIP structure example
- Updated /src/app/admin/tableau-de-bord/page.tsx: added passType distinction to stats cards, activity items, and chart legends
- Updated /src/app/api/admin/baggages/generate/route.ts: changed count max from 3 to 2, count type from 1|2|3 to 1|2
- Updated /src/app/api/activate/route.ts: fixed comment from "3 bags" to "2 bagage QR"
- Fixed /src/middleware.ts: added /agences and /select to PUBLIC_PAGES, changed prefix matching to exact+slash to prevent /agences matching /agence prefix

Stage Summary:
- Complete landing page redesign with premium Blue Navy + Gold palette
- All 10 "CODE TOUT" tasks implemented:
  1. ✅ Landing page wider (max 1200px)
  2. ✅ Fix Espace Agences 404
  3. ✅ Fix activation flow (QR reference required)
  4. ✅ QR generation: 2 bagage only, remove cabin
  5. ✅ Generator redesign: choose type then quantity
  6. ✅ Dashboard distinction: 🧳 Bagage vs 👤 Identity
  7. ✅ Identity QR: superadmin only
  8. ✅ Duration: fixed 2 months from activation
  9. ✅ Deferred activation support
  10. ✅ Remove cabin from forms
- All pages verified in browser, no runtime errors
- Lint: only pre-existing errors in create-admin.cjs
