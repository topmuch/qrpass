// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Axios API Client
//  Offline-aware HTTP client with dual-backend support:
//  1. Express backend (port 3002) via XTransformPort gateway
//  2. Next.js API routes as fallback
// ═══════════════════════════════════════════════════════════════

import axios from 'axios';
import type {
  VerifyOtpResponse,
  SyncScansResponse,
  SyncIncidentsResponse,
  TripStatusResponse,
} from '@/lib/passhajj-types';

// ─── Backend ports ───
const EXPRESS_PORT = 3002; // Express backend (mini-service)

// ─── Express API Instance (via Caddy gateway → port 3002) ───
const expressApi = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Next.js API Instance (no port transform, same server) ───
const nextApi = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptors ───

// Express: Add XTransformPort for Caddy gateway
expressApi.interceptors.request.use((config) => {
  const separator = config.url?.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}XTransformPort=${EXPRESS_PORT}`;
  config.headers['X-Request-ID'] = `pwa-e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return config;
});

// Next.js: Add request ID
nextApi.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = `pwa-n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return config;
});

// ─── Response Interceptors: Offline error handling ───
const offlineInterceptor = (error: any) => {
  if (!error.response) {
    const isOffline = !navigator.onLine;
    error.isOffline = isOffline;
    error.offlineMessage = isOffline
      ? 'Pas de connexion internet. Vos données seront synchronisées plus tard.'
      : 'Erreur réseau. Veuillez réessayer.';
  }
  return Promise.reject(error);
};

expressApi.interceptors.response.use((r) => r, offlineInterceptor);
nextApi.interceptors.response.use((r) => r, offlineInterceptor);

// Extend AxiosError type for our custom properties
declare module 'axios' {
  interface AxiosError {
    isOffline?: boolean;
    offlineMessage?: string;
  }
}

// ═══════════════════════════════════════════════════════════════
//  API METHODS — Dual backend with Express-first strategy
// ═══════════════════════════════════════════════════════════════

/**
 * Verify OTP — PWA entry point
 * Try Express backend first, fall back to Next.js API
 */
export async function verifyOTP(otp: string): Promise<VerifyOtpResponse> {
  // Try Express backend first (POST /api/leader/verify-otp → port 3002)
  try {
    const { data } = await expressApi.post('/leader/verify-otp', { otp });
    if (data.success) {
      // Transform Express response format to our VerifyOtpResponse
      return transformExpressVerifyResponse(data);
    }
    return data;
  } catch (expressErr) {
    console.warn('[API] Express backend unavailable, falling back to Next.js API:', expressErr);

    // Fall back to Next.js API route (POST /api/leader/trips/verify)
    const { data } = await nextApi.post<VerifyOtpResponse>('/leader/trips/verify', { otp });
    return data;
  }
}

/**
 * Sync offline scan records to server
 * Try Express backend first, fall back to Next.js API
 */
export async function syncScans(
  tripId: string,
  scans: Array<{
    id: string;
    qrCode: string;
    type: string;
    timestamp: string;
    zone: string;
    status: string;
    pilgrimName?: string;
    deviceInfo?: string;
  }>
): Promise<SyncScansResponse> {
  // Try Express backend first
  try {
    const { data } = await expressApi.post<SyncScansResponse>('/leader/sync-scans', {
      tripId,
      scans,
    });
    return data;
  } catch {
    // Fall back to Next.js API
    const { data } = await nextApi.post<SyncScansResponse>('/leader/trips/sync', {
      scans,
      incidents: [],
    });
    return data;
  }
}

/**
 * Sync offline incident records to server
 * Try Express backend first, fall back to Next.js API
 */
export async function syncIncidents(
  incidents: Array<{
    type: string;
    description: string;
    relatedQrCode?: string;
    relatedName?: string;
    tripId: string;
    zone: string;
    timestamp: string;
    priority?: string;
    latitude?: number;
    longitude?: number;
  }>
): Promise<SyncIncidentsResponse> {
  // Try Express backend first
  try {
    const { data } = await expressApi.post<SyncIncidentsResponse>('/leader/sync-incidents', {
      incidents,
    });
    return data;
  } catch {
    // Fall back to Next.js API
    const { data } = await nextApi.post<SyncScansResponse>('/leader/trips/sync', {
      scans: [],
      incidents,
    });
    // Adapt response format
    return {
      success: data.success,
      synced: data.synced,
      skipped: [],
      count: data.count,
    };
  }
}

/**
 * Get trip status (counters)
 * Try Express backend first
 */
export async function getTripStatus(tripId: string): Promise<TripStatusResponse> {
  try {
    const { data } = await expressApi.get<TripStatusResponse>(`/leader/trip/${tripId}/status`);
    return data;
  } catch {
    // No Next.js fallback for this endpoint
    throw new Error('Trip status unavailable');
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{ status: string; database: string }> {
  try {
    const { data } = await expressApi.get<{ status: string; database: string }>('/health');
    return data;
  } catch {
    return { status: 'unavailable', database: 'unknown' };
  }
}

// ═══════════════════════════════════════════════════════════════
//  HELPER: Transform Express verify-otp response to VerifyOtpResponse
//  Express returns: { success, trip: {...}, agency: {...}, pilgrims: [...], bags: [...], groups: [...] }
//  We need: { success, data: { tripId, tripName, agencyName, pilgrims, bags } }
// ═══════════════════════════════════════════════════════════════

function transformExpressVerifyResponse(expressData: any): VerifyOtpResponse {
  const { trip, agency, pilgrims, bags, groups } = expressData;

  return {
    success: true,
    data: {
      tripId: trip.id,
      tripName: trip.name,
      agencyName: agency?.name || 'Agence inconnue',
      pilgrims: (pilgrims || []).map((p: any) => ({
        id: p.id,
        qrCode: p.qrCode,
        fullName: p.fullName,
        bloodType: p.bloodType || undefined,
        allergies: p.allergies || undefined,
        group: p.group?.name || groups?.find((g: any) => g.id === p.groupId)?.name,
      })),
      bags: (bags || []).map((b: any) => ({
        id: b.id,
        qrCode: b.qrCode,
        ownerName: b.ownerName,
        ownerId: b.ownerId || undefined,
        baggageType: b.baggageType,
        airline: b.airline,
        flightNumber: b.flightNumber,
        status: b.status,
      })),
    },
  };
}

// Export both instances for custom calls
export { expressApi, nextApi };
