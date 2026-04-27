import { useState, useMemo } from 'react';
import ProduktAuswahl from './components/ProduktAuswahl';
import MengenEingabe from './components/MengenEingabe';
import ErgebnisTabelle from './components/ErgebnisTabelle';
import ForschungsBaum from './components/ForschungsBaum';
import { ForschungProvider, useForschung } from './context/ForschungContext';
import { berechneProduktion } from './utils/berechnung';

const TABS = [
  { id: 'rechner', label: '⚙️ Rechner' },
  { id: 'forschung', label: '🔬 Forschung' },
];

function RechnerTab() {
  const [produktId, setProduktId] = useState('');
  const [mengeProMin, setMengeProMin] = useState(60);

  const produktion = useMemo(() => {
    if (!produktId || mengeProMin <= 0) return {};
    return berechneProduktion(produktId, mengeProMin / 60);
  }, [produktId, mengeProMin]);

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-amber-400 font-bold text-base mb-5 uppercase tracking-wide">
          Produktion konfigurieren
        </h2>
        <div className="flex flex-wrap gap-6 items-end">
          <ProduktAuswahl ausgewaehltId={produktId} onAuswahl={setProduktId} />
          <MengenEingabe wert={mengeProMin} onChange={setMengeProMin} />
          {produktId && (
            <button
              onClick={() => setProduktId('')}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </section>

      {produktId ? (
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <ErgebnisTabelle produktion={produktion} />
        </section>
      ) : (
        <div className="text-center text-gray-600 mt-16 text-lg">
          Wähle ein Produkt, um die Produktionskette zu berechnen.
        </div>
      )}
    </div>
  );
}

function ForschungsTab() {
  return (
    <section className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col gap-4">
      <h2 className="flex-shrink-0 text-amber-400 font-bold text-base uppercase tracking-wide">
        Forschungsbaum
      </h2>
      <ForschungsBaum />
    </section>
  );
}

function AppInner() {
  const [aktuellerTab, setAktuellerTab] = useState('rechner');
  const { erforscht } = useForschung();

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚙️</div>
          <div>
            <h1 className="text-xl font-bold text-amber-400 leading-tight">FactoryPlanner</h1>
            <p className="text-xs text-gray-500">Factorio Produktionsrechner</p>
          </div>
        </div>

        {/* Tab-Navigation */}
        <nav className="flex gap-1 ml-6">
          {TABS.map(tab => (
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

        {/* Forschungs-Fortschritt mini */}
        <div className="ml-auto text-xs text-gray-500">
          <span className="text-green-400 font-bold">{erforscht.size}</span>
          {' '}Technologien erforscht
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className={`flex-1 min-h-0 max-w-screen-xl mx-auto w-full px-4 ${
        aktuellerTab === 'forschung'
          ? 'overflow-hidden py-4 flex flex-col'
          : 'overflow-auto py-8'
      }`}>
        {aktuellerTab === 'rechner' && <RechnerTab />}
        {aktuellerTab === 'forschung' && <ForschungsTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ForschungProvider>
      <AppInner />
    </ForschungProvider>
  );
}
