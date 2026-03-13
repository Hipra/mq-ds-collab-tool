# Dashboard Restructure Design

## Problem

UX writers lack the contextual overview they naturally get in Figma: where the project stands, what's the status of each screen, what needs work. The current dashboard lists prototypes flatly with no project grouping, status tracking, or role-specific context.

## Goal

Restructure the dashboard to serve as a single hub where all project context is visible at a glance. The three views (Dashboard, Flow, Prototype) form a focus funnel: Dashboard (broad overview) -> Flow (connections between screens) -> Prototype (individual screen editing).

## Data Model

### Project (`projects.json` at repo root)

```json
[
  {
    "id": "string (slug)",
    "name": "string",
    "description": "string",
    "assignee": "string",
    "designStatus": "concept | in_progress | review | done",
    "devStatus": "not_started | in_progress | qa | deployed",
    "uxWriterStatus": "not_started | in_progress | review | done",
    "prototypeIds": ["demo-prototype"],
    "updatedAt": "2026-03-13T00:00:00Z"
  }
]
```

- One prototype belongs to at most one project.
- Prototypes not assigned to any project appear in an "Unassigned" section at the bottom of the dashboard.
- `updatedAt` is client-driven: the dashboard UI sends the current timestamp via `PUT /api/projects/[id]` when making changes. No cross-route writes — prototype API routes do not touch `projects.json`.
- When `projects.json` does not exist, the GET route returns `[]` (not an error).

### Relationship to Existing Prototype Status

The existing per-prototype `status` field in `metadata.json` (`draft | review | approved`) is a **screen-level** indicator and remains unchanged. The new project-level statuses (`designStatus`, `devStatus`, `uxWriterStatus`) are a **higher-level tracking** layer. They coexist — project statuses describe where the overall effort stands, prototype statuses describe individual screen readiness.

### API

- `GET /api/projects` — list all projects with inline prototype data (name + screen list with thumbnail paths for each). No N+1 calls needed from the client.
- `POST /api/projects` — create project
- `PUT /api/projects/[id]` — update project (name, description, statuses, assignee, prototypeIds)
- `DELETE /api/projects/[id]` — delete project (prototypes remain, become unassigned)

#### `GET /api/projects` Response Shape

```json
[
  {
    "id": "my-project",
    "name": "Settings Redesign",
    "description": "...",
    "assignee": "Anna",
    "designStatus": "in_progress",
    "devStatus": "not_started",
    "uxWriterStatus": "not_started",
    "prototypeIds": ["demo-prototype"],
    "updatedAt": "2026-03-13T00:00:00Z",
    "prototypes": [
      {
        "id": "demo-prototype",
        "name": "Demo Prototype",
        "screens": [
          { "id": "index", "name": "index", "hasThumbnail": true },
          { "id": "settings", "name": "settings", "hasThumbnail": false }
        ]
      }
    ]
  }
]
```

Thumbnails are fetched via the existing `GET /api/preview/[id]/thumbnail?screen=<screenId>` route. The `hasThumbnail` flag lets the client show a placeholder (grey box with MqIcon "image") when no thumbnail exists.

## Dashboard View

### Filter Bar

Top of page, containing:
- **Status filters**: three separate dropdowns for Design / Dev / UX Writer status (multi-select)
- **Free text search**: searches across project name, description, assignee, and prototype names

### Project Cards

Stacked vertically, each card contains:

**Header row:**
- Project name (Typography variant h6)
- Three status badges side by side: Design, Dev, UX Writer (color-coded chips)
- Assignee
- Last modified date

**Description:**
- Short text below the header

**Prototypes section (within the card):**

For each prototype in the project:
- Prototype name
- **"Jump to prototype"** button — navigates to `/prototype/[id]`
- **"Jump to flow"** button — navigates to `/prototype/[id]/flow`
- Screen thumbnails in a horizontal row:
  - Small thumbnail images (from `prototypes/[id]/thumbnails/`)
  - Click thumbnail -> full-size screenshot overlay/modal
  - Below each thumbnail: screen name as a link -> navigates directly to `/prototype/[id]?screen=[screenId]`

### Unassigned Section

Prototypes not belonging to any project are listed at the bottom under "Unassigned" heading, using the current card layout (prototype name + thumbnails).

### Create / Edit Project

Button at the top of the dashboard to create a new project. Each project card also has an edit button. Both open the same dialog with fields: name, description, assignee, and prototype selection (multi-select from available prototypes). Edit mode pre-fills existing values.

## Navigation

```
Dashboard ──> Jump to flow ──> Flow view
    |                              |
    |                              |── Card link -> Screen (prototype view)
    |                              |── Back -> Dashboard
    |
    |──> Jump to prototype ──> Prototype view
    |──> Thumbnail link ──> Screen (prototype view)
```

### Flow View Changes

- Add a **"Back to dashboard"** button in the AppBar (next to the existing "Back to prototype" button). Both back buttons coexist — one goes to the prototype view, the other to the dashboard.
- Screen node cards retain their existing link to open the screen in prototype view
- No other changes to flow functionality

### Prototype View Changes

- No changes

## Component Breakdown

### New Components

- `src/components/dashboard/ProjectCard.tsx` — project card with header, statuses, prototype list
- `src/components/dashboard/PrototypeSection.tsx` — prototype within a project card (name, buttons, thumbnails)
- `src/components/dashboard/FilterBar.tsx` — status filters + search input
- `src/components/dashboard/ScreenshotModal.tsx` — full-size screenshot overlay on thumbnail click
- `src/components/dashboard/ProjectDialog.tsx` — dialog for creating and editing projects (shared component, mode prop)

### Modified Components

- `src/app/(shell)/page.tsx` (or equivalent dashboard page) — replace current flat list with project-grouped layout
- `src/app/(shell)/prototype/[id]/flow/page.tsx` — add "Back to dashboard" button in AppBar

### New API Routes

- `src/app/api/projects/route.ts` — GET (list) + POST (create)
- `src/app/api/projects/[id]/route.ts` — PUT (update) + DELETE (delete)

### Data

- `projects.json` at repo root — project data storage (same pattern as existing `theme-config.json`)

## Status Badge Colors

Using semantic MUI palette:
- `concept` / `not_started` — `default` (grey)
- `in_progress` — `primary` (orange)
- `review` / `qa` — `secondary` (blue)
- `done` / `deployed` — `success` (green)

## Constraints

- Follow existing MUI conventions from CLAUDE.md (no `!important`, `sx` prop, `MqIcon`, etc.)
- Prototype isolation rule: dashboard changes stay in shell, never modify prototype files
- Use `MqIcon` for all icons (jump buttons, back button, etc.)
- File-based storage (JSON) — no database needed for this scope
