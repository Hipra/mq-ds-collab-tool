'use client';

import { use } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import MqIcon from '@/components/MqIcon';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { AppBar } from '@memoq/memoq.web.design';

export default function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <AppBar
        position="static"
        variant="dense"
        sx={{ '& .MuiToolbar-gutters': { px: 1 } }}
      >
        <Tooltip title="Back to prototype">
          <IconButton
            size="small"
            onClick={() => router.push(`/prototype/${id}`)}
            sx={{ mr: 0.5 }}
          >
            <MqIcon name="arrow_left" size={20} />
          </IconButton>
        </Tooltip>

        <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
          {id}
        </Typography>

        <Box
          sx={{
            mx: 1.5,
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          Flow
        </Box>

        <Box sx={{ flex: 1 }} />

        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Double-click canvas to add comment
        </Typography>
      </AppBar>

      {/* Canvas */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <FlowCanvas prototypeId={id} />
      </Box>
    </Box>
  );
}
