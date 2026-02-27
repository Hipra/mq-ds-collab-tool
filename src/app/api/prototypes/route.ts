import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

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

/**
 * POST /api/prototypes
 * Creates a new prototype directory with metadata.json and index.jsx.
 */
export async function POST(request: NextRequest) {
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json({ error: 'Name must contain at least one alphanumeric character' }, { status: 400 });
    }

    const dir = path.join(protoDir, slug);

    try {
      await fs.access(dir);
      return NextResponse.json({ error: 'A prototype with this name already exists' }, { status: 409 });
    } catch {
      // Directory doesn't exist — good, we can create it
    }

    await fs.mkdir(dir, { recursive: true });

    const metadata = {
      name,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
    await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    const indexJsx = `import { Box } from '@mui/material';

export default function Prototype() {
  return <Box sx={{ p: 3 }} />;
}
`;
    await fs.writeFile(path.join(dir, 'index.jsx'), indexJsx);

    return NextResponse.json({ id: slug, name }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
