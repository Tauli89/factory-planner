import { useState, useRef, useEffect, useMemo } from 'react';
import { REZEPTE, KATEGORIEN, KATEGORIEN_EN_LABEL } from '../data/recipes';
import { DURCH_TECH_GESPERRTE_REZEPTE } from '../data/research';
import { ITEM_ICONS } from '../data/icons';
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

function ItemIcon({ id, className = 'w-4 h-4' }) {
  const [err, setErr] = useState(false);
  const src = ITEM_ICONS[id];
  if (!src || err) return null;
  return (
    <img
      src={src}
      alt=""
      className={`${className} object-contain flex-shrink-0`}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setErr(true)}
    />
  );
}

export default function ProduktAuswahl({ ausgewaehltId, onAuswahl }) {
  const { freigeschalteteRezepte } = useForschung();
  const { sprache } = useSprache();
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState('');
  const ref = useRef(null);
  const suchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOffen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (offen && suchRef.current) {
      setSuche('');
      setTimeout(() => suchRef.current?.focus(), 30);
    }
  }, [offen]);

  const herstellbar = useMemo(() => REZEPTE.filter(r => {
    if (r.zeit === 0) return false;
    if (!DURCH_TECH_GESPERRTE_REZEPTE.has(r.id)) return true;
    return freigeschalteteRezepte.has(r.id);
  }), [freigeschalteteRezepte]);

  const ausgewaehlt = REZEPTE.find(r => r.id === ausgewaehltId);
  const ausgewaehltName = ausgewaehlt
    ? (sprache === 'de' ? ausgewaehlt.name : ausgewaehlt.nameEn)
    : null;

  const label = sprache === 'de' ? 'Produkt auswählen' : 'Select product';
  const placeholder = sprache === 'de' ? '— Produkt wählen —' : '— Select product —';
  const suchPlaceholder = sprache === 'de' ? 'Suchen…' : 'Search…';

  const sucheNorm = suche.trim().toLowerCase();

  const gefiltert = useMemo(() => {
    if (!sucheNorm) return null;
    return herstellbar.filter(r => {
      const n = sprache === 'de' ? r.name : r.nameEn;
      return n.toLowerCase().includes(sucheNorm);
    });
  }, [herstellbar, sucheNorm, sprache]);

  const nachKategorie = useMemo(() => KATEGORIE_REIHENFOLGE.map(kat => ({
    kat,
    rezepte: herstellbar.filter(r => r.kategorie === kat),
  })).filter(g => g.rezepte.length > 0), [herstellbar]);

  const waehle = (id) => {
    onAuswahl(id);
    setOffen(false);
  };

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <label className="text-sm font-semibold text-amber-300">{label}</label>

      <div className="relative max-w-xs">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOffen(v => !v)}
          className="w-full flex items-center gap-2 bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-left hover:border-gray-500 transition-colors"
        >
          {ausgewaehlt ? (
            <>
              <ItemIcon id={ausgewaehlt.id} />
              <span className="flex-1 truncate">{ausgewaehltName}</span>
            </>
          ) : (
            <span className="flex-1 text-gray-500">{placeholder}</span>
          )}
          <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${offen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {offen && (
          <div className="absolute top-full mt-1 left-0 z-50 w-full bg-gray-900 border border-gray-600 rounded-lg shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-gray-700">
            <input
              ref={suchRef}
              type="text"
              value={suche}
              onChange={e => setSuche(e.target.value)}
              placeholder={suchPlaceholder}
              className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-500"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-64 overscroll-contain">
            {gefiltert ? (
              gefiltert.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  {sprache === 'de' ? 'Keine Treffer' : 'No results'}
                </div>
              ) : (
                gefiltert.map(r => (
                  <DropdownOption key={r.id} r={r} sprache={sprache} onSelect={waehle} selected={r.id === ausgewaehltId} />
                ))
              )
            ) : (
              nachKategorie.map(({ kat, rezepte }) => {
                const katLabel = sprache === 'de' ? kat : (KATEGORIEN_EN_LABEL[kat] ?? kat);
                return (
                  <div key={kat}>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-800/80 sticky top-0">
                      {katLabel}
                    </div>
                    {rezepte.map(r => (
                      <DropdownOption key={r.id} r={r} sprache={sprache} onSelect={waehle} selected={r.id === ausgewaehltId} />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function DropdownOption({ r, sprache, onSelect, selected }) {
  const name = sprache === 'de' ? r.name : r.nameEn;
  return (
    <button
      type="button"
      onClick={() => onSelect(r.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors
        ${selected
          ? 'bg-amber-500/20 text-amber-300'
          : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'}`}
    >
      <ItemIcon id={r.id} className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </button>
  );
}
