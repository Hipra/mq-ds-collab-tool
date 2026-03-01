'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTheme } from '@mui/material/styles';
import type { Palette } from '@mui/material/styles';
import type { ComponentNode, PropEntry } from '@/lib/ast-inspector';
import { MEMOQ_COLOR_GROUPS } from '@/lib/memoq-tokens';

const KEY_PROPS = new Set(['variant', 'size', 'color', 'disabled']);

/** Components that must always have aria-label or aria-labelledby. */
const NEEDS_ARIA_LABEL = new Set(['IconButton', 'Fab', 'SpeedDial']);

function isAriaProp(p: PropEntry) {
  return p.name.startsWith('aria-') || p.name === 'role';
}

function hasA11yWarning(node: ComponentNode): boolean {
  if (!NEEDS_ARIA_LABEL.has(node.componentName)) return false;
  return !node.props.some((p) => p.name === 'aria-label' || p.name === 'aria-labelledby');
}

/** Reverse lookup: hex (uppercase) → token name */
const HEX_TO_TOKEN: Record<string, string> = {};
for (const group of MEMOQ_COLOR_GROUPS) {
  for (const t of group.tokens) {
    HEX_TO_TOKEN[t.hex.toUpperCase()] = t.token;
  }
}

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const PALETTE_KEYS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;

/** Strip surrounding quotes from a serialized prop value. */
function stripQuotes(v: string) {
  return v.replace(/^"|"$/g, '');
}

/** Render a color swatch + label for hex colors and MUI palette names. */
function ColorValue({ value }: { value: string }) {
  const theme = useTheme();
  const clean = stripQuotes(value);

  // MUI palette name (primary, secondary, etc.)
  if ((PALETTE_KEYS as readonly string[]).includes(clean)) {
    const hex = (theme.palette[clean as keyof Palette] as { main?: string })?.main;
    if (hex) {
      const token = HEX_TO_TOKEN[hex.toUpperCase()];
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              bgcolor: hex,
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          />
          <Box
            component="span"
            sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {clean} ({token ?? hex})
          </Box>
        </Box>
      );
    }
  }

  // Hex color
  if (HEX_RE.test(clean)) {
    const token = HEX_TO_TOKEN[clean.toUpperCase()];
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            bgcolor: clean,
            border: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        />
        <Box
          component="span"
          sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {token ? `${token} (${clean})` : clean}
        </Box>
      </Box>
    );
  }

  return <>{clean}</>;
}

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

  const ariaProps = node.props.filter(isAriaProp);
  const a11yWarn = hasA11yWarning(node);

  const keyProps = node.props.filter(
    (p) =>
      KEY_PROPS.has(p.name) &&
      (p.rawType === 'string' || p.rawType === 'boolean') &&
      !isAriaProp(p),
  );
  const otherProps = node.props.filter(
    (p) =>
      !(
        KEY_PROPS.has(p.name) &&
        (p.rawType === 'string' || p.rawType === 'boolean')
      ) && !isAriaProp(p),
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {'<'}
          {node.componentName}
          {'>'}
        </Typography>
        {a11yWarn && (
          <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
        )}
      </Box>

      {/* Key props table */}
      {keyProps.length > 0 && (
        <Box
          component="table"
          sx={{
            width: '100%',
            tableLayout: 'fixed',
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
                  sx={{ width: '40%', pr: 1, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {p.name}:
                </Box>
                <Box component="td" sx={{ width: '60%', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.rawType === 'boolean' ? 'true' : <ColorValue value={p.value} />}
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
            tableLayout: 'fixed',
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
                        width: '40%',
                        py: 0.25,
                        pr: 1,
                        color: 'text.secondary',
                        verticalAlign: 'top',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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
                      {prop.name}:
                    </Box>

                    {/* Prop value column */}
                    <Box
                      component="td"
                      sx={{
                        width: '60%',
                        py: 0.25,
                        color: 'text.secondary',
                        wordBreak: 'break-all',
                      }}
                    >
                      {isExpanded ? null : <ColorValue value={prop.value} />}
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

      {/* Accessibility section */}
      {(ariaProps.length > 0 || a11yWarn) && (
        <>
          <Divider sx={{ my: 0.75 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography
              sx={{ fontSize: '10px', fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Accessibility
            </Typography>
            {a11yWarn && <WarningAmberIcon sx={{ fontSize: 12, color: 'warning.main' }} />}
          </Box>

          {a11yWarn && (
            <Typography sx={{ fontSize: '11px', color: 'warning.main', mb: 0.5, fontFamily: 'monospace' }}>
              Missing aria-label
            </Typography>
          )}

          {ariaProps.length > 0 && (
            <Box
              component="table"
              sx={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              <tbody>
                {ariaProps.map((p) => (
                  <Box component="tr" key={p.name}>
                    <Box
                      component="td"
                      sx={{ width: '40%', pr: 1, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {p.name}:
                    </Box>
                    <Box component="td" sx={{ width: '60%', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.rawType === 'boolean' ? 'true' : stripQuotes(p.value)}
                    </Box>
                  </Box>
                ))}
              </tbody>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
