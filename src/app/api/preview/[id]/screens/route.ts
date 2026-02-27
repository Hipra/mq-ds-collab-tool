import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

interface ScreenEntry {
  id: string;
  name: string;
  file: string;
}

interface ScreensMeta {
  customNames?: Record<string, string>;
  order?: string[];
}

function capitalizeId(id: string): string {
  if (id === 'index') return 'Main';
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * GET /api/preview/[id]/screens
 *
 * Discovers screen files in the prototype directory:
 * - index.jsx is always included as id "index" (name: "Main")
 * - screen-*.jsx files are included with id = the part after "screen-" and before ".jsx"
 *
 * Supports custom names and ordering via metadata.json:
 *   metadata.screens.customNames: { [id]: string }
 *   metadata.screens.order: string[]
 *
 * Returns: [{ id, name, file }]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const dir = path.join(protoDir, id);

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 404 });
  }

  // Read metadata for custom names and order
  let screensMeta: ScreensMeta = {};
  try {
    const raw = await fs.readFile(path.join(dir, 'metadata.json'), 'utf-8');
    const meta = JSON.parse(raw) as Record<string, unknown>;
    if (meta.screens && typeof meta.screens === 'object') {
      screensMeta = meta.screens as ScreensMeta;
    }
  } catch {
    // No metadata or no screens section — use defaults
  }

  const screens: ScreenEntry[] = [];

  // Always include index.jsx if present
  if (files.includes('index.jsx')) {
    screens.push({
      id: 'index',
      name: screensMeta.customNames?.['index'] ?? 'Main',
      file: 'index.jsx',
    });
  }

  // Discover screen-*.jsx files
  for (const file of files) {
    const match = file.match(/^screen-(.+)\.jsx$/);
    if (match) {
      const screenId = match[1];
      screens.push({
        id: screenId,
        name: screensMeta.customNames?.[screenId] ?? capitalizeId(screenId),
        file,
      });
    }
  }

  // Sort: use metadata order if provided, else alphabetical with index first
  if (screensMeta.order && screensMeta.order.length > 0) {
    const orderMap = new Map(screensMeta.order.map((sid, i) => [sid, i]));
    screens.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Infinity;
      const bi = orderMap.get(b.id) ?? Infinity;
      if (ai !== bi) return ai - bi;
      return a.id.localeCompare(b.id);
    });
  } else {
    // index always first, then alphabetical
    screens.sort((a, b) => {
      if (a.id === 'index') return -1;
      if (b.id === 'index') return 1;
      return a.id.localeCompare(b.id);
    });
  }

  return NextResponse.json(screens);
}
