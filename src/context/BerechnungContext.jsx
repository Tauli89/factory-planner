import { createContext, useContext, useState, useCallback } from 'react';

const BerechnungContext = createContext(null);

export function BerechnungProvider({ children }) {
  const [maschinenListe, setMaschinenListe] = useState([]);
  const [ignorierteItems, setIgnorierteItems] = useState(new Set());

  const toggleIgnoriertesItem = useCallback((id) => {
    setIgnorierteItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <BerechnungContext.Provider value={{ maschinenListe, setMaschinenListe, ignorierteItems, toggleIgnoriertesItem }}>
      {children}
    </BerechnungContext.Provider>
  );
}

export const useBerechnung = () => useContext(BerechnungContext);
