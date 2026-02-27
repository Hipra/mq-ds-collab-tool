import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['draft', 'review', 'approved'] as const;
type Status = (typeof VALID_STATUSES)[number];

/**
 * GET /api/preview/[id]/status
 * Returns { status: string } — defaults to 'draft' if missing from metadata.json
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const metaPath = path.join(protoDir, id, 'metadata.json');

  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(raw) as Record<string, unknown>;
    const status: Status =
      typeof meta.status === 'string' && VALID_STATUSES.includes(meta.status as Status)
        ? (meta.status as Status)
        : 'draft';
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: 'draft' });
  }
}

/**
 * PATCH /api/preview/[id]/status
 * Body: { status: 'draft' | 'review' | 'approved' }
 * Reads metadata.json, updates status field, writes back.
 * Returns { status: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  const metaPath = path.join(protoDir, id, 'metadata.json');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const newStatus = (body as Record<string, unknown>)?.status;
  if (typeof newStatus !== 'string' || !VALID_STATUSES.includes(newStatus as Status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(raw) as Record<string, unknown>;
    meta.status = newStatus;
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    return NextResponse.json({ status: newStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
