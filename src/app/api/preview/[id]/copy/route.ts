import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getPrototypeSource } from '@/lib/bundler';
import { extractTextEntries } from '@/lib/text-extractor';
import { readOverlay, patchOverlay, mergeOverlayIntoEntries } from '@/lib/copy-overlay';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/[id]/copy?screen=
 *
 * Returns text entries extracted from the prototype source merged with the copy overlay.
 *
 * Response shape:
 * {
 *   entries: Array<TextEntry & { edits: EditHistoryEntry[] }>,
 *   conflicts: ConflictEntry[],
 *   summary: { total: number, modified: number }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');

  // Support ?screen= param (default to index.jsx)
  const screen = new URL(req.url).searchParams.get('screen');
  const screenFile =
    screen && screen !== 'index' ? `screen-${screen}.jsx` : 'index.jsx';

  const filePath = path.join(protoDir, id, screenFile);

  try {
    const source = await getPrototypeSource(filePath);
    const rawEntries = extractTextEntries(source, filePath);

    const overlay = await readOverlay(id);
    const { entries: mergedEntries, conflicts } = mergeOverlayIntoEntries(rawEntries, overlay);

    // Attach edits history to each entry
    const entriesWithEdits = mergedEntries.map((entry) => ({
      ...entry,
      edits: overlay.entries[entry.key]?.edits ?? [],
    }));

    const modified = entriesWithEdits.filter((e) => e.currentValue !== e.sourceValue).length;

    return NextResponse.json({
      entries: entriesWithEdits,
      conflicts,
      summary: {
        total: entriesWithEdits.length,
        modified,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

/**
 * PATCH /api/preview/[id]/copy
 *
 * Body: { key: string, value: string, sourceValue: string }
 * Persists a text edit to copy-overlay.json.
 * Returns { ok: true }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { key, value, sourceValue } = (body as Record<string, unknown>);

  if (typeof key !== 'string' || !key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'value must be a string' }, { status: 400 });
  }
  if (typeof sourceValue !== 'string') {
    return NextResponse.json({ error: 'sourceValue must be a string' }, { status: 400 });
  }

  try {
    await patchOverlay(id, key, value, sourceValue);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
