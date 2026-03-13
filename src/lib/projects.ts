import fs from 'node:fs/promises';
import path from 'node:path';
import type { Project } from '@/types/project';

export const PROJECTS_FILE = path.join(process.cwd(), 'projects.json');

export async function readProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}
