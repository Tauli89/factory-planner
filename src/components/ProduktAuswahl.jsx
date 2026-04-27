import { REZEPTE } from '../data/recipes';

export default function ProduktAuswahl({ ausgewaehltId, onAuswahl }) {
  const herstellbar = REZEPTE.filter(r => r.zeit > 0);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-amber-300">Produkt auswählen</label>
      <select
        value={ausgewaehltId}
        onChange={e => onAuswahl(e.target.value)}
        className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <option value="">-- Produkt wählen --</option>
        {herstellbar.map(r => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
