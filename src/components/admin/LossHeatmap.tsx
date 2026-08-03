'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// ─── Types ───
export interface HeatmapPoint {
  lat: number;
  lng: number;
  count: number;
  lostCount: number;
  city: string | null;
  country: string | null;
  references: string[];
}

interface LossHeatmapProps {
  points: HeatmapPoint[];
  center?: [number, number];
  zoom?: number;
}

// ─── Color interpolation (green → yellow → red based on intensity) ───
function getHeatColor(intensity: number): string {
  // intensity: 0 = low (green), 0.5 = medium (yellow), 1 = high (red)
  const clamped = Math.max(0, Math.min(1, intensity));

  if (clamped < 0.5) {
    // Green → Yellow
    const t = clamped * 2;
    const r = Math.round(255 * t);
    const g = 220;
    const b = Math.round(50 * (1 - t));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow → Red
    const t = (clamped - 0.5) * 2;
    const r = 255;
    const g = Math.round(220 * (1 - t));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// ─── Fix Leaflet default icon paths ───
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LossHeatmap({
  points,
  center = [21.4225, 39.8262], // Mecca, Saudi Arabia
  zoom = 6,
}: LossHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Destroy previous map
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // ─── Create map ───
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
    }).setView(center, zoom);

    // Tile layer (light style for heatmap visibility)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OpenStreetMap')
      .addTo(map);

    if (points.length === 0) {
      // No data message
      L.popup()
        .setLatLng(center)
        .setContent('<div style="font-family:system-ui;padding:8px"><b>📍 Aucune donnée de perte</b><br/>Les pertes signalées apparaîtront ici</div>')
        .openOn(map);
      mapInstance.current = map;
      return;
    }

    // ─── Calculate max for normalization ───
    const maxCount = Math.max(...points.map((p) => p.lostCount || p.count), 1);

    // ─── Draw heatmap circles ───
    points.forEach((point) => {
      const value = point.lostCount || point.count;
      const intensity = value / maxCount;
      const color = getHeatColor(intensity);

      // Circle radius: 8km to 40km based on intensity
      const radius = 8000 + intensity * 32000;

      // Outer glow (larger, semi-transparent)
      L.circle([point.lat, point.lng], {
        radius: radius * 1.5,
        fillColor: color,
        fillOpacity: 0.15 + intensity * 0.15,
        color: color,
        weight: 0,
        interactive: false,
      }).addTo(map);

      // Inner core (smaller, more opaque)
      const circle = L.circle([point.lat, point.lng], {
        radius,
        fillColor: color,
        fillOpacity: 0.3 + intensity * 0.4,
        color: 'rgba(0,0,0,0.3)',
        weight: 1,
      }).addTo(map);

      // Popup with details
      const cityName = point.city || point.country || 'Position inconnue';
      const lostLabel = point.lostCount > 0 ? point.lostCount : point.count;
      const refs = point.references.slice(0, 5).map((r) => `<span style="background:#fef3c7;padding:1px 6px;border-radius:4px;font-size:11px;margin:2px">${r}</span>`).join(' ');

      circle.bindPopup(`
        <div style="font-family:system-ui;min-width:200px;padding:4px">
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px">📍 ${cityName}</div>
          <div style="display:flex;gap:12px;margin-bottom:8px">
            <div style="text-align:center">
              <div style="font-size:20px;font-weight:800;color:#ef4444">${lostLabel}</div>
              <div style="font-size:10px;color:#64748b">Pertes</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:20px;font-weight:800;color:#0f172a">${point.count}</div>
              <div style="font-size:10px;color:#64748b">Scans</div>
            </div>
          </div>
          ${point.references.length > 0 ? `<div style="margin-top:4px"><div style="font-size:10px;color:#64748b;margin-bottom:2px">Références :</div>${refs}</div>` : ''}
        </div>
      `, { className: '' });
    });

    // ─── Fit bounds to show all points ───
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    // ─── Legend ───
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'heatmap-legend');
      div.innerHTML = `
        <div style="background:white;padding:10px 14px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-family:system-ui">
          <div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:6px">Densité de pertes</div>
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-size:10px;color:#64748b">Faible</span>
            <div style="width:12px;height:12px;border-radius:50%;background:rgb(0,220,50)"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:rgb(255,220,0)"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:rgb(255,110,0)"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:rgb(255,0,0)"></div>
            <span style="font-size:10px;color:#64748b">Élevée</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [points, center, zoom]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full rounded-xl" />
    </>
  );
}
