import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

interface PrototypeListItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  hasShareToken: boolean;
}

/**
 * GET /api/prototypes
 * Scans the prototypes/ directory and returns metadata for each prototype.
 */
export async function GET() {
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');

  try {
    const entries = await fs.readdir(protoDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());

    const prototypes: PrototypeListItem[] = [];

    for (const dir of dirs) {
      const metaPath = path.join(protoDir, dir.name, 'metadata.json');
      try {
        const raw = await fs.readFile(metaPath, 'utf-8');
        const meta = JSON.parse(raw) as Record<string, unknown>;
        prototypes.push({
          id: dir.name,
          name: typeof meta.name === 'string' ? meta.name : dir.name,
          status: typeof meta.status === 'string' ? meta.status : 'draft',
          createdAt: typeof meta.createdAt === 'string' ? meta.createdAt : '',
          hasShareToken: typeof meta.shareToken === 'string' && meta.shareToken.length > 0,
        });
      } catch {
        // Skip directories without valid metadata
      }
    }

    return NextResponse.json(prototypes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
