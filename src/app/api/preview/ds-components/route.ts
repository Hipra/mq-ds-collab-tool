import { build } from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const DS_SRC = '/Users/gyorgybokros/Projects/memoq.web.design/src';
// Project root of memoq.web.design — @/assets resolves here (not to src/)
const DS_ROOT = path.dirname(DS_SRC);

/**
 * GET /api/preview/ds-components
 *
 * Bundles memoQ DS wrapper components into a browser-ready ES module and serves it
 * as the @mui/material replacement in the preview iframe importmap.
 *
 * When a prototype does `import { TextField } from '@mui/material'`, the importmap
 * redirects to this bundle, which returns the DS-wrapped TextField instead of raw MUI.
 * Components not wrapped by the DS fall through via `export * from '@mui/material'`,
 * which resolves to the real CDN URL via the importmap scope for this module's URL.
 *
 * Circular dependency is broken by the importmap scope:
 *   global:  @mui/material → /api/preview/ds-components
 *   scope /api/preview/ds-components: @mui/material → CDN URL
 *
 * This means:
 *   - Prototypes importing @mui/material → get DS wrappers ✓
 *   - DS bundle importing @mui/material internally → gets real CDN MUI ✓
 *   - Single MUI instance throughout ✓
 */

// Safe DS component exports — excludes components with MUI X premium dependencies:
//   Table         (@mui/x-data-grid-premium)
//   DateTimePickers (@mui/x-date-pickers-pro)
//   MuiXLicense   (@mui/x-license)
//   OnboardingTour (complex; rarely used in prototypes)
//
// Some DS components (e.g. TextField) import sibling components via `@/components`.
// The full @/components barrel re-exports Table/DateTimePickers (which pull in MUI X).
// We intercept the barrel in the plugin and replace it with this same safe list,
// breaking the chain before it reaches MUI X.
const SAFE_DS_EXPORTS = `
export { Accordion, AccordionActions, AccordionDetails, AccordionSummary } from './components/Accordion/Accordion';
export { default as Alert } from './components/Alert/Alert';
export { default as AppBar } from './components/AppBar/AppBar';
export { default as Autocomplete } from './components/Autocomplete/Autocomplete';
export { default as AutocompleteMultiple } from './components/Autocomplete/AutocompleteMultiple';
export { default as Avatar } from './components/Avatar/Avatar';
export { default as AvatarGroup } from './components/Avatar/AvatarGroup';
export { default as Banner } from './components/Banner/Banner';
export { default as Box } from './components/Box/Box';
export { default as Button } from './components/Button/Button';
export { default as Checkbox } from './components/Checkbox/Checkbox';
export { default as Chip } from './components/Chip/Chip';
export { default as Collapse } from './components/Collapse/Collapse';
export { Dialog } from './components/Dialog/Dialog';
export { DialogActions } from './components/Dialog/DialogActions';
export { DialogContent } from './components/Dialog/DialogContent';
export { DialogContentText } from './components/Dialog/DialogContentText';
export { default as DialogTitle } from './components/Dialog/DialogTitle';
export { default as Divider } from './components/Divider/Divider';
export { default as Drawer } from './components/Drawer/Drawer';
export { default as Fade } from './components/Fade/Fade';
export { default as FormLabel } from './components/FormLabel/FormLabel';
export { default as Grid } from './components/Grid/Grid';
export { default as Grow } from './components/Grow/Grow';
export { default as Icon } from './components/Icon/Icon';
export { default as Illustration } from './components/Illustration/Illustration';
export { default as Link } from './components/Link/Link';
export { default as Menu } from './components/Menu/Menu';
export { default as MenuItem } from './components/Menu/MenuItem';
export { default as NestedMenuItem } from './components/Menu/NestedMenuItem';
export { default as Pagination } from './components/Pagination/Pagination';
export { default as TablePagination } from './components/Pagination/TablePagination';
export { default as PaginationItem } from './components/PaginationItem/PaginationItem';
export { default as Paper } from './components/Paper/Paper';
export { default as Progress } from './components/Progress/Progress';
export { default as Radio } from './components/Radio/Radio';
export { default as RadioGroup } from './components/RadioGroup/RadioGroup';
export { default as Select } from './components/Select/Select';
export { default as SelectMultiple } from './components/Select/SelectMultiple';
export { default as Skeleton } from './components/Skeleton/Skeleton';
export { default as Slide } from './components/Slide/Slide';
export { default as Snackbar } from './components/Snackbar/Snackbar';
export { default as Stack } from './components/Stack/Stack';
export { default as Switch } from './components/Switch/Switch';
export { default as Tab } from './components/Tab/Tab';
export { default as Tabs } from './components/Tabs/Tabs';
export { default as TextField } from './components/TextField/TextField';
export { default as ToggleButton } from './components/ToggleButton/ToggleButton';
export { default as ToggleButtonGroup } from './components/ToggleButtonGroup/ToggleButtonGroup';
export { default as Tooltip } from './components/Tooltip/Tooltip';
export { default as TransitionGroup } from './components/TransitionGroup/TransitionGroup';
export { default as Typography } from './components/Typography/Typography';
export { default as Zoom } from './components/Zoom/Zoom';
`;

// Entry: MUI fallback first, DS wrappers second (named exports take precedence over * per ES spec)
const ENTRY = `export * from '@mui/material';\n${SAFE_DS_EXPORTS}`;

// ─── Stub plugin ──────────────────────────────────────────────────────────────
function makeStubPlugin(dsSrc: string): import('esbuild').Plugin {
  // Safe DS components barrel contents — same as SAFE_DS_EXPORTS but resolved to absolute paths.
  // Replaces the full @/components/index.ts which would pull in Table/DateTimePickers → MUI X.
  const safeComponentsBarrel = SAFE_DS_EXPORTS
    .replace(/from '\.\/components\//g, `from '${dsSrc}/components/`);

  // Minimal @/theme barrel — replaces the full index.ts which re-exports
  // MemoqDatePickerLocalizationProvider → @mui/x-date-pickers → trouble.
  // Components only need: makeSx, memoqFontWeights, text*/createShadows from typography/shadows.
  const safeThemeBarrel = [
    `export * from '${dsSrc}/theme/utils';`,
    `export * from '${dsSrc}/theme/typography';`,
    `export * from '${dsSrc}/theme/shadows';`,
  ].join('\n');

  return {
    name: 'ds-stub',
    setup(build) {
      // SVG?react (Vite SVGR) → real React component rendered via dangerouslySetInnerHTML.
      // The DS uses MuiSvgIcon component={SvgComponent} which renders the SVG as root element;
      // we strip children/ownerState props that MUI passes so they don't conflict with innerHTML.
      build.onResolve({ filter: /\.svg(\?|$)/ }, (args) => {
        let svgPath = args.path.replace(/\?.*$/, ''); // strip ?react query
        // Apply Vite aliases: @/assets → DS_ROOT/assets (more specific first), @/ → DS_SRC/
        if (svgPath.startsWith('@/assets/')) {
          svgPath = path.join(DS_ROOT, 'assets', svgPath.slice('@/assets/'.length));
        } else if (svgPath.startsWith('@/')) {
          svgPath = path.join(dsSrc, svgPath.slice('@/'.length));
        } else if (!path.isAbsolute(svgPath)) {
          svgPath = path.resolve(args.resolveDir, svgPath);
        }
        return { path: svgPath, namespace: 'svg-react' };
      });
      build.onLoad({ filter: /.*/, namespace: 'svg-react' }, (args) => {
        let content = '';
        try {
          content = fs.readFileSync(args.path, 'utf8');
        } catch {
          return { contents: 'export default function SvgStub() { return null; }', loader: 'js' };
        }
        const viewBox = content.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24';
        const inner = content
          .replace(/<\?xml[^>]*>\s*/g, '')
          .replace(/<!DOCTYPE[^>]*>\s*/g, '')
          .replace(/<svg[^>]*>/, '')
          .replace(/<\/svg>\s*$/, '')
          .trim();
        const code = `import { createElement } from 'react';
var _html = ${JSON.stringify(inner)};
export default function SvgComponent({ children, title, titleAccess, ownerState, focusable, ...props }) {
  return createElement('svg', Object.assign({ viewBox: ${JSON.stringify(viewBox)}, xmlns: "http://www.w3.org/2000/svg", focusable: "false" }, props, { dangerouslySetInnerHTML: { __html: _html } }));
}`;
        return { contents: code, loader: 'js' };
      });
      // Binary/font assets with query strings → empty stub
      build.onResolve({ filter: /\.(ttf|woff|woff2|eot|png|jpg)\?/ }, (args) => ({
        path: args.path,
        namespace: 'stub-asset',
      }));
      build.onLoad({ filter: /.*/, namespace: 'stub-asset' }, () => ({
        contents: 'export default ""',
        loader: 'js',
      }));

      // Patch DS Button to accept React elements as startIcon/endIcon (MUI-standard API),
      // in addition to the DS-native string icon-type API.
      build.onLoad({ filter: /\/Button\/Button\.tsx$/ }, (args) => {
        if (!args.path.includes('memoq.web.design')) return undefined;
        const src = fs.readFileSync(args.path, 'utf8');
        const patched = src
          .replace(
            '<Icon color={disabled ? "disabled" : "inherit"} size={size} type={endIcon} />',
            'typeof endIcon === "string" ? <Icon color={disabled ? "disabled" : "inherit"} size={size} type={endIcon} /> : endIcon'
          )
          .replace(
            '<Icon color={disabled ? "disabled" : "inherit"} size={size} type={startIcon} />',
            'typeof startIcon === "string" ? <Icon color={disabled ? "disabled" : "inherit"} size={size} type={startIcon} /> : startIcon'
          );
        return { contents: patched, loader: 'tsx' };
      });

      // Intercept @/components barrel → safe-only version (no Table/DateTimePickers)
      build.onLoad({ filter: /\/components\/index\.ts$/ }, (args) => {
        if (!args.path.includes('memoq.web.design')) return undefined;
        return { contents: safeComponentsBarrel, loader: 'ts' };
      });

      // Intercept @/theme barrel → minimal version (no MemoqDatePickerLocalizationProvider)
      build.onLoad({ filter: /\/theme\/index\.ts$/ }, (args) => {
        if (!args.path.includes('memoq.web.design')) return undefined;
        return { contents: safeThemeBarrel, loader: 'ts' };
      });
    },
  };
}

let cachedBundle: string | null = null;

export async function GET() {
  if (!cachedBundle) {
    const result = await build({
      stdin: {
        contents: ENTRY,
        resolveDir: DS_SRC,
        loader: 'ts',
      },
      bundle: true,
      format: 'esm',
      // @mui/material (bare) → external, resolved to CDN via importmap scope
      // @mui/material/* → external, resolved via global importmap (colors, Badge, locale…)
      // @mui/utils → external, resolved via global importmap
      // All MUI X packages → external, resolved to stubs via importmap scope
      external: [
        'react',
        'react-dom',
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        '@mui/material',
        '@mui/material/*',
        '@mui/utils',
        '@mui/x-data-grid',
        '@mui/x-data-grid/*',
        '@mui/x-data-grid-premium',
        '@mui/x-data-grid-premium/*',
        '@mui/x-date-pickers',
        '@mui/x-date-pickers/*',
        '@mui/x-date-pickers-pro',
        '@mui/x-date-pickers-pro/*',
        '@mui/x-license',
      ],
      alias: {
        // Order matters: more specific prefix first so @/assets doesn't fall through to @/→src
        '@/assets': path.join(DS_ROOT, 'assets'),
        '@': DS_SRC,
      },
      plugins: [makeStubPlugin(DS_SRC)],
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
