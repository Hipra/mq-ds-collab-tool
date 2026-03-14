import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/template/[id]/thumbnail
 *
 * Serves a stored thumbnail PNG for a template.
 * Returns 404 if no thumbnail exists yet.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const templatesDir = path.join(process.cwd(), 'templates');
  const thumbPath = path.join(templatesDir, 'thumbnails', `${id}.png`);

  try {
    const buffer = await fs.readFile(thumbPath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
