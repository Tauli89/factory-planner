/**
 * Factorio Maschinendaten – Stromverbrauch
 * Quellen: wiki.factorio.com (Vanilla 2.0 + Space Age, verifiziert April 2026)
 * Alle Werte in kW (Nenn-Verbrauch, keine Module).
 *
 * Für ASSEMBLER wird der Montageautomat 2 (150 kW, Geschwindigkeit 0.75) angenommen,
 * da dieser den Standardwert in berechnung.js widerspiegelt.
 */

import { MASCHINEN } from './recipes';

// ---------------------------------------------------------------------------
// Stromverbrauch pro Maschinen-Typ in kW
// ---------------------------------------------------------------------------
export const MASCHINEN_STROMVERBRAUCH = {
  [MASCHINEN.ASSEMBLER]:     150,  // Montageautomat 2
  [MASCHINEN.SCHMELZOFEN]:   180,  // Elektrischer Ofen
  [MASCHINEN.CHEMIEANLAGE]:  210,  // Chemieanlage
  [MASCHINEN.OELRAFFINERIE]: 420,  // Ölraffinerie
  [MASCHINEN.ZENTRIFUGE]:    350,  // Zentrifuge
  [MASCHINEN.BERGBAU]:        90,  // Elektrischer Bergbaubohrer
  [MASCHINEN.HOCHOFEN]:     2500,  // Hochofen [SA]
  [MASCHINEN.EM_ANLAGE]:    2000,  // Elektromagnetische Anlage [SA]
  [MASCHINEN.BIOKAMMER]:     500,  // Biokammer [SA]
  [MASCHINEN.KRYOGENANLAGE]:1500,  // Kryogenanlage [SA]
  [MASCHINEN.RECYCLER]:      180,  // Recycler [SA]
  [MASCHINEN.RAUMPLATTFORM]:   0,  // Raumplattform-Hub (kein Stromverbrauch)
  [MASCHINEN.CRUSHER]:       540,  // Asteroid-Zerkleinerer [SA]
};

// Welcher konkrete Maschinenname steckt hinter dem generischen Typ
export const MASCHINEN_DETAIL_NAME = {
  [MASCHINEN.ASSEMBLER]:     { de: 'Montageautomat 2',              en: 'Assembling Machine 2' },
  [MASCHINEN.SCHMELZOFEN]:   { de: 'Elektrischer Ofen',             en: 'Electric Furnace' },
  [MASCHINEN.CHEMIEANLAGE]:  { de: 'Chemieanlage',                  en: 'Chemical Plant' },
  [MASCHINEN.OELRAFFINERIE]: { de: 'Ölraffinerie',                  en: 'Oil Refinery' },
  [MASCHINEN.ZENTRIFUGE]:    { de: 'Zentrifuge',                    en: 'Centrifuge' },
  [MASCHINEN.BERGBAU]:       { de: 'Elektrischer Bergbaubohrer',    en: 'Electric Mining Drill' },
  [MASCHINEN.HOCHOFEN]:      { de: 'Hochofen',                      en: 'Foundry' },
  [MASCHINEN.EM_ANLAGE]:     { de: 'Elektromagnetische Anlage',     en: 'EM Plant' },
  [MASCHINEN.BIOKAMMER]:     { de: 'Biokammer',                     en: 'Biochamber' },
  [MASCHINEN.KRYOGENANLAGE]: { de: 'Kryogenanlage',                 en: 'Cryogenic Plant' },
  [MASCHINEN.RECYCLER]:      { de: 'Recycler',                      en: 'Recycler' },
  [MASCHINEN.RAUMPLATTFORM]: { de: 'Raumplattform-Hub',             en: 'Space Platform Hub' },
  [MASCHINEN.CRUSHER]:       { de: 'Asteroid-Zerkleinerer',         en: 'Crusher' },
};

// ---------------------------------------------------------------------------
// Verschmutzung pro Maschinen-Typ in Einheiten/Minute (Vanilla 2.0-Werte)
// Quelle: wiki.factorio.com/Pollution  (verified April 2026)
// Für ASSEMBLER gilt der Montageautomat 2 als Standard (3.6/min).
// Space-Age-Maschinen ohne Verbrennung (Kryogen, Crusher) emittieren 0.
// ---------------------------------------------------------------------------
export const MASCHINEN_VERSCHMUTZUNG = {
  [MASCHINEN.ASSEMBLER]:      3.6,  // Montageautomat 2
  [MASCHINEN.SCHMELZOFEN]:    1.0,  // Elektrischer Ofen
  [MASCHINEN.CHEMIEANLAGE]:   4.0,  // Chemieanlage
  [MASCHINEN.OELRAFFINERIE]:  6.0,  // Ölraffinerie
  [MASCHINEN.ZENTRIFUGE]:     4.0,  // Zentrifuge
  [MASCHINEN.BERGBAU]:       10.0,  // Elektrischer Bergbaubohrer
  [MASCHINEN.HOCHOFEN]:      20.0,  // Hochofen [SA]
  [MASCHINEN.EM_ANLAGE]:      2.0,  // Elektromagnetische Anlage [SA]
  [MASCHINEN.BIOKAMMER]:      4.0,  // Biokammer [SA]
  [MASCHINEN.KRYOGENANLAGE]:  0.0,  // Kryogenanlage [SA] — kein Ausstoß
  [MASCHINEN.RECYCLER]:       2.0,  // Recycler [SA]
  [MASCHINEN.RAUMPLATTFORM]:  0.0,  // Raumplattform-Hub — im Weltraum
  [MASCHINEN.CRUSHER]:        0.0,  // Asteroid-Zerkleinerer [SA] — kein Ausstoß
};

// Pollution für konkrete Maschinen-IDs (relevant bei Maschinenauswahl-Override)
export const MACHINE_ID_VERSCHMUTZUNG = {
  'assembling-machine-1':    2.4,
  'assembling-machine-2':    3.6,
  'assembling-machine-3':    1.8,
  'stone-furnace':           4.0,
  'steel-furnace':           4.0,
  'electric-furnace':        1.0,
  'chemical-plant':          4.0,
  'oil-refinery':            6.0,
  'centrifuge':              4.0,
  'electric-mining-drill':  10.0,
  'burner-mining-drill':    20.0,
  'pumpjack':               10.0,
  'rocket-silo':            10.0,
  'foundry':                20.0,
  'electromagnetic-plant':   2.0,
  'biochamber':              4.0,
  'cryogenic-plant':         0.0,
  'recycler':                2.0,
  'crusher':                 0.0,
  'big-mining-drill':       40.0,
};

// ---------------------------------------------------------------------------
// Energiequellen (für Empfehlungen)
// ---------------------------------------------------------------------------
export const ENERGIEQUELLEN = {
  solarPanel: {
    leistungKW: 60,    // Durchschnitt Nauvis (Tag/Nacht-Zyklus)
    de: 'Solarpanel',
    en: 'Solar Panel',
  },
  dampfmaschine: {
    leistungKW: 900,
    de: 'Dampfmaschine',
    en: 'Steam Engine',
  },
};
