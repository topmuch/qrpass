'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Search, QrCode, Loader2 } from 'lucide-react';

interface Pilgrim {
  id: string;
  qrCode: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  nationality: string;
  bloodType?: string;
  isActive: boolean;
  agencyId?: string;
  agency?: { name: string };
  createdAt: string;
}

export default function AdminIdentityPage() {
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPilgrims();
  }, []);

  const fetchPilgrims = async () => {
    try {
      const res = await fetch('/api/pilgrims/identity');
      if (res.ok) {
        const data = await res.json();
        setPilgrims(data.pilgrims || []);
      }
    } catch (err) {
      console.error('Failed to fetch pilgrims:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pilgrims.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.qrCode.toLowerCase().includes(search.toLowerCase()) ||
    p.nationality.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Identity — Passeports Pèlerins</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{pilgrims.length} bracelets enregistrés</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, QR code, nationalité..."
          className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
        />
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun bracelet Identity trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Top colored bar */}
              <div className={`h-2 ${p.isActive ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              <div className="p-5">
                {/* QR Code row + Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <Link
                    href={`/p/${p.qrCode}`}
                    className="flex items-center gap-2 font-mono text-sm font-semibold group/qr"
                  >
                    <QrCode className={`w-4 h-4 ${p.isActive ? 'text-emerald-600 group-hover/qr:text-emerald-700' : 'text-amber-500 group-hover/qr:text-amber-600'} transition-colors`} />
                    <span className={`${p.isActive ? 'text-emerald-600 group-hover/qr:text-emerald-700' : 'text-amber-500 group-hover/qr:text-amber-600'} transition-colors`}>
                      {p.qrCode}
                    </span>
                  </Link>
                  {p.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Actif</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Inactif</span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  {p.fullName || 'Non renseigné'}
                </h3>

                {/* Info rows */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Nationalité</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{p.nationality}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Groupe sanguin</span>
                    {p.bloodType ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">{p.bloodType}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Agence</span>
                    <span className="text-slate-700 dark:text-slate-200 text-right truncate ml-2">
                      {p.agency?.name || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
