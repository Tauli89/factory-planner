import { REZEPTE, KATEGORIEN } from '../data/recipes';
import { DURCH_TECH_GESPERRTE_REZEPTE } from '../data/research';
import { useForschung } from '../context/ForschungContext';

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

export default function ProduktAuswahl({ ausgewaehltId, onAuswahl }) {
  const { freigeschalteteRezepte } = useForschung();

  const herstellbar = REZEPTE.filter(r => {
    if (r.zeit === 0) return false;
    // Rezepte ohne Tech-Anforderung immer verfügbar
    if (!DURCH_TECH_GESPERRTE_REZEPTE.has(r.id)) return true;
    // Technologie-gesperrte Rezepte nur wenn erforscht
    return freigeschalteteRezepte.has(r.id);
  });

  const nachKategorie = KATEGORIE_REIHENFOLGE.map(kat => ({
    kat,
    rezepte: herstellbar.filter(r => r.kategorie === kat),
  })).filter(g => g.rezepte.length > 0);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-amber-300">Produkt auswählen</label>
      <select
        value={ausgewaehltId}
        onChange={e => onAuswahl(e.target.value)}
        className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-xs"
      >
        <option value="">-- Produkt wählen --</option>
        {nachKategorie.map(({ kat, rezepte }) => (
          <optgroup key={kat} label={kat}>
            {rezepte.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
