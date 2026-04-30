import { useState, useMemo } from 'react';
import { useSprache } from '../context/SprachContext';
import { QUALITAETEN, QUALITAETEN_MAP, qualityWahrscheinlichkeit, formatQualityFaktor } from '../data/quality';

const MODULE_TIERS = [
  { id: 'q1', label: 'Quality 1', chance: 0.01 },
  { id: 'q2', label: 'Quality 2', chance: 0.02 },
  { id: 'q3', label: 'Quality 3', chance: 0.025 },
];

const T = {
  de: {
    titel:         'Qualitäts-Rechner',
    untertitel:    'Berechne Wahrscheinlichkeiten und Erwartungswerte für das Quality-System.',
    konfiguration: 'Konfiguration',
    modulTyp:      'Modul-Typ',
    anzahlModule:  'Anzahl Quality-Module',
    maschinenQ:    'Maschinenqualität',
    zielQ:         'Ziel-Qualität',
    chanceJeSlot:  'Chance pro Slot',
    gesamtChance:  'Gesamt Quality-Chance',
    ergebnisse:    'Wahrscheinlichkeiten',
    stufe:         'Qualitätsstufe',
    wahrsch:       'Wahrscheinlichkeit',
    erwartung:     'Erwartungswert (Inputs)',
    recyclerLoop:  'mit Recycler-Loop',
    recyclerHint:  'Recycler gibt 25% der Zutaten zurück (gleiche Qualität)',
    empfehlung:    'Empfehlung für Ziel',
    empfehlungText: (slots, qual, ziel) =>
      `${slots}× Quality-${qual} in der Maschine: Wahrscheinlichkeit für ${ziel} erhöht sich entsprechend der Modul-Konfiguration.`,
    topfStrategie: 'Strategie für Legendary',
    strategie1:    'Für Legendary: Max. Quality-Module-3 in alle Slots',
    strategie2:    'Maschinen höherer Qualität erhöhen die Modul-Effektivität',
    strategie3:    'Recycler-Loop: Sub-Legendary Ergebnisse recyceln (×0.25) und neu craften',
    strategie4:    'Epic-Maschinen mit Quality-3-Modulen: optimales Verhältnis',
  },
  en: {
    titel:         'Quality Calculator',
    untertitel:    'Calculate probabilities and expected values for the quality system.',
    konfiguration: 'Configuration',
    modulTyp:      'Module type',
    anzahlModule:  'Number of quality modules',
    maschinenQ:    'Machine quality',
    zielQ:         'Target quality',
    chanceJeSlot:  'Chance per slot',
    gesamtChance:  'Total quality chance',
    ergebnisse:    'Probabilities',
    stufe:         'Quality tier',
    wahrsch:       'Probability',
    erwartung:     'Expected value (inputs)',
    recyclerLoop:  'with recycler loop',
    recyclerHint:  'Recycler returns 25% of ingredients (same quality)',
    empfehlung:    'Recommendation for target',
    empfehlungText: (slots, qual, ziel) =>
      `${slots}× Quality-${qual} in the machine: probability for ${ziel} scales with module configuration.`,
    topfStrategie: 'Strategy for Legendary',
    strategie1:    'For Legendary: max Quality-Module-3 in all slots',
    strategie2:    'Higher quality machines amplify module effectiveness',
    strategie3:    'Recycler loop: recycle sub-legendary outputs (×0.25) and re-craft',
    strategie4:    'Epic machines + Quality-3 modules: optimal ratio',
  },
};

const Q_FARBE = {
  normal:    { text: '#8a8278',  bg: 'rgba(90,90,90,0.15)',    border: '#5a5a5a' },
  uncommon:  { text: '#5dbf3c',  bg: 'rgba(93,191,60,0.12)',   border: '#4a8a30' },
  rare:      { text: '#5090f0',  bg: 'rgba(80,144,240,0.12)',  border: '#305090' },
  epic:      { text: '#c070e8',  bg: 'rgba(192,112,232,0.12)', border: '#804090' },
  legendary: { text: '#f0b070',  bg: 'rgba(240,176,112,0.15)', border: '#c07030' },
};

function expectedWithRecycler(pTarget) {
  if (pTarget <= 0) return Infinity;
  const r = 0.25;
  return (1 - (1 - pTarget) * r) / pTarget;
}

export default function QualityRechner() {
  const { sprache } = useSprache();
  const tx = T[sprache];

  const [modulTierId,   setModulTierId]   = useState('q3');
  const [anzahlModule,  setAnzahlModule]  = useState(4);
  const [maschinenQId,  setMaschinenQId]  = useState('normal');
  const [zielQId,       setZielQId]       = useState('legendary');

  const modul          = MODULE_TIERS.find(m => m.id === modulTierId) ?? MODULE_TIERS[2];
  const maschinenQ     = QUALITAETEN_MAP[maschinenQId];
  const zielQ          = QUALITAETEN_MAP[zielQId];

  const gesamtChance = useMemo(() => {
    const raw = anzahlModule * modul.chance;
    return raw * maschinenQ.qualityModulMulti;
  }, [anzahlModule, modul, maschinenQ]);

  const probs = useMemo(() =>
    QUALITAETEN.map(q => ({
      ...q,
      prob: q.tierIndex === 0
        ? Math.max(0, 1 - QUALITAETEN.slice(1).reduce((s, qq) => s + qualityWahrscheinlichkeit(gesamtChance, qq.tierIndex), 0))
        : qualityWahrscheinlichkeit(gesamtChance, q.tierIndex),
    })),
    [gesamtChance]
  );

  const zielProb = useMemo(
    () => qualityWahrscheinlichkeit(gesamtChance, zielQ.tierIndex),
    [gesamtChance, zielQ]
  );
  const erwartungOhne    = zielQ.tierIndex === 0 ? 1 : (zielProb > 0 ? 1 / zielProb : Infinity);
  const erwartungMitLoop = zielQ.tierIndex <= 1  ? erwartungOhne : expectedWithRecycler(zielProb);

  const maxProb = Math.max(...probs.map(p => p.prob));

  const selectClass = 'bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wide mb-1">{tx.titel}</h2>
        <p className="text-gray-400 text-sm mb-5">{tx.untertitel}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {/* Module type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wide">{tx.modulTyp}</label>
            <select value={modulTierId} onChange={e => setModulTierId(e.target.value)} className={selectClass}>
              {MODULE_TIERS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label} (+{(m.chance * 100).toFixed(1)}%/Slot)
                </option>
              ))}
            </select>
          </div>

          {/* Module count */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
              {tx.anzahlModule}: <span className="text-white">{anzahlModule}</span>
            </label>
            <input
              type="range"
              min={0}
              max={12}
              value={anzahlModule}
              onChange={e => setAnzahlModule(Number(e.target.value))}
              className="w-full accent-amber-400 mt-1"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span><span>4</span><span>8</span><span>12</span>
            </div>
          </div>

          {/* Machine quality */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wide">{tx.maschinenQ}</label>
            <select value={maschinenQId} onChange={e => setMaschinenQId(e.target.value)} className={selectClass}>
              {QUALITAETEN.map(q => (
                <option key={q.id} value={q.id}>
                  {q.icon} {sprache === 'de' ? q.name : q.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Target quality */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wide">{tx.zielQ}</label>
            <select value={zielQId} onChange={e => setZielQId(e.target.value)} className={selectClass}>
              {QUALITAETEN.map(q => (
                <option key={q.id} value={q.id}>
                  {q.icon} {sprache === 'de' ? q.name : q.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary badges */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-sm">
            <span className="text-gray-400">{tx.chanceJeSlot}:</span>
            <span className="text-amber-300 font-bold">+{(modul.chance * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-sm">
            <span className="text-gray-400">{tx.gesamtChance}:</span>
            <span className="text-amber-300 font-bold">
              {(gesamtChance * 100).toFixed(2)}%
              {maschinenQ.qualityModulMulti > 1 && (
                <span className="text-green-400 text-xs ml-1">×{maschinenQ.qualityModulMulti}</span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Probability table */}
      <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-4">{tx.ergebnisse}</h3>
        <div className="space-y-3">
          {probs.map(q => {
            const farbe     = Q_FARBE[q.id];
            const pct       = (q.prob * 100);
            const barWidth  = maxProb > 0 ? (q.prob / maxProb) * 100 : 0;
            const isZiel    = q.id === zielQId;
            const erwOhne   = q.tierIndex === 0 ? 1 : (q.prob > 0 ? 1 / q.prob : Infinity);
            const erwMit    = q.tierIndex <= 1 ? erwOhne : expectedWithRecycler(q.prob);

            const fmtNum = (n) => {
              if (!isFinite(n) || n > 1e8) return '∞';
              if (n >= 10000) return `~${Math.round(n / 1000)}k`;
              if (n >= 1000)  return `~${Math.round(n)}`;
              if (n >= 10)    return `~${Math.round(n)}`;
              return `~${n.toFixed(1)}`;
            };

            return (
              <div
                key={q.id}
                style={{
                  background: isZiel ? farbe.bg : 'transparent',
                  border: `1px solid ${isZiel ? farbe.border : '#3d3d3d'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">
                    <span style={{ color: farbe.text, fontWeight: isZiel ? 700 : 500, fontSize: 13 }}>
                      {q.icon} {sprache === 'de' ? q.name : q.nameEn}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        background: farbe.text,
                        borderRadius: '100px',
                        transition: 'width 0.3s ease',
                        opacity: 0.85,
                      }}
                    />
                  </div>

                  <div className="w-24 text-right flex-shrink-0">
                    <span style={{ color: farbe.text, fontWeight: 600, fontSize: 14 }}>
                      {pct >= 1 ? pct.toFixed(2) : pct >= 0.01 ? pct.toFixed(4) : pct.toFixed(6)}%
                    </span>
                  </div>

                  <div className="w-32 text-right flex-shrink-0 text-xs text-gray-400">
                    {q.tierIndex > 0 && (
                      <>
                        <span className="text-gray-300">{fmtNum(erwOhne)}</span>
                        {q.tierIndex >= 2 && (
                          <span className="text-green-400 ml-1">({fmtNum(erwMit)} ↻)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 mt-2 px-3 text-xs text-gray-500">
          <div className="w-28 flex-shrink-0">{tx.stufe}</div>
          <div className="flex-1">{tx.wahrsch}</div>
          <div className="w-24 text-right">&nbsp;</div>
          <div className="w-32 text-right">{tx.erwartung} / {tx.recyclerLoop}</div>
        </div>
      </section>

      {/* Strategy tips */}
      {zielQ.tierIndex >= 3 && (
        <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-3">{tx.topfStrategie}</h3>
          <ul className="space-y-2">
            {[tx.strategie1, tx.strategie2, tx.strategie3, tx.strategie4].map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-amber-400 mt-0.5">▸</span>
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500 italic">{tx.recyclerHint}</p>
        </section>
      )}
    </div>
  );
}
