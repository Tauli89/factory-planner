import { useState, useMemo, useRef, useEffect } from 'react';
import ProduktAuswahl from './components/ProduktAuswahl';
import MengenEingabe from './components/MengenEingabe';
import ErgebnisTabelle from './components/ErgebnisTabelle';
import ForschungsBaum from './components/ForschungsBaum';
import ModulAuswahl from './components/ModulAuswahl';
import ModulOptimierung from './components/ModulOptimierung';
import QualityAuswahl from './components/QualityAuswahl';
import FabrikPlaner from './components/FabrikPlaner';
import { ForschungProvider, useForschung } from './context/ForschungContext';
import { SprachProvider, useSprache } from './context/SprachContext';
import { ModulProvider, useModul } from './context/ModulContext';
import { QualityProvider, useQuality } from './context/QualityContext';
import { BerechnungProvider, useBerechnung } from './context/BerechnungContext';
import { berechneProduktion, maschinenAnzahl } from './utils/berechnung';
import { REZEPTE_MAP } from './data/recipes';
import { FOERDERBAENDER, FOERDERBAENDER_MAP } from './data/belts';

const TABS = {
  de: [
    { id: 'rechner',      label: '⚙️ Rechner' },
    { id: 'optimierung',  label: '🎯 Modul-Optimierung' },
    { id: 'forschung',    label: '🔬 Forschung' },
    { id: 'fabrikplaner', label: '🏗️ Fabrikplaner' },
  ],
  en: [
    { id: 'rechner',      label: '⚙️ Calculator' },
    { id: 'optimierung',  label: '🎯 Module Optimizer' },
    { id: 'forschung',    label: '🔬 Research' },
    { id: 'fabrikplaner', label: '🏗️ Factory Planner' },
  ],
};

const TX = {
  de: {
    konfigurieren: 'Produktion konfigurieren',
    hinzufuegen:   '+ Produkt hinzufügen',
    zuruecksetzen: 'Zurücksetzen',
    entfernen:     'Entfernen',
    hinweis:       'Wähle ein Produkt, um die Produktionskette zu berechnen.',
    foerderband:   'Förderband',
    module:        'Module',
  },
  en: {
    konfigurieren: 'Configure production',
    hinzufuegen:   '+ Add product',
    zuruecksetzen: 'Reset',
    entfernen:     'Remove',
    hinweis:       'Select a product to calculate the production chain.',
    foerderband:   'Belt type',
    module:        'Modules',
  },
};

// Full-height tabs that need no scroll wrapper
const FULLSCREEN_TABS = new Set(['forschung', 'fabrikplaner']);

function RechnerTab({ sprache }) {
  const [items, setItems]             = useState([{ key: 1, id: '', mengeProMin: 60 }]);
  const [bandId, setBandId]           = useState('keins');
  const [zeigeModule, setZeigeModule] = useState(false);
  const keyRef = useRef(2);

  const { boni }                                          = useForschung();
  const { modulBoni }                                     = useModul();
  const { zielQualitaet, maschinenQualitaet, getQualityFaktorFuerMaschine } = useQuality();
  const { setMaschinenListe }                             = useBerechnung();

  const addItem    = () => setItems(prev => [...prev, { key: keyRef.current++, id: '', mengeProMin: 60 }]);
  const removeItem = key => setItems(prev => prev.length > 1 ? prev.filter(i => i.key !== key) : prev);
  const updateId   = (key, id)    => setItems(prev => prev.map(i => i.key === key ? { ...i, id }            : i));
  const updateMenge= (key, menge) => setItems(prev => prev.map(i => i.key === key ? { ...i, mengeProMin: menge } : i));
  const resetAll   = () => setItems([{ key: keyRef.current++, id: '', mengeProMin: 60 }]);

  const { combined, perItem } = useMemo(() => {
    const active = items.filter(i => i.id && i.mengeProMin > 0);
    if (!active.length) return { combined: {}, perItem: [] };

    const perItemList = active.map(item => {
      const rezept        = REZEPTE_MAP[item.id];
      const maschinenType = rezept?.maschine;
      const qualityFaktor = getQualityFaktorFuerMaschine(maschinenType);
      const craftingRateSek = (item.mengeProMin / 60) * qualityFaktor;
      const produktion = berechneProduktion(item.id, craftingRateSek, {}, modulBoni);
      return {
        key:         item.key,
        id:          item.id,
        mengeProMin: item.mengeProMin,
        qualityFaktor,
        qualitaet:   zielQualitaet,
        produktion,
      };
    });

    const combined = {};
    for (const p of perItemList) {
      for (const [id, rate] of Object.entries(p.produktion)) {
        combined[id] = (combined[id] ?? 0) + rate;
      }
    }
    return { combined, perItem: perItemList };
  }, [items, modulBoni, zielQualitaet, getQualityFaktorFuerMaschine]);

  // Publish calculated machine list to BerechnungContext for FabrikPlaner
  const maschinenFuerPlaner = useMemo(() => {
    if (!Object.keys(combined).length) return [];
    const mQMulti = maschinenQualitaet?.maschinenMulti ?? 1;
    return Object.entries(combined)
      .filter(([id]) => {
        const r = REZEPTE_MAP[id];
        return r && r.zeit > 0;
      })
      .map(([id, rateProSek]) => {
        const r = REZEPTE_MAP[id];
        return {
          id,
          name:       r.name,
          nameEn:     r.nameEn,
          maschine:   r.maschine,
          anzahl:     maschinenAnzahl(id, rateProSek, boni, modulBoni, mQMulti),
          rateProMin: rateProSek * 60,
          rateProSek,
        };
      });
  }, [combined, boni, modulBoni, maschinenQualitaet]);

  useEffect(() => {
    setMaschinenListe(maschinenFuerPlaner);
  }, [maschinenFuerPlaner, setMaschinenListe]);

  const aktiveMaschinen = useMemo(() => {
    const maschinen = new Set();
    for (const id of Object.keys(combined)) {
      const rezept = REZEPTE_MAP[id];
      if (rezept && rezept.zeit > 0) maschinen.add(rezept.maschine);
    }
    return maschinen;
  }, [combined]);

  const foerderband = FOERDERBAENDER_MAP[bandId] ?? null;
  const hasResult   = Object.keys(combined).length > 0;
  const hasSelected = items.some(i => i.id);
  const tx          = TX[sprache];

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-amber-400 font-bold text-base uppercase tracking-wide">
            {tx.konfigurieren}
          </h2>
          <div className="flex gap-2">
            {hasSelected && (
              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
              >
                {tx.zuruecksetzen}
              </button>
            )}
            <button
              onClick={addItem}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-medium transition-colors"
            >
              {tx.hinzufuegen}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="flex flex-wrap gap-4 items-end p-3 rounded-lg bg-gray-800/40 border border-gray-700/50"
            >
              {items.length > 1 && (
                <span className="text-xs text-gray-500 font-mono self-center w-5 text-center">
                  #{idx + 1}
                </span>
              )}
              <ProduktAuswahl ausgewaehltId={item.id} onAuswahl={id => updateId(item.key, id)} />
              <MengenEingabe wert={item.mengeProMin} onChange={m => updateMenge(item.key, m)} />
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(item.key)}
                  className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-red-900/40 text-gray-400 hover:text-red-300 text-sm transition-colors"
                >
                  {tx.entfernen}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{tx.foerderband}:</span>
            <select
              value={bandId}
              onChange={e => setBandId(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {FOERDERBAENDER.map(b => (
                <option key={b.id} value={b.id}>
                  {sprache === 'de' ? b.name : b.nameEn}
                </option>
              ))}
            </select>
          </div>

          <QualityAuswahl />

          {hasResult && aktiveMaschinen.size > 0 && (
            <button
              onClick={() => setZeigeModule(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                zeigeModule
                  ? 'bg-green-500/20 text-green-300 border-green-500/40'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
              }`}
            >
              ⚙ {tx.module}
            </button>
          )}
        </div>

        {zeigeModule && hasResult && (
          <div className="mt-4">
            <ModulAuswahl aktiveMaschinen={aktiveMaschinen} />
          </div>
        )}
      </section>

      {hasResult ? (
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <ErgebnisTabelle
            produktion={combined}
            perItem={perItem}
            foerderband={foerderband?.id !== 'keins' ? foerderband : null}
          />
        </section>
      ) : (
        <div className="text-center text-gray-600 mt-16 text-lg">{tx.hinweis}</div>
      )}
    </div>
  );
}

function ForschungsTab({ sprache }) {
  const titel = sprache === 'de' ? 'Forschungsbaum' : 'Research Tree';
  return (
    <section className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col gap-4">
      <h2 className="flex-shrink-0 text-amber-400 font-bold text-base uppercase tracking-wide">
        {titel}
      </h2>
      <ForschungsBaum />
    </section>
  );
}

function FabrikPlanerTab({ sprache }) {
  return (
    <section className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
      <FabrikPlaner sprache={sprache} />
    </section>
  );
}

const IMMER_ERFORSCHT_IDS = new Set(['automation-science-pack', 'steam-power', 'military']);

function AppInner() {
  const [aktuellerTab, setAktuellerTab] = useState('rechner');
  const { erforscht } = useForschung();
  const { sprache, setSprache } = useSprache();
  const anzahlErforscht = [...erforscht].filter(id => !IMMER_ERFORSCHT_IDS.has(id)).length;

  const tabs = TABS[sprache];
  const erforschtLabel = sprache === 'de' ? 'Technologien erforscht' : 'technologies researched';
  const subtitle = sprache === 'de' ? 'Factorio Produktionsrechner' : 'Factorio Production Calculator';

  const isFullscreen = FULLSCREEN_TABS.has(aktuellerTab);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white font-sans">
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚙️</div>
          <div>
            <h1 className="text-xl font-bold text-amber-400 leading-tight">FactoryPlanner</h1>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        <nav className="flex gap-1 ml-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAktuellerTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${aktuellerTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex rounded-lg border border-gray-700 overflow-hidden text-xs font-bold">
            <button
              onClick={() => setSprache('de')}
              className={`px-2.5 py-1 transition-colors ${sprache === 'de' ? 'bg-amber-500/30 text-amber-300' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
            >
              DE
            </button>
            <button
              onClick={() => setSprache('en')}
              className={`px-2.5 py-1 transition-colors ${sprache === 'en' ? 'bg-amber-500/30 text-amber-300' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/30 border border-green-700/40 text-xs">
            <span className="text-green-400 font-bold">{anzahlErforscht}</span>
            <span className="text-green-600">{erforschtLabel}</span>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 min-h-0 max-w-screen-xl mx-auto w-full px-4 ${
          isFullscreen
            ? 'overflow-hidden py-4 flex flex-col'
            : 'overflow-auto py-8'
        }`}
      >
        {aktuellerTab === 'rechner'      && <RechnerTab      sprache={sprache} />}
        {aktuellerTab === 'optimierung'  && <ModulOptimierung />}
        {aktuellerTab === 'forschung'    && <ForschungsTab    sprache={sprache} />}
        {aktuellerTab === 'fabrikplaner' && <FabrikPlanerTab  sprache={sprache} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SprachProvider>
      <ForschungProvider>
        <ModulProvider>
          <QualityProvider>
            <BerechnungProvider>
              <AppInner />
            </BerechnungProvider>
          </QualityProvider>
        </ModulProvider>
      </ForschungProvider>
    </SprachProvider>
  );
}
