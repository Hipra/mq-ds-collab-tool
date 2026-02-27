# Project Research Summary

**Project:** MQ DS Collab Tool — MUI Prototyping & Collaboration Webapp
**Domain:** Live React Component Prototyping / Design-to-Dev Handoff Tool
**Researched:** 2026-02-27
**Confidence:** MEDIUM

## Executive Summary

This is a design-system collaboration tool that renders MUI React components live in the browser for design review, copywriter editing, and developer inspection. The closest analogues are Storybook (component isolation) and Figma Dev Mode (design handoff), but this tool is purpose-built for a Claude Code authoring workflow where AI generates .jsx prototype files that non-technical stakeholders need to view and act on. The recommended approach is a **host-shell + sandboxed-preview** architecture: a Next.js 15 App Router application with a sandboxed iframe for prototype rendering, esbuild for server-side JSX bundling, SQLite for metadata storage, and a postMessage bridge for shell-to-preview communication.

The recommended stack is well-established and not novel — every technology choice maps to a proven pattern used by Storybook, CodeSandbox, or JSFiddle. The highest technical risk is the esbuild-in-API-route integration for live bundling, which is sound in principle but needs verification against Next.js 15 App Router specifics. The second-highest risk is the inspector panel: research strongly recommends AST-based static analysis over runtime fiber introspection, which is the conventional instinct but is fragile and breaks across React versions.

The primary risks are architectural, not feature-level: rendering user-generated JSX without proper iframe isolation is a critical security gap that cannot be retrofitted; similarly, the MUI ThemeProvider must live inside the sandbox from day one, or dark/light mode, custom tokens, and correct typography will never work. Teams that get the sandbox architecture right in Phase 1 will have a smooth feature build-out. Teams that cut corners on isolation will rewrite the rendering layer.

---

## Key Findings

### Recommended Stack

Next.js 15 with the App Router is the right framework because this tool requires a backend (file reading, metadata storage, share links) collocated with the React frontend. A Vite SPA would require a separate Express server. The preview rendering pipeline uses esbuild's Node.js API inside a Next.js API route to bundle Claude Code-generated .jsx files on demand, returning a JS bundle served to a sandboxed iframe. This is the same approach used by JSFiddle and similar tools at their core.

For state, Zustand handles fast local UI state (inspector selection, viewport size, dark/light toggle) while TanStack Query handles server state (prototype list, metadata, status). MUI v6 is used for both the app shell and prototype rendering to avoid two competing theme systems. SQLite via Drizzle ORM is the correct database choice for a single-server internal tool — no infrastructure overhead, ACID guarantees, and TypeScript-first query types.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework with collocated API routes — eliminates need for a separate backend server
- **MUI v6 + Emotion:** UI for both app shell and prototype rendering — one theme system, no conflicts
- **esbuild 0.24.x (Node.js API):** Server-side JSX bundling — sub-100ms rebuild, no WASM browser download
- **SQLite + Drizzle ORM:** Prototype metadata storage — zero infrastructure, ACID-safe, TypeScript types
- **Zustand 5 + TanStack Query 5:** State split: local UI state (Zustand) vs server data (React Query)
- **nanoid 5.x:** Share token generation — URL-safe, collision-resistant, zero config
- **postMessage bridge (custom):** iframe-to-shell communication — typed protocol, no library needed

### Expected Features

The feature research draws clear lines between table stakes (must ship for the tool to be usable), differentiators (the reasons to build this instead of Storybook), and anti-features (work to explicitly not do).

**Must have (table stakes):**
- **Live component rendering with error boundaries** — the entire value proposition; nothing else works without it
- **Shareable link per prototype** — the core handoff mechanism; no auth required for view-only access
- **Component tree + prop inspector** — the developer's primary value; see hierarchy and prop values
- **Inline text editing** — the copywriter's primary value; no JSX reading required
- **Dark / light mode toggle** — always required for MUI design review
- **Responsive preview (breakpoint switcher)** — xs/sm/md/lg/xl widths, not CSS scaling
- **Prototype list with search and filter** — operational necessity beyond 3 prototypes
- **Status workflow (draft → review → approved)** — replaces "is this final?" Slack traffic

**Should have (differentiators that justify building over adopting Storybook):**
- **Role-based view switching** (Designer / Copywriter / Developer) — focused UI per stakeholder
- **MUI theme preview** — see production theme, not generic Material defaults
- **Status-gated sharing** — draft watermark banner for non-approved prototypes
- **Copy-to-clipboard import statement** — developer clicks component, gets import ready to paste
- **Claude Code integration metadata** — generation timestamp, file path conventions surfaced in UI
- **Keyboard shortcut navigation** — power-user cycle through screens and panels

**Defer (v2+):**
- **Multi-screen navigation preview** — single-screen first; routing adds significant complexity
- **Annotation layer with MUI docs links** — nice to have, not blocking handoff
- **Prototype versioning / history** — snapshot diffs; defer per PROJECT.md

**Anti-features (explicitly do not build):**
- Real-time collaborative editing (CRDT/OT complexity)
- In-app AI chat or prompt interface (Claude Code is the authoring tool)
- Comment threads (use Figma or Slack)
- Production code export
- Visual drag-and-drop editor

### Architecture Approach

The system uses a **host-shell + sandboxed-preview** split. The App Shell is a Next.js React SPA handling navigation, inspector panels, toolbar, and status management. The Preview Frame is a sandboxed iframe with its own React root, ThemeProvider, and CssBaseline — completely isolated from the shell. All communication between shell and preview goes through a typed postMessage protocol. The inspector uses AST-based static analysis of the .jsx source at upload/bundle time, not runtime fiber introspection. Text overrides are stored as a separate keyed overlay structure (never as mutations to source), merged at render time.

**Major components and build order:**
1. **Backend API** — prototype CRUD, source file storage, metadata in SQLite
2. **Module Bundler (esbuild pipeline)** — source .jsx → browser-runnable bundle
3. **Preview Frame** — sandboxed iframe with ThemeProvider, dynamic bundle import
4. **postMessage Bridge** — typed protocol: `SET_THEME`, `SET_VIEWPORT`, `LOAD_BUNDLE`, `TEXT_OVERRIDE`, `COMPONENT_TREE`, `NODE_SELECTED`, `RENDER_ERROR`
5. **Toolbar** — breakpoint selector, dark/light toggle, share button
6. **Inspector Panel** — AST-derived component tree, prop viewer
7. **Text Edit Panel** — text node list, override map, save to DB
8. **Prototype List + Status Management** — gallery, search, status transitions
9. **Share Token System** — token generation, viewer-mode route

### Critical Pitfalls

1. **Rendering without iframe isolation** — Executing Claude Code JSX in the main window context enables XSS via shared prototype links, session token theft, and React state corruption. Use `<iframe sandbox="allow-scripts">` from day one. Cannot be retrofitted.

2. **ThemeProvider not in the sandbox** — If MUI ThemeProvider is only in the shell, the prototype renders with wrong fonts, wrong colors, and dark/light mode never works in the preview. Initialize ThemeProvider inside the sandbox entry point in Phase 1.

3. **Runtime fiber introspection for inspector** — Using `__REACT_DEVTOOLS_GLOBAL_HOOK__` or `_reactFiber` DOM properties for the inspector panel breaks across React versions, is inaccessible inside iframes, and produces DOM-shaped rather than React-component-shaped trees. Use Babel AST parse at source analysis time instead.

4. **Text edits overwrite on source update** — If text overrides are stored as mutations to the source file, copywriters lose all their work when designers push a new prototype version. Store overrides as a separate `text_overrides` table keyed by `prototypeId + componentPath + propName`.

5. **Share link access control gap** — Unguessable UUIDs feel secure but get indexed by browser history sync, corporate proxies, and accidentally pasted into public channels. Add `is_public`, `expires_at`, and revocation to the share link data model in Phase 1 even if the UI isn't built until Phase 2.

---

## Implications for Roadmap

Based on combined research, the architecture's dependency graph maps cleanly onto phases. The rendering foundation is a hard prerequisite for all other features. The build order from ARCHITECTURE.md is reliable and should be followed.

### Phase 1: Rendering Foundation & Core Infrastructure

**Rationale:** Everything else depends on being able to render a MUI prototype safely. This phase addresses all four critical security/architecture pitfalls before any feature work. Build this wrong and you rewrite it.

**Delivers:**
- Sandboxed iframe preview renderer with ThemeProvider inside the sandbox
- esbuild API route for server-side JSX bundling
- postMessage bridge with typed protocol
- SQLite schema with `prototypes` and `text_overrides` tables
- Error boundary with parse error vs render error distinction
- Claude Code output normalization layer (handles default export variance)
- Basic prototype load from local filesystem (`PROTOTYPES_DIR` env var)

**Addresses features:** Live component rendering, error boundary, dark/light mode toggle
**Avoids pitfalls:** Pitfall 1 (isolation), Pitfall 3 (ThemeProvider), Pitfall 2 (normalization), Pitfall 8 (share link data model), Pitfall 7 (text_overrides schema)

**Research flag:** NEEDS PHASE RESEARCH — esbuild + Next.js 15 App Router integration specifics (API route streaming, `external` vs bundled React/MUI in esbuild, importmap approach for shared modules). The `external` vs bundled decision significantly affects bundle size (400KB per prototype if bundled vs once if importmap).

---

### Phase 2: Developer & Designer Core Experience

**Rationale:** With a working renderer, build the features developers and designers need for the tool to replace their current workflow. Inspector and responsive preview are the developer's primary value; dark/light and viewport are the designer's primary need.

**Delivers:**
- AST-based component tree inspector (Babel parse of source, not fiber introspection)
- Prop inspector panel (show source-level prop values)
- Responsive breakpoint switcher (actual iframe width change, not CSS scaling)
- Copy-to-clipboard MUI import statement
- Share token generation and viewer-mode route (`/share/[token]`)
- `is_public` + `expires_at` + revocation on share links

**Addresses features:** Component tree inspector, prop inspector, responsive preview, shareable link
**Avoids pitfalls:** Pitfall 6 (fiber introspection), Pitfall 10 (CSS scaling for responsive), Pitfall 8 (share access control)

**Research flag:** STANDARD PATTERNS — Babel AST parsing, iframe width control, nanoid share tokens. Skip research-phase; documented patterns.

---

### Phase 3: Copywriter & Status Workflow

**Rationale:** With developers and designers served, add the copywriter workflow and the status system that enables team coordination. Text editing depends on AST analysis from Phase 2. Status workflow gates share links.

**Delivers:**
- Text Edit Panel with inline text override UI (Copywriter view)
- Text overrides stored in separate DB table, keyed by component path
- Stale override detection when source is updated
- Status workflow (draft → review → approved) enforced at API layer, not just UI
- Status badge on prototype list and share link
- Draft watermark banner for non-approved shared prototypes

**Addresses features:** Inline text editing, status workflow, role-based view (Copywriter mode)
**Avoids pitfalls:** Pitfall 7 (text override integrity), Pitfall 12 (status not enforced at data layer)

**Research flag:** STANDARD PATTERNS — React state management for text overrides, status state machine. Skip research-phase.

---

### Phase 4: Prototype Gallery & List Management

**Rationale:** Operational management features. By Phase 4, enough prototypes exist that list UX matters. Static thumbnails (not live renders) are critical to list page performance.

**Delivers:**
- Prototype gallery/list with name, status badge, static thumbnail
- Search and filter by name, status, date
- Prototype metadata (generation timestamp, file path, Claude Code provenance)
- Static thumbnail generation on save (screenshot, not live render)

**Addresses features:** Prototype list/gallery, search/filter, Claude Code integration hints
**Avoids pitfalls:** Pitfall 15 (live thumbnails on list page)

**Research flag:** STANDARD PATTERNS — CRUD list UI, SQLite queries, screenshot generation. Skip research-phase.

---

### Phase 5: Power User Experience & Role Views

**Rationale:** Polish and differentiation. Build on the stable foundation to add the features that make the tool distinctly better than Storybook for this team's workflow.

**Delivers:**
- Full role-based view switching (Designer / Copywriter / Developer panels)
- Keyboard shortcut navigation map
- MUI theme preview (default theme + custom token JSON input)
- Status-gated sharing with viewer context banner

**Addresses features:** Role-based view switching, keyboard shortcuts, MUI theme preview, status-gated sharing
**Defers to v2:** Multi-screen navigation, annotation layer with MUI docs links, prototype versioning

**Research flag:** NEEDS PHASE RESEARCH — MUI theme serialization and postMessage to sandbox (JSON-serializable subset of createTheme options). Custom token JSON schema needs specification.

---

### Phase Ordering Rationale

- **API and bundler before any UI panels** — Inspector, Text Edit, and Toolbar all depend on a working postMessage bridge to the Preview Frame. Build the bridge before building what uses it.
- **Security architecture in Phase 1, not later** — Sandboxing and ThemeProvider placement cannot be retrofitted without a full rewrite of the rendering layer. This is the lesson from the Storybook and CodeSandbox architectures.
- **AST analysis in Phase 2 unlocks Phase 3** — The same AST-parse pipeline that drives the Inspector Panel (Phase 2) also identifies text nodes for the Copywriter panel (Phase 3). Build it once.
- **List management last** — Pure CRUD with no technical risk. Build after core rendering is stable and the team understands what metadata actually matters.
- **Role views last** — Requires all panels to exist before they can be toggled. Role switching is a presentation concern on top of working features.

### Research Flags

**Needs phase research before implementation:**
- **Phase 1:** esbuild + Next.js 15 App Router API route integration; `external` vs bundled MUI decision; importmap browser support for shared module delivery
- **Phase 5:** MUI theme JSON serialization for postMessage; custom design token schema definition

**Standard patterns — skip research-phase:**
- **Phase 2:** Babel AST parsing (well-documented), iframe width control, nanoid tokens
- **Phase 3:** Text override state management, status state machine (straightforward CRUD + enum transitions)
- **Phase 4:** List/search UI, SQLite queries, screenshot generation

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices (Next.js, MUI, SQLite+Drizzle, Zustand, TanStack Query) are HIGH confidence — standard 2025 patterns. esbuild+Next.js API route integration is MEDIUM — sound pattern, needs implementation verification. React fiber hook approach noted in STACK.md is now superseded by ARCHITECTURE.md's AST recommendation. |
| Features | MEDIUM-HIGH | Table stakes are HIGH — universal patterns across Storybook, Figma, Zeplin. Differentiators are MEDIUM — project-specific, not externally verified. Anti-features are HIGH — directly supported by PROJECT.md scope decisions. |
| Architecture | MEDIUM-HIGH | iframe isolation, postMessage bridge, server-side esbuild are HIGH confidence (stable, established patterns). AST-based inspector vs fiber introspection recommendation is HIGH confidence (widely documented limitation). Specific Next.js 15 App Router API route details are MEDIUM — verify during implementation. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (sandbox isolation, ThemeProvider, fiber fragility) are HIGH — multiple consistent sources. Moderate/minor pitfalls are MEDIUM — well-reasoned but fewer direct sources. |

**Overall confidence:** MEDIUM — The architectural approach is sound and based on established patterns. The main uncertainties are implementation-level details in the esbuild+Next.js integration that require Phase 1 verification.

### Gaps to Address

- **esbuild `external` vs importmap decision:** Affects every prototype's load time. If React/MUI are bundled per-prototype, each preview loads ~400KB. If shared via importmap, they load once. Importmap is supported in all modern browsers since 2023 but requires the preview frame to pre-load these as globals. Resolve in Phase 1 research before implementation.

- **MUI theme serialization scope:** MUI's `createTheme` accepts functions (e.g., for `components` overrides). Not all theme options are JSON-serializable. The postMessage-based theme passing needs to define which theme properties are in scope. Resolve in Phase 5 research.

- **Claude Code output normalization test corpus:** The normalization layer (handling `export default function App()` vs `const App = () =>` vs unnamed defaults) should be driven by a real sample of Claude Code outputs. Collect these during Phase 1 development, not before.

- **Static thumbnail generation approach:** PITFALLS.md correctly flags live renders on the list page as a performance problem. The chosen approach (static screenshot on save) needs a library decision (Playwright headless screenshot? Canvas? SSR to image?). Flag for Phase 4 planning.

- **Version verification:** All package versions are from training data (cutoff August 2025). Run `npm outdated` after initial install and resolve major version mismatches before beginning development.

---

## Sources

### Primary (HIGH confidence)
- Storybook architecture (manager/preview split, postMessage channel) — iframe isolation, bridge patterns
- esbuild Node.js API documentation — bundling pipeline, `external` config, `write: false` mode
- MUI ThemeProvider cascade behavior — theme isolation requirements, CssBaseline scope
- iframe `sandbox` attribute — MDN Web Docs web standard — sandboxing approach
- React fiber introspection fragility — widely documented limitation, multiple community sources
- AST-based inspection pattern — used by Storybook's react-docgen, Storybook Controls addon

### Secondary (MEDIUM confidence)
- Sandpack (CodeSandbox) architecture — module resolution patterns, browser bundling approach
- React Cosmos isolation patterns — component sandboxing approach
- `__REACT_DEVTOOLS_GLOBAL_HOOK__` stability in React 18/19 — undocumented but observed stable
- Babel standalone performance characteristics — community experience, not official benchmarks

### Tertiary (training data, verify before use)
- Next.js 15 App Router API route specifics — verify current docs before Phase 1 implementation
- Package versions (next@15, react@19, @mui/material@6, drizzle-orm@0.36, zustand@5, esbuild@0.24, nanoid@5, vitest@2) — verify all at https://npmjs.com before installing

---

*Research completed: 2026-02-27*
*Ready for roadmap: yes*
