import { createContext, useContext, useState, useMemo } from 'react';
import { MODULE_MAP } from '../data/modules';

const LS_MODUL = 'factoryplanner_module_v1';

const ModulContext = createContext(null);

export function ModulProvider({ children }) {
  // { [maschinenType]: { modulId: string, anzahl: number } }
  const [modulConfig, setModulConfig] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_MODUL);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const setMaschinenModul = (maschinenType, modulId, anzahl) => {
    setModulConfig(prev => {
      const next = { ...prev, [maschinenType]: { modulId, anzahl: Number(anzahl) } };
      try { localStorage.setItem(LS_MODUL, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const applyModulConfig = (config) => {
    setModulConfig(config);
    try { localStorage.setItem(LS_MODUL, JSON.stringify(config)); } catch {}
  };

  // Computed speed/productivity bonuses per machine type
  const modulBoni = useMemo(() => {
    const result = {};
    for (const [maschinenType, config] of Object.entries(modulConfig)) {
      const modul = MODULE_MAP[config.modulId];
      if (!modul || modul.id === 'keins' || config.anzahl <= 0) continue;
      const speedBonus     = modul.speedBonus * config.anzahl;
      const produktivitaet = modul.produktivitaet * config.anzahl;
      const energyBonus    = modul.energyBonus * config.anzahl;
      if (speedBonus !== 0 || produktivitaet !== 0 || energyBonus !== 0) {
        result[maschinenType] = { speedBonus, produktivitaet, energyBonus };
      }
    }
    return result;
  }, [modulConfig]);

  // Raw quality bonus per machine type (before machine-quality multiplier is applied)
  const qualityBoniPerMaschine = useMemo(() => {
    const result = {};
    for (const [maschinenType, config] of Object.entries(modulConfig)) {
      const modul = MODULE_MAP[config.modulId];
      if (!modul || modul.id === 'keins' || config.anzahl <= 0 || !modul.qualityBonus) continue;
      result[maschinenType] = modul.qualityBonus * config.anzahl;
    }
    return result;
  }, [modulConfig]);

  return (
    <ModulContext.Provider value={{ modulConfig, setMaschinenModul, applyModulConfig, modulBoni, qualityBoniPerMaschine }}>
      {children}
    </ModulContext.Provider>
  );
}

export const useModul = () => useContext(ModulContext);
