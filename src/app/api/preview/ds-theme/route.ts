import { build } from 'esbuild';

const DS_SRC = '/Users/gyorgybokros/Projects/memoq.web.design/src';

/**
 * GET /api/preview/ds-theme
 *
 * Bundles the memoQ Design System theme (palette, typography, shadows, component
 * styleOverrides) into a browser-ready ES module via esbuild.
 *
 * Component defaultProps and color hacks are NO LONGER injected here.
 * Prototypes now receive actual DS wrapper components (via /api/preview/ds-components),
 * so the wrappers themselves pass the correct props (e.g. color="secondary") to MUI.
 * The theme only needs to provide visual styleOverrides for internal MUI rendering
 * inside those wrappers.
 */

function buildEntry(): string {
  return `
import { createPalette } from './theme/palette';
import { createTypography } from './theme/typography';
import { createShadows } from './theme/shadows';
import * as allOverrides from './theme/components/styleoverrides';

const { MuiCssBaseline, ...componentOverrides } = allOverrides;

// MUI v7 fix: DS sets input padding via styleOverrides.root with a nested
// "& .MuiOutlinedInput-input" selector. In MUI v7, OutlinedInputInput is a
// separate styled component (slot: 'Input') whose variant styles inject AFTER
// the root nested selector — same specificity, later injection wins.
// Adding styleOverrides.input injects padding directly into that slot's styled
// definition, guaranteeing it applies last and correctly.
const muiOutlinedInputFixed = {
  ...componentOverrides.MuiOutlinedInput,
  styleOverrides: {
    ...componentOverrides.MuiOutlinedInput?.styleOverrides,
    input: ({ ownerState }) => {
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
};

export const dsThemeOptions = {
  palettes: {
    light: createPalette({ mode: 'light' }),
    dark: createPalette({ mode: 'dark' }),
  },
  components: { ...componentOverrides, MuiOutlinedInput: muiOutlinedInputFixed },
  typography: createTypography(),
  shadows: createShadows(),
};
`;
}

// Safe styleoverrides barrel — excludes date-picker components that import @mui/x-date-pickers.
// Those packages are not external in this bundle, and date pickers aren't used in prototypes.
const SAFE_STYLEOVERRIDES = `
export { MuiAccordion } from "./MuiAccordion";
export { MuiAccordionDetails } from "./MuiAccordionDetails";
export { MuiAccordionSummary } from "./MuiAccordionSummary";
export { MuiAlert } from "./MuiAlert";
export { MuiAppBar } from "./MuiAppBar";
export { MuiAutocomplete } from "./MuiAutocomplete";
export { MuiBackdrop } from "./MuiBackdrop";
export { MuiButton } from "./MuiButton";
export { MuiChip } from "./MuiChip";
export { MuiCssBaseline } from "./MuiCssBaseline";
export { MuiDialogActions } from "./MuiDialogActions";
export { MuiDialogContent } from "./MuiDialogContent";
export { MuiDialogContentText } from "./MuiDialogContentText";
export { MuiDialogTitle } from "./MuiDialogTitle";
export { MuiDrawer } from "./MuiDrawer";
export { MuiFormControlLabel } from "./MuiFormControlLabel";
export { MuiFormHelperText } from "./MuiFormHelperText";
export { MuiFormLabel } from "./MuiFormLabel";
export { MuiInputLabel } from "./MuiInputLabel";
export { MuiLink } from "./MuiLink";
export { MuiListSubheader } from "./MuiListSubheader";
export { MuiMenu } from "./MuiMenu";
export { MuiMenuItem } from "./MuiMenuItem";
export { MuiOutlinedInput } from "./MuiOutlinedInput";
export { MuiPaper } from "./MuiPaper";
export { MuiRadio } from "./MuiRadio";
export { MuiSelect } from "./MuiSelect";
export { MuiSwitch } from "./MuiSwitch";
export { MuiTab } from "./MuiTab";
export { MuiToggleButton } from "./MuiToggleButton";
export { MuiToggleButtonGroup } from "./MuiToggleButtonGroup";
export { MuiToolbar } from "./MuiToolbar";
export { MuiTooltip } from "./MuiTooltip";
export { MuiPagination } from "./MuiPagination";
export { MuiListItemAvatar } from "./MuiListItemAvatar";
export { MuiListItemButton } from "./MuiListItemButton";
export { MuiListItemIcon } from "./MuiListItemIcon";
export { MuiListItemText } from "./MuiListItemText";
export { MuiBadge } from "./MuiBadge";
`;

const stubAssetPlugin = {
  name: 'stub-assets',
  setup(build: import('esbuild').PluginBuild) {
    // Binary/font assets with query strings
    build.onResolve({ filter: /\.(ttf|woff|woff2|eot|svg|png|jpg)\?/ }, (args) => ({
      path: args.path,
      namespace: 'stub-asset',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-asset' }, () => ({
      contents: 'export default ""',
      loader: 'js',
    }));

    // Intercept styleoverrides barrel → exclude date-picker overrides that pull in @mui/x-date-pickers
    build.onLoad({ filter: /\/theme\/components\/styleoverrides\/index\.ts$/ }, (args) => {
      if (!args.path.includes('memoq.web.design')) return undefined;
      return { contents: SAFE_STYLEOVERRIDES, loader: 'ts' };
    });

    // Intercept @/theme barrel → minimal version (no MemoqDatePickerLocalizationProvider → @mui/x-date-pickers)
    build.onLoad({ filter: /\/theme\/index\.ts$/ }, (args) => {
      if (!args.path.includes('memoq.web.design')) return undefined;
      return {
        contents: [
          `export * from '${DS_SRC}/theme/utils';`,
          `export * from '${DS_SRC}/theme/typography';`,
          `export * from '${DS_SRC}/theme/shadows';`,
        ].join('\n'),
        loader: 'ts',
      };
    });
  },
};

let cachedBundle: string | null = null;

export async function GET() {
  if (!cachedBundle) {
    const result = await build({
      stdin: {
        contents: buildEntry(),
        resolveDir: DS_SRC,
        loader: 'ts',
      },
      bundle: true,
      format: 'esm',
      external: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/material/*',
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
      ],
      alias: {
        '@': DS_SRC,
        '@mui/material/colors': `${DS_SRC}/../node_modules/@mui/material/colors/index.js`,
      },
      plugins: [stubAssetPlugin],
      write: false,
      logLevel: 'silent',
    });

    cachedBundle = result.outputFiles[0].text;
  }

  return new Response(cachedBundle, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store',
    },
  });
}
