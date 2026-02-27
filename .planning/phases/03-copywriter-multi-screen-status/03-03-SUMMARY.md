---
phase: 03-copywriter-multi-screen-status
plan: 03
subsystem: ui
tags: [zustand, postmessage, iframe, copy-editing, text-overrides, mutation-observer]

# Dependency graph
requires:
  - phase: 03-01
    provides: TextEntry/ConflictEntry types, text-extractor, copy-overlay, copy API route
  - phase: 03-02
    provides: ScreenSidebar, screen-aware PreviewFrame, activeScreenId in inspector store
provides:
  - CopyTab component with full copy editing UI
  - useCopyStore Zustand store for copy state management
  - SET_TEXT_OVERRIDES / HIGHLIGHT_TEXT / TEXT_CLICK postMessage protocol
  - iframe text injection via TextOverrideApplier with MutationObserver
affects: [03-04, future phases using copy state]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TextOverrideContext + TextOverrideApplier for DOM mutation without modifying prototype code
    - MutationObserver + requestAnimationFrame for re-applying overrides after React re-renders
    - id="preview-iframe" for direct CopyTab -> iframe postMessage targeting
    - useCopyStore.getState() for reading latest state in callbacks to avoid stale closures

key-files:
  created:
    - src/stores/copy.ts
    - src/components/CopyTab.tsx
  modified:
    - src/lib/postmessage-types.ts
    - public/preview-bootstrap.js
    - src/components/InspectorPanel.tsx
    - src/components/PreviewFrame.tsx
    - src/app/(shell)/page.tsx

key-decisions:
  - "postToPreview uses document.getElementById('preview-iframe') — pragmatic v1 approach over shared ref/context"
  - "TextOverrideApplier uses MutationObserver to re-apply overrides after React re-renders in iframe"
  - "TEXT_CLICK sent alongside COMPONENT_SELECT on every click — shell decides what to do based on active tab"
  - "useCopyStore.getState() in callbacks to always read fresh entry list after updateEntry/resetEntry"

patterns-established:
  - "Pattern 1: id='preview-iframe' attribute as postMessage channel target — consistent across Copy tab consumers"
  - "Pattern 2: buildOverrideMap(entries) — derive override record from entries where currentValue !== sourceValue"
  - "Pattern 3: 500ms debounce on PATCH, immediate store update for optimistic UI"

requirements-completed: [INSP-03]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 3 Plan 03: Copy Tab Summary

**Full copy editing UI with live iframe text injection via MutationObserver, two-way visual linking, export/import JSON, and conflict resolution**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T15:07:30Z
- **Completed:** 2026-02-27T15:11:54Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built complete CopyTab component with grouped entries, inline editing, search, export/import, and conflict UI
- Extended postMessage protocol with SET_TEXT_OVERRIDES, HIGHLIGHT_TEXT (shell->iframe) and TEXT_CLICK (iframe->shell)
- Implemented TextOverrideApplier in the iframe bootstrap — applies text overrides via DOM manipulation, re-applied on every React re-render using MutationObserver
- Replaced InspectorPanel Copy tab placeholder with CopyTab; wired two-way visual linking between preview and sidebar

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy store, postMessage types, iframe text injection** - `dfe9398` (feat)
2. **Task 2: CopyTab component and InspectorPanel integration** - `f7e9b8a` (feat)

**Plan metadata:** (created after this commit)

## Files Created/Modified
- `src/stores/copy.ts` - Zustand store with entries, conflicts, search, groups, highlighted key
- `src/components/CopyTab.tsx` - Full copy editing UI: search, groups, editing, export/import, conflicts, history
- `src/lib/postmessage-types.ts` - Added SET_TEXT_OVERRIDES, HIGHLIGHT_TEXT, TEXT_CLICK message types
- `public/preview-bootstrap.js` - TextOverrideContext, TextOverrideApplier with MutationObserver, TEXT_CLICK, HIGHLIGHT_TEXT
- `src/components/InspectorPanel.tsx` - Replaced placeholder with CopyTab; added prototypeId prop
- `src/components/PreviewFrame.tsx` - Added TEXT_CLICK handler forwarding to copy store; id="preview-iframe"
- `src/app/(shell)/page.tsx` - Pass prototypeId to InspectorPanel

## Decisions Made
- `postToPreview` uses `document.getElementById('preview-iframe')` — pragmatic v1 approach, avoids new ref-passing infrastructure
- `TextOverrideApplier` uses `MutationObserver` on `#root` to re-apply overrides after React re-renders (direct DOM mutation is overwritten on re-render)
- `TEXT_CLICK` is always sent alongside `COMPONENT_SELECT` on element click — the shell decides what to do based on active tab
- `useCopyStore.getState()` used inside event callbacks to avoid stale closure on entry list after store updates

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CopyTab fully functional for Phase 3 acceptance testing
- Copy store and postMessage protocol ready for Phase 4 if needed
- 03-04 (status tracking and multi-screen indicators) can proceed independently

---
*Phase: 03-copywriter-multi-screen-status*
*Completed: 2026-02-27*
