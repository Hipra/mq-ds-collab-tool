'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const STATUS_COLOR: Record<string, string> = {
  concept: 'text.disabled',
  not_started: 'text.disabled',
  in_progress: 'primary.main',
  review: 'secondary.main',
  qa: 'secondary.main',
  done: 'success.main',
  deployed: 'success.main',
  draft: 'text.disabled',
  approved: 'success.main',
};

const STATUS_LABEL: Record<string, string> = {
  concept: 'Concept',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  not_started: 'Not Started',
  qa: 'QA',
  deployed: 'Deployed',
  draft: 'Draft',
  approved: 'Approved',
};

interface StatusDotProps {
  /** Optional prefix label (e.g. "UX design", "Dev") */
  label?: string;
  status: string;
  /** Size variant — 'sm' for flow nodes, 'md' (default) for dashboard */
  size?: 'sm' | 'md';
}

export function StatusDot({ label, status, size = 'md' }: StatusDotProps) {
  const color = STATUS_COLOR[status] ?? 'text.disabled';
  const text = STATUS_LABEL[status] ?? status;
  const dotSize = size === 'sm' ? 6 : 8;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ width: dotSize, height: dotSize, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="caption" color="text.secondary" sx={size === 'sm' ? { fontSize: 11 } : undefined}>
        {label ? `${label}: ${text}` : text}
      </Typography>
    </Box>
  );
}
