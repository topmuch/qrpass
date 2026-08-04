'use client';

import { useEffect, useState } from 'react';
import { usePassHajjStore } from '@/lib/passhajj-store';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues with camera/localforage
const LoginScreen = dynamic(() => import('@/components/passhajj/LoginScreen'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/passhajj/Dashboard'), { ssr: false });
const ListView = dynamic(() => import('@/components/passhajj/ListView'), { ssr: false });
const IncidentsView = dynamic(() => import('@/components/passhajj/IncidentsView'), { ssr: false });

export default function PassHajjManager() {
  const { view, initialized, initialize } = usePassHajjStore();
  const [loading, setLoading] = useState(true);

  // Initialize store from localforage on mount
  useEffect(() => {
    const init = async () => {
      await initialize();
      setLoading(false);
    };
    init();
  }, [initialize]);

  // Show loading screen while initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] to-[#d49b00]">
        <div className="w-20 h-20 mb-4 bg-white rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
          <span className="text-4xl">🕋</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">PassHajj</h1>
        <p className="text-white/70 text-sm font-light">Chargement des données hors ligne...</p>
        <div className="mt-4 flex gap-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // Route based on view state
  switch (view) {
    case 'login':
      return <LoginScreen />;
    case 'dashboard':
      return <Dashboard />;
    case 'list':
      return <ListView />;
    case 'incidents':
      return <IncidentsView />;
    default:
      return <LoginScreen />;
  }
}
