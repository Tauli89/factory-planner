import { createContext, useContext, useState } from 'react';
import { MASCHINEN } from '../data/recipes';

const LS_KEY = 'factoryplanner_einstellungen_v1';

export const EINSTELLUNGEN_DEFAULT = {
  standardBandId: 'keins',
  defaultMaschinenPerType: {
    [MASCHINEN.ASSEMBLER]:   'assembling-machine-2',
    [MASCHINEN.SCHMELZOFEN]: 'electric-furnace',
    [MASCHINEN.BERGBAU]:     'electric-mining-drill',
  },
  anzeigeEinheit: 'min',
};

function ladeEinstellungen() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return EINSTELLUNGEN_DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      ...EINSTELLUNGEN_DEFAULT,
      ...parsed,
      defaultMaschinenPerType: {
        ...EINSTELLUNGEN_DEFAULT.defaultMaschinenPerType,
        ...(parsed.defaultMaschinenPerType ?? {}),
      },
    };
  } catch { return EINSTELLUNGEN_DEFAULT; }
}

const EinstellungenContext = createContext(null);

export function EinstellungenProvider({ children }) {
  const [einstellungen, setEinstellungenState] = useState(ladeEinstellungen);

  const setEinstellungen = (updater) => {
    setEinstellungenState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <EinstellungenContext.Provider value={{ einstellungen, setEinstellungen }}>
      {children}
    </EinstellungenContext.Provider>
  );
}

export const useEinstellungen = () => useContext(EinstellungenContext);
