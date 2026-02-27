# Phase 1: Rendering Foundation - Research

**Researched:** 2026-02-27
**Domain:** Live JSX rendering pipeline — esbuild transpilation, iframe sandboxing, MUI ThemeProvider in iframe, dark/light mode toggle, file watching with SSE
**Confidence:** HIGH (core patterns verified against official docs and GitHub issues)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**File loading:**
- Claude Code writes to a fixed project folder (e.g., `/prototypes/`), the webapp watches the folder
- Hot reload: preview refreshes automatically on file save

**Preview experience:**
- Minimal toolbar above preview: prototype name, dark/light toggle, breakpoint switcher
- Loading state: spinner (not skeleton)

**Error display:**
- Retry button alongside error message — on full render failure, allow retry

**Dark/light toggle:**
- Default mode: follows system (prefers-color-scheme)
- Three-state toggle: Light / Dark / System
- Scope: the whole app shell AND the prototype switch together (not just the iframe)
- Persistence: global setting (not per-prototype)

### Claude's Discretion

- File structure convention (single file vs folder per prototype)
- Metadata handling approach
- Preview background style
- Empty state design
- Error detail level and error boundary scope
- Loading spinner appearance

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-01 | Claude Code-generated React/MUI files rendered live in a sandboxed iframe | esbuild build API with stdin + external, iframe srcdoc or dedicated /preview route, React dynamic import via Blob URL |
| REND-02 | Error boundary — broken component does not crash the app, readable error message shown | react-error-boundary package (ErrorBoundary + useErrorBoundary), iframe postMessage RENDER_ERROR protocol |
| REND-03 | Dark/light mode toggle on the prototype (ThemeProvider in sandbox) | MUI v6 useColorScheme + colorSchemes in ThemeProvider inside iframe; postMessage SET_THEME from shell; Emotion CacheProvider with createCache({ container: iframeHead }) |
| THME-01 | MUI default theme applied in sandbox, architecture ready for custom theme JSON loading | ThemeProvider with createTheme({ colorSchemes: { light: true, dark: true } }) inside iframe; architecture supports swapping theme object via postMessage |
</phase_requirements>

---

## Summary

Phase 1 establishes the rendering pipeline: a Next.js API route uses esbuild's build API (stdin mode, `write: false`) to transpile Claude Code-generated JSX on demand, returning a JS bundle. A dedicated preview page (`/preview/[id]`) serves an HTML shell that loads this bundle. The app shell embeds the preview page in a sandboxed `<iframe>`. The MUI `ThemeProvider` lives inside the iframe, not the shell, from day one — this is non-negotiable and cannot be retrofitted.

The dark/light mode implementation uses MUI v6's `useColorScheme` hook and the `colorSchemes` API (with `cssVariables: true`). The three-state toggle (Light / Dark / System) is built on MUI's native support for all three modes. The shell sends theme change commands to the iframe via `postMessage`; the iframe's `ThemeProvider` updates without re-creating its React tree. Emotion styles are injected into the iframe's `<head>` using `@emotion/cache`'s `createCache({ container: iframeDocument.head })`.

File watching uses Node.js `fs.watch` (or chokidar v5 for reliability) in a Next.js Route Handler that streams Server-Sent Events to the browser. When a file changes, the browser client invalidates its preview iframe. This avoids the private Next.js internal API hack used by some older hot-reload patterns.

**Primary recommendation:** Use esbuild `build()` API (not `transform()`) in a Next.js Route Handler with `serverExternalPackages: ['esbuild']` in `next.config.ts` (webpack bundler, NOT turbopack in dev). Mark `react`, `react-dom`, and `@mui/*` as external — serve them via an import map in the iframe HTML using esm.sh CDN URLs. This eliminates the ~400KB React+MUI bundle per prototype load.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| esbuild | 0.24.x | Server-side JSX transpilation | Fastest bundler, stable Node.js API, sub-100ms for single JSX files. Used by Vite under the hood. |
| @mui/material | 6.x | UI components + ThemeProvider in iframe | The prototypes ARE MUI; the renderer must use the same version |
| @emotion/cache | 11.x | Style injection into iframe document.head | Required to make MUI/Emotion styles render inside the iframe |
| react-error-boundary | 5.x | Error boundary component | Simplest correct error boundary implementation; class component handled internally |
| chokidar | 5.x | File watching (cross-platform) | More reliable than `fs.watch` on macOS/Linux; v5 is ESM-only, requires Node 20+ |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | 5.x | Prototype ID generation | Already in stack decision from STACK.md |
| zustand | 5.x | App shell state (current theme mode, active prototype) | Already in stack; drives the three-state toggle |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild build() with external | esbuild transform() | transform() does NOT support the `external` option — must use build() with stdin |
| esbuild build() with external | Full bundle per prototype | Full bundle = ~400KB React+MUI per load; external+importmap = once across all prototypes |
| chokidar v5 | Node.js fs.watch | fs.watch has known reliability issues on macOS (missed events, spurious events); chokidar wraps it with debouncing and fallbacks |
| chokidar v5 + SSE | Next.js Fast Refresh private API | Private Next.js API (`router.reload` via internal devserver hook) is fragile across versions; SSE from a Route Handler is stable public API |
| esm.sh CDN importmap | Bundle React+MUI into each prototype | CDN approach loads React+MUI once (cached); bundle approach repeats ~400KB per prototype. Both work; CDN approach is preferred for dev iteration speed |

**Installation:**
```bash
npm install esbuild @emotion/cache react-error-boundary chokidar nanoid
```

Note: `@mui/material`, `@emotion/react`, `@emotion/styled`, `react`, `react-dom` are already in the stack from the prior decisions.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── preview/
│   │   │   └── [id]/
│   │   │       └── bundle/
│   │   │           └── route.ts      # esbuild transpile endpoint
│   │   └── watch/
│   │       └── route.ts              # SSE file watcher endpoint
│   ├── preview/
│   │   └── [id]/
│   │       └── page.tsx              # iframe HTML shell page
│   └── (shell)/
│       └── page.tsx                  # main app with toolbar + iframe
├── components/
│   ├── PreviewFrame.tsx              # <iframe> wrapper, postMessage bridge
│   ├── PreviewContent.tsx            # runs INSIDE iframe: ThemeProvider, ErrorBoundary, dynamic import
│   ├── Toolbar.tsx                   # dark/light toggle, breakpoint switcher, proto name
│   └── ErrorDisplay.tsx             # readable error message + retry button
└── lib/
    ├── bundler.ts                    # esbuild build() wrapper
    ├── watcher.ts                    # chokidar setup
    └── theme.ts                     # createTheme with colorSchemes: { light: true, dark: true }
```

---

### Pattern 1: esbuild Build API with stdin (Server-Side Transpilation)

**What:** Next.js Route Handler reads the JSX file from disk, passes content as `stdin` to `esbuild.build()`, marks React and MUI as external, returns the JS bundle as `text/javascript`.

**When to use:** Every time the preview iframe requests a fresh bundle (on load, on hot reload).

**Critical finding:** The esbuild `transform()` API does NOT support the `external` option. You MUST use `build()` with `stdin`. [Source: esbuild.github.io/api/#transform — verified 2026-02-27]

**Critical finding:** Next.js (webpack bundler) will attempt to bundle the `esbuild` package itself, breaking its binary path resolution. You MUST add `serverExternalPackages: ['esbuild']` to `next.config.ts`. This is the stable Next.js 15 API (renamed from `serverComponentsExternalPackages` in v14). [Source: nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages — verified 2026-02-27]

**Critical finding:** There is an open bug where esbuild fails with Turbopack even with `serverExternalPackages` declared (Next.js issue #83630). Use the webpack bundler (default, do NOT pass `--turbopack` in `next dev`). [Source: github.com/vercel/next.js/issues/83630 — verified 2026-02-27]

```typescript
// Source: esbuild.github.io/api/#stdin + verified against Next.js discussion #60103
// src/lib/bundler.ts

import esbuild from 'esbuild';
import { readFile } from 'fs/promises';

export async function bundlePrototype(filePath: string): Promise<string> {
  const contents = await readFile(filePath, 'utf-8');

  const result = await esbuild.build({
    stdin: {
      contents,
      loader: 'jsx',
      resolveDir: process.cwd(), // needed for relative imports in the proto
    },
    bundle: true,
    external: ['react', 'react-dom', 'react/jsx-runtime', '@mui/*', '@emotion/*'],
    format: 'esm',
    write: false,
    jsx: 'automatic',
    jsxImportSource: 'react',
  });

  return result.outputFiles[0].text;
}
```

```typescript
// src/app/api/preview/[id]/bundle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { bundlePrototype } from '@/lib/bundler';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const protoDir = process.env.PROTOTYPES_DIR ?? './prototypes';
  const filePath = path.join(protoDir, params.id, 'index.jsx');

  try {
    const bundle = await bundlePrototype(filePath);
    return new NextResponse(bundle, {
      headers: { 'Content-Type': 'text/javascript' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
```

```typescript
// next.config.ts — REQUIRED
const nextConfig = {
  serverExternalPackages: ['esbuild'],
  // Do NOT enable turbopack — see Pitfall 2
};
export default nextConfig;
```

---

### Pattern 2: iframe Isolation with Import Map

**What:** The preview page (`/preview/[id]`) serves a standalone HTML document with an import map that resolves React and MUI to esm.sh CDN URLs. The bundled prototype JS (from Pattern 1) is loaded as a module script. A React root is mounted with MUI ThemeProvider, Emotion CacheProvider, and an ErrorBoundary.

**When to use:** Always. ThemeProvider MUST live inside the iframe — cannot be retrofitted later.

**esm.sh URL pattern** (verified against esm.sh docs, 2026-02-27):
- React 19: `https://esm.sh/react@19`
- React DOM: `https://esm.sh/react-dom@19`
- MUI: `https://esm.sh/@mui/material@6?external=react,react-dom`
- Emotion: `https://esm.sh/@emotion/react@11?external=react`
- The `?external=react,react-dom` parameter tells esm.sh to leave those imports as bare specifiers, which the import map resolves.

**Note on Emotion in iframe:** MUI uses Emotion for CSS-in-JS. By default, Emotion inserts style tags into the host document's `<head>`. Inside an iframe, you must create a custom Emotion cache with `container` pointing to the iframe's `document.head`. Without this, MUI styles are injected into the PARENT page's head and do not render in the iframe. [Source: emotion.sh/docs/@emotion/cache — verified 2026-02-27]

```typescript
// src/app/preview/[id]/page.tsx
// This page renders INSIDE the iframe — it is the iframe's document

import { headers } from 'next/headers';

export default function PreviewPage({ params }: { params: { id: string } }) {
  const bundleUrl = `/api/preview/${params.id}/bundle`;

  // The import map resolves bare specifiers used by the esbuild-bundled prototype
  const importMap = JSON.stringify({
    imports: {
      'react': 'https://esm.sh/react@19',
      'react/jsx-runtime': 'https://esm.sh/react@19/jsx-runtime',
      'react-dom': 'https://esm.sh/react-dom@19',
      'react-dom/client': 'https://esm.sh/react-dom@19/client',
      '@mui/material': 'https://esm.sh/@mui/material@6?external=react,react-dom,@emotion/react,@emotion/styled',
      '@emotion/react': 'https://esm.sh/@emotion/react@11?external=react',
      '@emotion/styled': 'https://esm.sh/@emotion/styled@11?external=react,@emotion/react',
    }
  });

  return (
    <>
      {/* Import map must come before any module script */}
      <script type="importmap" dangerouslySetInnerHTML={{ __html: importMap }} />
      {/* PreviewContent bootstraps the React root inside this document */}
      <script type="module" src="/preview-bootstrap.js" data-bundle={bundleUrl} />
    </>
  );
}
```

```typescript
// public/preview-bootstrap.js
// This script runs inside the iframe document
// It sets up the React root with ThemeProvider + Emotion cache + ErrorBoundary

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Emotion cache pointing to THIS document's head (not parent's)
const emotionCache = createCache({ key: 'mui', container: document.head });

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
});

const bundleUrl = document.currentScript?.dataset.bundle;

async function bootstrap() {
  const root = createRoot(document.getElementById('root'));

  try {
    const module = await import(/* @vite-ignore */ bundleUrl);
    const Component = module.default;

    root.render(
      createElement(CacheProvider, { value: emotionCache },
        createElement(ThemeProvider, { theme },
          createElement(CssBaseline),
          createElement(Component)
        )
      )
    );
  } catch (err) {
    // Post error to parent frame
    window.parent.postMessage({ type: 'RENDER_ERROR', message: err.message }, '*');
    root.render(createElement('pre', null, err.message));
  }
}

bootstrap();
```

---

### Pattern 3: postMessage for Theme Sync (Shell → iframe)

**What:** The app shell sends `SET_THEME` messages to the iframe. The iframe's React root listens and calls `useColorScheme().setMode()`.

**Critical decision from CONTEXT.md:** The entire app shell AND the prototype switch together. This means the shell also uses MUI v6 `useColorScheme` + the same `colorSchemes` theme configuration. The Zustand store holds the "raw" toggle state (light/dark/system), which drives both the shell and a postMessage to the iframe.

```typescript
// Shell sends to iframe
iframeRef.current.contentWindow.postMessage(
  { type: 'SET_THEME', mode: 'light' | 'dark' | 'system' },
  '*'
);

// Inside iframe PreviewContent
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data.type === 'SET_THEME') {
      setMode(e.data.mode); // from useColorScheme()
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [setMode]);
```

---

### Pattern 4: MUI v6 Three-State Toggle (Light / Dark / System)

**What:** MUI v6 natively supports `mode: 'system' | 'light' | 'dark'` via `useColorScheme`. When `cssVariables: true` is set in `createTheme`, mode switching does NOT cause component re-renders — only CSS variable values change.

**Theme setup:**
```typescript
// Source: mui.com/material-ui/customization/dark-mode/ — verified 2026-02-27
const theme = createTheme({
  cssVariables: true,  // enables CSS variable mode — no re-render on toggle
  colorSchemes: {
    light: true,   // enable light scheme
    dark: true,    // enable dark scheme
  },
  // colorSchemeSelector defaults to [data-mui-color-scheme="..."]
});
```

**Toggle component:**
```typescript
// Source: mui.com/material-ui/customization/dark-mode/ — verified 2026-02-27
import { useColorScheme } from '@mui/material/styles';

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null; // mode is undefined on first render — must handle

  const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';

  return (
    <IconButton onClick={() => setMode(next)}>
      {mode === 'light' && <LightModeIcon />}
      {mode === 'dark' && <DarkModeIcon />}
      {mode === 'system' && <SettingsBrightnessIcon />}
    </IconButton>
  );
}
```

**Important:** `mode` is `undefined` on first render to avoid hydration mismatch. All toggle UIs must handle the `undefined` case. [Source: MUI dark mode docs — verified 2026-02-27]

---

### Pattern 5: File Watching with SSE (chokidar + Next.js Route Handler)

**What:** A Next.js Route Handler streams Server-Sent Events. When chokidar detects a file change in the prototypes directory, it sends an SSE event to all connected clients. The browser client invalidates and reloads the preview iframe.

**SSE in Next.js 15 App Router:** Use `ReadableStream` with `export const dynamic = 'force-dynamic'` to prevent route caching. [Source: nextjs.org/docs/app/api-reference/file-conventions/route — verified 2026-02-27]

**chokidar v5 is ESM-only** and requires Node.js 20+. Since Next.js 15 requires Node 18+, verify the deployment Node version before committing to chokidar v5. Chokidar v4 (CommonJS) is the fallback.

```typescript
// src/app/api/watch/route.ts
import { NextRequest } from 'next/server';
import chokidar from 'chokidar';

export const dynamic = 'force-dynamic';

// Global watcher — initialized once, shared across SSE connections
let watcher: ReturnType<typeof chokidar.watch> | null = null;
const subscribers = new Set<(event: string) => void>();

function getWatcher() {
  if (!watcher) {
    const protoDir = process.env.PROTOTYPES_DIR ?? './prototypes';
    watcher = chokidar.watch(protoDir, { ignoreInitial: true });
    watcher.on('change', (filePath) => {
      subscribers.forEach(cb => cb(filePath));
    });
    watcher.on('add', (filePath) => {
      subscribers.forEach(cb => cb(filePath));
    });
  }
  return watcher;
}

export async function GET(_req: NextRequest) {
  getWatcher();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (filePath: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ file: filePath })}\n\n`));
      };
      subscribers.add(send);
      // Cleanup when client disconnects
      _req.signal.addEventListener('abort', () => {
        subscribers.delete(send);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### Pattern 6: Error Boundary for Prototype Rendering

**What:** Wrap the dynamic-imported prototype component in a React `ErrorBoundary` (from `react-error-boundary`). On render error, show a readable message with a Retry button. Also catch async import errors (syntax errors in the JSX) before mounting.

**Two error types to handle:**
1. **Build-time errors** (esbuild fails to compile): The `/api/preview/[id]/bundle` route returns a 422 with `{ error: string }`. The iframe bootstrap handles this before React mounts.
2. **Runtime errors** (component throws during render): `ErrorBoundary` from `react-error-boundary` catches these after React mounts.

```typescript
// Source: github.com/bvaughn/react-error-boundary — verified 2026-02-27
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Post error to parent shell for display in toolbar/status area
  useEffect(() => {
    window.parent.postMessage({ type: 'RENDER_ERROR', message: error.message }, '*');
  }, [error]);

  return (
    <Box sx={{ p: 3, color: 'error.main' }}>
      <Typography variant="h6">Render Error</Typography>
      <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', mt: 1 }}>
        {error.message}
      </Typography>
      <Button onClick={resetErrorBoundary} sx={{ mt: 2 }}>
        Retry
      </Button>
    </Box>
  );
}

// Usage inside iframe
<ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setKey(k => k + 1)}>
  <PrototypeComponent key={renderKey} />
</ErrorBoundary>
```

---

### Anti-Patterns to Avoid

- **ThemeProvider in the app shell only:** MUI styles will not apply in the iframe. Emotion injects into the host document's `<head>`, which is the iframe's parent. This is impossible to fix without a full sandbox rebuild. Always put ThemeProvider + CacheProvider inside the iframe.

- **Using esbuild.transform() expecting external support:** The `transform()` API does not support the `external` option. You will get React/MUI bundled into every prototype (400KB+). Use `build()` with `stdin`.

- **Enabling Turbopack in dev with esbuild:** `next dev --turbopack` + esbuild in Route Handlers fails with a binary parsing error (Next.js issue #83630). Do NOT enable Turbopack for this project until the issue is resolved in a stable Next.js release.

- **Using `sandbox="allow-scripts allow-same-origin"` together:** This combination allows the iframe to access `window.parent` and potentially exfiltrate data. For security, use `sandbox="allow-scripts"` only. NOTE: `allow-same-origin` is needed for Blob URL dynamic imports. This is a tradeoff documented in Pitfall 1 in PITFALLS.md. Phase 1 scope: use `allow-scripts allow-same-origin` (same-origin iframe, Claude Code output only, no external sharing yet). Revisit in Phase 4 (share links).

- **Forgetting `mode` can be undefined on first render:** MUI v6's `useColorScheme()` returns `mode: undefined` on the first render pass to avoid SSR hydration mismatch. Any UI that reads `mode` must handle `undefined` or it will flash/break.

- **Chokidar v5 on Node 18:** Chokidar v5 is ESM-only and requires Node 20+. If the deployment environment uses Node 18, use chokidar v4 (CommonJS, supports Node 14+).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary component | Class component with getDerivedStateFromError | `react-error-boundary` | Handles async errors, reset on key change, TypeScript types, onReset callback — all the edge cases |
| Cross-platform file watcher | `fs.watch()` wrapper | `chokidar` | `fs.watch` misses events on macOS (polling fallback), no debouncing, no glob support, no reliable `rename` detection |
| CSS injection into iframe | Custom style tag injection | `@emotion/cache` createCache({ container: iframeHead }) | Emotion handles speedy mode, style de-duplication, and server-rendering concerns |
| Import map CDN resolution | Custom ESM proxy | `esm.sh` | Handles peer dep tree, TypeScript stripping, and maintains correct React singleton when using `?external=react` |

**Key insight:** The iframe rendering problem appears simple but has many edge cases around style injection, React singleton enforcement (React must be the same instance in both the host and prototype), and cross-origin security. Each "don't hand-roll" item solves a specific edge case that has caused rewrites in similar tools.

---

## Common Pitfalls

### Pitfall 1: esbuild Cannot Be Bundled by Next.js

**What goes wrong:** `Error: The esbuild JavaScript API cannot be bundled. Please mark the 'esbuild' package as external.`

**Why it happens:** Next.js (webpack) bundles server-side dependencies. esbuild's JS API requires finding its native binary via a relative path inside `node_modules/esbuild`. When bundled, the relative path breaks.

**How to avoid:** Add to `next.config.ts`:
```typescript
serverExternalPackages: ['esbuild']
```

**Warning signs:** The error message itself is explicit. If you see it, this is the fix.

---

### Pitfall 2: Turbopack Breaks esbuild (Next.js Issue #83630)

**What goes wrong:** Even with `serverExternalPackages: ['esbuild']`, Turbopack attempts to parse esbuild's native binary as source code, producing `"invalid utf-8 sequence of 1 bytes from index 0"`.

**Why it happens:** Turbopack bug in Next.js 15.x (fixed in Next.js 16 canary as of Feb 2026). The webpack bundler handles this correctly.

**How to avoid:** Do not use `next dev --turbopack`. The default `next dev` uses webpack and works correctly.

**Warning signs:** The error only occurs with Turbopack enabled. With default `next dev`, it does not appear.

---

### Pitfall 3: MUI Styles Not Rendering in iframe (Emotion Cache)

**What goes wrong:** The prototype renders inside the iframe but has no MUI styling — default browser fonts, no spacing, no color theme.

**Why it happens:** Emotion (MUI's CSS-in-JS engine) inserts `<style>` tags into `document.head` — but inside an iframe, `document` refers to the PARENT page, not the iframe's document. Styles are injected into the wrong document.

**How to avoid:** Create a custom Emotion cache with `container` set to the iframe's own `document.head`:

```typescript
// This code runs INSIDE the iframe document
const cache = createCache({
  key: 'mui',
  container: document.head, // document is the iframe's document here
});
```

Wrap the entire preview tree with `<CacheProvider value={cache}>`.

**Warning signs:** Prototype renders with correct structure but wrong visual styling. DevTools shows MUI style tags in the parent page's `<head>`, not the iframe's.

---

### Pitfall 4: React Singleton Violation with Import Maps

**What goes wrong:** `Invalid hook call. Hooks can only be called inside of the body of a function component.` — even though the code looks correct.

**Why it happens:** Two copies of React are loaded: one from the import map (esm.sh) and one bundled into the prototype bundle by esbuild. React hooks check a module-scoped registry — two React instances have two registries, so hooks called in the component are in a different registry than the ThemeProvider's React.

**How to avoid:** Mark React as external in the esbuild build call AND in the esm.sh URLs using the `?external=react` parameter. This ensures all imports of `react` resolve to the single CDN instance.

```typescript
// esbuild must mark react as external
external: ['react', 'react-dom', 'react/jsx-runtime']

// AND the import map must cover all React entry points
"react": "https://esm.sh/react@19",
"react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
```

**Warning signs:** Hook errors that appear inconsistently, or only appear when MUI components are used.

---

### Pitfall 5: Claude Code Output Format Variations

**What goes wrong:** The prototype renders as a blank iframe or throws "Cannot find default export" — because Claude Code generated a named export or an arrow function without `export default`.

**Why it happens:** LLM output is probabilistic. Common Claude Code patterns include `export default function App()`, `const App = () => ...; export default App`, `export const App = () => ...` (NO default export), and sometimes multiple components.

**How to avoid:** Implement a minimal normalization wrapper in the bundle API route. Before calling esbuild, check if the JSX source has a default export. If not, append `export default App` where `App` is the last top-level component declaration found. Log a warning.

Also: provide a `CLAUDE.md` instruction in the prototypes directory with explicit output format requirements (one default-exported React component, MUI imports from `@mui/material`).

**Warning signs:** Blank preview on first try, renders on second prompt to Claude Code, no error message shown to the user.

---

## Code Examples

Verified patterns from official sources:

### esbuild build() with stdin and external (verified: esbuild.github.io/api/#stdin)
```typescript
const result = await esbuild.build({
  stdin: {
    contents: jsxSourceCode,
    loader: 'jsx',
    resolveDir: protoDirectory,
  },
  bundle: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@mui/*', '@emotion/*'],
  format: 'esm',
  write: false,
  jsx: 'automatic',
});
// result.outputFiles[0].text is the bundle string
```

### MUI v6 createTheme with colorSchemes (verified: mui.com/material-ui/customization/dark-mode/)
```typescript
const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: true,
    dark: true,
  },
});
// useColorScheme() then provides: mode, setMode
// setMode accepts: 'light' | 'dark' | 'system'
```

### Emotion cache for iframe (verified: emotion.sh/docs/@emotion/cache)
```typescript
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

// Must run inside the iframe document
const cache = createCache({ key: 'mui', container: document.head });

// Wrap ThemeProvider with CacheProvider
<CacheProvider value={cache}>
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
</CacheProvider>
```

### Next.js 15 SSE Route Handler (verified: nextjs.org — ReadableStream approach)
```typescript
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      // send events...
      req.signal.addEventListener('abort', () => controller.close());
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useMediaQuery + useState` for dark mode | `useColorScheme()` + `colorSchemes` in createTheme | MUI v6 (2024) | No re-render on toggle; works with SSR; avoids hydration flash |
| `experimental.serverComponentsExternalPackages` | `serverExternalPackages` (stable) | Next.js 15 | Stable API, no `experimental` wrapper needed |
| `CssVarsProvider` (experimental) | `ThemeProvider` with `cssVariables: true` | MUI v6 (2024) | CssVarsProvider features are now in ThemeProvider — use ThemeProvider |
| `fs.watch` for file watching | `chokidar` v4/v5 | Stable since ~2015 | chokidar is the de-facto standard |
| Private Next.js API for hot reload | SSE from a Route Handler | Next.js 13+ | SSE approach is stable public API; private API approach breaks on Next.js upgrades |

**Deprecated/outdated:**
- `CssVarsProvider`: replaced by `ThemeProvider + cssVariables: true` in MUI v6. Do not use.
- `experimental.serverComponentsExternalPackages`: renamed to `serverExternalPackages` in Next.js 15. Do not use the experimental version.
- `react-error-boundary` v3 API (`withErrorBoundary` HOC pattern): library is now at v5; prefer `<ErrorBoundary FallbackComponent={...}>`.

---

## Open Questions

1. **Import map browser support for the target team's browsers**
   - What we know: Import maps are supported in all modern browsers as of 2023 (Chrome 89+, Firefox 108+, Safari 16.4+). The `es-module-shims` polyfill covers older browsers.
   - What's unclear: The team's browser support requirements are not specified. If they use an older browser or Electron-based tooling, the polyfill may be needed.
   - Recommendation: Default to no polyfill (ship without it). If rendering fails in a team member's browser, add `es-module-shims` as a `<script>` before the import map.

2. **esm.sh reliability / availability**
   - What we know: esm.sh is a production CDN, used by Deno, JSR, and many dev tools. It has been stable for 3+ years.
   - What's unclear: In an air-gapped environment or with strict network policies, esm.sh would be inaccessible.
   - Recommendation: Ship with esm.sh CDN for v1. If network access is an issue, fall back to the "bundle React+MUI into each prototype" approach (set `write: false` without `external`). Document both approaches.

3. **chokidar v5 vs v4 (Node.js version requirement)**
   - What we know: chokidar v5 is ESM-only, requires Node 20+. Next.js 15 minimum is Node 18.17.0.
   - What's unclear: The deployment environment's Node version.
   - Recommendation: Start with chokidar v4 (CommonJS, Node 14+, widely compatible). Upgrade to v5 only if deployment confirms Node 20+.

4. **File structure convention for prototypes directory**
   - What we know: CONTEXT.md leaves this to Claude's discretion. Two options: (A) one file per prototype (`/prototypes/[id].jsx`), (B) one folder per prototype (`/prototypes/[id]/index.jsx`).
   - Recommendation: Use option B (folder structure) — it supports future multi-file prototypes (Phase 3: multi-screen), allows a `metadata.json` sidecar, and isolates `resolveDir` for esbuild per-prototype.

---

## Sources

### Primary (HIGH confidence)
- `esbuild.github.io/api/` — build API, stdin option, external option, write:false, transform limitations. Fetched 2026-02-27.
- `mui.com/material-ui/customization/dark-mode/` — colorSchemes API, useColorScheme hook, cssVariables. Fetched 2026-02-27.
- `mui.com/material-ui/customization/css-theme-variables/usage/` — CSS variable architecture, three-state toggle pattern. Fetched 2026-02-27.
- `emotion.sh/docs/@emotion/cache` — createCache with container option for iframe injection. Verified via WebSearch 2026-02-27.
- `nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages` — stable serverExternalPackages option. Verified via WebSearch 2026-02-27.
- `nextjs.org/blog/next-15-5` — Turbopack is in builds beta (NOT default for dev in 15.5), webpack is still default. Fetched 2026-02-27.

### Secondary (MEDIUM confidence)
- `github.com/vercel/next.js/issues/83630` — esbuild + Turbopack bug confirmed open, fixed in Next.js 16 canary. Fetched 2026-02-27.
- `github.com/vercel/next.js/discussions/60103` — esbuild in Next.js server components discussion, webpack fix confirmed. Fetched 2026-02-27.
- `esm.sh/` — URL format, `?external` parameter behavior. Fetched 2026-02-27.
- `github.com/bvaughn/react-error-boundary` — current API (v5 at time of research). WebSearch verified 2026-02-27.
- `blog.logrocket.com/best-practices-react-iframes/` — Emotion in iframe pattern. WebSearch verified 2026-02-27.

### Tertiary (LOW confidence)
- chokidar v5 ESM-only requirement — from WebSearch results, not directly verified against chokidar changelog. Mark for validation.
- `es-module-shims` polyfill for import maps in older browsers — from WebSearch, not directly verified.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — core libraries verified against official docs
- Architecture: HIGH — patterns verified (esbuild stdin/external, Emotion cache in iframe, MUI useColorScheme)
- Pitfalls: HIGH — specific GitHub issues verified for Turbopack/esbuild conflict; Emotion iframe issue verified against official docs
- File watching/SSE: MEDIUM — pattern is verified; chokidar v5 Node requirement is LOW confidence (needs changelog verification)

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable libraries) except Next.js/esbuild Turbopack issue — re-verify if Turbopack is needed before that date
