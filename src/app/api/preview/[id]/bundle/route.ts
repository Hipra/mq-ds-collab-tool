import { NextRequest, NextResponse } from 'next/server';
import { bundlePrototype, getPrototypeSource } from '@/lib/bundler';
import { readOverlay } from '@/lib/copy-overlay';
import { extractTextEntries } from '@/lib/text-extractor';
import { applyTextEditsToSource } from '@/lib/apply-text-to-source';
import path from 'path';

// Prevent Next.js from caching this route — bundles must be fresh on each request
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');

  // Support ?screen= query param to serve non-default screens (e.g., screen-login.jsx)
  const screen = new URL(req.url).searchParams.get('screen');
  const screenFile =
    screen && screen !== 'index' ? `screen-${screen}.jsx` : 'index.jsx';

  const filePath = path.join(protoDir, id, screenFile);

  try {
    // Apply any pending copy overlay edits to the source before bundling.
    // This ensures data array overrides (e.g. TOOLBAR_ITEMS labels) are baked into the bundle.
    const source = await getPrototypeSource(filePath);
    const overlay = await readOverlay(id);
    const overlayEntries = Object.entries(overlay.entries);
    let patchedSource = source;
    if (overlayEntries.length > 0) {
      const textEntries = extractTextEntries(source, filePath);
      const entryMap = new Map(textEntries.map((e) => [e.key, e]));
      const edits = overlayEntries.flatMap(([key, ov]) => {
        const entry = entryMap.get(key);
        if (!entry || ov.editedValue === entry.sourceValue) return [];
        return [{ key, propName: entry.propName, newValue: ov.editedValue }];
      });
      if (edits.length > 0) {
        patchedSource = applyTextEditsToSource(source, edits);
      }
    }

    const bundle = await bundlePrototype(filePath, patchedSource);
    return new NextResponse(bundle, {
      headers: { 'Content-Type': 'text/javascript' },
    });
  } catch (err: unknown) {
    // Return 422 for both file-not-found and esbuild compile errors.
    // This covers: syntax errors, missing files, invalid JSX.
    // The iframe bootstrap handles 422 before React mounts.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
