'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { Toolbar } from '@/components/Toolbar';
import { PreviewFrame } from '@/components/PreviewFrame';

/**
 * Main app page — renders the app shell with toolbar and preview iframe.
 *
 * Layout: Full viewport height flex column
 * - Top: Toolbar (prototype name + theme toggle)
 * - Main: PreviewFrame (embeds /preview/[id], takes remaining space)
 *
 * prototypeId is hardcoded to 'sample' for Phase 1 — prototype selection
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
      <Toolbar prototypeName={prototypeId} />
      <PreviewFrame prototypeId={prototypeId} />
    </Box>
  );
}
