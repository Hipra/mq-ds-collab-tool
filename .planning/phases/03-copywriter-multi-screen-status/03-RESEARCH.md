# Phase 3: Copywriter, Multi-screen & Status - Research

**Researched:** 2026-02-27
**Domain:** AST text extraction, overlay persistence, multi-screen routing, status state machine
**Confidence:** HIGH (architecture already established, research extends known patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Copy tab — text organization**
- Text entries grouped by component (mirrors component tree structure)
- Within each component group, entries categorized: Visible Text, Placeholder, Accessibility
- All text props extracted — children text, label, placeholder, aria-label, helperText, title
- Summary header at top showing total text entries and modified count (e.g., "24 text entries · 5 modified")
- Search bar at top to filter entries by text content or component name
- Collapsible component groups with persisted collapsed/expanded state across sessions
- Breadcrumb tooltip on hover showing full component path (e.g., "AppBar > Toolbar > Typography")
- Friendly empty state message when no extractable text found

**Copy tab — editing interaction**
- Live-as-you-type updates — each keystroke updates preview instantly
- Auto-expanding textarea for multi-line text, simple input for single-line
- Character count shown below each text field
- Per-field undo/redo stack (Ctrl+Z reverts last edit in focused field)
- Per-entry reset icon to revert individual text back to source value
- Modified indicator (colored dot/badge) on entries changed from source

**Copy tab — preview integration**
- Click-to-select: clicking text in preview highlights and scrolls to it in Copy tab (always on when Copy tab active)
- Reverse highlight: selecting entry in Copy tab highlights corresponding element in preview
- Two-way visual connection between Copy tab and preview

**Copy tab — export/import**
- JSON export button downloads all text entries (preserves structure, component groups, categories)
- JSON import uploads edited text back into Copy tab
- Import uses key-based matching: matches entries by stable key, skips missing entries, reports skipped items

**Screen definition**
- Screen sidebar (left side) listing screen names — name only, no thumbnails
- Sidebar is collapsible to maximize preview space
- Drag-to-reorder screens in the sidebar, custom order persisted
- Screen names are editable by the user (custom names persisted alongside source name)

**Status workflow**
- Colored badge in the main toolbar next to prototype name
- MUI standard colors: Draft = default/grey, Review = warning/amber, Approved = success/green
- Any-to-any state transitions (no sequential enforcement)
- No confirmation dialog — click badge, select new status, done

**Text edit persistence**
- Conflicts flagged when both copywriter and designer change the same text node — both versions shown side-by-side in Copy tab, copywriter resolves manually
- Simple edit history log per entry: original value + list of edits with timestamps, viewable on hover or expand

### Claude's Discretion
- Text entry label format (component path vs auto-generated friendly label)
- Copy tab text scope per screen (active screen only vs all screens grouped)
- Screen definition approach (one file per screen vs named exports vs config)
- Screen add/remove management (source-driven vs UI-managed)
- New text node handling on source update (auto-add vs notify)
- Overlay/patch persistence strategy (how edits are stored without modifying source)
- Exact text entry key generation for stable matching
- Loading skeleton and transition animations

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INSP-03 | Inline text editing — "Copy" tab where copywriter sees all text and can edit inline | AST text extraction extends existing ast-inspector.ts; overlay/patch pattern enables non-destructive edits |
| SCRN-01 | Multiple screens per prototype — support 5-10 screens | Screen discovery via filesystem convention (named files) or config file; bundle route extended to handle screen param |
| SCRN-02 | Screen navigation in prototype (tab strip or sidebar) | Left sidebar pattern decided; screen state in Zustand; SELECT_SCREEN postMessage or shell-side routing |
| SHAR-03 | Status workflow — draft → review → approved state machine | Chip + Menu pattern in MUI; status stored in metadata.json; any-to-any transitions |
</phase_requirements>

---

## Summary

Phase 3 builds three independent features on top of the Phase 2 foundation: (1) a Copy tab for non-destructive text editing extracted via Babel AST, (2) a multi-screen sidebar for prototype navigation, and (3) a status badge in the toolbar. All three extend existing patterns without new dependencies.

The most complex feature is the Copy tab. Text extraction is a natural extension of `ast-inspector.ts` — the existing Babel traversal already visits all JSX nodes; adding a text-extraction pass alongside the tree-extraction pass is straightforward. The harder design problem is persistence: text edits must survive source updates without touching `.jsx` files. The right pattern is an **overlay/patch file** (`prototypes/[id]/copy-overlay.json`) that stores only the delta from source. On each render the bundler merges source text with overlay text before esbuild runs.

Multi-screen is architecturally simpler: each screen is a named JSX file inside the prototype directory (e.g., `screen-login.jsx`, `screen-dashboard.jsx`). The shell renders a collapsible left sidebar listing screen names; switching screens sends a `SELECT_SCREEN` message to the iframe which reloads the appropriate bundle URL. The existing SSE hot-reload pattern and bundle/tree API routes extend cleanly to accept an optional `?screen=` query param.

The status badge is the simplest feature: a MUI `Chip` in the `Toolbar` component, clicking opens a `Menu` with three options, selected status written to `metadata.json` via a new PATCH API route, read on page load via TanStack Query or direct fetch.

**Primary recommendation:** Build in sequence — status badge first (simplest, validates metadata write pattern), then multi-screen (validates routing extension), then Copy tab (most complex, builds on both).

---

## Standard Stack

### Core (all already installed — no new deps required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@babel/parser` | (Next.js transitive) | AST parsing of JSX source | Already used in ast-inspector.ts |
| `@babel/traverse` | (Next.js transitive) | AST traversal for text extraction | Same pattern as Phase 2 tree extraction |
| `zustand` | ^5.0.11 | Copy tab state, screen state, status state | Established store pattern in project |
| `@mui/material` | ^6.4.7 | Chip, Menu, Drawer, Sidebar UI | All UI in MUI per project convention |
| `next` | ^15.5.12 | API routes for metadata PATCH, screen bundle | Extends existing route structure |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | latest | Drag-to-reorder screens in sidebar | CONTEXT.md requires drag reorder — dnd-kit is the MUI-compatible standard |
| `nanoid` | ^5.1.5 (already installed) | Stable key generation for text entries | Already in package.json |

**dnd-kit note:** This is the ONE new dependency. React DnD is unmaintained. HTML5 drag API does not support touch or keyboard. dnd-kit is the current standard for React sortable lists.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| overlay JSON file | SQLite + Drizzle | SQLite is in STATE.md decisions but not yet initialized — for Phase 3, a flat JSON file alongside the prototype is simpler and sufficient; SQLite can absorb it in Phase 4 when sharing requires a real DB |
| dnd-kit | react-beautiful-dnd | react-beautiful-dnd is unmaintained as of 2023; dnd-kit is its spiritual successor and actively maintained |
| screen files as named JSX | config file (screens.json) | Named files are discoverable without config; config adds a management UI burden; source-driven approach fits the Claude Code workflow |

**Installation (new dep only):**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Architecture Patterns

### Recommended Project Structure

```
prototypes/
└── [id]/
    ├── index.jsx              # existing — single-screen prototypes (backward compat)
    ├── screen-[name].jsx      # new — additional screens (screen-login.jsx, screen-dashboard.jsx)
    ├── metadata.json          # extended: + status field
    └── copy-overlay.json      # new — text edit overlay (delta from source)

src/
├── app/
│   ├── api/
│   │   └── preview/[id]/
│   │       ├── bundle/route.ts        # extend: ?screen= param
│   │       ├── tree/route.ts          # extend: ?screen= param
│   │       ├── copy/route.ts          # new: GET text entries, POST overlay
│   │       └── status/route.ts        # new: GET/PATCH status
│   └── (shell)/page.tsx               # extend: ScreenSidebar left of PreviewFrame
├── components/
│   ├── Toolbar.tsx                    # extend: StatusBadge component
│   ├── InspectorPanel.tsx             # extend: CopyTab replaces placeholder
│   ├── ScreenSidebar.tsx              # new: collapsible left sidebar
│   ├── CopyTab.tsx                    # new: full copy editor UI
│   └── StatusBadge.tsx               # new: Chip + Menu status control
├── lib/
│   ├── ast-inspector.ts               # extend: extractTextEntries() alongside extractComponentTree()
│   └── copy-overlay.ts               # new: read/write/merge overlay logic
└── stores/
    ├── inspector.ts                   # extend: add activeScreenId, screens list
    └── copy.ts                        # new: Zustand store for copy tab state
```

### Pattern 1: Text Extraction via AST

**What:** A second pass over the Babel AST (same parse as Phase 2) that collects text-bearing props from all JSX elements — not just MUI components.

**When to use:** Called by `/api/preview/[id]/copy` GET endpoint.

**Key insight from existing code:** `ast-inspector.ts` already has `serializePropValue()` and traverses all JSXAttribute nodes. Text extraction reuses the same pattern but targets `string` rawType props with text-relevant names.

```typescript
// Extension pattern for ast-inspector.ts or new lib/text-extractor.ts
// Source: existing ast-inspector.ts serializePropValue pattern

export interface TextEntry {
  key: string;           // stable: "ComponentName_line_col_propName"
  componentName: string;
  componentPath: string; // "AppBar > Toolbar > Typography"
  propName: string;      // "children" | "label" | "placeholder" | "aria-label" | "helperText" | "title"
  category: 'visible' | 'placeholder' | 'accessibility';
  sourceValue: string;   // value from JSX source — never mutated
  currentValue: string;  // source value merged with overlay
  sourceLine: number;
}

const TEXT_PROPS: Record<string, TextEntry['category']> = {
  children: 'visible',
  label: 'visible',
  helperText: 'visible',
  title: 'visible',
  placeholder: 'placeholder',
  'aria-label': 'accessibility',
  'aria-describedby': 'accessibility',
};

// Key generation — stable across source updates as long as component position unchanged
function makeTextKey(componentName: string, line: number, col: number, propName: string): string {
  return `${componentName}_${line}_${col}_${propName}`;
}
```

**children extraction:** JSXText nodes (bare text between tags like `<Typography>Hello</Typography>`) require a separate visitor — they are not JSXAttribute nodes. The traversal must handle both:
- `JSXAttribute` where `name.name` is in TEXT_PROPS
- `JSXText` nodes (direct children text content), attributed to the nearest MUI parent

### Pattern 2: Overlay/Patch Persistence

**What:** A JSON file storing only the delta between source values and edited values. Source JSX is never touched. Bundler merges overlay before esbuild.

**When to use:** Any time a copywriter saves a text edit.

```typescript
// lib/copy-overlay.ts

export interface CopyOverlay {
  version: 1;
  entries: Record<string, {  // key = TextEntry.key
    editedValue: string;
    editedAt: string;         // ISO timestamp
    sourceValueAtEdit: string; // for conflict detection
  }>;
}

// Read overlay — returns empty overlay if file doesn't exist
export async function readOverlay(prototypeId: string): Promise<CopyOverlay>

// Write single entry update
export async function patchOverlay(prototypeId: string, key: string, value: string, sourceValue: string): Promise<void>

// Merge: for each TextEntry, if overlay has key → use editedValue, else use sourceValue
export function mergeOverlayIntoEntries(entries: TextEntry[], overlay: CopyOverlay): TextEntry[]
```

**Conflict detection:** When designer pushes a source update, re-extract text entries and compare `sourceValue` vs `overlay[key].sourceValueAtEdit`. If they differ AND `overlay[key].editedValue !== newSourceValue`, flag as conflict. API response includes a `conflicts` array.

**Text injection into bundle:** The bundler receives the overlay and does a string-replace pass on the normalized source BEFORE the Babel pre-pass. This is the simplest approach: replace literal string values at known source positions. Alternative: AST-based source mutation with `@babel/generator`, but string replacement at known line/col is precise enough given stable JSX source format.

**Recommended approach for text injection:** A postMessage-based approach is cleaner than modifying source. The shell sends `SET_TEXT_OVERRIDES` to the iframe after load, and the iframe applies overrides by finding elements with matching `data-inspector-id` and updating their text content directly via DOM manipulation. This avoids re-bundling on every keystroke.

```
Shell -> Iframe: SET_TEXT_OVERRIDES { overrides: Record<inspectorId, Record<propName, string>> }
```

This means the copy-overlay maps text entry keys to inspector IDs — a linkage that must be established during text extraction (inspectorId = `data-inspector-id` attr value = `ComponentName_line_col`).

### Pattern 3: Multi-Screen File Convention

**What:** Each screen is a named file `screen-[name].jsx` in the prototype directory. The shell discovers screens by filesystem scan.

**Screen discovery API:**
```
GET /api/preview/[id]/screens
→ [{ id: "index", name: "Main", file: "index.jsx" }, { id: "login", name: "Login", file: "screen-login.jsx" }]
```

The existing bundle/tree routes accept `?screen=` query param. Default screen is always `index`.

**Screen metadata:** Custom names and order are stored in `metadata.json`:
```json
{
  "name": "Sample Prototype",
  "status": "draft",
  "createdAt": "...",
  "screens": {
    "order": ["index", "login", "dashboard"],
    "customNames": { "login": "Sign In", "dashboard": "Home" }
  }
}
```

### Pattern 4: Status Badge — Chip + Menu

**What:** MUI `Chip` component in the `Toolbar` triggers a `Menu` with three status options.

**Implementation:** Straightforward — onClick opens `Menu` anchored to `Chip`, three `MenuItem` entries (Draft/Review/Approved). Selected calls `PATCH /api/preview/[id]/status`. Status persisted in `metadata.json`. Shell reads status on mount via fetch.

```typescript
// StatusBadge in Toolbar
const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: 'default'  as const },
  review:   { label: 'Review',   color: 'warning'  as const },
  approved: { label: 'Approved', color: 'success'  as const },
};
```

MUI `Chip` `color` prop accepts `'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'` — all three values are valid MUI colors. [HIGH confidence — verified against existing MUI v6 usage in project]

### Pattern 5: ScreenSidebar with dnd-kit Sortable

**What:** A collapsible left sidebar listing screen names. Drag-to-reorder uses dnd-kit `SortableContext`.

**Layout change:** `page.tsx` currently: `Toolbar / (PreviewFrame + InspectorPanel)`. Phase 3: `Toolbar / (ScreenSidebar + PreviewFrame + InspectorPanel)`. ScreenSidebar is conditionally rendered (collapsed = zero-width or hidden).

**dnd-kit sortable pattern:**
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Each screen item uses useSortable hook
function ScreenItem({ id, name, isActive, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  // ...
}
```

### Anti-Patterns to Avoid

- **Modifying source JSX for text overrides:** Destroys the source-of-truth and causes irreversible data loss. Use overlay JSON + postMessage injection instead.
- **Re-bundling on each keystroke:** esbuild is fast but not instant. Live-as-you-type must use DOM manipulation via postMessage (`SET_TEXT_OVERRIDES`), not re-bundling.
- **Storing screens in a separate DB table before Phase 4:** Phase 4 introduces SQLite. Phase 3 uses JSON files only. Premature DB use adds complexity without benefit.
- **Using `innerText` for text injection in iframe:** Overwrites React's DOM ownership. Use a non-React DOM overlay div or pass overrides through React state via a postMessage-triggered re-render hook.
- **Key instability:** If text entry key is based on text content (not position), keys break when source value changes. Keys MUST be position-based (`ComponentName_line_col_propName`).
- **JSXText children confusion:** `<Typography>Hello</Typography>` — "Hello" is a `JSXText` node, not an attribute. The AST traversal must handle both JSXText and JSXAttribute separately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder | Custom mousedown/mouseup drag logic | `@dnd-kit/sortable` | Keyboard accessibility, touch support, scroll-during-drag, auto-scroll — all complex edge cases |
| Auto-expanding textarea | CSS `resize:vertical` or JS height calculation | MUI `TextField` with `multiline` + `minRows`/`maxRows` | MUI TextField `multiline` auto-expands natively; no JS needed |
| Character count | Custom state | MUI `TextField` `inputProps.maxLength` + `helperText` | TextField exposes character count built-in; or simple `value.length` display beside the field |
| Undo/redo per field | Custom history stack | Browser native `Ctrl+Z` on `<textarea>` + `useRef` for programmatic undo | Browser's native undo in `<textarea>` is free and handles per-field scope automatically |

**Key insight:** MUI TextField with `multiline` covers the auto-expand + character count requirement without custom logic. The per-field undo/redo from CONTEXT.md is native browser behavior for `<textarea>` — no custom stack needed for the basic case.

---

## Common Pitfalls

### Pitfall 1: JSXText vs JSXAttribute Children

**What goes wrong:** Extracting text from `children` prop only finds `children="text"` (explicit prop), missing `<Button>Click me</Button>` where "Click me" is a `JSXText` node inside the element, not a `children` prop.

**Why it happens:** JSX has two ways to pass children — as a prop (`children="..."`) or as node content. Babel AST distinguishes them: prop is a `JSXAttribute`, direct text is a `JSXText` node on `path.node.children`.

**How to avoid:** In the traversal `enter` handler, after processing attributes, also iterate `path.node.openingElement`'s parent (`path.node.children`) and collect `JSXText` nodes with non-whitespace content.

**Warning signs:** Copy tab shows no entries for components like `Typography`, `Button`, `Chip` that use text as children.

### Pitfall 2: Text Overlay Key Instability After Source Refactor

**What goes wrong:** Designer rewrites a component, moving a `Typography` from line 12 to line 24. The overlay key `Typography_12_5_children` no longer matches any entry. All copywriter edits for that entry are silently orphaned.

**Why it happens:** Position-based keys are stable within a session but break on source restructuring.

**How to avoid:** On source update (SSE reload), diff overlay keys against newly extracted entries. Report orphaned overlay keys in the UI as "N edits could not be matched to updated source." Copywriter sees the orphaned content and can re-apply manually. Do not silently discard orphaned entries.

**Warning signs:** After a designer source push, copy tab shows fewer modified entries than expected.

### Pitfall 3: Live Preview Text Injection Conflicts with React DOM

**What goes wrong:** Injecting text overrides by directly setting `element.textContent` fights React's reconciliation. On next re-render, React overwrites the DOM change with the original source text.

**Why it happens:** React owns the DOM. Direct DOM mutations outside React are ephemeral.

**How to avoid:** The iframe must maintain a React state map of overrides (`Record<inspectorId, string>`) and update text nodes through React state, not direct DOM manipulation. The `SET_TEXT_OVERRIDES` postMessage triggers a React state update that re-renders with the new values. The bootstrap's `Root` component passes overrides down via a context.

**Warning signs:** Text appears updated momentarily then reverts to source text on any interaction.

### Pitfall 4: Metadata.json Write Race on Status Change

**What goes wrong:** Two rapid status changes trigger two concurrent `PATCH /api/preview/[id]/status` requests that both read-modify-write `metadata.json`. Second write may overwrite first.

**Why it happens:** No locking on file writes. Node.js `fs.writeFile` is not atomic.

**How to avoid:** Use `fs.rename` (atomic on POSIX) to write to a temp file then rename. Or serialize writes with a per-prototype mutex (simple `Map<id, Promise>` chain). Given Phase 3 is single-user, a simple optimistic approach with `Date.now()` version is sufficient.

**Warning signs:** Status badge flickers between values after rapid clicking.

### Pitfall 5: Screen Sidebar Layout Shift

**What goes wrong:** Adding a left sidebar changes the flex layout and breaks the existing `PreviewFrame` responsive width logic.

**Why it happens:** `PreviewFrame`'s `flex: 1` fills the full row width. With a sidebar, it must fill `row width - sidebar width`.

**How to avoid:** `page.tsx` outer flex row already handles this — adding `ScreenSidebar` as a flex child before `PreviewFrame` automatically shrinks `PreviewFrame`'s `flex: 1` space. No explicit width math needed. Sidebar uses a fixed pixel width (e.g., 200px) with `flexShrink: 0`, same pattern as `InspectorPanel` (320px).

---

## Code Examples

Verified patterns from the existing codebase and MUI v6 docs:

### Text-bearing props extraction (extension of ast-inspector.ts)

```typescript
// Extend extractComponentTree to also collect text entries in one traversal pass
// Source: pattern from existing ast-inspector.ts traverse usage

const TEXT_PROP_CATEGORIES: Record<string, 'visible' | 'placeholder' | 'accessibility'> = {
  children:          'visible',
  label:             'visible',
  helperText:        'visible',
  title:             'visible',
  placeholder:       'placeholder',
  'aria-label':      'accessibility',
};

// In the JSXElement enter handler, after building the ComponentNode:
for (const attr of opening.attributes) {
  if (attr.type !== 'JSXAttribute') continue;
  const propName = attr.name.type === 'JSXIdentifier' ? attr.name.name : String(attr.name.name);
  const category = TEXT_PROP_CATEGORIES[propName];
  if (!category) continue;

  // Only extract static string values (not expressions)
  if (attr.value?.type === 'StringLiteral') {
    const key = `${componentName}_${line}_${col}_${propName}`;
    textEntries.push({ key, componentName, propName, category, sourceValue: attr.value.value, sourceLine: line });
  }
}

// Also collect JSXText children (separate visitor needed or inline in JSXElement enter):
for (const child of path.node.children ?? []) {
  if (child.type === 'JSXText') {
    const text = child.value.trim();
    if (text) {
      const key = `${componentName}_${line}_${col}_children`;
      textEntries.push({ key, componentName, propName: 'children', category: 'visible', sourceValue: text, sourceLine: line });
    }
  }
}
```

### Status Badge (Chip + Menu)

```tsx
// Source: MUI v6 Chip and Menu documented API + existing project Toolbar.tsx pattern

import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

<Chip
  label={STATUS_CONFIG[status].label}
  color={STATUS_CONFIG[status].color}
  size="small"
  onClick={(e) => setAnchorEl(e.currentTarget)}
  sx={{ cursor: 'pointer', mr: 1 }}
/>
<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
    <MenuItem key={key} onClick={() => { onStatusChange(key as Status); setAnchorEl(null); }}>
      <Chip label={cfg.label} color={cfg.color} size="small" sx={{ mr: 1 }} />
      {cfg.label}
    </MenuItem>
  ))}
</Menu>
```

### MUI TextField multiline auto-expand

```tsx
// Source: MUI TextField multiline documentation (verified against existing MUI v6 in project)

<TextField
  value={entry.currentValue}
  onChange={(e) => onEdit(entry.key, e.target.value)}
  multiline={isMultiLine}  // true if sourceValue contains \n or is longer than ~80 chars
  minRows={1}
  maxRows={6}
  size="small"
  fullWidth
  inputProps={{ style: { fontSize: 13 } }}
  helperText={`${entry.currentValue.length} chars`}
/>
```

### dnd-kit sortable list (screen reorder)

```tsx
// Source: dnd-kit official docs pattern
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableScreenItem({ id, name, isActive, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <ListItemButton selected={isActive} onClick={() => onSelect(id)} dense>
        <ListItemText primary={name} />
      </ListItemButton>
    </Box>
  );
}

// DndContext handleDragEnd:
function handleDragEnd(event) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    setScreenOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    // Persist new order to metadata.json via PATCH
  }
}
```

### SET_TEXT_OVERRIDES postMessage pattern (new message type)

```typescript
// postmessage-types.ts extension (Phase 3 additions):
// Shell -> Iframe: SET_TEXT_OVERRIDES
// Iframe -> Shell: TEXT_CLICK (click-to-select from Copy tab)

// New message types:
| { type: 'SET_TEXT_OVERRIDES'; overrides: Record<string, string> }  // key -> editedValue
| { type: 'SELECT_SCREEN'; screenId: string }

| { type: 'TEXT_CLICK'; key: string }  // iframe tells shell which text was clicked
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/sortable | 2022 (rbd abandoned) | dnd-kit is the maintained standard; API is similar |
| MUI `Chip` color via `sx` | `color` prop with semantic tokens | MUI v6 | `color="warning"` etc. are first-class — no manual color values needed |
| SQLite for all persistence | JSON files for Phase 3 prototype data | Project decision | Lightweight, no migration needed; SQLite absorbs in Phase 4 |

**Deprecated/outdated:**
- react-beautiful-dnd: unmaintained since 2023, do not use
- Injecting text via direct DOM mutation: breaks React reconciliation, use React state instead

---

## Open Questions

1. **Copy tab text scope: active screen only vs all screens grouped**
   - What we know: CONTEXT.md leaves this to Claude's discretion
   - What's unclear: If a prototype has 5 screens with 30 text entries each, showing all 150 simultaneously may be overwhelming; but switching context with screen switch may confuse copywriters
   - Recommendation: Default to **active screen only** — it keeps the list manageable, matches the screen the copywriter is looking at, and the search bar enables cross-screen discovery if needed. Export/import operates on all screens.

2. **Screen definition: source-driven vs UI-managed**
   - What we know: CONTEXT.md leaves to Claude's discretion
   - What's unclear: How does a designer add a new screen? Touch a file and the sidebar updates, or click "+" in the UI?
   - Recommendation: **Source-driven** — designer creates `screen-[name].jsx` file, SSE watch detects it, shell re-fetches screen list. No "Add Screen" UI needed. Matches the Claude Code workflow where the designer generates files, not the UI.

3. **New text node on source update: auto-add vs notify**
   - What we know: CONTEXT.md leaves to Claude's discretion
   - What's unclear: If designer adds a new TextField, the copywriter's Copy tab should show it — but is it disruptive to auto-insert?
   - Recommendation: **Auto-add** new entries with `sourceValue` as `currentValue` (not modified). New entries appear naturally in the list. This is the least surprising behavior.

4. **Text entry key format**
   - What we know: Must be stable, position-based
   - Recommendation: `${componentName}_${sourceLine}_${sourceCol}_${propName}` — consistent with existing `data-inspector-id` format (`ComponentName_line_col`), just adds `_propName` suffix.

---

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is not set in `.planning/config.json` (absent = false).

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/ast-inspector.ts` — Babel traversal patterns, JSXAttribute extraction
- Existing codebase: `src/components/InspectorPanel.tsx` — TabPanel display:none pattern, Zustand integration
- Existing codebase: `src/lib/postmessage-types.ts` — message protocol extension point
- Existing codebase: `src/components/Toolbar.tsx` — Toolbar extension pattern
- Existing codebase: `public/preview-bootstrap.js` — iframe message handling, React root pattern
- Existing codebase: `prototypes/sample/metadata.json` — metadata schema extension point
- MUI v6 Chip docs (verified: `color` prop accepts `'default'|'primary'|'secondary'|'error'|'info'|'success'|'warning'`)
- MUI v6 TextField multiline docs (verified: `multiline`, `minRows`, `maxRows` props)

### Secondary (MEDIUM confidence)
- dnd-kit official documentation: https://docs.dndkit.com — SortableContext, useSortable, arrayMove API

### Tertiary (LOW confidence)
- None — all critical claims verified against codebase or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new core deps; one new dep (dnd-kit) verified as current standard
- Architecture: HIGH — all patterns extend existing Phase 1/2 code; no speculative new patterns
- Pitfalls: HIGH — JSXText pitfall verified by reading existing AST code; DOM injection pitfall is fundamental React behavior; others verified by architecture analysis

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable libraries; dnd-kit API is mature)
