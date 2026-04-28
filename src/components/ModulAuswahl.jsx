import { useModul } from '../context/ModulContext';
import { MODULE_TYPEN, MODUL_SLOTS } from '../data/modules';
import { MASCHINEN_LABEL, MASCHINEN_LABEL_EN } from '../utils/berechnung';
import { useSprache } from '../context/SprachContext';

const T = {
  de: {
    titel:   'Modulkonfiguration',
    modul:   'Modul',
    anzahl:  'Slots',
  },
  en: {
    titel:   'Module Configuration',
    modul:   'Module',
    anzahl:  'Slots',
  },
};

export default function ModulAuswahl({ aktiveMaschinen }) {
  const { modulConfig, setMaschinenModul } = useModul();
  const { sprache } = useSprache();
  const tx = T[sprache];
  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;

  if (!aktiveMaschinen || aktiveMaschinen.size === 0) return null;

  // Only show machine types that have module slots
  const maschinen = [...aktiveMaschinen].filter(m => (MODUL_SLOTS[m] ?? 0) > 0);
  if (maschinen.length === 0) return null;

  const moduleOptions = MODULE_TYPEN.filter(m => {
    if (sprache === 'de') return true;
    return true;
  });

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
                {moduleOptions.map(m => (
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

              <ModulHinweis maschinenType={maschinenType} config={config} sprache={sprache} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModulHinweis({ maschinenType, config, sprache }) {
  const { modulBoni } = useModul();
  const bonus = modulBoni[maschinenType];
  if (!bonus) return null;

  const parts = [];
  if (bonus.speedBonus !== 0) {
    const sign  = bonus.speedBonus > 0 ? '+' : '';
    const label = sprache === 'de' ? 'Geschwindigkeit' : 'Speed';
    parts.push(`${label}: ${sign}${(bonus.speedBonus * 100).toFixed(0)}%`);
  }
  if (bonus.produktivitaet > 0) {
    const label = sprache === 'de' ? 'Produktivität' : 'Productivity';
    parts.push(`${label}: +${(bonus.produktivitaet * 100).toFixed(0)}%`);
  }
  if (parts.length === 0) return null;

  return (
    <span className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 rounded px-1.5 py-0.5">
      {parts.join(' · ')}
    </span>
  );
}
