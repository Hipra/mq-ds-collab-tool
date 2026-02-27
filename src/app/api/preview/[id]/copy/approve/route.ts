import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';
import { extractTextEntries } from '@/lib/text-extractor';
import { readOverlay } from '@/lib/copy-overlay';
import { applyTextEditsToSource } from '@/lib/apply-text-to-source';

export const dynamic = 'force-dynamic';

/**
 * POST /api/preview/[id]/copy/approve
 *
 * Applies approved text edits from the overlay into the JSX source file,
 * then removes those entries from copy-overlay.json.
 *
 * Body: { entries: Array<{ key: string, value: string }>, screen?: string }
 * Returns: { ok: true, applied: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { entries: approveEntries, screen } = body as {
    entries: Array<{ key: string; value: string }>;
    screen?: string;
  };

  if (!Array.isArray(approveEntries) || approveEntries.length === 0) {
    return NextResponse.json({ error: 'entries array is required and must not be empty' }, { status: 400 });
  }

  const screenFile = screen && screen !== 'index' ? `screen-${screen}.jsx` : 'index.jsx';
  const filePath = path.join(protoDir, id, screenFile);

  try {
    // Read raw source (not via getPrototypeSource — we need the original without appended exports)
    const source = await fs.readFile(filePath, 'utf-8');

    // Extract entries to resolve propName for each key
    const textEntries = extractTextEntries(source, filePath);
    const entryMap = new Map(textEntries.map((e) => [e.key, e]));

    // Build edits array with propName resolved from extracted entries
    const edits: Array<{ key: string; propName: string; newValue: string }> = [];
    for (const { key, value } of approveEntries) {
      const entry = entryMap.get(key);
      if (!entry) continue;
      // Only apply if the value actually differs from current source
      if (entry.sourceValue === value) continue;
      edits.push({ key, propName: entry.propName, newValue: value });
    }

    if (edits.length > 0) {
      const modified = applyTextEditsToSource(source, edits);
      await fs.writeFile(filePath, modified, 'utf-8');
    }

    // Remove approved entries from overlay
    const overlay = await readOverlay(id);
    const approvedKeys = new Set(approveEntries.map((e) => e.key));
    for (const key of approvedKeys) {
      delete overlay.entries[key];
    }
    const overlayPath = path.join(protoDir, id, 'copy-overlay.json');
    if (Object.keys(overlay.entries).length === 0) {
      // Clean up overlay file entirely if empty
      try {
        await fs.unlink(overlayPath);
      } catch {
        // File may not exist — that's fine
      }
    } else {
      await fs.writeFile(overlayPath, JSON.stringify(overlay, null, 2), 'utf-8');
    }

    return NextResponse.json({ ok: true, applied: edits.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
