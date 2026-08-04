// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Backend API Server
//  Express + TypeScript + Prisma + JWT + Multer + CORS
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
//  ENVIRONMENT CONFIG
// ═══════════════════════════════════════════════════════════════
const PORT = Number(process.env.PORT) || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'passhajj-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024; // 2MB default
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ═══════════════════════════════════════════════════════════════
//  PRISMA CLIENT
// ═══════════════════════════════════════════════════════════════
export const prisma = new PrismaClient({
  log: NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

// ═══════════════════════════════════════════════════════════════
//  EXPRESS APP
// ═══════════════════════════════════════════════════════════════
const app = express();

// ═══════════════════════════════════════════════════════════════
//  GLOBAL MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// --- CORS ---
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400, // 24h preflight cache
}));

// --- Helmet (Security Headers) ---
app.use(helmet({
  crossOriginResourceSharing: { policy: 'cross-origin' },
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));

// --- Body Parsing ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez plus tard.' },
  keyGenerator: (req) => req.ip || 'unknown',
});
app.use(globalLimiter);

// Stricter rate limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 min
  message: { error: 'Trop de tentatives d\'authentification. Réessayez plus tard.' },
});

// Stricter rate limit for OTP verification
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 OTP attempts per 5 min
  message: { error: 'Trop de tentatives OTP. Réessayez plus tard.' },
});

// ═══════════════════════════════════════════════════════════════
//  MULTER — File Upload Configuration (max 2MB)
// ═══════════════════════════════════════════════════════════════

// Ensure upload directories exist
const uploadDirs = ['photos', 'incidents', 'avatars'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Route-based destination: /upload/photos, /upload/incidents, /upload/avatars
    const subDir = (req as express.Request & { uploadDir?: string }).uploadDir || 'photos';
    cb(null, path.join(UPLOAD_DIR, subDir));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter — only images
const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.'));
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 2MB
    files: 1, // Single file per upload
  },
});

// Convenience middlewares for different upload types
export const uploadPhoto = upload.single('photo');
export const uploadAvatar = upload.single('avatar');
export const uploadIncidentPhoto = upload.single('evidence');

// ═══════════════════════════════════════════════════════════════
//  JWT AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

import jwt from 'jsonwebtoken';

// JWT payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  agencyId?: string;
}

// Generate access token
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

// Verify token
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// Auth middleware — requires valid JWT
export function authenticate(req: express.Request, _res: express.Response, next: express.NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      _res.status(401).json({ error: 'Token d\'authentification manquant.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Attach user info to request
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

// Optional auth — doesn't fail if no token
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
    // Continue without auth
    next();
  }
}

// Role-based authorization
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

// ═══════════════════════════════════════════════════════════════
//  REQUEST LOGGING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

app.use((req, _res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Log on response finish
  _res.on('finish', () => {
    const duration = Date.now() - start;
    const level = _res.statusCode >= 500 ? 'ERROR' : _res.statusCode >= 400 ? 'WARN' : 'INFO';
    if (NODE_ENV === 'development' || level !== 'INFO') {
      console.log(`[${level}] ${requestId} ${req.method} ${req.originalUrl} → ${_res.statusCode} (${duration}ms)`);
    }
  });

  next();
});

// ═══════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

app.get('/health', async (_req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  API VERSION INFO
// ═══════════════════════════════════════════════════════════════

app.get('/api', (_req, res) => {
  res.json({
    name: 'PassHajj Manager API',
    version: '1.0.0',
    description: 'Backend API for PassHajj Manager — Hajj group leader PWA',
    endpoints: {
      auth: '/api/auth',
      trips: '/api/trips',
      pilgrims: '/api/pilgrims',
      bags: '/api/bags',
      scans: '/api/scans',
      incidents: '/api/incidents',
      agencies: '/api/agencies',
      leader: '/api/leader',
      finder: '/api/finder',
    },
  });
});

// ═══════════════════════════════════════════════════════════════
//  ROUTE MOUNTING (stub — will be implemented after validation)
// ═══════════════════════════════════════════════════════════════

// --- Auth Routes ---
// app.use('/api/auth', authRoutes);

// --- Agency Routes (admin only) ---
// app.use('/api/agencies', authenticate, authorize('superadmin', 'admin'), agencyRoutes);

// --- Trip Routes ---
// app.use('/api/trips', authenticate, tripRoutes);

// --- Pilgrim Routes ---
// app.use('/api/pilgrims', authenticate, pilgrimRoutes);

// --- Bag Routes ---
// app.use('/api/bags', authenticate, bagRoutes);

// --- Scan Routes (sync from PWA) ---
// app.use('/api/scans', authenticate, scanRoutes);

// --- Incident Routes ---
// app.use('/api/incidents', authenticate, incidentRoutes);

// --- Leader PWA Routes (OTP-based, no JWT required for verify) ---
// app.use('/api/leader', leaderRoutes);

// --- Finder Routes (public QR scan lookup) ---
// app.use('/api/finder', finderRoutes);

// --- Webhook Routes ---
// app.use('/api/webhooks', webhookRoutes);

// ═══════════════════════════════════════════════════════════════
//  STATIC FILE SERVING (Uploaded Files)
// ═══════════════════════════════════════════════════════════════

app.use('/uploads', express.static(path.resolve(UPLOAD_DIR), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// ═══════════════════════════════════════════════════════════════
//  404 HANDLER
// ═══════════════════════════════════════════════════════════════

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé.',
    documentation: '/api',
  });
});

// ═══════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Multer file size error
  if (err.message?.includes('File too large')) {
    res.status(413).json({
      error: 'Fichier trop volumineux. Taille maximale : 2MB.',
      maxSize: MAX_FILE_SIZE,
    });
    return;
  }

  // Multer file type error
  if (err.message?.includes('Type de fichier non autorisé')) {
    res.status(415).json({ error: err.message });
    return;
  }

  // Prisma errors
  if (err.message?.includes('Unique constraint')) {
    res.status(409).json({
      error: 'Conflit : cette ressource existe déjà.',
      detail: NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Token invalide.' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expiré.' });
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    res.status(400).json({
      error: 'Données invalides.',
      details: JSON.parse(err.message),
    });
    return;
  }

  // Default error
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Erreur interne du serveur.',
    detail: NODE_ENV === 'development' ? err.message : undefined,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ═══════════════════════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

async function gracefulShutdown(signal: string) {
  console.log(`\n[${signal}] Graceful shutdown initiated...`);

  // Close Express server
  server.close(() => {
    console.log('[Server] HTTP server closed.');
  });

  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('[Prisma] Disconnected.');

  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       PASSHAJJ MANAGER — Backend API             ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Port:      ${String(PORT).padEnd(38)}║`);
  console.log(`║  Env:       ${NODE_ENV.padEnd(38)}║`);
  console.log(`║  Database:  sqlite://${'passhajj-api.db'.padEnd(30)}║`);
  console.log(`║  JWT Exp:   ${JWT_EXPIRES_IN.padEnd(38)}║`);
  console.log(`║  Max File:  ${`${MAX_FILE_SIZE / 1024 / 1024}MB`.padEnd(38)}║`);
  console.log(`║  CORS:      ${CORS_ORIGIN.padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n📡 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
});

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

export { app, server };
