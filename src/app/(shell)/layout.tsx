'use client';

import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';
import { useThemeConfigStore } from '@/stores/theme-config';

/**
 * App shell layout — wraps all shell pages with MUI ThemeProvider.
 *
 * The theme is dynamically built from the global ThemeConfig store so that
 * palette changes in the Theme tab are reflected in the shell app as well.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = useThemeConfigStore((s) => s.config);
  const theme = useMemo(() => createAppTheme(config), [config]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
