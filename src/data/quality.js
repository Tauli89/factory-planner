/**
 * Factorio Space Age – Quality System
 * Quelle: wiki.factorio.com/Quality
 *
 * Maschinen höherer Qualität haben:
 *   - Höhere Basisgeschwindigkeit (maschinenMulti)
 *   - Multiplikator für Qualitätsmodule (qualityModulMulti)
 *
 * Wahrscheinlichkeitsmodell:
 *   P(genau Tier T) = q^T * (1-q)  für T < 4
 *   P(Tier 4 = Legendary)          = q^4
 *   wobei q = Gesamt-Qualitätschance (Modulboni × Maschinenqualitäts-Multiplikator)
 */

export const QUALITAETEN = [
  {
    id: 'normal',
    name: 'Normal',
    nameEn: 'Normal',
    farbe: 'text-gray-400',
    badge: 'bg-gray-700/60 text-gray-300 border-gray-600',
    maschinenMulti: 1.0,
    qualityModulMulti: 1.0,
    icon: '◈',
    tierIndex: 0,
  },
  {
    id: 'uncommon',
    name: 'Ungewöhnlich',
    nameEn: 'Uncommon',
    farbe: 'text-green-400',
    badge: 'bg-green-900/40 text-green-300 border-green-600/50',
    maschinenMulti: 1.3,
    qualityModulMulti: 1.3,
    icon: '◈',
    tierIndex: 1,
  },
  {
    id: 'rare',
    name: 'Selten',
    nameEn: 'Rare',
    farbe: 'text-blue-400',
    badge: 'bg-blue-900/40 text-blue-300 border-blue-600/50',
    maschinenMulti: 1.6,
    qualityModulMulti: 1.6,
    icon: '◈',
    tierIndex: 2,
  },
  {
    id: 'epic',
    name: 'Episch',
    nameEn: 'Epic',
    farbe: 'text-purple-400',
    badge: 'bg-purple-900/40 text-purple-300 border-purple-600/50',
    maschinenMulti: 1.9,
    qualityModulMulti: 1.9,
    icon: '◈',
    tierIndex: 3,
  },
  {
    id: 'legendary',
    name: 'Legendär',
    nameEn: 'Legendary',
    farbe: 'text-amber-400',
    badge: 'bg-amber-900/40 text-amber-300 border-amber-600/50',
    maschinenMulti: 2.5,
    qualityModulMulti: 2.5,
    icon: '★',
    tierIndex: 4,
  },
];

export const QUALITAETEN_MAP = Object.fromEntries(QUALITAETEN.map(q => [q.id, q]));

/**
 * Gibt die Wahrscheinlichkeit zurück, bei einem Crafting-Vorgang genau Qualitätsstufe
 * `tierIndex` (0=Normal … 4=Legendary) zu erhalten.
 */
export function qualityWahrscheinlichkeit(gesamtChance, tierIndex) {
  if (tierIndex === 0) return 1;
  const q = Math.min(Math.max(gesamtChance, 0), 0.9999);
  if (tierIndex >= 4) return Math.pow(q, 4);
  return Math.pow(q, tierIndex) * (1 - q);
}

/**
 * Wie viele Crafting-Vorgänge werden im Schnitt benötigt, um 1 Item der
 * Zielstufe zu erhalten (= Zutaten-Multiplikator für Qualitätscrafting).
 */
export function qualityZutatFaktor(gesamtChance, tierIndex) {
  if (tierIndex === 0) return 1;
  const p = qualityWahrscheinlichkeit(gesamtChance, tierIndex);
  return p > 0 ? 1 / p : 1e9;
}

/**
 * Formatiert den Qualitätsfaktor lesbar (z. B. "×250" oder "×12.5").
 */
export function formatQualityFaktor(faktor) {
  if (faktor >= 10000) return `×${Math.round(faktor / 1000)}k`;
  if (faktor >= 100)   return `×${Math.round(faktor)}`;
  if (faktor > 1)      return `×${faktor.toFixed(1)}`;
  return '×1';
}
