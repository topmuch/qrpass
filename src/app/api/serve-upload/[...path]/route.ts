import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Use data/uploads/ (persistent across deployments) instead of public/uploads/
// Falls back to public/uploads/ for legacy files uploaded before the migration
const UPLOAD_BASE_PRIMARY = join(process.cwd(), 'data', 'uploads');
const UPLOAD_BASE_LEGACY = join(process.cwd(), 'public', 'uploads');

// MIME types for common image formats
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * API route to serve uploaded files from the filesystem.
 * This is needed because Next.js Turbopack dev server may not serve
 * dynamically created files in public/uploads/ immediately.
 *
 * Usage: /api/serve-upload/baggage-photos/xxx.jpg
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Security: prevent directory traversal
    const safePath = pathSegments.join('/');
    if (safePath.includes('..') || safePath.startsWith('/') || safePath.startsWith('\\')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Try primary location (data/uploads/) first, then legacy (public/uploads/)
    const primaryPath = join(UPLOAD_BASE_PRIMARY, safePath);
    const legacyPath = join(UPLOAD_BASE_LEGACY, safePath);

    // Security: ensure the resolved path is within allowed directories
    if (!primaryPath.startsWith(UPLOAD_BASE_PRIMARY) && !legacyPath.startsWith(UPLOAD_BASE_LEGACY)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let absolutePath: string | null = null;
    if (existsSync(primaryPath)) {
      absolutePath = primaryPath;
    } else if (existsSync(legacyPath)) {
      absolutePath = legacyPath;
    }

    if (!absolutePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file extension for MIME type
    const ext = absolutePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const fileBuffer = await readFile(absolutePath);
    const fileStat = await stat(absolutePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        'Last-Modified': fileStat.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error('[serve-upload] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
