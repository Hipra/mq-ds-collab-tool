'use client';

import React from 'react';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';

type Status = 'draft' | 'review' | 'approved';

const STATUS_CONFIG: Record<Status, { label: string; color: 'default' | 'warning' | 'success' }> = {
  draft:    { label: 'Draft',    color: 'default'  },
  review:   { label: 'Review',   color: 'warning'  },
  approved: { label: 'Approved', color: 'success'  },
};

interface StatusBadgeProps {
  prototypeId: string;
}

/**
 * StatusBadge — renders a colored MUI Chip in the toolbar.
 * Clicking the chip opens a menu with Draft / Review / Approved options.
 * Selecting an option calls PATCH /api/preview/[id]/status and updates state optimistically.
 *
 * No confirmation dialog, no sequential enforcement — any-to-any transitions (per CONTEXT.md).
 */
export function StatusBadge({ prototypeId }: StatusBadgeProps) {
  const [status, setStatus] = React.useState<Status>('draft');
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Load initial status on mount
  React.useEffect(() => {
    fetch(`/api/preview/${prototypeId}/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.status in STATUS_CONFIG) {
          setStatus(data.status as Status);
        }
      })
      .catch(() => {
        // Silently fall back to 'draft' default
      });
  }, [prototypeId]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = async (newStatus: Status) => {
    // Optimistic update
    const prev = status;
    setStatus(newStatus);
    handleClose();

    try {
      const res = await fetch(`/api/preview/${prototypeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setStatus(prev);
      }
    } catch {
      // Revert on network error
      setStatus(prev);
    }
  };

  const config = STATUS_CONFIG[status];

  return (
    <>
      <Chip
        label={config.label}
        color={config.color}
        variant="filled"
        size="small"
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          ...(status === 'draft' && {
            bgcolor: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.75)',
            '& .MuiChip-label': { fontWeight: 400 },
          }),
        }}
        aria-controls={open ? 'status-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      />
      <Menu
        id="status-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'status-chip' }}
      >
        {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(
          ([value, cfg]) => (
            <MenuItem
              key={value}
              onClick={() => handleSelect(value)}
              selected={value === status}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={cfg.label} color={cfg.color} size="small" sx={{ pointerEvents: 'none' }} />
                <ListItemText primary={cfg.label} />
              </Box>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  );
}
