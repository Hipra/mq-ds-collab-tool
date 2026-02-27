import { parse } from '@babel/parser';
// @ts-expect-error — @babel/traverse ships without .d.ts in the version installed as a Next.js transitive dep
import _traverse from '@babel/traverse';
// @ts-expect-error — @babel/generator ships without .d.ts in the version installed as a Next.js transitive dep
import _generate from '@babel/generator';
import * as t from '@babel/types';

// Handle CJS default export interop for @babel/traverse and @babel/generator.
// These packages may export as { default: fn } when imported via ESM syntax from CJS modules.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const traverse: (ast: any, visitors: any) => void = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generate: (ast: any, opts?: any) => { code: string } = typeof _generate === 'function' ? _generate : (_generate as any).default;

/**
 * Babel pre-pass that injects `data-inspector-id` attributes onto all MUI (uppercase)
 * JSX components in the source file.
 *
 * This runs BEFORE esbuild so the data-* attributes are present in the compiled output.
 * React passes data-* props through to the DOM, where they appear as data-inspector-id
 * HTML attributes (accessible as element.dataset.inspectorId).
 *
 * ID format: `${componentName}_${line}_${col}` — unique per component within the file.
 *
 * @param sourceCode  JSX/TSX source code string
 * @param filePath    Path to the source file (used for error messages only)
 * @returns           Source code with data-inspector-id attributes injected
 */
export function injectInspectorIds(sourceCode: string, filePath: string): string {
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  });

  traverse(ast, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JSXOpeningElement(path: any) {
      const nameNode = path.node.name;

      // Skip lowercase (HTML) elements — only instrument MUI/capitalized components
      if (nameNode.type === 'JSXIdentifier' && /^[a-z]/.test(nameNode.name)) return;

      const componentName =
        nameNode.type === 'JSXIdentifier'
          ? nameNode.name
          : nameNode.type === 'JSXMemberExpression'
          ? `${(nameNode.object as any).name}.${nameNode.property.name}`
          : 'Unknown';

      const line = path.node.loc?.start.line ?? 0;
      const col = path.node.loc?.start.column ?? 0;
      const id = `${componentName}_${line}_${col}`;

      // Skip if already has data-inspector-id (idempotent)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasId = path.node.attributes.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (attr: any) => attr.type === 'JSXAttribute' && attr.name.name === 'data-inspector-id'
      );
      if (hasId) return;

      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier('data-inspector-id'),
          t.stringLiteral(id)
        )
      );
    },
  });

  const output = generate(ast, { retainLines: true });
  return output.code;
}
