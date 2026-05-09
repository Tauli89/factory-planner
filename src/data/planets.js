// ── Planet definitions ─────────────────────────────────────────────────────────

export const PLANETEN = [
  {
    id: 'nauvis',
    iconId: 'automation-science-pack',
    iconType: 'technologies',
    de: 'Nauvis',
    en: 'Nauvis',
    farbe:  'text-green-400',
    border: 'border-green-500/40',
    bg:     'bg-green-500/20',
  },
  {
    id: 'vulcanus',
    iconId: 'planet-discovery-vulcanus',
    iconType: 'technologies',
    de: 'Vulcanus',
    en: 'Vulcanus',
    farbe:  'text-orange-400',
    border: 'border-orange-500/40',
    bg:     'bg-orange-500/20',
  },
  {
    id: 'fulgora',
    iconId: 'planet-discovery-fulgora',
    iconType: 'technologies',
    de: 'Fulgora',
    en: 'Fulgora',
    farbe:  'text-yellow-300',
    border: 'border-yellow-500/40',
    bg:     'bg-yellow-500/20',
  },
  {
    id: 'gleba',
    iconId: 'planet-discovery-gleba',
    iconType: 'technologies',
    de: 'Gleba',
    en: 'Gleba',
    farbe:  'text-lime-400',
    border: 'border-lime-500/40',
    bg:     'bg-lime-500/20',
  },
  {
    id: 'aquilo',
    iconId: 'planet-discovery-aquilo',
    iconType: 'technologies',
    de: 'Aquilo',
    en: 'Aquilo',
    farbe:  'text-sky-300',
    border: 'border-sky-500/40',
    bg:     'bg-sky-500/20',
  },
  {
    id: 'space',
    iconId: 'space-platform',
    iconType: 'technologies',
    de: 'Raumstation',
    en: 'Space Platform',
    farbe:  'text-indigo-300',
    border: 'border-indigo-500/40',
    bg:     'bg-indigo-500/20',
  },
];

export const PLANETEN_MAP = Object.fromEntries(PLANETEN.map(p => [p.id, p]));

export const DEFAULT_PLANETEN = new Set(['nauvis']);

// ── Recipe category → allowed planets (null = available everywhere) ────────────

export const CATEGORY_ZU_PLANETEN = {
  // Standard (available everywhere)
  'crafting':                          null,
  'advanced-crafting':                 null,
  'crafting-with-fluid':               null,
  'electronics':                       null,
  'smelting':                          null,
  'chemistry':                         null,
  'oil-processing':                    null,
  'centrifuging':                      null,
  // Hybrid categories where a portable machine (assembler/chem-plant) is an option
  'metallurgy-or-assembling':          null,
  'cryogenics-or-assembling':          null,
  'electronics-or-assembling':         null,
  'chemistry-or-cryogenics':           null,

  // Vulcanus – Foundry
  'metallurgy':                        ['vulcanus'],
  'crafting-with-fluid-or-metallurgy': ['vulcanus'],

  // Fulgora – Electromagnetic Plant & Recycler
  'electromagnetics':                  ['fulgora'],
  'recycling-or-hand-crafting':        ['fulgora'],

  // Gleba – Biochamber
  'organic':                           ['gleba'],
  'organic-or-hand-crafting':          ['gleba'],
  'organic-or-assembling':             ['gleba'],
  'organic-or-chemistry':              ['gleba'],
  'captive-spawner-process':           ['gleba'],

  // Aquilo – Cryogenic Plant
  'cryogenics':                        ['aquilo'],

  // Space – Crusher / Space Platform
  'crushing':                          ['space'],

  // Nauvis – Rocket Silo
  'rocket-building':                   ['nauvis'],
};

// Per-recipe overrides: machine-building recipes use an assembler → available everywhere.
export const REZEPT_PLANETEN_OVERRIDE = {
  'foundry':               null,
  'biochamber':            null,
  'cryogenic-plant':       null,
  'electromagnetic-plant': null,
};
