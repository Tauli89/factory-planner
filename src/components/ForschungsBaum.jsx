import { Component, useMemo, useCallback, memo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import {
  TECH,
  TECH_MAP,
  PRESETS,
  LEVEL_GRUPPE_VON_TECH,
  LEVEL_GRUPPE_NICHT_ERSTE,
  KATEGORIEN,
  TECH_KATEGORIEN,
} from '../data/research';
import gamedata from '../data/gamedata.json';
import Icon from './Icon';
import { useForschung } from '../context/ForschungContext';
import { useSprache } from '../context/SprachContext';

class BaumFehlerGrenze extends Component {
  state = { fehler: null };
  static getDerivedStateFromError(e) { return { fehler: e }; }
  render() {
    if (this.state.fehler) {
      return (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm p-8">
          <div className="text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <div className="font-semibold mb-1">Fehler im Forschungsbaum</div>
            <div className="text-gray-500 text-xs mb-4">{this.state.fehler.message}</div>
            <button
              onClick={() => this.setState({ fehler: null })}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const IMMER_SICHTBAR = new Set(['automation-science-pack', 'steam-power', 'military']);

// ── Layout-Konstanten ─────────────────────────────────────────────────────────
const KARTE_B     = 260;
const KARTE_H     = 90;
const KARTE_H_LVL = 110;
const ABSTAND_X   = 130;  // horizontaler Abstand zwischen Karten in einer Tier-Ebene
const ABSTAND_Y   = 180;  // vertikaler Abstand zwischen Tier-Ebenen

// Science-Pack Kurzschlüssel → vollständige Item-ID (für Icon-Komponente)
const PACK_KEY_TO_ITEM_ID = {
  red:        'automation-science-pack',
  green:      'logistic-science-pack',
  blue:       'chemical-science-pack',
  black:      'production-science-pack',
  purple:     'military-science-pack',
  yellow:     'utility-science-pack',
  white:      'space-science-pack',
  se:         'metallurgic-science-pack',
  biologisch: 'agricultural-science-pack',
  em:         'electromagnetic-science-pack',
  kryogen:    'cryogenic-science-pack',
  promethium: 'promethium-science-pack',
};

const _TECH_MIT_NACHFOLGER = new Set(TECH.flatMap(t => t.prerequisites));

// Nicht-erste Gruppen-Mitglieder und Orphans ausblenden
const TECH_LAYOUT = TECH.filter(t =>
  !LEVEL_GRUPPE_NICHT_ERSTE.has(t.id) &&
  (t.prerequisites.length > 0 || _TECH_MIT_NACHFOLGER.has(t.id))
);
const TECH_LAYOUT_MAP = Object.fromEntries(TECH_LAYOUT.map(t => [t.id, t]));

function berechnePositionen() {
  const nachfolger = {};
  for (const t of TECH_LAYOUT) nachfolger[t.id] = [];
  for (const t of TECH_LAYOUT) {
    for (const pre of t.prerequisites) {
      if (TECH_LAYOUT_MAP[pre]) nachfolger[pre].push(t.id);
    }
  }

  const tiefe = {};
  const rootIds = TECH_LAYOUT
    .filter(t => t.prerequisites.every(p => !TECH_LAYOUT_MAP[p]))
    .map(t => t.id);
  for (const id of rootIds) tiefe[id] = 0;

  const besucht = new Set();
  let queue = [...rootIds];
  while (queue.length) {
    const next = [];
    for (const id of queue) {
      if (besucht.has(id)) continue;
      besucht.add(id);
      for (const nf of nachfolger[id]) {
        tiefe[nf] = Math.max(tiefe[nf] ?? 0, (tiefe[id] ?? 0) + 1);
        next.push(nf);
      }
    }
    queue = next;
  }

  const ebenen = {};
  for (const t of TECH_LAYOUT) {
    const e = tiefe[t.id] ?? 0;
    if (!ebenen[e]) ebenen[e] = [];
    ebenen[e].push(t.id);
  }

  const maxProEbene = Math.max(...Object.values(ebenen).map(ids => ids.length));

  const pos = {};
  for (const [e, ids] of Object.entries(ebenen)) {
    const offsetX = ((maxProEbene - ids.length) / 2) * ABSTAND_X;
    ids.forEach((id, i) => {
      pos[id] = {
        x: offsetX + i * ABSTAND_X,
        y: parseInt(e) * ABSTAND_Y,
      };
    });
  }
  return pos;
}

const HANDLE_STYLE = { background: 'transparent', border: 'none', width: 0, height: 0 };

function hoverBorder(color) {
  const map = { '#5dbf3c': '#7ddf5c', '#f0b070': '#ffd090', '#5a5a5a': '#7a7a7a', '#f59e0b': '#f0b070' };
  return map[color] ?? color;
}

// ── TechNode ──────────────────────────────────────────────────────────────────
function TechTooltip({ tech, sprache }) {
  const gd         = gamedata.technologies[tech.id];
  const prereqs    = gd?.prerequisites ?? [];
  const unlocks    = gd?.unlocks_recipes ?? [];

  const prereqNames = prereqs.map(id => {
    const t = gamedata.technologies[id];
    return t?.name?.[sprache] ?? t?.name?.en ?? id;
  });

  return (
    <div style={{
      position: 'absolute',
      left: KARTE_B + 10,
      top: 0,
      width: 220,
      background: '#252525',
      border: '1px solid #5a5a5a',
      borderRadius: 6,
      padding: '10px 12px',
      zIndex: 9999,
      pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0b070', marginBottom: 6 }}>
        {tech.name[sprache] ?? tech.name.de}
      </div>
      {prereqNames.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 10, color: '#8a8278', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            {sprache === 'de' ? 'Voraussetzungen' : 'Prerequisites'}
          </div>
          {prereqNames.map((n, i) => (
            <div key={i} style={{ fontSize: 11, color: '#c8b898' }}>· {n}</div>
          ))}
        </div>
      )}
      {unlocks.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#8a8278', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            {sprache === 'de' ? 'Schaltet frei' : 'Unlocks'} ({unlocks.length})
          </div>
          {unlocks.slice(0, 5).map((id, i) => {
            const r = gamedata.recipes?.[id];
            const name = r?.name?.[sprache] ?? r?.name?.en ?? id;
            return (
              <div key={i} style={{ fontSize: 11, color: '#c8b898', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon id={id} type="items" size={14} />
                {name}
              </div>
            );
          })}
          {unlocks.length > 5 && (
            <div style={{ fontSize: 10, color: '#706860' }}>
              +{unlocks.length - 5} {sprache === 'de' ? 'weitere' : 'more'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TechNode = memo(({ data }) => {
  const { tech, istErforscht, depsFehlen, onToggle, sprache, dimmed, highlighted } = data;
  const [hovered, setHovered] = useState(false);

  const borderColor = highlighted
    ? '#f0b070'
    : istErforscht
    ? '#5dbf3c'
    : depsFehlen
    ? '#5a5a5a'
    : '#c8903c';

  const costEntries = Object.entries(tech.cost).filter(([, v]) => v > 0 || v === '∞');
  const techTime    = gamedata.technologies[tech.id]?.cost?.time;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onToggle(tech.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: KARTE_B,
        height: KARTE_H,
        background: hovered && !dimmed ? '#2a2a2a' : '#1e1e1e',
        border: `2px solid ${hovered && !dimmed ? hoverBorder(borderColor) : borderColor}`,
        borderRadius: 6,
        padding: 8,
        opacity: dimmed ? 0.15 : 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxSizing: 'border-box',
        boxShadow: istErforscht ? '0 0 12px rgba(93,191,60,0.3)' : 'none',
        transition: 'background 0.12s, border-color 0.12s, opacity 0.2s',
        userSelect: 'none',
        pointerEvents: 'all',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <Icon id={tech.id} type="technologies" size={48} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          title={tech.name[sprache] ?? tech.name.de}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#e8d8b0',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tech.name[sprache] ?? tech.name.de}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
          {costEntries.map(([pack, count]) => (
            <span key={pack} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Icon id={PACK_KEY_TO_ITEM_ID[pack] ?? pack} type="items" size={18} />
              <span style={{ fontSize: 10, color: '#8a8278' }}>×{count}</span>
            </span>
          ))}
          {techTime != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
              <span style={{ fontSize: 10, color: '#706860' }}>⏱</span>
              <span style={{ fontSize: 10, color: '#706860' }}>{techTime}s</span>
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
      {hovered && !dimmed && <TechTooltip tech={tech} sprache={sprache} />}
    </div>
  );
});

// ── LevelNode ─────────────────────────────────────────────────────────────────
const LevelNode = memo(({ data }) => {
  const { gruppe, aktuellesLevel, onSetzeLevel, sprache, dimmed, highlighted, techId } = data;
  const maxDiscrete = gruppe.ids.length;
  const isInfinite  = gruppe.isInfinite ?? false;
  const name        = gruppe.label[sprache] ?? gruppe.label.de;
  const maxDisplay  = isInfinite ? '∞' : maxDiscrete;
  const aktiv       = aktuellesLevel > 0;

  const borderColor = highlighted ? '#f0b070' : aktiv ? '#5dbf3c' : '#5a5a5a';

  const firstTech   = TECH_MAP[gruppe.ids[0]];
  const costEntries = firstTech
    ? Object.entries(firstTech.cost).filter(([, v]) => v > 0 || v === '∞')
    : [];
  const techTime    = gamedata.technologies[gruppe.ids[0]]?.cost?.time;

  const btnStyle = (disabled) => ({
    width: 20,
    height: 20,
    background: '#363636',
    border: '1px solid #5a5a5a',
    borderRadius: 3,
    color: '#c8b898',
    fontSize: 14,
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <div
      style={{
        width: KARTE_B,
        height: KARTE_H_LVL,
        background: '#1e1e1e',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        padding: 8,
        opacity: dimmed ? 0.15 : 1,
        cursor: 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxSizing: 'border-box',
        boxShadow: aktiv ? '0 0 12px rgba(93,191,60,0.3)' : 'none',
        transition: 'opacity 0.2s',
        userSelect: 'none',
        pointerEvents: 'all',
      }}
    >
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <Icon id={techId} type="technologies" size={48} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          title={name}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#e8d8b0',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
          {costEntries.map(([pack, count]) => (
            <span key={pack} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Icon id={PACK_KEY_TO_ITEM_ID[pack] ?? pack} type="items" size={18} />
              <span style={{ fontSize: 10, color: '#8a8278' }}>×{count}</span>
            </span>
          ))}
          {techTime != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
              <span style={{ fontSize: 10, color: '#706860' }}>⏱</span>
              <span style={{ fontSize: 10, color: '#706860' }}>{techTime}s</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onSetzeLevel(gruppe, Math.max(0, aktuellesLevel - 1)); }}
            disabled={aktuellesLevel === 0}
            style={btnStyle(aktuellesLevel === 0)}
          >−</button>
          <span style={{
            fontSize: 11,
            color: aktiv ? '#f0b070' : '#706860',
            flex: 1,
            textAlign: 'center',
            fontWeight: 600,
          }}>
            {sprache === 'de' ? `Stufe ${aktuellesLevel}` : `Lvl ${aktuellesLevel}`} / {maxDisplay}
          </span>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onSetzeLevel(gruppe, aktuellesLevel + 1); }}
            disabled={!isInfinite && aktuellesLevel >= maxDiscrete}
            style={btnStyle(!isInfinite && aktuellesLevel >= maxDiscrete)}
          >+</button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
    </div>
  );
});

const nodeTypes = { techNode: TechNode, levelNode: LevelNode };

const POSITIONEN = berechnePositionen();

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function ForschungsBaum() {
  const { erforscht, infiniteLevels, toggle, setzePreset, allesZuruecksetzen, setzeLevel, boni } = useForschung();
  const { sprache } = useSprache();
  const [suchbegriff, setSuchbegriff] = useState('');
  const [aktivKategorie, setAktivKategorie] = useState(null);

  const handleToggle     = useCallback((id)           => toggle(id),            [toggle]);
  const handleSetzeLevel = useCallback((gruppe, level) => setzeLevel(gruppe, level), [setzeLevel]);

  const sucheAktiv = suchbegriff.trim() !== '';

  const gefilterteTech = useMemo(() => {
    const hatSuche     = suchbegriff.trim() !== '';
    const hatKategorie = aktivKategorie !== null;
    if (!hatSuche && !hatKategorie) return null;

    const s = suchbegriff.toLowerCase();
    return new Set(
      TECH_LAYOUT
        .filter(t => {
          const matchesSuche     = !hatSuche     || t.name.de?.toLowerCase().includes(s) || t.name.en?.toLowerCase().includes(s);
          const matchesKategorie = !hatKategorie || TECH_KATEGORIEN[t.id] === aktivKategorie;
          return matchesSuche && matchesKategorie;
        })
        .map(t => t.id)
    );
  }, [suchbegriff, aktivKategorie]);

  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    for (const tech of TECH_LAYOUT) {
      const pos = POSITIONEN[tech.id];
      if (!pos) continue;

      const dimmed      = gefilterteTech !== null && !gefilterteTech.has(tech.id);
      const highlighted = sucheAktiv && gefilterteTech !== null && gefilterteTech.has(tech.id);
      const gruppenInfo = LEVEL_GRUPPE_VON_TECH[tech.id];

      if (gruppenInfo && gruppenInfo.index === 0) {
        const gruppe = gruppenInfo.gruppe;
        let aktuellesDiscreteLevel = 0;
        for (const id of gruppe.ids) {
          if (erforscht.has(id)) aktuellesDiscreteLevel++;
          else break;
        }
        const extraLevel     = infiniteLevels.get(gruppe.id) ?? 0;
        const aktuellesLevel = aktuellesDiscreteLevel + extraLevel;

        nodes.push({
          id: tech.id,
          type: 'levelNode',
          position: pos,
          data: { gruppe, aktuellesLevel, onSetzeLevel: handleSetzeLevel, sprache, dimmed, highlighted, techId: tech.id },
        });
      } else {
        const istErforscht = erforscht.has(tech.id);
        const depsFehlen   = tech.prerequisites.some(p => !erforscht.has(p));
        nodes.push({
          id: tech.id,
          type: 'techNode',
          position: pos,
          data: { tech, istErforscht, depsFehlen, onToggle: handleToggle, sprache, dimmed, highlighted },
        });
      }

      for (const preId of tech.prerequisites) {
        if (!TECH_LAYOUT_MAP[preId]) continue;
        const beideErforscht  = erforscht.has(preId) && erforscht.has(tech.id);
        const sourceErforscht = erforscht.has(preId);
        edges.push({
          id: `${preId}->${tech.id}`,
          source: preId,
          target: tech.id,
          type: 'smoothstep',
          animated: beideErforscht,
          style: {
            stroke: beideErforscht ? '#5dbf3c' : sourceErforscht ? '#f0b070' : '#4a4a4a',
            strokeWidth: beideErforscht ? 2.5 : 1.5,
            opacity: beideErforscht ? 1 : 0.45,
          },
        });
      }
    }

    return { nodes, edges };
  }, [erforscht, infiniteLevels, sprache, gefilterteTech, sucheAktiv, handleToggle, handleSetzeLevel]);

  // Summe aller Stufen: Level-Gruppen zählen als aktuellesLevel, reguläre Techs als 0 oder 1
  const anzahlErforscht = useMemo(() => {
    let summe = 0;
    for (const tech of TECH_LAYOUT) {
      if (IMMER_SICHTBAR.has(tech.id)) continue;
      const gruppenInfo = LEVEL_GRUPPE_VON_TECH[tech.id];
      if (gruppenInfo && gruppenInfo.index === 0) {
        let level = 0;
        for (const id of gruppenInfo.gruppe.ids) {
          if (erforscht.has(id)) level++;
          else break;
        }
        summe += level + (infiniteLevels.get(gruppenInfo.gruppe.id) ?? 0);
      } else if (!gruppenInfo) {
        if (erforscht.has(tech.id)) summe++;
      }
    }
    return summe;
  }, [erforscht, infiniteLevels]);
  const anzahlGesamt = TECH_LAYOUT.length;

  const suchPlaceholder = sprache === 'de' ? 'Technologie suchen…' : 'Search technology…';
  const allesReset      = sprache === 'de' ? 'Alles zurücksetzen' : 'Reset all';
  const erforschtLabel  = sprache === 'de' ? 'erforscht' : 'researched';
  const alleLabel       = sprache === 'de' ? 'Alle' : 'All';
  const treffer         = gefilterteTech?.size ?? null;

  return (
    <div className="flex flex-col gap-2 h-full">

      {/* ── Toolbar Zeile 1 ── */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setzePreset(key)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-amber-600/80 text-gray-300 hover:text-white text-xs font-medium transition-colors border border-gray-700 hover:border-amber-500"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={allesZuruecksetzen}
            className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-800/80 text-red-400 hover:text-red-200 text-xs font-medium transition-colors border border-red-900/60"
          >
            {allesReset}
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={suchPlaceholder}
            value={suchbegriff}
            onChange={e => setSuchbegriff(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white rounded-lg pl-3 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 w-48"
          />
          {suchbegriff && (
            <button
              onClick={() => setSuchbegriff('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs leading-none"
            >✕</button>
          )}
        </div>

        {treffer !== null && (
          <span className="text-xs text-amber-400">
            {treffer} {sprache === 'de' ? 'Treffer' : 'matches'}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
          <span>
            <span className="text-green-400 font-bold">{anzahlErforscht}</span>
            <span className="text-gray-600"> / {anzahlGesamt} {erforschtLabel}</span>
          </span>
          {boni.miningBonus > 0 && (
            <span className="text-amber-300 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-700/40">
              ⛏ +{(boni.miningBonus * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* ── Toolbar Zeile 2: Kategorien-Filter ── */}
      <div className="flex-shrink-0 flex flex-wrap gap-1.5 items-center">
        <button
          onClick={() => setAktivKategorie(null)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
            aktivKategorie === null
              ? 'bg-gray-600 text-white border-gray-400'
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          {alleLabel}
        </button>
        {Object.entries(KATEGORIEN).map(([key, kat]) => {
          const aktiv = aktivKategorie === key;
          return (
            <button
              key={key}
              onClick={() => setAktivKategorie(aktiv ? null : key)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all border"
              style={aktiv
                ? { background: kat.color, borderColor: kat.color, color: '#fff' }
                : { background: 'transparent', borderColor: '#4a4a4a', color: '#8a8278' }
              }
              onMouseEnter={e => { if (!aktiv) e.currentTarget.style.borderColor = kat.color; }}
              onMouseLeave={e => { if (!aktiv) e.currentTarget.style.borderColor = '#4a4a4a'; }}
            >
              {kat.icon} {kat.label[sprache]}
            </button>
          );
        })}
      </div>

      {/* ── Flow-Canvas ── */}
      <BaumFehlerGrenze>
        <div className="flex-1 min-h-0 rounded-xl border border-gray-700/80 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
            minZoom={0.05}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            style={{ background: '#111111' }}
          >
            <Background variant={BackgroundVariant.Dots} color="#333333" gap={24} size={1.2} />
            <Controls className="rf-controls-dark" showInteractive={false} />
          </ReactFlow>
        </div>
      </BaumFehlerGrenze>

      {/* ── Legende ── */}
      <div className="flex-shrink-0 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span style={{ width: 12, height: 12, borderRadius: 2, border: '2px solid #5dbf3c', background: '#1e1e1e', display: 'inline-block' }} />
          {sprache === 'de' ? 'Erforscht' : 'Researched'}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 12, height: 12, borderRadius: 2, border: '2px solid #c8903c', background: '#1e1e1e', display: 'inline-block' }} />
          {sprache === 'de' ? 'Verfügbar' : 'Available'}
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 12, height: 12, borderRadius: 2, border: '2px solid #5a5a5a', background: '#1e1e1e', display: 'inline-block', opacity: 0.6 }} />
          {sprache === 'de' ? 'Gesperrt' : 'Locked'}
        </span>
        <span className="text-gray-700 ml-1">
          {sprache === 'de' ? 'Scrollen = Zoom · Ziehen = Pan · Klick = Erforschen/Sperren' : 'Scroll = Zoom · Drag = Pan · Click = Research/Lock'}
        </span>
      </div>
    </div>
  );
}
