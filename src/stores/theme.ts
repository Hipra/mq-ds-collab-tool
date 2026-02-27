import { useColorScheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark' | 'system';

const CYCLE_ORDER: ThemeMode[] = ['light', 'dark', 'system'];

/**
 * Theme mode hook — thin wrapper over MUI's useColorScheme.
 *
 * MUI v6 with colorSchemeSelector: 'data' already handles:
 * - localStorage persistence (key: 'mui-mode')
 * - system preference detection
 * - setMode('light' | 'dark' | 'system')
 *
 * This hook adds cycleMode() for the three-state toggle and keeps the
 * same API surface so Toolbar and PreviewFrame don't need to change.
 *
 * Single source of truth — no Zustand/MUI sync needed, no flicker on refresh.
 */
export function useThemeStore() {
  const { mode, setMode } = useColorScheme();

  const safeMode: ThemeMode = (mode as ThemeMode) || 'system';

  const cycleMode = () => {
    const currentIndex = CYCLE_ORDER.indexOf(safeMode);
    const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length;
    setMode(CYCLE_ORDER[nextIndex]);
  };

  return {
    mode: safeMode,
    setMode: setMode as (m: ThemeMode) => void,
    cycleMode,
  };
}
