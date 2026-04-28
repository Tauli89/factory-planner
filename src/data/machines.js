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
