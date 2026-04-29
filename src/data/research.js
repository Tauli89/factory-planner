/**
 * Factorio Technologie-Datenbank – generiert aus gamedata.json (271 Technologien)
 */
import gamedata from './gamedata.json';

// ── Science pack item ID → kurzer Display-Key ─────────────────────────────────
const PACK_ID_TO_KEY = {
  'automation-science-pack':      'red',
  'logistic-science-pack':        'green',
  'chemical-science-pack':        'blue',
  'production-science-pack':      'black',
  'military-science-pack':        'purple',
  'utility-science-pack':         'yellow',
  'space-science-pack':           'white',
  'metallurgic-science-pack':     'se',
  'agricultural-science-pack':    'biologisch',
  'electromagnetic-science-pack': 'em',
  'cryogenic-science-pack':       'kryogen',
  'promethium-science-pack':      'promethium',
};

function buildCost(gdCost) {
  if (!gdCost) return {};
  const result = {};
  const count = gdCost.count; // null = unendlich
  for (const ing of gdCost.ingredients ?? []) {
    const key = PACK_ID_TO_KEY[ing.item] ?? ing.item;
    result[key] = count ?? '∞';
  }
  return result;
}

function buildEffects(gdTech) {
  const effects = [];
  for (const eff of gdTech.effects ?? []) {
    if (eff.type === 'unlock-recipe') {
      effects.push({ type: 'unlock_recipe', id: eff.recipe });
    } else if (eff.type === 'mining-drill-productivity-bonus') {
      effects.push({ type: 'mining_productivity', value: eff.modifier });
    }
    // weitere Effekttypen (Turretschaden etc.) werden für Boni nicht benötigt
  }
  return effects;
}

function formatId(id) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildTechName(gdTech) {
  const n = gdTech.name;
  const de = (n.de && n.de !== gdTech.id) ? n.de : formatId(gdTech.id);
  const en = (n.en && n.en !== gdTech.id) ? n.en : formatId(gdTech.id);
  return { de, en };
}

// ── Bekannte Deutsche Label für nummerierte Gruppen ───────────────────────────
const KNOWN_GROUP_LABELS = {
  'mining-productivity':       { de: 'Bergbau-Produktivität',       en: 'Mining Productivity' },
  'worker-robots-speed':       { de: 'Robotergeschwindigkeit',       en: 'Worker Robot Speed' },
  'worker-robots-storage':     { de: 'Roboter-Lagerkapazität',       en: 'Worker Robot Storage' },
  'inserter-capacity-bonus':   { de: 'Greifer-Kapazitätsbonus',      en: 'Inserter Capacity Bonus' },
  'research-speed':            { de: 'Forschungsgeschwindigkeit',     en: 'Research Speed' },
  'braking-force':             { de: 'Bremskraft',                   en: 'Braking Force' },
  'physical-projectile-damage':{ de: 'Projektilschaden',             en: 'Physical Projectile Damage' },
  'stronger-explosives':       { de: 'Stärkere Explosivstoffe',      en: 'Stronger Explosives' },
  'refined-flammables':        { de: 'Verfeinerte Brennstoffe',      en: 'Refined Flammables' },
  'laser-weapons-damage':      { de: 'Laserwaffen-Schaden',          en: 'Laser Weapons Damage' },
  'electric-weapons-damage':   { de: 'Elektrowaffen-Schaden',        en: 'Electric Weapons Damage' },
  'laser-shooting-speed':      { de: 'Laser-Schussgeschwindigkeit',  en: 'Laser Shooting Speed' },
  'weapon-shooting-speed':     { de: 'Waffenschussgeschwindigkeit',  en: 'Weapon Shooting Speed' },
  'follower-robot-count':      { de: 'Begleitroboter-Anzahl',        en: 'Follower Robot Count' },
};

// ── Nummerierte Sequenzen erkennen und als Gruppen zusammenfassen ─────────────
function buildLevelGruppen(allTechs) {
  const techMap = new Map(allTechs.map(t => [t.id, t]));
  const processed = new Set();
  const gruppen = [];

  for (const tech of allTechs) {
    if (processed.has(tech.id)) continue;
    const m = tech.id.match(/^(.+)-(\d+)$/);
    if (!m) continue;
    const [, base, numStr] = m;
    if (parseInt(numStr) !== 1) continue; // nur bei -1 starten

    // Alle konsekutiven Nachfolger sammeln
    const ids = [tech.id];
    let n = 2;
    while (techMap.has(`${base}-${n}`)) { ids.push(`${base}-${n}`); n++; }
    if (ids.length < 2) continue; // Einzeltechs (z.B. artillery-shell-damage-1) bleiben als TechNode

    for (const id of ids) processed.add(id);

    const lastTech = techMap.get(ids[ids.length - 1]);
    const isInfinite = lastTech?.is_infinite ?? false;

    const knownLabel = KNOWN_GROUP_LABELS[base];
    let label;
    if (knownLabel) {
      label = knownLabel;
    } else {
      const fname = buildTechName(tech);
      label = {
        de: fname.de.replace(/\s*\d+$/, '').trim() || formatId(base),
        en: fname.en.replace(/\s*\d+$/, '').trim() || formatId(base),
      };
    }

    gruppen.push({ id: base, label, ids, isInfinite });
  }
  return gruppen;
}

// ── Kategorie ableiten ────────────────────────────────────────────────────────
function deriveKategorie(id) {
  if (id.endsWith('-science-pack')) return 'wissenschaft';
  if (['research-productivity', 'biolab', 'effect-transmission'].includes(id)) return 'wissenschaft';
  if (id.startsWith('research-speed-')) return 'wissenschaft';

  if (id.startsWith('mining-productivity-') || id === 'electric-mining-drill' || id === 'big-mining-drill' || id === 'steel-axe') return 'bergbau';

  const militaryIds = new Set([
    'military', 'military-2', 'military-3', 'military-4', 'heavy-armor', 'power-armor', 'power-armor-mk2',
    'mech-armor', 'modular-armor', 'atomic-bomb', 'artillery', 'uranium-ammo', 'flamethrower',
    'tank', 'spidertron', 'stone-wall', 'gate', 'gun-turret', 'laser', 'laser-turret', 'rocket-turret',
    'land-mine', 'defender', 'distractor', 'destroyer', 'rocketry', 'explosive-rocketry',
    'flammables', 'railgun', 'tesla-weapons', 'battery-equipment', 'battery-mk2-equipment',
    'battery-mk3-equipment', 'energy-shield-equipment', 'energy-shield-mk2-equipment',
    'personal-laser-defense-equipment', 'belt-immunity-equipment', 'discharge-defense-equipment',
    'fission-reactor-equipment', 'exoskeleton-equipment',
  ]);
  if (militaryIds.has(id)) return 'militaer';
  if (/^(physical-projectile-damage|stronger-explosives|refined-flammables|laser-weapons-damage|electric-weapons-damage|weapon-shooting-speed|laser-shooting-speed|follower-robot-count|artillery-shell|railgun-damage|railgun-shooting)-\d+$/.test(id)) return 'militaer';

  const logisticIds = new Set([
    'logistics', 'logistics-2', 'logistics-3', 'fast-inserter', 'bulk-inserter', 'stack-inserter',
    'robotics', 'construction-robotics', 'logistic-robotics', 'logistic-system',
    'railway', 'automated-rail-transportation', 'fluid-wagon', 'automobili',
    'circuit-network', 'advanced-combinators', 'concrete', 'landfill', 'cliff-explosives',
    'lamp', 'radar', 'repair-pack', 'toolbelt', 'toolbelt-equipment',
    'personal-roboport-equipment', 'personal-roboport-mk2-equipment',
  ]);
  if (logisticIds.has(id)) return 'logistik';
  if (id.startsWith('inserter-capacity-bonus-') || id.startsWith('braking-force-') || id.startsWith('worker-robots-speed-') || id.startsWith('worker-robots-storage-')) return 'logistik';
  if (id.startsWith('transport-belt-capacity-') || id === 'turbo-transport-belt') return 'logistik';

  const energyIds = new Set([
    'nuclear-power', 'uranium-processing', 'kovarex-enrichment-process', 'nuclear-fuel-reprocessing',
    'solar-energy', 'electric-energy-distribution-1', 'electric-energy-distribution-2', 'steam-power',
    'electric-energy-accumulators', 'uranium-mining', 'fusion-reactor',
  ]);
  if (energyIds.has(id)) return 'energie';

  const electronicIds = new Set([
    'electronics', 'advanced-circuit', 'processing-unit', 'modules',
    'speed-module', 'speed-module-2', 'speed-module-3',
    'efficiency-module', 'efficiency-module-2', 'efficiency-module-3',
    'productivity-module', 'productivity-module-2', 'productivity-module-3',
    'quality-module', 'quality-module-2', 'quality-module-3',
    'electric-engine', 'engine', 'battery',
  ]);
  if (electronicIds.has(id)) return 'elektronik';

  const rocketIds = new Set([
    'rocket-silo', 'space-platform', 'rocket-fuel', 'low-density-structure',
    'oil-gathering', 'space-platform-thruster',
  ]);
  if (rocketIds.has(id)) return 'rakete';

  const prodIds = new Set([
    'automation', 'automation-2', 'automation-3', 'steel-processing',
    'oil-processing', 'advanced-oil-processing', 'coal-liquefaction',
    'plastics', 'sulfur-processing', 'explosives', 'lubricant', 'fluid-handling',
    'advanced-material-processing', 'advanced-material-processing-2',
  ]);
  if (prodIds.has(id)) return 'produktion';

  // Space Age DLC – alles was nicht oben passt
  return 'space_age';
}

// ── TECH-Array aus allen 271 gamedata.technologies ────────────────────────────
export const TECH = Object.values(gamedata.technologies).map(t => ({
  id:          t.id,
  name:        buildTechName(t),
  prerequisites: t.prerequisites ?? [],
  cost:        buildCost(t.cost),
  effects:     buildEffects(t),
  is_infinite: t.is_infinite ?? false,
  max_level:   t.max_level,
}));

export const TECH_MAP = Object.fromEntries(TECH.map(t => [t.id, t]));

// ── Level-Gruppen (nummerierte Sequenzen) ─────────────────────────────────────
export const LEVEL_GRUPPEN = buildLevelGruppen(TECH);

export const LEVEL_GRUPPE_VON_TECH = Object.fromEntries(
  LEVEL_GRUPPEN.flatMap(g => g.ids.map((id, i) => [id, { gruppe: g, index: i }]))
);

export const LEVEL_GRUPPE_NICHT_ERSTE = new Set(
  LEVEL_GRUPPEN.flatMap(g => g.ids.slice(1))
);

// ── Kategorie-Zuordnung pro Tech-ID ──────────────────────────────────────────
export const TECH_KATEGORIEN = Object.fromEntries(
  TECH.map(t => [t.id, deriveKategorie(t.id)])
);

// ── Wissenschaftspaket-Anzeige-Metadaten ─────────────────────────────────────
export const PACK_META = {
  red:        { label: 'Rot',            color: '#e53935' },
  green:      { label: 'Grün',           color: '#43a047' },
  blue:       { label: 'Blau',           color: '#1e88e5' },
  black:      { label: 'Produktion',     color: '#7b1fa2' },
  purple:     { label: 'Militär',        color: '#6d4c41' },
  yellow:     { label: 'Utility',        color: '#fdd835' },
  white:      { label: 'Raumfahrt',      color: '#e0e0e0' },
  se:         { label: 'Metallurgie',    color: '#ff7043' },
  biologisch: { label: 'Biologisch',     color: '#66bb6a' },
  em:         { label: 'Elektromagn.',   color: '#ab47bc' },
  kryogen:    { label: 'Kryogen',        color: '#4dd0e1' },
  promethium: { label: 'Promethium',     color: '#ce93d8' },
};

// ── Kategorie-Metadaten ───────────────────────────────────────────────────────
export const KATEGORIEN = {
  produktion:   { label: { de: 'Produktion',    en: 'Production' },    color: '#f59e0b', icon: '⚙️' },
  logistik:     { label: { de: 'Logistik',      en: 'Logistics' },     color: '#3b82f6', icon: '🚂' },
  elektronik:   { label: { de: 'Elektronik',    en: 'Electronics' },   color: '#8b5cf6', icon: '💡' },
  energie:      { label: { de: 'Energie',       en: 'Energy' },        color: '#eab308', icon: '⚡' },
  militaer:     { label: { de: 'Militär',       en: 'Military' },      color: '#ef4444', icon: '⚔️' },
  bergbau:      { label: { de: 'Bergbau',       en: 'Mining' },        color: '#78716c', icon: '⛏️' },
  wissenschaft: { label: { de: 'Wissenschaft',  en: 'Science' },       color: '#06b6d4', icon: '🔬' },
  rakete:       { label: { de: 'Rakete',        en: 'Rocket' },        color: '#64748b', icon: '🚀' },
  space_age:    { label: { de: 'Space Age',     en: 'Space Age' },     color: '#f97316', icon: '🌌' },
};

// ── Presets ───────────────────────────────────────────────────────────────────
export const PRESETS = {
  fruehspiel: {
    label: 'Frühspiel',
    ids: [
      'automation', 'logistics', 'electronics', 'steel-processing',
      'fluid-handling', 'oil-processing', 'electric-energy-distribution-1',
      'steam-power', 'military', 'automation-science-pack', 'logistic-science-pack',
    ],
  },
  midgame: {
    label: 'Midgame',
    ids: [
      'automation', 'logistics', 'logistics-2', 'fast-inserter',
      'electronics', 'advanced-circuit', 'steel-processing', 'fluid-handling',
      'oil-processing', 'advanced-oil-processing', 'plastics', 'sulfur-processing',
      'lubricant', 'electric-energy-distribution-1', 'electric-energy-distribution-2',
      'steam-power', 'solar-energy', 'military', 'heavy-armor',
      'automation-science-pack', 'logistic-science-pack',
      'military-science-pack', 'chemical-science-pack',
      'automation-2', 'processing-unit', 'robotics',
      'construction-robotics', 'logistic-robotics',
      'uranium-processing', 'mining-productivity-1', 'mining-productivity-2',
    ],
  },
  endgame: {
    label: 'Endgame',
    ids: [
      'automation', 'logistics', 'logistics-2', 'logistics-3', 'fast-inserter', 'bulk-inserter',
      'electronics', 'advanced-circuit', 'processing-unit',
      'steel-processing', 'fluid-handling', 'oil-processing', 'advanced-oil-processing',
      'coal-liquefaction', 'plastics', 'sulfur-processing', 'explosives', 'lubricant',
      'electric-energy-distribution-1', 'electric-energy-distribution-2',
      'steam-power', 'solar-energy', 'military', 'heavy-armor',
      'automation-science-pack', 'logistic-science-pack', 'military-science-pack',
      'chemical-science-pack', 'production-science-pack', 'utility-science-pack', 'space-science-pack',
      'automation-2', 'automation-3', 'robotics', 'construction-robotics', 'logistic-robotics',
      'speed-module', 'speed-module-2', 'speed-module-3',
      'efficiency-module', 'efficiency-module-2', 'efficiency-module-3',
      'productivity-module', 'productivity-module-2', 'productivity-module-3',
      'uranium-processing', 'kovarex-enrichment-process', 'nuclear-power',
      'mining-productivity-1', 'mining-productivity-2', 'mining-productivity-3', 'mining-productivity-4',
      'rocket-silo', 'space-platform',
    ],
  },
  spaceAge: {
    label: 'Space Age komplett',
    ids: [
      'automation', 'logistics', 'logistics-2', 'logistics-3', 'fast-inserter', 'bulk-inserter',
      'electronics', 'advanced-circuit', 'processing-unit',
      'steel-processing', 'fluid-handling', 'oil-processing', 'advanced-oil-processing',
      'coal-liquefaction', 'plastics', 'sulfur-processing', 'explosives', 'lubricant',
      'electric-energy-distribution-1', 'electric-energy-distribution-2',
      'steam-power', 'solar-energy', 'military', 'heavy-armor',
      'automation-science-pack', 'logistic-science-pack', 'military-science-pack',
      'chemical-science-pack', 'production-science-pack', 'utility-science-pack', 'space-science-pack',
      'automation-2', 'automation-3', 'robotics', 'construction-robotics', 'logistic-robotics',
      'speed-module', 'speed-module-2', 'speed-module-3',
      'efficiency-module', 'efficiency-module-2', 'efficiency-module-3',
      'productivity-module', 'productivity-module-2', 'productivity-module-3',
      'uranium-processing', 'kovarex-enrichment-process', 'nuclear-power',
      'mining-productivity-1', 'mining-productivity-2', 'mining-productivity-3', 'mining-productivity-4',
      'rocket-silo', 'space-platform',
      'metallurgic-science-pack', 'foundry', 'tungsten-carbide', 'tungsten-steel', 'electromagnetic-plant',
      'agricultural-science-pack', 'biochamber', 'bioflux', 'carbon-fiber',
      'cryogenic-science-pack', 'cryogenic-plant', 'holmium-processing', 'quantum-processor',
      'promethium-science-pack',
    ],
  },
};
