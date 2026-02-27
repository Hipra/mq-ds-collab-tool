---
phase: 02-inspector-responsive-preview
plan: "01"
subsystem: inspector-pipeline
tags: [babel, ast, component-tree, postmessage, zustand, inspector]
dependency_graph:
  requires:
    - 01-01 (esbuild bundler, prototype rendering)
    - 01-02 (postMessage protocol, preview bootstrap)
  provides:
    - extractComponentTree (Babel AST extraction)
    - injectInspectorIds (Babel pre-pass for bundler)
    - useInspectorStore (Zustand store for Phase 2 UI)
    - GET /api/preview/[id]/tree (component tree endpoint)
    - COMPONENT_HOVER / COMPONENT_SELECT postMessages from iframe
  affects:
    - src/lib/bundler.ts (Babel pre-pass integrated)
    - public/preview-bootstrap.js (inspector event listeners added)
tech_stack:
  added:
    - "@babel/parser (transitive dep, now explicitly used)"
    - "@babel/traverse (transitive dep, now explicitly used)"
    - "@babel/generator (transitive dep, now explicitly used)"
    - "@babel/types (transitive dep, now explicitly used)"
  patterns:
    - "Babel parse+traverse+generate pipeline for AST transformation"
    - "Zustand create() store (same pattern as prior stores)"
    - "Next.js Route Handler (force-dynamic) for tree endpoint"
    - "@ts-expect-error for @babel/traverse CJS interop (no .d.ts)"
key_files:
  created:
    - src/lib/ast-inspector.ts
    - src/lib/postmessage-types.ts
    - src/stores/inspector.ts
    - src/lib/inspector-plugin.ts
    - src/app/api/preview/[id]/tree/route.ts
  modified:
    - src/lib/bundler.ts
    - src/lib/theme.ts
    - public/preview-bootstrap.js
decisions:
  - "@ts-expect-error used for @babel/traverse and @babel/generator imports — installing @types/babel__traverse conflicts with MUI CssVarsThemeOptions type resolution"
  - "colorSchemeSelector moved from createTheme top-level to cssVariables nested object — pre-existing type mismatch masked by incremental TS build cache"
  - "HTML element children of MUI components are collected by pushing current parent array ref (not a new placeholder) — ensures MUI ancestors capture nested MUI descendants"
  - "Shell fetches /api/preview/[id]/tree directly (not via iframe postMessage) — simpler architecture"
metrics:
  duration: "13 minutes"
  completed: "2026-02-27"
  tasks_completed: 2
  files_modified: 8
---

# Phase 02 Plan 01: AST Inspector Pipeline and Iframe Integration Summary

Babel AST component tree extraction, data-inspector-id injection, Zustand inspector store, tree API endpoint, and iframe hover/click inspector script enabling Phase 2 component inspection UI.

## What Was Built

### Task 1: AST Inspector, postMessage Types, Zustand Store

**`src/lib/ast-inspector.ts`** — Babel-based component tree extractor using `@babel/parser` + `@babel/traverse`. Traverses JSX with `JSXElement` enter/exit visitors using a children-array stack. HTML elements push the same parent ref (not a new array), so MUI components nested inside divs/spans are still attributed to the correct MUI ancestor. Extracts props with typed serialization (string/number/boolean/expression/spread). Output: `ComponentNode[]` with `id`, `componentName`, `props`, `sourceFile`, `sourceLine`, `children`.

**`src/lib/postmessage-types.ts`** — Typed discriminated union protocol for all shell↔iframe communication. Extends Phase 1 protocol with `SET_INSPECTOR_MODE` (shell→iframe), `COMPONENT_TREE`, `COMPONENT_HOVER`, `COMPONENT_SELECT` (iframe→shell).

**`src/stores/inspector.ts`** — Zustand `create()` store (matching existing pattern from `theme.ts` area). Manages: `panelOpen`, `activeTab`, `selectedComponentId`, `hoveredComponentId`, `componentTree`, `inspectorMode`, `previewWidth`. Defaults: panel open, components tab active, inspector enabled, preview width auto.

### Task 2: Tree API, Bundler Pre-pass, Iframe Inspector

**`src/lib/inspector-plugin.ts`** — Babel transform using `@babel/parser` + `@babel/traverse` + `@babel/generator`. Injects `data-inspector-id="${ComponentName}_${line}_${col}"` JSX attributes on all uppercase (MUI) components. Idempotent (skips if attribute already present). `retainLines: true` preserves line numbers for debugging.

**`src/lib/bundler.ts`** — Modified to run `injectInspectorIds()` pre-pass after `ensureDefaultExport()` and before `esbuild.build()`. Added `getPrototypeSource()` helper that reads + normalizes source WITHOUT instrumentation (for tree endpoint AST analysis on clean source).

**`src/app/api/preview/[id]/tree/route.ts`** — `GET` route returning `ComponentNode[]` JSON. Uses `getPrototypeSource()` + `extractComponentTree()`. Returns 422 on file-not-found or parse errors.

**`public/preview-bootstrap.js`** — Added inspector section before `rootElement` mount:
- `inspectorEnabled` flag (default `true`, controlled by `SET_INSPECTOR_MODE` messages)
- `ensureOverlay()` — lazily creates a positioned div with MUI blue outline for hover highlight
- `findInspectorTarget(el)` — walks up DOM to find nearest `[data-inspector-id]` element
- `mouseover` listener → posts `COMPONENT_HOVER` with id + rect, shows overlay
- `mouseout` listener → clears overlay, posts `COMPONENT_HOVER { id: null, rect: null }`
- `click` listener → prevents default, posts `COMPONENT_SELECT` with id + rect
- `message` listener → toggles `inspectorEnabled` on `SET_INSPECTOR_MODE`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed colorSchemeSelector type mismatch in theme.ts**
- **Found during:** Task 2 (clean build after cache cleared by `rm .next tsconfig.tsbuildinfo`)
- **Issue:** `colorSchemeSelector: 'data'` was at top-level of `createTheme({})`, but the MUI v6 `createTheme` type signature requires it nested inside `cssVariables: { colorSchemeSelector: 'data' }`. This was masked by the TypeScript incremental build cache (tsbuildinfo).
- **Fix:** Moved `colorSchemeSelector` inside `cssVariables: { ... }` object
- **Files modified:** `src/lib/theme.ts`
- **Commit:** 23622b9

**2. [Rule 2 - Missing] Added @ts-expect-error for @babel/traverse and @babel/generator imports**
- **Found during:** Task 2 — `npm run build` reported implicit `any` for @babel/traverse
- **Issue:** `@babel/traverse` and `@babel/generator` ship without `.d.ts` files in the version installed as a Next.js transitive dep. Installing `@types/babel__traverse` causes a type conflict with MUI's `CssVarsThemeOptions` (the `@types` package re-exports `@babel/types` globals that clash with MUI's type resolution).
- **Fix:** Used `// @ts-expect-error` on the import lines + explicit typed constants instead of installing conflicting `@types/` packages.
- **Files modified:** `src/lib/ast-inspector.ts`, `src/lib/inspector-plugin.ts`
- **Commit:** 23622b9

## Verification Results

- AST inspector verified with `npx tsx` test: Box, Typography, Button extracted; div excluded; `variant` prop serialized.
- `npm run build` passes without errors after all fixes.
- `GET /api/preview/[id]/tree` route deployed and visible in build output.

## Self-Check: PASSED

- [x] `src/lib/ast-inspector.ts` — FOUND
- [x] `src/lib/postmessage-types.ts` — FOUND
- [x] `src/stores/inspector.ts` — FOUND
- [x] `src/lib/inspector-plugin.ts` — FOUND
- [x] `src/app/api/preview/[id]/tree/route.ts` — FOUND
- [x] Commit 9f73f1c (Task 1) — FOUND
- [x] Commit 23622b9 (Task 2) — FOUND
- [x] Build passes: confirmed `BUILD OK`
