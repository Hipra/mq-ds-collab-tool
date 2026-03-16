import { createTheme } from '@mui/material/styles';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as dsOverrides from '../ds/safe-styleoverrides';

// DS theme functions — NormalModuleReplacementPlugin handles their @/ imports
// (e.g. @/colors → DS_SRC/colors, @/theme → safe-theme.ts, etc.)
import { createPalette } from '../../../memoq.web.design/src/theme/palette';
import { createTypography } from '../../../memoq.web.design/src/theme/typography';
import { createShadows } from '../../../memoq.web.design/src/theme/shadows';

/**
 * Create the shared MUI theme using DS palette, typography, and shadows
 * directly from the memoQ Design System source.
 *
 * CSS variables + colorSchemes mode is preserved so that useColorScheme()
 * (dark mode toggle) continues to work.
 */
export function createAppTheme() {
  return createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-mui-color-scheme',
    },
    defaultColorScheme: 'light',
    colorSchemes: {
      light: { palette: createPalette({ mode: 'light' }) },
      dark: { palette: createPalette({ mode: 'dark' }) },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadows: createShadows() as any,
    typography: createTypography(),
    components: {
      // DS styleOverrides — same set as /api/preview/ds-theme (esbuild route)
      ...dsOverrides,
      // MUI v7 fix: inject padding via the dedicated 'input' slot so it wins
      // over the DS root nested selector (same specificity, later injection wins).
      MuiOutlinedInput: {
        ...(dsOverrides.MuiOutlinedInput as object),
        styleOverrides: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(dsOverrides.MuiOutlinedInput as any)?.styleOverrides,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: ({ ownerState }: { ownerState: any }) => {
            const sm = ownerState.size === 'small';
            const hasStart = Boolean(ownerState.startAdornment);
            const hasEnd = Boolean(ownerState.endAdornment);
            if (sm) {
              if (hasStart && hasEnd) return { padding: '8px 0 8px 8px' };
              if (hasStart)           return { padding: '8px 12px 8px 8px' };
              if (hasEnd)             return { padding: '8px 0 8px 14px' };
              return { padding: '8px 14px' };
            }
            if (hasStart && hasEnd) return { padding: '10px 0 10px 8px' };
            if (hasStart)           return { padding: '10px 12px 10px 8px' };
            if (hasEnd)             return { padding: '10px 0 10px 14px' };
            return { padding: '10px 14px' };
          },
        },
      },
      // App shell overrides — take precedence over DS defaults
      MuiAppBar: {
        styleOverrides: {
          root: {
            // MUI dark mode applies: background-color: var(--mui-palette-AppBar-darkBg, var(--AppBar-background))
            // MUI sets darkBg = palette.background.paper which in our DS is gray[400] (#ADADAD) — way too light.
            // Override both variables so light AND dark use background.default.
            '--AppBar-background': '#1F1F1F',
            '--mui-palette-AppBar-darkBg': '#1F1F1F',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: 'none',
            color: '#fff',
            backgroundColor: '#1F1F1F',
            '& .MuiIconButton-root': { color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } },
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: '#fff' } },
            '& .MuiTabs-indicator': { backgroundColor: '#fff' },
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            '&.MuiToolbar-dense': {
              height: '40px',
              minHeight: '40px',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: 'var(--mui-palette-action-selected)',
              '&:hover': {
                backgroundColor: 'var(--mui-palette-action-hover)',
              },
            },
          },
        },
      },
    },
  });
}

export const theme = createAppTheme();
