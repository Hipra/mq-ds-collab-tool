import { NextRequest, NextResponse } from 'next/server';
import { readProjects } from '@/lib/projects';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/by-prototype/[id]
 * Returns the project's links for the given prototypeId.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const projects = await readProjects();
  const project = projects.find((p) => p.prototypeIds.includes(id));

  return NextResponse.json({ links: project?.links ?? [] });
}
