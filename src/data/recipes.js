/**
 * Factorio Rezeptdatenbank (Basis-Spiel, 1.1/2.0)
 * Struktur: { id, name, zeit (Sek.), ergibt, zutaten, kategorie, maschine }
 */
export const KATEGORIEN = {
  ROHSTOFFE: 'Rohstoffe',
  ZWISCHENPRODUKTE: 'Zwischenprodukte',
  BAUELEMENTE: 'Bauelemente',
  SCIENCE: 'Wissenschaftspakete',
  VERTEIDIGUNG: 'Verteidigung',
  LOGISTIK: 'Logistik',
};

export const MASCHINEN = {
  BERGBAU:      'bergbau',
  SCHMELZOFEN:  'schmelzofen',
  ASSEMBLER:    'assembler',
  CHEMIEANLAGE: 'chemieanlage',
};

export const REZEPTE = [
  // --- Rohstoffe (Abbau / Pumpen) ---
  { id: 'eisenerz',   name: 'Eisenerz',   zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },
  { id: 'kupfererz',  name: 'Kupfererz',  zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },
  { id: 'kohle',      name: 'Kohle',      zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },
  { id: 'stein',      name: 'Stein',      zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },
  { id: 'rohoel',     name: 'Rohöl',      zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },
  { id: 'wasser',     name: 'Wasser',     zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },
  // Erdölgas kommt aus der Ölraffinerie; hier als Fluid-Rohstoff behandelt
  { id: 'erdoelgas',  name: 'Erdölgas',   zeit: 0, ergibt: 1, zutaten: [], kategorie: KATEGORIEN.ROHSTOFFE, maschine: MASCHINEN.BERGBAU },

  // --- Schmelzofen ---
  // Crafting-Zeit bezieht sich auf Basis-Schmelzzeit; Elektrischer Schmelzofen hat Faktor 2.0
  { id: 'eisenplatte',  name: 'Eisenplatte',  zeit: 3.2, ergibt: 1, zutaten: [{ id: 'eisenerz',  menge: 1 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.SCHMELZOFEN },
  { id: 'kupferplatte', name: 'Kupferplatte', zeit: 3.2, ergibt: 1, zutaten: [{ id: 'kupfererz', menge: 1 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.SCHMELZOFEN },
  { id: 'steinziegel',  name: 'Steinziegel',  zeit: 3.2, ergibt: 1, zutaten: [{ id: 'stein',     menge: 2 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.SCHMELZOFEN },
  { id: 'stahlplatte',  name: 'Stahlplatte',  zeit: 16,  ergibt: 1, zutaten: [{ id: 'eisenplatte', menge: 5 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.SCHMELZOFEN },

  // --- Assembler ---
  { id: 'eisenzahnrad', name: 'Eisenzahnrad', zeit: 0.5, ergibt: 1, zutaten: [{ id: 'eisenplatte', menge: 2 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.ASSEMBLER },
  { id: 'kupferkabel',  name: 'Kupferkabel',  zeit: 0.5, ergibt: 2, zutaten: [{ id: 'kupferplatte', menge: 1 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.ASSEMBLER },

  // Grüner Schaltkreis: 1 Eisenplatte + 3 Kupferkabel → 1 Stück, 0.5 s
  { id: 'elektronik',  name: 'Grüner Schaltkreis',          zeit: 0.5, ergibt: 1,
    zutaten: [{ id: 'eisenplatte', menge: 1 }, { id: 'kupferkabel', menge: 3 }],
    kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.ASSEMBLER },

  // Fortgeschrittener Schaltkreis: 2 Grüne + 4 Kupferkabel + 2 Kunststoffstangen → 1 Stück, 6 s
  { id: 'elektronik2', name: 'Fortgeschrittener Schaltkreis', zeit: 6, ergibt: 1,
    zutaten: [{ id: 'elektronik', menge: 2 }, { id: 'kupferkabel', menge: 4 }, { id: 'kunststoffstange', menge: 2 }],
    kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.ASSEMBLER },

  // Rohr: 1 Eisenplatte → 1 Rohr, 0.5 s  (NICHT 2 — Factorio gibt 1 pro Craft)
  { id: 'stahlrohr',    name: 'Rohr',           zeit: 0.5, ergibt: 1, zutaten: [{ id: 'eisenplatte', menge: 1 }], kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.ASSEMBLER },
  { id: 'transportband', name: 'Transportband', zeit: 0.5, ergibt: 2, zutaten: [{ id: 'eisenplatte', menge: 1 }, { id: 'eisenzahnrad', menge: 1 }], kategorie: KATEGORIEN.LOGISTIK, maschine: MASCHINEN.ASSEMBLER },
  { id: 'greifarm',     name: 'Greifarm',       zeit: 0.5, ergibt: 1,
    zutaten: [{ id: 'eisenplatte', menge: 1 }, { id: 'eisenzahnrad', menge: 1 }, { id: 'elektronik', menge: 1 }],
    kategorie: KATEGORIEN.LOGISTIK, maschine: MASCHINEN.ASSEMBLER },

  // --- Chemieanlage ---
  // Kunststoffstange: 20 Erdölgas + 1 Kohle → 2 Stück, 1 s
  { id: 'kunststoffstange', name: 'Kunststoffstange', zeit: 1, ergibt: 2,
    zutaten: [{ id: 'erdoelgas', menge: 20 }, { id: 'kohle', menge: 1 }],
    kategorie: KATEGORIEN.ZWISCHENPRODUKTE, maschine: MASCHINEN.CHEMIEANLAGE },

  // --- Wissenschaftspakete (Assembler) ---
  { id: 'science_rot',   name: 'Automatisierungs-Forschungspaket', zeit: 5, ergibt: 1,
    zutaten: [{ id: 'kupferplatte', menge: 1 }, { id: 'eisenzahnrad', menge: 1 }],
    kategorie: KATEGORIEN.SCIENCE, maschine: MASCHINEN.ASSEMBLER },
  { id: 'science_gruen', name: 'Logistik-Forschungspaket',         zeit: 6, ergibt: 1,
    zutaten: [{ id: 'transportband', menge: 1 }, { id: 'greifarm', menge: 1 }],
    kategorie: KATEGORIEN.SCIENCE, maschine: MASCHINEN.ASSEMBLER },
];

export const REZEPTE_MAP = Object.fromEntries(REZEPTE.map(r => [r.id, r]));
