import { create } from 'zustand';
import type { ThemeConfig, PaletteConfig } from '@/lib/theme-config';
import { MUI_DEFAULTS } from '@/lib/theme-config';

interface ThemeConfigState {
  config: ThemeConfig;
  loading: boolean;
}

interface ThemeConfigActions {
  setConfig: (config: ThemeConfig) => void;
  updatePalette: (mode: 'light' | 'dark', path: string, value: string) => void;
  updateTypography: (key: 'fontFamily' | 'fontSize', value: string | number) => void;
  updateShape: (borderRadius: number) => void;
  updateSpacing: (spacing: number) => void;
  resetToDefaults: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand store for the global theme configuration.
 *
 * The ThemeTab fetches from GET /api/theme on mount and populates this store.
 * Changes are applied immediately (store + postMessage) and debounce-persisted
 * via PUT /api/theme from the ThemeTab component.
 */
export const useThemeConfigStore = create<ThemeConfigState & ThemeConfigActions>((set) => ({
  config: MUI_DEFAULTS,
  loading: true,

  setConfig: (config) => set({ config }),

  updatePalette: (mode, path, value) =>
    set((s) => {
      const palette = { ...s.config.palette };
      const modeConfig = { ...palette[mode] } as PaletteConfig & Record<string, unknown>;

      // path format: "primary.main", "background.default", "divider" (top-level)
      const parts = path.split('.');
      if (parts.length === 1) {
        // Top-level string field (e.g. "divider")
        modeConfig[parts[0] as keyof PaletteConfig] = value as never;
      } else {
        const [group, key] = parts;
        const groupVal = modeConfig[group as keyof PaletteConfig];
        if (groupVal && typeof groupVal === 'object') {
          modeConfig[group as keyof PaletteConfig] = { ...groupVal, [key]: value } as never;
        }
      }

      palette[mode] = modeConfig as PaletteConfig;
      return { config: { ...s.config, palette } };
    }),

  updateTypography: (key, value) =>
    set((s) => ({
      config: {
        ...s.config,
        typography: { ...s.config.typography, [key]: value },
      },
    })),

  updateShape: (borderRadius) =>
    set((s) => ({
      config: { ...s.config, shape: { borderRadius } },
    })),

  updateSpacing: (spacing) =>
    set((s) => ({
      config: { ...s.config, spacing },
    })),

  resetToDefaults: () => set({ config: MUI_DEFAULTS }),

  setLoading: (loading) => set({ loading }),
}));
