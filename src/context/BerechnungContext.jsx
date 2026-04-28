import { createContext, useContext, useState } from 'react';

const BerechnungContext = createContext(null);

export function BerechnungProvider({ children }) {
  const [maschinenListe, setMaschinenListe] = useState([]);
  return (
    <BerechnungContext.Provider value={{ maschinenListe, setMaschinenListe }}>
      {children}
    </BerechnungContext.Provider>
  );
}

export const useBerechnung = () => useContext(BerechnungContext);
