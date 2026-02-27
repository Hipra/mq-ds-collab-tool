import { create } from 'zustand';
import type { TextEntry } from '@/lib/text-extractor';
import type { ConflictEntry } from '@/lib/copy-overlay';

/**
 * copy.ts — Zustand store for the Copy tab state.
 *
 * Manages:
 * - Text entries (with edit history from overlay)
 * - Conflicts (source changed under copywriter edit)
 * - Search query and UI state
 * - Collapsed groups (component-level collapse)
 * - Highlighted key (from preview click)
 *
 * Phase 3 — INSP-03
 */

export interface CopyEntryWithHistory extends TextEntry {
  edits: Array<{ value: string; timestamp: string }>; // edit history from overlay
}

interface CopyState {
  entries: CopyEntryWithHistory[];
  conflicts: ConflictEntry[];
  summary: { total: number; modified: number };
  searchQuery: string;
  collapsedGroups: Set<string>; // component names that are collapsed
  highlightedKey: string | null; // entry highlighted from preview click
  loading: boolean;
}

interface CopyActions {
  setEntries: (
    entries: TextEntry[],
    conflicts: ConflictEntry[],
    summary: { total: number; modified: number },
    editsMap?: Record<string, Array<{ value: string; timestamp: string }>>
  ) => void;
  updateEntry: (key: string, value: string) => void;
  resetEntry: (key: string) => void;
  setSearchQuery: (query: string) => void;
  toggleGroup: (componentName: string) => void;
  setHighlightedKey: (key: string | null) => void;
  setLoading: (loading: boolean) => void;
  resolveConflict: (key: string, chosenValue: string) => void;
}

export const useCopyStore = create<CopyState & CopyActions>((set) => ({
  // State defaults
  entries: [],
  conflicts: [],
  summary: { total: 0, modified: 0 },
  searchQuery: '',
  collapsedGroups: new Set<string>(),
  highlightedKey: null,
  loading: false,

  // Actions
  setEntries: (entries, conflicts, summary, editsMap = {}) => {
    const entriesWithHistory: CopyEntryWithHistory[] = entries.map((e) => ({
      ...e,
      edits: editsMap[e.key] ?? [],
    }));
    set({ entries: entriesWithHistory, conflicts, summary, loading: false });
  },

  updateEntry: (key, value) => {
    set((state) => {
      const entries = state.entries.map((e) => {
        if (e.key !== key) return e;
        return { ...e, currentValue: value };
      });
      // Recalculate modified count
      const modified = entries.filter((e) => e.currentValue !== e.sourceValue).length;
      return { entries, summary: { ...state.summary, modified } };
    });
  },

  resetEntry: (key) => {
    set((state) => {
      const entries = state.entries.map((e) => {
        if (e.key !== key) return e;
        return { ...e, currentValue: e.sourceValue };
      });
      const modified = entries.filter((e) => e.currentValue !== e.sourceValue).length;
      return { entries, summary: { ...state.summary, modified } };
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleGroup: (componentName) => {
    set((state) => {
      const next = new Set(state.collapsedGroups);
      if (next.has(componentName)) {
        next.delete(componentName);
      } else {
        next.add(componentName);
      }
      return { collapsedGroups: next };
    });
  },

  setHighlightedKey: (key) => set({ highlightedKey: key }),

  setLoading: (loading) => set({ loading }),

  resolveConflict: (key, chosenValue) => {
    set((state) => {
      // Remove from conflicts
      const conflicts = state.conflicts.filter((c) => c.key !== key);
      // Update the entry's currentValue
      const entries = state.entries.map((e) => {
        if (e.key !== key) return e;
        return { ...e, currentValue: chosenValue };
      });
      const modified = entries.filter((e) => e.currentValue !== e.sourceValue).length;
      return { conflicts, entries, summary: { ...state.summary, modified } };
    });
  },
}));
