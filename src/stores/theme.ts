import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

const CYCLE_ORDER: ThemeMode[] = ['light', 'dark', 'system'];

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
}

/**
 * Global Zustand store for theme mode selection.
 *
 * Design decisions:
 * - Default mode: 'system' — follows OS prefers-color-scheme per CONTEXT.md
 * - Persist key: 'mq-ds-theme-mode' in localStorage — global, not per-prototype
 * - cycleMode rotates: light -> dark -> system -> light
 * - This store is the single source of truth for theme selection across both
 *   the app shell (via MUI useColorScheme) and the iframe (via postMessage SET_THEME)
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      cycleMode: () => {
        const current = get().mode;
        const currentIndex = CYCLE_ORDER.indexOf(current);
        const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length;
        set({ mode: CYCLE_ORDER[nextIndex] });
      },
    }),
    {
      name: 'mq-ds-theme-mode',
      // Only persist the mode field, not the functions
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
