/**
 * Factorio Rezeptdatenbank – Vanilla 2.0 + Space Age DLC
 * Quellen: wiki.factorio.com (verifiziert April 2026)
 * [SA] = Space Age exklusiv   [~] = probabilistischer Output
 *
 * Struktur: { id, name, nameEn, zeit, ergibt, zutaten, kategorie, maschine, nebenprodukte? }
 * nebenprodukte: Sekundär-Outputs bei Mehr-Output-Rezepten (Raffinerie, Kovarex …)
 */

// ---------------------------------------------------------------------------
// Kategorien
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Maschinentypen
// ---------------------------------------------------------------------------
export const MASCHINEN = {
  BERGBAU:      'bergbau',
  SCHMELZOFEN:  'schmelzofen',
  ASSEMBLER:    'assembler',
  CHEMIEANLAGE: 'chemieanlage',
  OELRAFFINERIE:'oelraffinerie',
  ZENTRIFUGE:   'zentrifuge',
  HOCHOFEN:     'hochofen',       // [SA] Foundry
  EM_ANLAGE:    'em-anlage',      // [SA] Electromagnetic Plant
  BIOKAMMER:    'biokammer',      // [SA] Biochamber
  KRYOGENANLAGE:'kryogenanlage',  // [SA] Cryogenic Plant
  RECYCLER:     'recycler',       // [SA] Recycler
  RAUMPLATTFORM:'raumplattform',  // [SA] Space Platform Hub
  CRUSHER:      'crusher',        // [SA] Asteroid Crusher
};

// ---------------------------------------------------------------------------
// Hilfsfunktion – kompakte Zutaten-Schreibweise
// ---------------------------------------------------------------------------
const z = (id, menge) => ({ id, menge });

// ---------------------------------------------------------------------------
// REZEPTE
// ---------------------------------------------------------------------------
export const REZEPTE = [

  // =========================================================================
  // ROHSTOFFE  (zeit:0 = kein Crafting, wird abgebaut / gepumpt)
  // =========================================================================
  { id:'eisenerz',    name:'Eisenerz',    nameEn:'Iron Ore',    zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'kupfererz',   name:'Kupfererz',   nameEn:'Copper Ore',  zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'kohle',       name:'Kohle',       nameEn:'Coal',        zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'stein',       name:'Stein',       nameEn:'Stone',       zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'uranerz',     name:'Uranerz',     nameEn:'Uranium Ore', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'roher-fisch', name:'Roher Fisch', nameEn:'Raw Fish',    zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'holz',        name:'Holz',        nameEn:'Wood',        zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  // Fluide – werden gepumpt / kommen aus Raffinerie; im Rechner als Basis-Input behandelt
  { id:'rohoel',      name:'Rohöl',         nameEn:'Crude Oil',     zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'wasser',      name:'Wasser',         nameEn:'Water',         zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'schwerol',    name:'Schweröl',       nameEn:'Heavy Oil',     zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'leichtoel',   name:'Leichtöl',       nameEn:'Light Oil',     zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'erdoelgas',   name:'Erdölgas',       nameEn:'Petroleum Gas', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'dampf',       name:'Dampf',          nameEn:'Steam',         zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  // [SA] Rohstoffe auf anderen Planeten
  { id:'wolframerz',  name:'Wolframerz',     nameEn:'Tungsten Ore',  zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'holmiumerz',  name:'Holmiumerz',     nameEn:'Holmium Ore',   zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'kalzit',      name:'Kalzit',         nameEn:'Calcite',       zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'lava',        name:'Lava',           nameEn:'Lava',          zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'eis',         name:'Eis',            nameEn:'Ice',           zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'lithium',     name:'Lithium',        nameEn:'Lithium',       zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'ammoniak',    name:'Ammoniak',       nameEn:'Ammonia',       zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'verderb',     name:'Verderb',        nameEn:'Spoilage',      zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'yumako',      name:'Yumako',         nameEn:'Yumako',        zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'jellynus',    name:'Jellynus',       nameEn:'Jellynut',      zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'beisserei',   name:'Beißersei',      nameEn:'Biter Egg',     zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'fuenfbeiner-ei', name:'Fünfbeiner-Ei', nameEn:'Pentapod Egg', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },
  { id:'promethium-brocken', name:'Promethium-Asteroid', nameEn:'Promethium Asteroid Chunk', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.ROHSTOFFE, maschine:MASCHINEN.BERGBAU },

  // =========================================================================
  // SCHMELZOFEN
  // =========================================================================
  { id:'eisenplatte',  name:'Eisenplatte',  nameEn:'Iron Plate',   zeit:3.2, ergibt:1, zutaten:[z('eisenerz',1)],  kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.SCHMELZOFEN },
  { id:'kupferplatte', name:'Kupferplatte', nameEn:'Copper Plate', zeit:3.2, ergibt:1, zutaten:[z('kupfererz',1)], kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.SCHMELZOFEN },
  { id:'steinziegel',  name:'Steinziegel',  nameEn:'Stone Brick',  zeit:3.2, ergibt:1, zutaten:[z('stein',2)],     kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.SCHMELZOFEN },
  { id:'stahlplatte',  name:'Stahlplatte',  nameEn:'Steel Plate',  zeit:16,  ergibt:1, zutaten:[z('eisenplatte',5)],kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.SCHMELZOFEN },
  // [SA] Lithiumplatte – Aquilo
  { id:'lithiumplatte',name:'Lithiumplatte',nameEn:'Lithium Plate', zeit:6.4, ergibt:1, zutaten:[z('lithium',1)],   kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.SCHMELZOFEN },

  // =========================================================================
  // CHEMIEANLAGE
  // =========================================================================
  { id:'kunststoffstange', name:'Kunststoffstange', nameEn:'Plastic Bar',
    zeit:1, ergibt:2, zutaten:[z('erdoelgas',20), z('kohle',1)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },

  { id:'schwefel', name:'Schwefel', nameEn:'Sulfur',
    zeit:1, ergibt:2, zutaten:[z('erdoelgas',30), z('wasser',30)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },

  { id:'schwefelsaeure', name:'Schwefelsäure', nameEn:'Sulfuric Acid',
    zeit:1, ergibt:50, zutaten:[z('eisenplatte',1), z('schwefel',5), z('wasser',100)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },

  { id:'schmiermittel', name:'Schmiermittel', nameEn:'Lubricant',
    zeit:1, ergibt:10, zutaten:[z('schwerol',10)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },

  { id:'batterie', name:'Batterie', nameEn:'Battery',
    zeit:4, ergibt:1, zutaten:[z('kupferplatte',1), z('eisenplatte',1), z('schwefelsaeure',20)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },

  // Festbrennstoff – drei Rezepte, standardmäßig aus Leichtöl (effizienteste Variante)
  { id:'festbrennstoff',        name:'Festbrennstoff',              nameEn:'Solid Fuel (Light Oil)',
    zeit:1, ergibt:1, zutaten:[z('leichtoel',10)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },
  { id:'festbrennstoff-schwerol', name:'Festbrennstoff (Schweröl)', nameEn:'Solid Fuel (Heavy Oil)',
    zeit:1, ergibt:1, zutaten:[z('schwerol',20)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },
  { id:'festbrennstoff-gas',    name:'Festbrennstoff (Erdölgas)',    nameEn:'Solid Fuel (Petroleum Gas)',
    zeit:1, ergibt:1, zutaten:[z('erdoelgas',20)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.CHEMIEANLAGE },

  // Schwer-/Leichtöl cracken
  { id:'schwerol-cracking', name:'Schweröl-Cracking', nameEn:'Heavy Oil Cracking',
    zeit:2, ergibt:30, zutaten:[z('schwerol',40), z('wasser',30)],
    kategorie:KATEGORIEN.OELVERARBEITUNG, maschine:MASCHINEN.CHEMIEANLAGE },
  { id:'leichtoel-cracking', name:'Leichtöl-Cracking', nameEn:'Light Oil Cracking',
    zeit:2, ergibt:20, zutaten:[z('leichtoel',30), z('wasser',30)],
    kategorie:KATEGORIEN.OELVERARBEITUNG, maschine:MASCHINEN.CHEMIEANLAGE },

  // [SA] Kohlenstoff – primäres Rezept
  { id:'kohlenstoff', name:'Kohlenstoff', nameEn:'Carbon',
    zeit:1, ergibt:1, zutaten:[z('kohle',2), z('schwefelsaeure',20)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.CHEMIEANLAGE },

  // [SA] Holmiumlösung – Fulgora
  { id:'holmiumloesung', name:'Holmiumlösung', nameEn:'Holmium Solution',
    zeit:10, ergibt:100, zutaten:[z('holmiumerz',2), z('stein',1), z('wasser',10)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.CHEMIEANLAGE },

  // =========================================================================
  // ÖLRAFFINERIE
  // nebenprodukte: [{id, menge}] = weitere Fluid-Outputs des Rezepts
  // =========================================================================
  { id:'oelverarbeitung-basis', name:'Grundlegende Ölverarbeitung', nameEn:'Basic Oil Processing',
    zeit:5, ergibt:45, zutaten:[z('rohoel',100)],
    // ergibt = Petroleum Gas (Hauptprodukt); keine Nebenprodukte bei Basic
    kategorie:KATEGORIEN.OELVERARBEITUNG, maschine:MASCHINEN.OELRAFFINERIE },

  { id:'oelverarbeitung-fort', name:'Fortgeschrittene Ölverarbeitung', nameEn:'Advanced Oil Processing',
    zeit:5, ergibt:55, zutaten:[z('rohoel',100), z('wasser',50)],
    // ergibt = Petroleum Gas; Nebenprodukte: Heavy Oil 25, Light Oil 45
    nebenprodukte:[{ id:'schwerol', menge:25 }, { id:'leichtoel', menge:45 }],
    kategorie:KATEGORIEN.OELVERARBEITUNG, maschine:MASCHINEN.OELRAFFINERIE },

  { id:'kohlevergasung', name:'Kohlevergasung', nameEn:'Coal Liquefaction',
    zeit:5, ergibt:90, zutaten:[z('kohle',10), z('schwerol',25), z('dampf',50)],
    // ergibt = Heavy Oil; Nebenprodukte: Light Oil 20, Petroleum Gas 10
    nebenprodukte:[{ id:'leichtoel', menge:20 }, { id:'erdoelgas', menge:10 }],
    kategorie:KATEGORIEN.OELVERARBEITUNG, maschine:MASCHINEN.OELRAFFINERIE },

  // =========================================================================
  // ZENTRIFUGE
  // =========================================================================
  // [~] Probabilistisch: 10 Uranerz → durchschnittlich 0.007 U235 + 0.993 U238
  // Hier als ganzzahliges Verhältnis pro 1000 Durchläufe: 7 U235 + 993 U238
  { id:'uranverarbeitung', name:'Uranverarbeitung', nameEn:'Uranium Processing',
    zeit:12, ergibt:1,  // ergibt = U-238 (Hauptprodukt, ~99.3%)
    zutaten:[z('uranerz',10)],
    nebenprodukte:[{ id:'u235', menge:0.007 }],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ZENTRIFUGE },

  // Kovarex-Anreicherung: 40 U235 + 5 U238 → 41 U235 + 2 U238 (netto: +1 U235, −3 U238)
  { id:'kovarex', name:'Kovarex-Anreicherung', nameEn:'Kovarex Enrichment Process',
    zeit:60, ergibt:41, zutaten:[z('u235',40), z('u238',5)],
    nebenprodukte:[{ id:'u238', menge:2 }],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ZENTRIFUGE },

  // U235 / U238 als verarbeitete Zwischenprodukte
  { id:'u235', name:'Uran-235', nameEn:'Uranium-235', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.BERGBAU },
  { id:'u238', name:'Uran-238', nameEn:'Uranium-238', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.BERGBAU },

  // =========================================================================
  // ASSEMBLER – Zwischenprodukte
  // =========================================================================
  { id:'eisenzahnrad',    name:'Eisenzahnrad',    nameEn:'Iron Gear Wheel',
    zeit:0.5, ergibt:1, zutaten:[z('eisenplatte',2)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'kupferkabel',     name:'Kupferkabel',      nameEn:'Copper Cable',
    zeit:0.5, ergibt:2, zutaten:[z('kupferplatte',1)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'eisenstange',     name:'Eisenstange',      nameEn:'Iron Stick',
    zeit:0.5, ergibt:2, zutaten:[z('eisenplatte',1)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'gruener-schaltkreis', name:'Grüner Schaltkreis', nameEn:'Electronic Circuit',
    zeit:0.5, ergibt:1, zutaten:[z('eisenplatte',1), z('kupferkabel',3)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'roter-schaltkreis', name:'Fortgeschrittener Schaltkreis', nameEn:'Advanced Circuit',
    zeit:6, ergibt:1, zutaten:[z('gruener-schaltkreis',2), z('kupferkabel',4), z('kunststoffstange',2)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'verarbeitungseinheit', name:'Verarbeitungseinheit', nameEn:'Processing Unit',
    zeit:10, ergibt:1, zutaten:[z('roter-schaltkreis',2), z('gruener-schaltkreis',20), z('schwefelsaeure',5)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'motoreinheit',    name:'Motoreinheit',     nameEn:'Engine Unit',
    zeit:10, ergibt:1, zutaten:[z('eisenzahnrad',1), z('rohr',2), z('stahlplatte',1)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'elektro-motoreinheit', name:'Elektrische Motoreinheit', nameEn:'Electric Engine Unit',
    zeit:10, ergibt:1, zutaten:[z('gruener-schaltkreis',2), z('motoreinheit',1), z('schmiermittel',15)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'flugzeugrahmen',  name:'Flugzeugrahmen',   nameEn:'Flying Robot Frame',
    zeit:20, ergibt:1, zutaten:[z('batterie',2), z('elektro-motoreinheit',1), z('gruener-schaltkreis',3), z('stahlplatte',1)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'leichte-konstruktion', name:'Leichte Konstruktion', nameEn:'Low Density Structure',
    zeit:15, ergibt:1, zutaten:[z('kupferplatte',20), z('kunststoffstange',5), z('stahlplatte',2)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'raketentreibstoff', name:'Raketentreibstoff', nameEn:'Rocket Fuel',
    zeit:15, ergibt:1, zutaten:[z('leichtoel',10), z('festbrennstoff',10)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'uranbrennstab',   name:'Uranbrennstab',    nameEn:'Uranium Fuel Cell',
    zeit:10, ergibt:10, zutaten:[z('eisenplatte',10), z('u235',1), z('u238',19)],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ASSEMBLER },

  { id:'beton',           name:'Beton',            nameEn:'Concrete',
    zeit:10, ergibt:10, zutaten:[z('eisenerz',1), z('steinziegel',5), z('wasser',100)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'schiene',         name:'Schiene',           nameEn:'Rail',
    zeit:0.5, ergibt:2, zutaten:[z('eisenstange',1), z('stahlplatte',1), z('stein',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Rohre / Leitungen
  // =========================================================================
  { id:'rohr',            name:'Rohr',              nameEn:'Pipe',
    zeit:0.5, ergibt:1, zutaten:[z('eisenplatte',1)],
    kategorie:KATEGORIEN.ZWISCHENPRODUKTE, maschine:MASCHINEN.ASSEMBLER },

  { id:'unterird-rohr',   name:'Unterirdisches Rohr', nameEn:'Pipe to Ground',
    zeit:0.5, ergibt:2, zutaten:[z('eisenplatte',5), z('rohr',10)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Transportbänder (3 Grundspiel-Tiers + 1 Space Age)
  // =========================================================================
  { id:'transportband',         name:'Transportband',          nameEn:'Transport Belt',
    zeit:0.5, ergibt:2, zutaten:[z('eisenplatte',1), z('eisenzahnrad',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'schnelles-transportband', name:'Schnelles Transportband', nameEn:'Fast Transport Belt',
    zeit:0.5, ergibt:1, zutaten:[z('eisenzahnrad',5), z('transportband',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'express-transportband', name:'Express-Transportband',   nameEn:'Express Transport Belt',
    zeit:0.5, ergibt:1, zutaten:[z('schnelles-transportband',1), z('eisenzahnrad',10), z('schmiermittel',20)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'turbo-transportband',   name:'Turbo-Transportband',     nameEn:'Turbo Transport Belt',  // [SA]
    zeit:0.5, ergibt:1, zutaten:[z('express-transportband',1), z('schmiermittel',20), z('wolframplatte',5)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.HOCHOFEN },

  // Unterirdische Bänder
  { id:'untird-band',           name:'Unterirdisches Transportband',         nameEn:'Underground Belt',
    zeit:1, ergibt:2, zutaten:[z('transportband',5), z('eisenplatte',10)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'schnelles-untird-band', name:'Schnelles Unterirdisches Transportband', nameEn:'Fast Underground Belt',
    zeit:2, ergibt:2, zutaten:[z('untird-band',2), z('eisenzahnrad',40)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'express-untird-band',   name:'Express Unterirdisches Transportband',  nameEn:'Express Underground Belt',
    zeit:2, ergibt:2, zutaten:[z('schnelles-untird-band',2), z('eisenzahnrad',80), z('schmiermittel',40)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'turbo-untird-band',     name:'Turbo Unterirdisches Transportband',    nameEn:'Turbo Underground Belt',  // [SA]
    zeit:2, ergibt:2, zutaten:[z('express-untird-band',2), z('schmiermittel',40), z('wolframplatte',40)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.HOCHOFEN },

  // Aufteiler
  { id:'aufteiler',         name:'Aufteiler',         nameEn:'Splitter',
    zeit:1, ergibt:1, zutaten:[z('transportband',4), z('gruener-schaltkreis',5), z('eisenplatte',5)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'schneller-aufteiler', name:'Schneller Aufteiler', nameEn:'Fast Splitter',
    zeit:2, ergibt:1, zutaten:[z('aufteiler',1), z('gruener-schaltkreis',10), z('eisenzahnrad',10)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'express-aufteiler', name:'Express-Aufteiler',  nameEn:'Express Splitter',
    zeit:2, ergibt:1, zutaten:[z('schneller-aufteiler',1), z('roter-schaltkreis',10), z('eisenzahnrad',10), z('schmiermittel',80)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'turbo-aufteiler',   name:'Turbo-Aufteiler',    nameEn:'Turbo Splitter',  // [SA]
    zeit:2, ergibt:1, zutaten:[z('express-aufteiler',1), z('wolframplatte',15), z('verarbeitungseinheit',2), z('schmiermittel',80)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.HOCHOFEN },

  // =========================================================================
  // ASSEMBLER – Greifarme
  // =========================================================================
  { id:'brennstoff-greifarm', name:'Brennstoff-Greifarm',  nameEn:'Burner Inserter',
    zeit:0.5, ergibt:1, zutaten:[z('eisenzahnrad',1), z('eisenplatte',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'greifarm',            name:'Greifarm',             nameEn:'Inserter',
    zeit:0.5, ergibt:1, zutaten:[z('gruener-schaltkreis',1), z('eisenzahnrad',1), z('eisenplatte',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'langer-greifarm',     name:'Langarmiger Greifarm', nameEn:'Long Handed Inserter',
    zeit:0.5, ergibt:1, zutaten:[z('greifarm',1), z('eisenzahnrad',1), z('eisenplatte',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'schneller-greifarm',  name:'Schneller Greifarm',   nameEn:'Fast Inserter',
    zeit:0.5, ergibt:1, zutaten:[z('gruener-schaltkreis',2), z('greifarm',1), z('eisenplatte',2)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'filter-greifarm',     name:'Filter-Greifarm',      nameEn:'Filter Inserter',
    zeit:0.5, ergibt:1, zutaten:[z('gruener-schaltkreis',4), z('schneller-greifarm',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'massen-greifarm',     name:'Massen-Greifarm',      nameEn:'Bulk Inserter',
    zeit:0.5, ergibt:1, zutaten:[z('roter-schaltkreis',1), z('gruener-schaltkreis',15), z('schneller-greifarm',1), z('eisenzahnrad',15)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Roboter & Roboport
  // =========================================================================
  { id:'logistikroboter',   name:'Logistikroboter',   nameEn:'Logistic Robot',
    zeit:0.5, ergibt:1, zutaten:[z('roter-schaltkreis',2), z('flugzeugrahmen',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'bauroboter',        name:'Bauroboter',        nameEn:'Construction Robot',
    zeit:0.5, ergibt:1, zutaten:[z('gruener-schaltkreis',2), z('flugzeugrahmen',1)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  { id:'roboport',          name:'Roboport',          nameEn:'Roboport',
    zeit:5, ergibt:1, zutaten:[z('roter-schaltkreis',45), z('eisenzahnrad',45), z('stahlplatte',45)],
    kategorie:KATEGORIEN.LOGISTIK, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Strompole & Energie
  // =========================================================================
  { id:'kleiner-strommast',  name:'Kleiner Strommast',  nameEn:'Small Electric Pole',
    zeit:0.5, ergibt:2, zutaten:[z('holz',1), z('kupferkabel',2)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'mittlerer-strommast',name:'Mittlerer Strommast', nameEn:'Medium Electric Pole',
    zeit:0.5, ergibt:1, zutaten:[z('kupferkabel',2), z('eisenstange',4), z('stahlplatte',2)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'grosser-strommast',  name:'Großer Strommast',   nameEn:'Big Electric Pole',
    zeit:0.5, ergibt:1, zutaten:[z('kupferkabel',4), z('eisenstange',8), z('stahlplatte',5)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'unterstation',       name:'Unterstation',        nameEn:'Substation',
    zeit:0.5, ergibt:1, zutaten:[z('roter-schaltkreis',5), z('kupferkabel',6), z('stahlplatte',10)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'heizkessel',         name:'Heizkessel',          nameEn:'Boiler',
    zeit:0.5, ergibt:1, zutaten:[z('steinofen',1), z('rohr',4)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'dampfmaschine',      name:'Dampfmaschine',       nameEn:'Steam Engine',
    zeit:0.5, ergibt:1, zutaten:[z('eisenzahnrad',8), z('rohr',5), z('eisenplatte',10)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'dampfturbine',       name:'Dampfturbine',        nameEn:'Steam Turbine',
    zeit:3, ergibt:1, zutaten:[z('kupferplatte',50), z('eisenzahnrad',50), z('rohr',20)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'waermetauscher',     name:'Wärmetauscher',       nameEn:'Heat Exchanger',
    zeit:3, ergibt:1, zutaten:[z('kupferplatte',100), z('rohr',10), z('stahlplatte',10)],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ASSEMBLER },

  { id:'waermeleitung',      name:'Wärmeleitung',        nameEn:'Heat Pipe',
    zeit:1, ergibt:1, zutaten:[z('kupferplatte',20), z('stahlplatte',10)],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ASSEMBLER },

  { id:'akkumulator',        name:'Akkumulator',         nameEn:'Accumulator',
    zeit:10, ergibt:1, zutaten:[z('eisenplatte',2), z('batterie',5)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  { id:'solarpanel',         name:'Solarpanel',          nameEn:'Solar Panel',
    zeit:10, ergibt:1, zutaten:[z('kupferplatte',5), z('gruener-schaltkreis',15), z('stahlplatte',5)],
    kategorie:KATEGORIEN.ENERGIE, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Maschinen & Gebäude
  // =========================================================================
  { id:'steinofen',          name:'Steinofen',           nameEn:'Stone Furnace',
    zeit:0.5, ergibt:1, zutaten:[z('stein',5)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'stahlofen',          name:'Stahlofen',           nameEn:'Steel Furnace',
    zeit:3, ergibt:1, zutaten:[z('stahlplatte',6), z('steinziegel',10)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'elektrischer-ofen',  name:'Elektrischer Ofen',   nameEn:'Electric Furnace',
    zeit:5, ergibt:1, zutaten:[z('roter-schaltkreis',5), z('stahlplatte',10), z('steinziegel',10)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'montageautomat-1',   name:'Montageautomat 1',    nameEn:'Assembling Machine 1',
    zeit:0.5, ergibt:1, zutaten:[z('gruener-schaltkreis',3), z('eisenzahnrad',5), z('eisenplatte',9)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'montageautomat-2',   name:'Montageautomat 2',    nameEn:'Assembling Machine 2',
    zeit:0.5, ergibt:1, zutaten:[z('montageautomat-1',1), z('gruener-schaltkreis',3), z('eisenzahnrad',5), z('stahlplatte',2)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'montageautomat-3',   name:'Montageautomat 3',    nameEn:'Assembling Machine 3',
    zeit:0.5, ergibt:1, zutaten:[z('montageautomat-2',2), z('geschwindigkeitsmodul',4)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'chemieanlage-maschine', name:'Chemieanlage',     nameEn:'Chemical Plant',
    zeit:5, ergibt:1, zutaten:[z('gruener-schaltkreis',5), z('eisenzahnrad',5), z('stahlplatte',5), z('rohr',5)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'oelraffinerie-maschine', name:'Ölraffinerie',    nameEn:'Oil Refinery',
    zeit:8, ergibt:1, zutaten:[z('gruener-schaltkreis',10), z('eisenzahnrad',10), z('stahlplatte',15), z('rohr',10), z('steinziegel',10)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'elektrischer-bergbaubohrer', name:'Elektrischer Bergbaubohrer', nameEn:'Electric Mining Drill',
    zeit:2, ergibt:1, zutaten:[z('gruener-schaltkreis',3), z('eisenzahnrad',5), z('eisenplatte',10)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'radar',              name:'Radar',               nameEn:'Radar',
    zeit:0.5, ergibt:1, zutaten:[z('gruener-schaltkreis',5), z('eisenzahnrad',5), z('eisenplatte',10)],
    kategorie:KATEGORIEN.MASCHINEN_BAU, maschine:MASCHINEN.ASSEMBLER },

  { id:'kernreaktor',        name:'Kernreaktor',         nameEn:'Nuclear Reactor',
    zeit:8, ergibt:1, zutaten:[z('roter-schaltkreis',500), z('beton',500), z('kupferplatte',500), z('stahlplatte',500)],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ASSEMBLER },

  { id:'zentrifuge-maschine',name:'Zentrifuge',          nameEn:'Centrifuge',
    zeit:4, ergibt:1, zutaten:[z('roter-schaltkreis',100), z('beton',100), z('eisenzahnrad',100), z('stahlplatte',50)],
    kategorie:KATEGORIEN.NUKLEAR, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Militär
  // =========================================================================
  { id:'schussmagazin',      name:'Schusswaffenmagazin', nameEn:'Firearm Magazine',
    zeit:1, ergibt:1, zutaten:[z('eisenplatte',4)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  { id:'panzermunition',     name:'Panzerbrechende Munition', nameEn:'Piercing Rounds Magazine',
    zeit:6, ergibt:2, zutaten:[z('kupferplatte',2), z('schussmagazin',2), z('stahlplatte',1)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  { id:'granate',            name:'Granate',             nameEn:'Grenade',
    zeit:8, ergibt:1, zutaten:[z('kohle',10), z('eisenplatte',5)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  { id:'sprengstoff',        name:'Sprengstoff',         nameEn:'Explosives',
    zeit:4, ergibt:2, zutaten:[z('kohle',1), z('schwefel',1), z('wasser',10)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.CHEMIEANLAGE },

  { id:'mauer',              name:'Mauer',               nameEn:'Wall',
    zeit:0.5, ergibt:1, zutaten:[z('steinziegel',5)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  { id:'landmine',           name:'Landmine',            nameEn:'Land Mine',
    zeit:5, ergibt:4, zutaten:[z('stahlplatte',1), z('sprengstoff',2)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  { id:'geschuetzturm',      name:'Geschützturm',        nameEn:'Gun Turret',
    zeit:8, ergibt:1, zutaten:[z('kupferplatte',10), z('eisenzahnrad',10), z('eisenplatte',20)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  { id:'laserturm',          name:'Laserturm',           nameEn:'Laser Turret',
    zeit:20, ergibt:1, zutaten:[z('stahlplatte',20), z('gruener-schaltkreis',20), z('batterie',12)],
    kategorie:KATEGORIEN.MILITAER, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Module
  // =========================================================================
  { id:'geschwindigkeitsmodul',   name:'Geschwindigkeitsmodul',   nameEn:'Speed Module',
    zeit:15, ergibt:1, zutaten:[z('roter-schaltkreis',5), z('gruener-schaltkreis',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'geschwindigkeitsmodul-2', name:'Geschwindigkeitsmodul 2', nameEn:'Speed Module 2',
    zeit:30, ergibt:1, zutaten:[z('geschwindigkeitsmodul',4), z('roter-schaltkreis',5), z('verarbeitungseinheit',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'geschwindigkeitsmodul-3', name:'Geschwindigkeitsmodul 3', nameEn:'Speed Module 3',
    zeit:60, ergibt:1, zutaten:[z('geschwindigkeitsmodul-2',4), z('roter-schaltkreis',5), z('verarbeitungseinheit',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'effizienzmodul',          name:'Effizienzmodul',          nameEn:'Efficiency Module',
    zeit:15, ergibt:1, zutaten:[z('roter-schaltkreis',5), z('gruener-schaltkreis',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'effizienzmodul-2',        name:'Effizienzmodul 2',        nameEn:'Efficiency Module 2',
    zeit:30, ergibt:1, zutaten:[z('effizienzmodul',4), z('roter-schaltkreis',5), z('verarbeitungseinheit',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'effizienzmodul-3',        name:'Effizienzmodul 3',        nameEn:'Efficiency Module 3',
    zeit:60, ergibt:1, zutaten:[z('effizienzmodul-2',4), z('roter-schaltkreis',5), z('verarbeitungseinheit',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'produktivitaetsmodul',    name:'Produktivitätsmodul',     nameEn:'Productivity Module',
    zeit:15, ergibt:1, zutaten:[z('roter-schaltkreis',5), z('gruener-schaltkreis',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'produktivitaetsmodul-2',  name:'Produktivitätsmodul 2',   nameEn:'Productivity Module 2',
    zeit:30, ergibt:1, zutaten:[z('produktivitaetsmodul',4), z('roter-schaltkreis',5), z('verarbeitungseinheit',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  { id:'produktivitaetsmodul-3',  name:'Produktivitätsmodul 3',   nameEn:'Productivity Module 3',
    zeit:60, ergibt:1, zutaten:[z('produktivitaetsmodul-2',4), z('roter-schaltkreis',5), z('verarbeitungseinheit',5)],
    kategorie:KATEGORIEN.MODULE, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Wissenschaftspakete (Vanilla)
  // =========================================================================
  { id:'science-rot',    name:'Automatisierungs-Forschungspaket', nameEn:'Automation Science Pack',
    zeit:5, ergibt:1, zutaten:[z('kupferplatte',1), z('eisenzahnrad',1)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.ASSEMBLER },

  { id:'science-gruen',  name:'Logistik-Forschungspaket',        nameEn:'Logistic Science Pack',
    zeit:6, ergibt:1, zutaten:[z('greifarm',1), z('transportband',1)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.ASSEMBLER },

  { id:'science-schwarz',name:'Militär-Forschungspaket',         nameEn:'Military Science Pack',
    zeit:10, ergibt:2, zutaten:[z('granate',1), z('panzermunition',1), z('mauer',2)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.ASSEMBLER },

  { id:'science-blau',   name:'Chemie-Forschungspaket',          nameEn:'Chemical Science Pack',
    zeit:24, ergibt:2, zutaten:[z('roter-schaltkreis',3), z('motoreinheit',2), z('schwefel',1)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.ASSEMBLER },

  { id:'science-lila',   name:'Produktions-Forschungspaket',     nameEn:'Production Science Pack',
    zeit:21, ergibt:3, zutaten:[z('elektrischer-ofen',1), z('produktivitaetsmodul',1), z('schiene',30)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.ASSEMBLER },

  { id:'science-gelb',   name:'Nützlichkeits-Forschungspaket',   nameEn:'Utility Science Pack',
    zeit:21, ergibt:3, zutaten:[z('flugzeugrahmen',1), z('leichte-konstruktion',3), z('verarbeitungseinheit',2)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // ASSEMBLER – Rakete & Orbit
  // =========================================================================
  { id:'raketenabschussbasis', name:'Raketenabschussbasis', nameEn:'Rocket Silo',
    zeit:30, ergibt:1,
    zutaten:[z('rohr',100), z('elektro-motoreinheit',200), z('beton',1000), z('verarbeitungseinheit',200), z('stahlplatte',1000)],
    kategorie:KATEGORIEN.RAKETE, maschine:MASCHINEN.ASSEMBLER },

  { id:'satellit', name:'Satellit', nameEn:'Satellite',
    zeit:5, ergibt:1,
    zutaten:[z('akkumulator',100), z('leichte-konstruktion',100), z('verarbeitungseinheit',100), z('radar',5), z('raketentreibstoff',50), z('solarpanel',100)],
    kategorie:KATEGORIEN.RAKETE, maschine:MASCHINEN.ASSEMBLER },

  { id:'raumplattform-fundament', name:'Raumplattform-Fundament', nameEn:'Space Platform Foundation',  // [SA]
    zeit:10, ergibt:1, zutaten:[z('kupferkabel',20), z('stahlplatte',20)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  { id:'raumplattform-starterpaket', name:'Raumplattform-Starterpaket', nameEn:'Space Platform Starter Pack',  // [SA]
    zeit:60, ergibt:1, zutaten:[z('verarbeitungseinheit',20), z('raumplattform-fundament',60), z('stahlplatte',20)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // SPACE AGE – Hochofen (Foundry) – Vulcanus
  // =========================================================================
  { id:'wolframplatte',      name:'Wolframplatte',       nameEn:'Tungsten Plate',
    zeit:10, ergibt:1, zutaten:[z('geschmolzenes-eisen',10), z('wolframerz',4)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.HOCHOFEN },

  { id:'metallurgisches-science', name:'Metallurgisches Forschungspaket', nameEn:'Metallurgic Science Pack',
    zeit:10, ergibt:1, zutaten:[z('geschmolzenes-kupfer',200), z('wolframkarbid',3), z('wolframplatte',2)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.HOCHOFEN },

  // Geschmolzene Metalle – im Rechner als Hochofen-Rohstoff (aus Erz + Kalzit)
  { id:'geschmolzenes-eisen',  name:'Geschmolzenes Eisen',  nameEn:'Molten Iron',   zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.BERGBAU },
  { id:'geschmolzenes-kupfer', name:'Geschmolzenes Kupfer', nameEn:'Molten Copper', zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.BERGBAU },

  // =========================================================================
  // SPACE AGE – Assembler (Space Age Zwischenprodukte)
  // =========================================================================
  { id:'wolframkarbid',      name:'Wolframkarbid',       nameEn:'Tungsten Carbide',
    zeit:1, ergibt:1, zutaten:[z('kohlenstoff',1), z('schwefelsaeure',10), z('wolframerz',2)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  { id:'holmiumplatte',      name:'Holmiumplatte',       nameEn:'Holmium Plate',
    zeit:1, ergibt:1, zutaten:[z('holmiumloesung',20)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  { id:'yumako-brei',        name:'Yumako-Brei',         nameEn:'Yumako Mash',
    zeit:1, ergibt:2, zutaten:[z('yumako',1)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  { id:'gelee',              name:'Gelee',               nameEn:'Jelly',
    zeit:1, ergibt:4, zutaten:[z('jellynus',1)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  { id:'naehrstoffe',        name:'Nährstoffe',          nameEn:'Nutrients',
    zeit:2, ergibt:1, zutaten:[z('verderb',10)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.ASSEMBLER },

  // =========================================================================
  // SPACE AGE – Biokammer (Gleba)
  // =========================================================================
  { id:'biofluss',           name:'Biofluss',            nameEn:'Bioflux',
    zeit:6, ergibt:4, zutaten:[z('gelee',12), z('yumako-brei',15)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.BIOKAMMER },

  { id:'naehrstoffe-aus-biofluss', name:'Nährstoffe (aus Biofluss)', nameEn:'Nutrients (from Bioflux)',
    zeit:2, ergibt:40, zutaten:[z('biofluss',5)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.BIOKAMMER },

  { id:'kohlenstofffaser',   name:'Kohlenstofffaser',    nameEn:'Carbon Fiber',
    zeit:5, ergibt:1, zutaten:[z('kohlenstoff',1), z('yumako-brei',10)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.BIOKAMMER },

  { id:'landwirtschaftliches-science', name:'Landwirtschaftliches Forschungspaket', nameEn:'Agricultural Science Pack',
    zeit:4, ergibt:1, zutaten:[z('biofluss',1), z('fuenfbeiner-ei',1)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.BIOKAMMER },

  // =========================================================================
  // SPACE AGE – Elektromagnetische Anlage (Fulgora)
  // =========================================================================
  { id:'elektrolyt',         name:'Elektrolyt',          nameEn:'Electrolyte',
    zeit:5, ergibt:10, zutaten:[z('schwerol',10), z('holmiumloesung',10), z('stein',1)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.EM_ANLAGE },

  { id:'supraleiter',        name:'Supraleiter',         nameEn:'Superconductor',
    zeit:5, ergibt:2, zutaten:[z('kupferplatte',1), z('holmiumplatte',1), z('leichtoel',5), z('kunststoffstange',1)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.EM_ANLAGE },

  { id:'superkondensator',   name:'Superkondensator',    nameEn:'Supercapacitor',
    zeit:10, ergibt:1, zutaten:[z('batterie',1), z('elektrolyt',10), z('gruener-schaltkreis',4), z('holmiumplatte',2), z('supraleiter',2)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.EM_ANLAGE },

  { id:'quantenprozessor',   name:'Quantenprozessor',    nameEn:'Quantum Processor',
    zeit:30, ergibt:1,
    zutaten:[z('kohlenstofffaser',1), z('fluoroketon-kalt',10), z('lithiumplatte',2), z('verarbeitungseinheit',1), z('supraleiter',1), z('wolframkarbid',1)],
    nebenprodukte:[{ id:'fluoroketon-heiss', menge:5 }],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.EM_ANLAGE },

  { id:'elektromagnetisches-science', name:'Elektromagnetisches Forschungspaket', nameEn:'Electromagnetic Science Pack',
    zeit:10, ergibt:1, zutaten:[z('akkumulator',1), z('elektrolyt',25), z('holmiumloesung',25), z('superkondensator',1)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.EM_ANLAGE },

  // =========================================================================
  // SPACE AGE – Kryogenanlage (Aquilo)
  // =========================================================================
  // Fluoroketon-Kreislauf: heiss → kalt (Kryogenanlage), kalt wird in Rezepten verbraucht
  { id:'fluoroketon-kalt',   name:'Fluoroketon (kalt)', nameEn:'Fluoroketone (cold)',
    zeit:5, ergibt:10, zutaten:[z('fluoroketon-heiss',10)],
    kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.KRYOGENANLAGE },

  { id:'fluoroketon-heiss',  name:'Fluoroketon (heiß)', nameEn:'Fluoroketone (hot)',
    zeit:0, ergibt:1, zutaten:[], kategorie:KATEGORIEN.SPACE_AGE, maschine:MASCHINEN.BERGBAU },

  { id:'kryogenes-science',  name:'Kryogenes Forschungspaket', nameEn:'Cryogenic Science Pack',
    zeit:20, ergibt:1,
    zutaten:[z('fluoroketon-kalt',6), z('eis',3), z('lithiumplatte',1)],
    nebenprodukte:[{ id:'fluoroketon-heiss', menge:3 }],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.KRYOGENANLAGE },

  // =========================================================================
  // SPACE AGE – Raumplattform (Space Platform Hub)
  // =========================================================================
  // Weltraum-Forschungspaket: nur auf Raumplattform herstellbar
  { id:'weltraum-science',   name:'Weltraum-Forschungspaket', nameEn:'Space Science Pack',
    zeit:15, ergibt:5, zutaten:[z('kohlenstoff',1), z('eis',1), z('eisenplatte',2)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.RAUMPLATTFORM },

  { id:'promethium-science', name:'Promethium-Forschungspaket', nameEn:'Promethium Science Pack',
    zeit:5, ergibt:10,
    zutaten:[z('beisserei',10), z('promethium-brocken',25), z('quantenprozessor',1)],
    kategorie:KATEGORIEN.SCIENCE, maschine:MASCHINEN.KRYOGENANLAGE },

];

export const REZEPTE_MAP = Object.fromEntries(REZEPTE.map(r => [r.id, r]));
