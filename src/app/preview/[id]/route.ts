import { NextRequest } from 'next/server';

/**
 * Preview route handler — returns a standalone HTML document for the prototype iframe.
 *
 * Why a Route Handler instead of page.tsx:
 * - Next.js App Router always wraps page.tsx output in the nearest layout's <html>/<body>
 * - The preview page needs to be a COMPLETELY standalone HTML document
 * - A Route Handler bypasses the layout system entirely, giving us full HTML control
 *
 * This HTML document is loaded inside an <iframe> by the main app shell.
 * It contains:
 * 1. An import map resolving React/MUI bare specifiers to esm.sh CDN URLs
 * 2. A <div id="root"> mount point
 * 3. The preview-bootstrap.js module script that:
 *    - Creates an Emotion cache pointing to THIS document's <head>
 *    - Creates a React root with ThemeProvider + CacheProvider + ErrorBoundary
 *    - Dynamically imports the prototype bundle from /api/preview/[id]/bundle
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bundleUrl = `/api/preview/${id}/bundle`;

  const importMap = JSON.stringify({
    imports: {
      react: 'https://esm.sh/react@19',
      'react/jsx-runtime': 'https://esm.sh/react@19/jsx-runtime',
      'react-dom': 'https://esm.sh/react-dom@19',
      'react-dom/client': 'https://esm.sh/react-dom@19/client',
      '@mui/material':
        'https://esm.sh/@mui/material@6?external=react,react-dom,@emotion/react,@emotion/styled',
      '@mui/material/styles':
        'https://esm.sh/@mui/material@6/styles?external=react,react-dom,@emotion/react,@emotion/styled',
      '@emotion/react': 'https://esm.sh/@emotion/react@11?external=react',
      '@emotion/styled':
        'https://esm.sh/@emotion/styled@11?external=react,@emotion/react',
      '@emotion/cache': 'https://esm.sh/@emotion/cache@11',
      'react-error-boundary':
        'https://esm.sh/react-error-boundary@5?external=react',
    },
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview: ${escapeHtml(id)}</title>
  <meta name="bundle-url" content="${escapeHtml(bundleUrl)}" />
  <script type="importmap">${importMap}</script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/preview-bootstrap.js"></script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Prevent caching so reloads always get a fresh page
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
