'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { Toolbar } from '@/components/Toolbar';
import { ScreenSidebar } from '@/components/ScreenSidebar';
import { PreviewFrame } from '@/components/PreviewFrame';
import { InspectorPanel } from '@/components/InspectorPanel';

/**
 * Main app page — renders the app shell with toolbar, preview iframe, and inspector panel.
 *
 * Layout: Full viewport height flex column
 * - Top: Toolbar (prototype name + breakpoint switcher + panel toggle + theme toggle)
 * - Main: flex row
 *   - Left: PreviewFrame (fills remaining space, embeds /preview/[id])
 *   - Right: InspectorPanel (320px fixed, collapsible from toolbar toggle)
 *
 * prototypeId is hardcoded to 'sample' for Phase 1/2 — prototype selection
 * will be added in a later phase.
 */
const prototypeId = 'sample';

export default function ShellPage() {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toolbar prototypeName={prototypeId} prototypeId={prototypeId} />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ScreenSidebar prototypeId={prototypeId} />
        <PreviewFrame prototypeId={prototypeId} />
        <InspectorPanel />
      </Box>
    </Box>
  );
}
