# Architecture Patterns

**Domain:** Live React component rendering / prototyping tool (MUI-based)
**Researched:** 2026-02-27
**Confidence:** MEDIUM — Based on training data from established tools (Storybook, Sandpack, React Cosmos, Ladle). External verification was unavailable during this session. Core patterns are stable and well-established; confidence in fundamentals is HIGH.

---

## Recommended Architecture

### Overview

The system is a **host-shell + sandboxed-preview** architecture. Two distinct rendering contexts exist: the **App Shell** (the tool UI — sidebar, inspector, controls) and the **Prototype Preview** (the rendered MUI components). These are isolated so the prototype can apply its own MUI theme, dark/light mode, and responsive viewport without polluting or being polluted by the shell.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser Tab                                                     │
│                                                                  │
│  ┌─────────────────┐   ┌──────────────────────────────────────┐ │
│  │   App Shell     │   │         Preview Frame                │ │
│  │  (React SPA)    │   │   (iframe or scoped React root)      │ │
│  │                 │   │                                       │ │
│  │ ┌─────────────┐ │   │  ┌─────────────────────────────────┐ │ │
│  │ │  Prototype  │ │   │  │  ThemeProvider (MUI)            │ │ │
│  │ │  List/Nav   │ │   │  │  ┌───────────────────────────┐  │ │ │
│  │ └─────────────┘ │   │  │  │  Prototype Component(s)   │  │ │ │
│  │                 │   │  │  │  (user-uploaded .tsx/.jsx) │  │ │ │
│  │ ┌─────────────┐ │   │  │  └───────────────────────────┘  │ │ │
│  │ │  Inspector  │◄├───┤  └─────────────────────────────────┘ │ │
│  │ │  Panel      │ │   │                                       │ │
│  │ └─────────────┘ │   │  ┌─────────────────────────────────┐ │ │
│  │                 │   │  │  postMessage bridge              │ │ │
│  │ ┌─────────────┐ │   │  │  (component tree, prop values,  │ │ │
│  │ │  Text Edit  │◄├───┤  │   text node selection events)   │ │ │
│  │ │  Panel      │ │   │  └─────────────────────────────────┘ │ │
│  │ └─────────────┘ │   └──────────────────────────────────────┘ │
│  │                 │                                             │
│  │ ┌─────────────┐ │                                             │
│  │ │  Toolbar    │ │                                             │
│  │ │ (breakpoint,│ │                                             │
│  │ │  dark/light)│ │                                             │
│  │ └─────────────┘ │                                             │
│  └─────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘

         ▲                          ▲
         │                          │
   ┌─────┴──────┐           ┌───────┴──────┐
   │  Backend   │           │  Module      │
   │  API       │           │  Bundler /   │
   │  (storage, │           │  Evaluator   │
   │  sharing,  │           │  (Vite/      │
   │  status)   │           │  esbuild)    │
   └────────────┘           └──────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **App Shell** | Top-level React SPA. Layout, routing, state orchestration. | All other shell components, Backend API, Preview Frame via postMessage |
| **Prototype List** | Browse, search, filter prototypes. Shows title, status, thumbnail. | Backend API (fetch list), App Shell router |
| **Toolbar** | Breakpoint selector (xs/sm/md/lg/xl), dark/light toggle, share button, status badge. | App Shell state, Preview Frame (sends viewport/theme commands via postMessage) |
| **Preview Frame** | Sandboxed iframe (or scoped root) that renders the actual MUI prototype. Owns ThemeProvider, CssBaseline, viewport sizing. | Module Bundler/Evaluator (receives compiled component code), App Shell via postMessage |
| **Module Bundler / Evaluator** | Transforms uploaded .tsx/.jsx files into executable browser modules. Resolves MUI imports. Produces a runnable component bundle. | Preview Frame (delivers bundle), Backend API (fetches source files) |
| **Inspector Panel** | Displays component tree (fiber-derived or static-analysis-derived), shows props of selected node. Read-only in v1. | Preview Frame via postMessage (receives tree snapshot on render), App Shell state |
| **Text Edit Panel** | Lists all text nodes in the rendered prototype. Allows inline text replacement. Sends override map to Preview Frame. | Preview Frame via postMessage (bidirectional: receives text nodes, sends overrides) |
| **Backend API** | Stores prototype source files, metadata, status transitions, text overrides. Generates and resolves share tokens. | All shell components, file storage (local FS or object storage) |
| **Share Token Resolver** | On share URL load: fetches prototype by token, renders in read-only mode for non-authenticated viewers. | Backend API, App Shell router |

---

## Data Flow

### 1. Upload / Create Flow

```
Designer uploads .tsx/.jsx files
        │
        ▼
Backend API — stores raw source, creates prototype record (draft status)
        │
        ▼
Module Bundler/Evaluator — transpiles source, resolves MUI + React imports
        │
        ▼
Preview Frame — receives compiled bundle, mounts ThemeProvider + component
        │
        ▼
Preview Frame — after mount: extracts component tree + text nodes via React DevTools fiber hook
        │   (postMessage)
        ▼
App Shell — distributes tree to Inspector Panel, text nodes to Text Edit Panel
```

### 2. Toolbar Interaction Flow

```
User clicks breakpoint / dark toggle in Toolbar
        │ (in-memory App Shell state update)
        ▼
Toolbar sends postMessage to Preview Frame: { type: 'SET_VIEWPORT', width: 900 }
                                             { type: 'SET_THEME', mode: 'dark' }
        │
        ▼
Preview Frame — resizes iframe container width, updates MUI ThemeProvider mode
        │
        ▼
(No re-render of shell needed — all visual change is inside Preview Frame)
```

### 3. Text Edit Flow

```
Copywriter edits text in Text Edit Panel
        │ (optimistic local state)
        ▼
App Shell sends postMessage to Preview Frame: { type: 'TEXT_OVERRIDE', nodeId: '...', value: 'New text' }
        │
        ▼
Preview Frame — applies override to component's text node (React state injection or DOM mutation)
        │
        ▼
User saves → Backend API persists override map keyed by prototypeId + nodeId
```

### 4. Inspector Selection Flow

```
User clicks component in Preview Frame
        │ (Preview Frame click handler)
        ▼
Preview Frame sends postMessage: { type: 'NODE_SELECTED', nodeId: '...', props: {...}, componentName: '...' }
        │
        ▼
Inspector Panel — highlights node in tree, shows props detail view
```

### 5. Share Flow

```
User clicks Share in Toolbar
        │
        ▼
Backend API — generates short token (UUID or slug), stores prototypeId → token mapping
        │
        ▼
App Shell — displays share URL: https://tool.internal/share/{token}
        │
        ▼
Recipient opens URL → Share Token Resolver fetches prototype by token
        │
        ▼
App Shell renders in "viewer mode": Preview Frame + Inspector Panel visible, no upload/edit controls
```

---

## Patterns to Follow

### Pattern 1: iframe Isolation for Preview

**What:** Render the prototype inside an `<iframe>` with `srcdoc` or a dedicated `/preview` route. The iframe has its own React root, its own MUI ThemeProvider, and its own CSS scope.

**When:** Always. This is the foundational isolation pattern used by Storybook, Ladle, and React Cosmos.

**Why:** Prevents MUI theme from leaking into shell, prevents shell CSS from breaking prototype layout, allows viewport resize without affecting shell, allows independent dark/light mode.

**Example:**
```tsx
// Shell side
<iframe
  ref={iframeRef}
  src="/preview-frame"
  style={{ width: viewportWidth, border: 'none', height: '100%' }}
  sandbox="allow-scripts allow-same-origin"
/>

// /preview-frame route (separate entry point)
function PreviewRoot() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    window.addEventListener('message', (e) => {
      if (e.data.type === 'SET_THEME') setThemeMode(e.data.mode);
      if (e.data.type === 'LOAD_COMPONENT') setComponent(/* eval bundle */);
    });
  }, []);

  return (
    <ThemeProvider theme={createTheme({ palette: { mode: themeMode } })}>
      <CssBaseline />
      {Component && <Component />}
    </ThemeProvider>
  );
}
```

---

### Pattern 2: postMessage Bridge for Shell ↔ Preview Communication

**What:** All cross-frame communication goes through `window.postMessage` / `addEventListener('message')`. Define a typed message protocol.

**When:** Any time shell needs to control preview (theme, viewport, text overrides) or preview needs to inform shell (component tree, selection events).

**Example message protocol:**
```typescript
type ShellToPreview =
  | { type: 'SET_THEME'; mode: 'light' | 'dark' }
  | { type: 'SET_VIEWPORT'; width: number }
  | { type: 'LOAD_BUNDLE'; code: string }
  | { type: 'TEXT_OVERRIDE'; nodeId: string; value: string };

type PreviewToShell =
  | { type: 'COMPONENT_TREE'; tree: ComponentNode[] }
  | { type: 'TEXT_NODES'; nodes: TextNode[] }
  | { type: 'NODE_SELECTED'; nodeId: string; props: Record<string, unknown>; componentName: string }
  | { type: 'RENDER_ERROR'; message: string };
```

---

### Pattern 3: Static Analysis for Component Tree (Preferred over Fiber Introspection)

**What:** Parse the uploaded .tsx files with a TypeScript/Babel AST parser at upload time to extract the component tree structure and prop types. Store this as a JSON artifact alongside the source.

**When:** For the Inspector Panel display. Prefer this over runtime fiber introspection.

**Why:** Fiber introspection requires hooking into React DevTools internals (`__REACT_DEVTOOLS_GLOBAL_HOOK__`), which is fragile, version-dependent, and harder to implement. Static AST analysis is deterministic and can run server-side or in a worker.

**Tradeoff:** Static analysis misses dynamic/conditional component rendering. For v1 this is acceptable. Document as known limitation.

---

### Pattern 4: Module Evaluation via Dynamic Import + Blob URLs

**What:** Transpile uploaded .tsx with esbuild-wasm (in-browser) or server-side esbuild. Bundle with MUI and React as externals (pre-loaded in preview frame). Deliver compiled JS as a Blob URL or inline script, then `import()` it dynamically.

**When:** This is the core of the live rendering pipeline.

**Example (server-side transpile, client delivery):**
```typescript
// Server: POST /api/prototypes/:id/bundle
const result = await esbuild.build({
  entryPoints: [sourceFilePath],
  bundle: true,
  external: ['react', 'react-dom', '@mui/*'],
  format: 'esm',
  write: false,
});
// Return result.outputFiles[0].text as bundleCode

// Preview frame: receives bundleCode via postMessage
const blob = new Blob([bundleCode], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
const module = await import(/* @vite-ignore */ url);
setComponent(() => module.default);
URL.revokeObjectURL(url);
```

---

### Pattern 5: Text Override Map

**What:** Maintain a `Map<nodeId, string>` that the Preview Frame applies as a React Context or prop injection layer. Text node IDs are derived from deterministic paths in the component tree (e.g., `Button[0].children`, `Typography[2].children`).

**When:** For the copywriter text editing feature.

**Why:** Avoids mutating source files for temporary text changes. Overrides are stored separately in the DB and merged at render time.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Rendering Prototype in the Same React Root as the Shell

**What:** Mounting the user's prototype component directly inside the shell's React tree (no iframe).

**Why bad:** MUI ThemeProvider cascade — the prototype's theme changes affect shell components. Global CSS from MUI CssBaseline resets shell styles. Dark/light mode state entangles with shell state. Responsive viewport simulation impossible (iframe is the only way to constrain a viewport inside a page).

**Instead:** Always use an iframe with a separate React root.

---

### Anti-Pattern 2: Runtime Fiber Introspection for Component Tree

**What:** Using `__REACT_DEVTOOLS_GLOBAL_HOOK__` or walking `_reactFiber` properties to extract the component tree at runtime.

**Why bad:** React's internal fiber structure is not a public API. It changes between minor versions. It requires complex traversal logic with many edge cases. It is fragile in production builds where components are minified.

**Instead:** Use static AST analysis at upload/bundle time. Accept the tradeoff of missing purely dynamic rendering paths in v1.

---

### Anti-Pattern 3: Storing Compiled Bundles in the Database

**What:** Persisting the esbuild output (compiled JS) as a DB column or blob.

**Why bad:** Compiled output is a derived artifact. It becomes stale when MUI or React versions change. It inflates DB size. It creates cache invalidation complexity.

**Instead:** Store only source files. Re-bundle on demand (or cache in a short-lived server-side cache keyed by sourceHash).

---

### Anti-Pattern 4: Allowing Arbitrary Code Execution Without Sandboxing

**What:** Evaluating user-uploaded JS/TSX with `eval()` or `new Function()` in the main window context.

**Why bad:** The uploaded files come from Claude Code sessions, but they could contain errors or unexpected global side effects. Running in the main window context risks corrupting shell state, triggering navigation, or accessing shell-level APIs.

**Instead:** Confine execution to the iframe. The iframe's `sandbox` attribute limits capabilities. Use Content Security Policy headers on the preview route.

---

## Scalability Considerations

| Concern | At 10 prototypes | At 100 prototypes | At 1000+ prototypes |
|---------|-----------------|-------------------|---------------------|
| Bundling | Bundle on every load, acceptable | Add server-side bundle cache keyed by sourceHash | Queue-based bundling worker, CDN-cached bundles |
| Storage | Local filesystem or SQLite | SQLite + local FS, or Postgres + local FS | Postgres + object storage (S3-compatible) |
| Share links | Simple UUID-to-prototypeId table | Same | Add expiry, access control |
| Preview cold start | esbuild fast enough to feel instant | Same | Pre-warm bundles on status change to "review" |

---

## Suggested Build Order

Dependencies flow bottom-up. Build foundational pieces before dependent UI.

```
1. Backend API (storage, prototype CRUD)
        │
        ▼
2. Module Bundler / Evaluator (esbuild pipeline, source → bundle)
        │
        ▼
3. Preview Frame (iframe shell, ThemeProvider, dynamic import of bundle)
        │
        ▼
4. postMessage Bridge (typed protocol, Shell ↔ Preview)
        │
        ├──────────────────┬─────────────────────┐
        ▼                  ▼                     ▼
5. Toolbar            6. Inspector Panel    7. Text Edit Panel
   (viewport,            (component tree       (text node list,
   dark/light)           from static analysis)  override map)
        │
        ▼
8. Prototype List + Status Management
        │
        ▼
9. Share Token System
```

**Rationale for this order:**

- **API before UI**: All panels depend on having stored prototypes. Build storage first.
- **Bundler before Preview**: Preview Frame can't render without a working bundle. Bundler is the hardest technical risk — validate it early.
- **Preview Frame before panels**: Inspector, Text Edit, and Toolbar all communicate with the Preview Frame via postMessage. The frame must exist and respond before these panels can be developed.
- **Toolbar is simple but depends on postMessage**: Implement after the bridge is established.
- **Inspector Panel before Text Edit Panel**: Static analysis (for Inspector) is a prerequisite dependency. Text editing only needs text node extraction, which is simpler but builds on the same analysis pipeline.
- **List and Status last**: Pure CRUD UI with no technical risk. Implement after core rendering works.
- **Share last**: Share is a read-only view of the preview — it reuses all earlier components. Zero new technical risk.

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| iframe isolation over same-root rendering | Theme isolation, viewport simulation, CSS scope — non-negotiable for correctness |
| postMessage typed protocol over direct DOM refs | Cross-frame communication requires it; typed protocol prevents protocol drift |
| Server-side esbuild over in-browser esbuild-wasm | Simpler DX, no WASM download in browser, easier to cache server-side |
| Static AST analysis over fiber introspection | Deterministic, version-stable, runs at upload time not render time |
| Text overrides as separate data (not source mutation) | Source integrity preserved; overrides are reversible; enables copywriter/dev workflow separation |
| Separate preview entry point (/preview-frame route) | Cleaner isolation; preview can have its own HTML template with MUI imports pre-loaded |

---

## Sources

- Storybook architecture (manager/preview split, postMessage channel): training data, HIGH confidence (stable architecture unchanged for years)
- Sandpack (CodeSandbox) bundler-in-browser pattern: training data, MEDIUM confidence
- React Cosmos isolation patterns: training data, MEDIUM confidence
- esbuild Node.js API for server-side bundling: training data, HIGH confidence (stable API)
- MUI ThemeProvider cascade behavior: training data, HIGH confidence (core MUI design)
- React fiber introspection fragility: training data, HIGH confidence (widely documented limitation)

**Note:** External web access was unavailable during this research session. All findings are from training data (cutoff August 2025). The architectural patterns described (iframe isolation, postMessage bridge, esbuild bundling) are stable, well-established patterns in the React tooling ecosystem with HIGH confidence. The specific implementation details (esbuild API signatures, postMessage event structure) should be verified against current documentation during implementation.
