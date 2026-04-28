import { REZEPTE_MAP, MASCHINEN } from '../data/recipes';

// Crafting-Speed pro Maschinentyp (Standard-Ausbaustufe)
const MASCHINENGESCHWINDIGKEIT = {
  [MASCHINEN.ASSEMBLER]:    0.75,  // Montageautomat 2
  [MASCHINEN.SCHMELZOFEN]:  2.0,   // Elektrischer Ofen
  [MASCHINEN.CHEMIEANLAGE]: 1.0,
  [MASCHINEN.OELRAFFINERIE]:1.0,
  [MASCHINEN.ZENTRIFUGE]:   1.0,
  [MASCHINEN.HOCHOFEN]:     2.0,   // Foundry
  [MASCHINEN.EM_ANLAGE]:    2.0,   // Electromagnetic Plant
  [MASCHINEN.BIOKAMMER]:    1.0,
  [MASCHINEN.KRYOGENANLAGE]:1.0,
  [MASCHINEN.RECYCLER]:     0.5,
  [MASCHINEN.RAUMPLATTFORM]:1.0,
  [MASCHINEN.CRUSHER]:      1.0,
};

export const MASCHINEN_LABEL = {
  [MASCHINEN.BERGBAU]:      'Bergbau',
  [MASCHINEN.SCHMELZOFEN]:  'Schmelzofen',
  [MASCHINEN.ASSEMBLER]:    'Assembler',
  [MASCHINEN.CHEMIEANLAGE]: 'Chemieanlage',
  [MASCHINEN.OELRAFFINERIE]:'Ölraffinerie',
  [MASCHINEN.ZENTRIFUGE]:   'Zentrifuge',
  [MASCHINEN.HOCHOFEN]:     'Hochofen',
  [MASCHINEN.EM_ANLAGE]:    'Elektromagnetische Anlage',
  [MASCHINEN.BIOKAMMER]:    'Biokammer',
  [MASCHINEN.KRYOGENANLAGE]:'Kryogenanlage',
  [MASCHINEN.RECYCLER]:     'Recycler',
  [MASCHINEN.RAUMPLATTFORM]:'Raumplattform',
  [MASCHINEN.CRUSHER]:      'Asteroid-Zerkleinerer',
};

export const MASCHINEN_LABEL_EN = {
  [MASCHINEN.BERGBAU]:      'Mining',
  [MASCHINEN.SCHMELZOFEN]:  'Furnace',
  [MASCHINEN.ASSEMBLER]:    'Assembler',
  [MASCHINEN.CHEMIEANLAGE]: 'Chemical Plant',
  [MASCHINEN.OELRAFFINERIE]:'Oil Refinery',
  [MASCHINEN.ZENTRIFUGE]:   'Centrifuge',
  [MASCHINEN.HOCHOFEN]:     'Foundry',
  [MASCHINEN.EM_ANLAGE]:    'EM Plant',
  [MASCHINEN.BIOKAMMER]:    'Biochamber',
  [MASCHINEN.KRYOGENANLAGE]:'Cryogenic Plant',
  [MASCHINEN.RECYCLER]:     'Recycler',
  [MASCHINEN.RAUMPLATTFORM]:'Space Platform',
  [MASCHINEN.CRUSHER]:      'Crusher',
};

/**
 * Berechnet rekursiv alle benötigten Produktionsraten.
 * Rohstoffe (zeit === 0) werden im Akkumulator als Basis-Inputs gesammelt.
 */
export function berechneProduktion(id, mengeProSekunde, akkumulator = {}) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) {
    akkumulator[id] = (akkumulator[id] ?? 0) + mengeProSekunde;
    return akkumulator;
  }

  akkumulator[id] = (akkumulator[id] ?? 0) + mengeProSekunde;

  for (const zutat of rezept.zutaten) {
    const zutatRate = (zutat.menge / rezept.ergibt) * mengeProSekunde;
    berechneProduktion(zutat.id, zutatRate, akkumulator);
  }

  return akkumulator;
}

/**
 * Berechnet die benötigte Maschinenanzahl für eine geforderte Rate.
 * boni = { miningBonus: 0.3, assemblerBonus: 0 } aus ForschungContext
 */
export function maschinenAnzahl(id, mengeProSekunde, boni = {}) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) return null;

  let geschwindigkeit = MASCHINENGESCHWINDIGKEIT[rezept.maschine] ?? 1.0;

  // Assembler-Speed-Bonus auf alle nicht-Bergbau-Maschinen
  if (rezept.maschine !== MASCHINEN.BERGBAU && boni.assemblerBonus > 0) {
    geschwindigkeit *= (1 + boni.assemblerBonus);
  }

  const basisRate = (rezept.ergibt / rezept.zeit) * geschwindigkeit;

  // Mining Productivity erhöht den Output pro Miner → weniger Miner nötig
  if (rezept.maschine === MASCHINEN.BERGBAU && boni.miningBonus > 0) {
    const effektiveRate = basisRate * (1 + boni.miningBonus);
    return Math.ceil(mengeProSekunde / effektiveRate);
  }

  return Math.ceil(mengeProSekunde / basisRate);
}
