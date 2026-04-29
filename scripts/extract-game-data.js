#!/usr/bin/env node
/**
 * Factorio Game Data Extractor
 * Reads Lua prototype files from the Factorio installation and generates
 * src/data/gamedata.json plus copies all icon PNGs to public/images/icons/.
 *
 * Run with:  node scripts/extract-game-data.js
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── PATHS ───────────────────────────────────────────────────────────────────

const FACTORIO_ROOT = 'C:/Program Files (x86)/Steam/steamapps/common/Factorio/data';

const BASE    = path.join(FACTORIO_ROOT, 'base');
const SA      = path.join(FACTORIO_ROOT, 'space-age');
const QUALITY = path.join(FACTORIO_ROOT, 'quality');

const BASE_PROTO    = path.join(BASE,    'prototypes');
const SA_PROTO      = path.join(SA,      'prototypes');
const QUALITY_PROTO = path.join(QUALITY, 'prototypes');

const OUT_JSON  = path.join(__dirname, '..', 'src', 'data', 'gamedata.json');
const OUT_ICONS = path.join(__dirname, '..', 'public', 'images', 'icons');

// ─── LOCALE PARSER ───────────────────────────────────────────────────────────

function parseCfg(filePath) {
  const result = {};
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    let section = 'root';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith(';')) continue;
      if (line.startsWith('[')) {
        section = line.slice(1, line.indexOf(']'));
        if (!result[section]) result[section] = {};
      } else {
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1);
        if (!result[section]) result[section] = {};
        result[section][key] = val;
      }
    }
  } catch {
    // missing locale file – silently skip
  }
  return result;
}

function mergeCfg(...cfgs) {
  const out = {};
  for (const cfg of cfgs) {
    for (const [sec, entries] of Object.entries(cfg)) {
      if (!out[sec]) out[sec] = {};
      Object.assign(out[sec], entries);
    }
  }
  return out;
}

function buildLocale() {
  const de = mergeCfg(
    parseCfg(path.join(BASE,    'locale', 'de', 'base.cfg')),
    parseCfg(path.join(SA,      'locale', 'de', 'space-age.cfg')),
    parseCfg(path.join(QUALITY, 'locale', 'de', 'quality.cfg')),
  );
  const en = mergeCfg(
    parseCfg(path.join(BASE,    'locale', 'en', 'base.cfg')),
    parseCfg(path.join(SA,      'locale', 'en', 'space-age.cfg')),
    parseCfg(path.join(QUALITY, 'locale', 'en', 'quality.cfg')),
  );
  return { de, en };
}

function getLocName(locale, sections, id) {
  for (const sec of sections) {
    if (locale.de[sec]?.[id] !== undefined) {
      return {
        de: locale.de[sec][id],
        en: locale.en[sec]?.[id] ?? id,
      };
    }
  }
  return { de: id, en: id };
}

// ─── LUA PARSER UTILITIES ────────────────────────────────────────────────────

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
      let s = '"';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; }
        else { s += src[i]; i++; }
      }
      result += s + '"';
      i++;
    } else if (src[i] === "'") {
      let s = "'";
      i++;
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; }
        else { s += src[i]; i++; }
      }
      result += s + "'";
      i++;
    } else if (src[i] === '[' && src[i + 1] === '[') {
      const end = src.indexOf(']]', i + 2);
      if (end === -1) { result += src.slice(i); i = src.length; break; }
      result += src.slice(i, end + 2);
      i = end + 2;
    } else {
      result += src[i];
      i++;
    }
  }
  return result;
}

function extractBalancedBlock(src, startIdx) {
  if (src[startIdx] !== '{') return null;
  let depth = 0;
  let i = startIdx;
  let inStr = false;
  let strCh = '';

  while (i < src.length) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strCh = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(startIdx, i + 1);
    }
    i++;
  }
  return null;
}

function splitArrayElements(body) {
  const elements = [];
  let i = 0;
  let depth = 0;
  let start = 0;
  let inStr = false;
  let strCh = '';

  while (i < body.length) {
    const ch = body[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strCh = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
    } else if (ch === ',' && depth === 0) {
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

    const elements = splitArrayElements(arrayBlock.slice(1, -1));
    for (const elem of elements) {
      const trimmed = elem.trim();
      if (trimmed.startsWith('{')) prototypes.push(trimmed);
    }

    i = j + arrayBlock.length;
  }

  return prototypes;
}

// ─── FIELD HELPERS ───────────────────────────────────────────────────────────

function strField(block, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 's');
  const m = block.match(re);
  return m ? m[1] : null;
}

function numField(block, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*([\\d.*+/^()-]+)(?=[,\\s\\n}])`, 's');
  const m = block.match(re);
  if (!m) return null;
  try {
    const expr = m[1].replace(/\^/g, '**');
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${expr})`)();
  } catch {
    return parseFloat(m[1]) || null;
  }
}

function boolField(block, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(true|false)\\b`);
  const m = block.match(re);
  return m ? m[1] === 'true' : null;
}

function tableField(block, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(\\{)`);
  const m = re.exec(block);
  if (!m) return null;
  return extractBalancedBlock(block, m.index + m[0].length - 1);
}

function parseStringArray(tableStr) {
  if (!tableStr) return [];
  return (tableStr.slice(1, -1).match(/"([^"]*)"/g) ?? []).map(s => s.slice(1, -1));
}

function parseEnergyKw(str) {
  if (!str) return 0;
  const m = str.match(/([\d.]+)\s*(k|K|m|M|g|G|t|T)?[Ww]/);
  if (!m) return 0;
  const val = parseFloat(m[1]);
  const unit = (m[2] || '').toLowerCase();
  return val * ({ k: 1, m: 1000, g: 1e6, t: 1e9 }[unit] ?? 1);
}

function extractLocalVars(src) {
  const vars = {};
  const re = /\blocal\s+(\w+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(src)) !== null) vars[m[1]] = m[2];
  return vars;
}

function resolveIconExpr(block, localVars) {
  const iconStr = strField(block, 'icon');
  if (iconStr) return iconStr;

  const iconsUtil = block.match(/\bicons\s*=\s*\w+(?:\.\w+)*\s*\(([^)]+)\)/);
  if (iconsUtil) {
    const arg = iconsUtil[1].trim();
    const qm = arg.match(/^"([^"]+)"$/);
    if (qm) return qm[1];
    if (localVars[arg]) return localVars[arg];
  }

  const iconsTable = tableField(block, 'icons');
  if (iconsTable) {
    const firstIcon = strField(iconsTable, 'icon');
    if (firstIcon) return firstIcon;
  }

  return null;
}

// ─── ICON COPY UTILITIES ─────────────────────────────────────────────────────

const iconsCopied = new Map();

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolveIconPath(iconStr) {
  if (!iconStr) return null;
  return iconStr
    .replace('__base__',    BASE)
    .replace('__space-age__', SA)
    .replace('__quality__', QUALITY)
    .replace('__core__',    path.join(FACTORIO_ROOT, 'core'))
    .replace(/\//g, path.sep);
}

function copyIcon(luaPath, category) {
  if (!luaPath) return '';
  const realSrc = resolveIconPath(luaPath);
  if (!realSrc) return '';
  const cacheKey = `${category}:${realSrc}`;
  if (iconsCopied.has(cacheKey)) return iconsCopied.get(cacheKey);

  const destDir  = path.join(OUT_ICONS, category);
  ensureDir(destDir);
  const basename = path.basename(realSrc);
  const destPath = path.join(destDir, basename);
  const webPath  = `/images/icons/${category}/${basename}`;

  try {
    if (fs.existsSync(realSrc)) {
      fs.copyFileSync(realSrc, destPath);
      iconsCopied.set(cacheKey, webPath);
      return webPath;
    }
  } catch { /* skip missing icons */ }

  iconsCopied.set(cacheKey, '');
  return '';
}

// ─── SUBGROUP → GROUP MAP ────────────────────────────────────────────────────

function buildSubgroupMapFromFiles() {
  const map = {};
  const files = [
    path.join(BASE_PROTO,    'item-groups.lua'),
    path.join(SA_PROTO,      'item-groups.lua'),
    path.join(QUALITY_PROTO, 'module-category.lua'),
  ];
  for (const fPath of files) {
    if (!fs.existsSync(fPath)) continue;
    const content = fs.readFileSync(fPath, 'utf8');
    const re = /type\s*=\s*"item-subgroup"[^}]*?name\s*=\s*"([^"]+)"[^}]*?group\s*=\s*"([^"]+)"/gs;
    let m;
    while ((m = re.exec(content)) !== null) map[m[1]] = m[2];
  }
  return map;
}

// ─── INGREDIENT / RESULT PARSER ──────────────────────────────────────────────

function parseIngredients(tableStr) {
  if (!tableStr) return [];
  const elements = splitArrayElements(tableStr.slice(1, -1).trim());
  const result = [];

  for (const elem of elements) {
    const trimmed = elem.trim();
    if (!trimmed.startsWith('{')) continue;

    const nameVal = strField(trimmed, 'name');
    if (nameVal) {
      result.push({
        item:   nameVal,
        amount: numField(trimmed, 'amount') ?? 1,
        type:   strField(trimmed, 'type') || 'item',
      });
    } else {
      // Shorthand: {"item-name", N}
      const parts = splitArrayElements(trimmed.slice(1, -1).trim());
      if (parts.length >= 2) {
        const itemName = parts[0].replace(/^"|"$/g, '').trim();
        const amount   = parseFloat(parts[1]) || 1;
        if (itemName) result.push({ item: itemName, amount, type: 'item' });
      }
    }
  }
  return result;
}

// ─── TECH UNIT & EFFECTS PARSER ──────────────────────────────────────────────

function parseTechEffects(tableStr) {
  if (!tableStr) return [];
  const effects = [];
  for (const elem of splitArrayElements(tableStr.slice(1, -1).trim())) {
    if (!elem.startsWith('{')) continue;
    const type = strField(elem, 'type');
    if (!type) continue;
    const effect = { type };
    if (type === 'unlock-recipe') {
      effect.recipe = strField(elem, 'recipe') ?? '';
    } else {
      const modifier = numField(elem, 'modifier');
      if (modifier !== null) effect.modifier = modifier;
    }
    effects.push(effect);
  }
  return effects;
}

function parseTechUnit(tableStr) {
  if (!tableStr) return null;
  const ingredientsBlock = tableField(tableStr, 'ingredients');
  return {
    count:         numField(tableStr, 'count') ?? null,
    count_formula: strField(tableStr, 'count_formula') ?? null,
    ingredients:   ingredientsBlock ? parseIngredients(ingredientsBlock) : [],
    time:          numField(tableStr, 'time') ?? 30,
  };
}

// ─── SIZE EXTRACTOR ──────────────────────────────────────────────────────────

function extractSize(block) {
  const m = block.match(/selection_box\s*=\s*\{\s*\{[^}]+\}\s*,\s*\{([^}]+)\}\s*\}/);
  if (!m) return { width: 3, height: 3 };
  const nums = m[1].match(/-?[\d.]+/g);
  if (!nums || nums.length < 2) return { width: 3, height: 3 };
  return {
    width:  Math.round(parseFloat(nums[0]) * 2),
    height: Math.round(parseFloat(nums[1]) * 2),
  };
}

// ─── ITEM TYPES SET ──────────────────────────────────────────────────────────

const ITEM_TYPES = new Set([
  'item', 'ammo', 'tool', 'armor', 'gun', 'blueprint', 'blueprint-book',
  'deconstruction-item', 'upgrade-item', 'spidertron-remote', 'selection-tool',
  'copy-paste-tool', 'item-with-label', 'item-with-inventory', 'item-with-entity-data',
  'item-with-tags', 'repair-tool', 'capsule', 'rail-planner', 'asteroid-chunk',
  'space-platform-starter-pack',
]);

const MACHINE_TYPES = new Set([
  'assembling-machine', 'furnace', 'mining-drill', 'rocket-silo',
]);

// ─── EXTRACTORS ──────────────────────────────────────────────────────────────

function extractItemsFromFile(fPath, locale, subgroupMap, out) {
  if (!fs.existsSync(fPath)) return;
  const src = fs.readFileSync(fPath, 'utf8');
  const localVars = extractLocalVars(src);

  for (const proto of extractPrototypes(src)) {
    const type = strField(proto, 'type');
    if (!type || !ITEM_TYPES.has(type)) continue;

    const name = strField(proto, 'name');
    if (!name || name.startsWith('parameter-')) continue;

    const subgroup  = strField(proto, 'subgroup') ?? 'other';
    const iconExpr  = resolveIconExpr(proto, localVars);
    const iconPath  = copyIcon(iconExpr, 'items');
    const nameObj   = getLocName(locale, ['item-name'], name);

    out[name] = {
      id:         name,
      name:       nameObj,
      icon:       iconPath,
      category:   subgroupMap[subgroup] ?? subgroup,
      stack_size: numField(proto, 'stack_size') ?? 1,
      subgroup,
    };
  }
}

function extractItems(locale, subgroupMap) {
  const items = {};
  for (const fPath of [
    path.join(BASE_PROTO,    'item.lua'),
    path.join(SA_PROTO,      'item.lua'),
    path.join(QUALITY_PROTO, 'item.lua'),
  ]) {
    extractItemsFromFile(fPath, locale, subgroupMap, items);
  }
  return items;
}

function extractFluids(locale) {
  const fluids = {};
  for (const fPath of [
    path.join(BASE_PROTO, 'fluid.lua'),
    path.join(SA_PROTO,   'fluid.lua'),
  ]) {
    if (!fs.existsSync(fPath)) continue;
    const src = fs.readFileSync(fPath, 'utf8');
    const localVars = extractLocalVars(src);

    for (const proto of extractPrototypes(src)) {
      if (strField(proto, 'type') !== 'fluid') continue;
      const name = strField(proto, 'name');
      if (!name || name.startsWith('parameter-')) continue;

      const subgroup = strField(proto, 'subgroup') ?? 'fluid';
      fluids[name] = {
        id:       name,
        name:     getLocName(locale, ['fluid-name', 'item-name'], name),
        icon:     copyIcon(resolveIconExpr(proto, localVars), 'fluids'),
        category: 'fluid',
        subgroup,
      };
    }
  }
  return fluids;
}

function extractRecipes(locale) {
  const recipes = {};
  for (const fPath of [
    path.join(BASE_PROTO,    'recipe.lua'),
    path.join(SA_PROTO,      'recipe.lua'),
    path.join(QUALITY_PROTO, 'recipe.lua'),
  ]) {
    if (!fs.existsSync(fPath)) continue;
    const src = fs.readFileSync(fPath, 'utf8');
    const localVars = extractLocalVars(src);

    for (const proto of extractPrototypes(src)) {
      if (strField(proto, 'type') !== 'recipe') continue;
      const name = strField(proto, 'name');
      if (!name || name.startsWith('parameter-')) continue;

      const ingredientsBlock = tableField(proto, 'ingredients');
      const ingredients      = ingredientsBlock ? parseIngredients(ingredientsBlock) : [];

      const resultsBlock = tableField(proto, 'results');
      let results = resultsBlock ? parseIngredients(resultsBlock) : [];

      if (results.length === 0) {
        const resultName = strField(proto, 'result');
        if (resultName) {
          results = [{ item: resultName, amount: numField(proto, 'result_count') ?? 1, type: 'item' }];
        }
      }

      recipes[name] = {
        id:               name,
        name:             getLocName(locale, ['recipe-name', 'item-name', 'fluid-name', 'entity-name'], name),
        category:         strField(proto, 'category') ?? 'crafting',
        energy_required:  numField(proto, 'energy_required') ?? 0.5,
        ingredients,
        results,
        enabled_by: [],
        made_in:    [],
      };
    }
  }
  return recipes;
}

function extractTechnologies(locale) {
  const techs = {};
  for (const fPath of [
    path.join(BASE_PROTO,    'technology.lua'),
    path.join(SA_PROTO,      'technology.lua'),
    path.join(QUALITY_PROTO, 'technology.lua'),
  ]) {
    if (!fs.existsSync(fPath)) continue;
    const src = fs.readFileSync(fPath, 'utf8');
    const localVars = extractLocalVars(src);

    for (const proto of extractPrototypes(src)) {
      if (strField(proto, 'type') !== 'technology') continue;
      const name = strField(proto, 'name');
      if (!name) continue;

      const maxLevelRaw = strField(proto, 'max_level');
      const isInfinite  = maxLevelRaw === 'infinite';
      const maxLevel    = isInfinite ? null : (maxLevelRaw ? parseInt(maxLevelRaw) : 1);

      const iconExpr  = resolveIconExpr(proto, localVars);
      const iconPath  = iconExpr ? copyIcon(iconExpr, 'technologies') : '';

      const prereqBlock  = tableField(proto, 'prerequisites');
      const prerequisites = prereqBlock ? parseStringArray(prereqBlock) : [];

      const effectsBlock = tableField(proto, 'effects');
      const effects      = effectsBlock ? parseTechEffects(effectsBlock) : [];
      const unlocksRecipes = effects.filter(e => e.type === 'unlock-recipe').map(e => e.recipe);

      const unitBlock = tableField(proto, 'unit');
      const cost      = unitBlock ? parseTechUnit(unitBlock) : null;

      techs[name] = {
        id:              name,
        name:            getLocName(locale, ['technology-name'], name),
        icon:            iconPath,
        max_level:       maxLevel,
        is_infinite:     isInfinite,
        prerequisites,
        unlocks_recipes: unlocksRecipes,
        cost,
        effects,
      };
    }
  }
  return techs;
}

function extractMachinesFromFile(fPath, locale, out) {
  if (!fs.existsSync(fPath)) { console.log(`  [info] Not found: ${fPath}`); return; }
  const src = fs.readFileSync(fPath, 'utf8');
  const localVars = extractLocalVars(src);

  for (const proto of extractPrototypes(src)) {
    const type = strField(proto, 'type');
    if (!type || !MACHINE_TYPES.has(type)) continue;
    const name = strField(proto, 'name');
    if (!name) continue;

    const iconExpr  = resolveIconExpr(proto, localVars);
    const iconPath  = copyIcon(iconExpr, 'machines');

    const energyUsageStr = strField(proto, 'energy_usage') ?? strField(proto, 'active_energy_usage') ?? '0kW';
    const drainStr       = strField(proto, 'idle_energy_usage') ?? strField(proto, 'energy_drain') ?? '0kW';

    const catBlock     = tableField(proto, 'crafting_categories');
    const effectsBlock = tableField(proto, 'allowed_effects');

    out[name] = {
      id:                  name,
      name:                getLocName(locale, ['entity-name', 'item-name'], name),
      icon:                iconPath,
      type,
      crafting_speed:      numField(proto, 'crafting_speed') ?? numField(proto, 'mining_speed') ?? 1,
      energy_usage_kw:     parseEnergyKw(energyUsageStr),
      drain_kw:            parseEnergyKw(drainStr),
      module_slots:        numField(proto, 'module_slots') ?? 0,
      size:                extractSize(proto),
      crafting_categories: catBlock     ? parseStringArray(catBlock)     : [],
      allowed_effects:     effectsBlock ? parseStringArray(effectsBlock) : [],
    };
  }
}

function extractMachines(locale) {
  const machines = {};
  const entityFiles = [
    path.join(BASE_PROTO, 'entity', 'entities.lua'),
    path.join(BASE_PROTO, 'entity', 'mining-drill.lua'),
    path.join(SA_PROTO,   'entity', 'entities.lua'),
    path.join(SA_PROTO,   'entity', 'big-mining-drill.lua'),
  ];
  for (const fPath of entityFiles) extractMachinesFromFile(fPath, locale, machines);
  return machines;
}

function extractModules(locale) {
  const modules = {};
  for (const fPath of [
    path.join(BASE_PROTO,    'item.lua'),
    path.join(SA_PROTO,      'item.lua'),
    path.join(QUALITY_PROTO, 'item.lua'),
  ]) {
    if (!fs.existsSync(fPath)) continue;
    const src = fs.readFileSync(fPath, 'utf8');
    const localVars = extractLocalVars(src);

    for (const proto of extractPrototypes(src)) {
      if (strField(proto, 'type') !== 'module') continue;
      const name = strField(proto, 'name');
      if (!name) continue;

      const effectBlock  = tableField(proto, 'effect');
      const limitBlock   = tableField(proto, 'limitation');

      const effect = {};
      if (effectBlock) {
        for (const f of ['speed', 'consumption', 'productivity', 'pollution', 'quality']) {
          const val = numField(effectBlock, f);
          if (val !== null) effect[f] = val;
        }
      }

      modules[name] = {
        id:          name,
        name:        getLocName(locale, ['item-name'], name),
        icon:        copyIcon(resolveIconExpr(proto, localVars), 'modules'),
        tier:        numField(proto, 'tier') ?? 1,
        category:    strField(proto, 'category') ?? 'speed',
        effect,
        limitations: limitBlock ? parseStringArray(limitBlock) : [],
      };
    }
  }
  return modules;
}

// ─── POST-PROCESSING ─────────────────────────────────────────────────────────

function wireEnabledBy(recipes, technologies) {
  for (const [techId, tech] of Object.entries(technologies)) {
    for (const recipeId of tech.unlocks_recipes) {
      if (recipes[recipeId] && !recipes[recipeId].enabled_by.includes(techId)) {
        recipes[recipeId].enabled_by.push(techId);
      }
    }
  }
}

function wireMadeIn(recipes, machines) {
  const catMap = {};
  for (const [machId, mach] of Object.entries(machines)) {
    for (const cat of mach.crafting_categories) {
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(machId);
    }
  }
  for (const recipe of Object.values(recipes)) {
    recipe.made_in = catMap[recipe.category] ?? [];
  }
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const QUALITIES = {
  normal:    { level: 0, color: '#d2d2d2', multiplier: 1.0 },
  uncommon:  { level: 1, color: '#5dbf3c', multiplier: 1.3 },
  rare:      { level: 2, color: '#4a90e2', multiplier: 1.6 },
  epic:      { level: 3, color: '#9b59b6', multiplier: 1.9 },
  legendary: { level: 4, color: '#f39c12', multiplier: 2.5 },
};

function extractBelts(locale) {
  const belts = {};
  for (const b of [
    { id: 'transport-belt',         speed: 15 },
    { id: 'fast-transport-belt',    speed: 30 },
    { id: 'express-transport-belt', speed: 45 },
    { id: 'turbo-transport-belt',   speed: 60 },
  ]) {
    belts[b.id] = {
      id:                 b.id,
      name:               getLocName(locale, ['entity-name', 'item-name'], b.id),
      speed_items_per_sec: b.speed,
    };
  }
  return belts;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Factorio Game Data Extractor ===\n');

  console.log('1. Parsing locale files...');
  const locale = buildLocale();
  console.log(`   DE sections: ${Object.keys(locale.de).length}, EN: ${Object.keys(locale.en).length}`);

  console.log('2. Building subgroup map...');
  const subgroupMap = buildSubgroupMapFromFiles();
  console.log(`   ${Object.keys(subgroupMap).length} subgroups`);

  ensureDir(path.dirname(OUT_JSON));
  ensureDir(OUT_ICONS);
  for (const d of ['items', 'machines', 'technologies', 'modules', 'fluids'])
    ensureDir(path.join(OUT_ICONS, d));

  console.log('3. Extracting items...');
  const items = extractItems(locale, subgroupMap);
  console.log(`   → ${Object.keys(items).length} items`);

  console.log('4. Extracting fluids...');
  const fluids = extractFluids(locale);
  console.log(`   → ${Object.keys(fluids).length} fluids`);
  Object.assign(items, fluids);
  console.log(`   → ${Object.keys(items).length} items + fluids total`);

  console.log('5. Extracting recipes...');
  const recipes = extractRecipes(locale);
  console.log(`   → ${Object.keys(recipes).length} recipes`);

  console.log('6. Extracting technologies...');
  const technologies = extractTechnologies(locale);
  console.log(`   → ${Object.keys(technologies).length} technologies`);

  console.log('7. Extracting machines...');
  const machines = extractMachines(locale);
  console.log(`   → ${Object.keys(machines).length} machines`);

  console.log('8. Extracting modules...');
  const modules = extractModules(locale);
  console.log(`   → ${Object.keys(modules).length} modules`);

  console.log('9. Post-processing (enabled_by, made_in)...');
  wireEnabledBy(recipes, technologies);
  wireMadeIn(recipes, machines);

  const qualities = QUALITIES;
  const belts     = extractBelts(locale);

  const gamedata = { items, recipes, machines, technologies, modules, qualities, belts };

  console.log('10. Writing gamedata.json...');
  fs.writeFileSync(OUT_JSON, JSON.stringify(gamedata, null, 2), 'utf8');
  console.log(`    → ${OUT_JSON}`);

  // ── Validation ──────────────────────────────────────────────────────────────
  console.log('\n=== VALIDATION ===');
  const check = (label, actual, min) => {
    const ok = actual >= min;
    console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual} (expected ≥ ${min})`);
    return ok;
  };

  const allOk = [
    check('Items + Fluids', Object.keys(items).length,        300),
    check('Recipes',        Object.keys(recipes).length,      300),
    check('Machines',       Object.keys(machines).length,      20),
    check('Technologies',   Object.keys(technologies).length, 180),
    check('Modules',        Object.keys(modules).length,       12),
    check('Icons copied',   iconsCopied.size,                 400),
  ].every(Boolean);

  console.log(allOk ? '\n✓ All checks passed!' : '\n✗ Some checks failed.');
  if (!allOk) process.exitCode = 1;
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
