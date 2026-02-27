'use client';

import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ComponentNode } from '@/lib/ast-inspector';

interface ComponentTreeProps {
  tree: ComponentNode[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/**
 * Walk the component tree looking for a path from root to the target node.
 * Returns an array of ancestor IDs (inclusive of target), or null if not found.
 */
function findPathToNode(tree: ComponentNode[], targetId: string): string[] | null {
  for (const node of tree) {
    if (node.id === targetId) return [node.id];
    const childPath = findPathToNode(node.children, targetId);
    if (childPath) return [node.id, ...childPath];
  }
  return null;
}

/** Collect all node IDs in a tree into a flat Set (for initializing expandedSet). */
function collectAllIds(tree: ComponentNode[]): Set<string> {
  const ids = new Set<string>();
  function walk(nodes: ComponentNode[]) {
    for (const node of nodes) {
      ids.add(node.id);
      walk(node.children);
    }
  }
  walk(tree);
  return ids;
}

interface TreeNodeProps {
  node: ComponentNode;
  level: number;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  expandedSet: Set<string>;
  toggleExpand: (id: string) => void;
}

/**
 * Single tree node — renders the component tag and recursively renders children.
 *
 * Design decisions:
 * - Tag style similar to Chrome DevTools Elements panel — angle brackets + component name in primary color
 * - Expand/collapse arrow prefix when node has children
 * - Auto-scrolls into view when selected (from iframe click)
 * - Monospace font at 13px for dense, code-like appearance
 */
function TreeNode({
  node,
  level,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  expandedSet,
  toggleExpand,
}: TreeNodeProps) {
  const isSelected = selectedId === node.id;
  const isHovered = hoveredId === node.id;
  const isExpanded = expandedSet.has(node.id);
  const hasChildren = node.children.length > 0;
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  return (
    <>
      <Box
        ref={nodeRef}
        onClick={() => onSelect(node.id)}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        sx={{
          pl: level * 2,
          py: 0.25,
          cursor: 'pointer',
          bgcolor: isSelected
            ? 'action.selected'
            : isHovered
            ? 'action.hover'
            : 'transparent',
          '&:hover': {
            bgcolor: isSelected ? 'action.selected' : 'action.hover',
          },
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: '13px',
          userSelect: 'none',
          minHeight: 24,
        }}
      >
        {/* Expand/collapse icon */}
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpand(node.id);
          }}
          sx={{
            width: 16,
            flexShrink: 0,
            fontSize: '10px',
            color: 'text.secondary',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
        </Box>

        {/* Component name as tag */}
        <Typography
          component="span"
          sx={{
            fontFamily: 'monospace',
            fontSize: '13px',
            color: 'primary.main',
            lineHeight: 1.4,
          }}
        >
          {'<'}
          {node.componentName}
          {node.props.length > 0 ? (
            <Box component="span" sx={{ color: 'text.disabled', fontSize: '11px' }}>
              {' ...'}
            </Box>
          ) : null}
          {hasChildren ? '>' : ' />'}
        </Typography>
      </Box>

      {hasChildren && isExpanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            expandedSet={expandedSet}
            toggleExpand={toggleExpand}
          />
        ))}
    </>
  );
}

/**
 * Recursive MUI component tree, styled like Chrome DevTools Elements panel.
 *
 * - All nodes start expanded by default
 * - When selectedId changes (from iframe click), ancestors are auto-expanded and
 *   the node scrolls into view
 * - Expand/collapse is managed by a local Set<string> state
 */
export function ComponentTree({
  tree,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: ComponentTreeProps) {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() =>
    collectAllIds(tree)
  );

  // When tree changes (new prototype loaded), reset expanded state
  useEffect(() => {
    setExpandedSet(collectAllIds(tree));
  }, [tree]);

  // When selectedId changes from outside (iframe click), expand ancestors
  useEffect(() => {
    if (!selectedId) return;
    const path = findPathToNode(tree, selectedId);
    if (!path) return;
    setExpandedSet((prev) => {
      const next = new Set(prev);
      // Expand all ancestors (everything on path except the node itself)
      for (const id of path.slice(0, -1)) {
        next.add(id);
      }
      return next;
    });
  }, [selectedId, tree]);

  function toggleExpand(id: string) {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (tree.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No components found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 0.5 }}>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
          expandedSet={expandedSet}
          toggleExpand={toggleExpand}
        />
      ))}
    </Box>
  );
}
