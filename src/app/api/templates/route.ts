import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

interface TemplateMeta {
  name: string;
  builtIn: boolean;
  createdAt?: string;
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * GET /api/templates
 * Returns all templates ordered: built-in first, then custom alphabetically.
 */
export async function GET() {
  const meta = await readMetadata();
  const templates = await Promise.all(
    Object.entries(meta).map(async ([id, m]) => {
      let createdAt = m.createdAt;
      if (!createdAt) {
        try {
          const stat = await fs.stat(path.join(TEMPLATES_DIR, `${id}.jsx`));
          createdAt = stat.birthtime.toISOString();
        } catch {
          createdAt = undefined;
        }
      }
      return { id, ...m, createdAt };
    })
  );
  templates.sort((a, b) => {
    if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return NextResponse.json(templates);
}

/**
 * POST /api/templates
 * Saves a new custom template.
 * Body: { name: string, code: string }
 */
export async function POST(req: NextRequest) {
  let body: { name?: string; code?: string } = {};
  try {
    body = (await req.json()) as { name?: string; code?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = body.name?.trim();
  const code = body.code?.trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

  const baseSlug = slugify(name);
  if (!baseSlug) {
    return NextResponse.json(
      { error: 'Name must contain at least one alphanumeric character' },
      { status: 400 }
    );
  }

  // Find a unique slug
  const meta = await readMetadata();
  let slug = baseSlug;
  let counter = 2;
  while (slug in meta) {
    slug = `${baseSlug.slice(0, 36)}-${counter}`;
    counter++;
  }

  await fs.writeFile(path.join(TEMPLATES_DIR, `${slug}.jsx`), code, 'utf-8');

  const createdAt = new Date().toISOString();
  meta[slug] = { name, builtIn: false, createdAt };
  await writeMetadata(meta);

  return NextResponse.json({ id: slug, name, builtIn: false, createdAt }, { status: 201 });
}
