import { useState, useMemo } from 'react';
import { useSprache } from '../context/SprachContext';
import { useForschung } from '../context/ForschungContext';
import { REZEPTE, REZEPTE_MAP, KATEGORIEN, KATEGORIEN_EN_LABEL } from '../data/recipes';
import { DURCH_TECH_GESPERRTE_REZEPTE } from '../data/research';
import { MODULE_MAP, MODUL_SLOTS } from '../data/modules';
import { MASCHINEN_LABEL, MASCHINEN_LABEL_EN, berechneProduktion } from '../utils/berechnung';
import {
  OPTIMIERUNGSZIELE,
  ZIEL_LABELS,
  ZIEL_BESCHREIBUNG,
  optimiereModule,
  empfehlungenZuModulBoni,
} from '../utils/modulOptimierung';

const KATEGORIE_REIHENFOLGE = [
  KATEGORIEN.SCIENCE,
  KATEGORIEN.ZWISCHENPRODUKTE,
  KATEGORIEN.LOGISTIK,
  KATEGORIEN.MASCHINEN_BAU,
  KATEGORIEN.ENERGIE,
  KATEGORIEN.NUKLEAR,
  KATEGORIEN.MILITAER,
  KATEGORIEN.MODULE,
  KATEGORIEN.OELVERARBEITUNG,
  KATEGORIEN.RAKETE,
  KATEGORIEN.SPACE_AGE,
];

const T = {
  de: {
    titel:           'Modul-Optimierung',
    untertitel:      'Finde automatisch die beste Modul-Kombination für dein Ziel.',
    produkt:         'Produkt auswählen',
    produktPH:       '-- Produkt wählen --',
    ziel:            'Optimierungsziel',
    berechnen:       'Optimierung berechnen',
    empfehlung:      'Empfehlung',
    maschine:        'Maschinentyp',
    modul:           'Empfohlenes Modul',
    slots:           'Slots',
    output:          'Output',
    ressourcen:      'Ressourcen',
    strom:           'Strom/Output',
    vergleich:       'Vergleich: Kein Modul vs. Optimiert',
    keinModul:       'Kein Modul',
    optimiert:       'Optimiert',
    itemProMin:      'Items/Min',
    rohstoffBedarf:  'Rohstoffbedarf',
    stromBedarf:     'Strom/Item',
    keineModulSlots: 'Keine Modulslots',
    keineAenderung:  'Keine Änderung',
    keineRezepte:    'Kein Rezept in dieser Kette nutzt Module.',
    hinweis:         'Wähle ein Produkt und ein Ziel, dann klicke „Optimierung berechnen".',
    zusammenfassung: 'Gesamteffekt (gewichtet)',
    besser:          'besser',
    schlechter:      'schlechter',
    unveraendert:    'unverändert',
  },
  en: {
    titel:           'Module Optimizer',
    untertitel:      'Automatically find the best module combination for your goal.',
    produkt:         'Select product',
    produktPH:       '-- Select product --',
    ziel:            'Optimization goal',
    berechnen:       'Calculate optimization',
    empfehlung:      'Recommendation',
    maschine:        'Machine type',
    modul:           'Recommended module',
    slots:           'Slots',
    output:          'Output',
    ressourcen:      'Resources',
    strom:           'Power/Output',
    vergleich:       'Comparison: No modules vs. Optimized',
    keinModul:       'No modules',
    optimiert:       'Optimized',
    itemProMin:      'Items/min',
    rohstoffBedarf:  'Resource demand',
    stromBedarf:     'Power/item',
    keineModulSlots: 'No module slots',
    keineAenderung:  'No change',
    keineRezepte:    'No recipe in this chain supports modules.',
    hinweis:         'Select a product and a goal, then click "Calculate optimization".',
    zusammenfassung: 'Overall effect (weighted)',
    besser:          'better',
    schlechter:      'worse',
    unveraendert:    'unchanged',
  },
};

function formatDelta(value, tx, invertColors = false) {
  if (Math.abs(value) < 0.001) return <span className="text-gray-400">{tx.keineAenderung}</span>;
  const pct     = (value * 100).toFixed(1);
  const positive = value > 0;
  const good     = invertColors ? !positive : positive;
  return (
    <span className={good ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
      {positive ? '+' : ''}{pct}%
    </span>
  );
}

function MetrikBadge({ label, delta, invertColors = false }) {
  const isNeutral = Math.abs(delta) < 0.001;
  const positive  = delta > 0;
  const good      = invertColors ? !positive : positive;
  const color     = isNeutral
    ? 'bg-gray-700 text-gray-400 border-gray-600'
    : good
      ? 'bg-green-900/30 text-green-300 border-green-700/40'
      : 'bg-red-900/30 text-red-300 border-red-700/40';
  const pct = isNeutral ? '±0 %' : `${positive ? '+' : ''}${(delta * 100).toFixed(1)} %`;

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${color}`}>
      {label}: {pct}
    </span>
  );
}

export default function ModulOptimierung() {
  const { sprache }              = useSprache();
  const { freigeschalteteRezepte } = useForschung();
  const tx = T[sprache];

  const [produktId, setProduktId]   = useState('');
  const [ziel, setZiel]             = useState(OPTIMIERUNGSZIELE.MAX_OUTPUT);
  const [ergebnis, setErgebnis]     = useState(null);

  const herstellbar = useMemo(() => REZEPTE.filter(r => {
    if (r.zeit === 0) return false;
    if (!DURCH_TECH_GESPERRTE_REZEPTE.has(r.id)) return true;
    return freigeschalteteRezepte.has(r.id);
  }), [freigeschalteteRezepte]);

  const nachKategorie = useMemo(() =>
    KATEGORIE_REIHENFOLGE
      .map(kat => ({ kat, rezepte: herstellbar.filter(r => r.kategorie === kat) }))
      .filter(g => g.rezepte.length > 0),
    [herstellbar]
  );

  function berechnen() {
    if (!produktId) return;
    const empfehlungen = optimiereModule(produktId, ziel);
    setErgebnis({ produktId, ziel, empfehlungen });
  }

  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;
  const zielLabelMap    = ZIEL_LABELS[sprache];
  const zielBeschreibung = ZIEL_BESCHREIBUNG[sprache];

  // Comparison: items/min with & without modules for the selected product
  const vergleich = useMemo(() => {
    if (!ergebnis || !ergebnis.empfehlungen) return null;
    const mengeProSek = 1; // normalized to 1/s for percentage comparison

    const boniOptimiert = empfehlungenZuModulBoni(ergebnis.empfehlungen);
    const prodOhne  = berechneProduktion(ergebnis.produktId, mengeProSek, {}, {});
    const prodMit   = berechneProduktion(ergebnis.produktId, mengeProSek, {}, boniOptimiert);

    // Total raw resources needed (leaf nodes = items without a recipe)
    function rohstoffSumme(prod) {
      return Object.entries(prod)
        .filter(([id]) => !REZEPTE_MAP[id] || REZEPTE_MAP[id].zeit === 0)
        .reduce((sum, [, rate]) => sum + rate, 0);
    }

    const rohstoffeOhne = rohstoffSumme(prodOhne);
    const rohstoffeMit  = rohstoffSumme(prodMit);

    // Weighted energy per output across all machines
    function energieSumme(empfehlungen) {
      if (!empfehlungen) return 1;
      let total = 0;
      for (const [, rec] of empfehlungen) {
        total += rec.metrik.energyPerOutputFactor;
      }
      return empfehlungen.size > 0 ? total / empfehlungen.size : 1;
    }

    const energieOhne = 1;
    const energieMit  = energieSumme(ergebnis.empfehlungen);

    // Output factor: weighted average of all machine outputFactors in chain
    function outputSumme(empfehlungen) {
      if (!empfehlungen) return 1;
      let total = 0;
      for (const [, rec] of empfehlungen) {
        total += rec.metrik.outputFactor;
      }
      return empfehlungen.size > 0 ? total / empfehlungen.size : 1;
    }

    return {
      outputDelta:    outputSumme(ergebnis.empfehlungen) - 1,
      ressourcenDelta: rohstoffeOhne > 0 ? (rohstoffeMit - rohstoffeOhne) / rohstoffeOhne : 0,
      energieDelta:   energieMit - energieOhne,
    };
  }, [ergebnis]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wide mb-1">
          {tx.titel}
        </h2>
        <p className="text-gray-400 text-sm mb-5">{tx.untertitel}</p>

        <div className="flex flex-wrap gap-5 items-end">
          {/* Product selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-amber-300">{tx.produkt}</label>
            <select
              value={produktId}
              onChange={e => { setProduktId(e.target.value); setErgebnis(null); }}
              className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-xs"
            >
              <option value="">{tx.produktPH}</option>
              {nachKategorie.map(({ kat, rezepte }) => {
                const katLabel = sprache === 'de' ? kat : (KATEGORIEN_EN_LABEL[kat] ?? kat);
                return (
                  <optgroup key={kat} label={katLabel}>
                    {rezepte.map(r => (
                      <option key={r.id} value={r.id}>
                        {sprache === 'de' ? r.name : r.nameEn}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Goal selector */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-56">
            <label className="text-sm font-semibold text-amber-300">{tx.ziel}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(OPTIMIERUNGSZIELE).map(z => (
                <button
                  key={z}
                  onClick={() => { setZiel(z); setErgebnis(null); }}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    ziel === z
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">{zielLabelMap[z]}</div>
                  {ziel === z && (
                    <div className="text-xs text-amber-200/70 mt-0.5">{zielBeschreibung[z]}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={berechnen}
            disabled={!produktId}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold text-sm transition-colors"
          >
            {tx.berechnen}
          </button>
        </div>
      </section>

      {/* Results */}
      {!ergebnis && (
        <div className="text-center text-gray-600 mt-8 text-lg">{tx.hinweis}</div>
      )}

      {ergebnis && ergebnis.empfehlungen && (
        <>
          {/* Machine recommendation table */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-4">
              {tx.empfehlung} — {zielLabelMap[ergebnis.ziel]}
            </h3>

            {ergebnis.empfehlungen.size === 0 ? (
              <p className="text-gray-500 text-sm">{tx.keineRezepte}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-700">
                      <th className="pb-2 pr-4 font-semibold">{tx.maschine}</th>
                      <th className="pb-2 pr-4 font-semibold">{tx.modul}</th>
                      <th className="pb-2 pr-4 font-semibold text-right">{tx.slots}</th>
                      <th className="pb-2 pr-4 font-semibold text-right">{tx.output}</th>
                      <th className="pb-2 pr-4 font-semibold text-right">{tx.ressourcen}</th>
                      <th className="pb-2 font-semibold text-right">{tx.strom}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[...ergebnis.empfehlungen.entries()].map(([maschinenType, rec]) => {
                      const modul     = MODULE_MAP[rec.modulId];
                      const maxSlots  = MODUL_SLOTS[maschinenType] ?? 0;
                      const modulName = modul?.id === 'keins' ? tx.keinModul
                        : (sprache === 'de' ? modul?.name : modul?.nameEn) ?? tx.keinModul;
                      const { outputFactor, ingredientFactor, energyPerOutputFactor } = rec.metrik;

                      return (
                        <tr key={maschinenType} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-2.5 pr-4 text-gray-200 font-medium">
                            {maschinenLabels[maschinenType] ?? maschinenType}
                          </td>
                          <td className="py-2.5 pr-4">
                            {rec.modulId === 'keins' ? (
                              <span className="text-gray-500 italic">{tx.keinModul}</span>
                            ) : (
                              <span className="text-white">{modulName}</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {rec.anzahl > 0 ? (
                              <span className="text-gray-300">{rec.anzahl} / {maxSlots}</span>
                            ) : (
                              maxSlots === 0
                                ? <span className="text-gray-600">{tx.keineModulSlots}</span>
                                : <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {formatDelta(outputFactor - 1, tx)}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {formatDelta(ingredientFactor - 1, tx, true)}
                          </td>
                          <td className="py-2.5 text-right">
                            {formatDelta(energyPerOutputFactor - 1, tx, true)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Summary comparison */}
          {vergleich && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-4">
                {tx.vergleich}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CompareCard
                  label={tx.output}
                  delta={vergleich.outputDelta}
                  invertColors={false}
                  tx={tx}
                />
                <CompareCard
                  label={tx.rohstoffBedarf}
                  delta={vergleich.ressourcenDelta}
                  invertColors={true}
                  tx={tx}
                />
                <CompareCard
                  label={tx.stromBedarf}
                  delta={vergleich.energieDelta}
                  invertColors={true}
                  tx={tx}
                />
              </div>

              {/* Module legend per machine */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[...ergebnis.empfehlungen.entries()]
                  .filter(([, rec]) => rec.modulId !== 'keins' && rec.anzahl > 0)
                  .map(([maschinenType, rec]) => {
                    const modul = MODULE_MAP[rec.modulId];
                    const name  = sprache === 'de' ? modul?.name : modul?.nameEn;
                    return (
                      <span
                        key={maschinenType}
                        className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300"
                      >
                        <span className="text-amber-400">{maschinenLabels[maschinenType] ?? maschinenType}</span>
                        {' → '}{rec.anzahl}× {name}
                      </span>
                    );
                  })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CompareCard({ label, delta, invertColors, tx }) {
  const isNeutral = Math.abs(delta) < 0.001;
  const positive  = delta > 0;
  const good      = invertColors ? !positive : positive;

  const colorBg  = isNeutral ? 'bg-gray-800 border-gray-700'
    : good ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30';
  const colorText = isNeutral ? 'text-gray-400'
    : good ? 'text-green-400' : 'text-red-400';
  const verdict   = isNeutral ? tx.unveraendert : good ? tx.besser : tx.schlechter;
  const pct       = isNeutral ? '±0 %' : `${positive ? '+' : ''}${(delta * 100).toFixed(1)} %`;

  return (
    <div className={`rounded-lg border p-4 ${colorBg}`}>
      <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-2xl font-bold ${colorText}`}>{pct}</div>
      <div className={`text-xs mt-1 ${colorText}`}>{verdict}</div>
    </div>
  );
}
