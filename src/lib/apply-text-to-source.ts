import { parse } from '@babel/parser';
// @ts-expect-error — @babel/traverse ships without .d.ts in the version installed as a Next.js transitive dep
import _traverse from '@babel/traverse';

// Handle CJS default export interop for @babel/traverse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const traverse: (ast: any, visitors: any) => void = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

interface TextEdit {
  key: string;      // "ComponentName_line_col_propName"
  propName: string;
  newValue: string;
}

interface Replacement {
  start: number;
  end: number;
  newText: string;
}

function resolveJsxName(nameNode: any): string {
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') {
    return `${resolveJsxName(nameNode.object)}.${nameNode.property.name}`;
  }
  return 'Unknown';
}

/**
 * Parse an entry key back into its constituent parts.
 * Key format: "ComponentName_line_col_propName"
 * Note: ComponentName itself can contain dots (e.g. "ListItem.Icon")
 * but never underscores in MUI components, and line/col are numeric.
 * We parse from the end: last segment = propName, second-to-last = col, third-to-last = line, rest = componentName.
 */
function parseKey(key: string): { componentName: string; line: number; col: number; propName: string } | null {
  const parts = key.split('_');
  if (parts.length < 4) return null;
  const propName = parts[parts.length - 1];
  const col = parseInt(parts[parts.length - 2], 10);
  const line = parseInt(parts[parts.length - 3], 10);
  const componentName = parts.slice(0, parts.length - 3).join('_');
  if (isNaN(line) || isNaN(col)) return null;
  return { componentName, line, col, propName };
}

const TEXT_PROPS = new Set(['children', 'label', 'placeholder', 'aria-label', 'helperText', 'title']);

/**
 * Apply text edits to JSX source code using Babel AST for location matching
 * and string slicing for replacement (preserving original formatting).
 */
export function applyTextEditsToSource(source: string, edits: TextEdit[]): string {
  if (edits.length === 0) return source;

  // Build a lookup from "componentName_line_col_propName" -> newValue
  const editMap = new Map<string, string>();
  for (const edit of edits) {
    editMap.set(edit.key, edit.newValue);
  }

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  });

  const replacements: Replacement[] = [];

  traverse(ast, {
    JSXElement: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enter(nodePath: any) {
        const opening = nodePath.node.openingElement;
        const nameNode = opening.name;
        const isUppercase = nameNode.type === 'JSXIdentifier' && /^[A-Z]/.test(nameNode.name);
        if (!isUppercase) return;

        const componentName = resolveJsxName(nameNode);
        const line = nodePath.node.loc?.start.line ?? 0;
        const col = nodePath.node.loc?.start.column ?? 0;

        // Check StringLiteral props
        for (const attr of opening.attributes) {
          if (attr.type !== 'JSXAttribute') continue;
          const propName = attr.name.type === 'JSXIdentifier' ? attr.name.name : String(attr.name.name);
          if (!TEXT_PROPS.has(propName)) continue;

          const valueNode = attr.value;
          if (!valueNode || valueNode.type !== 'StringLiteral') continue;

          const key = `${componentName}_${line}_${col}_${propName}`;
          const newValue = editMap.get(key);
          if (newValue === undefined) continue;

          // Replace only the string content (between quotes), not the quotes themselves
          // StringLiteral node start/end includes the quotes
          replacements.push({
            start: valueNode.start! + 1,
            end: valueNode.end! - 1,
            newText: newValue,
          });
        }

        // Check JSXText children
        for (const child of nodePath.node.children) {
          if (child.type !== 'JSXText') continue;
          const trimmed = child.value.trim();
          if (!trimmed) continue;

          const childLine = child.loc?.start.line ?? line;
          const childCol = child.loc?.start.column ?? col;
          const key = `${componentName}_${childLine}_${childCol}_children`;
          const newValue = editMap.get(key);
          if (newValue === undefined) continue;

          // Find the trimmed text within the raw JSXText node to preserve surrounding whitespace
          const raw = child.value as string;
          const trimStart = raw.indexOf(trimmed);
          if (trimStart === -1) continue;

          replacements.push({
            start: child.start! + trimStart,
            end: child.start! + trimStart + trimmed.length,
            newText: newValue,
          });
        }
      },
    },
  });

  if (replacements.length === 0) return source;

  // Sort descending by start position so earlier replacements don't shift later ones
  replacements.sort((a, b) => b.start - a.start);

  let result = source;
  for (const rep of replacements) {
    result = result.slice(0, rep.start) + rep.newText + result.slice(rep.end);
  }

  return result;
}
