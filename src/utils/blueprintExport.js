/**
 * Factorio Blueprint Export
 * Converts the ReactFlow factory layout to the Factorio Blueprint String format.
 * Format: '0' + base64(zlib(JSON))
 * See: https://wiki.factorio.com/Blueprint_string_format
 */

// Maps our internal machine type IDs → Factorio entity prototype names
const FACTORIO_ENTITY_NAME = {
  assembler:     'assembling-machine-2',
  schmelzofen:   'electric-furnace',
  chemieanlage:  'chemical-plant',
  oelraffinerie: 'oil-refinery',
  zentrifuge:    'centrifuge',
  hochofen:      'foundry',
  'em-anlage':   'electromagnetic-plant',
  biokammer:     'biochamber',
  kryogenanlage: 'cryogenic-plant',
  bergbau:       'electric-mining-drill',
  raumplattform: 'space-platform-hub',
  recycler:      'recycler',
  crusher:       'crusher',
};

// Tile footprint (square side length) per Factorio entity name
const MACHINE_TILE_SIZE = {
  'assembling-machine-2':  3,
  'electric-furnace':      3,
  'chemical-plant':        3,
  'oil-refinery':          5,
  'centrifuge':            3,
  'foundry':               4,
  'electromagnetic-plant': 5,
  'biochamber':            3,
  'cryogenic-plant':       5,
  'electric-mining-drill': 3,
  'space-platform-hub':    7,
  'recycler':              5,
  'crusher':               3,
};

// ReactFlow pixel → Factorio tile conversion factor
const PIXELS_PER_TILE = 55;

// Gap (in tiles) between expanded machines of the same node
const EXPAND_GAP = 1;

/**
 * Convert an English item name to a Factorio recipe/item prototype ID.
 * "Iron Plate" → "iron-plate"
 */
function nameToFactorioId(nameEn) {
  if (!nameEn) return null;
  return nameEn
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Build a Factorio blueprint object from ReactFlow nodes.
 * Each node is expanded into `node.data.anzahl` individual entities,
 * placed in a horizontal row starting at the node's canvas position.
 *
 * @param {Array}  nodes - ReactFlow node array
 * @param {string} label - Blueprint label shown in-game
 * @returns {object} Factorio blueprint JSON object (not yet encoded)
 */
export function buildBlueprint(nodes, label = 'Factory Planner') {
  const entities = [];
  let entityNum = 1;

  for (const node of nodes) {
    const factorioName = FACTORIO_ENTITY_NAME[node.data?.maschine];
    if (!factorioName) continue;

    const tileSize   = MACHINE_TILE_SIZE[factorioName] ?? 3;
    const halfSize   = tileSize / 2;
    const step       = tileSize + EXPAND_GAP;

    const baseX = node.position.x / PIXELS_PER_TILE;
    const baseY = node.position.y / PIXELS_PER_TILE;

    const count  = Math.max(1, Math.round(node.data.anzahl ?? 1));
    const recipe = node.data.maschine !== 'bergbau'
      ? nameToFactorioId(node.data.nameEn)
      : null;

    for (let i = 0; i < count; i++) {
      const entity = {
        entity_number: entityNum++,
        name: factorioName,
        position: {
          x: round2(baseX + halfSize + i * step),
          y: round2(baseY + halfSize),
        },
      };
      if (recipe) entity.recipe = recipe;
      entities.push(entity);
    }
  }

  // Use the most common machine type as the blueprint icon
  const freq = {};
  nodes.forEach(n => {
    const fn = FACTORIO_ENTITY_NAME[n.data?.maschine];
    if (fn) freq[fn] = (freq[fn] ?? 0) + 1;
  });
  const topEntity = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? 'assembling-machine-2';

  return {
    blueprint: {
      item: 'blueprint',
      label,
      entities,
      icons: [{ signal: { type: 'item', name: topEntity }, index: 1 }],
      version: 562949953421312, // Factorio 2.0.0.0
    },
  };
}

/**
 * Encode a blueprint object to the Factorio Blueprint String format.
 * '0' + base64( zlib-deflate( JSON ) )
 *
 * Uses the browser's native CompressionStream (supported in all modern browsers).
 *
 * @param {object} blueprintObj
 * @returns {Promise<string>} e.g. "0eNq..."
 */
export async function encodeBlueprintString(blueprintObj) {
  const json = JSON.stringify(blueprintObj);
  const raw  = new TextEncoder().encode(json);

  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  writer.write(raw);
  writer.close();

  const compressed = await new Response(cs.readable).arrayBuffer();
  const bytes = new Uint8Array(compressed);

  // Convert to base64
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return '0' + btoa(binary);
}

/**
 * Build a shareable JSON representation of the current canvas layout.
 *
 * @param {Array} nodes
 * @param {Array} edges
 * @returns {string} Formatted JSON string
 */
export function buildLayoutJSON(nodes, edges) {
  const data = {
    version: '1.0',
    exported: new Date().toISOString(),
    nodes: nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: n.data,
    })),
    connections: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      beltType: e.data?.beltId ?? null,
    })),
  };
  return JSON.stringify(data, null, 2);
}

// ── helpers ────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}
