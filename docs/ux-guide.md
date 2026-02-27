# Prototype Collaboration Tool — UX Guide

A tool for building, previewing, and collaborating on React + MUI prototypes. Designers can inspect components, edit text content, manage screens, and share previews with stakeholders.

---

## Gallery (Home Page)

The landing page lists all prototypes as a card grid.

**What you can do:**

- **Search** — filter prototypes by name using the search field
- **Filter by status** — toggle between All / Draft / Review / Approved
- **Create prototype** — click the **+ New Prototype** button, enter a name, and the tool generates a starter screen
- **Delete prototype** — click the trash icon on a card, then confirm in the dialog
- **Open prototype** — click a card to enter the workspace
- **Switch theme** — the sun/moon icon in the top-right cycles between Light, Dark, and System mode

---

## Workspace

Opening a prototype takes you to the workspace, which has four areas:

```
┌──────────────────────────────────────────────────────┐
│  Toolbar                                             │
├────────┬──────────────────────────┬──────────────────┤
│ Screen │                          │    Inspector     │
│ Side-  │     Preview (iframe)     │    Panel         │
│ bar    │                          │  (Copy | Comps)  │
│        │                          │                  │
└────────┴──────────────────────────┴──────────────────┘
```

### Toolbar

Left to right:

| Control | Action |
|---------|--------|
| **Back arrow** | Return to gallery |
| **Prototype name** | Displays the current prototype |
| **Status badge** | Click to change status (Draft / Review / Approved) |
| **Delete icon** | Delete this prototype |
| **Breakpoint switcher** (center) | Resize preview: Auto, xs (360), sm (600), md (900), lg (1200), xl (1536) |
| **Share icon** | Generate a public share link and copy it |
| **Terminal icon** | Copy a Claude Code command for the active screen |
| **Menu icon** | Toggle screen sidebar |
| **Sidebar icon** | Toggle inspector panel |
| **Theme icon** | Cycle Light / Dark / System |

### Screen Sidebar (left panel)

Lists all screens in the prototype. Visible when the menu icon is active.

- **Select a screen** — click its name to load it in the preview
- **Reorder screens** — drag the grip handle to rearrange
- **Rename a screen** — double-click its name, type the new name, press Enter
- **Add a screen** — click the **Add screen** button at the bottom, enter a name in the dialog

The first screen is always `index.jsx` (named "Main" by default). Additional screens appear as `screen-{name}.jsx`.

### Preview (center)

A live rendering of the active screen. Updates automatically when the source file changes (hot reload).

- **Breakpoints** — when a fixed breakpoint is selected, the preview is centered with a gray surround to simulate the device width
- **Auto mode** — the preview stretches to fill available space
- **Errors** — if the prototype has a syntax or render error, an error message and retry button are shown

### Inspector Panel (right panel)

Two tabs: **Copy** and **Components**.

---

## Copy Tab — Text Editing

The Copy tab lets you edit all visible text in the prototype without touching code.

### Editing text

1. Open the **Copy** tab in the inspector panel
2. Find the text entry you want to edit (entries are grouped by component)
3. Type in the text field — changes appear live in the preview
4. Edits are saved automatically (debounced, ~500ms)

### Finding text

- **Search** — use the search field at the top to filter entries by component name, prop name, or text content
- **Click in preview** — click any text element in the preview and the Copy tab scrolls to the matching entry

### Categories

Entries are grouped into:

- **Visible Text** — headings, paragraphs, button labels, chip labels
- **Placeholder** — input placeholder text
- **Accessibility** — aria-labels, title attributes

### History & Reset

- **History icon** — see all previous edits with timestamps
- **Reset icon** — revert the entry to the original source value

### Conflicts

If a developer changes the source text while you have an edit, a conflict banner appears. You can:

- **Accept designer's** — use the new source value
- **Keep mine** — keep your edited version

### Export / Import

- **Export JSON** — download all current edits as a JSON file (useful for handoff or backup)
- **Import JSON** — upload a previously exported JSON to restore edits

---

## Components Tab — Inspection

The Components tab shows the MUI component tree of the active screen.

### Component tree (upper area)

- A hierarchical view of all MUI components (Box, Typography, Button, etc.)
- Click a component to select it — it highlights in the tree
- Hover over a component — the preview highlights the corresponding element

### Prop inspector (lower area)

When a component is selected, its props are displayed in a table:

| Column | Description |
|--------|-------------|
| **Name** | Prop name (e.g., `variant`, `color`, `sx`) |
| **Value** | Color-coded by type: green = string, blue = number, purple = boolean, gray = expression |

Complex props (like `sx` objects) can be expanded by clicking them. The source file and line number are shown at the top.

---

## Sharing

1. Click the **share icon** in the toolbar
2. A share URL is generated and shown in a popover
3. Click **Copy** to copy the link

The share link opens a **read-only** view of the prototype — no sidebar, no inspector, no editing. Recipients see the prototype name, status badge, and a "View only" indicator.

---

## Claude Code Integration

Click the **terminal icon** in the toolbar to copy a pre-configured Claude Code command to your clipboard. The command:

- Points Claude to the correct prototype directory
- Includes the active screen filename
- Instructs Claude to follow project rules (only edit files in the prototype directory, use React + MUI)

Paste the command into a terminal to start an AI-assisted coding session for the current screen.

---

## Status Workflow

Each prototype has a status that can be changed at any time:

| Status | Meaning |
|--------|---------|
| **Draft** | Work in progress |
| **Review** | Ready for feedback |
| **Approved** | Signed off |

Click the status badge in the toolbar to change it. The status is visible in the gallery cards and in shared previews.

---

## Keyboard Shortcuts

| Context | Key | Action |
|---------|-----|--------|
| Screen rename | Enter | Confirm rename |
| Screen rename | Escape | Cancel rename |
| Create dialog | Enter | Submit form |

---

## Tips

- **Hot reload** — save a prototype file and the preview updates instantly, no manual refresh needed
- **Multiple screens** — use the sidebar to organize prototypes into multiple pages (e.g., Login, Dashboard, Settings)
- **Responsive testing** — use the breakpoint switcher to test how the prototype looks at different widths
- **Text editing workflow** — designers edit text in the Copy tab, then export JSON for developer handoff; developers can see what changed without digging through code
