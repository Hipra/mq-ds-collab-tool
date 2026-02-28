'use client';

import React, { useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';
import { useThemeConfigStore } from '@/stores/theme-config';

/**
 * App shell layout — wraps all shell pages with MUI ThemeProvider.
 *
 * The theme is dynamically built from the global ThemeConfig store so that
 * palette changes in the Theme tab are reflected in the shell app as well.
 * Fetches config on mount so the correct palette is available immediately,
 * not only when the ThemeTab mounts.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = useThemeConfigStore((s) => s.config);
  const loading = useThemeConfigStore((s) => s.loading);
  const setConfig = useThemeConfigStore((s) => s.setConfig);
  const setLoading = useThemeConfigStore((s) => s.setLoading);
  const theme = useMemo(() => createAppTheme(config), [config]);

  useEffect(() => {
    fetch('/api/theme')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setConfig, setLoading]);

  if (loading) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
