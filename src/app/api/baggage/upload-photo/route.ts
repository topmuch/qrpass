import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Store in data/uploads/ (persistent across deployments) instead of public/uploads/
const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads', 'baggage-photos');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté (JPG, PNG, WEBP, GIF)' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const safeExt = allowedExts.includes(ext) ? ext : 'jpg';
    const filename = `${randomUUID()}.${safeExt}`;
    const photoUrl = `/uploads/baggage-photos/${filename}`;
    const absolutePath = join(UPLOAD_DIR, filename);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      success: true,
      photoUrl,
      photoSizeBytes: buffer.length,
    });
  } catch (error) {
    console.error('[baggage/upload-photo] POST error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: 'Erreur serveur lors du téléchargement', details: msg }, { status: 500 });
  }
}
