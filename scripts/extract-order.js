#!/usr/bin/env node
/**
 * extract-order.js
 *
 * Factorio 2.x hat kein "order"-Feld für Technologien in den Lua-Prototypen.
 * Dieses Script extrahiert die Deklarationsreihenfolge der Technologien direkt
 * aus den Lua-Quelldateien — das ist die natürliche Gruppierung der Factorio-
 * Entwickler und spiegelt die interne Struktur des Spiels wider.
 *
 * Das resultierende `order`-Feld hat das Format  "{dateiIndex:1d}-{position:04d}"
 * und wird in gamedata.json eingetragen.  Dagre nutzt diese Sortierung um
 * verwandte Technologien innerhalb einer Ebene nebeneinander zu platzieren.
 *
 * Ausführen:  node scripts/extract-order.js
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Pfade ─────────────────────────────────────────────────────────────────────
const FACTORIO_ROOT = 'C:/Program Files (x86)/Steam/steamapps/common/Factorio/data';

const LUA_FILES = [
  path.join(FACTORIO_ROOT, 'base/prototypes/technology.lua'),
  path.join(FACTORIO_ROOT, 'space-age/prototypes/technology.lua'),
  path.join(FACTORIO_ROOT, 'quality/prototypes/technology.lua'),
  path.join(FACTORIO_ROOT, 'elevated-rails/prototypes/technology/elevated-rails.lua'),
];

const GAMEDATA_PATH = path.join(__dirname, '..', 'src', 'data', 'gamedata.json');

// ── Lua-Hilfsfunktionen (vereinfacht aus extract-game-data.js) ────────────────

function stripComments(src) {
  let result = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] === '-' && src[i + 1] === '-') {
      if (src[i + 2] === '[' && src[i + 3] === '[') {
        const end = src.indexOf(']]', i + 4);
        if (end === -1) { i = src.length; break; }
        const slice = src.slice(i, end + 2);
        result += slice.replace(/[^\n]/g, '');
        i = end + 2;
      } else {
        const nl = src.indexOf('\n', i);
        if (nl === -1) { i = src.length; break; }
        result += '\n';
        i = nl + 1;
      }
    } else if (src[i] === '"') {
      let s = '"'; i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; }
        else { s += src[i]; i++; }
      }
      result += s + '"'; i++;
    } else if (src[i] === "'") {
      let s = "'"; i++;
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; }
        else { s += src[i]; i++; }
      }
      result += s + "'"; i++;
    } else if (src[i] === '[' && src[i + 1] === '[') {
      const end = src.indexOf(']]', i + 2);
      if (end === -1) { result += src.slice(i); break; }
      result += src.slice(i, end + 2);
      i = end + 2;
    } else {
      result += src[i]; i++;
    }
  }
  return result;
}

function extractBalancedBlock(src, startIdx) {
  if (src[startIdx] !== '{') return null;
  let depth = 0, i = startIdx, inStr = false, strCh = '';
  while (i < src.length) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strCh = ch;
    } else if (ch === '{') { depth++; }
    else if (ch === '}') { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
    i++;
  }
  return null;
}

function splitArrayElements(body) {
  const elements = [];
  let i = 0, depth = 0, start = 0, inStr = false, strCh = '';
  while (i < body.length) {
    const ch = body[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
    } else if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
    else if (ch === '{') { depth++; }
    else if (ch === '}') { depth--; }
    else if (ch === ',' && depth === 0) {
      const elem = body.slice(start, i).trim();
      if (elem) elements.push(elem);
      start = i + 1;
    }
    i++;
  }
  const last = body.slice(start).trim();
  if (last) elements.push(last);
  return elements;
}

function extractPrototypes(src) {
  const stripped = stripComments(src);
  const prototypes = [];
  let i = 0;
  while (i < stripped.length) {
    const extIdx = stripped.indexOf('data:extend', i);
    if (extIdx === -1) break;
    let j = extIdx + 11;
    while (j < stripped.length && stripped[j] !== '(') j++;
    j++;
    while (j < stripped.length && /\s/.test(stripped[j])) j++;
    if (stripped[j] !== '{') { i = extIdx + 11; continue; }
    const arrayBlock = extractBalancedBlock(stripped, j);
    if (!arrayBlock) { i = extIdx + 11; continue; }
    for (const elem of splitArrayElements(arrayBlock.slice(1, -1))) {
      const t = elem.trim();
      if (t.startsWith('{')) prototypes.push(t);
    }
    i = j + arrayBlock.length;
  }
  return prototypes;
}

function strField(block, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 's');
  const m = block.match(re);
  return m ? m[1] : null;
}

// ── Tech-Namen aus Lua-Dateien extrahieren ────────────────────────────────────

function extractTechNamesFromFile(filePath) {
  let src;
  try {
    src = fs.readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`  Datei nicht gefunden, übersprungen: ${filePath}`);
    return [];
  }

  const protos = extractPrototypes(src);
  const names = [];
  for (const block of protos) {
    const type = strField(block, 'type');
    if (type !== 'technology') continue;
    const name = strField(block, 'name');
    if (name) names.push(name);
  }
  return names;
}

// ── Haupt-Logik ───────────────────────────────────────────────────────────────

console.log('=== extract-order.js ===\n');

// 1. Alle Lua-Dateien lesen, Tech-Namen in Deklarationsreihenfolge sammeln
const orderMap = new Map(); // techId → order-String

for (let fileIdx = 0; fileIdx < LUA_FILES.length; fileIdx++) {
  const luaPath = LUA_FILES[fileIdx];
  const names = extractTechNamesFromFile(luaPath);
  console.log(`Datei ${fileIdx}: ${path.basename(path.dirname(luaPath))}/${path.basename(luaPath)} → ${names.length} Technologien`);

  for (let pos = 0; pos < names.length; pos++) {
    const techId = names[pos];
    if (!orderMap.has(techId)) {
      // Format: "0-0042" = erste Datei, Position 42
      const order = `${fileIdx}-${String(pos).padStart(4, '0')}`;
      orderMap.set(techId, order);
    }
  }
}

console.log(`\nGefunden: ${orderMap.size} Technologien mit Deklarationsreihenfolge\n`);

// 2. gamedata.json laden
const gamedata = JSON.parse(fs.readFileSync(GAMEDATA_PATH, 'utf8'));
const technologies = gamedata.technologies;

// 3. order-Feld eintragen
let updated = 0;
let missing = 0;

for (const [techId, tech] of Object.entries(technologies)) {
  if (orderMap.has(techId)) {
    tech.order = orderMap.get(techId);
    updated++;
  } else {
    // Fallback: alphabetisch ans Ende (z-prefix)
    tech.order = `9-${techId}`;
    missing++;
  }
}

console.log(`Eingetragen: ${updated} Techs mit Lua-Reihenfolge`);
if (missing > 0) {
  console.log(`Fallback (nicht in Lua gefunden): ${missing} Techs`);

  // Namen der fehlenden Techs ausgeben (zur Info)
  const missingNames = Object.entries(technologies)
    .filter(([, t]) => t.order.startsWith('9-'))
    .map(([id]) => id)
    .sort();
  console.log('  Fehlende:', missingNames.join(', '));
}

// 4. gamedata.json überschreiben
fs.writeFileSync(GAMEDATA_PATH, JSON.stringify(gamedata, null, 2) + '\n', 'utf8');
console.log(`\ngamedata.json aktualisiert: ${GAMEDATA_PATH}`);
