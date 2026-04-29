import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TECH_MAP, PRESETS, LEVEL_GRUPPEN } from '../data/research';
import gamedata from '../data/gamedata.json';

const ForschungContext = createContext(null);

const LS_KEY          = 'factoryplanner_research_v1';
const LS_KEY_INFINITE = 'factoryplanner_infinite_v1';

const IMMER_ERFORSCHT = ['automation-science-pack', 'steam-power', 'military'];

function ladeAusStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set([...IMMER_ERFORSCHT, ...JSON.parse(raw)]);
  } catch { /* ignore */ }
  return new Set(IMMER_ERFORSCHT);
}

function ladeInfiniteAusStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY_INFINITE);
    if (raw) return new Map(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Map();
}

// Index für schnellen Lookup: gruppeId → LEVEL_GRUPPEN-Eintrag
const GRUPPE_MAP = Object.fromEntries(LEVEL_GRUPPEN.map(g => [g.id, g]));

export function ForschungProvider({ children }) {
  const [erforscht,      setErforscht]      = useState(() => ladeAusStorage());
  // infiniteLevels: Map<gruppeId, extraLevels> – Levels über den diskreten Max hinaus
  const [infiniteLevels, setInfiniteLevels] = useState(() => ladeInfiniteAusStorage());

  const speichern = useCallback((neuSet) => {
    setErforscht(neuSet);
    try { localStorage.setItem(LS_KEY, JSON.stringify([...neuSet])); } catch { /* ignore */ }
  }, []);

  const speichernInfinite = useCallback((neuMap) => {
    setInfiniteLevels(neuMap);
    try { localStorage.setItem(LS_KEY_INFINITE, JSON.stringify([...neuMap.entries()])); } catch { /* ignore */ }
  }, []);

  // Alle transitiven Voraussetzungen einer Tech sammeln
  const alleVoraussetzungen = useCallback((id, besucht = new Set()) => {
    if (besucht.has(id)) return besucht;
    besucht.add(id);
    const tech = TECH_MAP[id];
    if (!tech) return besucht;
    for (const pre of tech.prerequisites) alleVoraussetzungen(pre, besucht);
    return besucht;
  }, []);

  const toggle = useCallback((id) => {
    const neu = new Set(erforscht);
    if (neu.has(id)) {
      neu.delete(id);
    } else {
      for (const pre of alleVoraussetzungen(id)) neu.add(pre);
    }
    speichern(neu);
  }, [erforscht, speichern, alleVoraussetzungen]);

  const setzePreset = useCallback((presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    const neu = new Set();
    for (const id of preset.ids) {
      for (const dep of alleVoraussetzungen(id)) neu.add(dep);
    }
    speichern(neu);
    speichernInfinite(new Map()); // Preset setzt infinite-Levels zurück
  }, [speichern, speichernInfinite, alleVoraussetzungen]);

  const allesZuruecksetzen = useCallback(() => {
    speichern(new Set(IMMER_ERFORSCHT));
    speichernInfinite(new Map());
  }, [speichern, speichernInfinite]);

  // Setzt diskrete Levels (innerhalb der gruppe.ids) und extra Infinite-Levels
  const setzeLevel = useCallback((gruppe, level) => {
    const { ids, isInfinite } = gruppe;
    const discreteLevel = Math.min(level, ids.length);
    const extraLevel    = isInfinite ? Math.max(0, level - ids.length) : 0;

    const neu = new Set(erforscht);
    for (const id of ids) neu.delete(id);
    if (discreteLevel > 0) {
      for (const dep of alleVoraussetzungen(ids[discreteLevel - 1])) neu.add(dep);
    }
    speichern(neu);

    if (isInfinite) {
      const neuInfinite = new Map(infiniteLevels);
      if (extraLevel <= 0) neuInfinite.delete(gruppe.id);
      else neuInfinite.set(gruppe.id, extraLevel);
      speichernInfinite(neuInfinite);
    }
  }, [erforscht, infiniteLevels, speichern, speichernInfinite, alleVoraussetzungen]);

  // Kumulierte Boni aus allen erforschten Technologien
  const boni = useMemo(() => {
    let miningBonus = 0;
    for (const id of erforscht) {
      const tech = TECH_MAP[id];
      if (!tech) continue;
      for (const eff of tech.effects) {
        if (eff.type === 'mining_productivity') miningBonus += eff.value;
      }
    }
    // Extra Infinite-Level-Boni (z.B. mining-productivity auf Stufe 5+)
    for (const [gruppeId, extraLevel] of infiniteLevels) {
      if (extraLevel <= 0) continue;
      const gruppe = GRUPPE_MAP[gruppeId];
      if (!gruppe?.isInfinite) continue;
      const infiniteTech = TECH_MAP[gruppe.ids[gruppe.ids.length - 1]];
      if (!infiniteTech) continue;
      for (const eff of infiniteTech.effects) {
        if (eff.type === 'mining_productivity') miningBonus += eff.value * extraLevel;
      }
    }
    return { miningBonus, assemblerBonus: 0 };
  }, [erforscht, infiniteLevels]);

  // Menge aller freigeschalteten Rezept-IDs
  const freigeschalteteRezepte = useMemo(() => {
    const ids = new Set();
    for (const id of erforscht) {
      const tech = gamedata.technologies[id];
      if (!tech) continue;
      for (const recipeId of tech.unlocks_recipes ?? []) ids.add(recipeId);
    }
    return ids;
  }, [erforscht]);

  return (
    <ForschungContext.Provider value={{
      erforscht,
      infiniteLevels,
      toggle,
      setzePreset,
      allesZuruecksetzen,
      setzeLevel,
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
