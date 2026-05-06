import { useMemo, useState, memo } from 'react';
import {
  TECH,
  TECH_MAP,
  LEVEL_GRUPPE_VON_TECH,
  LEVEL_GRUPPE_NICHT_ERSTE,
  KATEGORIEN,
  TECH_KATEGORIEN,
} from '../data/research';
import gamedata from '../data/gamedata.json';
import Icon from './Icon';

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

const _MIT_NACHFOLGER = new Set(TECH.flatMap(t => t.prerequisites));

const TECH_LAYOUT = TECH.filter(t =>
  !LEVEL_GRUPPE_NICHT_ERSTE.has(t.id) &&
  (t.prerequisites.length > 0 || _MIT_NACHFOLGER.has(t.id))
);

const TECH_LAYOUT_SORTED = [...TECH_LAYOUT].sort((a, b) => {
  const oa = gamedata.technologies[a.id]?.order ?? `z-${a.id}`;
  const ob = gamedata.technologies[b.id]?.order ?? `z-${b.id}`;
  return oa < ob ? -1 : oa > ob ? 1 : 0;
});

const FILTER_AKTIV   = { background: '#2a2218', borderColor: '#c8a84b', color: '#c8a84b', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 700, border: '1px solid', cursor: 'pointer' };
const FILTER_INAKTIV = { background: '#1e1e1e', borderColor: '#3a3a3a', color: '#5a5a5a', borderRadius: 4, padding: '3px 10px', fontSize: 11, border: '1px solid', cursor: 'pointer' };

// ── TechGridKachel ────────────────────────────────────────────────────────────
const TechGridKachel = memo(({ tech, erforscht, onToggle, sprache }) => {
  const istErforscht = erforscht.has(tech.id);
  const depsFehlen   = tech.prerequisites.some(p => !erforscht.has(p));
  const borderColor  = istErforscht ? '#5dbf3c' : depsFehlen ? '#5a5a5a' : '#c8903c';
  const costEntries  = Object.entries(tech.cost).filter(([, v]) => v > 0 || v === '∞');

  return (
    <div
      onClick={() => onToggle(tech.id)}
      title={tech.name[sprache] ?? tech.name.de}
      style={{
        height: 90,
        background: '#1e1e1e',
        border: `2px solid ${borderColor}`,
        borderRadius: 5,
        padding: 6,
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        overflow: 'hidden',
        opacity: depsFehlen && !istErforscht ? 0.55 : 1,
        boxShadow: istErforscht ? '0 0 8px rgba(93,191,60,0.25)' : 'none',
        transition: 'border-color 0.1s, opacity 0.15s',
        userSelect: 'none',
      }}
    >
      <Icon id={tech.id} type="technologies" size={32} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#e8d8b0',
          lineHeight: 1.25, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          whiteSpace: 'normal',
        }}>
          {tech.name[sprache] ?? tech.name.de}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {costEntries.map(([pack, count]) => (
            <span key={pack} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Icon id={PACK_KEY_TO_ITEM_ID[pack] ?? pack} type="items" size={14} />
              <span style={{ fontSize: 9, color: '#8a8278' }}>×{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── LevelGridKachel ───────────────────────────────────────────────────────────
const LevelGridKachel = memo(({ gruppe, techId, tech, erforscht, infiniteLevels, onSetzeLevel, sprache }) => {
  const maxDiscrete = gruppe.ids.length;
  const isInfinite  = gruppe.isInfinite ?? false;
  const maxDisplay  = isInfinite ? '∞' : maxDiscrete;
  const name        = gruppe.label[sprache] ?? gruppe.label.de;

  let aktuellesDiscreteLevel = 0;
  for (const id of gruppe.ids) {
    if (erforscht.has(id)) aktuellesDiscreteLevel++;
    else break;
  }
  const extraLevel     = infiniteLevels.get(gruppe.id) ?? 0;
  const aktuellesLevel = aktuellesDiscreteLevel + extraLevel;
  const aktiv          = aktuellesLevel > 0;
  const depsFehlen     = tech.prerequisites.some(p => !erforscht.has(p));
  const borderColor    = aktiv ? '#5dbf3c' : depsFehlen ? '#5a5a5a' : '#c8903c';

  const firstTech   = TECH_MAP[gruppe.ids[0]];
  const costEntries = firstTech
    ? Object.entries(firstTech.cost).filter(([, v]) => v > 0 || v === '∞')
    : [];

  const btnStyle = (disabled) => ({
    width: 16, height: 16, borderRadius: 3,
    background: '#2a2a2a', border: '1px solid #4a4a4a',
    color: '#c8b898', fontSize: 11, lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <div
      title={name}
      style={{
        height: 90,
        background: '#1e1e1e',
        border: `2px solid ${borderColor}`,
        borderRadius: 5,
        padding: 6,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        overflow: 'hidden',
        boxShadow: aktiv ? '0 0 8px rgba(93,191,60,0.25)' : 'none',
        transition: 'border-color 0.1s',
        userSelect: 'none',
      }}
    >
      <Icon id={techId} type="technologies" size={32} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#e8d8b0',
          lineHeight: 1.25, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          whiteSpace: 'normal',
        }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {costEntries.map(([pack, count]) => (
            <span key={pack} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Icon id={PACK_KEY_TO_ITEM_ID[pack] ?? pack} type="items" size={14} />
              <span style={{ fontSize: 9, color: '#8a8278' }}>×{count}</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 'auto' }}>
          <button
            onClick={e => { e.stopPropagation(); onSetzeLevel(gruppe, Math.max(0, aktuellesLevel - 1)); }}
            disabled={aktuellesLevel === 0}
            style={btnStyle(aktuellesLevel === 0)}
          >−</button>
          <span style={{ fontSize: 10, color: aktiv ? '#f0b070' : '#706860', flex: 1, textAlign: 'center', fontWeight: 600 }}>
            {aktuellesLevel} / {maxDisplay}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onSetzeLevel(gruppe, aktuellesLevel + 1); }}
            disabled={!isInfinite && aktuellesLevel >= maxDiscrete}
            style={btnStyle(!isInfinite && aktuellesLevel >= maxDiscrete)}
          >+</button>
        </div>
      </div>
    </div>
  );
});

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function ForschungsGrid({
  erforscht, sprache, onToggle, gefilterteTech,
  infiniteLevels, onSetzeLevel,
}) {
  const [versteckeErforscht, setVersteckeErforscht] = useState(false);
  const [versteckeGesperrt,  setVersteckeGesperrt]  = useState(false);

  const kategorienGruppen = useMemo(() =>
    Object.keys(KATEGORIEN)
      .map(k => ({ key: k, meta: KATEGORIEN[k], techs: TECH_LAYOUT_SORTED.filter(t => TECH_KATEGORIEN[t.id] === k) }))
      .filter(g => g.techs.length > 0),
  []);

  const stats = useMemo(() => {
    let verfuegbar = 0, erforschteCount = 0, gesperrt = 0;
    for (const tech of TECH_LAYOUT) {
      const gi = LEVEL_GRUPPE_VON_TECH[tech.id];
      if (gi && gi.index === 0) {
        let lvl = 0;
        for (const id of gi.gruppe.ids) { if (erforscht.has(id)) lvl++; else break; }
        const aktiv = lvl > 0 || (infiniteLevels.get(gi.gruppe.id) ?? 0) > 0;
        if (aktiv) erforschteCount++;
        else if (tech.prerequisites.some(p => !erforscht.has(p))) gesperrt++;
        else verfuegbar++;
      } else {
        if (erforscht.has(tech.id)) erforschteCount++;
        else if (tech.prerequisites.some(p => !erforscht.has(p))) gesperrt++;
        else verfuegbar++;
      }
    }
    return { verfuegbar, erforschteCount, gesperrt };
  }, [erforscht, infiniteLevels]);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>

      {/* Filter-Toolbar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={() => setVersteckeErforscht(v => !v)} style={versteckeErforscht ? FILTER_AKTIV : FILTER_INAKTIV}>
          {sprache === 'de' ? '✓ Erforscht ausblenden' : '✓ Hide researched'}
        </button>
        <button onClick={() => setVersteckeGesperrt(v => !v)} style={versteckeGesperrt ? FILTER_AKTIV : FILTER_INAKTIV}>
          {sprache === 'de' ? '🔒 Gesperrte ausblenden' : '🔒 Hide locked'}
        </button>
        <span style={{ fontSize: 11, color: '#706860', marginLeft: 'auto' }}>
          <span style={{ color: '#c8903c', fontWeight: 600 }}>{stats.verfuegbar}</span>
          {' '}{sprache === 'de' ? 'verfügbar' : 'available'}
          {' · '}
          <span style={{ color: '#5dbf3c', fontWeight: 600 }}>{stats.erforschteCount}</span>
          {' '}{sprache === 'de' ? 'erforscht' : 'researched'}
          {' · '}
          <span style={{ color: '#5a5a5a', fontWeight: 600 }}>{stats.gesperrt}</span>
          {' '}{sprache === 'de' ? 'gesperrt' : 'locked'}
        </span>
      </div>

      {/* Scrollbarer Grid-Bereich */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
        {kategorienGruppen.map(({ key, meta, techs }) => {
          const visible = techs.filter(tech => {
            if (gefilterteTech !== null && !gefilterteTech.has(tech.id)) return false;
            const gi = LEVEL_GRUPPE_VON_TECH[tech.id];
            if (gi && gi.index === 0) {
              let lvl = 0;
              for (const id of gi.gruppe.ids) { if (erforscht.has(id)) lvl++; else break; }
              const aktiv = lvl > 0 || (infiniteLevels.get(gi.gruppe.id) ?? 0) > 0;
              if (versteckeErforscht && aktiv) return false;
              if (versteckeGesperrt && !aktiv && tech.prerequisites.some(p => !erforscht.has(p))) return false;
            } else {
              const ist = erforscht.has(tech.id);
              if (versteckeErforscht && ist) return false;
              if (versteckeGesperrt && !ist && tech.prerequisites.some(p => !erforscht.has(p))) return false;
            }
            return true;
          });

          if (visible.length === 0) return null;

          return (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: meta.color,
                marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5,
                paddingBottom: 4, borderBottom: `1px solid ${meta.color}33`,
              }}>
                <span>{meta.icon}</span>
                <span>{meta.label[sprache]}</span>
                <span style={{ fontSize: 10, color: '#4a4a4a', fontWeight: 400 }}>({visible.length})</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 6,
              }}>
                {visible.map(tech => {
                  const gi = LEVEL_GRUPPE_VON_TECH[tech.id];
                  if (gi && gi.index === 0) {
                    return (
                      <LevelGridKachel
                        key={tech.id}
                        gruppe={gi.gruppe}
                        techId={tech.id}
                        tech={tech}
                        erforscht={erforscht}
                        infiniteLevels={infiniteLevels}
                        onSetzeLevel={onSetzeLevel}
                        sprache={sprache}
                      />
                    );
                  }
                  return (
                    <TechGridKachel
                      key={tech.id}
                      tech={tech}
                      erforscht={erforscht}
                      onToggle={onToggle}
                      sprache={sprache}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
