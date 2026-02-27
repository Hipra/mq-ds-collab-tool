'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme';

/**
 * App shell layout — wraps all shell pages with MUI ThemeProvider.
 *
 * Theme mode is managed entirely by MUI's useColorScheme (via useThemeStore
 * hook). No separate Zustand store or sync provider needed — MUI handles
 * localStorage persistence and CSS variable switching internally.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
