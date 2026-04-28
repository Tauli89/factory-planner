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

/**
 * Compute performance metrics for N slots of a module on a machine.
 *
 * outputFactor          – output per machine relative to no modules (1 = baseline)
 * ingredientFactor      – raw-material cost per output unit (1 = baseline, 0.8 = 20% fewer ingredients)
 * energyPerOutputFactor – energy per output unit (1 = baseline, 0.5 = half the energy)
 */
function berechneMetrik(modulId, anzahl) {
  const modul = MODULE_MAP[modulId];
  if (!modul || modul.id === 'keins' || anzahl <= 0) {
    return { outputFactor: 1, ingredientFactor: 1, energyPerOutputFactor: 1 };
  }

  // Speed can't drop below 20 % of base
  const speedFaktor    = Math.max(0.2, 1 + modul.speedBonus * anzahl);
  const produktivitaet = modul.produktivitaet * anzahl;
  const outputFaktor   = speedFaktor * (1 + produktivitaet);

  // Factorio floors energy consumption at 20 % of base
  const energyFaktor          = Math.max(0.2, 1 + modul.energyBonus * anzahl);
  const energyPerOutputFaktor = energyFaktor / outputFaktor;

  // Productivity reduces ingredients needed per output item
  const ingredientFaktor = produktivitaet > 0 ? 1 / (1 + produktivitaet) : 1;

  return { outputFactor: outputFaktor, ingredientFactor: ingredientFaktor, energyPerOutputFactor: energyPerOutputFaktor };
}

/**
 * Score a metric configuration for the given goal.
 * Higher score = better for every goal.
 */
function score(metrik, ziel) {
  const { outputFactor, ingredientFactor, energyPerOutputFactor } = metrik;
  // Percentage deltas vs. baseline
  const outputGain    = outputFactor - 1;
  const resourceGain  = 1 - ingredientFactor;            // positive = saves resources
  const energyGain    = 1 - energyPerOutputFactor;       // positive = saves energy

  switch (ziel) {
    case OPTIMIERUNGSZIELE.MAX_OUTPUT:
      return outputGain;
    case OPTIMIERUNGSZIELE.MIN_RESSOURCEN:
      return resourceGain;
    case OPTIMIERUNGSZIELE.MIN_STROM:
      return energyGain;
    case OPTIMIERUNGSZIELE.BESTE_KOMBI:
      // Balanced: output 50 %, resources 30 %, energy 20 %
      return outputGain * 0.5 + resourceGain * 0.3 + energyGain * 0.2;
    default:
      return 0;
  }
}

/**
 * Find the optimal module type & slot count for a single machine type.
 */
function optimiereMaschine(maschinenType, ziel) {
  const maxSlots = MODUL_SLOTS[maschinenType] ?? 0;
  const baseline = { modulId: 'keins', anzahl: 0, metrik: berechneMetrik('keins', 0) };
  if (maxSlots === 0) return baseline;

  let bestScore  = score(baseline.metrik, ziel);
  let best       = baseline;

  for (const modul of MODULE_TYPEN) {
    if (modul.id === 'keins') continue;
    for (let n = 1; n <= maxSlots; n++) {
      const metrik = berechneMetrik(modul.id, n);
      const s      = score(metrik, ziel);
      if (s > bestScore) {
        bestScore = s;
        best = { modulId: modul.id, anzahl: n, metrik };
      }
    }
  }

  return best;
}

/**
 * Main entry point: returns optimized module recommendations for all
 * machine types in the production chain of `produktId`.
 *
 * Returns { empfehlungen: Map<maschinenType, { modulId, anzahl, metrik }> }
 */
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
 * Convert optimizer output to the modulBoni format expected by berechneProduktion / maschinenAnzahl.
 */
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
