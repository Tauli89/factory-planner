import { useMemo, useRef, useEffect, useState } from 'react';
import { sankey as createSankey, sankeyLinkHorizontal } from 'd3-sankey';
import { REZEPTE_MAP } from '../data/recipes';
import { getItemName } from '../data/gamedata-adapter';
import Icon from './Icon';
import { useSprache } from '../context/SprachContext';

// ── Texts ─────────────────────────────────────────────────────────────────────

const TX = {
  de: {
    keinProdukt:     'Wähle ein Produkt, um den Flow anzuzeigen.',
    zielprodukt:     'Zielprodukt',
    zwischenprodukt: 'Zwischenprodukt',
    rohstoff:        'Rohstoff',
    proMin:          '/min',
  },
  en: {
    keinProdukt:     'Select a product to display the flow.',
    zielprodukt:     'Target',
    zwischenprodukt: 'Intermediate',
    rohstoff:        'Raw material',
    proMin:          '/min',
  },
};

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_W   = 14;
const NODE_PAD = 14;
const ICON_SZ  = 14;
const LBL_GAP  = 6;
const LEFT_PAD = 134;
const RIGHT_PAD= 134;
const V_PAD    = 12;

const linkPath = sankeyLinkHorizontal();

// ── Helpers ───────────────────────────────────────────────────────────────────

function nodeColor(node) {
  if (node.istZiel)     return '#22c55e'; // green
  if (node.istRohstoff) return '#9ca3af'; // gray
  return '#f97316';                       // orange (intermediate)
}

function fmtRate(r) {
  if (r >= 1000) return r.toFixed(0);
  if (r >= 10)   return r.toFixed(1);
  return r.toFixed(2);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FlowDiagramm({
  combined = {},
  perItem  = [],
  ignorierteItems = new Set(),
}) {
  const { sprache }          = useSprache();
  const tx                   = TX[sprache];
  const containerRef         = useRef(null);
  const [cw, setCw]          = useState(760);
  const [tooltip, setTooltip]= useState(null);

  // Responsive width tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 80) setCw(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zielIds = useMemo(
    () => new Set(perItem.map(p => p.id).filter(Boolean)),
    [perItem],
  );

  // Build and lay out the Sankey graph
  const graph = useMemo(() => {
    const ids = Object.keys(combined);
    if (!ids.length) return null;

    // Build raw links from recipe ingredients
    const idxMap = new Map(ids.map((id, i) => [id, i]));
    const rawLinks = [];

    for (const id of ids) {
      const rezept = REZEPTE_MAP[id];
      if (!rezept || rezept.zeit === 0 || ignorierteItems.has(id)) continue;
      const rate = combined[id];
      for (const zutat of rezept.zutaten) {
        if (!idxMap.has(zutat.id)) continue;
        const val = (zutat.menge / rezept.ergibt) * rate * 60;
        if (val > 0) rawLinks.push({ srcId: zutat.id, tgtId: id, value: val });
      }
    }
    if (!rawLinks.length) return null;

    // Keep only nodes that appear in at least one link
    const usedIds = new Set(rawLinks.flatMap(l => [l.srcId, l.tgtId]));
    const nodes = ids
      .filter(id => usedIds.has(id))
      .map(id => {
        const rezept = REZEPTE_MAP[id];
        const istRohstoff = !rezept || rezept.zeit === 0 || ignorierteItems.has(id);
        return {
          id,
          name: sprache === 'de'
            ? (rezept?.name   ?? getItemName(id, 'de'))
            : (rezept?.nameEn ?? getItemName(id, 'en')),
          istRohstoff,
          istZiel:    zielIds.has(id),
          rateProMin: combined[id] * 60,
        };
      });

    const nodeIdx = new Map(nodes.map((n, i) => [n.id, i]));
    const links = rawLinks
      .filter(l => nodeIdx.has(l.srcId) && nodeIdx.has(l.tgtId))
      .map(l => ({
        source: nodeIdx.get(l.srcId),
        target: nodeIdx.get(l.tgtId),
        value:  l.value,
      }));

    const innerW = Math.max(180, cw - LEFT_PAD - RIGHT_PAD);
    const innerH = Math.max(280, nodes.length * 46 + V_PAD * 2);

    try {
      const layout = createSankey()
        .nodeWidth(NODE_W)
        .nodePadding(NODE_PAD)
        .extent([[0, V_PAD], [innerW, innerH - V_PAD]]);

      const { nodes: sn, links: sl } = layout({
        nodes: nodes.map(d => ({ ...d })),
        links,
      });
      return { nodes: sn, links: sl, innerW, innerH };
    } catch {
      return null;
    }
  }, [combined, ignorierteItems, zielIds, sprache, cw]);

  // ── Empty state ─────────────────────────────────────────────────────────────

  const hasData = Object.keys(combined).length > 0;
  if (!hasData || !graph) {
    return (
      <div ref={containerRef} className="flex items-center justify-center h-40 text-gray-500 text-sm">
        {tx.keinProdukt}
      </div>
    );
  }

  const svgW = graph.innerW + LEFT_PAD + RIGHT_PAD;
  const svgH = graph.innerH;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-auto rounded-lg border border-gray-700 bg-gray-950"
    >
      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block', maxWidth: '100%' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <g transform={`translate(${LEFT_PAD},0)`}>

          {/* ── Flow links ──────────────────────────────────────────── */}
          {graph.links.map((link, i) => (
            <path
              key={i}
              d={linkPath(link)}
              fill="none"
              stroke={nodeColor(link.source)}
              strokeWidth={Math.max(1, link.width ?? 1)}
              strokeOpacity={0.28}
            />
          ))}

          {/* ── Nodes ───────────────────────────────────────────────── */}
          {graph.nodes.map(node => {
            const color   = nodeColor(node);
            const midY    = (node.y0 + node.y1) / 2;
            const nodeH   = Math.max(1, node.y1 - node.y0);
            const onRight = node.x0 > graph.innerW / 2;

            // Icon and label position
            const iconX  = onRight
              ? node.x0 - LBL_GAP - ICON_SZ
              : node.x1 + LBL_GAP;
            const textX  = onRight
              ? node.x0 - LBL_GAP - ICON_SZ - 3
              : node.x1 + LBL_GAP + ICON_SZ + 3;
            const anchor = onRight ? 'end' : 'start';

            return (
              <g
                key={node.id}
                onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, node })}
                onMouseMove={e  => setTooltip({ x: e.clientX, y: e.clientY, node })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}
              >
                {/* Colored node bar */}
                <rect
                  x={node.x0} y={node.y0}
                  width={NODE_W} height={nodeH}
                  fill={color} rx={2}
                />

                {/* Item icon */}
                <foreignObject
                  x={iconX}
                  y={midY - ICON_SZ / 2}
                  width={ICON_SZ}
                  height={ICON_SZ}
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                  <div style={{ width: ICON_SZ, height: ICON_SZ, lineHeight: 0 }}>
                    <Icon id={node.id} size={ICON_SZ} />
                  </div>
                </foreignObject>

                {/* Item name */}
                <text
                  x={textX} y={midY - 5}
                  textAnchor={anchor}
                  fontSize={11} fill="#e5e7eb"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name}
                </text>

                {/* Rate per minute */}
                <text
                  x={textX} y={midY + 8}
                  textAnchor={anchor}
                  fontSize={10} fill={color}
                  style={{ pointerEvents: 'none' }}
                >
                  {fmtRate(node.rateProMin)}{tx.proMin}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Hover tooltip ───────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl text-xs"
          style={{
            left: tooltip.x + 14,
            top:  tooltip.y,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Icon id={tooltip.node.id} size={14} />
            <span className="text-white font-semibold">{tooltip.node.name}</span>
          </div>
          <div className="text-green-400 font-bold tabular-nums">
            {tooltip.node.rateProMin.toFixed(2)}{tx.proMin}
          </div>
          <div className="text-gray-400 mt-0.5">
            {tooltip.node.istZiel
              ? tx.zielprodukt
              : tooltip.node.istRohstoff
                ? tx.rohstoff
                : tx.zwischenprodukt}
          </div>
        </div>
      )}
    </div>
  );
}
