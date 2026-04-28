import { createContext, useContext, useState, useMemo } from 'react';
import { QUALITAETEN_MAP, qualityZutatFaktor, qualityWahrscheinlichkeit } from '../data/quality';
import { useModul } from './ModulContext';

const QualityContext = createContext(null);

export function QualityProvider({ children }) {
  const [zielQualitaetId,      setZielQualitaetId]      = useState('normal');
  const [maschinenQualitaetId, setMaschinenQualitaetId] = useState('normal');

  const { qualityBoniPerMaschine } = useModul();

  const zielQualitaet      = QUALITAETEN_MAP[zielQualitaetId];
  const maschinenQualitaet = QUALITAETEN_MAP[maschinenQualitaetId];

  // Effektive Quality-Chance pro Maschinentyp = roher Bonus × Maschinenqualitäts-Multiplikator
  const qualityChancePerMaschine = useMemo(() => {
    const result = {};
    for (const [maschinenType, rawBonus] of Object.entries(qualityBoniPerMaschine)) {
      result[maschinenType] = rawBonus * maschinenQualitaet.qualityModulMulti;
    }
    return result;
  }, [qualityBoniPerMaschine, maschinenQualitaet]);

  // Zutaten-Multiplikator pro Maschinentyp
  const qualityFaktorPerMaschine = useMemo(() => {
    const result = {};
    const tierIndex = zielQualitaet.tierIndex;
    for (const [maschinenType, chance] of Object.entries(qualityChancePerMaschine)) {
      result[maschinenType] = qualityZutatFaktor(chance, tierIndex);
    }
    return result;
  }, [qualityChancePerMaschine, zielQualitaet]);

  // Beste verfügbare Quality-Chance (für die Zusammenfassung in der UI)
  const gesamtQualityChance = useMemo(
    () => Object.values(qualityChancePerMaschine).reduce((a, b) => Math.max(a, b), 0),
    [qualityChancePerMaschine],
  );

  // Wahrscheinlichkeit für die Zielqualität bei bester verfügbarer Chance
  const qualityProb = useMemo(
    () => qualityWahrscheinlichkeit(gesamtQualityChance, zielQualitaet.tierIndex),
    [gesamtQualityChance, zielQualitaet],
  );

  /**
   * Gibt den Quality-Faktor (Zutaten-Multiplikator) für einen gegebenen Maschinentyp zurück.
   * Wird in App.jsx pro Zielprodukt aufgerufen, um die Crafting-Rate korrekt zu skalieren.
   */
  function getQualityFaktorFuerMaschine(maschinenType) {
    if (zielQualitaet.tierIndex === 0) return 1;
    const chance = qualityChancePerMaschine[maschinenType] ?? 0;
    return qualityZutatFaktor(chance, zielQualitaet.tierIndex);
  }

  return (
    <QualityContext.Provider value={{
      zielQualitaetId,
      setZielQualitaetId,
      maschinenQualitaetId,
      setMaschinenQualitaetId,
      zielQualitaet,
      maschinenQualitaet,
      gesamtQualityChance,
      qualityProb,
      qualityChancePerMaschine,
      qualityFaktorPerMaschine,
      getQualityFaktorFuerMaschine,
    }}>
      {children}
    </QualityContext.Provider>
  );
}

export const useQuality = () => useContext(QualityContext);
