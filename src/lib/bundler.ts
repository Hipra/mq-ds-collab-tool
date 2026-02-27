import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Transpile a JSX prototype file to an ESM bundle using esbuild.
 *
 * Uses build() with stdin (NOT transform()) because transform() does not support
 * the `external` option. React and MUI are marked external so they are resolved
 * by the import map in the iframe HTML, not bundled into each prototype.
 */
export async function bundlePrototype(filePath: string): Promise<string> {
  const contents = await readFile(filePath, 'utf-8');

  // Handle missing default export — Claude Code sometimes generates named exports only.
  const normalizedContents = ensureDefaultExport(contents);

  const result = await esbuild.build({
    stdin: {
      contents: normalizedContents,
      loader: 'jsx',
      // resolveDir needed for relative imports within the prototype
      resolveDir: path.dirname(filePath),
    },
    bundle: true,
    // External: these are served via import map in the iframe (esm.sh CDN)
    // Marking them external ensures a single React instance (avoids hook errors)
    external: ['react', 'react-dom', 'react/jsx-runtime', '@mui/*', '@emotion/*'],
    format: 'esm',
    write: false,
    jsx: 'automatic',
    jsxImportSource: 'react',
  });

  return result.outputFiles[0].text;
}

/**
 * Check if the source has an `export default` statement.
 * If not, find the last top-level function/const component and append a default export.
 *
 * This handles Claude Code output variations where a default export may be missing.
 */
function ensureDefaultExport(source: string): string {
  // Check for any form of default export
  if (/export\s+default\s/.test(source)) {
    return source;
  }

  // Look for top-level function declarations: function ComponentName(
  const functionMatches = Array.from(source.matchAll(/^(?:export\s+)?function\s+([A-Z][A-Za-z0-9]*)\s*\(/gm));
  // Look for top-level const arrow/function declarations: const ComponentName =
  const constMatches = Array.from(source.matchAll(/^(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*=/gm));

  const allMatches = [...functionMatches, ...constMatches];

  if (allMatches.length === 0) {
    return source; // Cannot determine component name — let esbuild handle/fail
  }

  // Use the last top-level component declaration as the default export
  const lastMatch = allMatches[allMatches.length - 1];
  const componentName = lastMatch[1];

  console.warn(
    `[bundler] No default export found in prototype. Appending: export default ${componentName}`
  );

  return `${source}\nexport default ${componentName};\n`;
}
