'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import { useInspectorStore } from '@/stores/inspector';
import { ComponentTree } from '@/components/ComponentTree';
import { PropInspector } from '@/components/PropInspector';
import { CopyTab } from '@/components/CopyTab';
import type { ComponentNode } from '@/lib/ast-inspector';

/**
 * Tab panel that uses display:none (not unmount) to preserve scroll and state
 * when switching tabs.
 *
 * Pattern 4 from research: Using display:none avoids unmounting, which would
 * lose scroll position and local component state (expanded nodes, etc.).
 */
function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <Box
      role="tabpanel"
      sx={{
        display: value === index ? 'flex' : 'none',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
      }}
    >
      {children}
    </Box>
  );
}

/** Recursively search a ComponentNode tree for a node with the given id. */
function findNodeById(tree: ComponentNode[], id: string): ComponentNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

interface InspectorPanelProps {
  prototypeId: string;
}

/**
 * Right sidebar inspector panel with Copy and Components tabs.
 *
 * Design decisions per CONTEXT.md locked decisions:
 * - Fixed width 320px (matches VS Code default sidebar width)
 * - Uses display:none TabPanel for state-preserving tab switching
 * - Copy tab replaced with CopyTab component (Phase 3)
 * - Components tab shows ComponentTree (upper) + PropInspector (lower)
 * - Panel collapse/show is controlled by the toolbar ViewSidebar toggle
 * - Tree hover only highlights in tree (not iframe) for v1 simplicity
 *   (iframe hover highlights BOTH iframe overlay and tree via Zustand)
 */
export function InspectorPanel({ prototypeId }: InspectorPanelProps) {
  const {
    panelOpen,
    activeTab,
    setActiveTab,
    selectedComponentId,
    hoveredComponentId,
    componentTree,
    setSelectedComponent,
    setHoveredComponent,
  } = useInspectorStore();

  if (!panelOpen) {
    return null;
  }

  // Map string tab names to numeric indices for MUI Tabs
  const tabIndex = activeTab === 'copy' ? 0 : 1;

  function handleTabChange(_event: React.SyntheticEvent, newValue: number) {
    setActiveTab(newValue === 0 ? 'copy' : 'components');
  }

  const selectedNode = selectedComponentId
    ? findNodeById(componentTree, selectedComponentId)
    : null;

  return (
    <Box
      sx={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Tab header */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 36,
          flexShrink: 0,
        }}
      >
        <Tab label="Copy" sx={{ minHeight: 36, py: 0, fontSize: '13px' }} />
        <Tab label="Components" sx={{ minHeight: 36, py: 0, fontSize: '13px' }} />
      </Tabs>

      {/* Copy tab — Phase 3 copy editing */}
      <TabPanel value={tabIndex} index={0}>
        <CopyTab prototypeId={prototypeId} />
      </TabPanel>

      {/* Components tab — tree + prop inspector */}
      <TabPanel value={tabIndex} index={1}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Component tree — fills available space */}
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <ComponentTree
              tree={componentTree}
              selectedId={selectedComponentId}
              hoveredId={hoveredComponentId}
              onSelect={setSelectedComponent}
              onHover={setHoveredComponent}
            />
          </Box>

          {/* Prop inspector — shown only when a component is selected */}
          {selectedComponentId && (
            <>
              <Divider />
              <Box sx={{ maxHeight: '40%', overflow: 'auto', flexShrink: 0 }}>
                <PropInspector node={selectedNode} />
              </Box>
            </>
          )}
        </Box>
      </TabPanel>
    </Box>
  );
}
