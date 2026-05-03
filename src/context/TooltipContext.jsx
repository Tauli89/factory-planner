import { createContext, useContext, useState, useCallback } from 'react';

const TooltipCtx = createContext(null);

export function TooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState({ visible: false, itemId: null, x: 0, y: 0 });

  const showTooltip = useCallback((itemId, x, y) =>
    setTooltip({ visible: true, itemId, x, y }), []);

  const hideTooltip = useCallback(() =>
    setTooltip(prev => ({ ...prev, visible: false })), []);

  const moveTooltip = useCallback((x, y) =>
    setTooltip(prev => prev.visible ? { ...prev, x, y } : prev), []);

  return (
    <TooltipCtx.Provider value={{ tooltip, showTooltip, hideTooltip, moveTooltip }}>
      {children}
    </TooltipCtx.Provider>
  );
}

export function useTooltip() {
  return useContext(TooltipCtx);
}
