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
  // ─── Buttons ────────────────────────────────────────────────────────────────

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

  // ─── Form inputs ─────────────────────────────────────────────────────────────

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        // Size-dependent min-height matching Button heights
        '&.MuiInputBase-sizeSmall': { minHeight: '32px' },
        '&:not(.MuiInputBase-sizeSmall)': { minHeight: '40px' },
      },
      // Medium padding (overrides MUI default 16.5px 14px)
      input: {
        padding: '8px 12px',
      },
      // Small padding
      inputSizeSmall: {
        padding: '4px 8px',
      },
    },
  },

  MuiSelect: {
    styleOverrides: {
      select: {
        '&.MuiSelect-outlined': { padding: '8px 12px' },
        '&.MuiSelect-outlined.MuiInputBase-inputSizeSmall': { padding: '4px 8px' },
      },
    },
  },

  MuiCheckbox: {
    defaultProps: {
      color: 'secondary',
      size: 'small',
    },
  },

  MuiRadio: {
    defaultProps: {
      color: 'secondary',
      size: 'small',
    },
  },

  MuiSwitch: {
    styleOverrides: {
      root: {
        padding: '8px',
      },
      switchBase: {
        padding: '8px',
        '&.Mui-checked': {
          transform: 'translateX(16px)',
        },
      },
      thumb: {
        width: '20px',
        height: '20px',
        color: '#fff',
        boxShadow: 'rgba(0,0,0,0.08) 0px 2px 4px 0px',
      },
      track: {
        borderRadius: '12px',
        backgroundColor: '#ACA9BD', // blueGray[400] — unchecked
        opacity: 1,
        '.Mui-checked.Mui-checked + &': {
          backgroundColor: '#178CF6', // secondary.main — checked
          opacity: 1,
        },
      },
    },
  },

  // ─── Chip ────────────────────────────────────────────────────────────────────

  MuiChip: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: {
        // shape.borderRadius = 4 — token nem referálható JSON-safe kontextusban
        borderRadius: 4,
      },
    },
  },

  // ─── Navigation ──────────────────────────────────────────────────────────────

  MuiTab: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        lineHeight: 1.4,
        letterSpacing: '0.15px',
        textTransform: 'none',
        padding: '8px 16px',
        minHeight: '40px',
        fontWeight: 400,
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },

  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: '4px',
        textTransform: 'none',
        '&.Mui-selected': {
          backgroundColor: 'rgba(23, 140, 246, 0.12)', // secondary@12%
          color: '#178CF6',                            // secondary.main
          '&:hover': {
            backgroundColor: 'rgba(23, 140, 246, 0.18)',
          },
        },
      },
      sizeSmall: {
        fontSize: '0.75rem',
        lineHeight: 1.3,
        padding: '4px 8px',
      },
      sizeMedium: {
        fontSize: '0.875rem',
        lineHeight: 1.4,
        padding: '6px 12px',
      },
      sizeLarge: {
        fontSize: '1rem',
        lineHeight: 1.5,
        padding: '8px 16px',
      },
    },
  },

  MuiToggleButtonGroup: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: {
        borderRadius: '4px',
      },
      grouped: {
        '&:not(:first-of-type)': { borderRadius: '4px' },
        '&:first-of-type': { borderRadius: '4px' },
      },
    },
  },

  // ─── Menus ───────────────────────────────────────────────────────────────────

  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        lineHeight: 1.4,
        letterSpacing: '0.15px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(23, 140, 246, 0.08)', // secondary@8%
        },
        '&.Mui-selected:hover': {
          backgroundColor: 'rgba(23, 140, 246, 0.12)', // secondary@12%
        },
        '&.Mui-focusVisible': {
          backgroundColor: 'rgba(23, 140, 246, 0.12)',
        },
        '&.MuiMenuItem-dense': {
          minHeight: '32px',
        },
      },
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: {
        boxShadow: 'rgba(0,0,0,0.08) 0px 4px 8px 0px', // shadow[4]
        border: '1px solid rgba(59, 55, 81, 0.12)',      // divider
        borderRadius: '4px',
      },
    },
  },

  // ─── Overlays & feedback ─────────────────────────────────────────────────────

  MuiTooltip: {
    defaultProps: {
      arrow: true,
    },
  },

  MuiAlert: {
    styleOverrides: {
      root: {
        padding: '6px 16px',
      },
    },
  },

  // ─── Accordion ───────────────────────────────────────────────────────────────

  MuiAccordion: {
    defaultProps: {
      disableGutters: true,
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      content: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0.15px',
      },
    },
  },

  // ─── Other defaults ──────────────────────────────────────────────────────────

  MuiDrawer: {
    defaultProps: {
      anchor: 'right',
    },
  },

  MuiPagination: {
    defaultProps: {
      shape: 'rounded',
    },
  },
};
