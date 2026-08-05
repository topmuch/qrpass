'use client';

import { useState, useCallback } from 'react';
import { MapPin, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
//  GPSButton — Share GPS location via WhatsApp or Google Maps
//
//  Workflow:
//  1. Request geolocation via navigator.geolocation
//  2. Build Google Maps URL with coordinates
//  3. If phone provided → open WhatsApp with location message
//  4. If no phone → open Google Maps in new tab
//  5. On error (denied/unavailable) → show toast error
// ═══════════════════════════════════════════════════════════════

interface GPSButtonProps {
  phone?: string;
  label?: string;
  className?: string;
}

type GpsStatus = 'idle' | 'locating' | 'success';

export default function GPSButton({
  phone,
  label = 'Partager ma position',
  className,
}: GPSButtonProps) {
  const [status, setStatus] = useState<GpsStatus>('idle');

  const handleClick = useCallback(() => {
    if (status === 'locating') return;

    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible', {
        description: 'Votre navigateur ne supporte pas la géolocalisation.',
      });
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

        setStatus('success');

        // Brief success state before redirecting
        setTimeout(() => {
          if (phone) {
            // Build WhatsApp message with location
            const message = `Je suis ici: ${mapsUrl}`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
          } else {
            // No phone — just open Google Maps
            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
          }

          // Reset status after action
          setTimeout(() => setStatus('idle'), 1500);
        }, 600);
      },
      (error) => {
        setStatus('idle');

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Localisation refusée', {
              description:
                'Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.',
              duration: 5000,
            });
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Position indisponible', {
              description: 'Impossible de déterminer votre position actuelle.',
              duration: 5000,
            });
            break;
          case error.TIMEOUT:
            toast.error('Délai expiré', {
              description: 'La demande de géolocalisation a expiré. Réessayez.',
              duration: 5000,
            });
            break;
          default:
            toast.error('Erreur de géolocalisation', {
              description: 'Une erreur inconnue est survenue.',
              duration: 5000,
            });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, [status, phone]);

  return (
    <Button
      onClick={handleClick}
      disabled={status === 'locating'}
      className={`relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-300 ${
        status === 'locating' ? 'animate-pulse' : ''
      } ${className || ''}`}
    >
      {status === 'idle' && (
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {label}
        </span>
      )}

      {status === 'locating' && (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Localisation…
        </span>
      )}

      {status === 'success' && (
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          Position obtenue !
        </span>
      )}
    </Button>
  );
}
