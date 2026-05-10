import { createContext, useContext, useState } from 'react';

const TechtreeContext = createContext(null);

const LS_MODUS     = 'factoryplanner_techtree_modus_v1';
const LS_MASCHINEN = 'factoryplanner_globale_maschinen_v1';

export function TechtreeProvider({ children }) {
  const [techtreeModus, setTechtreeModusState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_MODUS);
      return raw === null ? true : JSON.parse(raw);
    } catch { return true; }
  });

  const [globaleMaschinen, setGlobaleMaschinenState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_MASCHINEN);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const setTechtreeModus = (val) => {
    setTechtreeModusState(val);
    try { localStorage.setItem(LS_MODUS, JSON.stringify(val)); } catch {}
  };

  const setGlobaleMaschine = (maschinenType, maschinenId) => {
    setGlobaleMaschinenState(prev => {
      const next = { ...prev, [maschinenType]: maschinenId };
      try { localStorage.setItem(LS_MASCHINEN, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <TechtreeContext.Provider value={{ techtreeModus, setTechtreeModus, globaleMaschinen, setGlobaleMaschine }}>
      {children}
    </TechtreeContext.Provider>
  );
}

export const useTechtree = () => useContext(TechtreeContext);
