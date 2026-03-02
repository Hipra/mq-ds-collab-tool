/**
 * prototype-overrides.ts — single source of truth for MUI component overrides
 * that apply inside prototype previews.
 *
 * RULES:
 * - Only plain objects here — no theme functions, no CSS variable references.
 *   This file is serialized to JSON and served to the iframe via
 *   GET /api/preview/component-overrides, so it must be JSON-safe.
 * - App-shell-specific overrides (AppBar, ListItemButton, etc.) stay in theme.ts.
 * - When you change a style here it automatically applies to ALL prototypes,
 *   both new and existing ones.
 */

import type { Components, Theme } from '@mui/material/styles';

export const prototypeComponentOverrides: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 100,
        textTransform: 'none',
        boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 4px 0px',
        '&:hover': { boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 4px 0px' },
        '&:active': { boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 4px 0px' },
      },
      sizeSmall: { padding: '8px 12px', fontSize: '12px', fontWeight: 600 },
      sizeMedium: { padding: '10px 24px', fontSize: '14px', fontWeight: 600 },
      sizeLarge: { padding: '12px 32px', fontSize: '16px', fontWeight: 600 },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: { textTransform: 'none' },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: { textTransform: 'none' },
    },
  },
};
