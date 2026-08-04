import { NextRequest } from 'next/server';
import { verifyToken, type JwtPayload } from './passhajj-utils';

/**
 * Extract and verify JWT from Authorization header
 * Returns payload or null
 */
export function extractAuth(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  return verifyToken(token);
}

/**
 * Require auth - returns payload or a 401 Response
 */
export function requireAuth(req: NextRequest): JwtPayload | Response {
  const payload = extractAuth(req);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Non autorisé. Token manquant ou invalide.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}

/**
 * Require agency role - returns payload or a 401/403 Response
 */
export function requireAgency(req: NextRequest): JwtPayload | Response {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  if (result.role !== 'agency' && result.role !== 'admin' && result.role !== 'superadmin') {
    return new Response(JSON.stringify({ error: 'Accès réservé aux agences.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return result;
}
