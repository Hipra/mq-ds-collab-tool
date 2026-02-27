# Phase 3: Copywriter, Multi-screen & Status - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Copywriters can edit all prototype text without touching code, multi-screen prototypes are navigable, and the team can track prototype status (Draft/Review/Approved). Creating shareable links and the prototype gallery are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Copy tab — text organization
- Text entries grouped by component (mirrors component tree structure)
- Within each component group, entries categorized: Visible Text, Placeholder, Accessibility
- All text props extracted — children text, label, placeholder, aria-label, helperText, title
- Summary header at top showing total text entries and modified count (e.g., "24 text entries · 5 modified")
- Search bar at top to filter entries by text content or component name
- Collapsible component groups with persisted collapsed/expanded state across sessions
- Breadcrumb tooltip on hover showing full component path (e.g., "AppBar > Toolbar > Typography")
- Friendly empty state message when no extractable text found

### Copy tab — editing interaction
- Live-as-you-type updates — each keystroke updates preview instantly
- Auto-expanding textarea for multi-line text, simple input for single-line
- Character count shown below each text field
- Per-field undo/redo stack (Ctrl+Z reverts last edit in focused field)
- Per-entry reset icon to revert individual text back to source value
- Modified indicator (colored dot/badge) on entries changed from source

### Copy tab — preview integration
- Click-to-select: clicking text in preview highlights and scrolls to it in Copy tab (always on when Copy tab active)
- Reverse highlight: selecting entry in Copy tab highlights corresponding element in preview
- Two-way visual connection between Copy tab and preview

### Copy tab — export/import
- JSON export button downloads all text entries (preserves structure, component groups, categories)
- JSON import uploads edited text back into Copy tab
- Import uses key-based matching: matches entries by stable key, skips missing entries, reports skipped items

### Screen definition
- Screen sidebar (left side) listing screen names — name only, no thumbnails
- Sidebar is collapsible to maximize preview space
- Drag-to-reorder screens in the sidebar, custom order persisted
- Screen names are editable by the user (custom names persisted alongside source name)

### Status workflow
- Colored badge in the main toolbar next to prototype name
- MUI standard colors: Draft = default/grey, Review = warning/amber, Approved = success/green
- Any-to-any state transitions (no sequential enforcement)
- No confirmation dialog — click badge, select new status, done

### Text edit persistence
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

</decisions>

<specifics>
## Specific Ideas

- Two-way visual link between Copy tab and preview is a key UX differentiator — click in preview to find text, select text to see where it renders
- Export/import workflow enables offline copy editing: export JSON, hand to stakeholder, get it back, import
- Conflict resolution UI should clearly show "Designer's version" vs "Your version" side-by-side
- Character count is important for copywriters working within space constraints of the UI

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-copywriter-multi-screen-status*
*Context gathered: 2026-02-27*
