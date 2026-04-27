import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TECH_MAP, PRESETS } from '../data/research';

const ForschungContext = createContext(null);

const LS_KEY = 'factoryplanner_research_v1';

function ladeAusStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

export function ForschungProvider({ children }) {
  const [erforscht, setErforscht] = useState(() => ladeAusStorage());

  const speichern = useCallback((neuSet) => {
    setErforscht(neuSet);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...neuSet]));
    } catch { /* ignore */ }
  }, []);

  // Alle transitiven Voraussetzungen einer Tech sammeln
  const alleVoraussetzungen = useCallback((id, besucht = new Set()) => {
    if (besucht.has(id)) return besucht;
    besucht.add(id);
    const tech = TECH_MAP[id];
    if (!tech) return besucht;
    for (const pre of tech.prerequisites) {
      alleVoraussetzungen(pre, besucht);
    }
    return besucht;
  }, []);

  const toggle = useCallback((id) => {
    const neu = new Set(erforscht);
    if (neu.has(id)) {
      neu.delete(id);
    } else {
      // Alle Voraussetzungen automatisch miterforschen
      for (const pre of alleVoraussetzungen(id)) {
        neu.add(pre);
      }
    }
    speichern(neu);
  }, [erforscht, speichern, alleVoraussetzungen]);

  const setzePreset = useCallback((presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    const neu = new Set();
    for (const id of preset.ids) {
      for (const dep of alleVoraussetzungen(id)) {
        neu.add(dep);
      }
    }
    speichern(neu);
  }, [speichern, alleVoraussetzungen]);

  const allesZuruecksetzen = useCallback(() => speichern(new Set()), [speichern]);

  // Kumulierte Boni aus allen erforschten Technologien
  const boni = useMemo(() => {
    let miningBonus = 0;
    let assemblerBonus = 0;
    for (const id of erforscht) {
      const tech = TECH_MAP[id];
      if (!tech) continue;
      for (const eff of tech.effects) {
        if (eff.type === 'mining_productivity') miningBonus += eff.value;
        if (eff.type === 'assembler_speed') assemblerBonus += eff.value;
      }
    }
    return { miningBonus, assemblerBonus };
  }, [erforscht]);

  // Menge aller freigeschalteten Rezept-IDs
  const freigeschalteteRezepte = useMemo(() => {
    const ids = new Set();
    // Rezepte die immer verfügbar sind (keine Tech benötigt)
    // werden in ProduktAuswahl als Fallback behandelt
    for (const id of erforscht) {
      const tech = TECH_MAP[id];
      if (!tech) continue;
      for (const eff of tech.effects) {
        if (eff.type === 'unlock_recipe') ids.add(eff.id);
      }
    }
    return ids;
  }, [erforscht]);

  return (
    <ForschungContext.Provider value={{
      erforscht,
      toggle,
      setzePreset,
      allesZuruecksetzen,
      boni,
      freigeschalteteRezepte,
      alleVoraussetzungen,
    }}>
      {children}
    </ForschungContext.Provider>
  );
}

export function useForschung() {
  const ctx = useContext(ForschungContext);
  if (!ctx) throw new Error('useForschung muss innerhalb von ForschungProvider verwendet werden');
  return ctx;
}
