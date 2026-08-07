import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Characters for QR code generation (no confusing chars: I, O, 0, 1)
const QR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random alphanumeric string using the same character set as qr.ts
 */
function generatePassportCode(length: number = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += QR_CHARS.charAt(Math.floor(Math.random() * QR_CHARS.length));
  }
  return result;
}

/**
 * Generate a unique passport QR code in format PP-XXXXXX
 */
async function generateUniquePassportQrCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const code = `PP-${generatePassportCode(6)}`;
    const existing = await db.passport.findUnique({
      where: { qrCode: code },
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique passport QR code');
}

// POST - Generate new passport QR codes (admin/agency use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse and validate count (1-100)
    const count = Math.min(Math.max(Math.floor(body.count || 1), 1), 100);

    // Accept agencyId from request (set by admin when generating for an agency)
    const agencyId: string | undefined = body.agencyId || undefined;

    // Generate unique QR codes
    const qrCodes: string[] = [];
    const uniqueCodes = new Set<string>();
    let iterations = 0;
    const maxIterations = 10;

    while (uniqueCodes.size < count && iterations < maxIterations) {
      // Generate candidates to fill remaining slots
      const needed = count - uniqueCodes.size;
      const candidates: string[] = [];
      for (let i = 0; i < needed; i++) {
        candidates.push(`PP-${generatePassportCode(6)}`);
      }

      // Check which ones already exist in DB (single query for all)
      const existing = await db.passport.findMany({
        where: { qrCode: { in: candidates } },
        select: { qrCode: true },
      });
      const existingSet = new Set(existing.map((p) => p.qrCode));

      // Add non-existing candidates
      for (const candidate of candidates) {
        if (!existingSet.has(candidate) && !uniqueCodes.has(candidate)) {
          uniqueCodes.add(candidate);
        }
      }

      iterations++;
    }

    if (uniqueCodes.size < count) {
      return NextResponse.json(
        { error: `Failed to generate ${count} unique QR codes (only got ${uniqueCodes.size})` },
        { status: 500 }
      );
    }

    const allCodes = Array.from(uniqueCodes);

    // Create Passport records with isActive = false, with agencyId if provided
    await db.passport.createMany({
      data: allCodes.map((qrCode) => ({
        qrCode,
        fullName: '', // Will be filled during activation
        isActive: false,
        status: 'pending_activation',
        duration: '1y', // Default 1 year for passports
        agencyId: agencyId || null,
      })),
    });

    return NextResponse.json({
      success: true,
      generated: allCodes.length,
      qrCodes: allCodes,
    });
  } catch (error) {
    console.error('Generate passport QR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
