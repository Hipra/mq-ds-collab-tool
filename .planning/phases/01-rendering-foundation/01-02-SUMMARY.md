---
phase: 01-rendering-foundation
plan: 02
subsystem: ui
tags: [zustand, mui, postmessage, sse, chokidar, iframe, theme, hot-reload]

# Dependency graph
requires:
  - phase: 01-rendering-foundation/01-01
    provides: esbuild bundle API route, preview route handler, preview-bootstrap.js, MUI theme module
provides:
  - Zustand theme store (light/dark/system) with localStorage persistence
  - App shell layout with MUI ThemeProvider (cssVariables + colorSchemes)
  - Toolbar with three-state theme toggle (Light/Dark/System)
  - PreviewFrame with postMessage bridge for theme sync and RELOAD
  - SSE /api/watch endpoint streaming file-change events via chokidar
  - File watcher singleton (src/lib/watcher.ts)
  - ErrorDisplay component for shell-side error rendering
affects:
  - All future phases that extend the app shell or toolbar
  - Phase 2 (component inspector) — PreviewFrame postMessage protocol is established

# Tech tracking
tech-stack:
  added:
    - zustand (with persist middleware for localStorage)
    - "@mui/icons-material (LightMode, DarkMode, SettingsBrightness icons)"
    - chokidar v4 (singleton file watcher)
  patterns:
    - Zustand store + MUI useColorScheme() sync via ThemeSyncProvider wrapper
    - postMessage protocol for shell-to-iframe communication (SET_THEME, RELOAD)
    - SSE pattern via ReadableStream + subscriber Set for push-based file watching
    - document.currentScript is null in ES module scripts; use <meta name="bundle-url"> instead

key-files:
  created:
    - src/stores/theme.ts
    - src/app/(shell)/layout.tsx
    - src/app/(shell)/page.tsx
    - src/components/Toolbar.tsx
    - src/components/PreviewFrame.tsx
    - src/components/ErrorDisplay.tsx
    - src/lib/watcher.ts
    - src/app/api/watch/route.ts
  modified:
    - public/preview-bootstrap.js
    - src/app/preview/[id]/route.ts
    - src/lib/theme.ts

key-decisions:
  - "Zustand persist middleware with key mq-ds-theme-mode used for global (not per-prototype) theme persistence"
  - "ThemeSyncProvider wrapper component reads Zustand mode and calls MUI useColorScheme().setMode() to keep shell ThemeProvider in sync — avoids duplicate stores"
  - "colorSchemeSelector: 'data' added to both shell createAppTheme() and iframe theme config — required for MUI v6 setMode() to write the data attribute on <html> that CSS variables reference"
  - "Bundle URL passed via <meta name='bundle-url'> not document.currentScript — currentScript is null in type=module scripts per browser spec"
  - "iframe sandbox='allow-scripts allow-same-origin' — same-origin required for Blob URL imports; accepted tradeoff for Phase 1 (prototypes are local Claude Code output only)"
  - "chokidar v4 (CJS) chosen for Node 18+ compatibility; v5 is ESM-only and incompatible with Next.js 15 module resolution"

patterns-established:
  - "postMessage protocol: shell sends { type: 'SET_THEME', mode } and { type: 'RELOAD' }; iframe sends { type: 'RENDER_ERROR', message } back to parent"
  - "SSE pattern: ReadableStream with subscriber Set, request abort signal removes subscriber — avoids memory leaks"
  - "ThemeSyncProvider: thin wrapper component that bridges external state (Zustand) to React context (MUI useColorScheme)"

requirements-completed: [REND-03, REND-02]

# Metrics
duration: ~45min
completed: 2026-02-27
---

# Phase 1 Plan 02: App Shell, Theme Toggle, and Hot Reload Summary

**Three-state dark/light/system theme toggle (Zustand + MUI useColorScheme) with simultaneous shell + iframe sync via postMessage, and SSE-driven hot reload via chokidar file watcher**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-27
- **Completed:** 2026-02-27
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 11

## Accomplishments

- Zustand theme store persists mode to localStorage (`mq-ds-theme-mode`), defaults to `'system'`
- App shell at `/` shows Toolbar + PreviewFrame in a full-viewport flex layout; theme toggle cycles Light -> Dark -> System affecting both shell and iframe simultaneously
- SSE `/api/watch` endpoint streams chokidar file-change events; PreviewFrame auto-reloads relevant prototype on save
- Errors from the iframe (both import-time and render-time) are caught and displayed with retry button; app does not crash
- Post-verification bugfixes resolved `document.currentScript` null issue in ES modules and `colorSchemeSelector` missing from theme configs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zustand theme store and app shell layout** - `4a2cc3d` (feat)
2. **Task 2: Create Toolbar, PreviewFrame, SSE watcher** - `b1e60ab` (feat)
3. **Task 3 (checkpoint approved) + post-verification bugfixes** - `866a12c` (fix)

## Files Created/Modified

- `src/stores/theme.ts` - Zustand store: mode (light/dark/system), setMode, cycleMode, localStorage persist
- `src/app/(shell)/layout.tsx` - App shell layout: MUI ThemeProvider + ThemeSyncProvider wrapper
- `src/app/(shell)/page.tsx` - Main page: Toolbar + PreviewFrame in flex column, hardcoded prototypeId='sample'
- `src/components/Toolbar.tsx` - Prototype name + three-state icon toggle (LightMode/DarkMode/SettingsBrightness)
- `src/components/PreviewFrame.tsx` - sandboxed iframe, postMessage SET_THEME/RELOAD bridge, SSE subscriber, loading spinner, error handling
- `src/components/ErrorDisplay.tsx` - Reusable error display with monospace message and optional Retry button
- `src/lib/watcher.ts` - Chokidar v4 singleton watcher + subscribers Set for SSE connections
- `src/app/api/watch/route.ts` - SSE GET handler streaming file-change events; cleans up on request abort
- `public/preview-bootstrap.js` - Fixed bundle URL read (meta tag) and added colorSchemeSelector: 'data'
- `src/app/preview/[id]/route.ts` - Added `<meta name="bundle-url">` tag to standalone preview HTML
- `src/lib/theme.ts` - Added colorSchemeSelector: 'data' to createAppTheme()

## Decisions Made

- `colorSchemeSelector: 'data'` must be set on both the shell theme and the iframe theme. MUI v6 uses this to write `data-mui-color-scheme` on `<html>`, which the CSS variables reference. Without it, `setMode()` works at the JS level but the DOM attribute is never set, so CSS variables never update.
- `document.currentScript` returns `null` inside `type="module"` scripts (browser spec). Bundle URL moved to `<meta name="bundle-url">` read via `querySelector`.
- ThemeSyncProvider pattern chosen over passing mode as a prop down the tree — keeps theme state in Zustand as single source of truth, MUI's useColorScheme is treated as a "sink" that mirrors the Zustand value.

## Deviations from Plan

### Auto-fixed Issues (post human-verify checkpoint)

**1. [Rule 1 - Bug] Fixed document.currentScript null in ES module bootstrap**
- **Found during:** Human verification (Task 3)
- **Issue:** `document.currentScript` is always `null` in `type="module"` scripts per browser spec; the bootstrap script was trying to read the bundle URL from it
- **Fix:** Added `<meta name="bundle-url" content="...">` to the preview HTML; bootstrap reads it via `document.querySelector('meta[name="bundle-url"]')`
- **Files modified:** `public/preview-bootstrap.js`, `src/app/preview/[id]/route.ts`
- **Committed in:** `866a12c`

**2. [Rule 1 - Bug] Added colorSchemeSelector: 'data' to theme configs**
- **Found during:** Human verification (Task 3)
- **Issue:** MUI v6 `setMode()` did not visually update themes because `colorSchemeSelector` was not configured, so no `data-mui-color-scheme` attribute was written to `<html>`
- **Fix:** Added `colorSchemeSelector: 'data'` to both `createAppTheme()` in `src/lib/theme.ts` and the inline theme in `public/preview-bootstrap.js`
- **Files modified:** `src/lib/theme.ts`, `public/preview-bootstrap.js`
- **Committed in:** `866a12c`

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug), discovered during human verification
**Impact on plan:** Both fixes essential for core functionality (theme toggle did not work without them). No scope creep.

## Issues Encountered

- MUI v6 `useColorScheme()` returns `undefined` on first render to avoid hydration mismatch. Toolbar handles this by showing a placeholder icon and the ThemeSyncProvider guards against calling `setMode(undefined)`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete rendering pipeline is working: esbuild transpilation, iframe embedding, theme sync, hot reload, error handling
- postMessage protocol (`SET_THEME`, `RELOAD`, `RENDER_ERROR`) is established — Phase 2 component inspector can add new message types without conflict
- PreviewFrame `iframeRef` is available for future use (e.g., Phase 2 may need to inject inspection overlays)
- `prototypeId` is hardcoded as `'sample'` in `page.tsx` — prototype selection/routing will be needed in a later phase

---
*Phase: 01-rendering-foundation*
*Completed: 2026-02-27*
