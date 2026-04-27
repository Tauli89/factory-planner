import { REZEPTE_MAP, MASCHINEN } from '../data/recipes';
import { maschinenAnzahl, MASCHINEN_LABEL } from '../utils/berechnung';

const MASCHINEN_FARBE = {
  [MASCHINEN.ASSEMBLER]:    'text-blue-400',
  [MASCHINEN.SCHMELZOFEN]:  'text-orange-400',
  [MASCHINEN.CHEMIEANLAGE]: 'text-purple-400',
  [MASCHINEN.BERGBAU]:      'text-gray-400',
};

export default function ErgebnisTabelle({ produktion }) {
  if (!produktion || Object.keys(produktion).length === 0) return null;

  const eintraege = Object.entries(produktion).map(([id, rateProSek]) => {
    const rezept = REZEPTE_MAP[id];
    const istRohstoff = !rezept || rezept.zeit === 0;
    const anzahl = istRohstoff ? null : maschinenAnzahl(id, rateProSek);
    const maschine = rezept?.maschine ?? null;
    return {
      id,
      name: rezept?.name ?? id,
      rateProSek,
      rateProMin: rateProSek * 60,
      istRohstoff,
      anzahl,
      maschine,
    };
  });

  const herstellung = eintraege.filter(e => !e.istRohstoff);
  const rohstoffe   = eintraege.filter(e =>  e.istRohstoff);

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Abschnitt titel="Herstellung" eintraege={herstellung} zeigeMaschine />
      <Abschnitt titel="Rohstoffe (Abbau / Pumpen)" eintraege={rohstoffe} />
    </div>
  );
}

function Abschnitt({ titel, eintraege, zeigeMaschine = false }) {
  if (eintraege.length === 0) return null;
  return (
    <div>
      <h2 className="text-amber-400 font-bold text-lg mb-3 border-b border-gray-700 pb-1">{titel}</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3 text-right">Stück / Min</th>
              <th className="px-4 py-3 text-right">Stück / Sek</th>
              {zeigeMaschine && <th className="px-4 py-3 text-right">Maschine</th>}
              {zeigeMaschine && <th className="px-4 py-3 text-right">Anzahl</th>}
            </tr>
          </thead>
          <tbody>
            {eintraege.map((e, i) => {
              const farbe = MASCHINEN_FARBE[e.maschine] ?? 'text-gray-400';
              return (
                <tr key={e.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                  <td className="px-4 py-2 text-white font-medium">{e.name}</td>
                  <td className="px-4 py-2 text-right text-green-400">{e.rateProMin.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-gray-400">{e.rateProSek.toFixed(3)}</td>
                  {zeigeMaschine && (
                    <td className={`px-4 py-2 text-right text-xs ${farbe}`}>
                      {MASCHINEN_LABEL[e.maschine] ?? '—'}
                    </td>
                  )}
                  {zeigeMaschine && (
                    <td className={`px-4 py-2 text-right font-bold ${farbe}`}>
                      {e.anzahl ?? '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
