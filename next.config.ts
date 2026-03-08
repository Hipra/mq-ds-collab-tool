import type { NextConfig } from 'next';
import path from 'path';

// Absolute path to memoQ Design System source.
// Mirrors the same constant used in the esbuild API routes.
const DS_SRC = '/Users/gyorgybokros/Projects/memoq.web.design/src';

const nextConfig: NextConfig = {
  // Required: prevents webpack from bundling esbuild's binary, which breaks path resolution.
  // Note: Do NOT use --turbopack in dev — open Next.js bug #83630 causes esbuild to fail with Turbopack.
  serverExternalPackages: ['esbuild'],

  webpack: (config, { dev, webpack }) => {
    if (dev) {
      // Exclude prototypes/ from webpack file watching so edits written by
      // the approve endpoint don't trigger a full-page HMR reload.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
          '**/prototypes/**',
        ],
      };
    }

    // ── DS component integration ──────────────────────────────────────────────
    //
    // @memoq/memoq.web.design is NOT in node_modules (private registry, local source).
    // We resolve it via alias to src/ds/index.ts (our safe component barrel).
    // DS component source files use @/ aliases and Vite-specific imports internally;
    // the NormalModuleReplacementPlugin below rewrites those to safe equivalents.

    // ── Singleton aliases ─────────────────────────────────────────────────────
    //
    // DS has its own node_modules with separate @mui/* and @emotion/* instances.
    // Without these aliases DS wrapper components (Button, Chip, AppBar…) receive
    // a different MUI ThemeContext than the shell ThemeProvider and fall back to
    // the default blue MUI theme.
    //
    // Global resolve.alias is safe for @mui/* and @emotion/* because Next.js does
    // not import these packages internally.  react/react-dom are handled separately
    // via a context-specific NormalModuleReplacementPlugin (global react alias would
    // break Next.js devtools because the shell uses React 19 while Next.js expects
    // its own React 19 internal module; see earlier "Invalid hook call" crash).
    config.resolve.alias = {
      ...config.resolve.alias,
      '@memoq/memoq.web.design': path.resolve(process.cwd(), 'src/ds/index.ts'),
      '@mui/material':        path.resolve(process.cwd(), 'node_modules/@mui/material'),
      '@mui/system':          path.resolve(process.cwd(), 'node_modules/@mui/system'),
      '@mui/utils':           path.resolve(process.cwd(), 'node_modules/@mui/utils'),
      '@mui/styled-engine':   path.resolve(process.cwd(), 'node_modules/@mui/styled-engine'),
      '@mui/private-theming': path.resolve(process.cwd(), 'node_modules/@mui/private-theming'),
      '@emotion/react':       path.resolve(process.cwd(), 'node_modules/@emotion/react'),
      '@emotion/styled':      path.resolve(process.cwd(), 'node_modules/@emotion/styled'),
      '@emotion/cache':       path.resolve(process.cwd(), 'node_modules/@emotion/cache'),
    };

    // Rewrite @/ imports inside DS source files so webpack can resolve them.
    // Three special cases:
    //   @/icons      → null stub (shell uses MqIcon; avoids 200+ SVG?react imports)
    //   @/theme      → safe theme barrel (avoids MemoqDatePickerLocalizationProvider)
    //   @/components → custom stub barrel (avoids @mui/x-* deps + patches Icon for React elements)
    //   @/anything   → DS_SRC/anything (straight path rewrite)
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@\//,
        (resource: { context?: string; request: string }) => {
          if (!resource.context?.includes('memoq.web.design')) return;

          const subpath = resource.request.slice(2); // strip leading '@/'

          if (subpath === 'icons') {
            resource.request = path.resolve(process.cwd(), 'src/ds/icons-stub.ts');
          } else if (subpath === 'theme' || subpath === 'theme/index' || subpath === 'theme/index.ts') {
            resource.request = path.resolve(process.cwd(), 'src/ds/safe-theme.ts');
          } else if (
            subpath === 'components' ||
            subpath === 'components/index' ||
            subpath === 'components/index.ts'
          ) {
            resource.request = path.resolve(process.cwd(), 'src/ds/safe-components-internal.ts');
          } else {
            resource.request = path.join(DS_SRC, subpath);
          }
        }
      )
    );


    // SVG files from DS source (safety net in case any slip past the @/icons stub).
    // Returns the raw SVG string as a module; DS components won't crash if they hit this.
    config.module.rules.unshift({
      test: /\.svg$/,
      issuer: { and: [/memoq\.web\.design/] },
      type: 'asset/source',
    });

    return config;
  },
};

export default nextConfig;
