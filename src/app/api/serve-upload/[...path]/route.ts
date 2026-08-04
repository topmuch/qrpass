import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_BASE = join(process.cwd(), 'public', 'uploads');

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

    const absolutePath = join(UPLOAD_BASE, safePath);

    // Security: ensure the resolved path is within UPLOAD_BASE
    if (!absolutePath.startsWith(UPLOAD_BASE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!existsSync(absolutePath)) {
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
