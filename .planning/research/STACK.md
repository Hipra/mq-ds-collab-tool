# Technology Stack

**Project:** MQ DS Collab Tool — MUI Prototyping & Collaboration Webapp
**Researched:** 2026-02-27
**Overall confidence:** MEDIUM (versions from training data, Aug 2025 cutoff — verify before installing)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack framework | API routes + React frontend in one repo. Server-side file reading for .jsx prototypes. No need for separate backend. App Router gives server components for fast initial loads. |
| React | 19.x | UI runtime | Required by Next.js 15 and MUI v6. Concurrent features beneficial for live preview rendering. |
| TypeScript | 5.x | Type safety | Catches prop-shape bugs in inspector panels. Required for Prisma/Drizzle generated types. |

**Why Next.js over Vite SPA:** This tool needs a backend — reading .jsx files from disk, storing prototype metadata, generating shareable links. Next.js collocates API routes with the frontend, avoiding a separate Express/Fastify server. SSR is irrelevant (internal tool, no SEO), but server components reduce client bundle size. App Router is the current standard as of 2025.

**Why not Remix:** Similar capability, but smaller ecosystem, fewer MUI integration examples, no clear advantage for this use case.

### UI / Component Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MUI Material UI | 6.x | App UI AND prototype rendering | The prototypes are built with MUI; the app shell must also use MUI to share the same theme context. Using a different UI lib for the app would create two competing theme systems. |
| @mui/icons-material | 6.x | Icon set | Paired with MUI. Icons needed for toolbar, inspector, status indicators. |
| @emotion/react | 11.x | CSS-in-JS engine | MUI's default styling engine. Required peer dependency. |
| @emotion/styled | 11.x | Styled components API | Required by MUI for `styled()` usage. |

**Why MUI for the app shell too:** The generated prototypes import from `@mui/material`. When the preview iframe shares the same bundle context (or when using server-side compilation), having one consistent MUI version avoids version conflicts. App shell using MUI also means designers see real MUI components in both the tool and the prototype.

### Live Prototype Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| esbuild | 0.24.x | Server-side JSX bundling | Fastest bundler available. Bundles Claude Code-generated .jsx files on the server (Node.js API). Output is a standalone JS bundle served to the preview iframe. Sub-100ms rebuild on file change. |
| iframe (native) | — | Prototype isolation | The preview runs in a sandboxed iframe. Isolates prototype styles, event handlers, and React tree from the app shell. No npm package needed — just a `<iframe src="/preview/[id]">`. |
| esbuild Node.js API | — | Programmatic bundling | Used in Next.js API route to compile prototype on demand. `esbuild.build()` with `bundle: true` targets the iframe HTML entry point. |

**Architecture decision — why server-side bundling over client-side:**

Option A (rejected): **Sandpack** (CodeSandbox in-browser bundler) — runs npm resolution in the browser via a CDN worker. Powerful but adds ~500KB to client bundle, requires internet access to npm CDN, and is optimized for "user types code" workflows, not "files on disk" workflows. Overkill for controlled Claude Code output.

Option B (rejected): **react-live** — simple eval-based renderer for single-component snippets. Cannot handle multi-file prototypes with imports, routing, or MUI's complex import tree.

Option C (rejected): **@babel/standalone** — client-side JSX transform. Same multi-file limitation as react-live. Too slow for MUI's large import surface.

Option D (chosen): **esbuild on Next.js API route** — Claude Code writes .jsx files to a known directory. A Next.js route (`/api/preview/[id]/bundle.js`) runs esbuild at request time, bundles the entry file with all its imports, and returns a JS bundle. The iframe loads an HTML shell that includes this bundle. Fast (esbuild), reliable (same bundler as Vite), controllable (server-side).

**CONFIDENCE: MEDIUM** — esbuild's Node.js API is stable and well-documented. The iframe-based isolation pattern is standard (used by CodeSandbox, StackBlitz, JSFiddle). However, the specific integration with Next.js 15 App Router API routes should be verified during implementation.

### Component Inspector

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom `postMessage` bridge | — | iframe ↔ app shell communication | The inspector panel lives in the app shell; the React tree lives in the iframe. `window.postMessage` is the standard cross-frame communication API. |
| `__REACT_DEVTOOLS_GLOBAL_HOOK__` | — | React fiber tree access | React exposes its internal fiber tree via this global hook. The preview iframe's bundle injects a lightweight collector that traverses the fiber tree and posts component data to the parent frame. No external library needed. |

**Why not react-devtools-core:** The `react-devtools-core` package (the embedable DevTools) is designed for integration in Electron apps and native debuggers. It requires a WebSocket backend and has a heavy setup overhead. For a read-only inspector showing component name + props, a 50-line fiber walker is sufficient.

**What the inspector needs to do (from PROJECT.md):**
- Show component tree (names, hierarchy)
- Show props for selected component
- Support text prop editing (for copywriter view)

The fiber walker approach covers all three. Text editing is done by sending a `patchProp` message back to the iframe, which the runtime applies via React state.

**CONFIDENCE: MEDIUM** — The `__REACT_DEVTOOLS_GLOBAL_HOOK__` approach is undocumented but stable (used by browser devtools extensions, react-scan, and react-cosmos). It changed significantly in React 18 and stabilized. React 19 maintains the same hook shape. Flag for verification during Phase implementation.

### Database & Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQLite (via better-sqlite3) | 3.x | Prototype metadata, status, links | Internal tool with single-server deployment. No distributed queries needed. Zero infrastructure overhead — just a file. SQLite handles hundreds of concurrent readers fine for an internal team tool. |
| Drizzle ORM | 0.36.x | Type-safe database access | Lightweight, TypeScript-first, excellent SQLite support, generates migration SQL files (no migration runner needed for simple schemas). Faster setup than Prisma for small projects. |

**Why SQLite over PostgreSQL:** This is an internal tool for a small team (designers, copywriters, developers). PostgreSQL requires a running server, backup strategy, and connection pooling. SQLite is a file — back it up with `cp`. For v1 validation, SQLite is the right call. The schema is simple: prototypes table (id, name, status, file_path, created_at, share_token) and that's roughly it.

**Why Drizzle over Prisma:** Prisma's migration engine and query client are heavier than needed. Drizzle produces raw SQL queries (predictable, debuggable), has zero runtime overhead, and SQLite support is first-class. Prisma's advantage (schema introspection, Prisma Studio) is less valuable for a 2-table schema.

**Why not a JSON file store:** Concurrent writes (two team members approving prototypes simultaneously) need atomicity. SQLite provides ACID guarantees. A JSON file does not.

**CONFIDENCE: HIGH** — SQLite + Drizzle is a well-established pattern in the Next.js ecosystem as of 2025. Both libraries are stable.

### File Storage (Prototype Source Files)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Local filesystem (Node.js `fs`) | — | Store Claude Code-generated .jsx files | Claude Code writes files locally. The simplest v1 approach is to read from the same directory structure Claude Code writes to. No cloud storage needed in v1. |
| Configurable base path via env var | — | Allow different environments | `PROTOTYPES_DIR` env var pointing to where Claude Code outputs files. |

**Why not S3/cloud storage in v1:** Claude Code writes to local filesystem. Adding an upload step adds friction to the core workflow. The PROJECT.md explicitly defers deployment decisions — local filesystem is the correct v1 choice.

### Shareable Links

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| nanoid | 5.x | Share token generation | URL-safe, collision-resistant short IDs (e.g., `abc123xy`). No dependency on UUID format. Widely used for this exact use case. |
| Next.js dynamic routes | — | `/share/[token]` page | App Router dynamic route serves the shared prototype view without auth. No external service needed. |

**CONFIDENCE: HIGH** — nanoid is the de-facto standard for this pattern. Next.js dynamic routes are stable.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | App-level UI state | Inspector panel open/closed, selected component, active viewport size, current prototype, dark/light mode. Zustand is lighter than Redux, simpler than Jotai for cross-component state. No server state here — that's handled by React Query. |
| TanStack Query (React Query) | 5.x | Server state / data fetching | Prototype list, prototype metadata, status updates. Handles caching, refetching, optimistic updates. Works natively with Next.js App Router. |

**Why not React Context for state:** Inspector state involves frequent updates (hover = highlight component). Context re-renders entire subtree. Zustand is selector-based — only components that subscribe to `selectedComponent` re-render.

**Why not Next.js server actions for everything:** Server actions are excellent for mutations (update status, save text edits). But the inspector panel needs fast local state (component selection, hover states) that is never persisted. Mixing server actions for everything would add unnecessary roundtrips for UI-only state.

**CONFIDENCE: HIGH** — Zustand 5 + TanStack Query 5 is a standard pairing in 2025 Next.js projects.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MUI `sx` prop + `styled()` | — | All app shell styles | Since MUI is already in the stack, using its styling system avoids adding Tailwind or CSS modules alongside Emotion. Consistent with how the generated prototypes are styled. |
| MUI theme provider | — | Dark/light mode, future custom tokens | Single `ThemeProvider` wrapping both the app shell and the preview iframe's context. Dark/light toggle updates the theme object, affecting both shell and prototype. |

**Why not Tailwind CSS:** The generated prototypes use MUI's `sx` prop and `styled()`. The app shell using Tailwind would create a jarring inconsistency. Also, Tailwind utility classes in the app shell would not benefit from the shared MUI theme (design tokens, spacing scale, color palette).

**CONFIDENCE: HIGH** — MUI's styling system is well-established and appropriate here.

### Development Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite (for iframe preview bundle) | 6.x | Dev-time preview bundling | In development, use Vite's dev server for hot-reload of the preview iframe content. In production, use esbuild API for on-demand bundling. This gives HMR in dev without sacrificing production simplicity. |
| ESLint | 9.x (flat config) | Linting | Standard. Use `eslint-config-next` for Next.js rules. |
| Prettier | 3.x | Formatting | Standard. |
| Vitest | 2.x | Unit testing | Vite-native test runner. Faster than Jest for TypeScript. Used for testing the fiber walker, share token generation, and status workflow logic. |

**Why not Jest:** Vitest is the 2025 standard for Vite/Next.js projects. Same API as Jest, zero config, faster transforms.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Vite + React SPA + Express | Two repos, two deploy targets, more boilerplate for file system access |
| Framework | Next.js 15 | Remix | Smaller ecosystem, fewer MUI examples, no clear advantage |
| Live rendering | esbuild server-side | Sandpack | Heavy client bundle, CDN dependency, optimized for interactive editors not file-based workflows |
| Live rendering | esbuild server-side | react-live | Cannot handle multi-file imports or MUI's complex module tree |
| Live rendering | esbuild server-side | @babel/standalone | Too slow, same multi-file limitation |
| Database | SQLite + Drizzle | PostgreSQL + Prisma | Infrastructure overhead not justified for internal single-server tool |
| Database | SQLite + Drizzle | JSON files | No ACID guarantees for concurrent writes |
| State | Zustand | Redux Toolkit | Excessive boilerplate for this scope |
| State | Zustand | Jotai | Atom-per-value model is less ergonomic for inspector tree state |
| Styling | MUI only | Tailwind CSS | Conflicts with prototype's MUI styling, breaks shared theme |
| Inspector | Custom fiber walker | react-devtools-core | Designed for Electron/native, requires WebSocket backend, heavy for read-only use |

---

## Installation

```bash
# Create Next.js app
npx create-next-app@latest mq-ds-collab-tool \
  --typescript --eslint --app --src-dir \
  --tailwind=false --import-alias="@/*"

# Core MUI
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Database
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# State / Data fetching
npm install zustand @tanstack/react-query

# Utilities
npm install nanoid

# Bundling (preview)
npm install esbuild

# Dev
npm install -D vitest @vitejs/plugin-react
```

---

## Version Confidence Notes

**IMPORTANT:** The following versions are from training data (August 2025 cutoff). Verify all versions before starting development.

| Package | Training-Data Version | Verify With |
|---------|----------------------|-------------|
| `next` | 15.x | https://nextjs.org/blog |
| `react` | 19.x | https://react.dev/blog |
| `@mui/material` | 6.x | https://mui.com/versions/ |
| `drizzle-orm` | 0.36.x | https://github.com/drizzle-team/drizzle-orm/releases |
| `zustand` | 5.x | https://github.com/pmndrs/zustand/releases |
| `@tanstack/react-query` | 5.x | https://tanstack.com/query/latest |
| `esbuild` | 0.24.x | https://github.com/evanw/esbuild/releases |
| `nanoid` | 5.x | https://github.com/ai/nanoid/releases |
| `vitest` | 2.x | https://vitest.dev/blog |

Run `npm outdated` after install and resolve any major version mismatches.

---

## Critical Integration: esbuild + Next.js App Router

The live preview architecture is the most novel part of this stack. The integration works as follows:

```
Claude Code writes:  /prototypes/[id]/index.jsx
                              ↓
Next.js API route:   GET /api/preview/[id]/bundle
                     → reads file from PROTOTYPES_DIR
                     → runs esbuild.build({ entryPoints, bundle: true, format: 'esm' })
                     → returns JS bundle as text/javascript
                              ↓
Preview page:        /preview/[id]
                     → serves HTML shell
                     → <script type="module" src="/api/preview/[id]/bundle"></script>
                              ↓
App shell iframe:    <iframe src="/preview/[id]?token=...">
```

This pattern is well-established (it's how JSFiddle and similar tools work at their core) but requires careful handling of:
- MUI being bundled into each prototype bundle (or served as external/shared)
- esbuild `external` config to avoid re-bundling React/MUI when they're already on the page
- Content Security Policy headers for the iframe

**Flag for Phase research:** The `external` vs `bundled` React/MUI decision in esbuild significantly affects bundle size and load time. If React/MUI are bundled per-prototype, each preview loads ~400KB. If served as shared modules via importmap, they're loaded once. The importmap approach requires modern browser support (available since 2023 in all major browsers). Recommend Phase research on this before implementation.

---

## Sources

- Next.js 15 App Router docs: https://nextjs.org/docs (training data, verify current)
- esbuild API docs: https://esbuild.github.io/api/ (training data, verify current)
- MUI v6 installation: https://mui.com/material-ui/getting-started/installation/ (training data, verify current)
- Drizzle ORM SQLite: https://orm.drizzle.team/docs/get-started-sqlite (training data, verify current)
- React DevTools hook (fiber access): https://github.com/facebook/react/tree/main/packages/react-devtools-shared (training data, MEDIUM confidence)
- Zustand 5 docs: https://zustand.docs.pmnd.rs/ (training data, verify current)
- TanStack Query v5: https://tanstack.com/query/v5/docs/framework/react/overview (training data, verify current)
- nanoid: https://github.com/ai/nanoid (training data, HIGH confidence — stable library)

**All sources are training-data based. No live verification was performed due to tool access restrictions in this research session. Verify versions and breaking changes before beginning development.**
