'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MqIcon from '@/components/MqIcon';
import { useInspectorStore } from '@/stores/inspector';

export function BreakpointSwitcher() {
  const { previewWidth, setPreviewWidth } = useInspectorStore();
  const isAuto = previewWidth === 'auto';
  const [inputValue, setInputValue] = useState(isAuto ? '' : String(previewWidth));

  // Sync input when store changes externally
  useEffect(() => {
    if (previewWidth !== 'auto') {
      setInputValue(String(previewWidth));
    }
  }, [previewWidth]);

  const handleToggle = () => {
    if (isAuto) {
      const px = parseInt(inputValue) || 1280;
      setInputValue(String(px));
      setPreviewWidth(px);
    } else {
      setPreviewWidth('auto');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setInputValue(val);
  };

  const handleCommit = () => {
    const px = parseInt(inputValue);
    if (px >= 320 && px <= 3840) {
      setPreviewWidth(px);
    } else if (!px) {
      setPreviewWidth('auto');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        height: 28,
      }}
    >
      <InputBase
        value={isAuto ? 'Auto' : inputValue}
        onChange={handleChange}
        onBlur={handleCommit}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(); }}
        disabled={isAuto}
        slotProps={{ input: { 'aria-label': 'Preview width in pixels' } }}
        endAdornment={
          !isAuto && (
            <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem', pr: 0.5 }}>
              px
            </Box>
          )
        }
        sx={{
          fontSize: '0.8125rem',
          px: 1,
          width: 80,
          '& .MuiInputBase-input': {
            p: 0,
            textAlign: 'center',
            color: isAuto ? 'text.secondary' : 'text.primary',
          },
        }}
      />
      <Tooltip title={isAuto ? 'Lock width' : 'Reset to auto'}>
        <IconButton
          size="small"
          onClick={handleToggle}
          aria-label={isAuto ? 'Lock width' : 'Reset to auto'}
          sx={{
            borderRadius: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
            height: 28,
            width: 28,
            color: isAuto ? 'text.disabled' : 'secondary.main',
          }}
        >
          {isAuto
            ? <MqIcon name="unlock" size={14} />
            : <MqIcon name="lock" size={14} />
          }
        </IconButton>
      </Tooltip>
    </Box>
  );
}
