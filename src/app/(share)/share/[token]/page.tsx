'use client';

import React, { use, useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiToolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { PreviewFrame } from '@/components/PreviewFrame';

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' }> = {
  draft: { label: 'Draft', color: 'default' },
  review: { label: 'Review', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
};

interface ShareData {
  prototypeId: string;
  name: string;
  status: string;
}

export default function ShareViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((d: ShareData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          This share link is no longer valid.
        </Typography>
      </Box>
    );
  }

  const statusConfig = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.draft;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppBar position="static" color="default" elevation={0}>
        <MuiToolbar variant="dense">
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
            {data.name}
          </Typography>
          <Box sx={{ ml: 1 }}>
            <Chip label={statusConfig.label} color={statusConfig.color} size="small" />
          </Box>
          <Box sx={{ ml: 1 }}>
            <Chip label="View only" size="small" variant="outlined" />
          </Box>
          <Box sx={{ flex: 1 }} />
        </MuiToolbar>
      </AppBar>
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PreviewFrame prototypeId={data.prototypeId} readOnly />
      </Box>
    </Box>
  );
}
