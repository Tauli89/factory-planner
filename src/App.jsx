import { useState, useMemo } from 'react';
import ProduktAuswahl from './components/ProduktAuswahl';
import MengenEingabe from './components/MengenEingabe';
import ErgebnisTabelle from './components/ErgebnisTabelle';
import { berechneProduktion } from './utils/berechnung';

export default function App() {
  const [produktId, setProduktId] = useState('');
  const [mengeProMin, setMengeProMin] = useState(60);

  const produktion = useMemo(() => {
    if (!produktId || mengeProMin <= 0) return {};
    return berechneProduktion(produktId, mengeProMin / 60);
  }, [produktId, mengeProMin]);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="text-3xl">⚙️</div>
        <div>
          <h1 className="text-xl font-bold text-amber-400 leading-tight">FactoryPlanner</h1>
          <p className="text-xs text-gray-500">Factorio Produktionsrechner</p>
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Eingabebereich */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-amber-400 font-bold text-base mb-5 uppercase tracking-wide">
            Produktion konfigurieren
          </h2>
          <div className="flex flex-wrap gap-6 items-end">
            <ProduktAuswahl ausgewaehltId={produktId} onAuswahl={setProduktId} />
            <MengenEingabe wert={mengeProMin} onChange={setMengeProMin} />
            {produktId && (
              <button
                onClick={() => { setProduktId(''); }}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
              >
                Zurücksetzen
              </button>
            )}
          </div>
        </section>

        {/* Ergebnisbereich */}
        {produktId ? (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <ErgebnisTabelle produktion={produktion} />
          </section>
        ) : (
          <div className="text-center text-gray-600 mt-16 text-lg">
            Wähle ein Produkt, um die Produktionskette zu berechnen.
          </div>
        )}
      </main>
    </div>
  );
}
