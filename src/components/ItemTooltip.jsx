import { createPortal } from 'react-dom';
import gamedata from '../data/gamedata.json';
import { REZEPTE_MAP } from '../data/recipes';
import { MASCHINEN_LABEL, MASCHINEN_LABEL_EN } from '../utils/berechnung';
import { useTooltip } from '../context/TooltipContext';
import { useSprache } from '../context/SprachContext';
import Icon from './Icon';

const TOOLTIP_WIDTH    = 320;
const TOOLTIP_H_EST    = 300;

function getName(id, sprache) {
  const item = gamedata.items[id];
  if (item?.name) return sprache === 'de' ? item.name.de : item.name.en;
  const r = REZEPTE_MAP[id];
  if (r) return sprache === 'de' ? r.name : r.nameEn;
  const rec = gamedata.recipes[id];
  if (rec?.name) return sprache === 'de' ? rec.name.de : rec.name.en;
  return id;
}

export default function ItemTooltip() {
  const { tooltip }  = useTooltip();
  const { sprache }  = useSprache();

  if (!tooltip.visible || !tooltip.itemId) return null;

  const { itemId, x, y } = tooltip;

  const goLeft = x + TOOLTIP_WIDTH + 20 > window.innerWidth;
  const goUp   = y + TOOLTIP_H_EST   > window.innerHeight;
  const left   = goLeft ? x - TOOLTIP_WIDTH - 10 : x + 15;
  const top    = goUp   ? y - TOOLTIP_H_EST       : y;

  const rezept       = REZEPTE_MAP[itemId];
  const gamedataRec  = gamedata.recipes[itemId];
  const gamedataItem = gamedata.items[itemId];

  const nameDe = rezept?.name    ?? gamedataItem?.name?.de ?? itemId;
  const nameEn = rezept?.nameEn  ?? gamedataItem?.name?.en ?? itemId;
  const displayName = sprache === 'de' ? nameDe : nameEn;
  const altName     = sprache === 'de' ? nameEn : nameDe;

  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;
  const maschineName    = rezept?.maschine ? (maschinenLabels[rezept.maschine] ?? null) : null;

  const istRohstoff = !rezept || rezept.zeit === 0;
  const isFluid     = gamedataItem?.subgroup === 'fluid' || gamedataItem?.category === 'fluid';

  const zutaten = rezept?.zutaten ?? [];
  const results = gamedataRec?.results
    ?? (rezept ? [{ item: itemId, amount: rezept.ergibt }] : []);
  const zeit = rezept?.zeit ?? 0;

  const techNames = (gamedataRec?.enabled_by ?? [])
    .map(tid => gamedata.technologies[tid])
    .filter(Boolean)
    .map(t => sprache === 'de' ? t.name.de : t.name.en);

  const S = {
    root: {
      position: 'fixed', left, top,
      background: '#1a1a2e',
      border: '1px solid #c8a84b',
      borderRadius: '6px',
      padding: '12px',
      minWidth: '220px',
      maxWidth: `${TOOLTIP_WIDTH}px`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
      zIndex: 9999,
      pointerEvents: 'none',
      fontFamily: 'inherit',
      fontSize: '13px',
      color: '#e5e7eb',
    },
    divider: { borderTop: '1px solid #374151', paddingTop: '8px', marginBottom: '8px' },
    subdiv:  { borderTop: '1px solid #1f2937', marginTop: '5px', paddingTop: '5px' },
    label:   { fontSize: '11px', color: '#9ca3af', marginBottom: '4px' },
    row:     { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' },
  };

  return createPortal(
    <div style={S.root}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ flexShrink: 0 }}>
          <Icon id={itemId} size={32} />
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f9fafb', lineHeight: 1.3 }}>
            {displayName}
          </div>
          {altName !== displayName && (
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{altName}</div>
          )}
        </div>
      </div>

      {/* Recipe section */}
      {!istRohstoff && (
        <div style={{ ...S.divider, marginBottom: techNames.length > 0 ? '8px' : 0 }}>
          <div style={S.label}>{sprache === 'de' ? 'Rezept:' : 'Recipe:'}</div>

          {zutaten.map(z => (
            <div key={z.id} style={S.row}>
              <Icon id={z.id} size={14} />
              <span style={{ color: '#d1d5db' }}>{z.menge}× {getName(z.id, sprache)}</span>
            </div>
          ))}

          <div style={S.subdiv}>
            {results.map((r, i) => (
              <div key={i} style={S.row}>
                <Icon id={r.item ?? itemId} size={14} />
                <span style={{ color: '#86efac' }}>
                  → {r.amount}× {getName(r.item ?? itemId, sprache)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '5px', color: '#9ca3af', fontSize: '11px' }}>
            ⏱ {zeit}s
            {maschineName && (
              <span style={{ marginLeft: '10px' }}>🏭 {maschineName}</span>
            )}
          </div>
        </div>
      )}

      {/* Raw resource / fluid badge */}
      {istRohstoff && (
        <div style={S.divider}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isFluid ? '#60a5fa' : '#4ade80' }}>
            {isFluid
              ? 'Fluid'
              : (sprache === 'de' ? 'Rohstoff' : 'Raw resource')}
          </span>
        </div>
      )}

      {/* Unlocked by */}
      {techNames.length > 0 && (
        <div style={S.divider}>
          <div style={S.label}>
            🔬 {sprache === 'de' ? 'Freigeschaltet durch:' : 'Unlocked by:'}
          </div>
          {techNames.map((name, i) => (
            <div key={i} style={{ color: '#a78bfa', fontSize: '12px' }}>{name}</div>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
