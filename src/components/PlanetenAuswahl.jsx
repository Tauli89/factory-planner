import { usePlaneten } from '../context/PlanetenContext';
import { PLANETEN } from '../data/planets';
import { useSprache } from '../context/SprachContext';

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
            className={`w-7 h-7 rounded text-sm flex items-center justify-center transition-colors border leading-none select-none ${
              aktiv
                ? `${planet.bg} ${planet.border} ${planet.farbe}`
                : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            {planet.emoji}
          </button>
        );
      })}
    </div>
  );
}
