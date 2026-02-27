'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Reusable error display for shell-side errors (e.g., RENDER_ERROR from iframe).
 *
 * Design decisions:
 * - Monospace font for error text (stack traces, JSX errors are code-like)
 * - error.main color to make the error state visually clear
 * - Retry button only shown when onRetry is provided
 * - Centered layout with padding — the error fills the preview area
 */
export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        p: 4,
        gap: 2,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: 'error.main',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxWidth: '80ch',
          textAlign: 'left',
          background: 'action.hover',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'error.main',
          width: '100%',
        }}
      >
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" color="error" onClick={onRetry} size="small">
          Retry
        </Button>
      )}
    </Box>
  );
}
