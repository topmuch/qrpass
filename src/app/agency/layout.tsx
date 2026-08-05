'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  isAgencyAuthenticated,
  getAgencyUser,
  agencyLogout,
  clearAgencyAuth,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Smartphone,
  Plane,
  LogOut,
  Menu,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/agency/dashboard',
  },
  {
    label: 'Voyages',
    icon: Plane,
    href: '/agency/dashboard',
  },
  {
    label: 'Application',
    icon: Smartphone,
    href: '/agency/pwa',
  },
] as const;

const SIDEBAR_EXPANDED_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

/* ══════════════════════════════════════════════════════════
   LIVE CLOCK COMPONENT
   ══════════════════════════════════════════════════════════ */

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Clock className="w-4 h-4" />
      <span className="hidden sm:inline">{dateStr}</span>
      <span className="sm:hidden">
        {now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </span>
      <span className="font-medium text-slate-700">{timeStr}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
   ══════════════════════════════════════════════════════════ */

function Sidebar({
  expanded,
  setExpanded,
  mobileOpen,
  setMobileOpen,
  onLogout,
  userName,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  onLogout: () => void;
  userName: string;
}) {
  const pathname = usePathname();
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AG';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col
          bg-[#1e3a5f] text-white
          shadow-2xl
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        }}
      >
        {/* ── Sidebar Header ── */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 min-h-[64px]">
          {expanded && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-[#f4b400] flex items-center justify-center shrink-0">
                <span className="text-[#1e3a5f] font-extrabold text-sm">PH</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-[#f4b400] whitespace-nowrap">
                PassHajj
              </span>
            </div>
          )}
          {!expanded && (
            <div className="w-9 h-9 rounded-lg bg-[#f4b400] flex items-center justify-center mx-auto">
              <span className="text-[#1e3a5f] font-extrabold text-sm">PH</span>
            </div>
          )}

          {/* Close button (mobile) */}
          <button
            className="lg:hidden text-white/60 hover:text-white transition-colors p-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Réduire le menu' : 'Étendre le menu'}
          >
            {expanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ── User Info ── */}
        <div className="p-4 border-b border-white/10">
          <div
            className={`flex items-center gap-3 ${
              expanded ? '' : 'justify-center'
            }`}
          >
            <Avatar className="h-10 w-10 border-2 border-[#f4b400]/40 shrink-0">
              <AvatarFallback className="bg-[#f4b400] text-[#1e3a5f] font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {userName || 'Agence'}
                </p>
                <p className="text-xs text-white/50">Espace Agence</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/agency/dashboard' &&
                  pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 rounded-xl
                      transition-all duration-200 group
                      ${
                        expanded ? 'px-4 py-2.5' : 'px-0 py-2.5 justify-center'
                      }
                      ${
                        isActive
                          ? 'bg-[#f4b400] text-[#1e3a5f] shadow-lg shadow-[#f4b400]/25'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    onClick={() => setMobileOpen(false)}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {expanded && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                    {/* Tooltip for collapsed state */}
                    {!expanded && (
                      <span
                        className="
                          absolute left-full ml-3 px-2.5 py-1.5
                          bg-[#1e3a5f] text-white text-xs font-medium
                          rounded-lg shadow-lg opacity-0 pointer-events-none
                          group-hover:opacity-100 group-hover:pointer-events-auto
                          transition-opacity whitespace-nowrap z-50
                          border border-white/10
                        "
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Logout ── */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className={`
              flex items-center gap-3 rounded-xl
              bg-white/5 text-white/70 hover:bg-red-500/20 hover:text-red-300
              transition-all duration-200 w-full
              ${expanded ? 'px-4 py-2.5' : 'px-0 py-2.5 justify-center'}
            `}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {expanded && (
              <span className="font-medium text-sm">Déconnexion</span>
            )}
            {!expanded && (
              <span
                className="
                  absolute left-full ml-3 px-2.5 py-1.5
                  bg-[#1e3a5f] text-white text-xs font-medium
                  rounded-lg shadow-lg opacity-0 pointer-events-none
                  group-hover:opacity-100 group-hover:pointer-events-auto
                  transition-opacity whitespace-nowrap z-50
                  border border-white/10
                "
              >
                Déconnexion
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   HEADER COMPONENT
   ══════════════════════════════════════════════════════════ */

function Header({
  onMenuClick,
  userName,
}: {
  onMenuClick: () => void;
  userName: string;
}) {
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AG';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* PassHajj branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f4b400] flex items-center justify-center">
              <span className="text-[#1e3a5f] font-extrabold text-xs">PH</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#f4b400] hidden sm:inline">
              PassHajj
            </span>
          </div>

          {/* Separator */}
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Page context */}
          <span className="hidden md:inline text-sm text-slate-500">
            Espace Agence
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Live clock */}
          <div className="hidden lg:block">
            <LiveClock />
          </div>

          {/* User info */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <Avatar className="h-9 w-9 border-2 border-[#f4b400]/30">
              <AvatarFallback className="bg-[#1e3a5f] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {userName || 'Agence'}
              </p>
              <p className="text-xs text-slate-400">Agence partenaire</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN LAYOUT
   ══════════════════════════════════════════════════════════ */

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [userName, setUserName] = useState('');

  const isLoginPage = pathname === '/agency/login';

  /* ── Auth check ── */
  useEffect(() => {
    const check = () => {
      const authenticated = isAgencyAuthenticated();
      const user = getAgencyUser();

      setAuthed(authenticated);
      setUserName(user?.name || user?.email || '');

      // Not authenticated & not on login → redirect to login
      if (!authenticated && !isLoginPage) {
        router.replace('/agency/login');
        return;
      }

      // Authenticated & on login → redirect to dashboard
      if (authenticated && isLoginPage) {
        router.replace('/agency/dashboard');
        return;
      }
    };

    check();
  }, [pathname, router, isLoginPage]);

  /* ── Handle logout ── */
  const handleLogout = useCallback(async () => {
    try {
      await agencyLogout();
    } catch {
      clearAgencyAuth();
    }
    router.replace('/agency/login');
  }, [router]);

  /* ── Login page: render children without shell ── */
  if (isLoginPage) {
    return <>{children}</>;
  }

  /* ── Loading state while checking auth ── */
  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#f4b400]/30 border-t-[#f4b400] rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Vérification de l&apos;authentification…</p>
        </div>
      </div>
    );
  }

  /* ── Not authenticated (will redirect, show nothing) ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f4b400]/30 border-t-[#f4b400] rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Authenticated layout with sidebar + header ── */
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
        userName={userName}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileOpen(true)}
          userName={userName}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>&copy; {new Date().getFullYear()} PassHajj — Espace Agence</span>
            <div className="flex items-center gap-3">
              <Link
                href="/agency/pwa"
                className="flex items-center gap-2 hover:text-[#f4b400] transition-colors font-medium"
              >
                <div className="bg-white rounded p-1 shadow-sm">
                  <QrCode className="w-5 h-5 text-[#1e3a5f]" />
                </div>
                <span className="hidden sm:inline">QR Code PWA</span>
                <span className="sm:hidden">PWA</span>
              </Link>
              <span className="hidden sm:inline">
                Tous droits réservés
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
