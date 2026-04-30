import { useState, useRef, useEffect, useMemo } from 'react';
import { REZEPTE, KATEGORIEN, KATEGORIEN_EN_LABEL, DURCH_TECH_GESPERRTE_REZEPTE } from '../data/gamedata-adapter';
import Icon from './Icon';
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

const KATEGORIE_FALLBACK_FARBE = {
  [KATEGORIEN.ROHSTOFFE]:        '#6b7280',
  [KATEGORIEN.ZWISCHENPRODUKTE]: '#f59e0b',
  [KATEGORIEN.LOGISTIK]:         '#60a5fa',
  [KATEGORIEN.ENERGIE]:          '#f97316',
  [KATEGORIEN.MILITAER]:         '#ef4444',
  [KATEGORIEN.MASCHINEN_BAU]:    '#8b5cf6',
  [KATEGORIEN.MODULE]:           '#10b981',
  [KATEGORIEN.SCIENCE]:          '#3b82f6',
  [KATEGORIEN.OELVERARBEITUNG]:  '#78716c',
  [KATEGORIEN.NUKLEAR]:          '#22d3ee',
  [KATEGORIEN.RAKETE]:           '#e879f9',
  [KATEGORIEN.SPACE_AGE]:        '#a78bfa',
};


const ALIAS_MAP = {
  'verarbeitungseinheit':       'processing-unit',
  'roter schaltkreis':          'electronic-circuit',
  'grüner schaltkreis':         'electronic-circuit',
  'blauer schaltkreis':         'processing-unit',
  'fortgeschrittener schaltkreis': 'advanced-circuit',
  'rote wissenschaft':          'automation-science-pack',
  'grüne wissenschaft':         'logistic-science-pack',
  'blaue wissenschaft':         'chemical-science-pack',
  'schwarze wissenschaft':      'production-science-pack',
  'lila wissenschaft':          'military-science-pack',
  'gelbe wissenschaft':         'utility-science-pack',
  'weisse wissenschaft':        'space-science-pack',
};

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
    const aliasId = ALIAS_MAP[sucheNorm];
    return herstellbar.filter(r =>
      r.name.toLowerCase().includes(sucheNorm) ||
      r.nameEn.toLowerCase().includes(sucheNorm) ||
      r.id.includes(sucheNorm) ||
      (aliasId && r.id === aliasId)
    );
  }, [herstellbar, sucheNorm]);

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

      <div className="relative" style={{ minWidth: '200px', maxWidth: '320px' }}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOffen(v => !v)}
          className="w-full flex items-center gap-2 bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-left hover:border-gray-500 transition-colors"
        >
          {ausgewaehlt ? (
            <>
              <Icon id={ausgewaehlt.id} size={20} />
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
          <div className="absolute top-full mt-1 left-0 z-50 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl shadow-black/60 flex flex-col overflow-hidden" style={{ minWidth: '280px', width: 'max-content', maxWidth: '400px' }}>
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
      title={name}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors
        ${selected
          ? 'bg-amber-500/20 text-amber-300'
          : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'}`}
    >
      <Icon id={r.id} size={20} />
      <span className="truncate">{name}</span>
    </button>
  );
}
