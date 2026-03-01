import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/[id]/code?file=index.jsx
 * Returns the raw JSX source of a screen file.
 * Only .jsx files within the prototype directory are accessible.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const dir = path.join(protoDir, id);

  const file = req.nextUrl.searchParams.get('file');
  if (!file || !file.endsWith('.jsx') || file.includes('/') || file.includes('..')) {
    return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
  }

  try {
    const code = await fs.readFile(path.join(dir, file), 'utf-8');
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
