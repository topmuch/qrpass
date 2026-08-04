# Task 2 — Harmonize Yellow Color Across All Activation Pages

## Summary
Replaced all instances of `#fbbf24` (Tailwind amber-400) with `#f4b400` (PassHajj brand yellow) across 4 files, and updated the hajj/activate page to match other activation pages' styling (yellow BG, black buttons, `bg-[#f8fafc]` inputs).

## Files Changed
1. `/src/app/hajj/activate/page.tsx` — BG, ACCENT, BTN_PRIMARY, BTN_PRIMARY_HOVER constants + input bg-gray-100 → bg-[#f8fafc]
2. `/src/app/select/page.tsx` — #fbbf24 → #f4b400
3. `/src/app/agences/page.tsx` — #fbbf24 → #f4b400
4. `/src/app/activate/confirmation/page.tsx` — amber Tailwind classes → brand yellow hex classes

## Verification
- No remaining `#fbbf24` in any of the 4 files
- No remaining `bg-amber-50`, `border-amber-400`, `text-amber-600` in confirmation page
- Only pre-existing lint errors (create-admin.cjs)
- Dev server running without errors
