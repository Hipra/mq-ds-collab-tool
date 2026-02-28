# Session Log

## 2026-02-28

### 1. MqIcon component (`public/mq-icons.js`)
- Standalone ESM module for prototype iframe
- Fetches SVGs from `/icon-set/<name>.svg`, caches in memory
- Strips width/height/fill from SVG, replaces fills with `currentColor`
- Supports `name`, `size` (default 24), `color` (hex or MUI palette), `sx`
- `...rest` prop spread for `data-inspector-id` forwarding
- `resolveColor()` maps palette names (`primary` → `primary.main`)

### 2. Icon serving
- `public/icon-set` symlink → `assets/icon-set` (~266 SVGs)

### 3. Import map + bundler
- `@mq/icons` → `/mq-icons.js` added to import map in `src/app/preview/[id]/route.ts`
- `@mq/*` added to esbuild externals in `src/lib/bundler.ts`

### 4. PropInspector enhancements
- `ColorValue` component: swatch + memoq token name + hex for both hex colors and MUI palette names
- `HEX_TO_TOKEN` reverse lookup from `memoq-tokens.ts`
- Removed type-based value coloring (all values `text.secondary`)
- Removed quotes from string values (`stripQuotes`)
- Added colon after every key name
- Changed column layout from 50/50 to 40/60

### 5. Component highlight in preview
- `PreviewFrame` sends `HIGHLIGHT_TEXT` postMessage when `selectedComponentId` changes
- Works for all components with `data-inspector-id` on DOM (including MqIcon via `...rest`)

### 6. Theme — secondary color for ListItemButton
- `MuiListItemButton` override in `theme.ts`: selected/hover use secondary alpha, ripple uses secondary.main
- Removed inline sx overrides from `ScreenSidebar.tsx`

### 7. Docs updated
- `docs/ux-guide.md` — Theme tab, MqIcon, component highlight, breakpoint list fix
- `docs/implementation-guide.md` — new files, postMessage protocol, store, JSX conventions

### 8. Housekeeping
- `assets/` (266 SVGs + tokens doc) committed
- `test-results/` added to `.gitignore`

### Commits
- `e3e45a6` feat: add MqIcon component, memoq color tokens, and inspector improvements
- `83c3678` feat: highlight selected component in preview and secondary color polish
- `0fbc811` docs: update guides
- `accfad9` chore: add icon-set assets and sample prototype screens
- `20eb1cd` chore: add test-results to gitignore
