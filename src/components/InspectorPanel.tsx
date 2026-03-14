'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { ToggleButton, ToggleButtonGroup, Divider } from '@memoq/memoq.web.design';
import { useInspectorStore } from '@/stores/inspector';
import { ComponentTree } from '@/components/ComponentTree';
import { PropInspector } from '@/components/PropInspector';
import { CopyTab } from '@/components/CopyTab';
import { ThemeTab } from '@/components/ThemeTab';
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

type TabName = 'components' | 'copy' | 'theme';

const ALL_TABS: TabName[] = ['copy', 'components', 'theme'];

interface InspectorPanelProps {
  prototypeId: string;
  /** Which tabs to show. Defaults to all three. */
  tabs?: TabName[];
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
 * - tabs prop: pass a subset to hide unwanted tabs (e.g. template page shows only 'components')
 */
export function InspectorPanel({ prototypeId, tabs = ALL_TABS }: InspectorPanelProps) {
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

  // Index within the visible tabs list; fall back to 0 if active tab is not shown
  const visibleTabIndex = tabs.includes(activeTab) ? tabs.indexOf(activeTab) : 0;

  function handleTabChange(_event: React.SyntheticEvent, newValue: number) {
    setActiveTab(tabs[newValue]);
  }

  const selectedNode = selectedComponentId
    ? findNodeById(componentTree, selectedComponentId)
    : null;

  return (
    <Box
      sx={{
        width: panelOpen ? 320 : 0,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        borderLeft: panelOpen ? '1px solid' : 'none',
        borderColor: 'divider',
        px: panelOpen ? 2 : 0,
        pt: panelOpen ? 1.5 : 0,
      }}
    >
      {/* Tab header — hidden when only one tab is visible */}
      {tabs.length > 1 && (
        <Box sx={{ flexShrink: 0, pb: 1.5 }}>
          <ToggleButtonGroup
            value={tabs[visibleTabIndex]}
            exclusive
            onChange={(_e, val) => {
              if (val !== null) handleTabChange({} as React.SyntheticEvent, tabs.indexOf(val as TabName));
            }}
            size="small"
            fullWidth
            sx={{
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'text.primary',
                fontWeight: 600,
              },
              '& .MuiToggleButton-root.Mui-selected:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {tabs.includes('copy') && <ToggleButton value="copy" sx={{ flex: 1 }}>Copy</ToggleButton>}
            {tabs.includes('components') && <ToggleButton value="components" sx={{ flex: 1 }}>Components</ToggleButton>}
            {tabs.includes('theme') && <ToggleButton value="theme" sx={{ flex: 1 }}>Theme</ToggleButton>}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Components tab — tree + prop inspector */}
      {tabs.includes('components') && (
        <TabPanel value={visibleTabIndex} index={tabs.indexOf('components')}>
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
      )}

      {/* Copy tab — Phase 3 copy editing */}
      {tabs.includes('copy') && (
        <TabPanel value={visibleTabIndex} index={tabs.indexOf('copy')}>
          <CopyTab prototypeId={prototypeId} />
        </TabPanel>
      )}

      {/* Theme tab — Phase 4 theme customization */}
      {tabs.includes('theme') && (
        <TabPanel value={visibleTabIndex} index={tabs.indexOf('theme')}>
          <ThemeTab />
        </TabPanel>
      )}
    </Box>
  );
}
