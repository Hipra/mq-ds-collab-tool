import { prototypeComponentOverrides } from '@/lib/prototype-overrides';

/**
 * GET /api/preview/component-overrides
 *
 * Returns the MUI component overrides that should apply inside prototype iframes.
 * preview-bootstrap.js fetches this on startup so the iframe theme always reflects
 * whatever is defined in src/lib/prototype-overrides.ts — no manual syncing needed.
 */
export function GET() {
  return Response.json(prototypeComponentOverrides, {
    headers: {
      // No caching: always serve fresh overrides so prototype iframes pick up changes
      'Cache-Control': 'no-store',
    },
  });
}
