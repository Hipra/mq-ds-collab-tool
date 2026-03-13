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
import { useThemeStore, type ThemeMode } from '@/stores/theme';

const MODE_CONFIG: Record<ThemeMode, { icon: string; label: string }> = {
  light: { icon: 'sun', label: 'Light mode' },
  dark: { icon: 'moon', label: 'Dark mode' },
  system: { icon: 'system_theme', label: 'System mode' },
};

export default function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { mode, cycleMode } = useThemeStore();
  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* AppBar — same style as dashboard */}
      <AppBar position="static" variant="dense" sx={{ '& .MuiToolbar-gutters': { px: 2.5 } }}>
        <Tooltip title="Back to dashboard">
          <IconButton size="small" onClick={() => router.push('/')}>
            <MqIcon name="arrow_left" size={20} />
          </IconButton>
        </Tooltip>

        <Typography variant="subtitle2" sx={{ flexShrink: 0, ml: 0.5 }}>
          {id}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={modeConfig.label}>
          <IconButton onClick={cycleMode} size="small" aria-label={modeConfig.label}>
            <MqIcon name={modeConfig.icon} size={20} />
          </IconButton>
        </Tooltip>
      </AppBar>

      {/* Canvas */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <FlowCanvas prototypeId={id} />
      </Box>
    </Box>
  );
}
