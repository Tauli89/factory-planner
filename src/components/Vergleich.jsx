import { useState, useMemo, useRef } from 'react';
import ProduktAuswahl from './ProduktAuswahl';
import MengenEingabe from './MengenEingabe';
import ErgebnisTabelle from './ErgebnisTabelle';
import QualityAuswahl from './QualityAuswahl';
import ModulAuswahl from './ModulAuswahl';
import {
  berechneProduktion, maschinenAnzahl, berechneStromverbrauch, getVerfuegbareRezepte,
} from '../utils/berechnung';
import { REZEPTE_MAP } from '../data/recipes';
import { FOERDERBAENDER, FOERDERBAENDER_MAP } from '../data/belts';
import { useForschung } from '../context/ForschungContext';
import { useModul } from '../context/ModulContext';
import { useQuality } from '../context/QualityContext';
import { useSprache } from '../context/SprachContext';

const TX = {
  de: {
    beenden:           '✕ Vergleich beenden',
    hinzufuegen:       '+ Produkt hinzufügen',
    entfernen:         'Entfernen',
    rezept:            'Rezept',
    foerderband:       'Förderband',
    module:            'Module',
    zusammenfassung:   '⚖️ Vergleichszusammenfassung',
    maschinenGesamt:   'Maschinen gesamt',
    stromGesamt:       'Strom gesamt',
    rohstoffeRate:     'Rohstoff-Input',
    setupBUebernehmen: '↩ Setup B als aktiven Plan übernehmen',
    fazit:             'Fazit',
    setupA:            'Setup A',
    setupB:            'Setup B',
    differenz:         'Differenz (B vs A)',
    beideGleich:       'Beide Setups sind identisch.',
    bBesserMaschinen:  (n, pct) => `${n} Maschinen weniger (−${pct}%)`,
    bSchlechterMaschinen: (n, pct) => `${n} Maschinen mehr (+${pct}%)`,
    bBesserStrom:      (s, pct) => `${s} weniger Strom (−${pct}%)`,
    bSchlechterStrom:  (s, pct) => `${s} mehr Strom (+${pct}%)`,
    undText:           ' und ',
    setupBLabel:       (name) => `${name} benötigt `,
  },
  en: {
    beenden:           '✕ Exit comparison',
    hinzufuegen:       '+ Add product',
    entfernen:         'Remove',
    rezept:            'Recipe',
    foerderband:       'Belt type',
    module:            'Modules',
    zusammenfassung:   '⚖️ Comparison Summary',
    maschinenGesamt:   'Total machines',
    stromGesamt:       'Total power',
    rohstoffeRate:     'Resource input',
    setupBUebernehmen: '↩ Use Setup B as active plan',
    fazit:             'Conclusion',
    setupA:            'Setup A',
    setupB:            'Setup B',
    differenz:         'Difference (B vs A)',
    beideGleich:       'Both setups are identical.',
    bBesserMaschinen:  (n, pct) => `${n} fewer machines (−${pct}%)`,
    bSchlechterMaschinen: (n, pct) => `${n} more machines (+${pct}%)`,
    bBesserStrom:      (s, pct) => `${s} less power (−${pct}%)`,
    bSchlechterStrom:  (s, pct) => `${s} more power (+${pct}%)`,
    undText:           ' and ',
    setupBLabel:       (name) => `${name} needs `,
  },
};

function berechneKombiniert(items, modulBoni, getQualityFaktorFuerMaschine, zielQualitaet) {
  const rezeptOverrides = {};
  for (const item of items) {
    if (item.id && item.rezeptOverride) rezeptOverrides[item.id] = item.rezeptOverride;
  }
  const active = items.filter(i => i.id && i.mengeProMin > 0);
  if (!active.length) return { combined: {}, perItem: [], rezeptOverrides };
  const perItemList = active.map(item => {
    const effektivRezeptId = item.rezeptOverride ?? item.id;
    const rezept = REZEPTE_MAP[effektivRezeptId] ?? REZEPTE_MAP[item.id];
    const maschinenType = rezept?.maschine;
    const qualityFaktor = getQualityFaktorFuerMaschine(maschinenType);
    const craftingRateSek = (item.mengeProMin / 60) * qualityFaktor;
    const produktion = berechneProduktion(item.id, craftingRateSek, {}, modulBoni, rezeptOverrides);
    return { key: item.key, id: item.id, mengeProMin: item.mengeProMin, qualityFaktor, qualitaet: zielQualitaet, produktion };
  });
  const combined = {};
  for (const p of perItemList) {
    for (const [id, rate] of Object.entries(p.produktion)) {
      combined[id] = (combined[id] ?? 0) + rate;
    }
  }
  return { combined, perItem: perItemList, rezeptOverrides };
}

function SetupKonfigurator({ items, setItems, sprache, tx, keyRef }) {
  const addItem    = () => setItems(prev => [...prev, { key: keyRef.current++, id: '', mengeProMin: 60, rezeptOverride: null }]);
  const removeItem = key => setItems(prev => prev.length > 1 ? prev.filter(i => i.key !== key) : prev);
  const updateId   = (key, id) => setItems(prev => prev.map(i => i.key === key ? { ...i, id, rezeptOverride: null } : i));
  const updateMenge= (key, menge) => setItems(prev => prev.map(i => i.key === key ? { ...i, mengeProMin: menge } : i));
  const updateRezept = (key, rezeptId) => setItems(prev => prev.map(i => i.key === key ? { ...i, rezeptOverride: rezeptId } : i));

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <div key={item.key} className="flex flex-wrap gap-2 items-end p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/50">
          {items.length > 1 && (
            <span className="text-xs text-gray-500 font-mono self-center w-4 text-center">#{idx + 1}</span>
          )}
          <ProduktAuswahl ausgewaehltId={item.id} onAuswahl={id => updateId(item.key, id)} />
          {item.id && (() => {
            const rezepte = getVerfuegbareRezepte(item.id);
            if (rezepte.length <= 1) return null;
            return (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">{tx.rezept}</label>
                <select
                  value={item.rezeptOverride ?? item.id}
                  onChange={e => updateRezept(item.key, e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white text-xs rounded px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[160px]"
                >
                  {rezepte.map(r => (
                    <option key={r.id} value={r.id}>{sprache === 'de' ? r.name : r.nameEn}</option>
                  ))}
                </select>
              </div>
            );
          })()}
          <MengenEingabe wert={item.mengeProMin} onChange={m => updateMenge(item.key, m)} />
          {items.length > 1 && (
            <button
              onClick={() => removeItem(item.key)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-red-900/40 text-gray-400 hover:text-red-300 text-xs transition-colors"
            >
              {tx.entfernen}
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="self-start px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors mt-1"
      >
        {tx.hinzufuegen}
      </button>
    </div>
  );
}

function DiffBadge({ valA, valB, formatFn, lowerIsBetter = true }) {
  if (valA == null || valB == null) return null;
  const diff = valB - valA;
  if (diff === 0) return <span className="text-gray-500 text-xs ml-1">=</span>;
  const pct  = valA !== 0 ? Math.round(Math.abs(diff) / Math.abs(valA) * 100) : 0;
  const isBetter = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span className={`text-xs ml-1.5 ${isBetter ? 'text-green-500' : 'text-red-400'}`}>
      {diff > 0 ? '▲ +' : '▼ −'}{pct}%
    </span>
  );
}

function Zusammenfassung({ nameA, nameB, gesamtMaschinenA, gesamtMaschinenB, stromA, stromB, rohstoffRateA, rohstoffRateB, sprache, tx }) {
  const fmtStrom = mw => mw >= 1 ? `${mw.toFixed(2)} MW` : `${(mw * 1000).toFixed(0)} kW`;
  const fmtNum   = v => v;
  const fmtRate  = v => `${v.toFixed(1)}/min`;

  const diffMaschinen = gesamtMaschinenB - gesamtMaschinenA;
  const diffStromMW   = stromB.gesamtMW - stromA.gesamtMW;

  const fazitTeile = [];
  if (diffMaschinen !== 0 && gesamtMaschinenA > 0) {
    const pct = Math.round(Math.abs(diffMaschinen) / gesamtMaschinenA * 100);
    fazitTeile.push(diffMaschinen < 0
      ? tx.bBesserMaschinen(Math.abs(diffMaschinen), pct)
      : tx.bSchlechterMaschinen(Math.abs(diffMaschinen), pct));
  }
  if (diffStromMW !== 0 && stromA.gesamtMW > 0) {
    const pct   = Math.round(Math.abs(diffStromMW) / stromA.gesamtMW * 100);
    const str   = fmtStrom(Math.abs(diffStromMW));
    fazitTeile.push(diffStromMW < 0
      ? tx.bBesserStrom(str, pct)
      : tx.bSchlechterStrom(str, pct));
  }

  const fazitSatz = fazitTeile.length > 0
    ? tx.setupBLabel(nameB) + fazitTeile.join(tx.undText) + '.'
    : tx.beideGleich;

  return (
    <section className="bg-gray-900 rounded-xl border border-amber-500/30 p-6 mt-2">
      <h2 className="text-amber-400 font-bold text-base uppercase tracking-wide mb-5">{tx.zusammenfassung}</h2>

      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-5">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3 text-right text-blue-300">{nameA}</th>
              <th className="px-4 py-3 text-right text-purple-300">{nameB}</th>
              <th className="px-4 py-3 text-right">{tx.differenz}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-900 border-b border-gray-800">
              <td className="px-4 py-2.5 text-gray-300">{tx.maschinenGesamt}</td>
              <td className="px-4 py-2.5 text-right text-gray-200 tabular-nums">{fmtNum(gesamtMaschinenA)}</td>
              <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${diffMaschinen < 0 ? 'text-green-400' : diffMaschinen > 0 ? 'text-red-400' : 'text-gray-200'}`}>
                {fmtNum(gesamtMaschinenB)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <DiffBadge valA={gesamtMaschinenA} valB={gesamtMaschinenB} formatFn={fmtNum} lowerIsBetter />
              </td>
            </tr>
            <tr className="bg-gray-950 border-b border-gray-800">
              <td className="px-4 py-2.5 text-gray-300">{tx.stromGesamt}</td>
              <td className="px-4 py-2.5 text-right text-gray-200 tabular-nums">{fmtStrom(stromA.gesamtMW)}</td>
              <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${diffStromMW < 0 ? 'text-green-400' : diffStromMW > 0 ? 'text-red-400' : 'text-gray-200'}`}>
                {fmtStrom(stromB.gesamtMW)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <DiffBadge valA={stromA.gesamtMW} valB={stromB.gesamtMW} formatFn={fmtStrom} lowerIsBetter />
              </td>
            </tr>
            <tr className="bg-gray-900">
              <td className="px-4 py-2.5 text-gray-300">{tx.rohstoffeRate}</td>
              <td className="px-4 py-2.5 text-right text-gray-200 tabular-nums">{fmtRate(rohstoffRateA)}</td>
              <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${(rohstoffRateB - rohstoffRateA) < 0 ? 'text-green-400' : (rohstoffRateB - rohstoffRateA) > 0 ? 'text-red-400' : 'text-gray-200'}`}>
                {fmtRate(rohstoffRateB)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <DiffBadge valA={rohstoffRateA} valB={rohstoffRateB} formatFn={fmtRate} lowerIsBetter />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-sm">
        <span className="text-amber-400 font-semibold mr-2">{tx.fazit}:</span>
        <span className="text-gray-200">{fazitSatz}</span>
      </div>
    </section>
  );
}

export default function VergleichsAnsicht({ initialA, onBeenden, onSetupBUebernehmen }) {
  const { sprache }                                                        = useSprache();
  const { modulBoni }                                                      = useModul();
  const { boni }                                                           = useForschung();
  const { zielQualitaet, maschinenQualitaet, getQualityFaktorFuerMaschine } = useQuality();
  const tx = TX[sprache];

  const [nameA, setNameA] = useState(sprache === 'de' ? 'Setup A' : 'Setup A');
  const [nameB, setNameB] = useState(sprache === 'de' ? 'Setup B' : 'Setup B');

  // Setup A state
  const [itemsA, setItemsA]                             = useState(initialA.items);
  const [maschinenOverridesA, setMaschinenOverridesA]   = useState(initialA.maschinenOverrides);
  const [beaconConfigsA, setBeaconConfigsA]             = useState(initialA.beaconConfigs);
  const keyRefA = useRef(Math.max(...initialA.items.map(i => i.key), 0) + 200);

  // Setup B state (copy of A at activation)
  const [itemsB, setItemsB]                             = useState(() =>
    initialA.items.map((it, i) => ({ ...it, key: 10000 + i }))
  );
  const [maschinenOverridesB, setMaschinenOverridesB]   = useState({ ...initialA.maschinenOverrides });
  const [beaconConfigsB, setBeaconConfigsB]             = useState(JSON.parse(JSON.stringify(initialA.beaconConfigs)));
  const keyRefB = useRef(10000 + initialA.items.length + 100);

  const [bandId, setBandId]       = useState('keins');
  const [zeigeModule, setZeigeModule] = useState(false);

  const mQMulti = maschinenQualitaet?.maschinenMulti ?? 1;

  const { combined: combinedA, perItem: perItemA } = useMemo(
    () => berechneKombiniert(itemsA, modulBoni, getQualityFaktorFuerMaschine, zielQualitaet),
    [itemsA, modulBoni, getQualityFaktorFuerMaschine, zielQualitaet],
  );

  const { combined: combinedB, perItem: perItemB } = useMemo(
    () => berechneKombiniert(itemsB, modulBoni, getQualityFaktorFuerMaschine, zielQualitaet),
    [itemsB, modulBoni, getQualityFaktorFuerMaschine, zielQualitaet],
  );

  const buildAnzahlMap = (combined, maschinenOverrides, beaconConfigs) => {
    const result = {};
    for (const [id, rate] of Object.entries(combined)) {
      const rezept = REZEPTE_MAP[id];
      if (!rezept || rezept.zeit === 0) continue;
      result[id] = maschinenAnzahl(id, rate, boni, modulBoni, mQMulti, maschinenOverrides[id] ?? null, beaconConfigs[id] ?? null);
    }
    return result;
  };

  const anzahlMapA = useMemo(
    () => buildAnzahlMap(combinedA, maschinenOverridesA, beaconConfigsA),
    [combinedA, maschinenOverridesA, beaconConfigsA, boni, modulBoni, mQMulti],
  );
  const anzahlMapB = useMemo(
    () => buildAnzahlMap(combinedB, maschinenOverridesB, beaconConfigsB),
    [combinedB, maschinenOverridesB, beaconConfigsB, boni, modulBoni, mQMulti],
  );

  const aktiveMaschinenA = useMemo(() => {
    const s = new Set();
    for (const id of Object.keys(combinedA)) { const r = REZEPTE_MAP[id]; if (r?.zeit > 0) s.add(r.maschine); }
    return s;
  }, [combinedA]);

  const aktiveMaschinenB = useMemo(() => {
    const s = new Set();
    for (const id of Object.keys(combinedB)) { const r = REZEPTE_MAP[id]; if (r?.zeit > 0) s.add(r.maschine); }
    return s;
  }, [combinedB]);

  const stromA = useMemo(
    () => berechneStromverbrauch(combinedA, boni, modulBoni, mQMulti, maschinenOverridesA, beaconConfigsA),
    [combinedA, boni, modulBoni, mQMulti, maschinenOverridesA, beaconConfigsA],
  );
  const stromB = useMemo(
    () => berechneStromverbrauch(combinedB, boni, modulBoni, mQMulti, maschinenOverridesB, beaconConfigsB),
    [combinedB, boni, modulBoni, mQMulti, maschinenOverridesB, beaconConfigsB],
  );

  const gesamtMaschinenA = Object.values(anzahlMapA).reduce((s, v) => s + (v ?? 0), 0);
  const gesamtMaschinenB = Object.values(anzahlMapB).reduce((s, v) => s + (v ?? 0), 0);

  const rohstoffRateA = Object.entries(combinedA)
    .filter(([id]) => !REZEPTE_MAP[id] || REZEPTE_MAP[id].zeit === 0)
    .reduce((s, [, r]) => s + r * 60, 0);
  const rohstoffRateB = Object.entries(combinedB)
    .filter(([id]) => !REZEPTE_MAP[id] || REZEPTE_MAP[id].zeit === 0)
    .reduce((s, [, r]) => s + r * 60, 0);

  const foerderbandProp = (() => {
    const b = FOERDERBAENDER_MAP[bandId];
    return b?.id !== 'keins' ? b : null;
  })();

  const hasResultA = Object.keys(combinedA).length > 0;
  const hasResultB = Object.keys(combinedB).length > 0;
  const hasAnyMaschinen = aktiveMaschinenA.size > 0 || aktiveMaschinenB.size > 0;

  const handleSetupBUebernehmen = () => {
    onSetupBUebernehmen({
      items:               itemsB,
      maschinenOverrides:  maschinenOverridesB,
      beaconConfigs:       beaconConfigsB,
    });
  };

  const NameInput = ({ value, onChange }) => (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      maxLength={30}
      className="bg-transparent border-b border-gray-600 focus:border-amber-400 text-white font-bold text-sm px-1 py-0.5 focus:outline-none w-32"
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-amber-400 font-bold text-base uppercase tracking-wide">⚖️ {sprache === 'de' ? 'Vergleichsmodus' : 'Comparison Mode'}</span>
        <button
          onClick={onBeenden}
          className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
        >
          {tx.beenden}
        </button>
      </div>

      {/* Global settings */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{tx.foerderband}:</span>
            <select
              value={bandId}
              onChange={e => setBandId(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {FOERDERBAENDER.map(b => (
                <option key={b.id} value={b.id}>{sprache === 'de' ? b.name : b.nameEn}</option>
              ))}
            </select>
          </div>
          <QualityAuswahl />
          {hasAnyMaschinen && (
            <button
              onClick={() => setZeigeModule(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                zeigeModule
                  ? 'bg-green-500/20 text-green-300 border-green-500/40'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
              }`}
            >
              ⚙ {tx.module}
            </button>
          )}
        </div>
        {zeigeModule && (
          <div className="mt-4">
            <ModulAuswahl aktiveMaschinen={new Set([...aktiveMaschinenA, ...aktiveMaschinenB])} />
          </div>
        )}
      </section>

      {/* Two-column layout */}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))' }}>
        {/* Setup A */}
        <div className="flex flex-col gap-4">
          <section className="bg-gray-900 rounded-xl border border-blue-500/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
              <NameInput value={nameA} onChange={setNameA} />
            </div>
            <SetupKonfigurator
              items={itemsA}
              setItems={setItemsA}
              sprache={sprache}
              tx={tx}
              keyRef={keyRefA}
            />
          </section>
          {hasResultA && (
            <section className="bg-gray-900 rounded-xl border border-blue-500/20 p-5">
              <ErgebnisTabelle
                produktion={combinedA}
                perItem={perItemA}
                foerderband={foerderbandProp}
                maschinenOverrides={maschinenOverridesA}
                onMaschinenOverrideChange={(id, mid) => setMaschinenOverridesA(prev => ({ ...prev, [id]: mid }))}
                beaconConfigs={beaconConfigsA}
                onBeaconConfigChange={(id, cfg) => setBeaconConfigsA(prev => ({ ...prev, [id]: cfg }))}
                diffMap={anzahlMapB}
              />
            </section>
          )}
        </div>

        {/* Setup B */}
        <div className="flex flex-col gap-4">
          <section className="bg-gray-900 rounded-xl border border-purple-500/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-purple-400 flex-shrink-0" />
              <NameInput value={nameB} onChange={setNameB} />
            </div>
            <SetupKonfigurator
              items={itemsB}
              setItems={setItemsB}
              sprache={sprache}
              tx={tx}
              keyRef={keyRefB}
            />
          </section>
          {hasResultB && (
            <section className="bg-gray-900 rounded-xl border border-purple-500/20 p-5">
              <ErgebnisTabelle
                produktion={combinedB}
                perItem={perItemB}
                foerderband={foerderbandProp}
                maschinenOverrides={maschinenOverridesB}
                onMaschinenOverrideChange={(id, mid) => setMaschinenOverridesB(prev => ({ ...prev, [id]: mid }))}
                beaconConfigs={beaconConfigsB}
                onBeaconConfigChange={(id, cfg) => setBeaconConfigsB(prev => ({ ...prev, [id]: cfg }))}
                diffMap={anzahlMapA}
              />
            </section>
          )}
        </div>
      </div>

      {/* Summary + take over button */}
      {(hasResultA || hasResultB) && (
        <>
          <Zusammenfassung
            nameA={nameA}
            nameB={nameB}
            gesamtMaschinenA={gesamtMaschinenA}
            gesamtMaschinenB={gesamtMaschinenB}
            stromA={stromA}
            stromB={stromB}
            rohstoffRateA={rohstoffRateA}
            rohstoffRateB={rohstoffRateB}
            sprache={sprache}
            tx={tx}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSetupBUebernehmen}
              className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-sm font-medium transition-colors"
            >
              {tx.setupBUebernehmen}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
