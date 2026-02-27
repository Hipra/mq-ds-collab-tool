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

/**
 * POST /api/preview/[id]/screens
 *
 * Creates a new screen file in the prototype directory.
 * Body: { name: string }
 *
 * - Slugifies name → screen id, file = `screen-{slug}.jsx`
 * - 409 if file already exists
 * - Writes template JSX and appends to metadata.json screens.order
 * - Returns { id, name, file } with 201
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const dir = path.join(protoDir, id);

  let body: { name?: string };
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Slugify: lowercase, replace non-alphanumeric with hyphens, collapse, trim
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    return NextResponse.json({ error: 'Name must contain at least one alphanumeric character' }, { status: 400 });
  }

  const screenId = slug;
  const fileName = `screen-${slug}.jsx`;
  const filePath = path.join(dir, fileName);

  // Check if file already exists
  try {
    await fs.access(filePath);
    return NextResponse.json({ error: 'A screen with this name already exists' }, { status: 409 });
  } catch {
    // File doesn't exist — good
  }

  // Write template
  const template = `import { Box } from '@mui/material';\n\nexport default function Screen() {\n  return <Box sx={{ p: 3 }} />;\n}\n`;
  try {
    await fs.writeFile(filePath, template, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Update metadata.json — append to screens.order
  const metaPath = path.join(dir, 'metadata.json');
  let meta: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    meta = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // No existing metadata — start fresh
  }

  const existingScreens = (meta.screens as ScreensMeta | undefined) ?? {};
  const order = existingScreens.order ?? [];
  order.push(screenId);
  meta.screens = { ...existingScreens, order };

  try {
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  } catch {
    // Non-fatal — file was created, metadata update failed
  }

  return NextResponse.json({ id: screenId, name, file: fileName }, { status: 201 });
}

/**
 * PATCH /api/preview/[id]/screens
 *
 * Persists screen order and/or custom names to metadata.json.
 * Body: { order?: string[], customNames?: Record<string, string> }
 *
 * Merges partial updates — only provided fields are updated.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const dir = path.join(protoDir, id);
  const metaPath = path.join(dir, 'metadata.json');

  let body: { order?: string[]; customNames?: Record<string, string> };
  try {
    body = (await req.json()) as { order?: string[]; customNames?: Record<string, string> };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Read existing metadata
  let meta: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    meta = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // No existing metadata — start fresh
  }

  // Merge screens section
  const existingScreens = (meta.screens as ScreensMeta | undefined) ?? {};
  const updatedScreens: ScreensMeta = { ...existingScreens };

  if (body.order !== undefined) {
    updatedScreens.order = body.order;
  }
  if (body.customNames !== undefined) {
    updatedScreens.customNames = {
      ...(existingScreens.customNames ?? {}),
      ...body.customNames,
    };
  }

  meta.screens = updatedScreens;

  try {
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
