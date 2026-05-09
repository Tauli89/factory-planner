import { useState, useMemo } from 'react';
import { useSprache } from '../context/SprachContext';
import { useForschung } from '../context/ForschungContext';
import { REZEPTE, REZEPTE_MAP, KATEGORIEN, KATEGORIEN_EN_LABEL } from '../data/recipes';
import { DURCH_TECH_GESPERRTE_REZEPTE } from '../data/gamedata-adapter';
import { MODULE_MAP, MODUL_ICON_PATH } from '../data/modules';
import { MASCHINEN_LABEL, MASCHINEN_LABEL_EN, berechneProduktion } from '../utils/berechnung';
import {
  OPTIMIERUNGSZIELE,
  ZIEL_LABELS,
  optimiereModuleAllZiele,
  empfehlungenZuModulBoniAllZiele,
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

const ZIEL_ORDER = [
  OPTIMIERUNGSZIELE.MAX_OUTPUT,
  OPTIMIERUNGSZIELE.MIN_RESSOURCEN,
  OPTIMIERUNGSZIELE.MIN_STROM,
  OPTIMIERUNGSZIELE.BESTE_KOMBI,
];

const T = {
  de: {
    titel:           'Modul-Optimierung',
    untertitel:      'Beste Modul-Kombination für alle Ziele auf einen Blick – inkl. gemischter Module.',
    produkt:         'Produkt auswählen',
    produktPH:       '-- Produkt wählen --',
    berechnen:       'Optimierung berechnen',
    empfehlung:      'Modul-Empfehlungen nach Maschinentyp',
    maschine:        'Maschinentyp',
    slots:           'Slots',
    vergleich:       'Vergleich: Kein Modul vs. Beste Gesamtkombination',
    keinModul:       'Kein Modul',
    keineModulSlots: 'Keine Slots',
    keineAenderung:  'keine Änd.',
    keineRezepte:    'Kein Rezept in dieser Kette nutzt Module.',
    hinweis:         'Wähle ein Produkt und klicke „Optimierung berechnen".',
    output:          'Output',
    ressourcen:      'Ressourcen',
    strom:           'Strom/Output',
    rohstoffBedarf:  'Rohstoffbedarf',
    stromBedarf:     'Strom/Item',
    besser:          'besser',
    schlechter:      'schlechter',
    unveraendert:    'unverändert',
  },
  en: {
    titel:           'Module Optimizer',
    untertitel:      'Best module combination for all goals at a glance – including mixed modules.',
    produkt:         'Select product',
    produktPH:       '-- Select product --',
    berechnen:       'Calculate optimization',
    empfehlung:      'Module recommendations by machine type',
    maschine:        'Machine type',
    slots:           'Slots',
    vergleich:       'Comparison: No modules vs. Best overall combination',
    keinModul:       'No modules',
    keineModulSlots: 'No slots',
    keineAenderung:  'no change',
    keineRezepte:    'No recipe in this chain supports modules.',
    hinweis:         'Select a product and click "Calculate optimization".',
    output:          'Output',
    ressourcen:      'Resources',
    strom:           'Power/Output',
    rohstoffBedarf:  'Resource demand',
    stromBedarf:     'Power/item',
    besser:          'better',
    schlechter:      'worse',
    unveraendert:    'unchanged',
  },
};

function formatDelta(value, tx, invertColors = false) {
  if (Math.abs(value) < 0.001) return <span className="text-gray-500 text-xs">{tx.keineAenderung}</span>;
  const pct      = (value * 100).toFixed(1);
  const positive = value > 0;
  const good     = invertColors ? !positive : positive;
  return (
    <span className={`text-xs font-semibold ${good ? 'text-green-400' : 'text-red-400'}`}>
      {positive ? '+' : ''}{pct}%
    </span>
  );
}

function ModulMixIcons({ modulMix, keinModulText }) {
  if (!modulMix || modulMix.length === 0) {
    return <span className="text-gray-600 italic text-xs">{keinModulText}</span>;
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {modulMix.map(({ modulId, anzahl }, i) => {
        const src  = MODUL_ICON_PATH[modulId];
        const modul = MODULE_MAP[modulId];
        const tip  = modul ? `${anzahl}× ${modul.name}` : modulId;
        return (
          <div key={i} className="flex items-center gap-0.5" title={tip}>
            {i > 0 && <span className="text-gray-700 text-xs px-0.5">+</span>}
            <span className="text-amber-400 text-[11px] font-mono leading-none">{anzahl}×</span>
            {src ? (
              <img src={src} alt={modulId} className="w-5 h-5 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <span className="text-gray-400 text-xs">{modulId}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ZielCell({ rec, ziel, tx, invertFor }) {
  if (!rec) return <td className="py-2 px-3 text-gray-600 text-xs">—</td>;

  const { modulMix, metrik } = rec;
  const empty = !modulMix || modulMix.length === 0;

  const primaryDelta = (() => {
    switch (ziel) {
      case OPTIMIERUNGSZIELE.MAX_OUTPUT:
        return { val: metrik.outputFactor - 1, inv: false };
      case OPTIMIERUNGSZIELE.MIN_RESSOURCEN:
        return { val: metrik.ingredientFactor - 1, inv: true };
      case OPTIMIERUNGSZIELE.MIN_STROM:
        return { val: metrik.energyPerOutputFactor - 1, inv: true };
      case OPTIMIERUNGSZIELE.BESTE_KOMBI:
        return { val: metrik.outputFactor - 1, inv: false };
      default:
        return { val: 0, inv: false };
    }
  })();

  return (
    <td className="py-2.5 px-3 align-top">
      {empty ? (
        <span className="text-gray-600 italic text-xs">{tx.keinModul}</span>
      ) : (
        <div className="flex flex-col gap-1">
          <ModulMixIcons modulMix={modulMix} keinModulText={tx.keinModul} />
          {formatDelta(primaryDelta.val, tx, primaryDelta.inv)}
        </div>
      )}
    </td>
  );
}

export default function ModulOptimierung() {
  const { sprache }              = useSprache();
  const { freigeschalteteRezepte } = useForschung();
  const tx = T[sprache];

  const [produktId, setProduktId] = useState('');
  const [ergebnisse, setErgebnisse] = useState(null);

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
    setErgebnisse(optimiereModuleAllZiele(produktId));
  }

  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;
  const zielLabelMap    = ZIEL_LABELS[sprache];

  const vergleich = useMemo(() => {
    if (!ergebnisse) return null;
    const boniOptimiert = empfehlungenZuModulBoniAllZiele(ergebnisse, OPTIMIERUNGSZIELE.BESTE_KOMBI);
    const prodOhne = berechneProduktion(produktId, 1, {}, {});
    const prodMit  = berechneProduktion(produktId, 1, {}, boniOptimiert);

    function rohstoffSumme(prod) {
      return Object.entries(prod)
        .filter(([id]) => !REZEPTE_MAP[id] || REZEPTE_MAP[id].zeit === 0)
        .reduce((sum, [, rate]) => sum + rate, 0);
    }

    const rohstoffeOhne = rohstoffSumme(prodOhne);
    const rohstoffeMit  = rohstoffSumme(prodMit);

    let outputTotal = 0, energyTotal = 0, count = 0;
    for (const [, { ziele }] of ergebnisse) {
      const rec = ziele[OPTIMIERUNGSZIELE.BESTE_KOMBI];
      if (rec) {
        outputTotal += rec.metrik.outputFactor;
        energyTotal += rec.metrik.energyPerOutputFactor;
        count++;
      }
    }

    return {
      outputDelta:     count > 0 ? (outputTotal / count) - 1 : 0,
      ressourcenDelta: rohstoffeOhne > 0 ? (rohstoffeMit - rohstoffeOhne) / rohstoffeOhne : 0,
      energieDelta:    count > 0 ? (energyTotal / count) - 1 : 0,
    };
  }, [ergebnisse, produktId]);

  const hatErgebnisse = ergebnisse && ergebnisse.size > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wide mb-1">{tx.titel}</h2>
        <p className="text-gray-400 text-sm mb-5">{tx.untertitel}</p>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-amber-300">{tx.produkt}</label>
            <select
              value={produktId}
              onChange={e => { setProduktId(e.target.value); setErgebnisse(null); }}
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

          <button
            onClick={berechnen}
            disabled={!produktId}
            className="py-2 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold text-sm transition-colors"
          >
            {tx.berechnen}
          </button>
        </div>
      </section>

      {!ergebnisse && (
        <div className="text-center text-gray-600 mt-8 text-lg">{tx.hinweis}</div>
      )}

      {ergebnisse && !hatErgebnisse && (
        <div className="text-center text-gray-500 mt-8">{tx.keineRezepte}</div>
      )}

      {hatErgebnisse && (
        <>
          {/* All-goals table */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-4">{tx.empfehlung}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                    <th className="pb-2.5 pr-4 font-semibold">{tx.maschine}</th>
                    <th className="pb-2.5 pr-3 font-semibold text-center w-10">{tx.slots}</th>
                    {ZIEL_ORDER.map(z => (
                      <th key={z} className="pb-2.5 px-3 font-semibold text-amber-300/80">{zielLabelMap[z]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {[...ergebnisse.entries()].map(([maschinenType, { maxSlots, ziele }]) => (
                    <tr key={maschinenType} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 pr-4 text-gray-200 font-medium whitespace-nowrap">
                        {maschinenLabels[maschinenType] ?? maschinenType}
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        {maxSlots === 0
                          ? <span className="text-gray-600 text-xs">{tx.keineModulSlots}</span>
                          : <span className="text-gray-400 text-xs">{maxSlots}</span>
                        }
                      </td>
                      {ZIEL_ORDER.map(z => (
                        <ZielCell key={z} rec={ziele[z]} ziel={z} tx={tx} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Comparison (BESTE_KOMBI) */}
          {vergleich && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-4">{tx.vergleich}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CompareCard label={tx.output}       delta={vergleich.outputDelta}     invertColors={false} tx={tx} />
                <CompareCard label={tx.rohstoffBedarf} delta={vergleich.ressourcenDelta} invertColors={true}  tx={tx} />
                <CompareCard label={tx.stromBedarf}  delta={vergleich.energieDelta}    invertColors={true}  tx={tx} />
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
  const colorBg   = isNeutral ? 'bg-gray-800 border-gray-700'
    : good ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30';
  const colorText = isNeutral ? 'text-gray-400' : good ? 'text-green-400' : 'text-red-400';
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
