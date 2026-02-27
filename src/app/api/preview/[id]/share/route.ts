import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/[id]/share
 * Returns the existing share token for a prototype, or null if none exists.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const metaPath = path.join(protoDir, id, 'metadata.json');

  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(raw) as Record<string, unknown>;
    const shareToken = typeof meta.shareToken === 'string' ? meta.shareToken : null;
    return NextResponse.json({ shareToken });
  } catch {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 });
  }
}

/**
 * POST /api/preview/[id]/share
 * Generates a new share token (nanoid(12)) if none exists, or returns existing one.
 * Persists to metadata.json.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const metaPath = path.join(protoDir, id, 'metadata.json');

  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(raw) as Record<string, unknown>;

    // Return existing token if present (idempotent)
    if (typeof meta.shareToken === 'string' && meta.shareToken.length > 0) {
      return NextResponse.json({ shareToken: meta.shareToken });
    }

    // Generate new token
    const shareToken = nanoid(12);
    meta.shareToken = shareToken;
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    return NextResponse.json({ shareToken });
  } catch {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 });
  }
}
