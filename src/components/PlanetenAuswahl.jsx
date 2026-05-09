import { usePlaneten } from '../context/PlanetenContext';
import { PLANETEN } from '../data/planets';
import { useSprache } from '../context/SprachContext';
import Icon from './Icon';

export default function PlanetenAuswahl() {
  const { aktivePlaneten, togglePlanet } = usePlaneten();
  const { sprache } = useSprache();

  return (
    <div className="flex items-center gap-0.5" title={sprache === 'de' ? 'Planeten-Filter' : 'Planet filter'}>
      {PLANETEN.map(planet => {
        const aktiv = aktivePlaneten.has(planet.id);
        return (
          <button
            key={planet.id}
            onClick={() => togglePlanet(planet.id)}
            title={sprache === 'de' ? planet.de : planet.en}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all border ${
              aktiv
                ? `${planet.bg} ${planet.border}`
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700 opacity-40 hover:opacity-70'
            }`}
          >
            <Icon id={planet.iconId} type={planet.iconType} size={18} />
          </button>
        );
      })}
    </div>
  );
}
