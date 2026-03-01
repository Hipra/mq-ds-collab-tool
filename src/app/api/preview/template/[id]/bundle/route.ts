import { NextResponse } from 'next/server';
import { bundlePrototype } from '@/lib/bundler';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const templatesDir = path.join(process.cwd(), 'templates');
  const filePath = path.join(templatesDir, `${id}.jsx`);

  try {
    const bundle = await bundlePrototype(filePath);
    return new NextResponse(bundle, {
      headers: { 'Content-Type': 'text/javascript' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
