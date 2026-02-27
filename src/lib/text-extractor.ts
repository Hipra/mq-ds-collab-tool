import { parse } from '@babel/parser';
// @ts-expect-error — @babel/traverse ships without .d.ts in the version installed as a Next.js transitive dep
import _traverse from '@babel/traverse';

// Handle CJS default export interop for @babel/traverse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const traverse: (ast: any, visitors: any) => void = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

export interface TextEntry {
  key: string;             // stable: "ComponentName_line_col_propName"
  componentName: string;
  componentPath: string;   // "AppBar > Toolbar > Typography"
  propName: string;        // "children" | "label" | "placeholder" | "aria-label" | "helperText" | "title"
  category: 'visible' | 'placeholder' | 'accessibility';
  sourceValue: string;     // value from JSX source — never mutated
  currentValue: string;    // source value merged with overlay (set after merge)
  sourceLine: number;
  inspectorId: string;     // matches data-inspector-id format: "ComponentName_line_col"
}

const TEXT_PROP_CATEGORIES: Record<string, TextEntry['category']> = {
  children: 'visible',
  label: 'visible',
  helperText: 'visible',
  title: 'visible',
  placeholder: 'placeholder',
  'aria-label': 'accessibility',
};

function resolveJsxName(nameNode: any): string {
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  }
  if (nameNode.type === 'JSXMemberExpression') {
    return `${resolveJsxName(nameNode.object)}.${nameNode.property.name}`;
  }
  return 'Unknown';
}

/**
 * Extract all text entries from JSX/TSX source code.
 *
 * Finds text in:
 * - JSXAttribute StringLiteral values for text-bearing props
 *   (children, label, placeholder, aria-label, helperText, title)
 * - JSXText children with non-whitespace content
 *
 * Keys are stable: "ComponentName_line_col_propName"
 * Inspector IDs match data-inspector-id format: "ComponentName_line_col"
 */
export function extractTextEntries(sourceCode: string, filePath: string): TextEntry[] {
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  });

  const entries: TextEntry[] = [];
  // Stack of component names for building componentPath
  const pathStack: string[] = [];

  traverse(ast, {
    JSXElement: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enter(nodePath: any) {
        const opening = nodePath.node.openingElement;
        const nameNode = opening.name;

        // Only process uppercase (MUI/React) components
        const isUppercase =
          nameNode.type === 'JSXIdentifier' && /^[A-Z]/.test(nameNode.name);

        if (!isUppercase) {
          return;
        }

        const componentName = resolveJsxName(nameNode);
        const line = nodePath.node.loc?.start.line ?? 0;
        const col = nodePath.node.loc?.start.column ?? 0;
        const inspectorId = `${componentName}_${line}_${col}`;

        // Build path including this component
        pathStack.push(componentName);
        const componentPath = pathStack.join(' > ');

        // 1. Extract text from JSXAttribute StringLiteral values
        for (const attr of opening.attributes) {
          if (attr.type !== 'JSXAttribute') continue;

          const propName =
            attr.name.type === 'JSXIdentifier'
              ? attr.name.name
              : String(attr.name.name);

          if (!(propName in TEXT_PROP_CATEGORIES)) continue;

          const valueNode = attr.value;
          if (!valueNode) continue;

          if (valueNode.type === 'StringLiteral') {
            const sourceValue = valueNode.value;
            const key = `${componentName}_${line}_${col}_${propName}`;
            const category = TEXT_PROP_CATEGORIES[propName];

            entries.push({
              key,
              componentName,
              componentPath,
              propName,
              category,
              sourceValue,
              currentValue: sourceValue,
              sourceLine: line,
              inspectorId,
            });
          }
        }

        // 2. Extract JSXText children (non-whitespace)
        for (const child of nodePath.node.children) {
          if (child.type !== 'JSXText') continue;
          const text = child.value.trim();
          if (!text) continue;

          const childLine = child.loc?.start.line ?? line;
          const childCol = child.loc?.start.column ?? col;
          const key = `${componentName}_${childLine}_${childCol}_children`;

          entries.push({
            key,
            componentName,
            componentPath,
            propName: 'children',
            category: 'visible',
            sourceValue: text,
            currentValue: text,
            sourceLine: childLine,
            inspectorId,
          });
        }
      },
      exit(nodePath: any) {
        const opening = nodePath.node.openingElement;
        const nameNode = opening.name;
        const isUppercase =
          nameNode.type === 'JSXIdentifier' && /^[A-Z]/.test(nameNode.name);

        if (isUppercase) {
          pathStack.pop();
        }
      },
    },
  });

  return entries;
}
