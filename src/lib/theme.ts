import { createTheme } from '@mui/material/styles';
import type { ThemeConfig } from '@/lib/theme-config';

/**
 * Create the shared MUI theme with CSS variables and light/dark color schemes.
 *
 * Accepts an optional ThemeConfig to apply custom palette, typography, shape,
 * and spacing from the theme editor. Used by both the app shell and
 * conceptually by the iframe bootstrap (preview-bootstrap.js).
 */
export function createAppTheme(config?: ThemeConfig | null) {
  return createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-mui-color-scheme',
    },
    defaultColorScheme: 'light',
    colorSchemes: config
      ? {
          light: { palette: config.palette.light },
          dark: { palette: config.palette.dark },
        }
      : { light: true, dark: true },
    ...(config && {
      typography: config.typography,
      shape: config.shape,
      spacing: config.spacing,
    }),
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorDefault: ({ theme: t }) => ({
            backgroundColor: t.vars.palette.action.hover,
            borderBottom: `1px solid ${t.vars.palette.divider}`,
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.08)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.12)',
            },
            '& .MuiTouchRipple-child': {
              backgroundColor: 'var(--mui-palette-secondary-main)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 100,
            textTransform: 'none',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  });
}

export const theme = createAppTheme();
