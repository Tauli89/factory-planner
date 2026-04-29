import gamedata from './gamedata.json';

// ── Abstract machine types (same constants as before) ────────────────────────
export const MASCHINEN = {
  BERGBAU:      'bergbau',
  SCHMELZOFEN:  'schmelzofen',
  ASSEMBLER:    'assembler',
  CHEMIEANLAGE: 'chemieanlage',
  OELRAFFINERIE:'oelraffinerie',
  ZENTRIFUGE:   'zentrifuge',
  HOCHOFEN:     'hochofen',
  EM_ANLAGE:    'em-anlage',
  BIOKAMMER:    'biokammer',
  KRYOGENANLAGE:'kryogenanlage',
  RECYCLER:     'recycler',
  RAUMPLATTFORM:'raumplattform',
  CRUSHER:      'crusher',
};

// Recipe crafting-category → abstract machine type
const RECIPE_CAT_TO_MACHINE = {
  'crafting':                          MASCHINEN.ASSEMBLER,
  'advanced-crafting':                 MASCHINEN.ASSEMBLER,
  'crafting-with-fluid':               MASCHINEN.ASSEMBLER,
  'electronics':                       MASCHINEN.ASSEMBLER,
  'electronics-or-assembling':         MASCHINEN.ASSEMBLER,
  'smelting':                          MASCHINEN.SCHMELZOFEN,
  'chemistry':                         MASCHINEN.CHEMIEANLAGE,
  'chemistry-or-cryogenics':           MASCHINEN.CHEMIEANLAGE,
  'organic-or-chemistry':              MASCHINEN.CHEMIEANLAGE,
  'oil-processing':                    MASCHINEN.OELRAFFINERIE,
  'centrifuging':                      MASCHINEN.ZENTRIFUGE,
  'metallurgy':                        MASCHINEN.HOCHOFEN,
  'metallurgy-or-assembling':          MASCHINEN.HOCHOFEN,
  'crafting-with-fluid-or-metallurgy': MASCHINEN.HOCHOFEN,
  'electromagnetics':                  MASCHINEN.EM_ANLAGE,
  'organic':                           MASCHINEN.BIOKAMMER,
  'organic-or-hand-crafting':          MASCHINEN.BIOKAMMER,
  'organic-or-assembling':             MASCHINEN.BIOKAMMER,
  'captive-spawner-process':           MASCHINEN.BIOKAMMER,
  'cryogenics':                        MASCHINEN.KRYOGENANLAGE,
  'cryogenics-or-assembling':          MASCHINEN.KRYOGENANLAGE,
  'recycling-or-hand-crafting':        MASCHINEN.RECYCLER,
  'crushing':                          MASCHINEN.CRUSHER,
  'rocket-building':                   MASCHINEN.RAUMPLATTFORM,
};

// ── Display categories (same German strings as before) ───────────────────────
export const KATEGORIEN = {
  ROHSTOFFE:       'Rohstoffe',
  ZWISCHENPRODUKTE:'Zwischenprodukte',
  LOGISTIK:        'Logistik',
  ENERGIE:         'Energie',
  MILITAER:        'Militär',
  MASCHINEN_BAU:   'Maschinen',
  MODULE:          'Module',
  SCIENCE:         'Wissenschaftspakete',
  OELVERARBEITUNG: 'Ölverarbeitung',
  NUKLEAR:         'Nuklear',
  RAKETE:          'Rakete & Orbit',
  SPACE_AGE:       'Space Age',
};

export const KATEGORIEN_EN_LABEL = {
  'Rohstoffe':           'Resources',
  'Zwischenprodukte':    'Intermediate Products',
  'Logistik':            'Logistics',
  'Energie':             'Energy',
  'Militär':             'Military',
  'Maschinen':           'Machines',
  'Module':              'Modules',
  'Wissenschaftspakete': 'Science Packs',
  'Ölverarbeitung':      'Oil Processing',
  'Nuklear':             'Nuclear',
  'Rakete & Orbit':      'Rocket & Orbit',
  'Space Age':           'Space Age',
};

// Item subgroup → display category
const SUBGROUP_TO_KAT = {
  'raw-resource':             KATEGORIEN.ROHSTOFFE,
  'fluid':                    KATEGORIEN.ROHSTOFFE,
  'raw-material':             KATEGORIEN.ZWISCHENPRODUKTE,
  'intermediate-product':     KATEGORIEN.ZWISCHENPRODUKTE,
  'other':                    KATEGORIEN.ZWISCHENPRODUKTE,
  'terrain':                  KATEGORIEN.ZWISCHENPRODUKTE,
  'science-pack':             KATEGORIEN.SCIENCE,
  'tool':                     KATEGORIEN.SCIENCE,
  'belt':                     KATEGORIEN.LOGISTIK,
  'inserter':                 KATEGORIEN.LOGISTIK,
  'transport':                KATEGORIEN.LOGISTIK,
  'train-transport':          KATEGORIEN.LOGISTIK,
  'circuit-network':          KATEGORIEN.LOGISTIK,
  'logistic-network':         KATEGORIEN.LOGISTIK,
  'storage':                  KATEGORIEN.LOGISTIK,
  'environmental-protection': KATEGORIEN.LOGISTIK,
  'energy':                   KATEGORIEN.ENERGIE,
  'energy-pipe-distribution': KATEGORIEN.ENERGIE,
  'smelting-machine':         KATEGORIEN.MASCHINEN_BAU,
  'extraction-machine':       KATEGORIEN.MASCHINEN_BAU,
  'production-machine':       KATEGORIEN.MASCHINEN_BAU,
  'module':                   KATEGORIEN.MODULE,
  'ammo':                     KATEGORIEN.MILITAER,
  'armor':                    KATEGORIEN.MILITAER,
  'gun':                      KATEGORIEN.MILITAER,
  'turret':                   KATEGORIEN.MILITAER,
  'military-equipment':       KATEGORIEN.MILITAER,
  'defensive-structure':      KATEGORIEN.MILITAER,
  'capsule':                  KATEGORIEN.MILITAER,
  'equipment':                KATEGORIEN.MILITAER,
  'utility-equipment':        KATEGORIEN.MILITAER,
  'uranium-processing':       KATEGORIEN.NUKLEAR,
  'space-rocket':             KATEGORIEN.RAKETE,
  'space-related':            KATEGORIEN.RAKETE,
  'space-platform':           KATEGORIEN.RAKETE,
  'space-material':           KATEGORIEN.SPACE_AGE,
  'agriculture':              KATEGORIEN.SPACE_AGE,
  'agriculture-processes':    KATEGORIEN.SPACE_AGE,
  'agriculture-products':     KATEGORIEN.SPACE_AGE,
  'nauvis-agriculture':       KATEGORIEN.SPACE_AGE,
  'aquilo-processes':         KATEGORIEN.SPACE_AGE,
  'fulgora-processes':        KATEGORIEN.SPACE_AGE,
  'vulcanus-processes':       KATEGORIEN.SPACE_AGE,
  'spawnables':               KATEGORIEN.SPACE_AGE,
};

// ── Build REZEPTE from gamedata.json ─────────────────────────────────────────
function buildRezepte() {
  const items = gamedata.items;
  return Object.values(gamedata.recipes).map(r => {
    const maschine = RECIPE_CAT_TO_MACHINE[r.category] ?? MASCHINEN.ASSEMBLER;

    // Display category: oil-processing and centrifuging override item subgroup
    let kategorie;
    if (r.category === 'oil-processing') {
      kategorie = KATEGORIEN.OELVERARBEITUNG;
    } else if (r.category === 'centrifuging') {
      kategorie = KATEGORIEN.NUKLEAR;
    } else if (r.category === 'crushing') {
      kategorie = KATEGORIEN.SPACE_AGE;
    } else {
      const firstResult = r.results[0];
      const resultItem = firstResult ? items[firstResult.item] : null;
      kategorie = (resultItem && SUBGROUP_TO_KAT[resultItem.subgroup])
        ?? KATEGORIEN.ZWISCHENPRODUKTE;
    }

    const mainResult = r.results[0];
    const zutaten = (r.ingredients ?? []).map(ing => ({
      id: ing.item,
      menge: ing.amount,
    }));

    return {
      id: r.id,
      name: r.name.de,
      nameEn: r.name.en,
      zeit: r.energy_required ?? 0,
      ergibt: mainResult?.amount ?? 1,
      zutaten,
      kategorie,
      maschine,
    };
  });
}

export const REZEPTE = buildRezepte();
export const REZEPTE_MAP = Object.fromEntries(REZEPTE.map(r => [r.id, r]));

// ── Build ITEM_ICONS from gamedata.json ───────────────────────────────────────
function buildItemIcons() {
  const icons = {};
  // Item id → icon (covers both items and fluids)
  for (const item of Object.values(gamedata.items)) {
    if (item.icon) icons[item.id] = item.icon;
  }
  // Recipe id → icon (for recipes where id ≠ main result id, e.g. oil-processing)
  for (const recipe of Object.values(gamedata.recipes)) {
    if (!icons[recipe.id] && recipe.results[0]) {
      const resultIcon = gamedata.items[recipe.results[0].item]?.icon;
      if (resultIcon) icons[recipe.id] = resultIcon;
    }
  }
  return icons;
}

export const ITEM_ICONS = buildItemIcons();

// ── MACHINE_ICONS: abstract machine type → icon path ────────────────────────
// Maps the same abstract type strings as MASCHINEN values to machine icons.
const ABSTRACT_TO_MACHINE_ID = {
  [MASCHINEN.BERGBAU]:      'electric-mining-drill',
  [MASCHINEN.SCHMELZOFEN]:  'electric-furnace',
  [MASCHINEN.ASSEMBLER]:    'assembling-machine-2',
  [MASCHINEN.CHEMIEANLAGE]: 'chemical-plant',
  [MASCHINEN.OELRAFFINERIE]:'oil-refinery',
  [MASCHINEN.ZENTRIFUGE]:   'centrifuge',
  [MASCHINEN.HOCHOFEN]:     'foundry',
  [MASCHINEN.EM_ANLAGE]:    'electromagnetic-plant',
  [MASCHINEN.BIOKAMMER]:    'biochamber',
  [MASCHINEN.KRYOGENANLAGE]:'cryogenic-plant',
  [MASCHINEN.CRUSHER]:      'crusher',
  // recycler and space-platform-hub not in gamedata machines, use hardcoded paths
  [MASCHINEN.RECYCLER]:     null,
  [MASCHINEN.RAUMPLATTFORM]:null,
};

export const MACHINE_ICONS = (() => {
  const icons = {};
  for (const [abstractType, machineId] of Object.entries(ABSTRACT_TO_MACHINE_ID)) {
    if (machineId && gamedata.machines[machineId]?.icon) {
      icons[abstractType] = gamedata.machines[machineId].icon;
    }
  }
  // Hardcode missing machines
  icons[MASCHINEN.RECYCLER]     = '/images/icons/machines/recycler.png';
  icons[MASCHINEN.RAUMPLATTFORM]= '/images/icons/machines/space-platform-hub.png';
  return icons;
})();

// ── TECH_ICONS: tech ID → local icon path ────────────────────────────────────
// research.js uses level-suffixed IDs (mining-productivity-1..4); gamedata uses
// the base ID for infinite techs. We build the map for both forms.
export const TECH_ICONS = (() => {
  const icons = {};
  for (const tech of Object.values(gamedata.technologies)) {
    if (tech.icon) icons[tech.id] = tech.icon;
  }
  // Alias level-suffixed variants of infinite techs to the base tech icon
  for (let i = 1; i <= 10; i++) {
    if (!icons[`mining-productivity-${i}`] && icons['mining-productivity']) {
      icons[`mining-productivity-${i}`] = icons['mining-productivity'];
    }
  }
  return icons;
})();

// ── Build DURCH_TECH_GESPERRTE_REZEPTE from gamedata.json ────────────────────
function buildGesperrteRezepte() {
  const locked = new Set();
  for (const tech of Object.values(gamedata.technologies)) {
    for (const recipeId of tech.unlocks_recipes ?? []) {
      locked.add(recipeId);
    }
  }
  return locked;
}

export const DURCH_TECH_GESPERRTE_REZEPTE = buildGesperrteRezepte();
