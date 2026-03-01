import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

interface ScreensMeta {
  customNames?: Record<string, string>;
  order?: string[];
}

/**
 * POST /api/preview/[id]/screens/duplicate
 *
 * Duplicates an existing screen within the same prototype.
 * Body: { screenId: string }
 *
 * - Copies the source JSX file to screen-{id}-copy.jsx (with counter suffix if needed)
 * - Inserts the new screen directly after the source in metadata.json screens.order
 * - Sets a custom name: "<source name> copy"
 *
 * Returns { id, name, file } with 201.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const dir = path.join(protoDir, id);

  let body: { screenId?: string } = {};
  try {
    body = (await req.json()) as { screenId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const screenId = body.screenId;
  if (!screenId) {
    return NextResponse.json({ error: 'screenId is required' }, { status: 400 });
  }

  // Find source file
  const srcFile = screenId === 'index' ? 'index.jsx' : `screen-${screenId}.jsx`;
  let content: string;
  try {
    content = await fs.readFile(path.join(dir, srcFile), 'utf-8');
  } catch {
    return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
  }

  // Read metadata
  const metaPath = path.join(dir, 'metadata.json');
  let meta: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    meta = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // proceed without existing metadata
  }

  const screensMeta = (meta.screens as ScreensMeta | undefined) ?? {};
  const sourceName =
    screensMeta.customNames?.[screenId] ??
    (screenId === 'index' ? 'Main' : screenId.charAt(0).toUpperCase() + screenId.slice(1));

  // Generate unique new screen id
  const baseSlug = `${screenId === 'index' ? 'main' : screenId}-copy`;
  let newSlug = baseSlug;
  let counter = 2;
  while (true) {
    try {
      await fs.access(path.join(dir, `screen-${newSlug}.jsx`));
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    } catch {
      break;
    }
  }

  const newFileName = `screen-${newSlug}.jsx`;
  await fs.writeFile(path.join(dir, newFileName), content, 'utf-8');

  // Update metadata: insert after source in order, add custom name
  const newName = `${sourceName} copy`;
  const order = screensMeta.order ? [...screensMeta.order] : [];
  const srcIndex = order.indexOf(screenId);
  if (srcIndex !== -1) {
    order.splice(srcIndex + 1, 0, newSlug);
  } else {
    order.push(newSlug);
  }

  meta.screens = {
    ...screensMeta,
    order,
    customNames: {
      ...(screensMeta.customNames ?? {}),
      [newSlug]: newName,
    },
  };

  try {
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  } catch {
    // non-fatal
  }

  return NextResponse.json({ id: newSlug, name: newName, file: newFileName }, { status: 201 });
}
