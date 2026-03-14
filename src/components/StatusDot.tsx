'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

/** Chip background — use main color at low alpha for readability */
const STATUS_BG: Record<string, string> = {
  concept: 'action.hover',
  not_started: 'action.hover',
  in_progress: 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
  review: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.12)',
  qa: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.12)',
  done: 'rgba(var(--mui-palette-success-mainChannel) / 0.12)',
  deployed: 'rgba(var(--mui-palette-success-mainChannel) / 0.12)',
  draft: 'action.hover',
  approved: 'rgba(var(--mui-palette-success-mainChannel) / 0.12)',
};

/** Foreground / text color */
const STATUS_FG: Record<string, string> = {
  concept: 'text.secondary',
  not_started: 'text.secondary',
  in_progress: 'primary.main',
  review: 'secondary.main',
  qa: 'secondary.main',
  done: 'success.main',
  deployed: 'success.main',
  draft: 'text.secondary',
  approved: 'success.main',
};

const STATUS_LABEL: Record<string, string> = {
  concept: 'Concept',
  in_progress: 'In progress',
  review: 'Review',
  done: 'Done',
  not_started: 'Not started',
  qa: 'QA',
  deployed: 'Deployed',
  draft: 'Draft',
  approved: 'Approved',
};

interface StatusDotProps {
  /** Optional prefix label (e.g. "Design", "Dev") */
  label?: string;
  status: string;
  /** Size variant — 'sm' for flow nodes, 'md' (default) for dashboard */
  size?: 'sm' | 'md';
  /** Available status options — if provided, the chip becomes clickable */
  options?: string[];
  /** Called when the user selects a new status */
  onChange?: (status: string) => void;
}

export function StatusDot({ label, status, size = 'md', options, onChange }: StatusDotProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const bg = STATUS_BG[status] ?? 'action.hover';
  const fg = STATUS_FG[status] ?? 'text.secondary';
  const text = STATUS_LABEL[status] ?? status;
  const interactive = options && options.length > 0 && onChange;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (interactive) setAnchorEl(e.currentTarget);
  };

  const handleSelect = (value: string) => {
    onChange?.(value);
    setAnchorEl(null);
  };

  return (
    <>
      {size === 'sm' ? (
        <Box
          onClick={handleClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            ...(interactive && { cursor: 'pointer', '&:hover': { opacity: 0.8 }, borderRadius: 0.5, px: 0.5, mx: -0.5 }),
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: fg, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {label ? `${label}: ${text}` : text}
          </Typography>
        </Box>
      ) : (
        <Chip
          label={label ? `${label}: ${text}` : text}
          size="medium"
          variant="filled"
          onClick={interactive ? handleClick : undefined}
          sx={{
            borderRadius: '999px',
            bgcolor: bg,
            color: fg,
            fontWeight: 500,
            ...(interactive && { cursor: 'pointer' }),
          }}
        />
      )}
      {interactive && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{ list: { dense: false } }}
        >
          {options.map((opt) => (
            <MenuItem
              key={opt}
              selected={opt === status}
              onClick={() => handleSelect(opt)}
            >
              <Typography variant="body2">{STATUS_LABEL[opt] ?? opt}</Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}
