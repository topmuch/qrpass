// ═══════════════════════════════════════════════════════════════
//  QR Code Generator Utility
//  Generates unique QR codes with ID- and BG- prefixes
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { prisma } from '../lib';

// Character set: alphanumeric without ambiguous chars (0, O, I, 1, L)
const SAFE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a random alphanumeric string of given length
 * Uses only safe characters (no ambiguous 0/O/I/1/L)
 */
function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
  }
  return result;
}

/**
 * Generate a unique QR code for a Pilgrim (Identity bracelet)
 * Format: "ID-{5 alphanumeric chars}"  e.g. "ID-3M8N5"
 *
 * Ensures uniqueness by checking the database.
 * Retries up to 5 times with different random values.
 */
export async function generateIdentityQR(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const qrCode = `ID-${randomChars(5)}`;
    const existing = await prisma.pilgrim.findUnique({ where: { qrCode } });
    if (!existing) return qrCode;
  }
  // Fallback: use longer random string with timestamp
  const fallback = `ID-${Date.now().toString(36).toUpperCase().slice(-5)}${randomChars(3)}`;
  return fallback;
}

/**
 * Generate a unique QR code for a Bag (Baggage)
 * Format: "BG-{6 alphanumeric chars}"  e.g. "BG-3M8N5K"
 *
 * Ensures uniqueness by checking the database.
 * Retries up to 5 times with different random values.
 */
export async function generateBaggageQR(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const qrCode = `BG-${randomChars(6)}`;
    const existing = await prisma.bag.findUnique({ where: { qrCode } });
    if (!existing) return qrCode;
  }
  // Fallback: use longer random string with timestamp
  const fallback = `BG-${Date.now().toString(36).toUpperCase().slice(-6)}${randomChars(3)}`;
  return fallback;
}

/**
 * Generate a batch of unique QR codes for pilgrims
 * Useful when creating multiple pilgrims at once (trip creation)
 */
export async function generateIdentityQRCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(await generateIdentityQR());
  }
  return codes;
}

/**
 * Generate a batch of unique QR codes for bags
 * Useful when creating multiple bags at once (trip creation)
 */
export async function generateBaggageQRCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(await generateBaggageQR());
  }
  return codes;
}

/**
 * Detect QR code type from prefix
 * Returns "identity" for ID- prefix, "baggage" for BG- prefix, "unknown" otherwise
 */
export function detectQRType(qrCode: string): 'identity' | 'baggage' | 'unknown' {
  if (qrCode.startsWith('ID-')) return 'identity';
  if (qrCode.startsWith('BG-')) return 'baggage';
  return 'unknown';
}

/**
 * Generate a 4-digit OTP code
 * Ensures it doesn't conflict with existing active OTPs
 */
export async function generateOTP(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const otp = String(Math.floor(1000 + Math.random() * 9000)); // 1000-9999
    const existing = await prisma.trip.findUnique({ where: { otp } });
    if (!existing) return otp;
  }
  // Extremely unlikely fallback
  throw new Error('Impossible de générer un OTP unique après 20 tentatives.');
}
