// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Backend API Server
//  Express + TypeScript + Prisma + JWT + Multer + CORS
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

// Import shared lib (breaks circular deps with routes)
import {
  prisma, PORT, NODE_ENV, CORS_ORIGIN, UPLOAD_DIR, MAX_FILE_SIZE,
  JWT_EXPIRES_IN, globalLimiter, authenticate,
} from './lib';

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
  maxAge: 86400,
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
app.use(globalLimiter);

// ═══════════════════════════════════════════════════════════════
//  REQUEST LOGGING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

app.use((req, _res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
//  ROUTE IMPORTS
// ═══════════════════════════════════════════════════════════════

import authRoutes from './routes/auth.routes';
import agencyRoutes from './routes/agency.routes';
import tripRoutes from './routes/trips.routes';
import pilgrimRoutes from './routes/pilgrim.routes';
import bagRoutes from './routes/bag.routes';
import scanRoutes from './routes/scan.routes';
import incidentRoutes from './routes/incident.routes';
import leaderRoutes from './routes/leader.routes';
import finderRoutes from './routes/finder.routes';

// ═══════════════════════════════════════════════════════════════
//  ROUTE MOUNTING
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/pilgrims', pilgrimRoutes);
app.use('/api/bags', bagRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/leader', leaderRoutes);
app.use('/api/finder', finderRoutes);

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
  if (err.message?.includes('File too large')) {
    res.status(413).json({
      error: 'Fichier trop volumineux. Taille maximale : 2MB.',
      maxSize: MAX_FILE_SIZE,
    });
    return;
  }

  if (err.message?.includes('Type de fichier non autorisé')) {
    res.status(415).json({ error: err.message });
    return;
  }

  if (err.message?.includes('Unique constraint')) {
    res.status(409).json({
      error: 'Conflit : cette ressource existe déjà.',
      detail: NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Token invalide.' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expiré.' });
    return;
  }

  if (err.name === 'ZodError') {
    res.status(400).json({
      error: 'Données invalides.',
      details: JSON.parse(err.message),
    });
    return;
  }

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
  server.close(() => {
    console.log('[Server] HTTP server closed.');
  });
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

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

export { app, server };
