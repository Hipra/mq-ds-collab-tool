import { createTheme } from '@mui/material/styles';

/**
 * Create the shared MUI theme with CSS variables and light/dark color schemes.
 *
 * Key decisions:
 * - cssVariables: true — mode switching does NOT cause component re-renders,
 *   only CSS variable values change. Required for the three-state toggle.
 * - colorSchemes: { light: true, dark: true } — enables MUI v6 native dark mode
 *   via useColorScheme() + setMode('light' | 'dark' | 'system').
 *
 * This function is used both by the app shell (Plan 02) and conceptually by the
 * iframe bootstrap (public/preview-bootstrap.js replicates the same config in vanilla JS).
 */
export function createAppTheme() {
  return createTheme({
    // colorSchemeSelector must match InitColorSchemeScript's attribute ("data-mui-color-scheme")
    // so the CSS selectors [data-mui-color-scheme="dark"] align with the HTML attribute
    // that the script sets before hydration.
    cssVariables: {
      colorSchemeSelector: 'data-mui-color-scheme',
    },
    defaultColorScheme: 'light',
    colorSchemes: {
      light: true,
      dark: true,
    },
  });
}

export const theme = createAppTheme();
