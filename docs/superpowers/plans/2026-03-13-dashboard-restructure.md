# Dashboard Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the dashboard to group prototypes under projects with multi-axis status tracking, thumbnail previews, and navigation links — giving UX writers the contextual overview they need.

**Architecture:** File-based JSON storage (`projects.json`) with Next.js API routes following existing patterns. New `src/components/dashboard/` component directory. Dashboard page rewritten to show project cards with inline prototype data. Flow page gets an additional back-to-dashboard button.

**Tech Stack:** Next.js 15 (App Router), MUI v7, React 19, TypeScript, Playwright (E2E)

**Spec:** `docs/superpowers/specs/2026-03-13-dashboard-restructure-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/types/project.ts` | TypeScript interfaces for Project, ProjectWithPrototypes, status enums |
| `src/lib/projects.ts` | Shared helpers: readProjects, writeProjects, PROJECTS_FILE path |
| `src/app/api/projects/route.ts` | GET (list with inline prototypes) + POST (create) |
| `src/app/api/projects/[id]/route.ts` | PUT (update) + DELETE (delete) |
| `src/components/dashboard/FilterBar.tsx` | Status filter dropdowns + free text search |
| `src/components/dashboard/ProjectCard.tsx` | Project card: header, statuses, description, prototype sections |
| `src/components/dashboard/PrototypeSection.tsx` | Single prototype within a card: name, jump buttons, thumbnail row |
| `src/components/dashboard/ScreenshotModal.tsx` | Full-size screenshot overlay on thumbnail click |
| `src/components/dashboard/ProjectDialog.tsx` | Create/edit project dialog (shared, mode prop) |
| `e2e/dashboard-projects.spec.ts` | E2E tests for project CRUD and dashboard UI |

### Modified Files

| File | Change |
|------|--------|
| `src/app/(shell)/page.tsx` | Replace flat prototype grid with project-grouped layout |
| `src/app/(shell)/prototype/[id]/flow/page.tsx` | Add "Back to dashboard" button in AppBar |

---

## Chunk 1: Data Layer (Types + API Routes)

### Task 1: Project Type Definitions

**Files:**
- Create: `src/types/project.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// src/types/project.ts

export type DesignStatus = 'concept' | 'in_progress' | 'review' | 'done';
export type DevStatus = 'not_started' | 'in_progress' | 'qa' | 'deployed';
export type UxWriterStatus = 'not_started' | 'in_progress' | 'review' | 'done';

export interface Project {
  id: string;
  name: string;
  description: string;
  assignee: string;
  designStatus: DesignStatus;
  devStatus: DevStatus;
  uxWriterStatus: UxWriterStatus;
  prototypeIds: string[];
  updatedAt: string;
}

export interface ScreenInfo {
  id: string;
  name: string;
  hasThumbnail: boolean;
}

export interface PrototypeInfo {
  id: string;
  name: string;
  screens: ScreenInfo[];
}

export interface ProjectWithPrototypes extends Project {
  prototypes: PrototypeInfo[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `src/types/project.ts`

- [ ] **Step 3: Commit**

```bash
git add src/types/project.ts
git commit -m "feat: add Project type definitions"
```

---

### Task 2: Shared Project Helpers + Projects API — GET + POST

**Files:**
- Create: `src/lib/projects.ts`
- Create: `src/app/api/projects/route.ts`

**Context:** Follow the exact pattern from `src/app/api/prototypes/route.ts` — use `dynamic = 'force-dynamic'`, `fs/promises`, `NextResponse.json()`. The `PROTOTYPES_DIR` env var pattern is already established. Extract `readProjects`/`writeProjects` to a shared module so `[id]/route.ts` can reuse them.

- [ ] **Step 1: Create shared helpers**

```typescript
// src/lib/projects.ts
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
```

- [ ] **Step 2: Create GET route**

The GET route reads `projects.json`, then for each project enriches it with prototype metadata (name + screens + hasThumbnail). It reads each prototype's `metadata.json` for the name and screen order, and checks for thumbnail files in `prototypes/[id]/thumbnails/`.

```typescript
// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readProjects, writeProjects } from '@/lib/projects';
import type { ProjectWithPrototypes, PrototypeInfo, ScreenInfo } from '@/types/project';

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
```

- [ ] **Step 3: Add POST route**

Append to the same file. Validates required fields, generates slug ID from name, sets default statuses. Uses shared `readProjects`/`writeProjects`.

```typescript
import type { Project } from '@/types/project';

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
      designStatus: 'concept',
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
```

- [ ] **Step 4: Verify route compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Manual test — GET returns empty array**

Run: `curl -s http://localhost:3000/api/projects | head -5`
Expected: `[]`

- [ ] **Step 6: Commit**

```bash
git add src/lib/projects.ts src/app/api/projects/route.ts
git commit -m "feat: add shared project helpers + projects API — GET + POST"
```

---

### Task 3: Projects API — PUT + DELETE

**Files:**
- Create: `src/app/api/projects/[id]/route.ts`

**Context:** Follow the `params: Promise<{ id: string }>` pattern from existing `[id]` routes.

- [ ] **Step 1: Create PUT + DELETE route**

```typescript
// src/app/api/projects/[id]/route.ts
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

    const updatable = ['name', 'description', 'assignee', 'designStatus', 'devStatus', 'uxWriterStatus', 'prototypeIds'] as const;
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
```

- [ ] **Step 2: Verify route compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/projects/[id]/route.ts
git commit -m "feat: add projects API — PUT (update) + DELETE"
```

---

## Chunk 2: Dashboard UI Components

### Task 4: FilterBar Component

**Files:**
- Create: `src/components/dashboard/FilterBar.tsx`

**Context:** Three status filter dropdowns (Design, Dev, UX Writer) with multi-select, plus a free text search TextField. Uses MUI `Select` with `multiple` prop and `Chip` for selected values. Search uses `TextField` with `slotProps={{ input: { notched: false, color: 'secondary' } }}` per CLAUDE.md conventions.

- [ ] **Step 1: Create FilterBar**

```typescript
// src/components/dashboard/FilterBar.tsx
'use client';

import { Box, Chip, MenuItem, Select, TextField, Typography, type SelectChangeEvent } from '@mui/material';
import MqIcon from '@/components/MqIcon';

const DESIGN_STATUSES = ['concept', 'in_progress', 'review', 'done'] as const;
const DEV_STATUSES = ['not_started', 'in_progress', 'qa', 'deployed'] as const;
const UX_WRITER_STATUSES = ['not_started', 'in_progress', 'review', 'done'] as const;

const STATUS_LABELS: Record<string, string> = {
  concept: 'Concept',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  not_started: 'Not Started',
  qa: 'QA',
  deployed: 'Deployed',
};

interface FilterBarProps {
  designFilter: string[];
  devFilter: string[];
  uxWriterFilter: string[];
  searchQuery: string;
  onDesignFilterChange: (values: string[]) => void;
  onDevFilterChange: (values: string[]) => void;
  onUxWriterFilterChange: (values: string[]) => void;
  onSearchChange: (query: string) => void;
}

function StatusSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (values: string[]) => void;
}) {
  const handleChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value;
    onChange(typeof val === 'string' ? val.split(',') : val);
  };

  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Select
        multiple
        size="small"
        value={value}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) =>
          selected.length === 0 ? (
            <Typography variant="body2" color="text.secondary">All</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((v) => (
                <Chip key={v} label={STATUS_LABELS[v] || v} size="small" />
              ))}
            </Box>
          )
        }
        sx={{ minWidth: 160 }}
      >
        {options.map((status) => (
          <MenuItem key={status} value={status}>
            {STATUS_LABELS[status] || status}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default function FilterBar({
  designFilter,
  devFilter,
  uxWriterFilter,
  searchQuery,
  onDesignFilterChange,
  onDevFilterChange,
  onUxWriterFilterChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', mb: 3 }}>
      <StatusSelect label="Design" options={DESIGN_STATUSES} value={designFilter} onChange={onDesignFilterChange} />
      <StatusSelect label="Dev" options={DEV_STATUSES} value={devFilter} onChange={onDevFilterChange} />
      <StatusSelect label="UX Writer" options={UX_WRITER_STATUSES} value={uxWriterFilter} onChange={onUxWriterFilterChange} />
      <TextField
        size="small"
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{ input: { startAdornment: <MqIcon name="search" size={18} color="action" /> } }}
        sx={{ minWidth: 220, ml: 'auto' }}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/FilterBar.tsx
git commit -m "feat: add FilterBar component — status filters + search"
```

---

### Task 5: ScreenshotModal Component

**Files:**
- Create: `src/components/dashboard/ScreenshotModal.tsx`

**Context:** Simple modal that shows a full-size screenshot. Dialog with max-width, image centered. Cancel button follows convention: `variant="text" color="secondary"`.

- [ ] **Step 1: Create ScreenshotModal**

```typescript
// src/components/dashboard/ScreenshotModal.tsx
'use client';

import { Box, Dialog, DialogActions, DialogContent, Button } from '@mui/material';

interface ScreenshotModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  screenName: string;
}

export default function ScreenshotModal({ open, onClose, src, screenName }: ScreenshotModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={src}
          alt={`Screenshot of ${screenName}`}
          sx={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="text" color="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ScreenshotModal.tsx
git commit -m "feat: add ScreenshotModal component"
```

---

### Task 6: PrototypeSection Component

**Files:**
- Create: `src/components/dashboard/PrototypeSection.tsx`

**Context:** Shows one prototype within a project card: name, jump buttons, horizontal thumbnail row. Thumbnails use the existing `/api/preview/[id]/thumbnail?screen=<screenId>` route. Missing thumbnails show a grey placeholder with MqIcon "image". Click on thumbnail opens ScreenshotModal (state managed by parent). Screen name link below navigates to `/prototype/[id]?screen=[screenId]`.

- [ ] **Step 1: Create PrototypeSection**

```typescript
// src/components/dashboard/PrototypeSection.tsx
'use client';

import { Box, Button, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import Link from 'next/link';
import type { PrototypeInfo, ScreenInfo } from '@/types/project';

interface PrototypeSectionProps {
  prototype: PrototypeInfo;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
}

function ScreenThumbnail({
  prototypeId,
  screen,
  onClick,
}: {
  prototypeId: string;
  screen: ScreenInfo;
  onClick: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box
        onClick={onClick}
        sx={{
          width: 120,
          height: 80,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: screen.hasThumbnail ? 'transparent' : 'action.hover',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
        }}
      >
        {screen.hasThumbnail ? (
          <Box
            component="img"
            src={`/api/preview/${prototypeId}/thumbnail?screen=${screen.id}`}
            alt={screen.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <MqIcon name="image" size={24} color="disabled" />
        )}
      </Box>
      <Typography
        component={Link}
        href={`/prototype/${prototypeId}?screen=${screen.id}`}
        variant="caption"
        color="text.secondary"
        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
      >
        {screen.name}
      </Typography>
    </Box>
  );
}

export default function PrototypeSection({ prototype, onThumbnailClick }: PrototypeSectionProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {prototype.name}
        </Typography>
        <Button
          component={Link}
          href={`/prototype/${prototype.id}`}
          size="small"
          variant="text"
          startIcon={<MqIcon name="open-in-new" size={14} />}
        >
          Prototype
        </Button>
        <Button
          component={Link}
          href={`/prototype/${prototype.id}/flow`}
          size="small"
          variant="text"
          startIcon={<MqIcon name="workflow" size={14} />}
        >
          Flow
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
        {prototype.screens.map((screen) => (
          <ScreenThumbnail
            key={screen.id}
            prototypeId={prototype.id}
            screen={screen}
            onClick={() => onThumbnailClick(prototype.id, screen)}
          />
        ))}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/PrototypeSection.tsx
git commit -m "feat: add PrototypeSection component — thumbnails + jump buttons"
```

---

### Task 7: ProjectCard Component

**Files:**
- Create: `src/components/dashboard/ProjectCard.tsx`

**Context:** Card with header (name, status chips, assignee, date), description, then PrototypeSections. Edit button opens ProjectDialog. Status chips use the color mapping from spec: concept/not_started=default, in_progress=primary, review/qa=secondary, done/deployed=success.

- [ ] **Step 1: Create ProjectCard**

```typescript
// src/components/dashboard/ProjectCard.tsx
'use client';

import { Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import PrototypeSection from './PrototypeSection';
import type { ProjectWithPrototypes, ScreenInfo } from '@/types/project';

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'success'> = {
  concept: 'default',
  not_started: 'default',
  in_progress: 'primary',
  review: 'secondary',
  qa: 'secondary',
  done: 'success',
  deployed: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  concept: 'Concept',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  not_started: 'Not Started',
  qa: 'QA',
  deployed: 'Deployed',
};

interface ProjectCardProps {
  project: ProjectWithPrototypes;
  onEdit: (project: ProjectWithPrototypes) => void;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
}

export default function ProjectCard({ project, onEdit, onThumbnailClick }: ProjectCardProps) {
  const updatedDate = new Date(project.updatedAt).toLocaleDateString();

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {project.name}
          </Typography>
          <Chip
            size="small"
            label={`Design: ${STATUS_LABEL[project.designStatus]}`}
            color={STATUS_COLOR[project.designStatus]}
          />
          <Chip
            size="small"
            label={`Dev: ${STATUS_LABEL[project.devStatus]}`}
            color={STATUS_COLOR[project.devStatus]}
          />
          <Chip
            size="small"
            label={`UX: ${STATUS_LABEL[project.uxWriterStatus]}`}
            color={STATUS_COLOR[project.uxWriterStatus]}
          />
          <IconButton size="small" onClick={() => onEdit(project)}>
            <MqIcon name="edit" size={18} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {project.assignee && (
            <Typography variant="caption" color="text.secondary">
              {project.assignee}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Updated: {updatedDate}
          </Typography>
        </Box>

        {project.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {project.description}
          </Typography>
        )}

        {project.prototypes.map((proto) => (
          <PrototypeSection
            key={proto.id}
            prototype={proto}
            onThumbnailClick={onThumbnailClick}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProjectCard.tsx
git commit -m "feat: add ProjectCard component — status badges + prototype sections"
```

---

### Task 8: ProjectDialog Component

**Files:**
- Create: `src/components/dashboard/ProjectDialog.tsx`

**Context:** Shared dialog for create and edit. Fields: name, description, assignee, prototype selection (multi-select from available prototypes fetched from `/api/prototypes`). Edit mode pre-fills values. Cancel button: `variant="text" color="secondary"`. TextField: `slotProps={{ input: { notched: false, color: 'secondary' } }}`.

- [ ] **Step 1: Create ProjectDialog**

```typescript
// src/components/dashboard/ProjectDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Select, TextField, Typography, Alert, type SelectChangeEvent,
} from '@mui/material';
import type { ProjectWithPrototypes } from '@/types/project';

interface PrototypeListItem {
  id: string;
  name: string;
}

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editProject?: ProjectWithPrototypes | null;
}

export default function ProjectDialog({ open, onClose, onSave, editProject }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedPrototypeIds, setSelectedPrototypeIds] = useState<string[]>([]);
  const [availablePrototypes, setAvailablePrototypes] = useState<PrototypeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/prototypes')
        .then((r) => r.json())
        .then((data) => setAvailablePrototypes(data))
        .catch(() => setAvailablePrototypes([]));

      if (editProject) {
        setName(editProject.name);
        setDescription(editProject.description);
        setAssignee(editProject.assignee);
        setSelectedPrototypeIds(editProject.prototypeIds);
      } else {
        setName('');
        setDescription('');
        setAssignee('');
        setSelectedPrototypeIds([]);
      }
      setError('');
    }
  }, [open, editProject]);

  const handlePrototypeChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value;
    setSelectedPrototypeIds(typeof val === 'string' ? val.split(',') : val);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const body = { name, description, assignee, prototypeIds: selectedPrototypeIds };
      const url = editProject ? `/api/projects/${editProject.id}` : '/api/projects';
      const method = editProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save project');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editProject ? 'Edit Project' : 'New Project'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            slotProps={{ input: { notched: false, color: 'secondary' } }}
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            multiline
            rows={2}
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
          <TextField
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            size="small"
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Prototypes
            </Typography>
            <Select
              multiple
              size="small"
              value={selectedPrototypeIds}
              onChange={handlePrototypeChange}
              displayEmpty
              fullWidth
              renderValue={(selected) =>
                selected.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Select prototypes</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const proto = availablePrototypes.find((p) => p.id === id);
                      return <Chip key={id} label={proto?.name || id} size="small" />;
                    })}
                  </Box>
                )
              }
            >
              {availablePrototypes.map((proto) => (
                <MenuItem key={proto.id} value={proto.id}>
                  {proto.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || loading}>
          {editProject ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProjectDialog.tsx
git commit -m "feat: add ProjectDialog component — create/edit project"
```

---

## Chunk 3: Dashboard Page + Flow Navigation

### Task 9: Rewrite Dashboard Page

**Files:**
- Modify: `src/app/(shell)/page.tsx`

**Context:** Replace the current flat prototype grid with project-grouped layout. Keep the existing "Prototypes" and "Templates" tab structure but add project cards above the prototype grid in the Prototypes tab. Unassigned prototypes (not in any project) still show in the existing grid format below.

This is the largest task. The page fetches from both `/api/projects` and `/api/prototypes`, determines which prototypes are unassigned, and renders FilterBar + ProjectCards + unassigned section.

- [ ] **Step 1: Read the current page.tsx to understand full structure**

Read: `src/app/(shell)/page.tsx` — note all existing state, dialogs, fetch logic, and tab structure that must be preserved.

- [ ] **Step 2: Add project state and fetch logic**

Add to the existing component (after the existing state declarations):

```typescript
// New imports (add to existing imports)
import FilterBar from '@/components/dashboard/FilterBar';
import ProjectCard from '@/components/dashboard/ProjectCard';
import ProjectDialog from '@/components/dashboard/ProjectDialog';
import ScreenshotModal from '@/components/dashboard/ScreenshotModal';
import type { ProjectWithPrototypes, ScreenInfo } from '@/types/project';

// New state (add alongside existing useState calls)
const [projects, setProjects] = useState<ProjectWithPrototypes[]>([]);
const [designFilter, setDesignFilter] = useState<string[]>([]);
const [devFilter, setDevFilter] = useState<string[]>([]);
const [uxWriterFilter, setUxWriterFilter] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [projectDialogOpen, setProjectDialogOpen] = useState(false);
const [editingProject, setEditingProject] = useState<ProjectWithPrototypes | null>(null);
const [screenshotModal, setScreenshotModal] = useState<{ src: string; name: string } | null>(null);
```

- [ ] **Step 3: Add project fetch function and integrate into existing useEffect**

Add `fetchProjects` as a sibling to the existing `fetchPrototypes` function, then call both in the existing `useEffect`:

```typescript
const fetchProjects = async () => {
  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
  } catch { /* silent */ }
};

// In the existing useEffect (find the one that calls fetchPrototypes()):
// Add fetchProjects() call right after fetchPrototypes():
useEffect(() => {
  fetchPrototypes();  // existing
  fetchProjects();    // new — add this line
}, []);               // keep existing dependency array
```

- [ ] **Step 4: Add filter logic**

```typescript
const assignedPrototypeIds = new Set(projects.flatMap((p) => p.prototypeIds));
const unassignedPrototypes = prototypes.filter((p) => !assignedPrototypeIds.has(p.id));

const filteredProjects = projects.filter((project) => {
  if (designFilter.length && !designFilter.includes(project.designStatus)) return false;
  if (devFilter.length && !devFilter.includes(project.devStatus)) return false;
  if (uxWriterFilter.length && !uxWriterFilter.includes(project.uxWriterStatus)) return false;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const searchable = [
      project.name, project.description, project.assignee,
      ...project.prototypes.map((p) => p.name),
    ].join(' ').toLowerCase();
    if (!searchable.includes(q)) return false;
  }
  return true;
});
```

- [ ] **Step 5: Add project card handlers**

```typescript
const handleEditProject = (project: ProjectWithPrototypes) => {
  setEditingProject(project);
  setProjectDialogOpen(true);
};

const handleCreateProject = () => {
  setEditingProject(null);
  setProjectDialogOpen(true);
};

const handleProjectSaved = () => {
  fetchProjects();
  fetchPrototypes();
};

const handleThumbnailClick = (prototypeId: string, screen: ScreenInfo) => {
  setScreenshotModal({
    src: `/api/preview/${prototypeId}/thumbnail?screen=${screen.id}`,
    name: screen.name,
  });
};
```

- [ ] **Step 6: Update the Prototypes tab JSX**

In the Prototypes tab panel, add above the existing grid:

```tsx
{/* New Project button */}
<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
  <Button variant="contained" onClick={handleCreateProject} startIcon={<MqIcon name="plus" size={18} />}>
    New Project
  </Button>
</Box>

{/* Filter bar */}
<FilterBar
  designFilter={designFilter}
  devFilter={devFilter}
  uxWriterFilter={uxWriterFilter}
  searchQuery={searchQuery}
  onDesignFilterChange={setDesignFilter}
  onDevFilterChange={setDevFilter}
  onUxWriterFilterChange={setUxWriterFilter}
  onSearchChange={setSearchQuery}
/>

{/* Project cards */}
{filteredProjects.map((project) => (
  <ProjectCard
    key={project.id}
    project={project}
    onEdit={handleEditProject}
    onThumbnailClick={handleThumbnailClick}
  />
))}

{/* Unassigned section — reuses the existing card grid but only for prototypes not in any project */}
{unassignedPrototypes.length > 0 && (
  <>
    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Unassigned</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
      {unassignedPrototypes.map((proto) => {
        const config = STATUS_CONFIG[proto.status] ?? STATUS_CONFIG.draft;
        return (
          <Card key={proto.id} elevation={0} onClick={() => router.push(`/prototype/${proto.id}`)} sx={cardSx}>
            {/* Same card content as the existing prototype grid — copy the existing Card children JSX here */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, flex: 1, wordBreak: 'break-word' }}>
                {proto.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
              <Chip label={config.label} color={config.color} size="small" />
            </Box>
          </Card>
        );
      })}
    </Box>
  </>
)}
```

- [ ] **Step 7: Add dialogs at bottom of component**

```tsx
<ProjectDialog
  open={projectDialogOpen}
  onClose={() => setProjectDialogOpen(false)}
  onSave={handleProjectSaved}
  editProject={editingProject}
/>
<ScreenshotModal
  open={!!screenshotModal}
  onClose={() => setScreenshotModal(null)}
  src={screenshotModal?.src || ''}
  screenName={screenshotModal?.name || ''}
/>
```

- [ ] **Step 8: Verify compiles and test manually**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Then open browser: dashboard should show "New Project" button, empty FilterBar, and existing prototypes under "Unassigned".

- [ ] **Step 9: Commit**

```bash
git add src/app/\\(shell\\)/page.tsx
git commit -m "feat: rewrite dashboard — project cards, filters, unassigned section"
```

---

### Task 10: Flow Page — Back to Dashboard Button

**Files:**
- Modify: `src/app/(shell)/prototype/[id]/flow/page.tsx`

**Context:** Add a "Back to dashboard" button in the AppBar, next to the existing back-to-prototype button. Uses `MqIcon` with `home` or `dashboard` icon name.

- [ ] **Step 1: Read flow page**

Read: `src/app/(shell)/prototype/[id]/flow/page.tsx` — identify where the existing back button is rendered.

- [ ] **Step 2: Add dashboard back button**

Add a second `IconButton` next to the existing back button in the AppBar Toolbar. Use `router.push('/')` to match the existing navigation pattern (the flow page already imports `useRouter`):

```tsx
<IconButton onClick={() => router.push('/')} size="small" sx={{ mr: 0.5 }}>
  <MqIcon name="home" size={20} />
</IconButton>
```

- [ ] **Step 3: Verify it renders**

Open browser: flow page should show home icon button at the left of the AppBar.

- [ ] **Step 4: Commit**

```bash
git add src/app/\\(shell\\)/prototype/\\[id\\]/flow/page.tsx
git commit -m "feat: add back-to-dashboard button in flow page AppBar"
```

---

## Chunk 4: E2E Tests

### Task 11: Dashboard Projects E2E Tests

**Files:**
- Create: `e2e/dashboard-projects.spec.ts`

**Context:** Follow patterns from existing `e2e/flow-canvas.spec.ts` — use `test.describe`, `beforeAll`/`afterAll` for setup/teardown, `page.waitForLoadState`, `getByRole`/`getByText` selectors.

- [ ] **Step 1: Create E2E test file**

```typescript
// e2e/dashboard-projects.spec.ts
import { test, expect } from '@playwright/test';

const API_BASE = '/api/projects';
const TEST_PROJECT = {
  name: 'Test Project',
  description: 'E2E test project',
  assignee: 'Tester',
  prototypeIds: [],
};

test.describe('Dashboard Projects', () => {
  // Create test project via API before all tests (not via UI — avoids order dependency)
  test.beforeAll(async ({ request }) => {
    // Clean up any leftover test project first
    const res = await request.get(API_BASE);
    const projects = await res.json();
    for (const p of projects) {
      if (p.name === TEST_PROJECT.name) {
        await request.delete(`${API_BASE}/${p.id}`);
      }
    }
    // Create fresh test project
    await request.post(API_BASE, { data: TEST_PROJECT });
  });

  test.afterAll(async ({ request }) => {
    const res = await request.get(API_BASE);
    const projects = await res.json();
    for (const p of projects) {
      if (p.name === TEST_PROJECT.name) {
        await request.delete(`${API_BASE}/${p.id}`);
      }
    }
  });

  test('shows New Project button on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });

  test('project card shows status badges', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator('[class*="MuiCard"]', { hasText: TEST_PROJECT.name });
    await expect(card).toBeVisible();
    await expect(card.getByText(/design.*concept/i)).toBeVisible();
    await expect(card.getByText(/dev.*not started/i)).toBeVisible();
    await expect(card.getByText(/ux.*not started/i)).toBeVisible();
  });

  test('edit project dialog pre-fills values', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator('[class*="MuiCard"]', { hasText: TEST_PROJECT.name });
    await card.getByRole('button', { name: /edit/i }).first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/project name/i)).toHaveValue(TEST_PROJECT.name);
    await expect(page.getByLabel(/description/i)).toHaveValue(TEST_PROJECT.description);

    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('search filters projects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByPlaceholder(/search/i).fill('nonexistent-xyz');
    await expect(page.getByText(TEST_PROJECT.name)).not.toBeVisible({ timeout: 3000 });

    await page.getByPlaceholder(/search/i).clear();
    await expect(page.getByText(TEST_PROJECT.name)).toBeVisible();
  });

  test('creates a new project via dialog', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /new project/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/project name/i).fill('Dialog Created Project');
    await page.getByLabel(/description/i).fill('Created via UI');
    await page.getByLabel(/assignee/i).fill('UI Tester');

    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Project card should appear
    await expect(page.getByText('Dialog Created Project')).toBeVisible();

    // Clean up the UI-created project
    const res = await page.request.get(API_BASE);
    const projects = await res.json();
    const uiProject = projects.find((p: { name: string }) => p.name === 'Dialog Created Project');
    if (uiProject) await page.request.delete(`${API_BASE}/${uiProject.id}`);
  });

  test('API: GET /api/projects returns project list', async ({ request }) => {
    const res = await request.get(API_BASE);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    const project = data.find((p: { name: string }) => p.name === TEST_PROJECT.name);
    expect(project).toBeTruthy();
    expect(project.designStatus).toBe('concept');
  });

  test('API: DELETE /api/projects/:id removes and re-creates project', async ({ request }) => {
    const res = await request.get(API_BASE);
    const projects = await res.json();
    const project = projects.find((p: { name: string }) => p.name === TEST_PROJECT.name);
    expect(project).toBeTruthy();

    const delRes = await request.delete(`${API_BASE}/${project.id}`);
    expect(delRes.ok()).toBeTruthy();

    const res2 = await request.get(API_BASE);
    const projects2 = await res2.json();
    expect(projects2.find((p: { name: string }) => p.name === TEST_PROJECT.name)).toBeFalsy();

    // Re-create so afterAll cleanup is consistent
    await request.post(API_BASE, { data: TEST_PROJECT });
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test e2e/dashboard-projects.spec.ts --headed`
Expected: All tests pass

- [ ] **Step 3: Fix any failures and re-run**

- [ ] **Step 4: Commit**

```bash
git add e2e/dashboard-projects.spec.ts
git commit -m "test: add E2E tests for dashboard projects"
```

---

## Execution Order

1. **Task 1** — Types (no dependencies)
2. **Task 2** — GET + POST API (depends on Task 1)
3. **Task 3** — PUT + DELETE API (depends on Task 1)
4. **Task 4** — FilterBar (no API dependency, can parallel with 2-3)
5. **Task 5** — ScreenshotModal (no dependencies, can parallel)
6. **Task 6** — PrototypeSection (depends on Task 1 types)
7. **Task 7** — ProjectCard (depends on Task 6)
8. **Task 8** — ProjectDialog (depends on Task 1 types)
9. **Task 9** — Dashboard page rewrite (depends on all above)
10. **Task 10** — Flow back button (independent, can parallel with 9)
11. **Task 11** — E2E tests (depends on all above)

**Parallelizable groups:**
- Group A: Tasks 1, 4, 5 (no dependencies between them)
- Group B: Tasks 2, 3, 6, 8 (all depend on Task 1 only)
- Group C: Task 7 (depends on Task 6)
- Group D: Tasks 9, 10 (Task 9 depends on all UI, Task 10 is independent)
- Group E: Task 11 (depends on everything)
