/**
 * theme-config.ts — ThemeConfig type definition and MUI default values.
 *
 * Defines the shape of the global theme configuration that can be customized
 * via the Theme tab in the inspector panel. Covers palette (light + dark),
 * typography, shape, and spacing — no component overrides.
 */

export interface PaletteColor {
  light: string;
  main: string;
  dark: string;
  contrastText: string;
}

export interface PaletteConfig {
  common: { black: string; white: string };
  primary: PaletteColor;
  secondary: PaletteColor;
  error: PaletteColor;
  warning: PaletteColor;
  info: PaletteColor;
  success: PaletteColor;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string; disabled: string };
  divider: string;
  action: { active: string; hover: string; selected: string; disabled: string; disabledBackground: string };
}

export interface ThemeConfig {
  palette: {
    light: PaletteConfig;
    dark: PaletteConfig;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
  };
  shape: {
    borderRadius: number;
  };
  spacing: number;
}

/** MUI v6 default values — used as initial config and reset target. */
export const MUI_DEFAULTS: ThemeConfig = {
  palette: {
    light: {
      common: { black: '#000', white: '#fff' },
      primary: { light: '#42a5f5', main: '#1976d2', dark: '#1565c0', contrastText: '#fff' },
      secondary: { light: '#ba68c8', main: '#9c27b0', dark: '#7b1fa2', contrastText: '#fff' },
      error: { light: '#ef5350', main: '#d32f2f', dark: '#c62828', contrastText: '#fff' },
      warning: { light: '#ff9800', main: '#ed6c02', dark: '#e65100', contrastText: '#fff' },
      info: { light: '#03a9f4', main: '#0288d1', dark: '#01579b', contrastText: '#fff' },
      success: { light: '#4caf50', main: '#2e7d32', dark: '#1b5e20', contrastText: '#fff' },
      background: { default: '#fff', paper: '#fff' },
      text: { primary: 'rgba(0, 0, 0, 0.87)', secondary: 'rgba(0, 0, 0, 0.6)', disabled: 'rgba(0, 0, 0, 0.38)' },
      divider: 'rgba(0, 0, 0, 0.12)',
      action: { active: 'rgba(0, 0, 0, 0.54)', hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(0, 0, 0, 0.08)', disabled: 'rgba(0, 0, 0, 0.26)', disabledBackground: 'rgba(0, 0, 0, 0.12)' },
    },
    dark: {
      common: { black: '#000', white: '#fff' },
      primary: { light: '#e3f2fd', main: '#90caf9', dark: '#42a5f5', contrastText: 'rgba(0, 0, 0, 0.87)' },
      secondary: { light: '#f3e5f5', main: '#ce93d8', dark: '#ab47bc', contrastText: 'rgba(0, 0, 0, 0.87)' },
      error: { light: '#e57373', main: '#f44336', dark: '#d32f2f', contrastText: '#fff' },
      warning: { light: '#ffb74d', main: '#ffa726', dark: '#f57c00', contrastText: 'rgba(0, 0, 0, 0.87)' },
      info: { light: '#4fc3f7', main: '#29b6f6', dark: '#0288d1', contrastText: 'rgba(0, 0, 0, 0.87)' },
      success: { light: '#81c784', main: '#66bb6a', dark: '#388e3c', contrastText: 'rgba(0, 0, 0, 0.87)' },
      background: { default: '#121212', paper: '#121212' },
      text: { primary: '#fff', secondary: 'rgba(255, 255, 255, 0.7)', disabled: 'rgba(255, 255, 255, 0.5)' },
      divider: 'rgba(255, 255, 255, 0.12)',
      action: { active: '#fff', hover: 'rgba(255, 255, 255, 0.08)', selected: 'rgba(255, 255, 255, 0.16)', disabled: 'rgba(255, 255, 255, 0.3)', disabledBackground: 'rgba(255, 255, 255, 0.12)' },
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
};
