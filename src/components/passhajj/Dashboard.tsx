'use client';

import { usePassHajjStore } from '@/lib/passhajj-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SyncManager from './SyncManager';
import QRScanner from './QRScanner';
import {
  Plane, Bus, Hotel, Landmark,
  Users, Package, List, AlertCircle,
  LogOut, ChevronDown,
  Heart, ShieldAlert,
} from 'lucide-react';
import type { ZoneType } from '@/lib/passhajj-types';
import { useState } from 'react';

const ZONES: { value: ZoneType; icon: React.ReactNode; emoji: string; color: string }[] = [
  { value: 'Aéroport', icon: <Plane className="w-5 h-5" />, emoji: '🛫', color: 'bg-blue-500' },
  { value: 'Bus', icon: <Bus className="w-5 h-5" />, emoji: '🚌', color: 'bg-orange-500' },
  { value: 'Hôtel', icon: <Hotel className="w-5 h-5" />, emoji: '🏨', color: 'bg-purple-500' },
  { value: 'Haram', icon: <Landmark className="w-5 h-5" />, emoji: '🕌', color: 'bg-green-600' },
];

export default function Dashboard() {
  const {
    trip, zone, setZone, view, setView,
    scannedPilgrimIds, scannedBagIds,
    flashCard, hideFlashCard,
    clearTrip,
  } = usePassHajjStore();

  const [zoneOpen, setZoneOpen] = useState(false);

  if (!trip) return null;

  const totalPilgrims = trip.pilgrims.length;
  const totalBags = trip.bags.length;
  const scannedPilgrims = scannedPilgrimIds.size;
  const scannedBags = scannedBagIds.size;
  const pilgrimPct = totalPilgrims > 0 ? Math.round((scannedPilgrims / totalPilgrims) * 100) : 0;
  const bagPct = totalBags > 0 ? Math.round((scannedBags / totalBags) * 100) : 0;
  const missingPilgrims = totalPilgrims - scannedPilgrims;
  const missingBags = totalBags - scannedBags;

  const currentZone = ZONES.find((z) => z.value === zone) || ZONES[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#f4b400] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">{trip.tripName}</h1>
            <p className="text-sm text-white/80">{trip.agencyName}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncManager />
            <button
              onClick={clearTrip}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Zone Selector */}
        <div className="relative">
          <button
            onClick={() => setZoneOpen(!zoneOpen)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${currentZone.color} rounded-lg flex items-center justify-center text-white`}>
                {currentZone.icon}
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500 font-medium">Zone actuelle</p>
                <p className="text-lg font-bold text-gray-900">{currentZone.emoji} {zone}</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${zoneOpen ? 'rotate-180' : ''}`} />
          </button>

          {zoneOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden">
              {ZONES.map((z) => (
                <button
                  key={z.value}
                  onClick={() => {
                    setZone(z.value);
                    setZoneOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    zone === z.value ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 ${z.color} rounded-lg flex items-center justify-center text-white`}>
                    {z.icon}
                  </div>
                  <span className="text-base font-semibold text-gray-900">{z.emoji} {z.value}</span>
                  {zone === z.value && (
                    <span className="ml-auto text-xs bg-[#f4b400] text-white px-2 py-0.5 rounded-full">Actif</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pilgrims Counter */}
          <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-500">Pèlerins</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {scannedPilgrims} <span className="text-lg text-gray-400">/ {totalPilgrims}</span>
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${pilgrimPct}%` }}
                />
              </div>
              {missingPilgrims > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">{missingPilgrims} manquant(s)</p>
              )}
              {missingPilgrims === 0 && scannedPilgrims > 0 && (
                <p className="text-xs text-green-600 mt-1 font-medium">Tous présents!</p>
              )}
            </CardContent>
          </Card>

          {/* Bags Counter */}
          <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-500">Bagages</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {scannedBags} <span className="text-lg text-gray-400">/ {totalBags}</span>
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${bagPct}%` }}
                />
              </div>
              {missingBags > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">{missingBags} manquant(s)</p>
              )}
              {missingBags === 0 && scannedBags > 0 && (
                <p className="text-xs text-blue-600 mt-1 font-medium">Tous scannés!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Scanner */}
        <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <QRScanner />
          </CardContent>
        </Card>

        {/* Navigation tabs */}
        <div className="flex gap-2">
          <Button
            onClick={() => setView('list')}
            variant="outline"
            className="flex-1 h-12 rounded-xl text-base font-semibold border-gray-200"
          >
            <List className="w-5 h-5 mr-2" />
            Liste
          </Button>
          <Button
            onClick={() => setView('incidents')}
            variant="outline"
            className="flex-1 h-12 rounded-xl text-base font-semibold border-gray-200"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Incidents
          </Button>
        </div>
      </main>

      {/* Flash Card Overlay (Medical Card) */}
      {flashCard.visible && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={hideFlashCard}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Carte Médicale</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Nom complet</p>
                <p className="text-lg font-bold text-gray-900">{flashCard.fullName}</p>
              </div>
              {flashCard.bloodType && (
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500">Groupe sanguin</p>
                    <p className="text-lg font-bold text-red-600">{flashCard.bloodType}</p>
                  </div>
                </div>
              )}
              {flashCard.allergies && (
                <div className="bg-amber-50 p-3 rounded-xl">
                  <p className="text-xs text-amber-600 font-medium">Allergies</p>
                  <p className="text-base text-amber-800 font-semibold">{flashCard.allergies}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
