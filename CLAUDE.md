# Prototype Collaboration Tool

## Prototype Isolation Rule

When working on a prototype, ONLY modify files under the specific `prototypes/<id>/` directory. Never modify files in other prototype directories.

## Stack

Prototypes use React + MUI with bare imports:

```jsx
import { Box, Typography } from '@mui/material';
```

## Icons

Use `MqIcon` for all icons — never MUI icons (`@mui/icons-material`) or raw SVGs.

```jsx
import { MqIcon } from '@mq/icons';

<MqIcon name="archive" size={20} color="primary" />
```

Props: `name` (icon name string), `size` (px number), `color` (MUI palette name or hex string).

## MUI Conventions

Use standard MUI patterns unless there is a specific reason not to.
- Prefer MUI components and props over custom HTML/CSS
- Use `sx` prop for one-off styling, theme overrides for shared styles
- Use `color="primary"` / `color="secondary"` instead of hardcoded hex
- **Never use `!important`** — use MUI-native alternatives (e.g. `disableGutters`, component props, or more specific selectors)
- Only reach for `styled()` or raw `style=` when MUI's API genuinely cannot achieve the requirement
- Use theme spacing in `sx`: `mt: 2` not `mt: '16px'`
- Use Typography `variant` prop instead of manual `fontSize`/`fontWeight`; do not invent custom variants
- Use `slotProps={{ input: { ... } }}` — never deprecated `InputProps`, `inputProps`, or `SelectProps`
- For layouts use `Box` with flexbox or `Stack`; if Grid is needed use MUI Grid v2 (`import Grid from '@mui/material/Grid2'`) — never `<Grid item>` (v1 API)

## Dialog Conventions

- **Cancel button:** always `variant="text" color="secondary"` — never `variant="contained"` or default
- **TextField:** `slotProps={{ input: { notched: false, color: 'secondary' } }}` — matches DS TextField (no legend notch, secondary focus ring)
- **Destructive actions (delete, remove):** show only on hover using `visibility: hidden` / `visibility: visible` pattern

## AppBar Conventions

- Use DS `AppBar` (`@memoq/memoq.web.design`) with `variant="dense"` — never MUI AppBar directly
- Title: `Typography variant="subtitle2"` — never `body2` with manual fontWeight or `subtitle1`
- Back button spacing: `ml: 0.5` on the title, not `mr` on the button
- All UI text uses sentence case, never Title Case
