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
    // Also supports nested arrays: const GROUPS = [[{ label: 'Bold' }], [{ label: 'Undo' }]]
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

        // Recursively collect all ObjectExpression nodes from potentially nested arrays
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function collectObjects(arrayExpr: any): any[] {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result: any[] = [];
          for (const el of arrayExpr.elements) {
            if (!el) continue;
            if (el.type === 'ObjectExpression') result.push(el);
            else if (el.type === 'ArrayExpression') result.push(...collectObjects(el));
          }
          return result;
        }

        const objects = collectObjects(declarator.init);

        objects.forEach((element: any, index: number) => {
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

  // Second pass: build alias map + find the JSX render position of each data array variable.
  //
  // Data arrays are often rendered via a derived variable, not directly. Common patterns:
  //   const ITEMS = [{...}]
  //   const ALL = ITEMS.flat()               → ALL aliases ITEMS
  //   const [items, setItems] = useState(ITEMS) → items aliases ITEMS
  //   const derived = ITEMS                  → derived aliases ITEMS
  //
  // We resolve these alias chains so that `items.map(...)` in JSX is attributed
  // to ITEMS, giving ITEMS entries the correct render line for visual sorting.
  const varRenderLines: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aliasMap: Record<string, string> = {};

  traverse(ast, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    VariableDeclarator(nodePath: any) {
      const id = nodePath.node.id;
      const init = nodePath.node.init;
      if (!init) return;

      // const X = Y  (simple alias)
      if (id.type === 'Identifier' && init.type === 'Identifier') {
        aliasMap[id.name] = init.name;
        return;
      }

      // const X = Y.flat() / Y.flat(n) / Y.slice() / Y.concat(...)
      if (
        id.type === 'Identifier' &&
        init.type === 'CallExpression' &&
        init.callee?.type === 'MemberExpression' &&
        init.callee.object?.type === 'Identifier' &&
        ['flat', 'slice', 'concat', 'filter', 'map'].includes(init.callee.property?.name)
      ) {
        aliasMap[id.name] = init.callee.object.name;
        return;
      }

      // const [X, setX] = useState(Y) / useReducer(fn, Y)
      if (
        id.type === 'ArrayPattern' &&
        id.elements[0]?.type === 'Identifier' &&
        init.type === 'CallExpression' &&
        init.callee?.type === 'Identifier' &&
        ['useState', 'useReducer'].includes(init.callee.name) &&
        init.arguments[0]?.type === 'Identifier'
      ) {
        aliasMap[id.elements[0].name] = init.arguments[0].name;
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JSXExpressionContainer(nodePath: any) {
      const expr = nodePath.node.expression;
      if (
        expr?.type === 'CallExpression' &&
        expr.callee?.type === 'MemberExpression' &&
        expr.callee.object?.type === 'Identifier' &&
        expr.callee.property?.name === 'map'
      ) {
        // Resolve alias chain: groups → TOOLBAR_GROUPS, items → ITEMS, etc.
        let varName: string = expr.callee.object.name;
        const seen = new Set<string>();
        while (aliasMap[varName] && !seen.has(varName)) {
          seen.add(varName);
          varName = aliasMap[varName];
        }
        const line: number = nodePath.node.loc?.start.line ?? 0;
        if (line > 0 && !(varName in varRenderLines)) {
          varRenderLines[varName] = line;
        }
      }
    },
  });

  // Apply render lines to data array entries.
  // If the render line was found (direct or via alias), use it for visual sorting.
  // If not found (uncommon indirect patterns), sort to the end — better than
  // sorting to the definition line which is always near the top of the file.
  for (const entry of entries) {
    const parts = entry.key.split('_');
    if (parts.length >= 3) {
      const maybeLine = parseInt(parts[parts.length - 3], 10);
      if (isNaN(maybeLine)) {
        const varName = parts.slice(0, parts.length - 2).join('_');
        entry.sourceLine = varRenderLines[varName] ?? Number.MAX_SAFE_INTEGER;
      }
    }
  }

  return entries;
}
