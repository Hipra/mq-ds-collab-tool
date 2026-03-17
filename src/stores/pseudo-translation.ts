import { create } from 'zustand';
import type { PseudoMode } from '@/lib/pseudo-translation';

interface PseudoState {
  mode: PseudoMode | null;
}

interface PseudoActions {
  setMode: (mode: PseudoMode | null) => void;
}

export const usePseudoTranslationStore = create<PseudoState & PseudoActions>((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
}));
