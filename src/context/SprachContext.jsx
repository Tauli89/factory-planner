import { createContext, useContext, useState } from 'react';

const SprachContext = createContext(null);
const LS_KEY = 'factoryplanner_language';

export function SprachProvider({ children }) {
  const [sprache, setSpracheState] = useState(() => {
    try { return localStorage.getItem(LS_KEY) ?? 'de'; } catch { return 'de'; }
  });

  const setSprache = (s) => {
    setSpracheState(s);
    try { localStorage.setItem(LS_KEY, s); } catch {}
  };

  return (
    <SprachContext.Provider value={{ sprache, setSprache }}>
      {children}
    </SprachContext.Provider>
  );
}

export function useSprache() {
  const ctx = useContext(SprachContext);
  if (!ctx) throw new Error('useSprache muss innerhalb von SprachProvider verwendet werden');
  return ctx;
}
