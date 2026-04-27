import { useMemo, useRef, useState, useEffect } from 'react';
import { TECH, TECH_MAP, PACK_META, PRESETS } from '../data/research';
import { useForschung } from '../context/ForschungContext';

// Breite/Höhe einer Tech-Karte im Baum
const KARTE_B = 180;
const KARTE_H = 90;
const ABSTAND_X = 210; // horizontaler Abstand zwischen Knoten derselben Tiefe
const ABSTAND_Y = 140; // vertikaler Abstand zwischen Tiefen-Ebenen

// Berechnet x/y-Positionen vertikal: Tiefe auf der Y-Achse, Knoten nebeneinander auf der X-Achse
function berechnePositionen() {
  const nachfolger = {};
  for (const t of TECH) {
    nachfolger[t.id] = [];
  }
  for (const t of TECH) {
    for (const pre of t.prerequisites) {
      if (TECH_MAP[pre]) {
        nachfolger[pre].push(t.id);
      }
    }
  }

  // Kahn-Algorithmus: Tiefe = maximale Voraussetzungs-Tiefe
  const tiefe = {};
  const queue = TECH.filter(t => t.prerequisites.length === 0).map(t => t.id);
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

  // Gruppiere nach Tiefe (= Y-Ebene)
  const ebenenGruppen = {};
  for (const t of TECH) {
    const e = tiefe[t.id] ?? 0;
    if (!ebenenGruppen[e]) ebenenGruppen[e] = [];
    ebenenGruppen[e].push(t.id);
  }

  // Positionen: y = Tiefe * ABSTAND_Y, x = Position innerhalb der Ebene * ABSTAND_X
  const pos = {};
  for (const [e, ids] of Object.entries(ebenenGruppen)) {
    ids.forEach((id, i) => {
      pos[id] = {
        x: i * ABSTAND_X + 20,
        y: parseInt(e) * ABSTAND_Y + 20,
      };
    });
  }

  const maxX = Math.max(...Object.values(pos).map(p => p.x)) + KARTE_B + 40;
  const maxY = Math.max(...Object.values(pos).map(p => p.y)) + KARTE_H + 40;

  return { pos, breite: maxX, hoehe: maxY };
}

// Pakete als farbige Kreise
function PaketDots({ cost }) {
  const eintraege = Object.entries(cost).filter(([, v]) => v > 0);
  if (eintraege.length === 0) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {eintraege.map(([pack, count]) => {
        const meta = PACK_META[pack];
        return (
          <span
            key={pack}
            title={`${meta?.label ?? pack}: ${count}`}
            className="inline-flex items-center gap-0.5 text-xs"
          >
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

function TechKarte({ tech, pos, istErforscht, onToggle, scale }) {
  const { erforscht, alleVoraussetzungen } = useForschung();
  const depsFehlen = tech.prerequisites.some(p => !erforscht.has(p));

  const hintergrund = istErforscht
    ? 'bg-green-900 border-green-500'
    : depsFehlen
    ? 'bg-gray-900 border-gray-700 opacity-60'
    : 'bg-gray-800 border-gray-600 hover:border-amber-500';

  return (
    <foreignObject
      x={pos.x}
      y={pos.y}
      width={KARTE_B}
      height={KARTE_H}
      style={{ overflow: 'visible' }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={`
          w-full h-full rounded-lg border-2 cursor-pointer select-none
          flex flex-col justify-between p-2 transition-colors
          ${hintergrund}
        `}
        onClick={() => onToggle(tech.id)}
        title={depsFehlen && !istErforscht ? 'Voraussetzungen fehlen – werden automatisch miterforscht' : ''}
      >
        <div className="flex items-start gap-1.5">
          {/* Icon-Platzhalter */}
          <div className={`
            w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-base
            ${istErforscht ? 'bg-green-700' : 'bg-gray-700'}
          `}>
            🔬
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold leading-tight truncate ${istErforscht ? 'text-green-300' : 'text-white'}`}>
              {tech.name.de}
            </div>
            <div className="text-gray-500 leading-tight truncate" style={{ fontSize: '9px' }}>
              {tech.name.en}
            </div>
          </div>
          {istErforscht && (
            <span className="text-green-400 text-sm flex-shrink-0">✓</span>
          )}
        </div>
        <PaketDots cost={tech.cost} />
      </div>
    </foreignObject>
  );
}

function Verbindungslinien({ pos }) {
  const { erforscht } = useForschung();
  const linien = [];

  for (const tech of TECH) {
    for (const preId of tech.prerequisites) {
      if (!pos[preId] || !pos[tech.id]) continue;
      const von = pos[preId];
      const zu = pos[tech.id];
      const istAktiv = erforscht.has(preId) && erforscht.has(tech.id);

      // Vertikale Verbindung: Unterkante Quelle → Oberkante Ziel
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
  const { erforscht, toggle, setzePreset, allesZuruecksetzen, boni } = useForschung();
  const [suchbegriff, setSuchbegriff] = useState('');

  const { pos, breite, hoehe } = useMemo(berechnePositionen, []);

  // Pan & Zoom
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const faktor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform(t => ({
        ...t,
        scale: Math.min(2, Math.max(0.3, t.scale * faktor)),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragging.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setTransform(t => ({
      ...t,
      x: e.clientX - dragging.current.startX,
      y: e.clientY - dragging.current.startY,
    }));
  };
  const onMouseUp = () => { dragging.current = null; };

  const gefilterteTech = useMemo(() => {
    if (!suchbegriff) return null;
    const s = suchbegriff.toLowerCase();
    return new Set(TECH.filter(t =>
      t.name.de.toLowerCase().includes(s) || t.name.en.toLowerCase().includes(s)
    ).map(t => t.id));
  }, [suchbegriff]);

  const anzahlErforscht = erforscht.size;
  const anzahlGesamt = TECH.length;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Presets */}
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
            Alles zurücksetzen
          </button>
        </div>

        {/* Suche */}
        <input
          type="text"
          placeholder="Technologie suchen…"
          value={suchbegriff}
          onChange={e => setSuchbegriff(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-52"
        />

        {/* Zoom */}
        <div className="flex gap-1">
          <button
            onClick={() => setTransform(t => ({ ...t, scale: Math.min(2, t.scale * 1.2) }))}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >+</button>
          <button
            onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs"
          >Reset</button>
          <button
            onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >−</button>
        </div>

        {/* Stats */}
        <div className="ml-auto text-sm text-gray-400 flex gap-4">
          <span>
            <span className="text-green-400 font-bold">{anzahlErforscht}</span>
            <span className="text-gray-600"> / {anzahlGesamt} erforscht</span>
          </span>
          {boni.miningBonus > 0 && (
            <span className="text-amber-300">⛏ +{(boni.miningBonus * 100).toFixed(0)}%</span>
          )}
          {boni.assemblerBonus > 0 && (
            <span className="text-blue-300">⚙ +{(boni.assemblerBonus * 100).toFixed(0)}%</span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 rounded-xl border border-gray-700 bg-gray-950 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            <Verbindungslinien pos={pos} />
            {TECH.map(tech => {
              const p = pos[tech.id];
              if (!p) return null;
              const istHervorgehoben = gefilterteTech?.has(tech.id);
              const istAusgeblendet = gefilterteTech && !istHervorgehoben;
              return (
                <g
                  key={tech.id}
                  opacity={istAusgeblendet ? 0.2 : 1}
                  style={{ transition: 'opacity 0.2s' }}
                >
                  <TechKarte
                    tech={tech}
                    pos={p}
                    istErforscht={erforscht.has(tech.id)}
                    onToggle={toggle}
                    scale={transform.scale}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-green-500 bg-green-900 inline-block" />
          Erforscht
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-gray-600 bg-gray-800 inline-block" />
          Verfügbar (klicken zum Erforschen)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-gray-700 bg-gray-900 opacity-60 inline-block" />
          Gesperrt (Voraussetzungen fehlen)
        </span>
        <span className="text-gray-600 ml-2">Scrollen = Zoom · Ziehen = Bewegen</span>
      </div>
    </div>
  );
}
