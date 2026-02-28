'use client';

import React, { useState } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { MEMOQ_COLOR_GROUPS } from '@/lib/memoq-tokens';

interface MemoqColorPickerProps {
  currentColor: string;
  onSelect: (hex: string) => void;
}

export function MemoqColorPicker({ currentColor, onSelect }: MemoqColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: 24,
          height: 24,
          border: 1,
          borderColor: 'divider',
          borderRadius: 0.5,
          flexShrink: 0,
          cursor: 'pointer',
          backgroundImage: `linear-gradient(${currentColor}, ${currentColor}), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)`,
          backgroundSize: '100% 100%, 8px 8px, 8px 8px',
          backgroundPosition: '0 0, 0 0, 4px 4px',
          '&:hover': { boxShadow: '0 0 0 2px', color: 'primary.main' },
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, width: 280 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            memoQ Color Tokens
          </Typography>
          {MEMOQ_COLOR_GROUPS.map((group) => (
            <Box key={group.name} sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25, display: 'block' }}
              >
                {group.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: '2px' }}>
                {group.tokens.map(({ token, hex }) => (
                  <Tooltip key={token} title={`${token} — ${hex}`} placement="top" arrow>
                    <Box
                      onClick={() => { onSelect(hex); setAnchorEl(null); }}
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '3px',
                        bgcolor: hex,
                        cursor: 'pointer',
                        border: hex === currentColor ? '2px solid' : '1px solid',
                        borderColor: hex === currentColor ? 'primary.main' : 'divider',
                        '&:hover': { transform: 'scale(1.25)', zIndex: 1 },
                        transition: 'transform 0.1s',
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}
