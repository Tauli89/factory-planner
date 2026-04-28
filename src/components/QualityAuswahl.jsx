import { useQuality } from '../context/QualityContext';
import { useSprache } from '../context/SprachContext';
import { QUALITAETEN, formatQualityFaktor } from '../data/quality';

const T = {
  de: {
    zielQualitaet:      'Ziel-Qualität',
    maschinenQualitaet: 'Maschinenqualität',
    keineModule:        'Keine Qualitätsmodule aktiv',
    chance:             'Chance',
    faktor:             'Zutaten-Faktor',
    hinweis:            'Qualitätsmodule im Modulbereich konfigurieren',
  },
  en: {
    zielQualitaet:      'Target Quality',
    maschinenQualitaet: 'Machine Quality',
    keineModule:        'No quality modules active',
    chance:             'Chance',
    faktor:             'Ingredient factor',
    hinweis:            'Configure quality modules in the module section',
  },
};

export default function QualityAuswahl() {
  const {
    zielQualitaetId,
    setZielQualitaetId,
    maschinenQualitaetId,
    setMaschinenQualitaetId,
    zielQualitaet,
    maschinenQualitaet,
    gesamtQualityChance,
    qualityProb,
    qualityFaktorPerMaschine,
  } = useQuality();
  const { sprache } = useSprache();
  const tx = T[sprache];

  const hatQualityModule = gesamtQualityChance > 0;
  const istNormal        = zielQualitaetId === 'normal';

  // Besten Zutaten-Faktor aus allen Maschinentypen ermitteln (für Anzeige)
  const maxFaktor = Math.max(...Object.values(qualityFaktorPerMaschine), 1);

  const selectClass =
    'bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Ziel-Qualität */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{tx.zielQualitaet}:</span>
        <select
          value={zielQualitaetId}
          onChange={e => setZielQualitaetId(e.target.value)}
          className={selectClass}
        >
          {QUALITAETEN.map(q => (
            <option key={q.id} value={q.id}>
              {q.icon} {sprache === 'de' ? q.name : q.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Maschinenqualität (nur relevant wenn Ziel ≠ Normal) */}
      {!istNormal && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{tx.maschinenQualitaet}:</span>
          <select
            value={maschinenQualitaetId}
            onChange={e => setMaschinenQualitaetId(e.target.value)}
            className={selectClass}
          >
            {QUALITAETEN.map(q => (
              <option key={q.id} value={q.id}>
                {q.icon} {sprache === 'de' ? q.name : q.nameEn}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status-Badge */}
      {!istNormal && (
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${zielQualitaet.badge}`}>
          <span className="font-bold">
            {zielQualitaet.icon} {sprache === 'de' ? zielQualitaet.name : zielQualitaet.nameEn}
          </span>
          {hatQualityModule ? (
            <>
              <span className="opacity-50">·</span>
              <span>{tx.chance}: {(gesamtQualityChance * 100).toFixed(1)}%</span>
              <span className="opacity-50">·</span>
              <span className="font-bold">{tx.faktor}: {formatQualityFaktor(maxFaktor)}</span>
            </>
          ) : (
            <>
              <span className="opacity-50">·</span>
              <span className="text-amber-300">{tx.keineModule}</span>
            </>
          )}
        </div>
      )}

      {/* Hinweis wenn Qualität gewählt aber keine Module aktiv */}
      {!istNormal && !hatQualityModule && (
        <span className="text-xs text-gray-500 italic">{tx.hinweis}</span>
      )}
    </div>
  );
}
