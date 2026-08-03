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
