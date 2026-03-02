import { createTheme } from '@mui/material/styles';
import type { ThemeConfig } from '@/lib/theme-config';
import { prototypeComponentOverrides } from '@/lib/prototype-overrides';

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
          light: { palette: { text: { primary: 'rgba(59, 55, 81, 0.87)' }, ...config.palette.light } },
          dark: { palette: config.palette.dark },
        }
      : {
          light: { palette: { text: { primary: 'rgba(59, 55, 81, 0.87)' } } },
          dark: true,
        },
    ...(config && {
      typography: config.typography,
      shape: config.shape,
      spacing: config.spacing,
    }),
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorDefault: ({ theme: t }) => ({
            color: t.vars.palette.text.primary,
            borderBottom: `1px solid ${t.vars.palette.divider}`,
            [t.getColorSchemeSelector('light')]: {
              backgroundColor: t.vars.palette.grey[100],
            },
            [t.getColorSchemeSelector('dark')]: {
              backgroundColor: t.vars.palette.grey[900],
            },
          }),
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
          [data-mui-color-scheme="light"] body {
            background-color: var(--mui-palette-grey-100);
          }
          [data-mui-color-scheme="dark"] body {
            background-color: var(--mui-palette-grey-900);
          }
        `,
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
      ...prototypeComponentOverrides,
    },
  });
}

export const theme = createAppTheme();
