import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/prototypes/[id]
 * Removes the prototype directory and all its contents.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const dir = path.join(protoDir, id);

  try {
    await fs.access(dir);
  } catch {
    return NextResponse.json({ error: 'Prototype not found' }, { status: 404 });
  }

  try {
    await fs.rm(dir, { recursive: true, force: true });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
