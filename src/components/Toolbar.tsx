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
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import MenuIcon from '@mui/icons-material/Menu';
import { useThemeStore, type ThemeMode } from '@/stores/theme';
import { useInspectorStore } from '@/stores/inspector';
import { BreakpointSwitcher } from '@/components/BreakpointSwitcher';
import { StatusBadge } from '@/components/StatusBadge';
import { ShareButton } from '@/components/ShareButton';

interface ToolbarProps {
  prototypeName: string;
  prototypeId: string;
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
 * App toolbar — prototype name left, breakpoint switcher center,
 * panel toggle and theme toggle on the right.
 *
 * Design decisions per CONTEXT.md:
 * - Minimal to keep focus on the prototype, not the tool
 * - Three-state theme toggle cycles light -> dark -> system -> light
 * - ViewSidebar icon toggles the inspector panel open/closed
 * - BreakpointSwitcher in center lets users resize the preview viewport
 */
export function Toolbar({ prototypeName, prototypeId }: ToolbarProps) {
  const { mode, cycleMode } = useThemeStore();
  const { togglePanel, panelOpen, sidebarOpen, toggleSidebar } = useInspectorStore();

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <AppBar position="static" color="default" elevation={0}>
      <MuiToolbar variant="dense">
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500, flexShrink: 0 }}>
          {prototypeName}
        </Typography>
        <Box sx={{ ml: 1 }}>
          <StatusBadge prototypeId={prototypeId} />
        </Box>
        <Box sx={{ flex: 1 }} />
        <BreakpointSwitcher />
        <Box sx={{ flex: 1 }} />
        <ShareButton prototypeId={prototypeId} />
        <Tooltip title={sidebarOpen ? 'Hide screens' : 'Show screens'}>
          <IconButton
            onClick={toggleSidebar}
            size="small"
            aria-label={sidebarOpen ? 'Hide screens' : 'Show screens'}
            color={sidebarOpen ? 'primary' : 'default'}
            sx={{ mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={panelOpen ? 'Hide inspector panel' : 'Show inspector panel'}>
          <IconButton
            onClick={togglePanel}
            size="small"
            aria-label={panelOpen ? 'Hide inspector panel' : 'Show inspector panel'}
            color={panelOpen ? 'primary' : 'default'}
            sx={{ mr: 0.5 }}
          >
            <ViewSidebarIcon />
          </IconButton>
        </Tooltip>
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
