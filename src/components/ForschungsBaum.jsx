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
  PACK_META,
} from '../data/research';
import gamedata from '../data/gamedata.json';
import Icon from './Icon';
import { useForschung } from '../context/ForschungContext';
import { useSprache } from '../context/SprachContext';
import { berechneDagreLayout } from '../utils/dagreLayout';
import { berechnePfad } from '../utils/forschungsPfad';

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
const KARTE_B     = 310;
const KARTE_H     = 100;
const KARTE_H_LVL = 120;

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

// Dagre-Positionen einmalig berechnen (Topologie ist statisch)
const _DAGRE_POS = Object.fromEntries(
  berechneDagreLayout(
    TECH_LAYOUT.map(t => ({ id: t.id })),
    TECH_LAYOUT.flatMap(t =>
      t.prerequisites.filter(p => TECH_LAYOUT_MAP[p]).map(p => ({ source: p, target: t.id }))
    ),
    KARTE_B,
    KARTE_H_LVL,
  ).map(n => [n.id, n.position])
);

const HANDLE_STYLE = { background: 'transparent', border: 'none', width: 0, height: 0 };

function hoverBorder(color) {
  const map = { '#5dbf3c': '#7ddf5c', '#f0b070': '#ffd090', '#5a5a5a': '#7a7a7a', '#f59e0b': '#f0b070' };
  return map[color] ?? color;
}

// ── Pfad-Badge ────────────────────────────────────────────────────────────────
function PfadBadge({ nummer, istZiel, istVoraussetzung }) {
  if (istZiel) {
    return (
      <div style={{ position: 'absolute', top: -12, left: -12, fontSize: 18, zIndex: 10, lineHeight: 1 }}>
        🎯
      </div>
    );
  }
  if (nummer != null) {
    return (
      <div style={{
        position: 'absolute', top: -8, left: -8,
        width: 20, height: 20, borderRadius: '50%',
        background: '#2563eb', border: '1.5px solid #60a5fa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#fff', zIndex: 10,
      }}>
        {nummer}
      </div>
    );
  }
  if (istVoraussetzung) {
    return (
      <div style={{
        position: 'absolute', top: -8, right: -8,
        width: 18, height: 18, borderRadius: '50%',
        background: '#5dbf3c', border: '1.5px solid #7ddf5c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#fff', zIndex: 10,
      }}>
        ✓
      </div>
    );
  }
  return null;
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
  const {
    tech, istErforscht, depsFehlen, onToggle, sprache, dimmed, highlighted,
    pfadNummer, istZiel, istPfadVoraussetzung, pfadPlanModus, onPfadKlick,
  } = data;
  const [hovered, setHovered] = useState(false);

  const istImPfad    = pfadNummer != null || istZiel;
  const borderColor  = istZiel
    ? '#f59e0b'
    : istImPfad
    ? '#3b82f6'
    : highlighted
    ? '#f0b070'
    : istErforscht
    ? '#5dbf3c'
    : depsFehlen
    ? '#5a5a5a'
    : '#c8903c';

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (pfadPlanModus) {
      if (!istErforscht) onPfadKlick(tech.id);
    } else {
      onToggle(tech.id);
    }
  }, [pfadPlanModus, istErforscht, onPfadKlick, onToggle, tech.id]);

  const costEntries = Object.entries(tech.cost).filter(([, v]) => v > 0 || v === '∞');
  const techTime    = gamedata.technologies[tech.id]?.cost?.time;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={istImPfad && !istZiel ? 'pfad-puls' : undefined}
      style={{
        width: KARTE_B,
        height: KARTE_H,
        background: hovered && !dimmed ? '#2a2a2a' : '#1e1e1e',
        border: `2px solid ${hovered && !dimmed ? hoverBorder(borderColor) : borderColor}`,
        borderRadius: 6,
        padding: 8,
        opacity: dimmed ? 0.15 : 1,
        cursor: pfadPlanModus && !istErforscht ? 'crosshair' : 'pointer',
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
      <PfadBadge nummer={pfadNummer} istZiel={istZiel} istVoraussetzung={istPfadVoraussetzung} />
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
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'normal',
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
  const {
    gruppe, aktuellesLevel, onSetzeLevel, sprache, dimmed, highlighted, techId,
    pfadNummer, istZiel, istPfadVoraussetzung, pfadPlanModus, onPfadKlick,
  } = data;
  const maxDiscrete = gruppe.ids.length;
  const isInfinite  = gruppe.isInfinite ?? false;
  const name        = gruppe.label[sprache] ?? gruppe.label.de;
  const maxDisplay  = isInfinite ? '∞' : maxDiscrete;
  const aktiv       = aktuellesLevel > 0;

  const istImPfad   = pfadNummer != null || istZiel;
  const borderColor = istZiel
    ? '#f59e0b'
    : istImPfad
    ? '#3b82f6'
    : highlighted
    ? '#f0b070'
    : aktiv
    ? '#5dbf3c'
    : '#5a5a5a';

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

  const handleCardClick = useCallback((e) => {
    if (pfadPlanModus && aktuellesLevel === 0) {
      e.stopPropagation();
      onPfadKlick(techId);
    }
  }, [pfadPlanModus, aktuellesLevel, onPfadKlick, techId]);

  return (
    <div
      onClick={handleCardClick}
      className={istImPfad && !istZiel ? 'pfad-puls' : undefined}
      style={{
        width: KARTE_B,
        height: KARTE_H_LVL,
        background: '#1e1e1e',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        padding: 8,
        opacity: dimmed ? 0.15 : 1,
        cursor: pfadPlanModus && aktuellesLevel === 0 ? 'crosshair' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxSizing: 'border-box',
        boxShadow: aktiv ? '0 0 12px rgba(93,191,60,0.3)' : 'none',
        transition: 'opacity 0.2s',
        userSelect: 'none',
        pointerEvents: 'all',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <PfadBadge nummer={pfadNummer} istZiel={istZiel} istVoraussetzung={istPfadVoraussetzung} />
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
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'normal',
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

// ── Pfad-Seitenleiste ─────────────────────────────────────────────────────────
function PfadSeitenleiste({ pfad, zielTechId, sprache, onSchliessen }) {
  const [kopiert, setKopiert] = useState(false);

  const zielGruppenInfo = LEVEL_GRUPPE_VON_TECH[zielTechId];
  const zielName = zielGruppenInfo
    ? (zielGruppenInfo.gruppe.label[sprache] ?? zielGruppenInfo.gruppe.label.de)
    : (TECH_MAP[zielTechId]?.name[sprache] ?? zielTechId);

  const getTechName = (id) => {
    const gruppenInfo = LEVEL_GRUPPE_VON_TECH[id];
    return gruppenInfo
      ? (gruppenInfo.gruppe.label[sprache] ?? gruppenInfo.gruppe.label.de)
      : (TECH_MAP[id]?.name[sprache] ?? id);
  };

  const kopieren = () => {
    const text = pfad.reihenfolge
      .map((id, i) => `${i + 1}. ${getTechName(id)}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1500);
    });
  };

  const btnBase = {
    padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: '1px solid', transition: 'background 0.12s',
  };

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 300,
      background: '#1a1a1a', borderLeft: '1px solid #3d3d3d',
      display: 'flex', flexDirection: 'column', zIndex: 20,
    }}>
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #3d3d3d', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f0b070', letterSpacing: '0.03em' }}>
              {sprache === 'de' ? 'Forschungsplan' : 'Research Plan'}
            </div>
            <div style={{ fontSize: 12, color: '#e8d8b0', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#8a8278' }}>→</span>
              <span style={{ fontWeight: 600 }}>{zielName}</span>
              <span>🎯</span>
            </div>
          </div>
          <button
            onClick={onSchliessen}
            style={{ ...btnBase, background: 'transparent', borderColor: '#5a5a5a', color: '#8a8278', padding: '3px 7px', fontSize: 13 }}
          >✕</button>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: '#706860' }}>
          {pfad.reihenfolge.length} {sprache === 'de' ? 'Technologien zu erforschen' : 'technologies to research'}
        </div>
      </div>

      {/* Techs to research */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {pfad.reihenfolge.length === 0 ? (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: '#5dbf3c', fontSize: 12 }}>
            {sprache === 'de' ? '✓ Bereits vollständig erforscht!' : '✓ Already fully researched!'}
          </div>
        ) : (
          pfad.reihenfolge.map((id, i) => (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 12px',
              background: id === zielTechId ? 'rgba(245,158,11,0.08)' : 'transparent',
              borderLeft: id === zielTechId ? '2px solid #f59e0b' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, minWidth: 20, textAlign: 'right' }}>
                {i + 1}.
              </span>
              <Icon id={id} type="technologies" size={22} />
              <span style={{ fontSize: 11, color: id === zielTechId ? '#fbbf24' : '#e8d8b0', flex: 1, lineHeight: 1.3 }}>
                {getTechName(id)}
              </span>
              {id === zielTechId && <span style={{ fontSize: 13 }}>🎯</span>}
            </div>
          ))
        )}

        {/* Bereits erforschte Voraussetzungen */}
        {pfad.bereitsErforscht.size > 0 && (
          <>
            <div style={{
              padding: '6px 12px', fontSize: 10, fontWeight: 600,
              color: '#5dbf3c', borderTop: '1px solid #2a2a2a', marginTop: 4,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>✓</span>
              <span>{sprache === 'de' ? 'Bereits erforscht' : 'Already researched'}</span>
            </div>
            {[...pfad.bereitsErforscht].map(id => (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '3px 12px', opacity: 0.5,
              }}>
                <span style={{ fontSize: 10, color: '#5dbf3c', minWidth: 20, textAlign: 'right' }}>✓</span>
                <Icon id={id} type="technologies" size={16} />
                <span style={{ fontSize: 10, color: '#8a8278', flex: 1 }}>{getTechName(id)}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Wissenschaftskosten */}
      {Object.keys(pfad.wissenschaftskosten).length > 0 && (
        <div style={{ borderTop: '1px solid #3d3d3d', padding: '10px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#8a8278', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            {sprache === 'de' ? 'Pakete gesamt' : 'Total packages'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(pfad.wissenschaftskosten).map(([pack, count]) => (
              <div key={pack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon id={PACK_KEY_TO_ITEM_ID[pack] ?? pack} type="items" size={18} />
                <span style={{ fontSize: 11, color: '#c8b898', minWidth: 50 }}>
                  ×{count.toLocaleString()}
                </span>
                <span style={{ fontSize: 10, color: '#706860' }}>
                  {PACK_META[pack]?.label ?? pack}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aktions-Buttons */}
      <div style={{ borderTop: '1px solid #3d3d3d', padding: '8px 12px', display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={kopieren}
          style={{
            ...btnBase, flex: 1,
            background: kopiert ? '#166534' : '#1e3a5f',
            borderColor: kopiert ? '#4ade80' : '#3b82f6',
            color: kopiert ? '#4ade80' : '#93c5fd',
          }}
        >
          {kopiert ? '✓ Kopiert!' : `📋 ${sprache === 'de' ? 'Reihenfolge kopieren' : 'Copy order'}`}
        </button>
        <button
          onClick={onSchliessen}
          style={{ ...btnBase, background: '#2a1a1a', borderColor: '#5a3a3a', color: '#c87070' }}
        >
          {sprache === 'de' ? 'Aufheben' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function ForschungsBaum() {
  const { erforscht, infiniteLevels, toggle, setzePreset, allesZuruecksetzen, setzeLevel, boni } = useForschung();
  const { sprache } = useSprache();
  const [suchbegriff, setSuchbegriff] = useState('');
  const [aktivKategorie, setAktivKategorie] = useState(null);
  const [pfadPlanModus, setPfadPlanModus] = useState(false);
  const [zielTechId, setZielTechId] = useState(null);

  const handleToggle     = useCallback((id)           => toggle(id),            [toggle]);
  const handleSetzeLevel = useCallback((gruppe, level) => setzeLevel(gruppe, level), [setzeLevel]);
  const handlePfadKlick  = useCallback((id) => {
    setZielTechId(prev => prev === id ? null : id);
  }, []);
  const handlePfadSchliessen = useCallback(() => {
    setZielTechId(null);
    setPfadPlanModus(false);
  }, []);

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

  // Pfad berechnen
  const pfad = useMemo(() => {
    if (!zielTechId) return null;
    return berechnePfad(zielTechId, erforscht);
  }, [zielTechId, erforscht]);

  const pfadIndex = useMemo(() => {
    if (!pfad) return new Map();
    return new Map(pfad.reihenfolge.map((id, i) => [id, i + 1]));
  }, [pfad]);

  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    for (const tech of TECH_LAYOUT) {
      const pos         = _DAGRE_POS[tech.id] ?? { x: 0, y: 0 };
      const dimmed      = gefilterteTech !== null && !gefilterteTech.has(tech.id);
      const highlighted = sucheAktiv && gefilterteTech !== null && gefilterteTech.has(tech.id);
      const gruppenInfo = LEVEL_GRUPPE_VON_TECH[tech.id];

      const pfadNummer         = pfadIndex.get(tech.id) ?? null;
      const istZiel            = tech.id === zielTechId;
      const istPfadVoraussetzung = pfad?.bereitsErforscht.has(tech.id) ?? false;

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
          data: {
            gruppe, aktuellesLevel, onSetzeLevel: handleSetzeLevel, sprache, dimmed, highlighted, techId: tech.id,
            pfadNummer, istZiel, istPfadVoraussetzung, pfadPlanModus, onPfadKlick: handlePfadKlick,
          },
        });
      } else {
        const istErforscht = erforscht.has(tech.id);
        const depsFehlen   = tech.prerequisites.some(p => !erforscht.has(p));
        nodes.push({
          id: tech.id,
          type: 'techNode',
          position: pos,
          data: {
            tech, istErforscht, depsFehlen, onToggle: handleToggle, sprache, dimmed, highlighted,
            pfadNummer, istZiel, istPfadVoraussetzung, pfadPlanModus, onPfadKlick: handlePfadKlick,
          },
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
  }, [
    erforscht, infiniteLevels, sprache, gefilterteTech, sucheAktiv,
    handleToggle, handleSetzeLevel, pfadIndex, pfad, zielTechId,
    pfadPlanModus, handlePfadKlick,
  ]);

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

          {/* Pfad-Planer Toggle */}
          <button
            onClick={() => {
              if (pfadPlanModus) {
                setPfadPlanModus(false);
              } else {
                setPfadPlanModus(true);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
            style={pfadPlanModus
              ? { background: '#92400e', borderColor: '#f59e0b', color: '#fbbf24' }
              : { background: '#1e293b', borderColor: '#334155', color: '#94a3b8' }
            }
            title={sprache === 'de' ? 'Klicke auf eine Technologie um den optimalen Forschungspfad zu planen' : 'Click a technology to plan the optimal research path'}
          >
            📍 {sprache === 'de'
              ? (pfadPlanModus ? 'Ziel wählen…' : 'Pfad planen')
              : (pfadPlanModus ? 'Select goal…' : 'Plan path')}
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
        <div className="flex-1 min-h-0 rounded-xl border border-gray-700/80 overflow-hidden" style={{ position: 'relative' }}>
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

          {/* Pfad-Seitenleiste */}
          {pfad && (
            <PfadSeitenleiste
              pfad={pfad}
              zielTechId={zielTechId}
              sprache={sprache}
              onSchliessen={handlePfadSchliessen}
            />
          )}
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
        {pfadPlanModus && (
          <span className="flex items-center gap-1.5" style={{ color: '#f0b070' }}>
            📍 {sprache === 'de' ? 'Klicke auf dein Ziel' : 'Click your target'}
          </span>
        )}
        <span className="text-gray-700 ml-1">
          {sprache === 'de' ? 'Scrollen = Zoom · Ziehen = Pan · Klick = Erforschen/Sperren' : 'Scroll = Zoom · Drag = Pan · Click = Research/Lock'}
        </span>
      </div>
    </div>
  );
}
