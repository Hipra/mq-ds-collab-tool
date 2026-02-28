import { create } from 'zustand';
import type { ComponentNode } from '@/lib/ast-inspector';

interface InspectorState {
  // Panel
  panelOpen: boolean;
  activeTab: 'copy' | 'components' | 'theme';
  // Inspector
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  componentTree: ComponentNode[];
  inspectorMode: boolean;
  // Preview
  previewWidth: number | 'auto';
  // Screens (Phase 3)
  sidebarOpen: boolean;
  activeScreenId: string;
  screens: { id: string; name: string; file: string }[];
}

interface InspectorActions {
  togglePanel: () => void;
  setActiveTab: (tab: 'copy' | 'components' | 'theme') => void;
  setSelectedComponent: (id: string | null) => void;
  setHoveredComponent: (id: string | null) => void;
  setComponentTree: (tree: ComponentNode[]) => void;
  setPreviewWidth: (width: number | 'auto') => void;
  setInspectorMode: (enabled: boolean) => void;
  // Screen actions (Phase 3)
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveScreen: (id: string) => void;
  setScreens: (screens: { id: string; name: string; file: string }[]) => void;
}

/**
 * Zustand store for Phase 2 inspector + responsive preview state.
 *
 * Manages:
 * - Inspector panel open/close and tab selection
 * - Selected/hovered component IDs (populated by iframe postMessages)
 * - Component tree (fetched from /api/preview/[id]/tree)
 * - Inspector mode toggle (sends SET_INSPECTOR_MODE to iframe)
 * - Preview viewport width (responsive preview width selector)
 */
export const useInspectorStore = create<InspectorState & InspectorActions>((set) => ({
  // Panel defaults
  panelOpen: true,
  activeTab: 'components',

  // Inspector defaults
  selectedComponentId: null,
  hoveredComponentId: null,
  componentTree: [],
  inspectorMode: true,

  // Preview defaults
  previewWidth: 'auto',

  // Screen defaults (Phase 3)
  sidebarOpen: true,
  activeScreenId: 'index',
  screens: [],

  // Actions
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedComponent: (id) => set({ selectedComponentId: id }),
  setHoveredComponent: (id) => set({ hoveredComponentId: id }),
  setComponentTree: (tree) => set({ componentTree: tree }),
  setPreviewWidth: (width) => set({ previewWidth: width }),
  setInspectorMode: (enabled) => set({ inspectorMode: enabled }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveScreen: (id) => set({ activeScreenId: id }),
  setScreens: (screens) => set({ screens }),
}));
