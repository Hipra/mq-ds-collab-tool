'use client';

import { createContext, useContext } from 'react';

interface FlowContextValue {
  triggerSave: () => void;
}

export const FlowContext = createContext<FlowContextValue>({
  triggerSave: () => {},
});

export const useFlowContext = () => useContext(FlowContext);
