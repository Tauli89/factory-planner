import { createContext, useContext, useState, useCallback } from 'react';
import { REZEPTE_MAP } from '../data/recipes';
import { DEFAULT_PLANETEN } from '../data/planets';

const LS_KEY = 'factoryplanner_planeten_v1';

function ladePlaneten() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set(DEFAULT_PLANETEN);
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? new Set(arr) : new Set(DEFAULT_PLANETEN);
  } catch { return new Set(DEFAULT_PLANETEN); }
}

const PlanetenContext = createContext(null);

export function PlanetenProvider({ children }) {
  const [aktivePlaneten, setAktivePlaneten] = useState(ladePlaneten);

  const togglePlanet = (id) => {
    setAktivePlaneten(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const istRezeptVerfuegbar = useCallback((rezeptId) => {
    if (aktivePlaneten.size === 0) return true;
    const rezept = REZEPTE_MAP[rezeptId];
    if (!rezept) return true;
    const planeten = rezept.planeten;
    if (!planeten) return true;
    return planeten.some(p => aktivePlaneten.has(p));
  }, [aktivePlaneten]);

  return (
    <PlanetenContext.Provider value={{ aktivePlaneten, togglePlanet, istRezeptVerfuegbar }}>
      {children}
    </PlanetenContext.Provider>
  );
}

export const usePlaneten = () => useContext(PlanetenContext);
