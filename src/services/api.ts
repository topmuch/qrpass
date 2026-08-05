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

// ─── JWT Token Management (for Express backend agency auth) ───
const TOKEN_KEY = 'passhajj_agency_token';
const REFRESH_TOKEN_KEY = 'passhajj_agency_refresh_token';
const USER_KEY = 'passhajj_agency_user';

export function getAgencyToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAgencyTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setAgencyUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAgencyUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAgencyAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAgencyAuthenticated(): boolean {
  return !!getAgencyToken();
}

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

// Express: Add XTransformPort for Caddy gateway + JWT token
expressApi.interceptors.request.use((config) => {
  const separator = config.url?.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}XTransformPort=${EXPRESS_PORT}`;
  config.headers['X-Request-ID'] = `pwa-e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // Attach JWT token if available
  const token = getAgencyToken();
  if (token && !config.headers?.['No-Auth']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  // Remove custom No-Auth header before sending
  delete config.headers?.['No-Auth'];
  return config;
});

// Next.js: Add request ID
nextApi.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = `pwa-n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return config;
});

// ─── Response Interceptors: Offline error handling + 401 auto-logout ───
const offlineInterceptor = (error: any) => {
  if (!error.response) {
    const isOffline = !navigator.onLine;
    error.isOffline = isOffline;
    error.offlineMessage = isOffline
      ? 'Pas de connexion internet. Vos données seront synchronisées plus tard.'
      : 'Erreur réseau. Veuillez réessayer.';
  }
  // Auto-logout on 401 from Express backend
  if (error.response?.status === 401 && error.config?.url?.includes('XTransformPort')) {
    clearAgencyAuth();
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/agency/login')) {
      window.location.href = '/agency/login';
    }
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

// ═══════════════════════════════════════════════════════════════
//  AGENCY AUTH — Login via Express backend JWT
// ═══════════════════════════════════════════════════════════════

export interface AgencyLoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    agencyId?: string | null;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

/** Agency login → POST /api/auth/agency-login (Next.js API route) */
export async function agencyLogin(email: string, password: string): Promise<AgencyLoginResponse> {
  const { data } = await nextApi.post('/auth/agency-login', { email, password });
  // Adapt Next.js API response format to match AgencyLoginResponse
  const result: AgencyLoginResponse = {
    user: data.user,
    accessToken: data.token,
    refreshToken: data.token, // Next.js route returns a single JWT token
  };
  // Store tokens
  setAgencyTokens(result.accessToken, result.refreshToken);
  setAgencyUser(result.user);
  return result;
}

/** Agency logout → Clear local tokens */
export async function agencyLogout(): Promise<void> {
  clearAgencyAuth();
}

/** Get current user profile → from stored user data */
export async function agencyGetMe(): Promise<{ user: any }> {
  const user = getAgencyUser();
  return { user };
}

// ═══════════════════════════════════════════════════════════════
//  TRIPS — CRUD via Express backend
// ═══════════════════════════════════════════════════════════════

export interface TripListItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  otp: string;
  otpExpiry: string;
  otpUsed: boolean;
  agencyId: string;
  departureDate?: string | null;
  returnDate?: string | null;
  destination?: string | null;
  transportMode?: string | null;
  airline?: string | null;
  flightNumber?: string | null;
  hotelMecca?: string | null;
  hotelMedina?: string | null;
  totalPilgrims: number;
  totalBags: number;
  pilgrimCount: number;
  bagCount: number;
  createdAt: string;
  updatedAt: string;
  agency: { id: string; name: string; slug: string };
}

export interface TripDetail extends TripListItem {
  groups: Array<{
    id: string;
    name: string;
    color?: string | null;
    leaderName?: string | null;
    _count: { pilgrims: number };
  }>;
}

export interface TripsListResponse {
  data: TripListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** List trips → GET /api/trips */
export async function listTrips(params?: { page?: number; limit?: number; agencyId?: string; status?: string }): Promise<TripsListResponse> {
  const { data } = await expressApi.get<TripsListResponse>('/trips', { params });
  return data;
}

/** Get trip by ID → GET /api/trips/:id */
export async function getTrip(id: string): Promise<TripDetail> {
  const { data } = await expressApi.get<TripDetail>(`/trips/${id}`);
  return data;
}

/** Create trip → POST /api/trips */
export async function createTrip(tripData: {
  name: string;
  description?: string;
  agencyId: string;
  departureDate?: string;
  returnDate?: string;
  destination?: string;
  transportMode?: 'flight' | 'bus' | 'boat' | 'train';
  airline?: string;
  flightNumber?: string;
  hotelMecca?: string;
  hotelMedina?: string;
  pilgrims?: any[];
  bags?: any[];
}): Promise<any> {
  const { data } = await expressApi.post('/trips', tripData);
  return data;
}

/** Update trip → PUT /api/trips/:id */
export async function updateTrip(id: string, tripData: any): Promise<any> {
  const { data } = await expressApi.put(`/trips/${id}`, tripData);
  return data;
}

/** Cancel trip → DELETE /api/trips/:id */
export async function cancelTrip(id: string): Promise<any> {
  const { data } = await expressApi.delete(`/trips/${id}`);
  return data;
}

/** Regenerate OTP → POST /api/trips/:id/regenerate-otp */
export async function regenerateOTP(tripId: string): Promise<{ message: string; otp: string; otpExpiry: string; tripId: string; tripName: string }> {
  const { data } = await expressApi.post(`/trips/${tripId}/regenerate-otp`);
  return data;
}

// ═══════════════════════════════════════════════════════════════
//  SCANS — Statistics via Express backend
// ═══════════════════════════════════════════════════════════════

export interface ScanStats {
  tripId: string;
  total: number;
  byType: Record<string, number>;
  byZone: Record<string, number>;
  byStatus: Record<string, number>;
  sync: { synced: number; unsynced: number };
  timeline: Record<string, number>;
}

/** Get scan stats → GET /api/scans/stats?tripId= */
export async function getScanStats(tripId: string): Promise<ScanStats> {
  const { data } = await expressApi.get<ScanStats>('/scans/stats', { params: { tripId } });
  return data;
}

// ═══════════════════════════════════════════════════════════════
//  FINDER — Public QR code lookup (no auth required)
// ═══════════════════════════════════════════════════════════════

export interface FinderIdentityResult {
  type: 'identity';
  qrCode: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  nationality?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  diseases?: string | null;
  medicalInfo?: string | null;
  hotelMecca?: string | null;
  roomMecca?: string | null;
  hotelMedina?: string | null;
  roomMedina?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  group: { name: string; color?: string | null } | null;
  activeIncidents: any[];
}

export interface FinderBaggageResult {
  type: 'baggage';
  qrCode: string;
  ownerName: string;
  baggageType?: string | null;
  baggageIndex?: number | null;
  color?: string | null;
  description?: string | null;
  airline?: string | null;
  flightNumber?: string | null;
  destination?: string | null;
  hotelName?: string | null;
  roomNumber?: string | null;
  status?: string | null;
  photoUrl?: string | null;
  activeIncidents: any[];
}

export type FinderResult = FinderIdentityResult | FinderBaggageResult;

/** Finder lookup → GET /api/finder/:qrCode (PUBLIC) */
export async function finderLookup(qrCode: string): Promise<FinderResult> {
  const { data } = await expressApi.get<FinderResult>(`/finder/${qrCode}`, {
    headers: { 'No-Auth': 'true' }, // Public endpoint, no token needed
  });
  return data;
}

// ═══════════════════════════════════════════════════════════════
//  PILGRIMS & BAGS — Agency-scoped queries
// ═══════════════════════════════════════════════════════════════

/** List pilgrims → GET /api/pilgrims */
export async function listPilgrims(params?: { agencyId?: string; tripId?: string; page?: number; limit?: number }): Promise<any> {
  const { data } = await expressApi.get('/pilgrims', { params });
  return data;
}

/** List bags → GET /api/bags */
export async function listBags(params?: { agencyId?: string; tripId?: string; page?: number; limit?: number }): Promise<any> {
  const { data } = await expressApi.get('/bags', { params });
  return data;
}

// Export both instances for custom calls
export { expressApi, nextApi };
