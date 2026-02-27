import { parse } from '@babel/parser';
// @ts-expect-error — @babel/traverse ships without .d.ts in the version installed as a Next.js transitive dep
import _traverse from '@babel/traverse';

// Handle CJS default export interop for @babel/traverse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const traverse: (ast: any, visitors: any) => void = typeof _traverse === 'function' ? _traverse : (_traverse as any).default;

export interface PropEntry {
  name: string;
  value: string;
  rawType: 'string' | 'number' | 'boolean' | 'expression' | 'spread';
}

export interface ComponentNode {
  id: string;
  componentName: string;
  props: PropEntry[];
  sourceFile: string;
  sourceLine: number;
  children: ComponentNode[];
}

function resolveJsxName(nameNode: any): string {
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  }
  if (nameNode.type === 'JSXMemberExpression') {
    return `${resolveJsxName(nameNode.object)}.${nameNode.property.name}`;
  }
  return 'Unknown';
}

function serializePropValue(valueNode: any): { value: string; rawType: PropEntry['rawType'] } {
  if (!valueNode) {
    // Boolean shorthand: <Button disabled />
    return { value: 'true', rawType: 'boolean' };
  }

  if (valueNode.type === 'StringLiteral') {
    return { value: `"${valueNode.value}"`, rawType: 'string' };
  }

  if (valueNode.type === 'JSXExpressionContainer') {
    const expr = valueNode.expression;

    if (expr.type === 'NumericLiteral') {
      return { value: String(expr.value), rawType: 'number' };
    }

    if (expr.type === 'BooleanLiteral') {
      return { value: String(expr.value), rawType: 'boolean' };
    }

    if (expr.type === 'StringLiteral') {
      return { value: `"${expr.value}"`, rawType: 'string' };
    }

    if (expr.type === 'ObjectExpression') {
      return { value: '{...}', rawType: 'expression' };
    }

    if (expr.type === 'ArrayExpression') {
      return { value: `[${expr.elements.length} items]`, rawType: 'expression' };
    }

    if (
      expr.type === 'ArrowFunctionExpression' ||
      expr.type === 'FunctionExpression'
    ) {
      return { value: '() => ...', rawType: 'expression' };
    }

    return { value: '{...}', rawType: 'expression' };
  }

  return { value: '{...}', rawType: 'expression' };
}

/**
 * Parse JSX/TSX source code and extract a tree of MUI (capitalized) component nodes.
 *
 * Key design decisions:
 * - Only components starting with an uppercase letter are included (MUI convention)
 * - HTML elements (div, span, etc.) are transparently traversed — their MUI children
 *   are still collected into the nearest MUI ancestor
 * - The stack stores references to the current parent's children array
 *   so HTML elements push the SAME parent ref (not a new placeholder)
 */
export function extractComponentTree(sourceCode: string, filePath: string): ComponentNode[] {
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  });

  // Stack of child arrays. Start with a root array that captures top-level MUI nodes.
  const root: ComponentNode[] = [];
  const stack: ComponentNode[][] = [root];

  traverse(ast, {
    JSXElement: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enter(path: any) {
        const opening = path.node.openingElement;
        const nameNode = opening.name;

        const isHtml =
          nameNode.type === 'JSXIdentifier' && /^[a-z]/.test(nameNode.name);

        if (isHtml) {
          // Push the SAME parent ref — MUI children inside HTML elements
          // are collected into the nearest MUI ancestor
          stack.push(stack[stack.length - 1]);
          return;
        }

        const componentName = resolveJsxName(nameNode);
        const line = path.node.loc?.start.line ?? 0;
        const col = path.node.loc?.start.column ?? 0;
        const id = `${componentName}_${line}_${col}`;

        const props: PropEntry[] = [];

        for (const attr of opening.attributes) {
          if (attr.type === 'JSXSpreadAttribute') {
            props.push({ name: '...spread', value: '{...}', rawType: 'spread' });
          } else if (attr.type === 'JSXAttribute') {
            const name =
              attr.name.type === 'JSXIdentifier'
                ? attr.name.name
                : String(attr.name.name);
            const { value, rawType } = serializePropValue(attr.value);
            props.push({ name, value, rawType });
          }
        }

        const node: ComponentNode = {
          id,
          componentName,
          props,
          sourceFile: filePath,
          sourceLine: line,
          children: [],
        };

        // Add to current parent
        stack[stack.length - 1].push(node);
        // Push this node's children array as the new parent
        stack.push(node.children);
      },
      exit() {
        stack.pop();
      },
    },
  });

  return root;
}
