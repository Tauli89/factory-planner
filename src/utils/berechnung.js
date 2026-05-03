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

// Private: output items/sec from ONE machine, mirrors maschinenAnzahl logic without ceil
function getMachineRatePerSec(id, boni, modulBoni, maschinenQualitaetMulti, maschinenOverrideId, beaconConfig) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) return null;

  let speed;
  if (maschinenOverrideId && gamedata.machines[maschinenOverrideId]) {
    speed = gamedata.machines[maschinenOverrideId].crafting_speed;
  } else {
    speed = MASCHINENGESCHWINDIGKEIT[rezept.maschine] ?? 1.0;
  }
  if (maschinenQualitaetMulti !== 1) speed *= maschinenQualitaetMulti;
  if (rezept.maschine !== MASCHINEN.BERGBAU && (boni.assemblerBonus ?? 0) > 0) speed *= (1 + boni.assemblerBonus);
  const mb = modulBoni[rezept.maschine];
  if (mb?.speedBonus) speed *= (1 + mb.speedBonus);
  if (beaconConfig?.anzahlBeacons > 0) {
    const bkE = BEACON_MODUL_EFFEKTE[beaconConfig.modulTyp];
    if (bkE?.speed) speed *= (1 + beaconConfig.anzahlBeacons * beaconConfig.moduleProBeacon * bkE.speed * 0.5);
  }
  const prod = mb?.produktivitaet ?? 0;
  let rate = (rezept.ergibt * (1 + prod) / rezept.zeit) * speed;
  if (rezept.maschine === MASCHINEN.BERGBAU && (boni.miningBonus ?? 0) > 0) rate *= (1 + boni.miningBonus);
  return rate;
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

/**
 * Analysiert die Produktionskette auf Effizienz und Engpässe.
 * herstellungEintraege: gefilterte eintraege aus ErgebnisTabelle (nur !istRohstoff)
 * Gibt zurück: { effizienzScore, bottleneck, vorschlaege }
 */
export function analysiereProduktion(herstellungEintraege, boni, modulBoni, mQMulti, sprache) {
  const iDE = sprache !== 'en';

  const details = herstellungEintraege
    .filter(e => e.anzahl !== null && e.anzahl > 0)
    .map(e => {
      const machineRate = getMachineRatePerSec(e.id, boni, modulBoni, mQMulti, e.selectedMaschinenId, e.beaconCfg);
      if (!machineRate) return null;

      const exactMachines  = e.craftingRate / machineRate;
      const actualMachines = e.anzahl;
      const utilization    = exactMachines / actualMachines;
      const wastedMachines = actualMachines - exactMachines;

      const rezept = REZEPTE_MAP[e.id];
      const currentBaseSpeed = (e.selectedMaschinenId && gamedata.machines[e.selectedMaschinenId])
        ? gamedata.machines[e.selectedMaschinenId].crafting_speed
        : (MASCHINENGESCHWINDIGKEIT[rezept?.maschine] ?? 1.0);

      const verfuegbare  = e.verfuegbareMaschinen ?? [];
      const schnellste   = verfuegbare.length > 0 ? verfuegbare[verfuegbare.length - 1] : null;
      const isNichtSchnellste = schnellste && schnellste.speed > currentBaseSpeed + 0.001;

      const mb = modulBoni[rezept?.maschine];
      const hasSpeedModule = (mb?.speedBonus ?? 0) > 0;

      return {
        id: e.id, name: e.name, maschine: rezept?.maschine,
        exactMachines, actualMachines, utilization, wastedMachines,
        machineRatePerMin: machineRate * 60,
        craftingRatePerMin: e.craftingRate * 60,
        currentBaseSpeed, schnellste, isNichtSchnellste, hasSpeedModule,
      };
    })
    .filter(Boolean);

  if (details.length === 0) return { effizienzScore: 100, bottleneck: null, vorschlaege: [] };

  const totalExact  = details.reduce((s, d) => s + d.exactMachines,  0);
  const totalActual = details.reduce((s, d) => s + d.actualMachines, 0);
  const effizienzScore = Math.round((totalExact / totalActual) * 100);

  // Bottleneck = item with most absolute machine waste
  const worst = details.reduce((max, d) => d.wastedMachines > max.wastedMachines ? d : max, details[0]);
  const bottleneck = worst.wastedMachines > 0.01 ? {
    rezeptId:     worst.id,
    itemName:     worst.name,
    istDurchsatz: worst.craftingRatePerMin,
    sollDurchsatz: worst.actualMachines * worst.machineRatePerMin,
    auslastung:   Math.round(worst.utilization * 100),
  } : null;

  const vorschlaege = [];

  // Machine upgrade suggestions
  for (const d of details) {
    if (!d.isNichtSchnellste) continue;
    const newActual = Math.ceil(d.exactMachines / (d.schnellste.speed / d.currentBaseSpeed));
    const ersparnis = d.actualMachines - newActual;
    if (ersparnis <= 0) continue;
    const mName = iDE ? d.schnellste.nameDe : d.schnellste.nameEn;
    vorschlaege.push({
      typ: 'upgrade', itemId: d.id, ersparnis,
      beschreibung: iDE
        ? `Upgrade auf ${mName} bei „${d.name}": ${d.actualMachines} → ${newActual} Maschinen`
        : `Upgrade to ${mName} at "${d.name}": ${d.actualMachines} → ${newActual} machines`,
    });
  }

  // Speed Module 3 suggestions (if none active)
  for (const d of details) {
    if (d.hasSpeedModule || d.maschine === MASCHINEN.BERGBAU || d.maschine === MASCHINEN.RECYCLER) continue;
    const newActual = Math.ceil(d.exactMachines / 1.5); // speed-module-3: +50%
    const ersparnis = d.actualMachines - newActual;
    if (ersparnis <= 0) continue;
    vorschlaege.push({
      typ: 'module', itemId: d.id, ersparnis,
      beschreibung: iDE
        ? `Geschwindigkeitsmodul 3 in „${d.name}" (${d.actualMachines}×) → spart ${ersparnis} Maschine${ersparnis > 1 ? 'n' : ''}`
        : `Speed Module 3 in "${d.name}" (${d.actualMachines}×) → saves ${ersparnis} machine${ersparnis > 1 ? 's' : ''}`,
    });
  }

  // Throughput-to-integer suggestions
  for (const d of details) {
    const frac = d.exactMachines % 1;
    if (frac < 0.05 || frac > 0.95) continue;
    const targetRate = (d.actualMachines * d.machineRatePerMin).toFixed(1);
    vorschlaege.push({
      typ: 'durchsatz', itemId: d.id, ersparnis: 0,
      beschreibung: iDE
        ? `„${d.name}": Zieldurchsatz auf ${targetRate}/min → alle ${d.actualMachines} Maschinen zu 100% ausgelastet`
        : `"${d.name}": set target to ${targetRate}/min → all ${d.actualMachines} machines fully utilized`,
    });
  }

  vorschlaege.sort((a, b) => b.ersparnis - a.ersparnis);
  return { effizienzScore, bottleneck, vorschlaege: vorschlaege.slice(0, 6) };
}
