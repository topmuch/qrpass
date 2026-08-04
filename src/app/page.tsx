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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4b400]">
        <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-3xl">🕋</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">PassHajj</h1>
        <p className="text-white/70 text-sm">Chargement...</p>
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
