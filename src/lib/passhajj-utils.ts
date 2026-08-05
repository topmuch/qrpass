import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ─── QR Code Generation ───

const QR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/O/0/1

/**
 * Generate a unique QR code with prefix
 * ID-XXXXX for pilgrim identity bracelets
 * BG-XXXXX for baggage tags
 */
export async function generateQrCode(prefix: 'ID' | 'BG', length = 5): Promise<string> {
  let attempts = 0;
  while (attempts < 50) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += QR_CHARS[Math.floor(Math.random() * QR_CHARS.length)];
    }
    const qrCode = `${prefix}-${code}`;
    if (prefix === 'ID') {
      const exists = await db.pilgrim.findUnique({ where: { qrCode } });
      if (!exists) return qrCode;
    } else {
      const exists = await db.bag.findUnique({ where: { qrCode } });
      if (!exists) return qrCode;
    }
    attempts++;
  }
  // Fallback with timestamp
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// ─── OTP Generation ───

/**
 * Generate a random 4-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a unique 4-digit OTP that doesn't exist in the Trip table
 */
export async function generateUniqueOtp(): Promise<string> {
  let attempts = 0;
  while (attempts < 100) {
    const otp = generateOtp();
    const exists = await db.trip.findUnique({ where: { otp } });
    if (!exists) return otp;
    attempts++;
  }
  throw new Error('Could not generate unique OTP after 100 attempts');
}

/**
 * Check if an OTP is valid (exists, not expired, optionally not used)
 */
export async function validateOtp(otp: string, checkUsed = false) {
  const trip = await db.trip.findUnique({
    where: { otp },
    include: {
      agency: { select: { id: true, name: true } },
      pilgrims: true,
      bags: true,
      groups: true,
    },
  });

  if (!trip) return { valid: false as const, error: 'Code OTP non reconnu' };
  if (trip.otpExpiry < new Date()) return { valid: false as const, error: 'Code OTP expiré' };
  if (checkUsed && trip.isUsed) return { valid: false as const, error: 'Code OTP déjà utilisé' };
  if (trip.status !== 'active') return { valid: false as const, error: 'Voyage non actif' };

  return { valid: true as const, trip };
}

// ─── Password Hashing ───

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token ───

const JWT_SECRET = process.env.JWT_SECRET || 'passhajj-dev-secret-change-in-prod';
const JWT_EXPIRY = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  agencyId?: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Zod Validation Schemas ───

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe: min 6 caractères'),
  name: z.string().min(2, 'Nom: min 2 caractères').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const agencyLoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const activateBaggageSchema = z.object({
  qrCode: z.string().min(1, 'QR code requis'),
  ownerName: z.string().min(2, 'Nom du propriétaire requis'),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  destination: z.string().optional(),
  hotelName: z.string().optional(),
  roomNumber: z.string().optional(),
});

export const activateIdentitySchema = z.object({
  qrCode: z.string().min(1, 'QR code requis'),
  fullName: z.string().min(2, 'Nom complet requis'),
  nationality: z.string().min(2, 'Nationalité requise'),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalInfo: z.string().optional(),
  hotelMecca: z.string().optional(),
  roomMecca: z.string().optional(),
  hotelMedina: z.string().optional(),
  roomMedina: z.string().optional(),
  phone: z.string().optional(),
  familyContact: z.string().optional(),
});

export const createTripSchema = z.object({
  name: z.string().min(2, 'Nom du voyage requis'),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  destination: z.string().optional(),
  transportMode: z.enum(['flight', 'bus', 'boat', 'train']).default('flight'),
});

export const syncScansSchema = z.object({
  scans: z.array(z.object({
    id: z.string(),
    qrCode: z.string(),
    type: z.enum(['identity', 'baggage']),
    timestamp: z.string(),
    zone: z.string(),
    status: z.enum(['success', 'error', 'duplicate']),
    pilgrimName: z.string().optional(),
  })).optional(),
  incidents: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    relatedQrCode: z.string().optional(),
    relatedName: z.string().optional(),
    zone: z.string(),
    timestamp: z.string(),
  })).optional(),
});

export const finderReportSchema = z.object({
  qrCode: z.string().min(1, 'QR code requis'),
  finderName: z.string().min(2, 'Votre nom requis'),
  finderPhone: z.string().min(6, 'Téléphone requis'),
  message: z.string().optional(),
});
