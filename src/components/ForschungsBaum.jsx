import { Component, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { TECH, TECH_MAP, PACK_META, PRESETS, LEVEL_GRUPPEN, LEVEL_GRUPPE_VON_TECH, LEVEL_GRUPPE_NICHT_ERSTE } from '../data/research';
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

const KARTE_B = 180;
const KARTE_H = 90;
const ABSTAND_X = 210;
const ABSTAND_Y = 140;

// Techs die für das Layout verwendet werden (nicht-erste Gruppen-Mitglieder werden ausgeblendet)
const TECH_LAYOUT = TECH.filter(t => !LEVEL_GRUPPE_NICHT_ERSTE.has(t.id));
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
  const queue = TECH_LAYOUT.filter(t => t.prerequisites.every(p => !TECH_LAYOUT_MAP[p])).map(t => t.id);
  for (const id of queue) tiefe[id] = 0;

  const verarbeitet = new Set();
  let q = [...queue];
  while (q.length > 0) {
    const next = [];
    for (const id of q) {
      if (verarbeitet.has(id)) continue;
      verarbeitet.add(id);
      for (const nf of nachfolger[id]) {
        tiefe[nf] = Math.max(tiefe[nf] ?? 0, (tiefe[id] ?? 0) + 1);
        next.push(nf);
      }
    }
    q = next;
  }

  const ebenenGruppen = {};
  for (const t of TECH_LAYOUT) {
    const e = tiefe[t.id] ?? 0;
    if (!ebenenGruppen[e]) ebenenGruppen[e] = [];
    ebenenGruppen[e].push(t.id);
  }

  const pos = {};
  for (const [e, ids] of Object.entries(ebenenGruppen)) {
    ids.forEach((id, i) => {
      pos[id] = { x: i * ABSTAND_X + 20, y: parseInt(e) * ABSTAND_Y + 20 };
    });
  }

  const maxX = Math.max(...Object.values(pos).map(p => p.x)) + KARTE_B + 40;
  const maxY = Math.max(...Object.values(pos).map(p => p.y)) + KARTE_H + 40;
  return { pos, breite: maxX, hoehe: maxY };
}

function PaketDots({ cost }) {
  const eintraege = Object.entries(cost).filter(([, v]) => v > 0);
  if (eintraege.length === 0) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {eintraege.map(([pack, count]) => {
        const meta = PACK_META[pack];
        return (
          <span key={pack} title={`${meta?.label ?? pack}: ${count}`} className="inline-flex items-center gap-0.5 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-black/20 flex-shrink-0"
              style={{ background: meta?.color ?? '#888' }}
            />
            <span className="text-gray-400" style={{ fontSize: '9px' }}>{count}</span>
          </span>
        );
      })}
    </div>
  );
}

function TechKarte({ tech, pos, istErforscht, onToggle, sprache }) {
  const { erforscht } = useForschung();
  const depsFehlen = tech.prerequisites.some(p => !erforscht.has(p));

  const hintergrund = istErforscht
    ? 'bg-green-900 border-green-500'
    : depsFehlen
    ? 'bg-gray-900 border-gray-700 opacity-60'
    : 'bg-gray-800 border-gray-600 hover:border-amber-500';

  return (
    <foreignObject x={pos.x} y={pos.y} width={KARTE_B} height={KARTE_H} style={{ overflow: 'visible' }}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={`w-full h-full rounded-lg border-2 cursor-pointer select-none flex flex-col justify-between p-2 transition-colors ${hintergrund}`}
        onClick={() => onToggle(tech.id)}
        title={depsFehlen && !istErforscht ? (sprache === 'de' ? 'Voraussetzungen fehlen – werden automatisch miterforscht' : 'Prerequisites missing – will be researched automatically') : ''}
      >
        <div className="flex items-start gap-1.5">
          <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-base ${istErforscht ? 'bg-green-700' : 'bg-gray-700'}`}>
            🔬
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold leading-tight truncate ${istErforscht ? 'text-green-300' : 'text-white'}`}>
              {tech.name[sprache] ?? tech.name.de}
            </div>
          </div>
          {istErforscht && <span className="text-green-400 text-sm flex-shrink-0">✓</span>}
        </div>
        <PaketDots cost={tech.cost} />
      </div>
    </foreignObject>
  );
}

function LevelKarte({ gruppe, pos, aktuellesLevel, onSetzeLevel, sprache }) {
  const maxLevel = gruppe.ids.length;
  const name = gruppe.label[sprache] ?? gruppe.label.de;

  const hintergrund = aktuellesLevel > 0
    ? 'bg-green-900 border-green-500'
    : 'bg-gray-800 border-gray-600';

  return (
    <foreignObject x={pos.x} y={pos.y} width={KARTE_B} height={KARTE_H} style={{ overflow: 'visible' }}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={`w-full h-full rounded-lg border-2 select-none flex flex-col justify-between p-2 transition-colors ${hintergrund}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-1.5">
          <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-base ${aktuellesLevel > 0 ? 'bg-green-700' : 'bg-gray-700'}`}>
            🔬
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold leading-tight truncate ${aktuellesLevel > 0 ? 'text-green-300' : 'text-white'}`}>
              {name}
            </div>
            <div className="text-gray-500" style={{ fontSize: '9px' }}>
              {sprache === 'de' ? `Stufe ${aktuellesLevel} / ${maxLevel}` : `Level ${aktuellesLevel} / ${maxLevel}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={e => { e.stopPropagation(); onSetzeLevel(Math.max(0, aktuellesLevel - 1)); }}
            disabled={aktuellesLevel === 0}
            className="w-6 h-6 rounded bg-gray-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold leading-none"
          >−</button>
          <span className={`text-xs font-bold w-8 text-center ${aktuellesLevel > 0 ? 'text-green-300' : 'text-gray-400'}`}>
            {aktuellesLevel}/{maxLevel}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onSetzeLevel(Math.min(maxLevel, aktuellesLevel + 1)); }}
            disabled={aktuellesLevel === maxLevel}
            className="w-6 h-6 rounded bg-gray-600 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold leading-none"
          >+</button>
        </div>
      </div>
    </foreignObject>
  );
}

function Verbindungslinien({ pos }) {
  const { erforscht } = useForschung();
  const linien = [];

  for (const tech of TECH_LAYOUT) {
    for (const preId of tech.prerequisites) {
      if (!pos[preId] || !pos[tech.id]) continue;
      const von = pos[preId];
      const zu = pos[tech.id];
      const istAktiv = erforscht.has(preId) && erforscht.has(tech.id);

      const x1 = von.x + KARTE_B / 2;
      const y1 = von.y + KARTE_H;
      const x2 = zu.x + KARTE_B / 2;
      const y2 = zu.y;
      const cy = (y1 + y2) / 2;

      linien.push(
        <path
          key={`${preId}->${tech.id}`}
          d={`M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`}
          fill="none"
          stroke={istAktiv ? '#22c55e' : '#374151'}
          strokeWidth={istAktiv ? 2 : 1}
          strokeDasharray={istAktiv ? undefined : '4 3'}
          opacity={istAktiv ? 0.8 : 0.5}
        />
      );
    }
  }
  return <>{linien}</>;
}

export default function ForschungsBaum() {
  const { erforscht, toggle, setzePreset, allesZuruecksetzen, setzeLevel, boni } = useForschung();
  const { sprache } = useSprache();
  const [suchbegriff, setSuchbegriff] = useState('');

  const { pos, breite, hoehe } = useMemo(berechnePositionen, []);

  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(null);
  const hatGezogen = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const faktor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform(t => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale * faktor)) }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    hatGezogen.current = false;
    dragging.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    hatGezogen.current = true;
    setTransform(t => ({
      ...t,
      x: e.clientX - dragging.current.startX,
      y: e.clientY - dragging.current.startY,
    }));
  };
  const onMouseUp = () => { dragging.current = null; };

  const handleToggle = useCallback((id) => {
    if (hatGezogen.current) return;
    toggle(id);
  }, [toggle]);

  const gefilterteTech = useMemo(() => {
    if (!suchbegriff) return null;
    const s = suchbegriff.toLowerCase();
    return new Set(TECH_LAYOUT.filter(t =>
      (t.name.de?.toLowerCase().includes(s) || t.name.en?.toLowerCase().includes(s))
    ).map(t => t.id));
  }, [suchbegriff]);

  const anzahlErforscht = erforscht.size;
  const anzahlGesamt = TECH.length;

  const suchPlaceholder = sprache === 'de' ? 'Technologie suchen…' : 'Search technology…';
  const allesReset = sprache === 'de' ? 'Alles zurücksetzen' : 'Reset all';
  const erforschtLabel = sprache === 'de' ? 'erforscht' : 'researched';

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setzePreset(key)}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={allesZuruecksetzen}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-700 text-red-300 text-xs font-medium transition-colors"
          >
            {allesReset}
          </button>
        </div>

        <input
          type="text"
          placeholder={suchPlaceholder}
          value={suchbegriff}
          onChange={e => setSuchbegriff(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-52"
        />

        <div className="flex gap-1">
          <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(2, t.scale * 1.2) }))} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">+</button>
          <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs">Reset</button>
          <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm">−</button>
        </div>

        <div className="ml-auto text-sm text-gray-400 flex gap-4">
          <span>
            <span className="text-green-400 font-bold">{anzahlErforscht}</span>
            <span className="text-gray-600"> / {anzahlGesamt} {erforschtLabel}</span>
          </span>
          {boni.miningBonus > 0 && <span className="text-amber-300">⛏ +{(boni.miningBonus * 100).toFixed(0)}%</span>}
          {boni.assemblerBonus > 0 && <span className="text-blue-300">⚙ +{(boni.assemblerBonus * 100).toFixed(0)}%</span>}
        </div>
      </div>

      {/* Canvas */}
      <BaumFehlerGrenze>
        <div
          ref={containerRef}
          className="flex-1 rounded-xl border border-gray-700 bg-gray-950 overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <svg width="100%" height="100%" style={{ display: 'block' }}>
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              <Verbindungslinien pos={pos} />
              {TECH_LAYOUT.map(tech => {
                const p = pos[tech.id];
                if (!p) return null;
                const istHervorgehoben = gefilterteTech?.has(tech.id);
                const istAusgeblendet = gefilterteTech && !istHervorgehoben;

                const gruppenInfo = LEVEL_GRUPPE_VON_TECH[tech.id];

                if (gruppenInfo && gruppenInfo.index === 0) {
                  // Level-Counter-Karte für erste Gruppen-Mitglieder
                  const gruppe = gruppenInfo.gruppe;
                  let aktuellesLevel = 0;
                  for (const id of gruppe.ids) {
                    if (erforscht.has(id)) aktuellesLevel++;
                    else break;
                  }
                  return (
                    <g key={tech.id} opacity={istAusgeblendet ? 0.2 : 1} style={{ transition: 'opacity 0.2s' }}>
                      <LevelKarte
                        gruppe={gruppe}
                        pos={p}
                        aktuellesLevel={aktuellesLevel}
                        onSetzeLevel={(level) => setzeLevel(gruppe.ids, level)}
                        sprache={sprache}
                      />
                    </g>
                  );
                }

                return (
                  <g key={tech.id} opacity={istAusgeblendet ? 0.2 : 1} style={{ transition: 'opacity 0.2s' }}>
                    <TechKarte
                      tech={tech}
                      pos={p}
                      istErforscht={erforscht.has(tech.id)}
                      onToggle={handleToggle}
                      sprache={sprache}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </BaumFehlerGrenze>

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-green-500 bg-green-900 inline-block" />
          {sprache === 'de' ? 'Erforscht' : 'Researched'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-gray-600 bg-gray-800 inline-block" />
          {sprache === 'de' ? 'Verfügbar (klicken zum Erforschen)' : 'Available (click to research)'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-gray-700 bg-gray-900 opacity-60 inline-block" />
          {sprache === 'de' ? 'Gesperrt (Voraussetzungen fehlen)' : 'Locked (prerequisites missing)'}
        </span>
        <span className="text-gray-600 ml-2">
          {sprache === 'de' ? 'Scrollen = Zoom · Ziehen = Bewegen' : 'Scroll = Zoom · Drag = Pan'}
        </span>
      </div>
    </div>
  );
}
