import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required: prevents webpack from bundling esbuild's binary, which breaks path resolution.
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
  // Note: Do NOT use --turbopack in dev — open Next.js bug #83630 causes esbuild to fail with Turbopack.
  serverExternalPackages: ['esbuild'],
};

export default nextConfig;
