import { MODULE_TYPEN, MODULE_MAP, MODUL_SLOTS } from '../data/modules';
import { REZEPTE_MAP } from '../data/recipes';

export const OPTIMIERUNGSZIELE = {
  MAX_OUTPUT:     'max_output',
  MIN_RESSOURCEN: 'min_ressourcen',
  MIN_STROM:      'min_strom',
  BESTE_KOMBI:    'beste_kombi',
};

export const ZIEL_LABELS = {
  de: {
    [OPTIMIERUNGSZIELE.MAX_OUTPUT]:     'Maximaler Output',
    [OPTIMIERUNGSZIELE.MIN_RESSOURCEN]: 'Minimaler Ressourcenverbrauch',
    [OPTIMIERUNGSZIELE.MIN_STROM]:      'Minimaler Stromverbrauch',
    [OPTIMIERUNGSZIELE.BESTE_KOMBI]:    'Beste Gesamtkombination',
  },
  en: {
    [OPTIMIERUNGSZIELE.MAX_OUTPUT]:     'Maximum Output',
    [OPTIMIERUNGSZIELE.MIN_RESSOURCEN]: 'Minimum Resource Consumption',
    [OPTIMIERUNGSZIELE.MIN_STROM]:      'Minimum Power Consumption',
    [OPTIMIERUNGSZIELE.BESTE_KOMBI]:    'Best Overall Combination',
  },
};

export const ZIEL_BESCHREIBUNG = {
  de: {
    [OPTIMIERUNGSZIELE.MAX_OUTPUT]:     'Mehr Output pro Maschine – ideal wenn Maschinenanzahl der Engpass ist.',
    [OPTIMIERUNGSZIELE.MIN_RESSOURCEN]: 'Weniger Rohstoffe pro produziertem Item – ideal bei knappen Ressourcen.',
    [OPTIMIERUNGSZIELE.MIN_STROM]:      'Geringster Stromverbrauch pro Output – ideal bei Energiemangel.',
    [OPTIMIERUNGSZIELE.BESTE_KOMBI]:    'Ausgewogene Kombination aus Output, Ressourcen und Strom.',
  },
  en: {
    [OPTIMIERUNGSZIELE.MAX_OUTPUT]:     'More output per machine – ideal when machine count is the bottleneck.',
    [OPTIMIERUNGSZIELE.MIN_RESSOURCEN]: 'Fewer raw materials per item produced – ideal when resources are scarce.',
    [OPTIMIERUNGSZIELE.MIN_STROM]:      'Lowest power per output unit – ideal when energy is limited.',
    [OPTIMIERUNGSZIELE.BESTE_KOMBI]:    'Balanced combination of output, resources, and power.',
  },
};

/**
 * Collect all machine types in a product's full production chain.
 * Returns Map<maschinenType, Set<produktId>>
 */
export function getMaschinenInKette(produktId) {
  const maschinen = new Map();
  const visited   = new Set();

  function traverse(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const rezept = REZEPTE_MAP[id];
    if (!rezept || rezept.zeit === 0) return;
    if (!maschinen.has(rezept.maschine)) maschinen.set(rezept.maschine, new Set());
    maschinen.get(rezept.maschine).add(id);
    for (const zutat of rezept.zutaten) traverse(zutat.id);
  }

  traverse(produktId);
  return maschinen;
}

function berechneMetrik(modulId, anzahl) {
  const modul = MODULE_MAP[modulId];
  if (!modul || modul.id === 'keins' || anzahl <= 0) {
    return { outputFactor: 1, ingredientFactor: 1, energyPerOutputFactor: 1 };
  }
  const speedFaktor           = Math.max(0.2, 1 + modul.speedBonus * anzahl);
  const produktivitaet        = modul.produktivitaet * anzahl;
  const outputFaktor          = speedFaktor * (1 + produktivitaet);
  const energyFaktor          = Math.max(0.2, 1 + modul.energyBonus * anzahl);
  const energyPerOutputFaktor = energyFaktor / outputFaktor;
  const ingredientFaktor      = produktivitaet > 0 ? 1 / (1 + produktivitaet) : 1;
  return { outputFactor: outputFaktor, ingredientFactor: ingredientFaktor, energyPerOutputFactor: energyPerOutputFaktor };
}

function berechneGemischteMetrik(modulMix) {
  let gesamtSpeed = 0, gesamtProd = 0, gesamtEnergy = 0;
  for (const { modulId, anzahl } of modulMix) {
    const modul = MODULE_MAP[modulId];
    if (!modul || modul.id === 'keins' || anzahl <= 0) continue;
    gesamtSpeed  += modul.speedBonus * anzahl;
    gesamtProd   += modul.produktivitaet * anzahl;
    gesamtEnergy += modul.energyBonus * anzahl;
  }
  const speedFaktor  = Math.max(0.2, 1 + gesamtSpeed);
  const outputFaktor = speedFaktor * (1 + gesamtProd);
  const energyFaktor = Math.max(0.2, 1 + gesamtEnergy);
  return {
    outputFactor:         outputFaktor,
    ingredientFactor:     gesamtProd > 0 ? 1 / (1 + gesamtProd) : 1,
    energyPerOutputFactor: energyFaktor / outputFaktor,
  };
}

function score(metrik, ziel) {
  const { outputFactor, ingredientFactor, energyPerOutputFactor } = metrik;
  const outputGain   = outputFactor - 1;
  const resourceGain = 1 - ingredientFactor;
  const energyGain   = 1 - energyPerOutputFactor;
  switch (ziel) {
    case OPTIMIERUNGSZIELE.MAX_OUTPUT:     return outputGain;
    case OPTIMIERUNGSZIELE.MIN_RESSOURCEN: return resourceGain;
    case OPTIMIERUNGSZIELE.MIN_STROM:      return energyGain;
    case OPTIMIERUNGSZIELE.BESTE_KOMBI:    return outputGain * 0.5 + resourceGain * 0.3 + energyGain * 0.2;
    default: return 0;
  }
}

function optimiereMaschine(maschinenType, ziel) {
  const maxSlots = MODUL_SLOTS[maschinenType] ?? 0;
  const baseline = { modulId: 'keins', anzahl: 0, metrik: berechneMetrik('keins', 0) };
  if (maxSlots === 0) return baseline;
  let bestScore = score(baseline.metrik, ziel);
  let best = baseline;
  for (const modul of MODULE_TYPEN) {
    if (modul.id === 'keins') continue;
    for (let n = 1; n <= maxSlots; n++) {
      const metrik = berechneMetrik(modul.id, n);
      const s      = score(metrik, ziel);
      if (s > bestScore) { bestScore = s; best = { modulId: modul.id, anzahl: n, metrik }; }
    }
  }
  return best;
}

/**
 * Find the optimal module mix (including 2-type combinations) for every
 * optimization goal for a single machine type.
 *
 * Returns { maxSlots, ziele: { [ziel]: { modulMix: [{modulId, anzahl}], metrik } } }
 */
function optimiereMaschineAllZiele(maschinenType) {
  const maxSlots   = MODUL_SLOTS[maschinenType] ?? 0;
  const kandidaten = MODULE_TYPEN.filter(m => m.id !== 'keins');
  const baseMetrik = { outputFactor: 1, ingredientFactor: 1, energyPerOutputFactor: 1 };
  const ergebnisseProZiel = {};

  for (const ziel of Object.values(OPTIMIERUNGSZIELE)) {
    let bestScore = score(baseMetrik, ziel);
    let best = { modulMix: [], metrik: baseMetrik };

    if (maxSlots > 0) {
      // Single module type filling all slots
      for (const modul of kandidaten) {
        const metrik = berechneMetrik(modul.id, maxSlots);
        const s      = score(metrik, ziel);
        if (s > bestScore) {
          bestScore = s;
          best = { modulMix: [{ modulId: modul.id, anzahl: maxSlots }], metrik };
        }
      }

      // Mixed 2-type combinations
      if (maxSlots >= 2) {
        for (let i = 0; i < kandidaten.length; i++) {
          for (let j = i + 1; j < kandidaten.length; j++) {
            for (let n = 1; n < maxSlots; n++) {
              const mix = [
                { modulId: kandidaten[i].id, anzahl: n },
                { modulId: kandidaten[j].id, anzahl: maxSlots - n },
              ];
              const metrik = berechneGemischteMetrik(mix);
              const s      = score(metrik, ziel);
              if (s > bestScore) { bestScore = s; best = { modulMix: mix, metrik }; }
            }
          }
        }
      }
    }

    ergebnisseProZiel[ziel] = best;
  }

  return { maxSlots, ziele: ergebnisseProZiel };
}

export function optimiereModule(produktId, ziel) {
  if (!produktId || !REZEPTE_MAP[produktId]) return null;
  const maschinen    = getMaschinenInKette(produktId);
  const empfehlungen = new Map();
  for (const [maschinenType] of maschinen) {
    empfehlungen.set(maschinenType, optimiereMaschine(maschinenType, ziel));
  }
  return empfehlungen;
}

/**
 * Main entry for the all-goals table view.
 * Returns Map<maschinenType, { maxSlots, ziele: { [ziel]: { modulMix, metrik } } }>
 */
export function optimiereModuleAllZiele(produktId) {
  if (!produktId || !REZEPTE_MAP[produktId]) return null;
  const maschinen  = getMaschinenInKette(produktId);
  const ergebnisse = new Map();
  for (const [maschinenType] of maschinen) {
    ergebnisse.set(maschinenType, optimiereMaschineAllZiele(maschinenType));
  }
  return ergebnisse;
}

export function empfehlungenZuModulBoni(empfehlungen) {
  if (!empfehlungen) return {};
  const boni = {};
  for (const [maschinenType, { modulId, anzahl }] of empfehlungen) {
    const modul = MODULE_MAP[modulId];
    if (!modul || modul.id === 'keins' || anzahl <= 0) continue;
    const speedBonus     = modul.speedBonus * anzahl;
    const produktivitaet = modul.produktivitaet * anzahl;
    if (speedBonus !== 0 || produktivitaet !== 0) {
      boni[maschinenType] = { speedBonus, produktivitaet };
    }
  }
  return boni;
}

/**
 * Convert all-goals optimizer output to modulBoni for a specific goal.
 */
export function empfehlungenZuModulBoniAllZiele(ergebnisse, ziel) {
  if (!ergebnisse) return {};
  const boni = {};
  for (const [maschinenType, { ziele }] of ergebnisse) {
    const rec = ziele[ziel];
    if (!rec || !rec.modulMix || rec.modulMix.length === 0) continue;
    let speedBonus = 0, produktivitaet = 0;
    for (const { modulId, anzahl } of rec.modulMix) {
      const modul = MODULE_MAP[modulId];
      if (!modul || modul.id === 'keins' || anzahl <= 0) continue;
      speedBonus     += modul.speedBonus * anzahl;
      produktivitaet += modul.produktivitaet * anzahl;
    }
    if (speedBonus !== 0 || produktivitaet !== 0) {
      boni[maschinenType] = { speedBonus, produktivitaet };
    }
  }
  return boni;
}
