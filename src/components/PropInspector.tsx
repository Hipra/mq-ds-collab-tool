'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { ComponentNode } from '@/lib/ast-inspector';

const KEY_PROPS = new Set(['variant', 'size', 'color', 'disabled']);

interface PropInspectorProps {
  node: ComponentNode | null;
}

/**
 * Key-value prop table for the selected component.
 *
 * Design decisions per CONTEXT.md locked decisions:
 * - Two columns: prop name | value
 * - Complex props (rawType 'expression') are expandable on click — shows value in
 *   a distinct monospace block; no re-parsing needed, the AST summary value is used
 * - Type-colored values: string=success, number=info, boolean=secondary, expression=text.secondary
 * - Shows source file location (filename + line number)
 * - Reset expanded props when selected component changes
 */
export function PropInspector({ node }: PropInspectorProps) {
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());

  // Reset expanded state when selected component changes
  useEffect(() => {
    setExpandedProps(new Set());
  }, [node?.id]);

  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select a component to inspect its props
        </Typography>
      </Box>
    );
  }

  const keyProps = node.props.filter(
    (p) =>
      KEY_PROPS.has(p.name) &&
      (p.rawType === 'string' || p.rawType === 'boolean'),
  );
  const otherProps = node.props.filter(
    (p) =>
      !(
        KEY_PROPS.has(p.name) &&
        (p.rawType === 'string' || p.rawType === 'boolean')
      ),
  );

  function togglePropExpansion(propName: string) {
    setExpandedProps((prev) => {
      const next = new Set(prev);
      if (next.has(propName)) {
        next.delete(propName);
      } else {
        next.add(propName);
      }
      return next;
    });
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Component name heading */}
      <Typography
        sx={{
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 600,
          color: 'text.primary',
          mb: 0.5,
        }}
      >
        {'<'}
        {node.componentName}
        {'>'}
      </Typography>

      {/* Key props table */}
      {keyProps.length > 0 && (
        <Box
          component="table"
          sx={{
            borderCollapse: 'collapse',
            fontFamily: 'monospace',
            fontSize: '12px',
            mb: 0.5,
          }}
        >
          <tbody>
            {keyProps.map((p) => (
              <Box component="tr" key={p.name}>
                <Box
                  component="td"
                  sx={{ pr: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}
                >
                  {p.name}:
                </Box>
                <Box component="td" sx={{ color: 'text.secondary' }}>
                  {p.rawType === 'boolean' ? 'true' : p.value.replace(/^"|"$/g, '')}
                </Box>
              </Box>
            ))}
          </tbody>
        </Box>
      )}


      {otherProps.length === 0 ? (
        node.props.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No props
          </Typography>
        ) : null
      ) : (
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          <tbody>
            {otherProps.map((prop) => {
              const isExpression = prop.rawType === 'expression';
              const isExpanded = isExpression && expandedProps.has(prop.name);

              return (
                <React.Fragment key={prop.name}>
                  <Box
                    component="tr"
                    onClick={isExpression ? () => togglePropExpansion(prop.name) : undefined}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: isExpression ? 'pointer' : 'default',
                    }}
                  >
                    {/* Prop name column */}
                    <Box
                      component="td"
                      sx={{
                        py: 0.25,
                        pr: 1,
                        color: 'text.secondary',
                        verticalAlign: 'top',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isExpression && (
                        <Box
                          component="span"
                          sx={{
                            mr: 0.5,
                            fontSize: '10px',
                            display: 'inline-block',
                            width: 12,
                          }}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </Box>
                      )}
                      {prop.name}
                    </Box>

                    {/* Prop value column */}
                    <Box
                      component="td"
                      sx={{
                        py: 0.25,
                        color:
                          prop.rawType === 'string'
                            ? 'success.main'
                            : prop.rawType === 'number'
                            ? 'info.main'
                            : prop.rawType === 'boolean'
                            ? 'secondary.main'
                            : 'text.secondary',
                        wordBreak: 'break-all',
                      }}
                    >
                      {isExpanded ? null : prop.value}
                    </Box>
                  </Box>

                  {/* Expanded expression block */}
                  {isExpanded && (
                    <Box component="tr">
                      <Box component="td" colSpan={2} sx={{ py: 0.5, pl: 3 }}>
                        <Box
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            bgcolor: 'action.hover',
                            borderRadius: 0.5,
                            p: 1,
                            color: 'text.secondary',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                          }}
                        >
                          {prop.value}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </Box>
      )}
    </Box>
  );
}
