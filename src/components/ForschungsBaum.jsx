import { Component, useMemo, useCallback, memo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import { TECH, PACK_META, PRESETS, LEVEL_GRUPPE_VON_TECH, LEVEL_GRUPPE_NICHT_ERSTE } from '../data/research';
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

// ── Layout constants ──────────────────────────────────────────────────────────
const KARTE_B = 196;
const KARTE_H = 92;
const ABSTAND_X = 230; // horizontal: distance between tech tiers
const ABSTAND_Y = 108; // vertical: distance between techs within a tier

// Only show one card per level-group (the "first" member)
const TECH_LAYOUT = TECH.filter(t => !LEVEL_GRUPPE_NICHT_ERSTE.has(t.id));
const TECH_LAYOUT_MAP = Object.fromEntries(TECH_LAYOUT.map(t => [t.id, t]));

// Compute horizontal positions: tier → x axis, row within tier → y axis
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

  const pos = {};
  for (const [e, ids] of Object.entries(ebenen)) {
    ids.forEach((id, i) => {
      // Horizontal layout: tier → x, position in tier → y
      pos[id] = { x: parseInt(e) * ABSTAND_X, y: i * ABSTAND_Y };
    });
  }
  return pos;
}

// ── Shared sub-component ──────────────────────────────────────────────────────
function PaketDots({ cost }) {
  const eintraege = Object.entries(cost).filter(([, v]) => v > 0);
  if (eintraege.length === 0) return <span className="text-gray-600" style={{ fontSize: 9 }}>—</span>;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {eintraege.map(([pack, count]) => {
        const meta = PACK_META[pack];
        return (
          <span key={pack} title={`${meta?.label ?? pack}: ${count}`} className="inline-flex items-center gap-0.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-black/30 flex-shrink-0"
              style={{ background: meta?.color ?? '#888' }}
            />
            <span className="text-gray-400" style={{ fontSize: 9 }}>{count}</span>
          </span>
        );
      })}
    </div>
  );
}

// ── Custom node: regular technology ──────────────────────────────────────────
const TechNode = memo(({ data }) => {
  const { tech, istErforscht, depsFehlen, onToggle, sprache, dimmed } = data;

  let cardClass = 'bg-gray-800 border-gray-600 hover:border-amber-500';
  let iconClass = 'bg-gray-700';
  let nameClass = 'text-white';
  let glow = '';

  if (istErforscht) {
    cardClass = 'bg-green-950 border-green-500';
    iconClass = 'bg-green-800';
    nameClass = 'text-green-300';
    glow = '0 0 14px rgba(34,197,94,0.35)';
  } else if (depsFehlen) {
    cardClass = 'bg-gray-900 border-gray-700';
    iconClass = 'bg-gray-800';
    nameClass = 'text-gray-500';
  }

  return (
    <div
      onClick={() => onToggle(tech.id)}
      style={{
        width: KARTE_B,
        height: KARTE_H,
        opacity: dimmed ? 0.15 : 1,
        transition: 'opacity 0.2s',
        boxShadow: glow,
      }}
      className={`rounded-lg border-2 cursor-pointer select-none flex flex-col justify-between p-2 transition-colors ${cardClass}`}
      title={depsFehlen && !istErforscht ? 'Voraussetzungen fehlen – werden automatisch miterforscht' : ''}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="flex items-start gap-1.5">
        <div className={`w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-sm leading-none ${iconClass}`}>
          {istErforscht ? '✓' : depsFehlen ? '🔒' : '🔬'}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold leading-tight ${nameClass}`} style={{ fontSize: 10.5 }}>
            {tech.name[sprache] ?? tech.name.de}
          </div>
        </div>
        {istErforscht && (
          <span className="text-green-400 text-xs flex-shrink-0 leading-none mt-0.5">✓</span>
        )}
      </div>
      <PaketDots cost={tech.cost} />
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
});

// ── Custom node: level group (e.g. Mining Productivity 1-4) ──────────────────
const LevelNode = memo(({ data }) => {
  const { gruppe, aktuellesLevel, onSetzeLevel, sprache, dimmed } = data;
  const maxLevel = gruppe.ids.length;
  const name = gruppe.label[sprache] ?? gruppe.label.de;

  const aktiv = aktuellesLevel > 0;
  const glow = aktiv ? '0 0 14px rgba(34,197,94,0.35)' : '';

  return (
    <div
      style={{
        width: KARTE_B,
        height: KARTE_H,
        opacity: dimmed ? 0.15 : 1,
        transition: 'opacity 0.2s',
        boxShadow: glow,
      }}
      className={`rounded-lg border-2 select-none flex flex-col justify-between p-2 transition-colors ${
        aktiv ? 'bg-green-950 border-green-500' : 'bg-gray-800 border-gray-600'
      }`}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="flex items-start gap-1.5">
        <div className={`w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-sm leading-none ${aktiv ? 'bg-green-800' : 'bg-gray-700'}`}>
          ⚗️
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold leading-tight ${aktiv ? 'text-green-300' : 'text-white'}`} style={{ fontSize: 10.5 }}>
            {name}
          </div>
          <div className="text-gray-500" style={{ fontSize: 9 }}>
            {sprache === 'de' ? `Stufe ${aktuellesLevel} / ${maxLevel}` : `Level ${aktuellesLevel} / ${maxLevel}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 justify-end">
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onSetzeLevel(gruppe.ids, Math.max(0, aktuellesLevel - 1)); }}
          disabled={aktuellesLevel === 0}
          className="w-5 h-5 rounded bg-gray-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold leading-none"
        >−</button>
        <span
          className={`font-bold w-8 text-center ${aktiv ? 'text-amber-300' : 'text-gray-400'}`}
          style={{ fontSize: 10 }}
        >
          {aktuellesLevel}/{maxLevel}
        </span>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onSetzeLevel(gruppe.ids, Math.min(maxLevel, aktuellesLevel + 1)); }}
          disabled={aktuellesLevel === maxLevel}
          className="w-5 h-5 rounded bg-gray-600 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold leading-none"
        >+</button>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
});

// Invisible handles – react-flow needs them for edge routing but we don't show dots
const HANDLE_STYLE = {
  background: 'transparent',
  border: 'none',
  width: 0,
  height: 0,
};

// Must be defined outside the component so react-flow doesn't recreate node types
const nodeTypes = { techNode: TechNode, levelNode: LevelNode };

// Pre-compute static positions once (pure function, no state)
const POSITIONEN = berechnePositionen();

// ── Main component ────────────────────────────────────────────────────────────
export default function ForschungsBaum() {
  const { erforscht, toggle, setzePreset, allesZuruecksetzen, setzeLevel, boni } = useForschung();
  const { sprache } = useSprache();
  const [suchbegriff, setSuchbegriff] = useState('');

  const handleToggle = useCallback((id) => toggle(id), [toggle]);
  const handleSetzeLevel = useCallback((ids, level) => setzeLevel(ids, level), [setzeLevel]);

  const gefilterteTech = useMemo(() => {
    if (!suchbegriff.trim()) return null;
    const s = suchbegriff.toLowerCase();
    return new Set(
      TECH_LAYOUT
        .filter(t => t.name.de?.toLowerCase().includes(s) || t.name.en?.toLowerCase().includes(s))
        .map(t => t.id)
    );
  }, [suchbegriff]);

  // Build react-flow nodes + edges from current research state
  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    for (const tech of TECH_LAYOUT) {
      const pos = POSITIONEN[tech.id];
      if (!pos) continue;

      const dimmed = gefilterteTech !== null && !gefilterteTech.has(tech.id);
      const gruppenInfo = LEVEL_GRUPPE_VON_TECH[tech.id];

      if (gruppenInfo && gruppenInfo.index === 0) {
        // Level-counter card (e.g. Mining Productivity)
        const gruppe = gruppenInfo.gruppe;
        let aktuellesLevel = 0;
        for (const id of gruppe.ids) {
          if (erforscht.has(id)) aktuellesLevel++;
          else break;
        }
        nodes.push({
          id: tech.id,
          type: 'levelNode',
          position: pos,
          data: { gruppe, aktuellesLevel, onSetzeLevel: handleSetzeLevel, sprache, dimmed },
        });
      } else {
        const istErforscht = erforscht.has(tech.id);
        const depsFehlen = tech.prerequisites.some(p => !erforscht.has(p));
        nodes.push({
          id: tech.id,
          type: 'techNode',
          position: pos,
          data: { tech, istErforscht, depsFehlen, onToggle: handleToggle, sprache, dimmed },
        });
      }

      // Edges from prerequisites → this tech
      for (const preId of tech.prerequisites) {
        if (!TECH_LAYOUT_MAP[preId]) continue;
        const beideErforscht = erforscht.has(preId) && erforscht.has(tech.id);
        const sourceErforscht = erforscht.has(preId);

        edges.push({
          id: `${preId}->${tech.id}`,
          source: preId,
          target: tech.id,
          type: 'smoothstep',
          animated: beideErforscht,
          style: {
            stroke: beideErforscht
              ? '#22c55e'
              : sourceErforscht
              ? '#f59e0b'
              : '#374151',
            strokeWidth: beideErforscht ? 2.5 : 1.5,
            opacity: beideErforscht ? 1 : 0.45,
          },
        });
      }
    }

    return { nodes, edges };
  }, [erforscht, sprache, gefilterteTech, handleToggle, handleSetzeLevel]);

  const anzahlErforscht = erforscht.size;
  const anzahlGesamt = TECH.length;

  const suchPlaceholder = sprache === 'de' ? 'Technologie suchen…' : 'Search technology…';
  const allesReset = sprache === 'de' ? 'Alles zurücksetzen' : 'Reset all';
  const erforschtLabel = sprache === 'de' ? 'erforscht' : 'researched';

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 items-center">
        {/* Preset buttons */}
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

        {/* Search */}
        <input
          type="text"
          placeholder={suchPlaceholder}
          value={suchbegriff}
          onChange={e => setSuchbegriff(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 w-48"
        />

        {/* Stats */}
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
          {boni.assemblerBonus > 0 && (
            <span className="text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-700/40">
              ⚙ +{(boni.assemblerBonus * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* ── Flow canvas ── */}
      <BaumFehlerGrenze>
        <div className="flex-1 min-h-0 rounded-xl border border-gray-700/80 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 0.9 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            style={{ background: '#030712' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#1f2937"
              gap={24}
              size={1.2}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </BaumFehlerGrenze>

      {/* ── Legend ── */}
      <div className="flex-shrink-0 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-green-500 bg-green-950 inline-block" />
          {sprache === 'de' ? 'Erforscht' : 'Researched'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-gray-600 bg-gray-800 inline-block" />
          {sprache === 'de' ? 'Verfügbar' : 'Available'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-gray-700 bg-gray-900 opacity-50 inline-block" />
          {sprache === 'de' ? 'Gesperrt' : 'Locked'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-green-500 inline-block rounded" />
          {sprache === 'de' ? 'Abhängigkeit erfüllt' : 'Dependency met'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-amber-500 inline-block rounded opacity-60" />
          {sprache === 'de' ? 'Bereit zu erforschen' : 'Ready to research'}
        </span>
        <span className="text-gray-700 ml-1">
          {sprache === 'de' ? 'Scrollen = Zoom · Ziehen = Pan' : 'Scroll = Zoom · Drag = Pan'}
        </span>
      </div>

    </div>
  );
}
