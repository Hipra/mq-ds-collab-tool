---
phase: 03-copywriter-multi-screen-status
plan: "02"
subsystem: ui
tags: [react, mui, dnd-kit, zustand, nextjs, sidebar, drag-and-drop]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Screen discovery API (GET /api/preview/[id]/screens), Zustand screens state (activeScreenId, setActiveScreen, setScreens)"

provides:
  - "ScreenSidebar component: collapsible left panel with sortable screen list and inline name editing"
  - "PATCH /api/preview/[id]/screens: persists screen order and custom names to metadata.json"
  - "Screen-aware PreviewFrame: iframe src includes ?screen= param, tree re-fetches on screen change"
  - "Screen-aware preview route: passes ?screen= through to bundle-url meta tag"
  - "Page layout: ScreenSidebar | PreviewFrame | InspectorPanel flex row"

affects:
  - "03-03 (copy editing workflow — sidebar is visible on same layout)"
  - "03-04 (verification of multi-screen navigation)"

# Tech tracking
tech-stack:
  added:
    - "@dnd-kit/core 6.x — drag-and-drop context and sensors"
    - "@dnd-kit/sortable 10.x — SortableContext, useSortable, arrayMove"
    - "@dnd-kit/utilities 3.x — CSS.Transform helper"
  patterns:
    - "PointerSensor with activationConstraint.distance=8px to prevent drag/click conflict"
    - "key={iframeSrc} on iframe to force re-mount on screen change (simpler than src update)"
    - "Merge-patch PATCH handler: reads existing metadata, merges partial updates, writes back"

key-files:
  created:
    - "src/components/ScreenSidebar.tsx"
  modified:
    - "src/app/(shell)/page.tsx"
    - "src/components/PreviewFrame.tsx"
    - "src/app/preview/[id]/route.ts"
    - "src/app/api/preview/[id]/screens/route.ts"
    - "package.json"

key-decisions:
  - "key={iframeSrc} on iframe forces re-mount on screen switch — simpler than tracking load state across src changes"
  - "Local localScreens state in ScreenSidebar (not Zustand) since drag-order is sidebar-local; Zustand only holds the canonical list"
  - "PATCH /api/preview/[id]/screens is a merge-patch — partial updates (order only, or customNames only) don't overwrite the other field"
  - "PointerSensor activationConstraint.distance=8 prevents drag from firing on single-click or double-click"

patterns-established:
  - "Screen switching via key prop on iframe: changing iframeSrc key forces iframe unmount/remount"
  - "Screen-aware tree fetch: /api/preview/[id]/tree?screen=[id] for non-index screens"

requirements-completed: [SCRN-01, SCRN-02]

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 3 Plan 02: Multi-Screen Navigation Sidebar Summary

**Collapsible ScreenSidebar with @dnd-kit drag-to-reorder, inline name editing, screen-switching iframe reload, and PATCH persistence to metadata.json**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-27T15:02:59Z
- **Completed:** 2026-02-27T15:05:09Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ScreenSidebar component with collapsible left panel (200px width), drag-to-reorder via @dnd-kit, and double-click inline name editing
- PATCH handler on /api/preview/[id]/screens persists order and custom names via merge-patch to metadata.json
- PreviewFrame is screen-aware: builds `/preview/[id]?screen=[id]` src, uses `key={iframeSrc}` for re-mount on switch, re-fetches tree
- Preview route passes `?screen=` through to bundle-url meta tag
- Page layout updated: ScreenSidebar | PreviewFrame | InspectorPanel in flex row

## Task Commits

Each task was committed atomically:

1. **Task 1: ScreenSidebar with dnd-kit sortable and inline name editing** - `28f16d9` (feat)
2. **Task 2: Page layout update and PreviewFrame screen-aware routing** - `d6ec7a5` (feat)

## Files Created/Modified
- `src/components/ScreenSidebar.tsx` - Collapsible sidebar with DndContext, SortableContext, useSortable per item, inline TextField editing
- `src/app/api/preview/[id]/screens/route.ts` - Added PATCH handler: merge-patch for order/customNames to metadata.json
- `src/app/(shell)/page.tsx` - Added ScreenSidebar import and placement before PreviewFrame in flex row
- `src/components/PreviewFrame.tsx` - Reads activeScreenId, builds screen-aware iframeSrc, key={iframeSrc}, screen-aware fetchTree
- `src/app/preview/[id]/route.ts` - Reads ?screen= query param, passes through to bundle-url meta tag
- `package.json` / `package-lock.json` - @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities added

## Decisions Made
- `key={iframeSrc}` on iframe: forces React to unmount/remount the iframe on screen change, giving clean load state without complex ref tracking
- Local `localScreens` state in ScreenSidebar: drag reorder is sidebar-local; Zustand receives updates after reorder completes
- PATCH is merge-patch: `order` and `customNames` are merged independently so updating one doesn't erase the other
- `activationConstraint.distance=8` on PointerSensor: prevents drag activation during click/double-click

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Multi-screen navigation is fully functional: sidebar lists screens, clicking loads them, dragging reorders, double-clicking renames
- 03-03 (copy editing workflow) can proceed — the sidebar occupies the left flex slot and the layout is stable
- The `?screen=` query param plumbing is in place; the bundle route can consume it to serve the correct screen file

---
*Phase: 03-copywriter-multi-screen-status*
*Completed: 2026-02-27*
