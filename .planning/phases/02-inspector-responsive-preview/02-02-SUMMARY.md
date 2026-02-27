---
phase: 02-inspector-responsive-preview
plan: "02"
subsystem: ui
tags: [react, mui, zustand, inspector, responsive-preview, component-tree]

# Dependency graph
requires:
  - phase: 02-01
    provides: "AST inspector pipeline (ast-inspector.ts), inspector Zustand store, postmessage types, tree API endpoint"
provides:
  - BreakpointSwitcher component with Auto + xs/sm/md/lg/xl viewport width controls
  - Responsive PreviewFrame with pixel-width iframe resizing and gray surround for fixed widths
  - InspectorPanel right sidebar with Copy (placeholder) and Components tabs
  - ComponentTree recursive tree view with expand/collapse, auto-scroll on iframe selection
  - PropInspector key-value prop table with type-colored values and expandable expression props
  - Panel collapse/show toggle via toolbar ViewSidebar button
affects: [03-copy-editing, 04-gallery-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "display:none TabPanel — preserves scroll/state when switching tabs (not unmount)"
    - "Pixel-width iframe container — responsive preview without CSS transform scale"
    - "findPathToNode + auto-expand ancestors — tree follows iframe click selection"
    - "One-directional hover sync: iframe hover -> Zustand -> tree highlight (not reverse)"

key-files:
  created:
    - src/components/BreakpointSwitcher.tsx
    - src/components/InspectorPanel.tsx
    - src/components/ComponentTree.tsx
    - src/components/PropInspector.tsx
  modified:
    - src/components/Toolbar.tsx
    - src/components/PreviewFrame.tsx
    - src/app/(shell)/page.tsx

key-decisions:
  - "Pixel-width iframe container used for responsive preview — CSS transform:scale() rejected (distorts fonts and interactions)"
  - "display:none TabPanel pattern for tab switching — preserves scroll position and expanded node state across tab changes"
  - "Tree hover is one-directional: iframe hover -> tree highlight, but tree hover does NOT highlight in iframe (v1 simplicity; avoids new SET_INSPECTOR_HIGHLIGHT postMessage type)"
  - "PropInspector shows AST summary value in expanded block — no re-parsing needed, summary is sufficient"
  - "InspectorPanel takes no props — reads everything from Zustand store (simpler, tree fetched in PreviewFrame)"

patterns-established:
  - "InspectorPanel/ComponentTree: selectedId drives ancestor auto-expand via findPathToNode helper"
  - "ComponentTree: all nodes start expanded by default (typical for small-medium component trees)"
  - "PropInspector: local expandedProps Set resets on node?.id change to avoid stale expansion state"

requirements-completed: [REND-04, INSP-01, INSP-02, INSP-04]

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 2 Plan 02: Inspector + Responsive Preview UI Summary

**Breakpoint switcher, responsive iframe preview (pixel-width), InspectorPanel with ComponentTree and expandable PropInspector wired to Zustand inspector store**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T13:33:56Z
- **Completed:** 2026-02-27T13:37:24Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Breakpoint switcher (Auto + xs/sm/md/lg/xl) in toolbar controls iframe container pixel width, gray surround for fixed viewports
- InspectorPanel right sidebar with display:none tab switching preserves tree scroll and expanded state
- ComponentTree recursively renders MUI component hierarchy with expand/collapse, auto-scrolls and expands ancestors when iframe click selects a node
- PropInspector shows key-value prop table with type-colored values; expression props expand on click to show value in monospace block

## Task Commits

1. **Task 1: Breakpoint switcher + responsive PreviewFrame + shell layout** - `e851a1c` (feat)
2. **Task 2: Inspector panel with tabs, component tree, and prop inspector** - `5d8df45` (feat)

## Files Created/Modified

- `src/components/BreakpointSwitcher.tsx` - ButtonGroup with Auto + 5 MUI breakpoint buttons, reads/writes useInspectorStore.previewWidth
- `src/components/Toolbar.tsx` - Added BreakpointSwitcher in center, ViewSidebar panel toggle button right of switcher
- `src/components/PreviewFrame.tsx` - Responsive width container (pixel not scale), gray surround for fixed widths, COMPONENT_HOVER/SELECT handling, tree fetch on mount/reload
- `src/app/(shell)/page.tsx` - Layout updated to flex row: PreviewFrame + InspectorPanel side by side
- `src/components/ComponentTree.tsx` - Recursive tree with DevTools-style tag display, expand/collapse, auto-expand path to selected node
- `src/components/PropInspector.tsx` - Key-value table with type-colored values, expression props expandable, source file:line shown
- `src/components/InspectorPanel.tsx` - 320px right sidebar, Copy (placeholder) + Components tabs, display:none TabPanel, findNodeById helper

## Decisions Made

- **Pixel-width container over CSS scale:** `transform: scale()` distorts fonts and breaks pointer events at fractional ratios. Setting `width: {pixels}px` on the iframe container gives exact viewport emulation.
- **display:none TabPanel:** Unmounting the tab would lose ComponentTree's `expandedSet` state and scroll position. `display: none` keeps React tree alive.
- **One-directional hover sync:** Tree hover -> iframe highlight would require a new `SET_HIGHLIGHT` postMessage type. For v1, iframe hover syncs to tree but tree hover does not send to iframe. The core value (click in iframe, see in tree) is preserved.
- **InspectorPanel takes no props:** The tree is fetched in PreviewFrame and stored in Zustand. InspectorPanel reads only from the store — cleaner interface, avoids prop drilling.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 2 requirements complete (REND-04, INSP-01, INSP-02, INSP-04)
- Phase 3 (copy editing) can build on InspectorPanel Copy tab placeholder
- PropInspector read-only model established — Phase 3 will need editable fields

## Self-Check: PASSED

All created files verified on disk:
- FOUND: src/components/BreakpointSwitcher.tsx
- FOUND: src/components/InspectorPanel.tsx
- FOUND: src/components/ComponentTree.tsx
- FOUND: src/components/PropInspector.tsx
- FOUND: .planning/phases/02-inspector-responsive-preview/02-02-SUMMARY.md

All task commits verified:
- FOUND: e851a1c (Task 1)
- FOUND: 5d8df45 (Task 2)

TypeScript: 0 errors (npx tsc --noEmit passed clean)

---
*Phase: 02-inspector-responsive-preview*
*Completed: 2026-02-27*
