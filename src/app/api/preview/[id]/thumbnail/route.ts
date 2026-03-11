import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/[id]/thumbnail?screen=<screenId>
 *
 * Serves a stored thumbnail PNG for a screen.
 * Returns 404 if no thumbnail exists yet.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const screenId = new URL(req.url).searchParams.get('screen') ?? 'index';

  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const thumbPath = path.join(protoDir, id, 'thumbnails', `${screenId}.png`);

  try {
    const buffer = await fs.readFile(thumbPath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

/**
 * POST /api/preview/[id]/thumbnail
 *
 * Saves a screenshot for a screen.
 * Body: { screenId: string, dataUrl: string }
 *
 * Stores as: prototypes/{id}/thumbnails/{screenId}.png
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { screenId?: string; dataUrl?: string };
  try {
    body = (await req.json()) as { screenId?: string; dataUrl?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { screenId, dataUrl } = body;
  if (!screenId || !dataUrl) {
    return NextResponse.json({ error: 'screenId and dataUrl are required' }, { status: 400 });
  }

  // Only allow safe screen IDs (alphanumeric + hyphens)
  if (!/^[a-z0-9-]+$/.test(screenId) && screenId !== 'index') {
    return NextResponse.json({ error: 'Invalid screenId' }, { status: 400 });
  }

  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const thumbDir = path.join(protoDir, id, 'thumbnails');
  const thumbPath = path.join(thumbDir, `${screenId}.png`);

  try {
    // Strip data URL prefix and decode base64
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    await fs.mkdir(thumbDir, { recursive: true });
    await fs.writeFile(thumbPath, buffer);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
