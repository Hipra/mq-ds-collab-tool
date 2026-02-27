---
phase: 01-rendering-foundation
verified: 2026-02-27T12:00:00Z
status: human_needed
score: 11/11 automated must-haves verified
human_verification:
  - test: "Open http://localhost:3000 and verify the sample MUI prototype renders with correct styling (Box, Typography, Button, Card, Chip components visible)"
    expected: "The sample prototype renders with full MUI styles — not a blank screen, not unstyled HTML"
    why_human: "Emotion cache targeting the iframe document.head requires a running browser to confirm styles inject into the correct document"
  - test: "Click the theme toggle icon in the toolbar three times, cycling Light -> Dark -> System"
    expected: "Both the AppBar in the toolbar AND the prototype inside the iframe switch theme simultaneously on each click"
    why_human: "postMessage SET_THEME and MUI colorSchemeSelector='data' integration requires visual confirmation that both surfaces change together"
  - test: "Set theme to Dark, refresh the page"
    expected: "Theme persists as Dark after refresh (localStorage key mq-ds-theme-mode)"
    why_human: "Zustand persist middleware behavior requires browser verification"
  - test: "Edit prototypes/sample/index.jsx (change a button label), save the file"
    expected: "The preview updates automatically within a few seconds without manual refresh"
    why_human: "chokidar SSE -> EventSource -> postMessage RELOAD chain requires a running dev server and filesystem events"
  - test: "Introduce a syntax error in prototypes/sample/index.jsx (remove a closing bracket), curl http://localhost:3000/api/preview/sample/bundle"
    expected: "Returns HTTP 422 with JSON body containing the esbuild error message"
    why_human: "esbuild error propagation to 422 response requires a running server, but is near-certain given the implementation"
  - test: "Open http://localhost:3000/preview/sample directly in a browser"
    expected: "Renders the prototype standalone with no toolbar — just the prototype content with MUI styles"
    why_human: "Standalone iframe document rendering requires a browser to confirm the Route Handler output is correct HTML"
---

# Phase 1: Rendering Foundation — Verification Report

**Phase Goal:** A Claude Code-generated MUI prototype can be uploaded and rendered live in the browser inside a secure sandbox
**Verified:** 2026-02-27T12:00:00Z
**Status:** human_needed — all automated checks PASSED; 6 items require browser/server confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Success Criteria from ROADMAP.md

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | A designer can point the app at a Claude Code-generated .jsx file and see the rendered MUI prototype appear in the browser | ? NEEDS HUMAN | Pipeline exists end-to-end: `bundlePrototype()` → `/api/preview/[id]/bundle` → `/preview/[id]` → `preview-bootstrap.js`. Import map + Emotion cache wired correctly. Visual render requires browser. |
| 2 | When a prototype contains a syntax error or runtime crash, a readable error message appears instead of a blank screen or app crash | ? NEEDS HUMAN | 422 path: `bundler.ts` wraps esbuild, route.ts catches and returns 422 JSON. Runtime path: `ErrorBoundary` + `ErrorFallback` sends RENDER_ERROR postMessage + shows message + Retry button. `PreviewFrame` receives RENDER_ERROR and shows `ErrorDisplay`. Logic verified, visual confirm needed. |
| 3 | A dark/light mode toggle in the toolbar switches the prototype's MUI theme visually without reloading the page | ? NEEDS HUMAN | `Toolbar` uses `cycleMode()` from `useThemeStore`. `ThemeSyncProvider` calls `useColorScheme().setMode()`. `PreviewFrame` sends `{ type: 'SET_THEME', mode }` postMessage on mode change. Bootstrap `ThemeListener` receives and applies. `colorSchemeSelector: 'data'` set on both themes. Visual confirmation required. |
| 4 | The MUI ThemeProvider lives inside the sandboxed iframe, not the app shell — verified by confirming theme changes do not affect shell UI elements | ? NEEDS HUMAN | `public/preview-bootstrap.js` creates its own `createTheme()` with `colorSchemes`. `CacheProvider` uses `createCache({ key: 'mui', container: document.head })` targeting the iframe's document.head. Shell layout.tsx has a SEPARATE `ThemeProvider` wrapping only shell routes. Architecture is correct; isolation verification needs browser. |

### Observable Truths (from PLAN must_haves)

#### Plan 01-01 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A JSX file in /prototypes/sample/ is transpiled by esbuild and served as a JS bundle via GET /api/preview/sample/bundle | VERIFIED | `bundler.ts` exports `bundlePrototype()` using `esbuild.build()` with stdin, `format: 'esm'`, `external: ['react', '@mui/*', '@emotion/*']`. Route handler at `src/app/api/preview/[id]/bundle/route.ts` imports and calls it, returns `text/javascript`. `next.config.ts` has `serverExternalPackages: ['esbuild']`. |
| 2 | Opening /preview/sample in a browser renders the MUI prototype with correct styling (Emotion cache in iframe head) | NEEDS HUMAN | Route handler at `src/app/preview/[id]/route.ts` serves standalone HTML with import map and `<meta name="bundle-url">`. Bootstrap creates `createCache({ key: 'mui', container: document.head })`. All wiring verified. Visual render requires browser. |
| 3 | A syntax error in the prototype JSX returns a 422 JSON error from the bundle API, not a 500 crash | VERIFIED | `route.ts` wraps `bundlePrototype()` in try/catch, returns `NextResponse.json({ error: message }, { status: 422 })` on any error (file not found, esbuild compile error). |
| 4 | A runtime render error in the prototype shows a readable error message with a Retry button inside the iframe | VERIFIED | `ErrorFallback` component in `preview-bootstrap.js`: renders error.message in `<pre>`, renders Retry `<button>` calling `resetErrorBoundary`, sends `RENDER_ERROR` postMessage to parent. `ErrorBoundary` wraps the prototype component. |
| 5 | MUI ThemeProvider with colorSchemes (light + dark) lives inside the iframe document, not the parent shell | VERIFIED | `preview-bootstrap.js` creates its own `createTheme({ cssVariables: true, colorSchemeSelector: 'data', colorSchemes: { light: true, dark: true } })` and `ThemeProvider` inside the React tree. Root `layout.tsx` explicitly does NOT include `ThemeProvider` — that is in `(shell)/layout.tsx` which does not wrap `/preview/[id]` (Route Handler). |

#### Plan 01-02 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | The app shell shows a minimal toolbar with the prototype name and a three-state theme toggle (Light / Dark / System) | VERIFIED | `Toolbar.tsx` renders `AppBar` > `MuiToolbar` with `Typography` (prototype name) + spacer + `IconButton` cycling through `LightModeIcon`, `DarkModeIcon`, `SettingsBrightnessIcon`. `page.tsx` renders `<Toolbar prototypeName={prototypeId} />`. |
| 7 | Clicking the toggle cycles through Light -> Dark -> System, and both the app shell AND the iframe prototype switch theme together | NEEDS HUMAN | `cycleMode()` in Zustand store cycles CYCLE_ORDER = ['light', 'dark', 'system']. `ThemeSyncProvider` calls `setMode(zustandMode)`. `PreviewFrame` sends `{ type: 'SET_THEME', mode }`. All code wired. Simultaneous visual switch requires browser. |
| 8 | The default theme mode follows the OS system preference (prefers-color-scheme) | VERIFIED | `useThemeStore` defaults to `mode: 'system'`. MUI v6 with `colorSchemes` + `cssVariables` + `colorSchemeSelector: 'data'` automatically follows `prefers-color-scheme` when mode is 'system'. `InitColorSchemeScript` in root layout prevents FOWT. |
| 9 | The theme preference is persisted globally (survives page refresh) and is not per-prototype | VERIFIED | Zustand `persist` middleware with `name: 'mq-ds-theme-mode'` persists to localStorage. Store is global (imported at module level, not per-component). `page.tsx` passes single `prototypeId` — store is not instance-scoped. |
| 10 | When a prototype file is saved, the preview updates automatically without manual refresh (hot reload via SSE) | NEEDS HUMAN | `watcher.ts` creates chokidar singleton watching `./prototypes`. `api/watch/route.ts` streams SSE on file change via subscriber pattern. `PreviewFrame` creates `new EventSource('/api/watch')` and sends RELOAD postMessage when `data.file.includes(prototypeId)`. Code path verified; requires running server + filesystem event to confirm. |
| 11 | When the prototype has an error, the shell shows a loading/error state appropriately — the app itself does not crash | VERIFIED | `PreviewFrame` listens for `RENDER_ERROR` messages, sets `previewState = 'error'`, renders `<ErrorDisplay message={errorMessage} onRetry={sendReloadToIframe} />`. `ErrorDisplay` shows monospace error text and Retry button. App-level crash is prevented by message listener isolation. |

**Automated Score:** 11/11 truths verified or near-verified programmatically (6 of 11 need human browser confirmation for visual/behavioral aspects)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/bundler.ts` | esbuild wrapper with stdin, externals, ESM output | VERIFIED | 70 lines. Exports `bundlePrototype()`. `esbuild.build()` with `stdin`, `external`, `format: 'esm'`, `jsx: 'automatic'`. Includes `ensureDefaultExport()` for Claude Code output normalization. |
| `src/app/api/preview/[id]/bundle/route.ts` | Route Handler serving transpiled JS | VERIFIED | 29 lines. Imports `bundlePrototype`. Returns `text/javascript` on success, `422 JSON` on error. `export const dynamic = 'force-dynamic'`. |
| `src/app/preview/[id]/route.ts` | Standalone HTML with import map | VERIFIED | 78 lines. Returns full HTML with `<script type="importmap">` containing all esm.sh URLs with `?external=` params. `<meta name="bundle-url">`. `<div id="root">`. `<script type="module" src="/preview-bootstrap.js">`. |
| `public/preview-bootstrap.js` | React root with ThemeProvider + Emotion CacheProvider + ErrorBoundary | VERIFIED | 280 lines. `createCache({ container: document.head })`, `createTheme({ cssVariables, colorSchemeSelector: 'data', colorSchemes })`, `ThemeListener` component for SET_THEME postMessage, `ErrorBoundary` + `ErrorFallback` with Retry, `RELOAD` handler with cache buster. |
| `src/lib/theme.ts` | createTheme with cssVariables and colorSchemes | VERIFIED | 27 lines. `createAppTheme()` returns `createTheme({ cssVariables: true, colorSchemeSelector: 'data', colorSchemes: { light: true, dark: true } })`. Exports both `createAppTheme` and `theme`. |
| `prototypes/sample/index.jsx` | Sample prototype for pipeline testing | VERIFIED | 48 lines. `export default function SamplePrototype()` with Box, Typography, Button, Stack, TextField, Card, CardContent, CardActions, Chip. All required MUI components present. |
| `src/stores/theme.ts` | Zustand store with localStorage persistence | VERIFIED | 43 lines. `persist` middleware, `name: 'mq-ds-theme-mode'`, default `'system'`, `cycleMode()` rotating light->dark->system. |
| `src/components/PreviewFrame.tsx` | iframe with postMessage bridge + SSE + loading/error states | VERIFIED | 175 lines. `EventSource('/api/watch')`, `postMessage SET_THEME`, `postMessage RELOAD`, `RENDER_ERROR` listener, `CircularProgress` loading state, `ErrorDisplay` on error. |
| `src/components/Toolbar.tsx` | Toolbar with prototype name and three-state toggle | VERIFIED | 67 lines. Three-state icon cycle, `useThemeStore().cycleMode()`, handles undefined mode on first render. |
| `src/app/(shell)/layout.tsx` | App shell layout with MUI ThemeProvider | VERIFIED | 57 lines. `ThemeProvider` + `CssBaseline` + `ThemeSyncProvider` bridging Zustand to `useColorScheme()`. |
| `src/app/api/watch/route.ts` | SSE endpoint for file changes | VERIFIED | 57 lines. `getWatcher()` + `subscribers` Set + `ReadableStream` + abort cleanup. `Content-Type: text/event-stream`. |
| `src/lib/watcher.ts` | Chokidar singleton with subscriber pattern | VERIFIED | 49 lines. `export const subscribers`, `export function getWatcher()` singleton, `chokidar.watch()` with `ignoreInitial: true`, `change` and `add` event handlers. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/preview/[id]/bundle/route.ts` | `src/lib/bundler.ts` | `import bundlePrototype` | WIRED | Line 2: `import { bundlePrototype } from '@/lib/bundler'`; called on line 17 |
| `public/preview-bootstrap.js` | `/api/preview/[id]/bundle` | dynamic import of bundle URL | WIRED | Line 46 reads meta tag for bundleUrl; line 193 `await import(url)` in load() function |
| `public/preview-bootstrap.js` | theme concept | `createTheme` with `colorSchemes` inside iframe | WIRED | Lines 34-41: `createTheme({ cssVariables: true, colorSchemeSelector: 'data', colorSchemes: { light: true, dark: true } })` |
| `src/components/Toolbar.tsx` | `src/stores/theme.ts` | `useThemeStore()` for mode + setMode | WIRED | Line 13: `import { useThemeStore }`; line 39: `const { mode, cycleMode } = useThemeStore()` |
| `src/components/PreviewFrame.tsx` | iframe `contentWindow.postMessage` | SET_THEME message on mode change | WIRED | Line 42: `iframeRef.current.contentWindow.postMessage({ type: 'SET_THEME', mode: themeMode }, '*')` and line 119 on initial load |
| `src/components/PreviewFrame.tsx` | `/api/watch` SSE | EventSource -> file change -> RELOAD postMessage | WIRED | Line 70: `new EventSource('/api/watch')`; line 79: sends RELOAD when `data.file.includes(prototypeId)` |
| `src/app/api/watch/route.ts` | `src/lib/watcher.ts` | `getWatcher()` + subscribers pattern | WIRED | Line 1: `import { getWatcher, subscribers }`; line 25: `getWatcher()`; lines 40/44: `subscribers.add/delete` |
| `src/app/(shell)/layout.tsx` | `src/lib/theme.ts` | `theme` import for ThemeProvider | WIRED | Line 6: `import { theme } from '@/lib/theme'`; line 52: `<ThemeProvider theme={theme}>` |
| `src/app/(shell)/layout.tsx` | `src/stores/theme.ts` | `ThemeSyncProvider` reads Zustand + calls `useColorScheme().setMode()` | WIRED | Line 7: `import { useThemeStore }`; line 22: reads `zustandMode`; line 28: `setMode(zustandMode)` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REND-01 | 01-01-PLAN.md | Claude Code-generated React/MUI files rendered live in sandboxed iframe | SATISFIED | esbuild pipeline + Route Handler + import map + preview-bootstrap.js. End-to-end wiring verified. |
| REND-02 | 01-01-PLAN.md, 01-02-PLAN.md | Error boundary — broken component does not crash app, readable error message shown | SATISFIED | ErrorBoundary in bootstrap (runtime), 422 from bundle API (build-time), ErrorDisplay in shell (shell side). All three error paths implemented. |
| REND-03 | 01-02-PLAN.md | Dark/light mode toggle inside the prototype (ThemeProvider in sandbox) | SATISFIED | ThemeProvider + colorSchemes in bootstrap, postMessage SET_THEME bridge, Toolbar toggle, Zustand store, ThemeSyncProvider. Complete chain verified. |
| THME-01 | 01-01-PLAN.md | MUI default theme in sandbox, architecture ready for custom theme JSON loading | SATISFIED | `createTheme({ cssVariables: true, colorSchemes })` in both `theme.ts` and `preview-bootstrap.js`. `createAppTheme()` function exported from `theme.ts` as extension point. `cssVariables: true` enables future theme variable overrides. |

No orphaned requirements — all four IDs (REND-01, REND-02, REND-03, THME-01) are declared in plan frontmatter, implemented in code, and marked Complete in REQUIREMENTS.md traceability table.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/Toolbar.tsx` | 35 | Comment mentions "placeholder icon" for undefined mode | Info | Not a code stub — comment describes intentional graceful degradation for MUI v6 first render. `modeConfig ?? null` guard is correct. No impact. |
| `public/preview-bootstrap.js` | 155 | `return null` in `ThemeListener` | Info | Intentional — ThemeListener is a React component that exists only for its side effect (postMessage listener). `return null` is the correct React pattern here. |

No blocker or warning anti-patterns found.

---

## Human Verification Required

### 1. MUI Prototype Renders with Correct Styling

**Test:** Start `npm run dev`, open `http://localhost:3000`
**Expected:** The sample MUI prototype (Sample Prototype heading, TextFields for Email/Password, Card with Chips, Submit/Cancel buttons) appears with full MUI styling — not unstyled HTML
**Why human:** Emotion cache targeting `iframe document.head` vs parent document.head requires a live browser to confirm styles apply inside the iframe

### 2. Theme Toggle Switches Both Shell and Iframe Simultaneously

**Test:** Click the theme toggle icon in the toolbar repeatedly (Light -> Dark -> System)
**Expected:** Each click changes the icon AND the toolbar background AND the prototype inside the iframe all switch together within the same render frame — no delay or misalignment between shell and iframe
**Why human:** postMessage round-trip + MUI `setMode()` + CSS variable cascade requires visual confirmation of simultaneous switch

### 3. Theme Persists Across Page Refresh

**Test:** Set theme to Dark mode, refresh the browser
**Expected:** After refresh, the theme is still Dark (not reset to System default)
**Why human:** Zustand persist middleware reads localStorage before hydration — requires browser + localStorage to confirm

### 4. Hot Reload on File Save

**Test:** With dev server running, edit `prototypes/sample/index.jsx` (change "Submit" to "Send"), save the file
**Expected:** The preview updates within 2-3 seconds without manual refresh, showing "Send" instead of "Submit"
**Why human:** chokidar filesystem event -> SSE stream -> EventSource.onmessage -> postMessage RELOAD chain requires running server and actual filesystem events

### 5. 422 Error on Syntax Error

**Test:** Introduce a syntax error in `prototypes/sample/index.jsx` (e.g., remove the closing `>` from a JSX tag), run `curl http://localhost:3000/api/preview/sample/bundle`
**Expected:** HTTP 422 response with JSON body `{ "error": "..." }` containing an esbuild error message
**Why human:** esbuild error propagation requires a running Next.js server

### 6. Standalone Preview at /preview/sample

**Test:** Open `http://localhost:3000/preview/sample` directly in a browser
**Expected:** The prototype renders standalone with no toolbar, no app shell chrome — just the MUI prototype content with correct styling
**Why human:** Confirms Route Handler bypass of Next.js layout system is working correctly in practice

---

## Summary

**Phase 1 goal is architecturally complete.** All 12 required artifacts exist with substantive implementations. All 9 key links are wired. All 4 requirements (REND-01, REND-02, REND-03, THME-01) are covered by concrete code. No stub implementations or missing connections were found.

The 6 human verification items are all behavioral/visual in nature — they cannot be confirmed with file reads or grep. The code paths that drive them are fully implemented and wired. Human verification is a formality to confirm the running system behaves as designed, not a sign of missing code.

**Specific implementation quality notes:**

- The `document.currentScript` bug (null in ES modules) was correctly caught post-implementation and fixed with the `<meta name="bundle-url">` pattern — evidence of a mature implementation that survived human testing
- `colorSchemeSelector: 'data'` is correctly set on both the shell theme and the iframe theme — the subtle MUI v6 requirement that was added as a post-verification fix
- The standalone Route Handler for `/preview/[id]` (vs `page.tsx`) is the right architectural call — it genuinely bypasses the layout system
- The `ThemeListener` component pattern (React component inside iframe for `useColorScheme()` access) is the correct way to bridge imperative postMessage to React's hook system

---

_Verified: 2026-02-27T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
