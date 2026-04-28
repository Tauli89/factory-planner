import { MASCHINEN } from './recipes';

// Factorio 2.0 + Space Age module stats
// speedBonus:     multiplicative factor per module (stacked additively per machine)
// produktivitaet: output bonus per module (stacked additively)
// qualityBonus:   quality upgrade chance per module (stacked additively)
// energyBonus:    energy consumption change per module (e.g. +0.50 = +50%)
export const MODULE_TYPEN = [
  { id: 'keins',              name: 'Kein Modul',              nameEn: 'No Module',              speedBonus:  0,     produktivitaet: 0,    qualityBonus: 0,     energyBonus:  0     },

  { id: 'geschwindigkeit-1',  name: 'Geschwindigkeitsmodul',   nameEn: 'Speed Module',           speedBonus:  0.20,  produktivitaet: 0,    qualityBonus: 0,     energyBonus:  0.50  },
  { id: 'geschwindigkeit-2',  name: 'Geschwindigkeitsmodul 2', nameEn: 'Speed Module 2',         speedBonus:  0.30,  produktivitaet: 0,    qualityBonus: 0,     energyBonus:  0.60  },
  { id: 'geschwindigkeit-3',  name: 'Geschwindigkeitsmodul 3', nameEn: 'Speed Module 3',         speedBonus:  0.50,  produktivitaet: 0,    qualityBonus: 0,     energyBonus:  0.70  },

  { id: 'produktivitaet-1',   name: 'Produktivitätsmodul',    nameEn: 'Productivity Module',    speedBonus: -0.05,  produktivitaet: 0.04, qualityBonus: 0,     energyBonus:  0.40  },
  { id: 'produktivitaet-2',   name: 'Produktivitätsmodul 2',  nameEn: 'Productivity Module 2',  speedBonus: -0.10,  produktivitaet: 0.06, qualityBonus: 0,     energyBonus:  0.60  },
  { id: 'produktivitaet-3',   name: 'Produktivitätsmodul 3',  nameEn: 'Productivity Module 3',  speedBonus: -0.15,  produktivitaet: 0.10, qualityBonus: 0,     energyBonus:  0.80  },

  { id: 'effizienz-1',        name: 'Effizienzmodul',         nameEn: 'Efficiency Module',      speedBonus:  0,     produktivitaet: 0,    qualityBonus: 0,     energyBonus: -0.30  },
  { id: 'effizienz-2',        name: 'Effizienzmodul 2',       nameEn: 'Efficiency Module 2',    speedBonus:  0,     produktivitaet: 0,    qualityBonus: 0,     energyBonus: -0.40  },
  { id: 'effizienz-3',        name: 'Effizienzmodul 3',       nameEn: 'Efficiency Module 3',    speedBonus:  0,     produktivitaet: 0,    qualityBonus: 0,     energyBonus: -0.50  },

  // [SA] Qualitätsmodule – Space Age
  { id: 'qualitaet-1',        name: 'Qualitätsmodul',         nameEn: 'Quality Module',         speedBonus: -0.05,  produktivitaet: 0,    qualityBonus: 0.010, energyBonus:  0.25  },
  { id: 'qualitaet-2',        name: 'Qualitätsmodul 2',       nameEn: 'Quality Module 2',       speedBonus: -0.05,  produktivitaet: 0,    qualityBonus: 0.020, energyBonus:  0.35  },
  { id: 'qualitaet-3',        name: 'Qualitätsmodul 3',       nameEn: 'Quality Module 3',       speedBonus: -0.05,  produktivitaet: 0,    qualityBonus: 0.025, energyBonus:  0.45  },
];

export const MODULE_MAP = Object.fromEntries(MODULE_TYPEN.map(m => [m.id, m]));

// Max module slots per machine type
export const MODUL_SLOTS = {
  [MASCHINEN.ASSEMBLER]:    2,
  [MASCHINEN.SCHMELZOFEN]:  2,
  [MASCHINEN.CHEMIEANLAGE]: 3,
  [MASCHINEN.OELRAFFINERIE]:3,
  [MASCHINEN.ZENTRIFUGE]:   2,
  [MASCHINEN.HOCHOFEN]:     4,
  [MASCHINEN.EM_ANLAGE]:    5,
  [MASCHINEN.BIOKAMMER]:    5,
  [MASCHINEN.KRYOGENANLAGE]:8,
  [MASCHINEN.RECYCLER]:     4,
  [MASCHINEN.BERGBAU]:      3,
  [MASCHINEN.RAUMPLATTFORM]:0,
  [MASCHINEN.CRUSHER]:      0,
};
