import { NextResponse } from 'next/server';
import { extractComponentTree } from '@/lib/ast-inspector';
import { getPrototypeSource } from '@/lib/bundler';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/preview/template/[id]/tree
 *
 * Returns a ComponentNode[] JSON tree extracted from the template's JSX source.
 * Mirrors /api/preview/[id]/tree but reads from the templates/ directory.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const templatesDir = path.join(process.cwd(), 'templates');
  const filePath = path.join(templatesDir, `${id}.jsx`);

  try {
    const source = await getPrototypeSource(filePath);
    const tree = extractComponentTree(source, filePath);
    return NextResponse.json(tree);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
