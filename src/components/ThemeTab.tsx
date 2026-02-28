'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useThemeConfigStore } from '@/stores/theme-config';
import { useColorScheme } from '@mui/material/styles';
import type { PaletteConfig } from '@/lib/theme-config';
import { MemoqColorPicker } from './MemoqColorPicker';

/** Palette sections grouped by category. */
const PALETTE_GROUPS: { title: string; rows: { label: string; path: string }[] }[] = [
  {
    title: 'Common',
    rows: [
      { label: 'Black', path: 'common.black' },
      { label: 'White', path: 'common.white' },
    ],
  },
  {
    title: 'Primary',
    rows: [
      { label: 'Light', path: 'primary.light' },
      { label: 'Main', path: 'primary.main' },
      { label: 'Dark', path: 'primary.dark' },
      { label: 'Contrast', path: 'primary.contrastText' },
    ],
  },
  {
    title: 'Secondary',
    rows: [
      { label: 'Light', path: 'secondary.light' },
      { label: 'Main', path: 'secondary.main' },
      { label: 'Dark', path: 'secondary.dark' },
      { label: 'Contrast', path: 'secondary.contrastText' },
    ],
  },
  {
    title: 'Error',
    rows: [
      { label: 'Light', path: 'error.light' },
      { label: 'Main', path: 'error.main' },
      { label: 'Dark', path: 'error.dark' },
      { label: 'Contrast', path: 'error.contrastText' },
    ],
  },
  {
    title: 'Warning',
    rows: [
      { label: 'Light', path: 'warning.light' },
      { label: 'Main', path: 'warning.main' },
      { label: 'Dark', path: 'warning.dark' },
      { label: 'Contrast', path: 'warning.contrastText' },
    ],
  },
  {
    title: 'Info',
    rows: [
      { label: 'Light', path: 'info.light' },
      { label: 'Main', path: 'info.main' },
      { label: 'Dark', path: 'info.dark' },
      { label: 'Contrast', path: 'info.contrastText' },
    ],
  },
  {
    title: 'Success',
    rows: [
      { label: 'Light', path: 'success.light' },
      { label: 'Main', path: 'success.main' },
      { label: 'Dark', path: 'success.dark' },
      { label: 'Contrast', path: 'success.contrastText' },
    ],
  },
  {
    title: 'Background',
    rows: [
      { label: 'Default', path: 'background.default' },
      { label: 'Paper', path: 'background.paper' },
    ],
  },
  {
    title: 'Text',
    rows: [
      { label: 'Primary', path: 'text.primary' },
      { label: 'Secondary', path: 'text.secondary' },
      { label: 'Disabled', path: 'text.disabled' },
    ],
  },
  {
    title: 'Other',
    rows: [
      { label: 'Divider', path: 'divider' },
      { label: 'Active', path: 'action.active' },
      { label: 'Hover', path: 'action.hover' },
      { label: 'Selected', path: 'action.selected' },
      { label: 'Disabled', path: 'action.disabled' },
      { label: 'Disabled BG', path: 'action.disabledBackground' },
    ],
  },
];

/** Read a dot-path value from PaletteConfig. Handles both nested and top-level string fields. */
function getPaletteValue(palette: PaletteConfig, path: string): string {
  const parts = path.split('.');
  if (parts.length === 1) {
    // Top-level string field (e.g. "divider")
    const val = palette[path as keyof PaletteConfig];
    return typeof val === 'string' ? val : '';
  }
  const [group, key] = parts;
  const groupVal = palette[group as keyof PaletteConfig];
  if (groupVal && typeof groupVal === 'object' && key in groupVal) {
    return (groupVal as Record<string, string>)[key];
  }
  return '';
}


/**
 * ThemeTab — global theme configuration editor for the inspector panel.
 *
 * Shows the full MUI color palette for the currently active color mode (light/dark).
 * Changes are applied immediately to the store (and postMessaged to iframe)
 * and debounce-persisted to the API.
 */
export function ThemeTab() {
  const {
    config,
    loading,
    setConfig,
    updatePalette,
    setLoading,
  } = useThemeConfigStore();

  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === 'system' ? systemMode : mode;
  const paletteMode = (resolvedMode === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Fetch config on mount
  useEffect(() => {
    fetch('/api/theme')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setConfig, setLoading]);

  // Debounced save to API
  const saveToApi = useCallback((configToSave: typeof config) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave),
      });
    }, 500);
  }, []);

  // Send config to iframe via postMessage
  const sendToIframe = useCallback((configToSend: typeof config) => {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'SET_THEME_CONFIG', config: configToSend },
        '*'
      );
    }
  }, []);

  // Palette change handler
  const handlePaletteChange = useCallback(
    (path: string, value: string) => {
      updatePalette(paletteMode, path, value);
      const next = useThemeConfigStore.getState().config;
      sendToIframe(next);
      saveToApi(next);
    },
    [paletteMode, updatePalette, sendToIframe, saveToApi]
  );

  if (loading) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>
        <Typography variant="body2">Loading theme...</Typography>
      </Box>
    );
  }

  const currentPalette = config.palette[paletteMode];

  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="subtitle2">
        Palette
      </Typography>

      {PALETTE_GROUPS.map(({ title, rows }) => (
        <Box key={title}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {rows.map(({ label, path }) => {
              const value = getPaletteValue(currentPalette, path);
              return (
                <Box
                  key={path}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <MemoqColorPicker
                    currentColor={value}
                    onSelect={(hex) => handlePaletteChange(path, hex)}
                  />
                  <Typography
                    variant="caption"
                    sx={{ width: 72, flexShrink: 0, fontSize: '11px' }}
                  >
                    {label}
                  </Typography>
                  <TextField
                    size="small"
                    value={value}
                    onChange={(e) => handlePaletteChange(path, e.target.value)}
                    slotProps={{
                      htmlInput: {
                        sx: { py: '4px', px: '8px', fontSize: '11px' },
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
