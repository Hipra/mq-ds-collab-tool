import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required: prevents webpack from bundling esbuild's binary, which breaks path resolution.
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
  // Note: Do NOT use --turbopack in dev — open Next.js bug #83630 causes esbuild to fail with Turbopack.
  serverExternalPackages: ['esbuild'],
  webpack: (config, { dev }) => {
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
    return config;
  },
};

export default nextConfig;
