# Phase 2: Inspector & Responsive Preview - Research

**Researched:** 2026-02-27
**Domain:** AST-based component inspection / iframe breakpoint switching / tab panel state
**Confidence:** HIGH (core patterns), MEDIUM (cross-frame overlay positioning)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Panel layout & interaction**
- Right sidebar panel, preview on the left
- Collapsible — toggle button or keyboard shortcut to hide/show
- Two tabs: "Copy" and "Components" — switching preserves scroll position and selection state in both tabs
- Copy tab is present but content is Phase 3; Components tab is the active deliverable

**Component tree behavior**
- Click-to-inspect in both the tree panel AND the preview iframe (like Chrome DevTools)
- Hover highlight overlay in the preview — semi-transparent box over hovered component
- Tree shows MUI components only (Box, Paper, Button, Typography, etc.) — skip raw HTML divs/spans
- Selecting in preview auto-expands the tree path and scrolls to the selected node

**Breakpoint switcher UX**
- Lives in the top toolbar (alongside existing theme toggle from Phase 1)
- Labels show MUI breakpoint names with pixel width: "xs (360)", "sm (600)", "md (900)", "lg (1200)", "xl (1536)"
- Default mode is "Auto/Responsive" — preview fills available space; breakpoint buttons are for testing specific widths
- When a fixed breakpoint is active, preview iframe is centered with visible bounds (gray surround showing the boundary, like Figma device preview)

**Prop inspector display**
- Key-value table format (two columns: prop name | value)
- Complex props (objects, arrays, callbacks) shown as inline summary (`{...}`, `[3 items]`), expandable on click
- Read-only — no live prop editing
- Shows source file location (file path + line number) for the selected component

### Claude's Discretion
- Panel resize behavior (fixed vs drag-resizable)
- Exact panel width and resize constraints
- Loading states and empty states within the panel
- Highlight overlay color and opacity
- Keyboard shortcuts for panel toggle and inspector mode

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-04 | Responsive preview — breakpoint switcher (xs 0px, sm 600px, md 900px, lg 1200px, xl 1536px) iframe resizing (not CSS scale, actually resized) | Toolbar breakpoint buttons → Zustand `previewWidth` state → inline `width` style on iframe container; "Auto" sets width to `100%` |
| INSP-01 | Component tree display — MUI component hierarchy in tree view | AST pipeline: parse prototype source with `@babel/parser` + `@babel/traverse` → build `ComponentNode[]` tree → store in Zustand → render tree in Components tab |
| INSP-02 | Prop inspector — show selected component's props and values | From same AST pass: extract `JSXAttribute[]` per node → serialize to `PropEntry[]`; show as key-value table; source `loc.start.line` provides line number |
| INSP-04 | Shared panel with two tabs: "Copy" (Phase 3) and "Components" | MUI `<Tabs>` + custom `TabPanel` using `display:none` / `visibility:hidden` (not unmount) to preserve scroll and selection state between tab switches |
</phase_requirements>

---

## Summary

Phase 2 builds on the solid iframe+postMessage foundation from Phase 1. There are four distinct sub-problems: (1) AST-based component tree extraction from prototype source files, (2) hover/click inspection bridged via postMessage, (3) iframe width resizing for breakpoint preview, and (4) a tab panel shell that preserves state between "Copy" and "Components" tabs.

The key architectural decision locked in STATE.md is to use **AST (Babel) based inspection, NOT runtime fiber introspection**. This is the right call — it runs server-side during bundling, is deterministic, and bypasses the iframe boundary problem entirely. The AST analysis reads the source `.jsx` file at bundle time, extracts MUI component names + props + line numbers, and passes the result to the shell via a new `COMPONENT_TREE` postMessage from the iframe after it mounts.

For the hover highlight overlay, the approach is to inject `data-inspector-id` attributes into the DOM at bundle-transform time (a Babel pass before esbuild), then use `mouseover`/`click` listeners inside the iframe that read those attributes, call `getBoundingClientRect()`, and post `COMPONENT_HOVER` / `COMPONENT_SELECT` messages to the shell. The shell renders the highlight overlay positioned relative to the iframe's own bounding rect.

The breakpoint switcher is straightforward: a new `previewWidth` field in the Zustand store drives an inline `width` style on the `PreviewFrame` container. No postMessage needed — the iframe already fills 100% of its container width.

**Primary recommendation:** Implement the AST analysis as a server-side step that runs in the existing `/api/preview/[id]/bundle` route alongside esbuild, storing the component tree in a module-level cache or returning it in a parallel `/api/preview/[id]/tree` endpoint. Keep the hover overlay inside the iframe and communicate via the existing postMessage channel.

---

## Standard Stack

### Core (already installed — no new npm installs needed for core features)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@babel/parser` | 7.x | Parse prototype JSX/TSX source into AST | Already installed as transitive dependency of Next.js; standard Babel ecosystem |
| `@babel/traverse` | 7.x | Walk AST nodes (JSXOpeningElement, JSXAttribute) | Already installed as transitive dependency; pairs with `@babel/parser` |
| `@mui/material` (Tabs, Tab) | 6.x | Panel tab UI | Already in stack |
| `zustand` | 5.x | Panel open/closed, active tab, selected component, preview width | Already in stack |

### Supporting (may need to install)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@babel/types` | 7.x | Type guards for AST nodes (`t.isJSXIdentifier`, `t.isStringLiteral`, etc.) | Recommended for robust AST traversal; likely already installed as transitive dep |

**Installation check:**
```bash
ls node_modules/@babel
# @babel/parser and @babel/traverse are already present as Next.js transitive deps
# Verify @babel/types: ls node_modules/@babel/types
```

If `@babel/types` is missing:
```bash
npm install --save-dev @babel/types
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@babel/parser` + `@babel/traverse` | `acorn` + `acorn-jsx` | Acorn is lighter but has no TypeScript support and smaller ecosystem; Babel already installed |
| `@babel/parser` + `@babel/traverse` | `@swc/core` AST parse | SWC AST is different schema; less documented visitor pattern; not already installed |
| Inline `display:none` TabPanel | MUI `keepMounted` prop | MUI TabPanel does NOT have `keepMounted` as of v6 (open issue #37398); CSS approach is the verified workaround |
| CSS `display:none` tab hiding | Unmount + re-mount tabs | Unmounting loses scroll position and selection state — violates INSP-04 success criterion |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (shell)/
│   │   └── page.tsx          # Add InspectorPanel alongside PreviewFrame
│   └── api/
│       └── preview/[id]/
│           ├── bundle/route.ts   # Already exists — add AST tree extraction here
│           └── tree/route.ts     # NEW: GET /api/preview/[id]/tree → ComponentNode[]
├── components/
│   ├── InspectorPanel.tsx        # NEW: right sidebar with Tabs
│   ├── ComponentTree.tsx         # NEW: recursive MUI component tree
│   ├── PropInspector.tsx         # NEW: key-value table for props
│   ├── BreakpointSwitcher.tsx    # NEW: toolbar button group
│   ├── PreviewFrame.tsx          # MODIFY: accept previewWidth prop
│   └── Toolbar.tsx               # MODIFY: add breakpoint switcher
├── lib/
│   ├── bundler.ts                # Existing
│   └── ast-inspector.ts          # NEW: Babel-based component tree extraction
└── stores/
    ├── theme.ts                  # Existing
    └── inspector.ts              # NEW: panel state, selected component, preview width
```

### Pattern 1: AST Component Tree Extraction (Server-Side)

**What:** Parse the prototype source file with `@babel/parser` (plugins: `['jsx', 'typescript']`), traverse all `JSXOpeningElement` nodes, filter to MUI components (capitalized names matching `@mui/material` exports), build a `ComponentNode[]` tree with component name, props, and source line number.

**When to use:** Called from `/api/preview/[id]/tree` route on every bundle request. Cache by file content hash.

**MUI component filter:** Any `JSXOpeningElement` where `name.name` starts with uppercase AND matches the known MUI component name set OR any component name — since the user's prototype only uses MUI, all capitalized names are MUI. Raw HTML (`div`, `span`, `p`, etc.) start with lowercase — easy to filter.

**Source:** Verified via `@babeljs.io/docs/babel-parser`, `@babeljs.io/docs/babel-traverse`, and Facebook JSX AST spec.

```typescript
// Source: babeljs.io/docs/babel-parser + babel-traverse + facebook/jsx AST.md
// File: src/lib/ast-inspector.ts
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

export interface PropEntry {
  name: string;
  value: string;     // serialized display value
  rawType: string;   // 'string' | 'number' | 'boolean' | 'expression' | 'spread'
}

export interface ComponentNode {
  id: string;          // unique within tree: "Button_3_12" (name_line_col)
  componentName: string;
  props: PropEntry[];
  sourceFile: string;
  sourceLine: number;
  children: ComponentNode[];
}

export function extractComponentTree(sourceCode: string, filePath: string): ComponentNode[] {
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const root: ComponentNode[] = [];
  const stack: ComponentNode[][] = [root];

  traverse(ast, {
    JSXElement: {
      enter(path) {
        const opening = path.node.openingElement;
        const nameNode = opening.name;

        // Skip lowercase HTML elements (div, span, p, etc.)
        if (nameNode.type === 'JSXIdentifier' && /^[a-z]/.test(nameNode.name)) {
          stack.push([]); // push placeholder so exit() pops correctly
          return;
        }

        const componentName = resolveJSXName(nameNode);
        const props = extractProps(opening.attributes);
        const line = path.node.loc?.start.line ?? 0;
        const col = path.node.loc?.start.column ?? 0;

        const node: ComponentNode = {
          id: `${componentName}_${line}_${col}`,
          componentName,
          props,
          sourceFile: filePath,
          sourceLine: line,
          children: [],
        };

        stack[stack.length - 1].push(node);
        stack.push(node.children);
      },
      exit() {
        stack.pop();
      },
    },
  });

  return root;
}

function resolveJSXName(nameNode: any): string {
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') {
    return `${resolveJSXName(nameNode.object)}.${nameNode.property.name}`;
  }
  return nameNode.name ?? 'Unknown';
}

function extractProps(attributes: any[]): PropEntry[] {
  return attributes.map((attr): PropEntry => {
    if (attr.type === 'JSXSpreadAttribute') {
      return { name: '...spread', value: '{...}', rawType: 'spread' };
    }
    const name = attr.name.type === 'JSXIdentifier' ? attr.name.name : String(attr.name.name);
    if (!attr.value) {
      // Boolean shorthand: <Button disabled />
      return { name, value: 'true', rawType: 'boolean' };
    }
    if (attr.value.type === 'StringLiteral') {
      return { name, value: `"${attr.value.value}"`, rawType: 'string' };
    }
    if (attr.value.type === 'JSXExpressionContainer') {
      const expr = attr.value.expression;
      if (expr.type === 'NumericLiteral') return { name, value: String(expr.value), rawType: 'number' };
      if (expr.type === 'BooleanLiteral') return { name, value: String(expr.value), rawType: 'boolean' };
      if (expr.type === 'StringLiteral') return { name, value: `"${expr.value}"`, rawType: 'string' };
      if (expr.type === 'ObjectExpression') return { name, value: '{...}', rawType: 'expression' };
      if (expr.type === 'ArrayExpression') return { name, value: `[${expr.elements.length} items]`, rawType: 'expression' };
      if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
        return { name, value: '() => ...', rawType: 'expression' };
      }
      return { name, value: '{...}', rawType: 'expression' };
    }
    return { name, value: '{...}', rawType: 'expression' };
  });
}
```

### Pattern 2: Hover Highlight Overlay via postMessage

**What:** The iframe injects mouse event listeners on the rendered DOM tree. On `mouseover`, read `data-inspector-id` from the target element (or nearest ancestor with that attribute), get `getBoundingClientRect()`, post `COMPONENT_HOVER` to parent. Parent positions an absolutely-placed highlight overlay div over the iframe, offset by the iframe's own `getBoundingClientRect()`.

**Critical detail:** `getBoundingClientRect()` inside the iframe returns coordinates relative to the iframe's own viewport. To position an overlay in the parent document, you MUST add the iframe element's own `getBoundingClientRect()` offsets (top + left).

**The `data-inspector-id` approach:** Since esbuild does not support AST manipulation in plugins, the data attribute injection CANNOT be done as an esbuild plugin. Instead, do a separate Babel transform pass (using `@babel/core` transform or a custom traverse pass) that rewrites the source BEFORE passing it to esbuild. Or: embed the component IDs directly in the tree and map them to DOM elements using a simpler approach — the iframe script walks the React fiber tree after render to find DOM nodes (simpler: inject a small script that adds `data-inspector-id` based on element order during the React render).

**Recommended approach (simpler):** Instead of a Babel AST injection pass, have the iframe emit `COMPONENT_TREE` via postMessage after mount, and store the tree in the shell. When the user hovers over the iframe, use `pointer-events: none` overlay with `mousemove` tracked on the shell side (not inside the iframe) — this avoids cross-frame complexity. The shell can highlight a region based on which tree node the user selects in the panel.

**For click-to-inspect in the iframe:** Add a `click` listener to the iframe's `window` (from the bootstrap script) that reads the topmost element from `document.elementFromPoint()`, walks up the DOM to find `data-inspector-id`, and posts `COMPONENT_SELECT`. This requires the data attribute injection step.

**Recommended hybrid approach:**
1. Babel pre-pass injects `data-inspector-id` attributes into JSX elements before the source reaches esbuild
2. The iframe script listens for mouseover/click, reads the attribute, posts to parent
3. Parent positions overlay by adding iframe's own `getBoundingClientRect()` to the message's rect

```typescript
// In bundler.ts — add a pre-pass before esbuild
// Transform source code to inject data-inspector-id attributes
import { transformSync } from '@babel/core';

function injectInspectorIds(sourceCode: string, filePath: string): string {
  const result = transformSync(sourceCode, {
    filename: filePath,
    plugins: [inspectorIdBabelPlugin],
    parserOpts: { plugins: ['jsx', 'typescript'] },
    generatorOpts: { retainLines: true },
    configFile: false,
    babelrc: false,
  });
  return result?.code ?? sourceCode;
}
```

**Note:** `@babel/core` (which wraps `@babel/parser` + `@babel/traverse` + `@babel/generator`) will need to be added as a dependency if not already present.

**Source:** Verified via esbuild docs (no AST plugin API), react-dev-inspector docs (data-inspector- attribute pattern), MDN getBoundingClientRect.

### Pattern 3: Breakpoint Preview Width Control

**What:** Store `previewWidth: number | 'auto'` in Zustand. The `PreviewFrame` wrapper div gets `width: previewWidth === 'auto' ? '100%' : previewWidth`, centered with `mx: 'auto'`. When a fixed width is active, a gray surround (`background: grey.200`) fills the remaining space in the preview area.

**The critical constraint:** The iframe must be ACTUALLY resized (its container div gets a specific pixel width), NOT CSS-scaled. CSS `transform: scale()` would not trigger the prototype's MUI responsive breakpoints — the MUI theme system responds to the actual window/container width, not a visually-scaled representation.

**MUI breakpoint values** (from official MUI docs, HIGH confidence):
- `xs`: 0px (use 360px as preview width per user decision)
- `sm`: 600px
- `md`: 900px
- `lg`: 1200px
- `xl`: 1536px

```typescript
// In stores/inspector.ts
interface InspectorStore {
  panelOpen: boolean;
  activeTab: 'copy' | 'components';
  selectedComponentId: string | null;
  previewWidth: number | 'auto';   // 'auto' = responsive mode
  hoveredComponentId: string | null;
  componentTree: ComponentNode[];
  togglePanel: () => void;
  setActiveTab: (tab: 'copy' | 'components') => void;
  setSelectedComponent: (id: string | null) => void;
  setPreviewWidth: (width: number | 'auto') => void;
  setHoveredComponent: (id: string | null) => void;
  setComponentTree: (tree: ComponentNode[]) => void;
}
```

```tsx
// In PreviewFrame.tsx — wrapper handles centering + gray surround
<Box sx={{ flex: 1, display: 'flex', background: previewWidth === 'auto' ? 'transparent' : 'grey.200', alignItems: 'stretch', justifyContent: 'center', overflow: 'auto' }}>
  <Box sx={{ width: previewWidth === 'auto' ? '100%' : previewWidth, flexShrink: 0, position: 'relative' }}>
    <iframe ... />
    {/* highlight overlay rendered here */}
  </Box>
</Box>
```

**Source:** Verified via MUI breakpoints docs (mui.com/material-ui/customization/breakpoints/), high confidence.

### Pattern 4: Tab Panel State Preservation

**What:** MUI's standard `TabPanel` (from `@mui/lab` or the custom pattern from MUI docs) unmounts inactive panels by default — this would lose scroll position and selection state. The fix is to render all panels simultaneously but hide inactive ones with CSS.

**Verified workaround** (MUI GitHub issue #21250 + community pattern):

```tsx
// Custom TabPanel that stays mounted — uses display:none to hide
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box
      role="tabpanel"
      sx={{
        display: value === index ? 'block' : 'none',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {children}
    </Box>
  );
}
```

**Why NOT `visibility: hidden`:** Hidden panels would still occupy space in the layout. `display: none` removes them from layout while keeping the React tree mounted (state, scroll position preserved).

**Source:** MUI GitHub issue #21250 (verified workaround pattern), MEDIUM confidence (issue remains open, no official `keepMounted` prop in MUI v6 Tabs).

### Pattern 5: postMessage Protocol Extension

Phase 1 established this protocol: `SET_THEME`, `RELOAD` (shell→iframe), `RENDER_ERROR` (iframe→shell). Phase 2 adds new message types — these must not conflict.

```typescript
// Extend existing types in a shared types file
// src/lib/postmessage-types.ts

// Shell → iframe (existing)
type ShellToIframe =
  | { type: 'SET_THEME'; mode: 'light' | 'dark' | 'system' }
  | { type: 'RELOAD' };

// Iframe → shell (existing)
type IframeToShell =
  | { type: 'RENDER_ERROR'; message: string }
  // Phase 2 additions:
  | { type: 'COMPONENT_TREE'; tree: ComponentNode[] }
  | { type: 'COMPONENT_HOVER'; id: string | null; rect: { top: number; left: number; width: number; height: number } | null }
  | { type: 'COMPONENT_SELECT'; id: string; rect: { top: number; left: number; width: number; height: number } };
```

The `COMPONENT_TREE` message is sent from `preview-bootstrap.js` after the React root renders successfully (after the `import()` resolves and `Root` component mounts).

### Anti-Patterns to Avoid

- **Using `transform: scale()` for breakpoint preview:** The iframe's MUI theme responds to actual container width, not visual scale. Scale approach would make `xs` preview look small but the prototype would still render at full width internally.
- **Runtime fiber introspection:** Locked decision from STATE.md — `__REACT_DEVTOOLS_GLOBAL_HOOK__` breaks across React versions and is inaccessible inside iframes without special setup. AST-based approach only.
- **Unmounting tab panels:** Loses scroll position and selected component state — violates INSP-04 success criterion.
- **Positioning overlay relative to iframe viewport only:** Must add iframe's own `getBoundingClientRect()` (from the parent document) to the coordinates received via postMessage to position the overlay correctly in the shell.
- **Parsing `.tsx` files with JSX-only Babel plugin:** Must include `'typescript'` in `plugins` array alongside `'jsx'` — Claude Code generates TypeScript by default.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSX parsing | Custom regex-based JSX tokenizer | `@babel/parser` + `@babel/traverse` | Handles all JSX edge cases: self-closing, member expressions (`MUI.Button`), spread props, nested JSX in expressions, TypeScript generics on JSX elements |
| Source location tracking | Manual line counting | `@babel/parser` with `loc: true` (default) | Every AST node automatically has `.loc.start.line` and `.loc.start.column` |
| Tab state persistence | Custom render/unmount logic | `display: none` CSS pattern | React's state is preserved when a component stays mounted; no need for external serialization |
| Breakpoint pixel values | Hard-coded magic numbers | MUI default theme breakpoint constants (or just the 5 values from docs) | Official values are: xs=0(360 preview), sm=600, md=900, lg=1200, xl=1536 |

**Key insight:** `@babel/parser` and `@babel/traverse` are already in `node_modules` as Next.js transitive dependencies — they can be imported in server-side code without adding new packages.

---

## Common Pitfalls

### Pitfall 1: Babel TypeScript Plugin Error on JSX Files

**What goes wrong:** Calling `@babel/parser.parse()` with `plugins: ['typescript']` alone will error on `.tsx` files. The TypeScript plugin needs `isTsx: true` when the file has JSX, OR you must use both `['jsx', 'typescript']` plugins together.

**Why it happens:** Babel's TypeScript parser plugin doesn't enable JSX parsing by default.

**How to avoid:** Always use `plugins: ['jsx', 'typescript']` for `.tsx` files. If source could be either `.jsx` or `.tsx`, detect by file extension.

**Warning signs:** Error `Unexpected token` at JSX angle brackets during parse.

### Pitfall 2: Overlay Position Mismatch (iframe getBoundingClientRect offset)

**What goes wrong:** The overlay highlight appears in the wrong position — offset by the iframe's top/left position in the page.

**Why it happens:** `getBoundingClientRect()` inside the iframe returns coordinates relative to the iframe's own viewport, not the parent document. If the iframe starts at `{ top: 64, left: 0 }` in the parent (because the toolbar is 64px tall), all overlay positions are off by 64px.

**How to avoid:** In the shell's `COMPONENT_HOVER` / `COMPONENT_SELECT` handler, add the iframe element's own `getBoundingClientRect()` to the received rect:

```typescript
const iframeRect = iframeRef.current.getBoundingClientRect();
const adjustedTop = message.rect.top + iframeRect.top;
const adjustedLeft = message.rect.left + iframeRect.left;
```

**Warning signs:** Overlay appears above or to the side of the actual component.

### Pitfall 3: esbuild Cannot Inject Data Attributes

**What goes wrong:** Attempting to write an esbuild plugin to inject `data-inspector-id` attributes will fail — esbuild does not expose AST manipulation in its plugin API.

**Why it happens:** esbuild's plugin API is intentionally limited to load/resolve hooks, not AST transformation. From official docs: "It's not currently possible to modify the AST directly in esbuild plugins."

**How to avoid:** Run a Babel transform BEFORE passing source code to esbuild. In `bundler.ts`, add a step that uses `@babel/core`'s `transformSync()` to inject data attributes, then pass the transformed source to esbuild via `stdin.contents`.

**Warning signs:** Any attempt to use `onLoad` in an esbuild plugin to transform JSX attributes will produce incorrect or no output.

### Pitfall 4: MUI Tabs Unmount Destroys Scroll Position

**What goes wrong:** User scrolls down in the Components tree, switches to Copy tab, switches back — scroll position is lost.

**Why it happens:** MUI's default `TabPanel` implementation unmounts content when the tab is not active. This is the default per MUI source and documented in multiple GitHub issues.

**How to avoid:** Build a custom `TabPanel` that uses `display: none` (not conditional rendering). Confirmed pattern from MUI GitHub issue #21250.

**Warning signs:** Any tab panel using `{activeTab === 'components' && <ComponentTree />}` will have this problem.

### Pitfall 5: JSXElement.enter/exit Stack Misalignment

**What goes wrong:** The component tree nesting is incorrect — components appear at wrong depths or children are missing.

**Why it happens:** When using `JSXElement` enter/exit in `@babel/traverse`, every element (including lowercase HTML like `div`) triggers `enter`. If you skip lowercase elements in `enter` but still push to the stack, you need to also skip them in `exit` consistently.

**How to avoid:** Track which elements were skipped and don't push/pop stack for them. One approach: push a sentinel value onto the stack for skipped elements:

```typescript
const SKIP = Symbol('skip');
// In enter: push SKIP for lowercase elements
// In exit: if stack.peek() === SKIP, pop and return
```

**Warning signs:** Components appear nested inside `div` entries (which shouldn't appear in the MUI-only tree).

---

## Code Examples

### Basic Component Tree Extraction

```typescript
// Source: babeljs.io/docs/babel-parser + babeljs.io/docs/babel-traverse + github.com/facebook/jsx/blob/main/AST.md
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const ast = parse(sourceCode, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
});

traverse(ast, {
  JSXOpeningElement(path) {
    const nameNode = path.node.name;

    // Get component name (handles simple + member expression)
    const name = nameNode.type === 'JSXIdentifier'
      ? nameNode.name
      : `${nameNode.object?.name}.${nameNode.property?.name}`;

    // Skip HTML elements
    if (/^[a-z]/.test(name)) return;

    // Source location
    const line = path.node.loc?.start.line ?? 0;

    // Props
    const props = path.node.attributes
      .filter(attr => attr.type === 'JSXAttribute')
      .map(attr => ({
        name: attr.name.name,
        value: attr.value === null ? 'true'
          : attr.value.type === 'StringLiteral' ? `"${attr.value.value}"`
          : '{...}',
      }));

    console.log(`Found: ${name} at line ${line}`, props);
  },
});
```

### Breakpoint Switcher in Toolbar

```tsx
// Source: MUI docs (breakpoint values) + existing Toolbar.tsx pattern
const BREAKPOINTS = [
  { label: 'Auto', width: 'auto' as const },
  { label: 'xs (360)', width: 360 },
  { label: 'sm (600)', width: 600 },
  { label: 'md (900)', width: 900 },
  { label: 'lg (1200)', width: 1200 },
  { label: 'xl (1536)', width: 1536 },
] as const;

// In Toolbar component:
const { previewWidth, setPreviewWidth } = useInspectorStore();

<ButtonGroup size="small" variant="outlined">
  {BREAKPOINTS.map(bp => (
    <Button
      key={bp.label}
      variant={previewWidth === bp.width ? 'contained' : 'outlined'}
      onClick={() => setPreviewWidth(bp.width)}
    >
      {bp.label}
    </Button>
  ))}
</ButtonGroup>
```

### Highlight Overlay Positioning (Shell Side)

```tsx
// Source: MDN getBoundingClientRect + cross-frame offset pattern
const handleMessage = (event: MessageEvent) => {
  if (event.data?.type === 'COMPONENT_HOVER' && iframeRef.current) {
    if (!event.data.rect) {
      setHighlight(null);
      return;
    }
    const iframeRect = iframeRef.current.getBoundingClientRect();
    setHighlight({
      top: event.data.rect.top + iframeRect.top,
      left: event.data.rect.left + iframeRect.left,
      width: event.data.rect.width,
      height: event.data.rect.height,
    });
  }
};

// Overlay element (in shell DOM, position: fixed)
{highlight && (
  <Box sx={{
    position: 'fixed',
    top: highlight.top,
    left: highlight.left,
    width: highlight.width,
    height: highlight.height,
    border: '2px solid',
    borderColor: 'primary.main',
    backgroundColor: 'primary.main',
    opacity: 0.15,
    pointerEvents: 'none',
    zIndex: 9999,
  }} />
)}
```

### Tab Panel Shell (Phase 3 placeholder in Copy tab)

```tsx
// Source: MUI GitHub issue #21250 workaround pattern
function PanelTab({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box
      role="tabpanel"
      id={`panel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ display: value === index ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'auto' }}
    >
      {children}
    </Box>
  );
}

// In InspectorPanel:
<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
  <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
    <Tab label="Copy" value={0} />
    <Tab label="Components" value={1} />
  </Tabs>
</Box>
<PanelTab value={activeTab} index={0}>
  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
    Copy editing — Phase 3
  </Typography>
</PanelTab>
<PanelTab value={activeTab} index={1}>
  <ComponentTree tree={componentTree} selectedId={selectedComponentId} onSelect={setSelectedComponent} />
</PanelTab>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime fiber introspection (`__REACT_DEVTOOLS_GLOBAL_HOOK__`) | AST-based static analysis | Decided in Phase 1 planning (STATE.md) | Deterministic, version-stable, works across iframe boundary |
| esbuild for AST transforms | Babel pre-pass + esbuild | Phase 2 (this phase) | esbuild doesn't support AST plugins; Babel handles AST, esbuild handles bundling |
| `TabPanel` unmount on switch | `display:none` CSS pattern | MUI issue open since 2020 | State + scroll preserved; workaround is stable |

**Deprecated/outdated:**
- Fiber introspection for inspector: Fragile, requires `__REACT_DEVTOOLS_GLOBAL_HOOK__` which is unstable across React versions. Not used.
- `react-devtools-core` inline: Heavy, WebSocket-based, designed for Electron/native. Not used.

---

## Open Questions

1. **`@babel/core` vs manual `@babel/parser` + `@babel/traverse` + `@babel/generator` for data attribute injection**
   - What we know: `@babel/core`'s `transformSync()` combines parse + traverse + generate in one call; the individual packages are already installed as transitive deps. `@babel/core` itself may not be installed.
   - What's unclear: Whether `@babel/core` is present as a transitive dep of Next.js (likely yes, since Next.js uses Babel internally).
   - Recommendation: Check `ls node_modules/@babel/core` first. If present, use `transformSync`. If not, use manual parse+traverse+generate pipeline to avoid adding a new dependency.

2. **Data attribute injection: Babel pre-pass vs postMessage tree approach**
   - What we know: Both approaches work. Babel pre-pass enables click-to-select from inside the iframe. The pure postMessage tree approach only enables click-to-select from the panel.
   - What's unclear: User decision says "click-to-inspect in both the tree panel AND the preview iframe" — this REQUIRES the data attribute approach so iframe clicks can identify which component was clicked.
   - Recommendation: Implement the Babel pre-pass for data attribute injection. This is required for the locked user decision.

3. **Panel resize behavior (Claude's Discretion)**
   - What we know: User left this to Claude's discretion. Fixed width is simpler to implement; drag-resizable requires either a ResizeObserver setup or a library.
   - Recommendation: Start with fixed width (320px is a common inspector panel width, matching VS Code's default). Add drag-resize in a future iteration if needed.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (the key is absent from the workflow object), so this section is skipped.

---

## Sources

### Primary (HIGH confidence)
- `@babeljs.io/docs/babel-parser` — Plugin configuration, JSX/TypeScript plugin combination
- `@babeljs.io/docs/babel-traverse` — Visitor pattern, JSXOpeningElement visitor
- `github.com/facebook/jsx/blob/main/AST.md` — JSXOpeningElement, JSXAttribute node structure
- `mui.com/material-ui/customization/breakpoints/` — MUI default breakpoint pixel values (xs/sm/md/lg/xl)
- `esbuild.github.io/plugins/` — Confirmed: no AST manipulation in esbuild plugins

### Secondary (MEDIUM confidence)
- `github.com/mui/material-ui/issues/21250` — Tab panel `display:none` workaround for state preservation
- `react-dev-inspector.zthxxx.me/docs/compiler-plugin` — `data-inspector-*` attribute injection pattern via Babel plugin
- `github.com/facebook/react/issues/18945` — DevTools iframe cross-frame overlay offset problem
- `kevinpeters.net/visualizing-react-components-by-parsing-jsx-with-babel` — Practical Babel JSX tree extraction pattern

### Tertiary (LOW confidence)
- WebSearch results on hover overlay positioning — verified against MDN getBoundingClientRect (upgraded to MEDIUM)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@babel/parser`/`@babel/traverse` already installed; verified via package listing
- Architecture: HIGH — postMessage pattern from Phase 1; AST pattern locked in STATE.md; iframe width straightforward
- Pitfalls: MEDIUM-HIGH — iframe offset pitfall verified by React DevTools issue tracker; esbuild AST limitation verified by official docs; Babel TypeScript/JSX plugin issue verified

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (Babel and MUI v6 are stable; 30-day window)
