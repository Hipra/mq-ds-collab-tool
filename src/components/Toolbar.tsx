'use client';

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiToolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeStore, type ThemeMode } from '@/stores/theme';

interface ToolbarProps {
  prototypeName: string;
}

const MODE_CONFIG: Record<
  ThemeMode,
  { icon: React.ReactNode; label: string }
> = {
  light: { icon: <LightModeIcon />, label: 'Light mode' },
  dark: { icon: <DarkModeIcon />, label: 'Dark mode' },
  system: { icon: <SettingsBrightnessIcon />, label: 'System mode' },
};

/**
 * Minimal app toolbar — prototype name on the left, theme toggle on the right.
 *
 * Design decisions per CONTEXT.md:
 * - Minimal to keep focus on the prototype, not the tool
 * - Three-state toggle cycles light -> dark -> system -> light
 * - Shows nothing/placeholder icon when mode is undefined (MUI v6 first render)
 * - Uses AppBar with no elevation override for clean minimal look
 */
export function Toolbar({ prototypeName }: ToolbarProps) {
  const { mode, cycleMode } = useThemeStore();

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <AppBar position="static" color="default" elevation={0}>
      <MuiToolbar variant="dense">
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
          {prototypeName}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={modeConfig.label}>
          <IconButton
            onClick={cycleMode}
            size="small"
            aria-label={modeConfig.label}
          >
            {modeConfig.icon}
          </IconButton>
        </Tooltip>
      </MuiToolbar>
    </AppBar>
  );
}
