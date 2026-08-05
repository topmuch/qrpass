import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken, loginSchema } from '@/lib/passhajj-utils';
import { createSession, logLoginAttempt } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email },
      include: { agency: { select: { id: true, name: true, slug: true, email: true, phone: true, address: true } } },
    });
    if (!user || !user.password) {
      await logLoginAttempt({ email, success: false, failureReason: 'User not found' });
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await logLoginAttempt({ userId: user.id, email, success: false, failureReason: 'Invalid password' });
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Create server-side session (sets HTTP-only cookie)
    await createSession(user.id);

    // Log successful login
    await logLoginAttempt({ userId: user.id, email, success: true });

    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId || undefined,
    });

    const refreshToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
        agency: user.agency,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
