'use client';

import React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useInspectorStore } from '@/stores/inspector';

const BREAKPOINTS = [
  { label: 'Auto', width: 'auto' as const },
  { label: 'xs (360)', width: 360 },
  { label: 'sm (600)', width: 600 },
  { label: 'md (900)', width: 900 },
  { label: 'lg (1200)', width: 1200 },
  { label: 'xl (1536)', width: 1536 },
] as const;

/**
 * Toolbar button group for selecting preview viewport width.
 *
 * Design decisions:
 * - ButtonGroup size="small" keeps toolbar compact
 * - Active breakpoint uses "contained" variant for clear visual state
 * - Inactive buttons use "outlined" for lower visual weight
 * - Breakpoint widths match MUI v5/v6 default breakpoints exactly
 * - "Auto" fills the available preview area (flex: 1)
 */
export function BreakpointSwitcher() {
  const { previewWidth, setPreviewWidth } = useInspectorStore();

  return (
    <ButtonGroup size="small" aria-label="Preview breakpoint selector">
      {BREAKPOINTS.map(({ label, width }) => {
        const isActive = previewWidth === width;
        return (
          <Button
            key={label}
            variant={isActive ? 'contained' : 'outlined'}
            onClick={() => setPreviewWidth(width)}
            aria-pressed={isActive}
            sx={{ textTransform: 'none', px: 1, py: 0.25, fontSize: '12px', minWidth: 0 }}
          >
            {label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
