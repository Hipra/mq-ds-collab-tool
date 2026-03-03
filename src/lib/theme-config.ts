/**
 * theme-config.ts — ThemeConfig type definition and memoQ DS default values.
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

export interface GreyScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface PaletteConfig {
  common: { black: string; white: string };
  primary: PaletteColor;
  secondary: PaletteColor;
  error: PaletteColor;
  warning: PaletteColor;
  info: PaletteColor;
  success: PaletteColor;
  neutral: PaletteColor;
  grey: GreyScale;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string; disabled: string };
  divider: string;
  action: { active: string; hover: string; selected: string; disabled: string; disabledBackground: string };
}

export interface TypographyVariantStyle {
  fontSize: string;
  lineHeight: number;
  letterSpacing: string;
  fontWeight: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  [key: string]: unknown;
}

export interface ThemeConfig {
  palette: {
    light: PaletteConfig;
    dark: PaletteConfig;
  };
  /** MUI shadows tuple — 25 values, index = elevation level. */
  shadows?: string[];
  typography: {
    fontFamily: string;
    fontSize: number;
    h1?: TypographyVariantStyle;
    h2?: TypographyVariantStyle;
    h3?: TypographyVariantStyle;
    h4?: TypographyVariantStyle;
    h5?: TypographyVariantStyle;
    h6?: TypographyVariantStyle;
    subtitle1?: TypographyVariantStyle;
    subtitle2?: TypographyVariantStyle;
    body1?: TypographyVariantStyle;
    body2?: TypographyVariantStyle;
    button?: TypographyVariantStyle;
    caption?: TypographyVariantStyle;
    overline?: TypographyVariantStyle;
  };
  shape: {
    borderRadius: number;
  };
  spacing: number;
}

/** memoQ DS default values — used as initial config and reset target. */
export const MUI_DEFAULTS: ThemeConfig = {
  palette: {
    light: {
      common: { black: '#000000', white: '#ffffff' },
      // Source: memoq-semantic-color-tokens.md
      primary:   { light: '#FC914A', main: '#F47623', dark: '#DD6210', contrastText: '#ffffff' },
      secondary: { light: '#47A4FB', main: '#178CF6', dark: '#097AE2', contrastText: '#ffffff' },
      error:     { light: '#F85F5F', main: '#EF3F3F', dark: '#D52828', contrastText: '#ffffff' },
      warning:   { light: '#FEBC91', main: '#FC914A', dark: '#F47623', contrastText: '#ffffff' },
      info:      { light: '#178CF6', main: '#097AE2', dark: '#0363BF', contrastText: '#ffffff' },
      success:   { light: '#14C97B', main: '#09AE67', dark: '#059054', contrastText: '#ffffff' },
      neutral:   { light: '#4A4663', main: '#3B3751', dark: '#302D42', contrastText: '#ffffff' },
      // Grey scale = blueGray in light mode
      grey: {
        50:  '#FAFAFD',
        100: '#EDECF2',
        200: '#DAD8E4',
        300: '#C7C5D4',
        400: '#ACA9BD',
        500: '#86829D',
        600: '#615D7B',
        700: '#4A4663',
        800: '#3B3751',
        900: '#302D42',
      },
      background: { default: '#ffffff', paper: '#EDECF2' },
      text: {
        primary:   'rgba(59, 55, 81, 0.87)',
        secondary: 'rgba(59, 55, 81, 0.6)',
        disabled:  'rgba(59, 55, 81, 0.38)',
      },
      divider: 'rgba(59, 55, 81, 0.12)',
      action: {
        active:            'rgba(59, 55, 81, 0.54)',
        hover:             'rgba(59, 55, 81, 0.04)',
        selected:          'rgba(59, 55, 81, 0.08)',
        disabled:          'rgba(59, 55, 81, 0.26)',
        disabledBackground:'rgba(59, 55, 81, 0.12)',
      },
    },
    dark: {
      common: { black: '#000000', white: '#ffffff' },
      primary:   { light: '#FC914A', main: '#F47623', dark: '#DD6210', contrastText: '#ffffff' },
      secondary: { light: '#47A4FB', main: '#178CF6', dark: '#097AE2', contrastText: '#ffffff' },
      error:     { light: '#F85F5F', main: '#EF3F3F', dark: '#D52828', contrastText: '#ffffff' },
      warning:   { light: '#FEBC91', main: '#FC914A', dark: '#F47623', contrastText: '#ffffff' },
      info:      { light: '#178CF6', main: '#097AE2', dark: '#0363BF', contrastText: '#ffffff' },
      success:   { light: '#14C97B', main: '#09AE67', dark: '#059054', contrastText: '#ffffff' },
      neutral:   { light: '#393939', main: '#292929', dark: '#1F1F1F', contrastText: '#ffffff' },
      // Grey scale = neutral gray in dark mode
      grey: {
        50:  '#FAFAFA',
        100: '#F3F3F3',
        200: '#E3E3E3',
        300: '#CDCDCD',
        400: '#ADADAD',
        500: '#7F7F7F',
        600: '#595959',
        700: '#393939',
        800: '#292929',
        900: '#1F1F1F',
      },
      background: { default: '#292929', paper: '#1F1F1F' },
      text: {
        primary:   'rgba(255, 255, 255, 0.87)',
        secondary: 'rgba(255, 255, 255, 0.6)',
        disabled:  'rgba(255, 255, 255, 0.38)',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
      action: {
        active:            'rgba(255, 255, 255, 0.54)',
        hover:             'rgba(255, 255, 255, 0.04)',
        selected:          'rgba(255, 255, 255, 0.08)',
        disabled:          'rgba(255, 255, 255, 0.26)',
        disabledBackground:'rgba(255, 255, 255, 0.12)',
      },
    },
  },
  // Source: memoq-shadows.md — rgba(0,0,0,0.08), offsetY=n, blur=n*2
  shadows: [
    'none',
    'rgba(0, 0, 0, 0.08) 0px 1px 2px 0px',
    'rgba(0, 0, 0, 0.08) 0px 2px 4px 0px',
    'rgba(0, 0, 0, 0.08) 0px 3px 6px 0px',
    'rgba(0, 0, 0, 0.08) 0px 4px 8px 0px',
    'rgba(0, 0, 0, 0.08) 0px 5px 10px 0px',
    'rgba(0, 0, 0, 0.08) 0px 6px 12px 0px',
    'rgba(0, 0, 0, 0.08) 0px 7px 14px 0px',
    'rgba(0, 0, 0, 0.08) 0px 8px 16px 0px',
    'rgba(0, 0, 0, 0.08) 0px 9px 18px 0px',
    'rgba(0, 0, 0, 0.08) 0px 10px 20px 0px',
    'rgba(0, 0, 0, 0.08) 0px 11px 22px 0px',
    'rgba(0, 0, 0, 0.08) 0px 12px 24px 0px',
    'rgba(0, 0, 0, 0.08) 0px 13px 26px 0px',
    'rgba(0, 0, 0, 0.08) 0px 14px 28px 0px',
    'rgba(0, 0, 0, 0.08) 0px 15px 30px 0px',
    'rgba(0, 0, 0, 0.08) 0px 16px 32px 0px',
    'rgba(0, 0, 0, 0.08) 0px 17px 34px 0px',
    'rgba(0, 0, 0, 0.08) 0px 18px 36px 0px',
    'rgba(0, 0, 0, 0.08) 0px 19px 38px 0px',
    'rgba(0, 0, 0, 0.08) 0px 20px 40px 0px',
    'rgba(0, 0, 0, 0.08) 0px 21px 42px 0px',
    'rgba(0, 0, 0, 0.08) 0px 22px 44px 0px',
    'rgba(0, 0, 0, 0.08) 0px 23px 46px 0px',
    'rgba(0, 0, 0, 0.08) 0px 24px 48px 0px',
  ],
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    // Source: memoq-typography.md
    h1:        { fontSize: '3.75rem', lineHeight: 1.1,  letterSpacing: '-1.5px', fontWeight: 400 },
    h2:        { fontSize: '3rem',    lineHeight: 1.1,  letterSpacing: '-0.5px', fontWeight: 400 },
    h3:        { fontSize: '2.25rem', lineHeight: 1.15, letterSpacing: '0px',    fontWeight: 400 },
    h4:        { fontSize: '1.875rem',lineHeight: 1.2,  letterSpacing: '0.25px', fontWeight: 400 },
    h5:        { fontSize: '1.5rem',  lineHeight: 1.3,  letterSpacing: '0px',    fontWeight: 400 },
    h6:        { fontSize: '1.25rem', lineHeight: 1.4,  letterSpacing: '0.15px', fontWeight: 400 },
    subtitle1: { fontSize: '1rem',    lineHeight: 1.5,  letterSpacing: '0.15px', fontWeight: 400 },
    subtitle2: { fontSize: '0.875rem',lineHeight: 1.4,  letterSpacing: '0.15px', fontWeight: 600 },
    body1:     { fontSize: '0.875rem',lineHeight: 1.4,  letterSpacing: '0.15px', fontWeight: 400 },
    body2:     { fontSize: '0.75rem', lineHeight: 1.3,  letterSpacing: '0.4px',  fontWeight: 400 },
    button:    { fontSize: '0.875rem',lineHeight: 1.4,  letterSpacing: '0.15px', fontWeight: 600, textTransform: 'none' },
    caption:   { fontSize: '0.75rem', lineHeight: 1.3,  letterSpacing: '0.4px',  fontWeight: 400 },
    overline:  { fontSize: '0.75rem', lineHeight: 1.3,  letterSpacing: '0.4px',  fontWeight: 400, textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
};
