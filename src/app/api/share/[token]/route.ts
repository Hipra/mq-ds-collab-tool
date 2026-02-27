import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

/**
 * GET /api/share/[token]
 * Resolves a share token to a prototypeId by scanning all metadata.json files.
 * Returns { prototypeId, name, status } or 404.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');

  try {
    const entries = await fs.readdir(protoDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());

    for (const dir of dirs) {
      const metaPath = path.join(protoDir, dir.name, 'metadata.json');
      try {
        const raw = await fs.readFile(metaPath, 'utf-8');
        const meta = JSON.parse(raw) as Record<string, unknown>;
        if (meta.shareToken === token) {
          return NextResponse.json({
            prototypeId: dir.name,
            name: typeof meta.name === 'string' ? meta.name : dir.name,
            status: typeof meta.status === 'string' ? meta.status : 'draft',
          });
        }
      } catch {
        // Skip malformed metadata
      }
    }

    return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
