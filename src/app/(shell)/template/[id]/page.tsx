'use client';

import React, { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiToolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import { useThemeStore, type ThemeMode } from '@/stores/theme';
import { useThemeConfigStore } from '@/stores/theme-config';
import { useInspectorStore } from '@/stores/inspector';
import { InspectorPanel } from '@/components/InspectorPanel';

interface Prototype {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  hasShareToken: boolean;
}

const MODE_CONFIG: Record<ThemeMode, { icon: React.ReactNode; label: string }> = {
  light: { icon: <LightModeIcon fontSize="small" />, label: 'Light mode' },
  dark: { icon: <DarkModeIcon fontSize="small" />, label: 'Dark mode' },
  system: { icon: <SettingsBrightnessIcon fontSize="small" />, label: 'System mode' },
};

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { mode, cycleMode } = useThemeStore();
  const themeConfig = useThemeConfigStore((s) => s.config);
  const {
    panelOpen,
    togglePanel,
    setComponentTree,
    setHoveredComponent,
    setSelectedComponent,
    selectedComponentId,
  } = useInspectorStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isLoadedRef = useRef(false);
  const [previewReady, setPreviewReady] = useState(false);

  const [templateName, setTemplateName] = useState<string>(id);

  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [protosLoading, setProtosLoading] = useState(false);
  const [addToOpen, setAddToOpen] = useState(false);
  const [addToProtoId, setAddToProtoId] = useState('');
  const [addToLoading, setAddToLoading] = useState(false);
  const [addToError, setAddToError] = useState('');

  // Fetch template name
  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((list: { id: string; name: string }[]) => {
        const found = list.find((t) => t.id === id);
        if (found) setTemplateName(found.name);
      })
      .catch(() => {});
  }, [id]);

  // Fetch component tree for inspector
  useEffect(() => {
    fetch(`/api/preview/template/${id}/tree`)
      .then((r) => (r.ok ? r.json() : []))
      .then((tree) => setComponentTree(Array.isArray(tree) ? tree : []))
      .catch(() => {});
  }, [id, setComponentTree]);

  // Send theme to iframe
  const sendTheme = useCallback(
    (themeMode: string) => {
      if (iframeRef.current?.contentWindow && isLoadedRef.current) {
        iframeRef.current.contentWindow.postMessage({ type: 'SET_THEME', mode: themeMode }, '*');
      }
    },
    []
  );

  useEffect(() => { sendTheme(mode); }, [mode, sendTheme]);

  // Highlight selected component in iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow && isLoadedRef.current) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'HIGHLIGHT_TEXT', inspectorId: selectedComponentId ?? null },
        '*'
      );
    }
  }, [selectedComponentId]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'PREVIEW_READY') {
        isLoadedRef.current = true;
        setPreviewReady(true);
        iframeRef.current?.contentWindow?.postMessage({ type: 'SET_THEME', mode }, '*');
        iframeRef.current?.contentWindow?.postMessage({ type: 'SET_THEME_CONFIG', config: themeConfig }, '*');
      }

      if (event.data.type === 'COMPONENT_HOVER') {
        setHoveredComponent(event.data.id ?? null);
      }

      if (event.data.type === 'COMPONENT_SELECT') {
        setSelectedComponent(event.data.id ?? null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mode, themeConfig, setHoveredComponent, setSelectedComponent]);

  const handleIframeLoad = useCallback(() => {
    isLoadedRef.current = true;
    setPreviewReady(true);
    iframeRef.current?.contentWindow?.postMessage({ type: 'SET_THEME', mode }, '*');
    iframeRef.current?.contentWindow?.postMessage({ type: 'SET_THEME_CONFIG', config: themeConfig }, '*');
  }, [mode, themeConfig]);

  const openAddTo = () => {
    setAddToError('');
    setAddToProtoId('');
    setAddToOpen(true);
    if (prototypes.length === 0) {
      setProtosLoading(true);
      fetch('/api/prototypes')
        .then((r) => r.json())
        .then((data: Prototype[]) => { setPrototypes(data); setProtosLoading(false); })
        .catch(() => setProtosLoading(false));
    }
  };

  const handleAddTo = async () => {
    if (!addToProtoId) return;
    setAddToLoading(true);
    setAddToError('');
    try {
      const res = await fetch(`/api/preview/${addToProtoId}/screens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName, templateId: id }),
      });
      if (!res.ok) { setAddToError((await res.json()).error ?? 'Failed to add screen'); return; }
      setAddToOpen(false);
      router.push(`/prototype/${addToProtoId}`);
    } catch { setAddToError('Network error'); }
    finally { setAddToLoading(false); }
  };

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── AppBar ── */}
      <AppBar position="static" color="default" elevation={0}>
        <MuiToolbar variant="dense" disableGutters sx={{ px: 1.5, minHeight: 48, gap: 1 }}>
          <Tooltip title="Back to dashboard">
            <IconButton size="small" onClick={() => router.push('/')} aria-label="Back">
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: 'text.primary', ml: 0.5 }}
          >
            {templateName}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="contained"
            startIcon={<PlaylistAddIcon />}
            onClick={openAddTo}
          >
            Add to prototype
          </Button>
          <Tooltip title={panelOpen ? 'Hide inspector' : 'Show inspector'}>
            <IconButton onClick={togglePanel} size="small" aria-label="Toggle inspector">
              <ViewSidebarIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={modeConfig.label}>
            <IconButton onClick={cycleMode} size="small" aria-label={modeConfig.label}>
              {modeConfig.icon}
            </IconButton>
          </Tooltip>
        </MuiToolbar>
      </AppBar>

      {/* ── Main: preview + inspector ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Preview */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            bgcolor: 'background.default',
          }}
        >
          {!previewReady && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          <Box
            component="iframe"
            id="preview-iframe"
            ref={iframeRef}
            src={`/preview/template/${id}`}
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleIframeLoad}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: previewReady ? 'block' : 'none',
            }}
            title={`Template preview: ${templateName}`}
          />
        </Box>

        {/* Inspector panel — only Components tab on template pages */}
        <InspectorPanel prototypeId={id} tabs={['components']} />
      </Box>

      {/* ── Add to prototype dialog ── */}
      <Dialog open={addToOpen} onClose={() => setAddToOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add &ldquo;{templateName}&rdquo; to prototype</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {addToError && <Alert severity="error" sx={{ mx: 2, mt: 2 }}>{addToError}</Alert>}
          {protosLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : prototypes.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: 3, py: 3 }}>
              No prototypes yet. Create one first.
            </Typography>
          ) : (
            <List disablePadding>
              {prototypes.map((proto, idx) => (
                <React.Fragment key={proto.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItemButton selected={addToProtoId === proto.id} onClick={() => setAddToProtoId(proto.id)}>
                    <ListItemText primary={proto.name} slotProps={{ primary: { variant: 'body2' } }} />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTo} disabled={!addToProtoId || addToLoading}>
            {addToLoading ? 'Adding…' : 'Add screen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
