'use client';

import React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useInspectorStore } from '@/stores/inspector';

const BREAKPOINTS = [
  { label: 'Auto', width: 'auto' as const },
  { label: 'md (900)', width: 900 },
  { label: 'lg (1200)', width: 1200 },
  { label: 'xl (1536)', width: 1536 },
] as const;

export function BreakpointSwitcher() {
  const { previewWidth, setPreviewWidth } = useInspectorStore();

  return (
    <ButtonGroup size="small" variant="outlined" color="secondary" aria-label="Preview breakpoint selector">
      {BREAKPOINTS.map(({ label, width }) => {
        const isActive = previewWidth === width;
        return (
          <Button
            key={label}
            variant={isActive ? 'contained' : 'outlined'}
            onClick={() => setPreviewWidth(width)}
            aria-pressed={isActive}
            sx={{ textTransform: 'none' }}
          >
            {label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
