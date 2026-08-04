# Task: Create PassHajj Agency Dashboard - Layout & Login Page

## Agent: Main Developer
## Status: COMPLETED

## Files Created

### 1. `/home/z/my-project/src/app/agency/layout.tsx`
- **Type**: 'use client' component (Next.js App Router layout)
- **Auth**: Checks `isAgencyAuthenticated()` and `getAgencyUser()` from `@/services/api`
- **Redirect logic**:
  - Not authenticated + not on `/agency/login` → redirect to `/agency/login`
  - Authenticated + on `/agency/login` → redirect to `/agency/dashboard`
- **Sidebar**: Collapsible (260px expanded / 72px collapsed) with:
  - PassHajj branding header (PH logo in #f4b400)
  - User info section with Avatar
  - Dashboard nav item (LayoutDashboard icon) → /agency/dashboard
  - Déconnexion button (LogOut icon) → calls agencyLogout() → redirect
  - Tooltips on collapsed state
  - Mobile overlay + slide-in behavior
- **Header**: Top bar with:
  - PassHajj logo text in #f4b400
  - Mobile menu toggle
  - Agency user name + avatar
  - Live clock component (date/time)
- **Layout structure**: Sidebar left, header top, content center, sticky footer
- **Login page**: Children rendered without sidebar/header
- **Theme**: Jaune #f4b400 / Blanc / Bleu Marine #1e3a5f
- **Responsive**: Sidebar collapses to icons on mobile, header adapts

### 2. `/home/z/my-project/src/app/agency/login/page.tsx`
- **Type**: 'use client' component
- **Design**: Two-panel layout matching existing AgenceLoginPage style
  - Left panel (52%): Immersive branding with gradient from #1e3a5f to #f4b400
    - Animated floating icons (Globe, Plane, Luggage, QrCode, ShieldCheck)
    - Gradient orbs and grid overlay
    - Hero text with #f4b400 gradient
    - Stats row (2M+, 850+, 45+, 99.9%)
    - Testimonial quote
  - Right panel (48%): Login form on subtle gradient background
    - Agency badge, "Bienvenue" heading
    - Error alert with AnimatePresence
    - Glass-morphism Card with email/password inputs
    - Custom styled inputs with focus states (#f4b400 accent)
    - Password visibility toggle (Eye/EyeOff icons)
    - "Mot de passe oublié ?" link (non-functional, styled)
    - Gradient submit button (#f4b400 → #d49b00)
    - Demo account card with fill button
    - SuperAdmin link, bottom legal links
- **API**: Calls `agencyLogin(email, password)` from `@/services/api`
- **On success**: Redirects to `/agency/dashboard` via `router.push()`
- **Error handling**: Shows animated error message on failure
- **Loading state**: Spinner + "Connexion en cours..." text
- **Mobile**: Single column, branding above form, compact stats
- **Animations**: framer-motion for staggered entry, floating icons, form interactions

## Design Decisions
- Used existing `@/services/api` functions (agencyLogin, isAgencyAuthenticated, getAgencyUser, agencyLogout, clearAgencyAuth)
- Used shadcn/ui components (Button, Input, Label, Card, Avatar)
- Matched existing AgenceLoginPage design patterns (gradient orbs, floating icons, glass-morphism)
- Theme: Jaune #f4b400 (primary/gold), Blanc (backgrounds), Bleu Marine #1e3a5f (sidebar/accents)
- Responsive: Sidebar collapses on mobile, login page stacks vertically on small screens

## Verification
- No lint errors from the new files
- Dev server running without compilation errors
- Pre-existing lint errors in other files (not introduced by this change)
