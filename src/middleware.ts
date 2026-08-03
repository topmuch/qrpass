import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * PassHajj — Middleware de protection des routes
 *
 * Protège :
 *   /admin/*      → requiert rôle superadmin
 *   /agence/*     → requiert rôle agency
 *   /api/admin/*  → 401 si pas de session
 *   /api/agency/* → 401 si pas de session
 *
 * Le vérification se fait via le cookie HTTP-only 'qrpass_session'.
 * En middleware Edge, on ne peut PAS accéder à Prisma — on vérifie
 * seulement la présence du cookie. La vérification complète (session
 * valide, rôle correct) est faite côté serveur dans chaque API route
 * via getSession() / requireAuth().
 */

const SESSION_COOKIE = 'qrpass_session';

// Pages publiques (pas besoin de session)
const PUBLIC_PAGES = new Set([
  '/admin/connexion',
  '/admin/login',
  '/agence/connexion',
  '/agence/login',
  '/login',
]);

// Préfixes de pages protégées
const PROTECTED_PAGE_PREFIXES = [
  { prefix: '/admin', loginUrl: '/admin/connexion', role: 'superadmin' },
  { prefix: '/agence', loginUrl: '/agence/connexion', role: 'agency' },
];

// Préfixes d'API protégées
const PROTECTED_API_PREFIXES = [
  '/api/admin',
  '/api/agency',
  '/api/reports',
  '/api/notifications',
  '/api/messages',
  '/api/baggage',
  '/api/pilgrims',
  '/api/qrcodes',
  '/api/reviews',
  '/api/advertisements',
  '/api/blog',
  '/api/cron',
  '/api/loss-alerts',
  '/api/loss-detection',
];

// Préfixes d'API publiques (pas de session requise)
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/scan',
  '/api/activate',
  '/api/identity',
  '/api/detect-country',
  '/api/init-demo',
  '/api/checklist',
  '/api/landing',
  '/api/route',  // health check
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  // ─── 1. Pages publiques → toujours autoriser ───
  if (PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // ─── 2. API publiques → toujours autoriser ───
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ─── 3. API protégées → vérifier session ───
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      return NextResponse.json(
        { error: 'Non autorisé — Connexion requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    // Session cookie présente → laisser passer.
    // La vérification complète (session valide, rôle) est faite dans le handler API.
    return NextResponse.next();
  }

  // ─── 4. Pages protégées → vérifier session + redirect ───
  for (const { prefix, loginUrl } of PROTECTED_PAGE_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      if (!hasSession) {
        // Pas de session → redirect vers login
        const loginUrlFull = new URL(loginUrl, req.url);
        loginUrlFull.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrlFull);
      }
      // Session cookie présente → laisser passer.
      // Le layout/page vérifiera le rôle côté client+serveur.
      return NextResponse.next();
    }
  }

  // ─── 5. Tout le reste → autoriser ───
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico, icons, sw.js, manifest.json
     * - fichiers publics (images, locales, items)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|sw\\.js|manifest\\.json|images/|items/|locales/|logo|hero|browserconfig).*)',
  ],
};
