# Phase 2: Inspector & Responsive Preview - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Developers can inspect the MUI component tree and props, and anyone can preview the prototype at any MUI breakpoint. Delivers: AST-based component tree, prop inspector, breakpoint switcher, and the shared panel shell with two tabs (Copy and Components). Inline text editing (Copy tab content) is Phase 3 — this phase only sets up the tab shell.

</domain>

<decisions>
## Implementation Decisions

### Panel layout & interaction
- Right sidebar panel, preview on the left
- Collapsible — toggle button or keyboard shortcut to hide/show
- Two tabs: "Copy" and "Components" — switching preserves scroll position and selection state in both tabs
- Copy tab is present but content is Phase 3; Components tab is the active deliverable

### Component tree behavior
- Click-to-inspect in both the tree panel AND the preview iframe (like Chrome DevTools)
- Hover highlight overlay in the preview — semi-transparent box over hovered component
- Tree shows MUI components only (Box, Paper, Button, Typography, etc.) — skip raw HTML divs/spans
- Selecting in preview auto-expands the tree path and scrolls to the selected node

### Breakpoint switcher UX
- Lives in the top toolbar (alongside existing theme toggle from Phase 1)
- Labels show MUI breakpoint names with pixel width: "xs (360)", "sm (600)", "md (900)", "lg (1200)", "xl (1536)"
- Default mode is "Auto/Responsive" — preview fills available space; breakpoint buttons are for testing specific widths
- When a fixed breakpoint is active, preview iframe is centered with visible bounds (gray surround showing the boundary, like Figma device preview)

### Prop inspector display
- Key-value table format (two columns: prop name | value)
- Complex props (objects, arrays, callbacks) shown as inline summary ('{...}', '[3 items]'), expandable on click
- Read-only — no live prop editing
- Shows source file location (file path + line number) for the selected component

### Claude's Discretion
- Panel resize behavior (fixed vs drag-resizable)
- Exact panel width and resize constraints
- Loading states and empty states within the panel
- Highlight overlay color and opacity
- Keyboard shortcuts for panel toggle and inspector mode

</decisions>

<specifics>
## Specific Ideas

- Component tree should feel like Chrome DevTools Elements panel — familiar to developers
- Breakpoint preview with centered iframe and gray bounds should feel like Figma's device preview mode
- Prop table inspired by React DevTools props panel — clean, scannable key-value pairs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-inspector-responsive-preview*
*Context gathered: 2026-02-27*
