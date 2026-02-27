# Roadmap: MQ DS Collab Tool

## Overview

A four-phase build that lays the sandboxed rendering foundation first — because everything else depends on it — then adds the developer and designer tooling, then the copywriter and multi-screen workflow, and finally wraps up with sharing and prototype management. Each phase delivers a coherent, verifiable capability. No phase is useful without the one before it; every phase is useful before the one after it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Rendering Foundation** - Sandboxed iframe rendering pipeline with esbuild bundler, postMessage bridge, and ThemeProvider inside the sandbox (completed 2026-02-27)
- [ ] **Phase 2: Inspector & Responsive Preview** - AST-based component tree, prop inspector, breakpoint switcher, and shared panel shell
- [ ] **Phase 3: Copywriter, Multi-screen & Status** - Inline text editing, multi-screen navigation, and draft→review→approved workflow
- [ ] **Phase 4: Sharing & Gallery** - Shareable links and prototype list with search and filter

## Phase Details

### Phase 1: Rendering Foundation
**Goal**: A Claude Code-generated MUI prototype can be uploaded and rendered live in the browser inside a secure sandbox
**Depends on**: Nothing (first phase)
**Requirements**: REND-01, REND-02, REND-03, THME-01
**Success Criteria** (what must be TRUE):
  1. A designer can point the app at a Claude Code-generated .jsx file and see the rendered MUI prototype appear in the browser
  2. When a prototype contains a syntax error or runtime crash, a readable error message appears instead of a blank screen or app crash
  3. A dark/light mode toggle in the toolbar switches the prototype's MUI theme visually without reloading the page
  4. The MUI ThemeProvider lives inside the sandboxed iframe, not the app shell — verified by confirming theme changes do not affect shell UI elements
**Plans**: 2 plans
- [ ] 01-01-PLAN.md — Bundler pipeline + preview iframe rendering (esbuild, import map, ThemeProvider, ErrorBoundary)
- [ ] 01-02-PLAN.md — App shell + theme toggle + file watcher (Toolbar, PreviewFrame, SSE hot reload)

### Phase 2: Inspector & Responsive Preview
**Goal**: Developers can inspect the MUI component tree and props, and anyone can preview the prototype at any MUI breakpoint
**Depends on**: Phase 1
**Requirements**: REND-04, INSP-01, INSP-02, INSP-04
**Success Criteria** (what must be TRUE):
  1. Clicking a component in the Components tab shows its MUI component name and all prop values from the source file
  2. The component tree panel displays the MUI hierarchy (e.g., Box > Paper > Stack > Button) without requiring React DevTools
  3. Selecting xs, sm, md, lg, or xl from the breakpoint switcher resizes the preview iframe to that exact pixel width — not CSS-scaled, actually resized
  4. The panel has two tabs — "Copy" and "Components" — and switching between them does not lose state in either tab
**Plans**: 3 plans
- [x] 02-01-PLAN.md — AST inspector pipeline, Babel injection pre-pass, Zustand store, tree API, iframe inspector script (completed 2026-02-27)
- [ ] 02-02-PLAN.md — Breakpoint switcher, responsive PreviewFrame, InspectorPanel with tabs, ComponentTree, PropInspector
- [ ] 02-03-PLAN.md — Human verification of all Phase 2 success criteria

### Phase 3: Copywriter, Multi-screen & Status
**Goal**: Copywriters can edit all prototype text without touching code, multi-screen prototypes are navigable, and the team can track prototype status
**Depends on**: Phase 2
**Requirements**: INSP-03, SCRN-01, SCRN-02, SHAR-03
**Success Criteria** (what must be TRUE):
  1. A copywriter can see all text strings in the Copy tab, edit any of them inline, and see the change reflected in the prototype preview without touching the source .jsx file
  2. Text edits survive a prototype source update — a designer pushing a new version does not overwrite the copywriter's text changes
  3. A prototype with multiple screens shows a navigation control (tab strip or sidebar), and clicking a screen label loads that screen in the preview
  4. A designer can move a prototype from Draft to Review to Approved, and the current status is visible to anyone viewing the prototype
**Plans**: TBD

### Phase 4: Sharing & Gallery
**Goal**: The team can share prototypes via link and find any prototype in a browsable, searchable list
**Depends on**: Phase 3
**Requirements**: SHAR-01, SHAR-02
**Success Criteria** (what must be TRUE):
  1. Clicking "Share" generates a URL that anyone on the team can open in a browser without logging in and see the prototype in view-only mode
  2. The prototype list shows all prototypes with name, status badge, and creation date
  3. Typing in the search field filters the list by name in real time; filtering by status shows only prototypes in that state
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rendering Foundation | 2/2 | Complete   | 2026-02-27 |
| 2. Inspector & Responsive Preview | 1/3 | In progress | - |
| 3. Copywriter, Multi-screen & Status | 0/? | Not started | - |
| 4. Sharing & Gallery | 0/? | Not started | - |
