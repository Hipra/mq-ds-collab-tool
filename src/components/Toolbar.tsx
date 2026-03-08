'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useRouter } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { AppBar, Typography } from '@memoq/memoq.web.design';
import MqIcon from '@/components/MqIcon';
import { useThemeStore, type ThemeMode } from '@/stores/theme';
import { useInspectorStore } from '@/stores/inspector';
import { BreakpointSwitcher } from '@/components/BreakpointSwitcher';
import { StatusBadge } from '@/components/StatusBadge';

interface ToolbarProps {
  prototypeName: string;
  prototypeId: string;
}

const MODE_CONFIG: Record<
  ThemeMode,
  { icon: React.ReactNode; label: string }
> = {
  light: { icon: <MqIcon name="sun" size={20} />, label: 'Light mode' },
  dark: { icon: <MqIcon name="moon" size={20} />, label: 'Dark mode' },
  system: { icon: <MqIcon name="system_theme" size={20} />, label: 'System mode' },
};

/**
 * App toolbar — prototype name left, breakpoint switcher center,
 * panel toggle and theme toggle on the right.
 *
 * Built with DS AppBar (dense variant = 40px height, DS typography/shadow/bg).
 * Icons use MqIcon (shell-side SVG fetcher, same icon set as DS).
 */
export function Toolbar({ prototypeName, prototypeId }: ToolbarProps) {
  const router = useRouter();
  const { mode, cycleMode } = useThemeStore();
  const { togglePanel, panelOpen, sidebarOpen, toggleSidebar, activeScreenId } = useInspectorStore();
  const [copiedClaude, setCopiedClaude] = useState(false);

  const handleCopyClaudeCommand = () => {
    const screenFile = activeScreenId === 'index' ? 'index.jsx' : `screen-${activeScreenId}.jsx`;
    const command = `claude --dangerously-skip-permissions "Work on screen ${screenFile} in prototype prototypes/${prototypeId}/. Follow the rules in CLAUDE.md. Read existing files before editing. Only modify files inside prototypes/${prototypeId}/ — never touch src/, config files, or other prototypes. Stack: React + MUI."`;
    navigator.clipboard.writeText(command);
    setCopiedClaude(true);
  };

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    // DS AppBar: white bg, DS shadow, dense toolbar (40px), DS typography scale
    // sx targets the inner MuiToolbar to remove default gutters and apply our px
    <AppBar
      position="static"
      variant="dense"
      sx={{ '& .MuiToolbar-gutters': { px: 1 } }}
    >
      <Tooltip title="Back to prototypes">
        <IconButton
          onClick={() => router.push('/')}
          size="small"
          aria-label="Back to prototypes"
          sx={{ mr: 0.5 }}
        >
          <MqIcon name="arrow_left" size={20} />
        </IconButton>
      </Tooltip>

      <Typography variant="subtitle2" component="div" sx={{ flexShrink: 0 }}>
        {prototypeName}
      </Typography>

      <Box sx={{ ml: 1 }}>
        <StatusBadge prototypeId={prototypeId} />
      </Box>

      <Box sx={{ flex: 1 }} />
      <BreakpointSwitcher />
      <Box sx={{ flex: 1 }} />

      <Tooltip title="Copy prompt">
        <IconButton
          onClick={handleCopyClaudeCommand}
          size="small"
          aria-label="Copy prompt"
          sx={{ mr: 0.5 }}
        >
          <MqIcon name="language_terminal" size={20} />
        </IconButton>
      </Tooltip>

      <Snackbar
        open={copiedClaude}
        autoHideDuration={1500}
        onClose={() => setCopiedClaude(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setCopiedClaude(false)}>
          Copied! Navigate to project folder and paste command
        </Alert>
      </Snackbar>

      <Tooltip title={sidebarOpen ? 'Hide screens' : 'Show screens'}>
        <IconButton
          onClick={toggleSidebar}
          size="small"
          aria-label={sidebarOpen ? 'Hide screens' : 'Show screens'}
          color="inherit"
          sx={{ mr: 0.5, color: sidebarOpen ? 'text.primary' : 'text.secondary' }}
        >
          <MqIcon name="menu" size={20} />
        </IconButton>
      </Tooltip>

      <Tooltip title={panelOpen ? 'Hide inspector panel' : 'Show inspector panel'}>
        <IconButton
          onClick={togglePanel}
          size="small"
          aria-label={panelOpen ? 'Hide inspector panel' : 'Show inspector panel'}
          color="inherit"
          sx={{ mr: 0.5, color: panelOpen ? 'text.primary' : 'text.secondary' }}
        >
          <MqIcon name="sidebar" size={20} />
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
    </AppBar>
  );
}
