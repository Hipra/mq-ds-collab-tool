import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function uniqueSlug(protoDir: string, base: string): Promise<string> {
  let slug = base;
  let counter = 2;
  while (true) {
    try {
      await fs.access(path.join(protoDir, slug));
      slug = `${base.slice(0, 36)}-${counter}`;
      counter++;
    } catch {
      return slug;
    }
  }
}

/**
 * POST /api/prototypes/[id]/clone
 *
 * Clones an existing prototype into a new directory.
 * Body: { name?: string }  — if omitted, defaults to "Copy of <original name>"
 *
 * Copies all .jsx files and copy-overlay.json (if present).
 * Creates a fresh metadata.json: new name, new createdAt, no shareToken.
 * Preserves status and screens config (order, customNames).
 *
 * Returns { id, name } with 201.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const srcDir = path.join(protoDir, id);

  // Read source metadata
  let srcMeta: Record<string, unknown>;
  try {
    const raw = await fs.readFile(path.join(srcDir, 'metadata.json'), 'utf-8');
    srcMeta = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 });
  }

  // Determine new name
  let body: { name?: string } = {};
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    // body is optional
  }
  const srcName = typeof srcMeta.name === 'string' ? srcMeta.name : id;
  const newName = body.name?.trim() || `Copy of ${srcName}`;

  const baseSlug = slugify(newName);
  if (!baseSlug) {
    return NextResponse.json(
      { error: 'Name must contain at least one alphanumeric character' },
      { status: 400 }
    );
  }

  const newSlug = await uniqueSlug(protoDir, baseSlug);
  const destDir = path.join(protoDir, newSlug);

  await fs.mkdir(destDir, { recursive: true });

  // Copy JSX files and copy-overlay.json
  const files = await fs.readdir(srcDir);
  for (const file of files) {
    if (file === 'metadata.json') continue;
    if (file.endsWith('.jsx') || file === 'copy-overlay.json') {
      const content = await fs.readFile(path.join(srcDir, file), 'utf-8');
      await fs.writeFile(path.join(destDir, file), content, 'utf-8');
    }
  }

  // Write fresh metadata
  const newMeta: Record<string, unknown> = {
    name: newName,
    createdAt: new Date().toISOString(),
    status: srcMeta.status ?? 'draft',
  };
  if (srcMeta.screens) {
    newMeta.screens = srcMeta.screens;
  }
  await fs.writeFile(
    path.join(destDir, 'metadata.json'),
    JSON.stringify(newMeta, null, 2),
    'utf-8'
  );

  return NextResponse.json({ id: newSlug, name: newName }, { status: 201 });
}
