import { REZEPTE, KATEGORIEN, KATEGORIEN_EN_LABEL } from '../data/recipes';
import { DURCH_TECH_GESPERRTE_REZEPTE } from '../data/research';
import { useForschung } from '../context/ForschungContext';
import { useSprache } from '../context/SprachContext';

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
  const { sprache } = useSprache();

  const herstellbar = REZEPTE.filter(r => {
    if (r.zeit === 0) return false;
    if (!DURCH_TECH_GESPERRTE_REZEPTE.has(r.id)) return true;
    return freigeschalteteRezepte.has(r.id);
  });

  const nachKategorie = KATEGORIE_REIHENFOLGE.map(kat => ({
    kat,
    rezepte: herstellbar.filter(r => r.kategorie === kat),
  })).filter(g => g.rezepte.length > 0);

  const label = sprache === 'de' ? 'Produkt auswählen' : 'Select product';
  const placeholder = sprache === 'de' ? '-- Produkt wählen --' : '-- Select product --';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-amber-300">{label}</label>
      <select
        value={ausgewaehltId}
        onChange={e => onAuswahl(e.target.value)}
        className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-xs"
      >
        <option value="">{placeholder}</option>
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
  );
}
