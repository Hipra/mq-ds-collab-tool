---
phase: 01-rendering-foundation
plan: 01
subsystem: rendering
tags: [esbuild, nextjs, react, mui, emotion, iframe, importmap, esm]

# Dependency graph
requires: []
provides:
  - esbuild bundler wrapping: bundlePrototype() transpiles JSX to ESM with React/MUI externalized
  - bundle API route: GET /api/preview/[id]/bundle returns text/javascript
  - preview route: GET /preview/[id] returns standalone HTML with import map for esm.sh
  - preview-bootstrap.js: iframe React root with ThemeProvider + Emotion CacheProvider + ErrorBoundary
  - theme.ts: createAppTheme() with cssVariables + colorSchemes (light/dark)
  - sample prototype: prototypes/sample/index.jsx for pipeline verification
  - prototype convention: folder-per-prototype with index.jsx + optional metadata.json
affects:
  - 01-02 (app shell, toolbar, iframe wrapper, dark/light toggle)
  - all subsequent phases (everything depends on this rendering pipeline)

# Tech tracking
tech-stack:
  added:
    - esbuild 0.24.x (server-side JSX transpilation via build() API with stdin)
    - "@emotion/cache 11.x (Emotion cache targeting iframe document.head)"
    - react-error-boundary 5.x (ErrorBoundary + FallbackComponent pattern)
    - chokidar 4.x (file watching — reserved for hot-reload in this phase's scope)
    - nanoid 5.x (prototype ID generation — reserved for Phase 2)
    - Next.js 15.5.12 (upgraded from 15.1.7 for security patches)
  patterns:
    - esbuild build() with stdin (NOT transform()) for external support
    - Route Handler instead of page.tsx for standalone iframe HTML (bypasses layout system)
    - Import map via esm.sh for React/MUI CDN with ?external= for singleton enforcement
    - Emotion cache with container: document.head inside iframe
    - postMessage protocol: SET_THEME, RELOAD, RENDER_ERROR between shell and iframe
    - Default export normalization for Claude Code output variation

key-files:
  created:
    - src/lib/bundler.ts
    - src/lib/theme.ts
    - src/app/api/preview/[id]/bundle/route.ts
    - src/app/preview/[id]/route.ts
    - public/preview-bootstrap.js
    - prototypes/sample/index.jsx
    - prototypes/sample/metadata.json
    - prototypes/README.md
    - next.config.ts
    - package.json
    - tsconfig.json
    - .gitignore
  modified: []

key-decisions:
  - "Route Handler (route.ts) used for /preview/[id] instead of page.tsx to produce truly standalone HTML bypassing Next.js layout system"
  - "Next.js 15.1.7 upgraded to 15.5.12 for security CVE patches (critical + moderate)"
  - "Folder-per-prototype structure chosen (prototypes/[id]/index.jsx) to support future multi-file prototypes and metadata sidecars"
  - "chokidar v4 (CJS) chosen over v5 (ESM-only) for Node 18+ compatibility"
  - "Default export normalization added to bundler.ts to handle Claude Code output variations"

patterns-established:
  - "Pattern: esbuild build() API with stdin mode — never transform() — for external option support"
  - "Pattern: Import map in iframe HTML with esm.sh ?external= parameter for React singleton enforcement"
  - "Pattern: Emotion createCache({ container: document.head }) inside iframe — prevents styles injecting into parent"
  - "Pattern: ThemeListener React component inside iframe for postMessage-driven theme switching"

requirements-completed: [REND-01, REND-02, THME-01]

# Metrics
duration: 5min
completed: 2026-02-27
---

# Phase 1 Plan 01: Rendering Foundation Summary

**esbuild-powered JSX-to-ESM pipeline with standalone iframe renderer, MUI ThemeProvider inside iframe via Emotion cache, and postMessage error/theme/reload protocol**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-27T11:02:54Z
- **Completed:** 2026-02-27T11:07:54Z
- **Tasks:** 3
- **Files created:** 12

## Accomplishments

- End-to-end rendering pipeline: JSX in `/prototypes/` → esbuild transpile → ESM bundle → iframe
- Standalone iframe HTML document served via Route Handler (bypasses Next.js layout) with esm.sh import map
- MUI ThemeProvider + Emotion CacheProvider inside iframe with postMessage protocol for SET_THEME, RELOAD, RENDER_ERROR
- 422 JSON error on build-time JSX syntax errors; ErrorBoundary with Retry button for runtime errors
- Sample prototype at `prototypes/sample/index.jsx` verified the full pipeline with MUI components

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, configure Next.js, create esbuild bundler + API route** - `b3c9996` (feat)
2. **Task 2: Preview route handler, bootstrap script, theme module** - `f269cc7` (feat)
3. **Task 3: Sample prototype and prototypes directory convention** - `284591f` (feat)
4. **Chore: .gitignore and package-lock.json** - `b173c56` (chore)

## Files Created/Modified

- `src/lib/bundler.ts` - bundlePrototype(): esbuild build() with stdin, external React/MUI, default export normalization
- `src/lib/theme.ts` - createAppTheme(): MUI theme with cssVariables + colorSchemes
- `src/app/api/preview/[id]/bundle/route.ts` - GET handler: bundles JSX → text/javascript; 422 on error
- `src/app/preview/[id]/route.ts` - GET handler: standalone HTML with esm.sh import map
- `public/preview-bootstrap.js` - Vanilla JS module: React root + ThemeProvider + CacheProvider + ErrorBoundary + postMessage
- `prototypes/sample/index.jsx` - Sample MUI prototype (Box, Typography, Button, Stack, TextField, Card, Chip)
- `prototypes/sample/metadata.json` - Prototype metadata: name, createdAt
- `prototypes/README.md` - Convention docs for Claude Code users
- `next.config.ts` - serverExternalPackages: ['esbuild'] (required for binary resolution)
- `package.json` - All dependencies including Next.js 15.5.12 (security upgrade)
- `tsconfig.json` - TypeScript config with target: es2017, moduleResolution: bundler
- `.gitignore` - Standard Next.js ignores

## Decisions Made

1. **Route Handler for preview page** — `page.tsx` would be wrapped by root layout's `<html>/<body>` even with a passthrough layout. A `route.ts` Route Handler returns raw HTML, fully standalone, which is what the iframe content must be.

2. **Next.js 15.5.12 security upgrade** — Original plan specified 15.1.7 which had a critical vulnerability (CVE-2025-66478). Upgraded to 15.5.12 (backport tag) which patches image optimization CVEs.

3. **chokidar v4 over v5** — Plan specified chokidar v5 (ESM-only, Node 20+) but Node 18.x is the minimum for Next.js 15. Used v4 for compatibility; v5 upgrade available when deployment confirms Node 20+.

4. **Default export normalization** — Added to bundler.ts: scans source for last top-level PascalCase component when no `export default` found, appends `export default ComponentName`. Handles Claude Code output variation documented in RESEARCH.md Pitfall 5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Upgraded Next.js from 15.1.7 to 15.5.12**
- **Found during:** Task 1 (npm install)
- **Issue:** `npm audit` reported critical vulnerability CVE-2025-66478 in Next.js 15.1.7
- **Fix:** Upgraded to Next.js 15.5.12 (backport-tagged stable release with security patches)
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm audit` reduced to 1 moderate (esbuild dev server — acceptable in dev-only tool)
- **Committed in:** b3c9996 (Task 1 commit)

**2. [Rule 1 - Bug] Used Route Handler instead of page.tsx for preview page**
- **Found during:** Task 2 (preview page creation)
- **Issue:** The plan notes "consider using a custom layout.tsx... or route handler" — confirmed that even a passthrough layout doesn't prevent Next.js root layout from injecting `<html>/<body>` wrapper, which would corrupt the standalone iframe document
- **Fix:** Implemented `/preview/[id]/route.ts` as a GET Route Handler returning raw HTML. This completely bypasses the layout system.
- **Files modified:** Created `src/app/preview/[id]/route.ts` (no `page.tsx`)
- **Verification:** `npm run build` succeeds; route appears as `ƒ /preview/[id]` (dynamic)
- **Committed in:** f269cc7 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed TypeScript matchAll iteration error**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** `[...source.matchAll(...)]` spread syntax caused TS2802 (requires target >= es2015)
- **Fix:** Replaced spread with `Array.from(source.matchAll(...))` and added `"target": "es2017"` to tsconfig.json
- **Files modified:** src/lib/bundler.ts, tsconfig.json
- **Verification:** TypeScript passes with no errors
- **Committed in:** b3c9996 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 security, 2 bugs)
**Impact on plan:** All auto-fixes necessary. The security upgrade is essential. The Route Handler approach is actually the plan's recommended fallback. No scope creep.

## Issues Encountered

- `create-next-app` could not run interactively in the project directory (conflict with existing files). Created Next.js project structure manually — all files created from scratch. Build verified via `npm run build` which succeeded cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Rendering pipeline is fully operational: `bundlePrototype()` → `/api/preview/[id]/bundle` → `/preview/[id]`
- postMessage protocol (SET_THEME, RELOAD, RENDER_ERROR) established and ready for app shell (Plan 02)
- ThemeProvider + Emotion cache architecture inside iframe ready for dark/light toggle
- Sample prototype at `prototypes/sample` verifies the complete pipeline
- No blockers for Plan 02 (app shell with toolbar and iframe wrapper)

## Self-Check: PASSED

All required files exist. All commits verified in git log. Build succeeds.

---
*Phase: 01-rendering-foundation*
*Completed: 2026-02-27*
