import { NextRequest, NextResponse } from 'next/server';
import { extractComponentTree } from '@/lib/ast-inspector';
import { getPrototypeSource } from '@/lib/bundler';
import path from 'path';

// Prevent Next.js from caching this route — source changes must be reflected immediately
export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/[id]/tree
 *
 * Returns a ComponentNode[] JSON tree extracted from the prototype's JSX source.
 * The tree contains only MUI (capitalized) components with their props and source locations.
 *
 * Uses Babel AST analysis on the raw source (not the esbuild bundle) for accurate
 * source file and line number information.
 */
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
    const source = await getPrototypeSource(filePath);
    const tree = extractComponentTree(source, filePath);
    return NextResponse.json(tree);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
