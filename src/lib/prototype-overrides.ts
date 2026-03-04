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
        borderRadius: '999px',
        verticalAlign: 'middle',
        fontWeight: 600,
        minWidth: 64,
      },
      sizeSmall: {
        padding: '8px 12px',
        fontSize: '12px',
        lineHeight: 1.3,
        letterSpacing: '0.4px',
      },
      sizeMedium: {
        padding: '10px 24px',
        fontSize: '14px',
        lineHeight: 1.3,
        letterSpacing: '0.15px',
      },
      sizeLarge: {
        padding: '12px 32px',
        fontSize: '16px',
        lineHeight: 1.5,
        letterSpacing: '0.15px',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        // shape.borderRadius = 4 — token nem referálható JSON-safe kontextusban
        borderRadius: 4,
      },
    },
  },
};
