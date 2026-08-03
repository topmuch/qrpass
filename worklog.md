---
Task ID: 1
Agent: Main
Task: Rebuild homepage with HAKK hero image and develop all sections

Work Log:
- Explored current project structure (Next.js 16, TypeScript, Tailwind CSS 4, Prisma)
- Generated hero image: `/public/images/hero-airport.png` - HAKK branded airport scene with pilgrim baggage
- Generated products image: `/public/images/hero-products.png` - Split Pass Bagage/Identity illustration
- Rebuilt `/src/app/page.tsx` with new HAKK branding:
  - Brand: HAKK (yellow #f4b400 + navy #0c1d3a)
  - Hero with full-bleed airport image + overlay + side-by-side product image
  - Language toggle (FR/EN/AR) with RTL support
  - Mobile hamburger menu
  - Stats bar (navy background)
  - Problem section (3 cards with red top border)
  - Products section (Pass Bagage + Pass Identity)
  - Comparison table
  - How it works (3 step cards with connectors)
  - Testimonials (3 cards with golden top border)
  - Agencies CTA (navy gradient)
  - Footer with HAKK branding + legal links
  - Scroll-reveal animations
  - Responsive design (mobile/tablet/desktop)
- Verified with Agent Browser: all sections render, language toggle works, CTA navigates correctly, footer shows HAKK

Stage Summary:
- Homepage fully rebuilt with HAKK branding and airport hero image
- All i18n translations working (fr/en/ar with RTL)
- No console errors
- Hero image shows airport baggage scene
---
Task ID: 1
Agent: main
Task: Add hotelAddress and hotelPhone to finder page, activation pages, and all APIs

Work Log:
- Added hotelAddress and hotelPhone fields to Prisma Baggage model
- Ran db:push to sync schema
- Updated scan API to return hotelAddress and hotelPhone
- Updated baggage reference API (buildUpdateData + shapeBaggageResponse) for hotel fields
- Updated activate API schema and update logic for hotelAddress/hotelPhone
- Updated finder page (/scan/[reference]/page.tsx):
  - Added Navigation icon import
  - Added i18n keys for hotelAddressLabel, hotelPhoneLabel, dropAtHotel, dropAtHotelDesc
  - Updated BaggageData interface with hotelAddress, hotelPhone
  - Added edit state for hotelAddress, hotelPhone
  - Added pre-fill logic in useEffect
  - Added save logic for hotelAddress, hotelPhone
  - Updated hotel card (CARD 2) to display hotel address, phone
  - Added "Déposer à l'hôtel" button that opens Google Maps directions
  - Changed subtitle text to white color (font-semibold, color: '#ffffff')
  - Added edit mode fields for hotelAddress, hotelPhone
- Updated activation page (/activate/baggage/page.tsx) with hotel address and phone fields
- Updated Hajj activation page (/hajj/activate/page.tsx) with hotel address and phone fields

Stage Summary:
- All database, API, and frontend changes completed
- Finder page now shows hotel address, phone, and "Déposer à l'hôtel" Google Maps button
- White thank-you text below "BAGAGE TROUVÉ" header
- Activation pages include hotel address and phone input fields
---
Task ID: 3
Agent: Main
Task: Develop rich detail pages for 3 problem cards (Bagages perdus, Pèlerins âgés, Urgences médicales)

Work Log:
- Created `/src/components/home/ProblemDetailDialog.tsx` - reusable dialog component with:
  - Hero banner with gradient navy background and decorative circles
  - Stats section (grid of stat cards with value/label)
  - Scenarios section (real-world situations with icons)
  - Solution section (HAKK product solution with feature checklist)
  - Steps section (numbered step-by-step process)
  - Example section (real concrete example with highlighted border)
  - CTA section (navy gradient with activation button)
  - Custom scrollbar, scroll-to-top on open, RTL support
  - `lang` prop for proper language sync with parent component
- Added comprehensive i18n translations for all 3 detail pages in 3 languages:
  - `public/locales/fr.json` - French translations (problemDetail.bagages, .personnes, .urgences)
  - `public/locales/en.json` - English translations
  - `public/locales/ar.json` - Arabic translations
- Updated homepage `/src/app/page.tsx`:
  - Added `problemDialog` state for managing which dialog is open
  - Made all 3 problem cards clickable with `role="button"`, `tabIndex`, keyboard support
  - Added "En savoir plus →" / "Learn more →" / "← المزيد" link on each card
  - Added CSS for `.hk-problem--clickable` (cursor, hover border, focus-visible outline)
  - Added CSS for `.hk-problem-more` (gold link with arrow animation on hover)
  - Dynamically imported ProblemDetailDialog with `next/dynamic` (ssr: false)
  - Passed `lang` prop to ensure correct language in CTA buttons
- Verified with Agent Browser:
  - All 3 dialogs open correctly with full content
  - French: "En savoir plus →" on cards, full FR content in dialogs
  - English: "Learn more →" on cards, full EN content in dialogs
  - Arabic: "← المزيد" on cards, full AR content with RTL in dialogs
  - Mobile (390x844): responsive layout, hamburger menu, dialogs work
  - Desktop (1920x1080): all working correctly
  - No runtime errors in dev.log

Stage Summary:
- 3 rich detail pages implemented as Dialog modals (Bagages perdus, Pèlerins âgés, Urgences médicales)
- Each page includes: stats, scenarios, HAKK solution, step-by-step, example, and CTA
- Full i18n support (FR/EN/AR with RTL)
- Accessible (keyboard navigation, ARIA roles, focus-visible)
- Responsive (mobile/tablet/desktop tested)
