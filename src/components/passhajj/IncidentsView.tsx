'use client';

import { useState } from 'react';
import { usePassHajjStore } from '@/lib/passhajj-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, Plus, X, AlertTriangle, Heart, Package, UserX, FileQuestion, Send,
} from 'lucide-react';
import type { ZoneType } from '@/lib/passhajj-types';

const INCIDENT_TYPES = [
  { value: 'pilgrim_sick' as const, label: 'Pèlerin malade', icon: <Heart className="w-5 h-5 text-red-500" />, color: 'bg-red-100' },
  { value: 'bag_damaged' as const, label: 'Valise déchirée', icon: <Package className="w-5 h-5 text-orange-500" />, color: 'bg-orange-100' },
  { value: 'bag_lost' as const, label: 'Bagage perdu', icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, color: 'bg-amber-100' },
  { value: 'pilgrim_missing' as const, label: 'Pèlerin disparu', icon: <UserX className="w-5 h-5 text-purple-500" />, color: 'bg-purple-100' },
  { value: 'other' as const, label: 'Autre', icon: <FileQuestion className="w-5 h-5 text-gray-500" />, color: 'bg-gray-100' },
];

export default function IncidentsView() {
  const { incidents, addIncident, zone, setView, syncStatus } = usePassHajjStore();
  const [showForm, setShowForm] = useState(false);
  const [incType, setIncType] = useState<'pilgrim_sick' | 'bag_damaged' | 'bag_lost' | 'pilgrim_missing' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [relatedName, setRelatedName] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) return;
    addIncident({
      type: incType,
      description: description.trim(),
      relatedName: relatedName.trim() || undefined,
      zone: zone as ZoneType,
      timestamp: new Date().toISOString(),
    });
    setDescription('');
    setRelatedName('');
    setShowForm(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeLabel = (type: string) => {
    return INCIDENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#f4b400] text-white px-4 py-3 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="p-1 rounded-lg hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Journal d&apos;Incidents</h1>
            <p className="text-xs text-white/80">Zone: {zone}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 rounded-lg hover:bg-white/20"
          >
            {showForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
        {/* Offline notice */}
        {syncStatus === 'offline' && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 text-sm rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Hors ligne — les incidents seront synchronisés automatiquement.</span>
          </div>
        )}

        {/* Add incident form */}
        {showForm && (
          <Card className="rounded-xl border-0 shadow-md">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Signaler un incident</h3>

              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setIncType(t.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-colors ${
                      incType === t.value
                        ? 'bg-[#f4b400]/10 border-2 border-[#f4b400]'
                        : `${t.color} border-2 border-transparent`
                    }`}
                  >
                    {t.icon}
                    <span className="text-sm font-medium text-gray-900">{t.label}</span>
                  </button>
                ))}
              </div>

              <Input
                value={relatedName}
                onChange={(e) => setRelatedName(e.target.value)}
                placeholder="Nom de la personne concernée (optionnel)"
                className="h-12 rounded-xl text-base"
              />

              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de l'incident..."
                className="h-12 rounded-xl text-base"
              />

              <Button
                onClick={handleSubmit}
                disabled={!description.trim()}
                className="w-full h-12 rounded-xl bg-[#f4b400] hover:bg-[#daa000] text-white font-bold text-base"
              >
                <Send className="w-5 h-5 mr-2" />
                Signaler
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Incidents list */}
        {incidents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Aucun incident signalé</p>
            <p className="text-sm">Appuyez sur + pour en signaler un</p>
          </div>
        ) : (
          incidents.map((inc) => {
            const typeInfo = INCIDENT_TYPES.find((t) => t.value === inc.type);
            return (
              <Card key={inc.id} className="rounded-xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeInfo?.color || 'bg-gray-100'}`}>
                      {typeInfo?.icon || <AlertTriangle className="w-5 h-5 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{typeLabel(inc.type)}</span>
                        {!inc.synced && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                            Non syncé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{inc.description}</p>
                      {inc.relatedName && (
                        <p className="text-xs text-gray-500 mt-1">Concerne: {inc.relatedName}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(inc.timestamp)} &middot; {inc.zone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
