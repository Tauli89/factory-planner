import { createContext, useContext, useState, useMemo } from 'react';
import { MODULE_MAP } from '../data/modules';

const ModulContext = createContext(null);

export function ModulProvider({ children }) {
  // { [maschinenType]: { modulId: string, anzahl: number } }
  const [modulConfig, setModulConfig] = useState({});

  const setMaschinenModul = (maschinenType, modulId, anzahl) => {
    setModulConfig(prev => ({
      ...prev,
      [maschinenType]: { modulId, anzahl: Number(anzahl) },
    }));
  };

  // Computed effective bonuses per machine type
  const modulBoni = useMemo(() => {
    const result = {};
    for (const [maschinenType, config] of Object.entries(modulConfig)) {
      const modul = MODULE_MAP[config.modulId];
      if (!modul || modul.id === 'keins' || config.anzahl <= 0) continue;
      const speedBonus     = modul.speedBonus * config.anzahl;
      const produktivitaet = modul.produktivitaet * config.anzahl;
      if (speedBonus !== 0 || produktivitaet !== 0) {
        result[maschinenType] = { speedBonus, produktivitaet };
      }
    }
    return result;
  }, [modulConfig]);

  return (
    <ModulContext.Provider value={{ modulConfig, setMaschinenModul, modulBoni }}>
      {children}
    </ModulContext.Provider>
  );
}

export const useModul = () => useContext(ModulContext);
