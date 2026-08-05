// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Shared Lib (breaks circular deps)
//  All shared exports that routes and server both need
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
//  ENVIRONMENT CONFIG
// ═══════════════════════════════════════════════════════════════
export const PORT = Number(process.env.PORT) || 3002;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'passhajj-dev-secret-change-in-prod';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ═══════════════════════════════════════════════════════════════
//  PRISMA CLIENT
// ═══════════════════════════════════════════════════════════════
export const prisma = new PrismaClient({
  log: NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['warn', 'error'],
});

// ═══════════════════════════════════════════════════════════════
//  RATE LIMITING
// ═══════════════════════════════════════════════════════════════

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez plus tard.' },
  keyGenerator: (req) => req.ip || 'unknown',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives d\'authentification. Réessayez plus tard.' },
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives OTP. Réessayez plus tard.' },
});

// ═══════════════════════════════════════════════════════════════
//  MULTER — File Upload Configuration (max 2MB)
// ═══════════════════════════════════════════════════════════════

const uploadDirs = ['photos', 'incidents', 'avatars'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const subDir = (req as express.Request & { uploadDir?: string }).uploadDir || 'photos';
    cb(null, path.join(UPLOAD_DIR, subDir));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

export const uploadPhoto = upload.single('photo');
export const uploadAvatar = upload.single('avatar');
export const uploadIncidentPhoto = upload.single('evidence');

// ═══════════════════════════════════════════════════════════════
//  JWT AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  agencyId?: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function authenticate(req: express.Request, _res: express.Response, next: express.NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      _res.status(401).json({ error: 'Token d\'authentification manquant.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    (req as express.Request & { user?: JwtPayload }).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      _res.status(401).json({ error: 'Token expiré. Reconnectez-vous.' });
      return;
    }
    _res.status(401).json({ error: 'Token invalide.' });
  }
}

export function optionalAuth(req: express.Request, _res: express.Response, next: express.NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      (req as express.Request & { user?: JwtPayload }).user = decoded;
    }
    next();
  } catch {
    next();
  }
}

export function authorize(...roles: string[]) {
  return (req: express.Request, _res: express.Response, next: express.NextFunction): void => {
    const user = (req as express.Request & { user?: JwtPayload }).user;
    if (!user) {
      _res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!roles.includes(user.role)) {
      _res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' });
      return;
    }
    next();
  };
}
