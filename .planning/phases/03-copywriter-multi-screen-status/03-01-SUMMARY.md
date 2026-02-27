---
phase: 03-copywriter-multi-screen-status
plan: 01
subsystem: ui, api
tags: [nextjs, mui, zustand, babel, ast, copy-overlay]

# Dependency graph
requires:
  - phase: 02-inspector-responsive-preview
    provides: ast-inspector.ts, inspector store, Toolbar component, bundler lib
provides:
  - StatusBadge component with MUI Chip + Menu, GET/PATCH status API
  - Screen discovery API (GET /api/preview/[id]/screens)
  - Bundle and tree routes extended with ?screen= query param
  - text-extractor.ts: AST-based text entry extraction from JSX source
  - copy-overlay.ts: read/write/merge overlay with conflict detection and edit history
  - GET/PATCH /api/preview/[id]/copy: text entries with overlay merge
  - Inspector store extended with activeScreenId, screens, setActiveScreen, setScreens
affects: [03-02-screen-sidebar, 03-03-copy-tab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status badge pattern: Chip + Menu, optimistic update on PATCH, revert on failure"
    - "Copy overlay pattern: key = ComponentName_line_col_propName, edits history array, conflict detection via sourceValueAtEdit"
    - "Screen routing: ?screen=login serves screen-login.jsx; default (no param or index) serves index.jsx"
    - "Text extraction: AST traversal with pathStack for componentPath, JSXAttribute StringLiterals + JSXText children"

key-files:
  created:
    - src/components/StatusBadge.tsx
    - src/app/api/preview/[id]/status/route.ts
    - src/app/api/preview/[id]/screens/route.ts
    - src/app/api/preview/[id]/copy/route.ts
    - src/lib/text-extractor.ts
    - src/lib/copy-overlay.ts
  modified:
    - src/components/Toolbar.tsx
    - src/app/(shell)/page.tsx
    - src/app/api/preview/[id]/bundle/route.ts
    - src/app/api/preview/[id]/tree/route.ts
    - src/stores/inspector.ts
    - prototypes/sample/metadata.json

key-decisions:
  - "StatusBadge does optimistic update on PATCH and reverts state on network or server error"
  - "Copy overlay conflict: flagged when sourceValueAtEdit !== entry.sourceValue AND editedValue !== entry.sourceValue (source changed under copywriter's edit)"
  - "Screen file convention: index.jsx = main screen (id: index, name: Main), screen-*.jsx = additional screens"
  - "Text extraction uses pathStack (same strategy as ast-inspector's stack) to build componentPath"

patterns-established:
  - "StatusBadge: React.useState for status + anchorEl, fetch on mount, PATCH on selection"
  - "Overlay conflict detection: three-way merge (sourceAtEdit vs current source vs edited value)"
  - "protoDir pattern: process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes') — consistent across all routes"

requirements-completed: [SHAR-03, SCRN-01]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 3 Plan 01: Status Badge, Screen Discovery, Text Extraction, and Copy Overlay Summary

**Status badge with metadata persistence, multi-screen file discovery API, AST-based text extraction pipeline, and copy overlay with conflict detection — all backend contracts for Plans 03-02 and 03-03**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T14:57:13Z
- **Completed:** 2026-02-27T15:00:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- StatusBadge component (MUI Chip + Menu, Draft/Review/Approved, optimistic PATCH with rollback) added to toolbar
- GET/PATCH /api/preview/[id]/status route reads/writes status field in metadata.json
- GET /api/preview/[id]/screens discovers index.jsx and screen-*.jsx files with custom name/order support
- Bundle and tree routes extended with ?screen= query param (e.g., ?screen=login serves screen-login.jsx)
- text-extractor.ts: Babel AST traversal extracts TextEntry[] from JSXAttribute StringLiterals and JSXText children across six text-bearing props
- copy-overlay.ts: read/write/merge overlay with full edit history and conflict detection (three-way merge)
- GET/PATCH /api/preview/[id]/copy: returns merged entries with edit history; PATCH persists edits
- Inspector store extended with activeScreenId, screens, setActiveScreen, setScreens

## Task Commits

Each task was committed atomically:

1. **Task 1: Status badge, status API, and metadata extension** - `bb0213a` (feat)
2. **Task 2: Screen discovery API, bundle/tree route extension, text extraction, and copy overlay** - `9b3f43b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/StatusBadge.tsx` - MUI Chip + Menu status control, fetches/patches /api/preview/[id]/status
- `src/app/api/preview/[id]/status/route.ts` - GET returns current status (default draft), PATCH validates and writes metadata.json
- `src/app/api/preview/[id]/screens/route.ts` - Discovers index.jsx and screen-*.jsx, supports custom names/order via metadata.json
- `src/app/api/preview/[id]/copy/route.ts` - GET extracts text + merges overlay, PATCH persists edit to copy-overlay.json
- `src/lib/text-extractor.ts` - extractTextEntries() via Babel AST, stable key format ComponentName_line_col_propName
- `src/lib/copy-overlay.ts` - readOverlay / patchOverlay / mergeOverlayIntoEntries with ConflictEntry detection
- `src/components/Toolbar.tsx` - Added prototypeId prop, imported and rendered StatusBadge
- `src/app/(shell)/page.tsx` - Passes prototypeId to Toolbar
- `src/app/api/preview/[id]/bundle/route.ts` - Added ?screen= param support
- `src/app/api/preview/[id]/tree/route.ts` - Added ?screen= param support
- `src/stores/inspector.ts` - Added activeScreenId, screens, setActiveScreen, setScreens
- `prototypes/sample/metadata.json` - Added "status": "draft" field

## Decisions Made
- StatusBadge uses optimistic update: state is updated immediately on selection, reverted if PATCH fails
- Copy overlay conflict is detected via three-way merge: sourceValueAtEdit (snapshot at edit time) vs current source value vs edited value
- Screen ID convention: "index" maps to index.jsx, any other id maps to screen-{id}.jsx
- Text extraction includes both JSXAttribute StringLiterals AND JSXText children; both must have non-whitespace content

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All API contracts are in place for 03-02 (screen sidebar) and 03-03 (copy tab)
- StatusBadge visible in toolbar immediately upon starting the dev server
- Screen discovery, text extraction, and copy overlay all functional and type-safe

## Self-Check: PASSED

All created files verified on disk. Both task commits (bb0213a, 9b3f43b) confirmed in git log.

---
*Phase: 03-copywriter-multi-screen-status*
*Completed: 2026-02-27*
