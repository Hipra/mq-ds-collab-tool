'use client';

import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface ShareButtonProps {
  prototypeId: string;
}

export function ShareButton({ prototypeId }: ShareButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const open = Boolean(anchorEl);

  const handleOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setCopied(false);

    // Generate or fetch share token
    setLoading(true);
    try {
      const res = await fetch(`/api/preview/${prototypeId}/share`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/share/${data.shareToken}`;
        setShareUrl(url);
      }
    } catch {
      // Silently fail — user can retry
    }
    setLoading(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Tooltip title="Share">
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-label="Share prototype"
          sx={{ mr: 0.5 }}
        >
          <ShareIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 360 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Share prototype
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : shareUrl ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                value={shareUrl}
                slotProps={{ input: { readOnly: true } }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleCopy}
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                sx={{ flexShrink: 0 }}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </Box>
          ) : (
            <Typography color="error" variant="body2">
              Failed to generate share link.
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}
