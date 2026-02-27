'use client';

import React, { useEffect } from 'react';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme';
import { useThemeStore } from '@/stores/theme';
import type { ThemeMode } from '@/stores/theme';

/**
 * ThemeSyncProvider — bridges Zustand theme store to MUI's useColorScheme.
 *
 * MUI v6 with cssVariables + colorSchemes manages the color scheme via
 * the data-mui-color-scheme attribute on <html>. The useColorScheme hook
 * provides setMode() to switch. This component reads the Zustand store
 * and keeps MUI in sync whenever the user cycles the toggle.
 *
 * Note: MUI returns mode === undefined on first render to avoid hydration
 * mismatch — we guard against that.
 */
function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const zustandMode = useThemeStore((s) => s.mode);
  const { setMode } = useColorScheme();

  useEffect(() => {
    // setMode is stable after first render; zustandMode drives the sync
    if (zustandMode !== undefined) {
      setMode(zustandMode as ThemeMode);
    }
  }, [zustandMode, setMode]);

  return <>{children}</>;
}

/**
 * App shell layout — wraps all shell pages (the main / route).
 *
 * Responsibilities:
 * - Provides MUI ThemeProvider with cssVariables + colorSchemes (light/dark)
 * - Provides CssBaseline for consistent baseline CSS
 * - ThemeSyncProvider keeps the shell theme in sync with Zustand store
 *
 * The shell ThemeProvider is SEPARATE from the iframe's ThemeProvider.
 * Theme changes are propagated to the iframe via postMessage in PreviewFrame.tsx.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeSyncProvider>{children}</ThemeSyncProvider>
    </ThemeProvider>
  );
}
