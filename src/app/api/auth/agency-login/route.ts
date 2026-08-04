import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/passhajj-utils';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Find agency user
    const user = await db.user.findFirst({
      where: { email, role: 'agency' },
      include: { agency: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Identifiants agence incorrects' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants agence incorrects' }, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId || undefined,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
        agency: user.agency ? { id: user.agency.id, name: user.agency.name } : null,
      },
    });
  } catch (error) {
    console.error('[Agency Login] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
