import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readProjects, writeProjects } from '@/lib/projects';
import type { Project, ProjectWithPrototypes, PrototypeInfo, ScreenInfo } from '@/types/project';

export const dynamic = 'force-dynamic';

const PROTOTYPES_DIR = process.env.PROTOTYPES_DIR || path.join(process.cwd(), 'prototypes');

async function getPrototypeInfo(protoId: string): Promise<PrototypeInfo | null> {
  const protoDir = path.join(PROTOTYPES_DIR, protoId);
  try {
    const metaPath = path.join(protoDir, 'metadata.json');
    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);

    const screenOrder: string[] = meta.screens?.order || ['index'];
    const customNames: Record<string, string> = meta.screens?.customNames || {};

    const screens: ScreenInfo[] = await Promise.all(
      screenOrder.map(async (screenId) => {
        const thumbPath = path.join(protoDir, 'thumbnails', `${screenId}.png`);
        let hasThumbnail = false;
        try {
          await fs.access(thumbPath);
          hasThumbnail = true;
        } catch {}
        return {
          id: screenId,
          name: customNames[screenId] || screenId,
          hasThumbnail,
        };
      })
    );

    return { id: protoId, name: meta.name || protoId, screens };
  } catch {
    return null;
  }
}

export async function GET() {
  const projects = await readProjects();

  const enriched: ProjectWithPrototypes[] = await Promise.all(
    projects.map(async (project) => {
      const prototypes = (
        await Promise.all(project.prototypeIds.map(getPrototypeInfo))
      ).filter((p): p is PrototypeInfo => p !== null);
      return { ...project, prototypes };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, assignee, prototypeIds } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    const projects = await readProjects();

    if (projects.some((p) => p.id === id)) {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 });
    }

    const newProject: Project = {
      id,
      name: name.trim(),
      description: description?.trim() || '',
      assignee: assignee?.trim() || '',
      designStatus: 'in_progress',
      devStatus: 'not_started',
      uxWriterStatus: 'not_started',
      prototypeIds: prototypeIds || [],
      updatedAt: new Date().toISOString(),
    };

    projects.push(newProject);
    await writeProjects(projects);

    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
