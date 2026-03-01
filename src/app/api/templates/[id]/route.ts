import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

interface TemplateMeta {
  name: string;
  builtIn: boolean;
}

async function readMetadata(): Promise<Record<string, TemplateMeta>> {
  try {
    const raw = await fs.readFile(path.join(TEMPLATES_DIR, 'metadata.json'), 'utf-8');
    return JSON.parse(raw) as Record<string, TemplateMeta>;
  } catch {
    return {};
  }
}

async function writeMetadata(meta: Record<string, TemplateMeta>): Promise<void> {
  await fs.writeFile(
    path.join(TEMPLATES_DIR, 'metadata.json'),
    JSON.stringify(meta, null, 2),
    'utf-8'
  );
}

/**
 * GET /api/templates/[id]
 * Returns the raw JSX code of a template.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const code = await fs.readFile(path.join(TEMPLATES_DIR, `${id}.jsx`), 'utf-8');
    return NextResponse.json({ id, code });
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}

/**
 * DELETE /api/templates/[id]
 * Deletes a custom (non-built-in) template.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = await readMetadata();

  if (!(id in meta)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  if (meta[id].builtIn) {
    return NextResponse.json({ error: 'Built-in templates cannot be deleted' }, { status: 403 });
  }

  try {
    await fs.unlink(path.join(TEMPLATES_DIR, `${id}.jsx`));
  } catch {
    // file already gone — continue
  }

  delete meta[id];
  await writeMetadata(meta);

  return new NextResponse(null, { status: 204 });
}
