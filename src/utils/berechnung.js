import { REZEPTE_MAP, MASCHINEN } from '../data/recipes';

const MASCHINENGESCHWINDIGKEIT = {
  [MASCHINEN.ASSEMBLER]:    0.75,
  [MASCHINEN.SCHMELZOFEN]:  2.0,
  [MASCHINEN.CHEMIEANLAGE]: 1.0,
  [MASCHINEN.OELRAFFINERIE]:1.0,
  [MASCHINEN.ZENTRIFUGE]:   1.0,
  [MASCHINEN.HOCHOFEN]:     2.0,
  [MASCHINEN.EM_ANLAGE]:    2.0,
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
 * Recursively calculates all required production rates.
 * modulBoni: { [maschinenType]: { speedBonus, produktivitaet } }
 * Productivity modules reduce ingredient consumption per output item.
 */
export function berechneProduktion(id, mengeProSekunde, akkumulator = {}, modulBoni = {}) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) {
    akkumulator[id] = (akkumulator[id] ?? 0) + mengeProSekunde;
    return akkumulator;
  }

  akkumulator[id] = (akkumulator[id] ?? 0) + mengeProSekunde;

  // Productivity modules reduce ingredient consumption per output item
  const modulBonus     = modulBoni[rezept.maschine];
  const produktivitaet = modulBonus?.produktivitaet ?? 0;
  const ingredientFaktor = 1 / (1 + produktivitaet);

  for (const zutat of rezept.zutaten) {
    const zutatRate = (zutat.menge / rezept.ergibt) * mengeProSekunde * ingredientFaktor;
    berechneProduktion(zutat.id, zutatRate, akkumulator, modulBoni);
  }

  return akkumulator;
}

/**
 * Calculates the number of machines needed for a given rate.
 * boni:     { miningBonus, assemblerBonus } from ForschungContext
 * modulBoni: { [maschinenType]: { speedBonus, produktivitaet } }
 */
export function maschinenAnzahl(id, mengeProSekunde, boni = {}, modulBoni = {}) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) return null;

  let geschwindigkeit = MASCHINENGESCHWINDIGKEIT[rezept.maschine] ?? 1.0;

  // Research assembler speed bonus (non-mining)
  if (rezept.maschine !== MASCHINEN.BERGBAU && boni.assemblerBonus > 0) {
    geschwindigkeit *= (1 + boni.assemblerBonus);
  }

  // Module speed bonus (speed modules: positive, productivity modules: negative)
  const modulBonus = modulBoni[rezept.maschine];
  if (modulBonus?.speedBonus) {
    geschwindigkeit *= (1 + modulBonus.speedBonus);
  }

  // Productivity modules increase effective output per cycle
  const produktivitaet = modulBonus?.produktivitaet ?? 0;
  const effektiverOutput = rezept.ergibt * (1 + produktivitaet);

  const basisRate = (effektiverOutput / rezept.zeit) * geschwindigkeit;

  if (rezept.maschine === MASCHINEN.BERGBAU && boni.miningBonus > 0) {
    const effektiveRate = basisRate * (1 + boni.miningBonus);
    return Math.ceil(mengeProSekunde / effektiveRate);
  }

  return Math.ceil(mengeProSekunde / basisRate);
}
