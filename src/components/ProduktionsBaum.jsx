import { useState, useMemo } from 'react';
import { REZEPTE_MAP } from '../data/recipes';
import { maschinenAnzahl, MASCHINEN_LABEL, MASCHINEN_LABEL_EN } from '../utils/berechnung';
import { useForschung } from '../context/ForschungContext';
import { useSprache } from '../context/SprachContext';
import { useModul } from '../context/ModulContext';
import { useQuality } from '../context/QualityContext';
import { getItemName } from '../data/gamedata-adapter';
import gamedata from '../data/gamedata.json';
import Icon from './Icon';
import WithTooltip from './WithTooltip';

const T = {
  de: { alleAuf: 'Alle aufklappen', alleEin: 'Alle einklappen', rohstoff: 'Rohstoff', fluid: 'Fluid' },
  en: { alleAuf: 'Expand all',      alleEin: 'Collapse all',    rohstoff: 'Resource', fluid: 'Fluid' },
};

function istFluidItem(id) {
  const item = gamedata.items[id];
  return item?.category === 'fluid' || item?.subgroup === 'fluid';
}

function buildBaumKnoten(id, rateProSek, rezeptOverrides, modulBoni, boni, mQMulti, maschinenOverrides, pfad) {
  if (pfad.has(id)) return null;

  const rezeptId    = rezeptOverrides[id] ?? id;
  const rezept      = REZEPTE_MAP[rezeptId];
  const istRohstoff = !rezept || rezept.zeit === 0;

  const kinder = [];
  if (!istRohstoff) {
    const modulBonus       = modulBoni[rezept.maschine];
    const produktivitaet   = modulBonus?.produktivitaet ?? 0;
    const ingredientFaktor = 1 / (1 + produktivitaet);
    const neuePfad         = new Set([...pfad, id]);

    for (const zutat of rezept.zutaten) {
      if (zutat.id === id) continue;
      const zutatRate = (zutat.menge / rezept.ergibt) * rateProSek * ingredientFaktor;
      const kind = buildBaumKnoten(zutat.id, zutatRate, rezeptOverrides, modulBoni, boni, mQMulti, maschinenOverrides, neuePfad);
      if (kind) kinder.push(kind);
    }
  }

  const overrideId = maschinenOverrides[id] ?? null;
  const anzahl = istRohstoff
    ? null
    : maschinenAnzahl(id, rateProSek, boni, modulBoni, mQMulti, overrideId);

  return {
    id,
    rateProMin: rateProSek * 60,
    istRohstoff,
    istFluid:   istFluidItem(id),
    maschine:   rezept?.maschine ?? null,
    anzahl,
    kinder,
  };
}

function alleKnotenIds(knoten, acc = new Set()) {
  if (knoten.kinder.length > 0) {
    acc.add(knoten.id);
    for (const k of knoten.kinder) alleKnotenIds(k, acc);
  }
  return acc;
}

function itemName(id, sprache) {
  const r = REZEPTE_MAP[id];
  return sprache === 'de'
    ? (r?.name   ?? getItemName(id, 'de'))
    : (r?.nameEn ?? getItemName(id, 'en'));
}

function BaumZeile({ knoten, sprache, maschinenLabels, eingeklappt, onToggle, tx }) {
  const hatKinder      = knoten.kinder.length > 0;
  const istEingeklappt = eingeklappt.has(knoten.id);

  const nameColor = knoten.istFluid
    ? 'text-blue-400'
    : knoten.istRohstoff
      ? 'text-green-400'
      : 'text-gray-100';

  return (
    <div>
      <div
        role={hatKinder ? 'button' : undefined}
        tabIndex={hatKinder ? 0 : undefined}
        onKeyDown={hatKinder ? e => { if (e.key === 'Enter' || e.key === ' ') onToggle(knoten.id); } : undefined}
        onClick={hatKinder ? () => onToggle(knoten.id) : undefined}
        className={`flex items-center gap-1.5 py-0.5 px-2 rounded text-sm min-w-0 ${
          hatKinder ? 'cursor-pointer hover:bg-gray-800/50 select-none' : ''
        }`}
      >
        <span className="w-3.5 text-center text-gray-500 flex-shrink-0 text-xs leading-none">
          {hatKinder ? (istEingeklappt ? '▶' : '▼') : '●'}
        </span>
        <WithTooltip itemId={knoten.id}>
          <Icon id={knoten.id} size={16} className="flex-shrink-0" />
          <span className={`font-medium ${nameColor}`}>{itemName(knoten.id, sprache)}</span>
        </WithTooltip>
        <span className="text-gray-600 flex-shrink-0 mx-0.5">—</span>
        <span className="text-gray-300 flex-shrink-0 tabular-nums">
          {knoten.rateProMin.toFixed(2)}/min
        </span>
        {knoten.anzahl !== null ? (
          <>
            <span className="text-gray-600 flex-shrink-0 mx-0.5">—</span>
            <span className="text-amber-400 font-bold flex-shrink-0 tabular-nums">{knoten.anzahl}×</span>
            <span className="text-gray-400 text-xs flex-shrink-0">
              {knoten.maschine ? (maschinenLabels[knoten.maschine] ?? knoten.maschine) : ''}
            </span>
          </>
        ) : (
          <>
            <span className="text-gray-600 flex-shrink-0 mx-0.5">—</span>
            <span className={`text-xs flex-shrink-0 ${knoten.istFluid ? 'text-blue-500' : 'text-green-600'}`}>
              {knoten.istFluid ? tx.fluid : tx.rohstoff}
            </span>
          </>
        )}
      </div>

      {hatKinder && !istEingeklappt && (
        <div className="ml-4 border-l border-gray-700/60 pl-2">
          {knoten.kinder.map((kind, i) => (
            <BaumZeile
              key={`${kind.id}-${i}`}
              knoten={kind}
              sprache={sprache}
              maschinenLabels={maschinenLabels}
              eingeklappt={eingeklappt}
              onToggle={onToggle}
              tx={tx}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProduktionsBaum({ perItem, maschinenOverrides = {}, rezeptOverrides = {} }) {
  const { boni }           = useForschung();
  const { modulBoni }      = useModul();
  const { maschinenQualitaet } = useQuality();
  const { sprache }        = useSprache();

  const tx = T[sprache];
  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;
  const mQMulti = maschinenQualitaet?.maschinenMulti ?? 1;

  const [eingeklappt, setEingeklappt] = useState(new Set());

  const baeume = useMemo(() =>
    perItem
      .filter(p => p.id)
      .map(p => ({
        key:         p.key,
        id:          p.id,
        mengeProMin: p.mengeProMin,
        baum: buildBaumKnoten(
          p.id,
          (p.mengeProMin / 60) * (p.qualityFaktor ?? 1),
          rezeptOverrides,
          modulBoni,
          boni,
          mQMulti,
          maschinenOverrides,
          new Set(),
        ),
      })),
    [perItem, rezeptOverrides, modulBoni, boni, mQMulti, maschinenOverrides],
  );

  const alleIds = useMemo(() => {
    const ids = new Set();
    for (const b of baeume) if (b.baum) alleKnotenIds(b.baum, ids);
    return ids;
  }, [baeume]);

  const onToggle = id => setEingeklappt(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEingeklappt(new Set())}
          className="px-2.5 py-1 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          {tx.alleAuf}
        </button>
        <button
          onClick={() => setEingeklappt(new Set(alleIds))}
          className="px-2.5 py-1 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          {tx.alleEin}
        </button>
      </div>

      {baeume.map(b => (
        <div key={b.key}>
          {baeume.length > 1 && (
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-700">
              <Icon id={b.id} size={20} />
              <span className="text-amber-400 font-bold text-base">
                {itemName(b.id, sprache)}
              </span>
              <span className="text-gray-500 text-sm">{b.mengeProMin}/min</span>
            </div>
          )}
          {b.baum && (
            <div className="rounded-lg bg-gray-800/20 border border-gray-700/40 p-2">
              <BaumZeile
                knoten={b.baum}
                sprache={sprache}
                maschinenLabels={maschinenLabels}
                eingeklappt={eingeklappt}
                onToggle={onToggle}
                tx={tx}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
