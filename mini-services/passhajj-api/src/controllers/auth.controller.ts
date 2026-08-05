// ═══════════════════════════════════════════════════════════════
//  Auth Controller — Registration, Login, Refresh, Logout, Me
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, generateAccessToken, generateRefreshToken, verifyToken } from '../lib';
import { JwtPayload } from '../lib';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validators';

// ─── Register ───────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    const { email, name, password, phone, role } = result.data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        role,
      },
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId ?? undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in DB
    // Decode to get expiry
    const decoded = verifyToken(refreshToken);
    const expiresAt = new Date((decoded as any).exp * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Return response (omit password)
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        agencyId: user.agencyId,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
      return;
    }
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Login ──────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      return;
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId ?? undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in DB
    const decoded = verifyToken(refreshToken);
    const expiresAt = new Date((decoded as any).exp * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Return response (omit password)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        agencyId: user.agencyId,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Refresh Token ──────────────────────────────────────────────
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const result = refreshTokenSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    const { refreshToken: token } = result.data;

    // Verify the refresh token signature
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch {
      res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
      return;
    }

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Token invalide. Un refresh token est requis.' });
      return;
    }

    // Check the token exists in DB and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      res.status(401).json({ error: 'Refresh token non trouvé.' });
      return;
    }

    if (storedToken.revoked) {
      res.status(401).json({ error: 'Refresh token révoqué. Reconnectez-vous.' });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token expiré. Reconnectez-vous.' });
      return;
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      res.status(401).json({ error: 'Utilisateur non trouvé.' });
      return;
    }

    // Issue a new access token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId ?? undefined,
    };

    const accessToken = generateAccessToken(payload);

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        agencyId: user.agencyId,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Refresh token error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Logout ─────────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token requis.' });
      return;
    }

    // Find and revoke the refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      // Still return success to avoid leaking information
      res.json({ message: 'Déconnexion réussie.' });
      return;
    }

    // Revoke the token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    res.json({ message: 'Déconnexion réussie.' });
  } catch (error: any) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Me (Current User Profile) ─────────────────────────────────
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const userPayload = (req as any).user as JwtPayload;

    if (!userPayload || !userPayload.userId) {
      res.status(401).json({ error: 'Non authentifié.' });
      return;
    }

    // Fetch fresh user data from DB
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        agencyId: true,
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            active: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé.' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error('[Auth] Me error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
