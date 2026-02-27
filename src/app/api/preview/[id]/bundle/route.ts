import { NextRequest, NextResponse } from 'next/server';
import { bundlePrototype } from '@/lib/bundler';
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
    const bundle = await bundlePrototype(filePath);
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
