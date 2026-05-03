import { REZEPTE_MAP, MASCHINEN, ITEM_TO_REZEPTE_IDS, REZEPT_ZU_ITEM_ID } from '../data/recipes';
import { MASCHINEN_STROMVERBRAUCH, ENERGIEQUELLEN } from '../data/machines';
import gamedata from '../data/gamedata.json';

export const BEACON_MODUL_EFFEKTE = {
  'speed-module':          { speed: 0.20 },
  'speed-module-2':        { speed: 0.30 },
  'speed-module-3':        { speed: 0.50 },
  'efficiency-module':     { energy: -0.30 },
  'efficiency-module-2':   { energy: -0.40 },
  'efficiency-module-3':   { energy: -0.50 },
  'productivity-module':   { speed: 0.04 },
  'productivity-module-2': { speed: 0.06 },
  'productivity-module-3': { speed: 0.10 },
};

const MASCHINENGESCHWINDIGKEIT = {
  [MASCHINEN.ASSEMBLER]:    0.75, // assembling-machine-2
  [MASCHINEN.SCHMELZOFEN]:  2.0,  // electric-furnace
  [MASCHINEN.CHEMIEANLAGE]: 1.0,  // chemical-plant
  [MASCHINEN.OELRAFFINERIE]:1.0,  // oil-refinery
  [MASCHINEN.ZENTRIFUGE]:   1.0,  // centrifuge
  [MASCHINEN.HOCHOFEN]:     4.0,  // foundry (gamedata: 4.0, was 2.0)
  [MASCHINEN.EM_ANLAGE]:    2.0,  // electromagnetic-plant
  [MASCHINEN.BIOKAMMER]:    2.0,  // biochamber (gamedata: 2.0, was 1.0)
  [MASCHINEN.KRYOGENANLAGE]:2.0,  // cryogenic-plant (gamedata: 2.0, was 1.0)
  [MASCHINEN.RECYCLER]:     0.5,  // recycler
  [MASCHINEN.RAUMPLATTFORM]:1.0,  // space-platform-hub
  [MASCHINEN.CRUSHER]:      1.0,  // crusher
};

export const MASCHINEN_LABEL = {
  [MASCHINEN.BERGBAU]:      'Elektr. Bergbaubohrer',
  [MASCHINEN.SCHMELZOFEN]:  'Elektrischer Ofen',
  [MASCHINEN.ASSEMBLER]:    'Montageautomat 2',
  [MASCHINEN.CHEMIEANLAGE]: 'Chemieanlage',
  [MASCHINEN.OELRAFFINERIE]:'Ölraffinerie',
  [MASCHINEN.ZENTRIFUGE]:   'Zentrifuge',
  [MASCHINEN.HOCHOFEN]:     'Hochofen',
  [MASCHINEN.EM_ANLAGE]:    'Elektromagnetische Anlage',
  [MASCHINEN.BIOKAMMER]:    'Biokammer',
  [MASCHINEN.KRYOGENANLAGE]:'Kryogenanlage',
  [MASCHINEN.RECYCLER]:     'Recycler',
  [MASCHINEN.RAUMPLATTFORM]:'Raumplattform-Hub',
  [MASCHINEN.CRUSHER]:      'Asteroid-Zerkleinerer',
};

export const MASCHINEN_LABEL_EN = {
  [MASCHINEN.BERGBAU]:      'Electric Mining Drill',
  [MASCHINEN.SCHMELZOFEN]:  'Electric Furnace',
  [MASCHINEN.ASSEMBLER]:    'Assembling Machine 2',
  [MASCHINEN.CHEMIEANLAGE]: 'Chemical Plant',
  [MASCHINEN.OELRAFFINERIE]:'Oil Refinery',
  [MASCHINEN.ZENTRIFUGE]:   'Centrifuge',
  [MASCHINEN.HOCHOFEN]:     'Foundry',
  [MASCHINEN.EM_ANLAGE]:    'EM Plant',
  [MASCHINEN.BIOKAMMER]:    'Biochamber',
  [MASCHINEN.KRYOGENANLAGE]:'Cryogenic Plant',
  [MASCHINEN.RECYCLER]:     'Recycler',
  [MASCHINEN.RAUMPLATTFORM]:'Space Platform Hub',
  [MASCHINEN.CRUSHER]:      'Crusher',
};

/**
 * Gibt alle Maschinen zurück, die ein bestimmtes Rezept herstellen können.
 * Sortiert nach crafting_speed aufsteigend.
 */
export function getVerfuegbareMaschinen(rezeptId) {
  const recipe = gamedata.recipes[rezeptId];
  if (!recipe?.made_in?.length) return [];
  return recipe.made_in
    .map(machineId => {
      const m = gamedata.machines[machineId];
      if (!m) return null;
      return { id: machineId, nameDe: m.name.de, nameEn: m.name.en, speed: m.crafting_speed, energyUsage: m.energy_usage_kw };
    })
    .filter(Boolean)
    .sort((a, b) => a.speed - b.speed);
}

/**
 * Gibt alle Rezepte zurück, die dasselbe Hauptprodukt erzeugen wie `id`
 * (id kann eine Rezept-ID oder eine Item-ID sein).
 */
export function getVerfuegbareRezepte(id) {
  const itemId   = REZEPT_ZU_ITEM_ID[id] ?? id;
  const rezeptIds = ITEM_TO_REZEPTE_IDS[itemId] ?? (REZEPTE_MAP[id] ? [id] : []);
  return rezeptIds.map(rid => REZEPTE_MAP[rid]).filter(Boolean);
}

/**
 * Berechnet alle benötigten Produktionsraten (BFS, kein exponentielles Rekursion-Problem).
 * modulBoni:      { [maschinenType]: { speedBonus, produktivitaet } }
 * rezeptOverrides: { [itemOderRezeptId]: rezeptId } – alternatives Rezept pro Produkt
 */
export function berechneProduktion(rootId, rootRate, akkumulator = {}, modulBoni = {}, rezeptOverrides = {}) {
  let pending = { [rootId]: rootRate };
  while (Object.keys(pending).length > 0) {
    const nextPending = {};
    for (const [id, rate] of Object.entries(pending)) {
      akkumulator[id] = (akkumulator[id] ?? 0) + rate;
      const rezeptId = rezeptOverrides[id] ?? id;
      const rezept   = REZEPTE_MAP[rezeptId];
      if (!rezept || rezept.zeit === 0) continue;
      const modulBonus     = modulBoni[rezept.maschine];
      const produktivitaet = modulBonus?.produktivitaet ?? 0;
      const ingredientFaktor = 1 / (1 + produktivitaet);
      for (const zutat of rezept.zutaten) {
        if (zutat.id === id) continue; // skip self-referential ingredients (e.g. pentapod-egg)
        const zutatRate = (zutat.menge / rezept.ergibt) * rate * ingredientFaktor;
        nextPending[zutat.id] = (nextPending[zutat.id] ?? 0) + zutatRate;
      }
    }
    pending = nextPending;
  }
  return akkumulator;
}

/**
 * Berechnet die Anzahl benötigter Maschinen für eine gegebene Rate.
 * boni:                   { miningBonus, assemblerBonus } aus ForschungContext
 * modulBoni:              { [maschinenType]: { speedBonus, produktivitaet } }
 * maschinenQualitaetMulti: Geschwindigkeitsmultiplikator durch Maschinenqualität (Standard: 1.0)
 *                          Höhere Qualität = schnellere Maschine = weniger Maschinen benötigt
 */
export function maschinenAnzahl(id, mengeProSekunde, boni = {}, modulBoni = {}, maschinenQualitaetMulti = 1, maschinenOverrideId = null, beaconConfig = null) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) return null;

  let geschwindigkeit;
  if (maschinenOverrideId && gamedata.machines[maschinenOverrideId]) {
    geschwindigkeit = gamedata.machines[maschinenOverrideId].crafting_speed;
  } else {
    geschwindigkeit = MASCHINENGESCHWINDIGKEIT[rezept.maschine] ?? 1.0;
  }

  // Maschinenqualität steigert die Basisgeschwindigkeit
  if (maschinenQualitaetMulti !== 1) {
    geschwindigkeit *= maschinenQualitaetMulti;
  }

  // Forschungs-Assembler-Geschwindigkeitsbonus (nicht für Bergbau)
  if (rezept.maschine !== MASCHINEN.BERGBAU && boni.assemblerBonus > 0) {
    geschwindigkeit *= (1 + boni.assemblerBonus);
  }

  // Modulgeschwindigkeitsbonus (Geschwindigkeitsmodule: positiv, Produktivitätsmodule: negativ)
  const modulBonus = modulBoni[rezept.maschine];
  if (modulBonus?.speedBonus) {
    geschwindigkeit *= (1 + modulBonus.speedBonus);
  }

  // Beacon-Geschwindigkeitsbonus (Beacons übertragen 50% des Modul-Effekts)
  if (beaconConfig?.anzahlBeacons > 0) {
    const bkEffekt = BEACON_MODUL_EFFEKTE[beaconConfig.modulTyp];
    if (bkEffekt?.speed) {
      geschwindigkeit *= (1 + beaconConfig.anzahlBeacons * beaconConfig.moduleProBeacon * bkEffekt.speed * 0.5);
    }
  }

  // Produktivitätsmodule erhöhen den effektiven Output pro Zyklus
  const produktivitaet = modulBonus?.produktivitaet ?? 0;
  const effektiverOutput = rezept.ergibt * (1 + produktivitaet);

  const basisRate = (effektiverOutput / rezept.zeit) * geschwindigkeit;

  if (rezept.maschine === MASCHINEN.BERGBAU && boni.miningBonus > 0) {
    const effektiveRate = basisRate * (1 + boni.miningBonus);
    return Math.ceil(mengeProSekunde / effektiveRate);
  }

  return Math.ceil(mengeProSekunde / basisRate);
}

/**
 * Berechnet den Gesamtstromverbrauch der Produktionskette.
 * Gibt pro Maschinen-Typ die Anzahl und kW-Werte zurück,
 * sowie den Gesamtverbrauch und Energieempfehlungen.
 */
export function berechneStromverbrauch(produktion, boni = {}, modulBoni = {}, maschinenQualitaetMulti = 1, maschinenOverrides = {}, beaconConfigs = {}) {
  const perTyp = {}; // maschinenKey → { anzahl, kwProMaschine, totalKW, name? }

  for (const [id, rateProSek] of Object.entries(produktion)) {
    const rezept = REZEPTE_MAP[id];
    if (!rezept || rezept.zeit === 0) continue;

    const overrideId = maschinenOverrides[id] ?? null;
    const beaconCfg  = beaconConfigs[id] ?? null;
    const anzahl = maschinenAnzahl(id, rateProSek, boni, modulBoni, maschinenQualitaetMulti, overrideId, beaconCfg);
    if (!anzahl) continue;

    let maschinenKey, kwProMaschine, name;
    if (overrideId && gamedata.machines[overrideId]) {
      const m = gamedata.machines[overrideId];
      maschinenKey  = overrideId;
      kwProMaschine = m.energy_usage_kw;
      name          = { de: m.name.de, en: m.name.en };
    } else {
      maschinenKey  = rezept.maschine;
      kwProMaschine = MASCHINEN_STROMVERBRAUCH[rezept.maschine] ?? 0;
      name          = null;
    }

    if (kwProMaschine === 0) continue;

    let effectiveKwPro = kwProMaschine;
    if (beaconCfg?.anzahlBeacons > 0) {
      const bkEffekt = BEACON_MODUL_EFFEKTE[beaconCfg.modulTyp];
      if (bkEffekt?.energy < 0) {
        const reduction = beaconCfg.anzahlBeacons * beaconCfg.moduleProBeacon * Math.abs(bkEffekt.energy) * 0.5;
        effectiveKwPro = kwProMaschine * Math.max(0.2, 1 - reduction);
      }
    }

    if (!perTyp[maschinenKey]) {
      perTyp[maschinenKey] = { anzahl: 0, kwProMaschine, totalKW: 0, name };
    }
    perTyp[maschinenKey].anzahl  += anzahl;
    perTyp[maschinenKey].totalKW += anzahl * effectiveKwPro;
  }

  const gesamtKW = Object.values(perTyp).reduce((s, v) => s + v.totalKW, 0);
  const gesamtMW = gesamtKW / 1000;

  return {
    perTyp,
    gesamtKW,
    gesamtMW,
    solarPanels:    Math.ceil(gesamtKW / ENERGIEQUELLEN.solarPanel.leistungKW),
    dampfmaschinen: Math.ceil(gesamtKW / ENERGIEQUELLEN.dampfmaschine.leistungKW),
  };
}
