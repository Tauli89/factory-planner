import { useSprache } from '../context/SprachContext';

export default function MengenEingabe({ wert, onChange }) {
  const { sprache } = useSprache();
  const label = sprache === 'de' ? 'Ziel-Ausbringung' : 'Target output';
  const unit  = sprache === 'de' ? '(Stück / Minute)' : '(items / minute)';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-amber-300">
        {label} <span className="font-normal text-gray-400">{unit}</span>
      </label>
      <input
        type="number"
        min="0.1"
        step="0.1"
        value={wert}
        onChange={e => onChange(Number(e.target.value))}
        className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 w-36 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}
