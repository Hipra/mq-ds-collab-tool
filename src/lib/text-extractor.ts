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

// HTML elements that may carry visible text — processed alongside uppercase components.
const TEXT_BEARING_HTML_ELEMENTS = new Set([
  'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'b', 'i', 'small', 'label', 'a', 'li',
  'th', 'td', 'dt', 'dd', 'caption', 'figcaption',
]);

// Object property names treated as text in top-level data arrays.
const DATA_ARRAY_TEXT_PROPS = new Set([
  'label', 'title', 'text', 'description', 'heading', 'content',
  'placeholder', 'tooltip', 'caption', 'subtitle', 'name',
]);

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

        const isUppercase = nameNode.type === 'JSXIdentifier' && /^[A-Z]/.test(nameNode.name);
        const isTextBearingHtml = nameNode.type === 'JSXIdentifier' && TEXT_BEARING_HTML_ELEMENTS.has(nameNode.name);

        if (!isUppercase && !isTextBearingHtml) {
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
        const isUppercase = nameNode.type === 'JSXIdentifier' && /^[A-Z]/.test(nameNode.name);
        const isTextBearingHtml = nameNode.type === 'JSXIdentifier' && TEXT_BEARING_HTML_ELEMENTS.has(nameNode.name);

        if (isUppercase || isTextBearingHtml) {
          pathStack.pop();
        }
      },
    },

    // Extract string literals from top-level const array-of-objects declarations.
    // e.g. const TOOLBAR_ITEMS = [{ id: 'bold', label: 'Bold', ... }, ...]
    // Key format: "VARNAME_index_propName" (no line/col — distinguishable from JSX keys)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    VariableDeclaration(nodePath: any) {
      // Only process top-level declarations (direct children of Program)
      if (nodePath.parent?.type !== 'Program') return;

      for (const declarator of nodePath.node.declarations) {
        if (declarator.type !== 'VariableDeclarator') continue;
        if (declarator.id?.type !== 'Identifier') continue;
        if (declarator.init?.type !== 'ArrayExpression') continue;

        const varName: string = declarator.id.name;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        declarator.init.elements.forEach((element: any, index: number) => {
          if (!element || element.type !== 'ObjectExpression') return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const prop of element.properties) {
            if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') continue;
            const propName: string | null =
              prop.key?.type === 'Identifier' ? prop.key.name :
              prop.key?.type === 'StringLiteral' ? prop.key.value : null;
            if (!propName || !DATA_ARRAY_TEXT_PROPS.has(propName)) continue;
            if (prop.value?.type !== 'StringLiteral') continue;

            const sourceValue: string = prop.value.value;
            if (!sourceValue.trim()) continue;

            const key = `${varName}_${index}_${propName}`;
            entries.push({
              key,
              componentName: varName,
              componentPath: varName,
              propName,
              category: 'visible',
              sourceValue,
              currentValue: sourceValue,
              sourceLine: prop.value.loc?.start.line ?? 0,
              inspectorId: '', // data entries don't map to a single DOM element
            });
          }
        });
      }
    },
  });

  // Second pass: find the JSX render position of each data array variable.
  // TOOLBAR_ITEMS is defined at line ~20 but rendered at line ~87 via .map().
  // Use the render line for sorting so entries follow visual order, not definition order.
  const varRenderLines: Record<string, number> = {};
  traverse(ast, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JSXExpressionContainer(nodePath: any) {
      const expr = nodePath.node.expression;
      if (
        expr?.type === 'CallExpression' &&
        expr.callee?.type === 'MemberExpression' &&
        expr.callee.object?.type === 'Identifier' &&
        expr.callee.property?.name === 'map'
      ) {
        const varName: string = expr.callee.object.name;
        const line: number = nodePath.node.loc?.start.line ?? 0;
        if (line > 0 && !(varName in varRenderLines)) {
          varRenderLines[varName] = line;
        }
      }
    },
  });

  // Apply render lines to data array entries
  for (const entry of entries) {
    const parts = entry.key.split('_');
    if (parts.length >= 3) {
      const maybeLine = parseInt(parts[parts.length - 3], 10);
      if (isNaN(maybeLine)) {
        // Data array entry — update sourceLine to render position if found
        const varName = parts.slice(0, parts.length - 2).join('_');
        if (varRenderLines[varName]) {
          entry.sourceLine = varRenderLines[varName];
        }
      }
    }
  }

  return entries;
}
