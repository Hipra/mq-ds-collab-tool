'use client';

import React, { use } from 'react';
import Box from '@mui/material/Box';
import { Toolbar } from '@/components/Toolbar';
import { ScreenSidebar } from '@/components/ScreenSidebar';
import { PreviewFrame } from '@/components/PreviewFrame';
import { InspectorPanel } from '@/components/InspectorPanel';

/**
 * Dynamic prototype viewer page at /prototype/[id].
 * Same layout as the original hardcoded shell page, but reads the prototype id
 * from the route params.
 */
export default function PrototypeViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toolbar prototypeName={id} prototypeId={id} />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ScreenSidebar prototypeId={id} />
        <PreviewFrame prototypeId={id} />
        <InspectorPanel prototypeId={id} />
      </Box>
    </Box>
  );
}
