import { NextResponse } from 'next/server';
import { readProjects, writeProjects } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const projects = await readProjects();
    const index = projects.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatable = ['name', 'description', 'assignee', 'designStatus', 'devStatus', 'uxWriterStatus', 'prototypeIds', 'links'] as const;
    const updated = { ...projects[index] };

    for (const key of updatable) {
      if (body[key] !== undefined) {
        (updated as Record<string, unknown>)[key] = body[key];
      }
    }
    updated.updatedAt = new Date().toISOString();

    projects[index] = updated;
    await writeProjects(projects);

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projects = await readProjects();
    const filtered = projects.filter((p) => p.id !== id);

    if (filtered.length === projects.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await writeProjects(filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
