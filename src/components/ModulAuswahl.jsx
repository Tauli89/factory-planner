import { useModul } from '../context/ModulContext';
import { useQuality } from '../context/QualityContext';
import { MODULE_TYPEN, MODUL_SLOTS } from '../data/modules';
import { MASCHINEN_LABEL, MASCHINEN_LABEL_EN } from '../utils/berechnung';
import { useSprache } from '../context/SprachContext';

const T = {
  de: {
    titel:       'Modulkonfiguration',
    modul:       'Modul',
    anzahl:      'Slots',
    geschw:      'Geschwindigkeit',
    prod:        'Produktivität',
    qualitaet:   'Qualität',
    effQuality:  'Effektive Qualitätschance',
  },
  en: {
    titel:       'Module Configuration',
    modul:       'Module',
    anzahl:      'Slots',
    geschw:      'Speed',
    prod:        'Productivity',
    qualitaet:   'Quality',
    effQuality:  'Effective quality chance',
  },
};

export default function ModulAuswahl({ aktiveMaschinen }) {
  const { modulConfig, setMaschinenModul } = useModul();
  const { sprache } = useSprache();
  const tx = T[sprache];
  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;

  if (!aktiveMaschinen || aktiveMaschinen.size === 0) return null;

  const maschinen = [...aktiveMaschinen].filter(m => (MODUL_SLOTS[m] ?? 0) > 0);
  if (maschinen.length === 0) return null;

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wide mb-3">
        {tx.titel}
      </h3>
      <div className="grid gap-2">
        {maschinen.map(maschinenType => {
          const maxSlots  = MODUL_SLOTS[maschinenType] ?? 0;
          const config    = modulConfig[maschinenType] ?? { modulId: 'keins', anzahl: 0 };
          const modulName = sprache === 'de' ? 'name' : 'nameEn';

          return (
            <div key={maschinenType} className="flex flex-wrap items-center gap-3">
              <span className="text-gray-300 text-sm w-44 shrink-0">
                {maschinenLabels[maschinenType] ?? maschinenType}
              </span>

              <select
                value={config.modulId ?? 'keins'}
                onChange={e => setMaschinenModul(maschinenType, e.target.value, config.anzahl || 0)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {MODULE_TYPEN.map(m => (
                  <option key={m.id} value={m.id}>{m[modulName]}</option>
                ))}
              </select>

              {config.modulId && config.modulId !== 'keins' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-xs">{tx.anzahl}:</span>
                  <input
                    type="number"
                    min={1}
                    max={maxSlots}
                    value={config.anzahl || 1}
                    onChange={e => {
                      const v = Math.max(1, Math.min(maxSlots, Number(e.target.value)));
                      setMaschinenModul(maschinenType, config.modulId, v);
                    }}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 w-16 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-gray-500 text-xs">/ {maxSlots}</span>
                </div>
              )}

              <ModulHinweis maschinenType={maschinenType} config={config} sprache={sprache} tx={tx} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModulHinweis({ maschinenType, config, sprache, tx }) {
  const { modulBoni } = useModul();
  const { qualityChancePerMaschine, maschinenQualitaet } = useQuality();

  const bonus        = modulBoni[maschinenType];
  const qualityChance = qualityChancePerMaschine[maschinenType] ?? 0;

  const parts = [];

  if (bonus?.speedBonus !== 0 && bonus?.speedBonus !== undefined) {
    const sign = bonus.speedBonus > 0 ? '+' : '';
    parts.push(`${tx.geschw}: ${sign}${(bonus.speedBonus * 100).toFixed(0)}%`);
  }
  if (bonus?.produktivitaet > 0) {
    parts.push(`${tx.prod}: +${(bonus.produktivitaet * 100).toFixed(0)}%`);
  }
  if (qualityChance > 0) {
    parts.push(`${tx.qualitaet}: ${(qualityChance * 100).toFixed(1)}%`);
    if (maschinenQualitaet.qualityModulMulti !== 1) {
      parts.push(`(×${maschinenQualitaet.qualityModulMulti} ${sprache === 'de' ? 'Maschinenbonus' : 'machine bonus'})`);
    }
  }

  if (parts.length === 0) return null;

  const istQuality = qualityChance > 0;

  return (
    <span className={`text-xs rounded px-1.5 py-0.5 border ${
      istQuality
        ? 'text-amber-300 bg-amber-900/20 border-amber-700/30'
        : 'text-green-400 bg-green-900/20 border-green-700/30'
    }`}>
      {parts.join(' · ')}
    </span>
  );
}
