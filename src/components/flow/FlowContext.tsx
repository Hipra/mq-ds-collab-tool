'use client';

import { createContext, useContext } from 'react';

interface FlowContextValue {
  triggerSave: () => void;
  /** screenId → timestamp of last thumbnail update, for cache-busting */
  thumbnailVersions: Record<string, number>;
}

export const FlowContext = createContext<FlowContextValue>({
  triggerSave: () => {},
  thumbnailVersions: {},
});

export const useFlowContext = () => useContext(FlowContext);
