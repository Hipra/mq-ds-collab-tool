'use client';

import React, { useState } from 'react';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TerminalIcon from '@mui/icons-material/Terminal';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useRouter } from 'next/navigation';
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
  light: { icon: <LightModeIcon fontSize="small" />, label: 'Light mode' },
  dark: { icon: <DarkModeIcon fontSize="small" />, label: 'Dark mode' },
  system: { icon: <SettingsBrightnessIcon fontSize="small" />, label: 'System mode' },
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
  const router = useRouter();
  const { mode, cycleMode } = useThemeStore();
  const { togglePanel, panelOpen, sidebarOpen, toggleSidebar, activeScreenId } = useInspectorStore();
  const [copiedClaude, setCopiedClaude] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleCopyClaudeCommand = () => {
    const screenFile = activeScreenId === 'index' ? 'index.jsx' : `screen-${activeScreenId}.jsx`;
    const command = `claude --dangerously-skip-permissions "Work on screen ${screenFile} in prototype prototypes/${prototypeId}/. Follow the rules in CLAUDE.md. Read existing files before editing. Only modify files inside prototypes/${prototypeId}/ — never touch src/, config files, or other prototypes. Stack: React + MUI."`;
    navigator.clipboard.writeText(command);
    setCopiedClaude(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/prototypes/${prototypeId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? 'Failed to delete prototype');
        return;
      }
      router.push('/');
    } catch {
      setDeleteError('Network error');
    } finally {
      setDeleting(false);
    }
  };

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <AppBar position="static" color="default" elevation={0}>
      <MuiToolbar variant="dense" disableGutters sx={{ px: 1 }}>
        <Tooltip title="Back to prototypes">
          <IconButton
            onClick={() => router.push('/')}
            size="small"
            aria-label="Back to prototypes"
            sx={{ mr: 0.5 }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500, flexShrink: 0 }}>
          {prototypeName}
        </Typography>
        <Box sx={{ ml: 1 }}>
          <StatusBadge prototypeId={prototypeId} />
        </Box>
        <Tooltip title="Delete prototype">
          <IconButton
            onClick={() => { setDeleteError(''); setDeleteOpen(true); }}
            size="small"
            aria-label="Delete prototype"
            sx={{ ml: 0.5 }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
            <TerminalIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Snackbar
          open={copiedClaude}
          autoHideDuration={3000}
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
            <MenuIcon fontSize="small" />
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
            <ViewSidebarIcon fontSize="small" />
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

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete prototype?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            <strong>{prototypeName}</strong> will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
