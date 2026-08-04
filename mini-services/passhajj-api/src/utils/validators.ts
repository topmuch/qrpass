// ═══════════════════════════════════════════════════════════════
//  Zod Validation Schemas
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Auth Schemas ───

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Nom trop court').max(100),
  password: z.string().min(6, 'Mot de passe trop court (6 min)').max(100),
  phone: z.string().optional(),
  role: z.enum(['agency', 'leader']).default('agency'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

// ─── Agency Schemas ───

export const createAgencySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  maxPilgrims: z.number().int().min(1).max(10000).default(50),
});

export const updateAgencySchema = createAgencySchema.partial();

// ─── Trip Schemas ───

export const createTripSchema = z.object({
  name: z.string().min(2, 'Nom du voyage requis').max(200),
  description: z.string().optional(),
  agencyId: z.string().min(1, 'Agence requise'),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  destination: z.string().optional(),
  transportMode: z.enum(['flight', 'bus', 'boat', 'train']).default('flight'),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  hotelMecca: z.string().optional(),
  hotelMedina: z.string().optional(),
  // Optional: create pilgrims & bags at the same time
  pilgrims: z.array(z.object({
    fullName: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.enum(['M', 'F']).optional(),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.string().optional(),
    diseases: z.string().optional(),
    medicalInfo: z.string().optional(),
    phone: z.string().optional(),
    familyContact: z.string().optional(),
    hotelMecca: z.string().optional(),
    roomMecca: z.string().optional(),
    hotelMedina: z.string().optional(),
    roomMedina: z.string().optional(),
  })).optional(),
  bags: z.array(z.object({
    ownerName: z.string().min(1),
    ownerId: z.string().optional(), // Links to pilgrim index (0-based) in pilgrims array
    baggageType: z.enum(['cabine', 'soute']).default('cabine'),
    baggageIndex: z.number().int().min(1).default(1),
    color: z.string().optional(),
    description: z.string().optional(),
    airline: z.string().optional(),
    flightNumber: z.string().optional(),
    destination: z.string().optional(),
    hotelName: z.string().optional(),
    roomNumber: z.string().optional(),
  })).optional(),
});

export const updateTripSchema = createTripSchema.partial().omit({ pilgrims: true, bags: true });

// ─── OTP Schema ───

export const verifyOtpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, 'OTP doit être exactement 4 chiffres'),
});

// ─── Pilgrim Schemas ───

export const createPilgrimSchema = z.object({
  qrCode: z.string().regex(/^ID-/, 'QR code doit commencer par ID-').optional(),
  fullName: z.string().min(1, 'Nom complet requis'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nationality: z.string().optional(),
  language: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  birthDate: z.string().optional(),
  passportNo: z.string().optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().optional(),
  diseases: z.string().optional(),
  medicalInfo: z.string().optional(),
  phone: z.string().optional(),
  familyContact: z.string().optional(),
  hotelMecca: z.string().optional(),
  roomMecca: z.string().optional(),
  hotelMedina: z.string().optional(),
  roomMedina: z.string().optional(),
  agencyId: z.string().optional(),
  tripId: z.string().optional(),
  groupId: z.string().optional(),
});

export const updatePilgrimSchema = createPilgrimSchema.partial();

// ─── Bag Schemas ───

export const createBagSchema = z.object({
  qrCode: z.string().regex(/^BG-/, 'QR code doit commencer par BG-').optional(),
  ownerName: z.string().min(1, 'Nom du propriétaire requis'),
  ownerId: z.string().optional(),
  baggageType: z.enum(['cabine', 'soute']).default('cabine'),
  baggageIndex: z.number().int().min(1).default(1),
  color: z.string().optional(),
  description: z.string().optional(),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  destination: z.string().optional(),
  hotelName: z.string().optional(),
  roomNumber: z.string().optional(),
  agencyId: z.string().optional(),
  tripId: z.string().optional(),
});

export const updateBagSchema = createBagSchema.partial();

// ─── Scan Sync Schema ───

export const scanItemSchema = z.object({
  id: z.string().min(1), // Client-side ID for dedup
  qrCode: z.string().min(1),
  type: z.enum(['identity', 'baggage']),
  zone: z.enum(['Aéroport', 'Bus', 'Hôtel', 'Haram']),
  timestamp: z.string().min(1), // ISO date string
  status: z.enum(['success', 'error', 'duplicate']).default('success'),
  pilgrimName: z.string().optional(),
  deviceInfo: z.string().optional(), // JSON string
});

export const syncScansSchema = z.object({
  tripId: z.string().min(1, 'tripId requis'),
  scans: z.array(scanItemSchema).min(1, 'Au moins un scan requis'),
});

// ─── Incident Schemas ───

export const createIncidentSchema = z.object({
  type: z.enum(['pilgrim_sick', 'bag_damaged', 'bag_lost', 'pilgrim_missing', 'other']),
  description: z.string().min(1, 'Description requise'),
  relatedQrCode: z.string().optional(),
  relatedName: z.string().optional(),
  tripId: z.string().min(1, 'tripId requis'),
  zone: z.enum(['Aéroport', 'Bus', 'Hôtel', 'Haram']),
  timestamp: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ─── Finder Schema ───

export const finderQuerySchema = z.object({
  qrCode: z.string().min(1, 'QR code requis'),
});

// ─── Type exports ───

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CreatePilgrimInput = z.infer<typeof createPilgrimSchema>;
export type CreateBagInput = z.infer<typeof createBagSchema>;
export type SyncScansInput = z.infer<typeof syncScansSchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
