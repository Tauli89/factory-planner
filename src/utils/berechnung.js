import { REZEPTE_MAP, MASCHINEN } from '../data/recipes';

// Fertigungsgeschwindigkeit pro Maschinentyp (Standard-Ausbaustufe)
const MASCHINENGESCHWINDIGKEIT = {
  [MASCHINEN.ASSEMBLER]:    0.75,  // Assembler Mk2
  [MASCHINEN.SCHMELZOFEN]:  2.0,   // Elektrischer Schmelzofen
  [MASCHINEN.CHEMIEANLAGE]: 1.0,   // Chemieanlage
};

export const MASCHINEN_LABEL = {
  [MASCHINEN.ASSEMBLER]:    'Assembler',
  [MASCHINEN.SCHMELZOFEN]:  'Schmelzofen',
  [MASCHINEN.CHEMIEANLAGE]: 'Chemieanlage',
  [MASCHINEN.BERGBAU]:      'Bergbaubohrer',
};

/**
 * Berechnet rekursiv alle benötigten Produktionsraten für ein Zielprodukt.
 * @param {string} id - Rezept-ID des Zielprodukts
 * @param {number} mengeProSekunde - Gewünschte Ausbringung in Stück/Sekunde
 * @param {Record<string, number>} akkumulator - Gesammelte Anforderungen (wird befüllt)
 * @returns {Record<string, number>} Karte von id → benötigte Menge/Sekunde
 */
export function berechneProduktion(id, mengeProSekunde, akkumulator = {}) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) {
    akkumulator[id] = (akkumulator[id] ?? 0) + mengeProSekunde;
    return akkumulator;
  }

  akkumulator[id] = (akkumulator[id] ?? 0) + mengeProSekunde;

  for (const zutat of rezept.zutaten) {
    const zutatRate = (zutat.menge / rezept.ergibt) * mengeProSekunde;
    berechneProduktion(zutat.id, zutatRate, akkumulator);
  }

  return akkumulator;
}

/**
 * Berechnet die Anzahl benötigter Maschinen für eine geforderte Rate.
 * Berücksichtigt automatisch den korrekten Maschinentyp aus dem Rezept.
 */
export function maschinenAnzahl(id, mengeProSekunde) {
  const rezept = REZEPTE_MAP[id];
  if (!rezept || rezept.zeit === 0) return null;
  const geschwindigkeit = MASCHINENGESCHWINDIGKEIT[rezept.maschine] ?? 1.0;
  const rate = (rezept.ergibt / rezept.zeit) * geschwindigkeit;
  return Math.ceil(mengeProSekunde / rate);
}
