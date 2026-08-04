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

      {/* Table */}
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">QR Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nationalité</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Groupe Sanguin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agence</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/p/${p.qrCode}`} className="flex items-center gap-2 font-mono text-sm font-semibold text-blue-600 hover:text-blue-800">
                        <QrCode className="w-4 h-4" />
                        {p.qrCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{p.fullName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.nationality}</td>
                    <td className="px-4 py-3">
                      {p.bloodType ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">{p.bloodType}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.agency?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Actif</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Inactif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
