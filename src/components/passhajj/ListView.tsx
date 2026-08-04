'use client';

import { usePassHajjStore } from '@/lib/passhajj-store';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Search, Users, Package, CheckCircle2, Clock, XCircle, User, Briefcase,
} from 'lucide-react';
import { useMemo } from 'react';

export default function ListView() {
  const {
    trip, scans, scannedPilgrimIds, scannedBagIds,
    listFilter, setListFilter, searchQuery, setSearchQuery,
    setView,
  } = usePassHajjStore();

  // Build enriched pilgrim list - hooks must be called unconditionally
  const pilgrimList = useMemo(() => {
    if (!trip) return [];
    return trip.pilgrims.map((p) => {
      const scan = scans.find((s) => s.qrCode === p.qrCode && s.status === 'success');
      const isPresent = scannedPilgrimIds.has(p.qrCode);
      return {
        ...p,
        type: 'identity' as const,
        isPresent,
        scanTime: scan?.timestamp,
        scanZone: scan?.zone,
      };
    });
  }, [trip, scans, scannedPilgrimIds]);

  // Build enriched bag list
  const bagList = useMemo(() => {
    if (!trip) return [];
    return trip.bags.map((b) => {
      const scan = scans.find((s) => s.qrCode === b.qrCode && s.status === 'success');
      const isScanned = scannedBagIds.has(b.qrCode);
      return {
        ...b,
        type: 'baggage' as const,
        isScanned,
        scanTime: scan?.timestamp,
        scanZone: scan?.zone,
      };
    });
  }, [trip, scans, scannedBagIds]);

  // Filter and search
  const filteredPilgrims = useMemo(() => {
    let list = pilgrimList;
    if (listFilter === 'present') list = list.filter((p) => p.isPresent);
    if (listFilter === 'missing') list = list.filter((p) => !p.isPresent);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.fullName.toLowerCase().includes(q) || p.qrCode.toLowerCase().includes(q));
    }
    return list;
  }, [pilgrimList, listFilter, searchQuery]);

  const filteredBags = useMemo(() => {
    let list = bagList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) => b.ownerName.toLowerCase().includes(q) || b.qrCode.toLowerCase().includes(q));
    }
    return list;
  }, [bagList, searchQuery]);

  if (!trip) return null;

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalPilgrims = trip.pilgrims.length;
  const totalBags = trip.bags.length;
  const presentCount = scannedPilgrimIds.size;
  const missingCount = totalPilgrims - presentCount;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#f4b400] text-white px-4 py-3 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="p-1 rounded-lg hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Liste du Voyage</h1>
            <p className="text-xs text-white/80">{trip.tripName}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full">
        {/* Stats bar */}
        <div className="flex gap-2 p-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm shrink-0">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold">{presentCount}/{totalPilgrims}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm shrink-0">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold">{scannedBagIds.size}/{totalBags}</span>
          </div>
          {missingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-xl shadow-sm shrink-0">
              <XCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">{missingCount} manquant(s)</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou QR..."
              className="pl-10 h-12 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 mb-3">
          {[
            { key: 'all' as const, label: 'Tous', count: totalPilgrims },
            { key: 'present' as const, label: 'Présents', count: presentCount },
            { key: 'missing' as const, label: 'Manquants', count: missingCount },
            { key: 'bags' as const, label: 'Bagages', count: totalBags },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setListFilter(f.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                listFilter === f.key
                  ? 'bg-[#f4b400] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* List */}
        <div className="px-4 pb-24 space-y-2">
          {listFilter !== 'bags' ? (
            filteredPilgrims.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Aucun pèlerin trouvé</p>
              </div>
            ) : (
              filteredPilgrims.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border-l-4 ${
                    p.isPresent ? 'border-l-green-500' : 'border-l-amber-400'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    p.isPresent ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    <User className={`w-5 h-5 ${p.isPresent ? 'text-green-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{p.fullName}</p>
                    <p className="text-xs text-gray-400">{p.qrCode} {p.group && `· ${p.group}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {p.isPresent ? (
                      <>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Présent
                        </Badge>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(p.scanTime)} · {p.scanZone}</p>
                      </>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                        <Clock className="w-3 h-3 mr-1" /> Manquant
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            filteredBags.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Aucun bagage trouvé</p>
              </div>
            ) : (
              filteredBags.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border-l-4 ${
                    b.isScanned ? 'border-l-blue-500' : 'border-l-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    b.isScanned ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Briefcase className={`w-5 h-5 ${b.isScanned ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{b.ownerName}</p>
                    <p className="text-xs text-gray-400">{b.qrCode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {b.isScanned ? (
                      <>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Scanné
                        </Badge>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(b.scanTime)} · {b.scanZone}</p>
                      </>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs">
                        <Clock className="w-3 h-3 mr-1" /> En attente
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </main>
    </div>
  );
}
