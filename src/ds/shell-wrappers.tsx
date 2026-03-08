/**
 * Shell-native wrappers for DS components that call React hooks internally.
 *
 * DS wrapper components import react from their own node_modules (React 18),
 * but the shell runs React 19. Calling React 18 hooks under a React 19 renderer
 * causes "Cannot read properties of null (reading 'useMemo')" crashes.
 *
 * These lightweight wrappers replicate the DS API surface using MUI components
 * directly. DS styling is applied via the theme overrides in src/lib/theme.ts
 * (the same styleOverrides that ship with the DS), so the visual result is identical.
 *
 * Affected DS components:
 *   AppBar          — useMemo
 *   Chip            — useState, useLayoutEffect, useRef, useMemo, useImperativeHandle
 *   ToggleButton    — useState, useRef, useEffect
 *   ToggleButtonGroup — useCallback
 */
import React from 'react';
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MuiChip, { type ChipProps } from '@mui/material/Chip';
import MuiToggleButton, { type ToggleButtonProps } from '@mui/material/ToggleButton';
import MuiToggleButtonGroup, { type ToggleButtonGroupProps } from '@mui/material/ToggleButtonGroup';

// ── AppBar ──────────────────────────────────────────────────────────────────
// DS AppBar wraps children in a Toolbar automatically and accepts a `variant`
// prop to set the Toolbar density. Mirrors that API without calling useMemo.

interface AppBarProps extends Omit<MuiAppBarProps, 'children'> {
  variant?: 'regular' | 'dense';
  children?: React.ReactNode;
}

export const AppBar = React.forwardRef<HTMLElement, AppBarProps>(
  ({ variant, children, ...props }, ref) => (
    <MuiAppBar ref={ref} {...props}>
      <Toolbar variant={variant}>{children}</Toolbar>
    </MuiAppBar>
  )
);
AppBar.displayName = 'AppBar';

// ── Chip ────────────────────────────────────────────────────────────────────
// DS Chip adds overflow detection (truncation tooltip) and multiline support,
// neither of which the shell uses. Plain MUI Chip is a drop-in here.
export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (props, ref) => <MuiChip ref={ref} {...props} />
);
Chip.displayName = 'Chip';

// ── ToggleButton ─────────────────────────────────────────────────────────────
// DS ToggleButton adds a Popper for overflow items; the shell doesn't use it.
export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (props, ref) => <MuiToggleButton ref={ref} {...props} />
);
ToggleButton.displayName = 'ToggleButton';

// ── ToggleButtonGroup ────────────────────────────────────────────────────────
// DS ToggleButtonGroup adds a null-check on onChange; not needed in shell.
export const ToggleButtonGroup = React.forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  (props, ref) => <MuiToggleButtonGroup ref={ref} {...props} />
);
ToggleButtonGroup.displayName = 'ToggleButtonGroup';
