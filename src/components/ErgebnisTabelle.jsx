import { useMemo, Fragment, useState } from 'react';
import { REZEPTE_MAP, MASCHINEN, KATEGORIEN } from '../data/recipes';
import { maschinenAnzahl, berechneStromverbrauch, MASCHINEN_LABEL, MASCHINEN_LABEL_EN } from '../utils/berechnung';
import { useForschung } from '../context/ForschungContext';
import { useSprache } from '../context/SprachContext';
import { useModul } from '../context/ModulContext';
import { useQuality } from '../context/QualityContext';
import { BELT_FARBE } from '../data/belts';
import { formatQualityFaktor } from '../data/quality';
import { MASCHINEN_DETAIL_NAME } from '../data/machines';
import { ITEM_ICONS, getItemName } from '../data/gamedata-adapter';
import Icon from './Icon';

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


const MASCHINEN_FARBE = {
  [MASCHINEN.SCHMELZOFEN]:  'text-orange-400',
  [MASCHINEN.ASSEMBLER]:    'text-blue-400',
  [MASCHINEN.CHEMIEANLAGE]: 'text-cyan-400',
  [MASCHINEN.OELRAFFINERIE]:'text-yellow-500',
  [MASCHINEN.ZENTRIFUGE]:   'text-green-400',
  [MASCHINEN.HOCHOFEN]:     'text-red-400',
  [MASCHINEN.EM_ANLAGE]:    'text-violet-400',
  [MASCHINEN.BIOKAMMER]:    'text-lime-400',
  [MASCHINEN.KRYOGENANLAGE]:'text-sky-300',
  [MASCHINEN.RAUMPLATTFORM]:'text-indigo-300',
  [MASCHINEN.BERGBAU]:      'text-gray-400',
};

const ITEM_FARBEN = [
  'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'bg-pink-500/20 text-pink-300 border-pink-500/40',
  'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'bg-lime-500/20 text-lime-300 border-lime-500/40',
];

const T = {
  de: {
    herstellung:       'Herstellung',
    rohstoffe:         'Rohstoffe / Fluide',
    produkt:           'Produkt',
    proMin:            '/ Min',
    proSek:            '/ Sek',
    maschine:          'Maschine',
    anzahl:            'Anz.',
    baender:           'Bänder',
    boniAktiv:         'Forschungsboni aktiv:',
    bergbauBonus:      (v) => `⛏ Bergbau-Produktivität +${v}%`,
    assemblerBonus:    (v) => `⚙ Assembler-Geschwindigkeit +${v}%`,
    qualitaetAktiv:    'Quality-Crafting:',
    zielQualitaet:     'Ziel',
    maschinenQ:        'Maschinen',
    craftingFaktor:    'Crafting-Faktor',
    craftingRate:      'Crafting-Rate',
    qualNormal:        'Normal',
    stromverbrauch:    'Stromverbrauch',
    maschinenTyp:      'Maschinen-Typ',
    kwProMaschine:     'kW / Maschine',
    gesamtKW:          'Gesamt',
    gesamtverbrauch:   'Gesamtverbrauch Fabrik',
    solarEmpfehlung:   'Solarpanels',
    dampfEmpfehlung:   'Dampfmaschinen',
    empfehlung:        'Energieempfehlung',
  },
  en: {
    herstellung:       'Production',
    rohstoffe:         'Resources / Fluids',
    produkt:           'Product',
    proMin:            '/ Min',
    proSek:            '/ Sec',
    maschine:          'Machine',
    anzahl:            'Qty.',
    baender:           'Belts',
    boniAktiv:         'Research bonuses active:',
    bergbauBonus:      (v) => `⛏ Mining Productivity +${v}%`,
    assemblerBonus:    (v) => `⚙ Assembler Speed +${v}%`,
    qualitaetAktiv:    'Quality Crafting:',
    zielQualitaet:     'Target',
    maschinenQ:        'Machines',
    craftingFaktor:    'Crafting factor',
    craftingRate:      'Crafting rate',
    qualNormal:        'Normal',
    stromverbrauch:    'Power Consumption',
    maschinenTyp:      'Machine type',
    kwProMaschine:     'kW / machine',
    gesamtKW:          'Total',
    gesamtverbrauch:   'Total factory power',
    solarEmpfehlung:   'Solar Panels',
    dampfEmpfehlung:   'Steam Engines',
    empfehlung:        'Power recommendation',
  },
};

export default function ErgebnisTabelle({ produktion, perItem = [], foerderband = null }) {
  const { boni }           = useForschung();
  const { sprache }        = useSprache();
  const { modulBoni }      = useModul();
  const { zielQualitaet, maschinenQualitaet, gesamtQualityChance, qualityFaktorPerMaschine } = useQuality();
  const tx = T[sprache];

  const stromDaten = useMemo(
    () => berechneStromverbrauch(produktion, boni, modulBoni, maschinenQualitaet.maschinenMulti),
    [produktion, boni, modulBoni, maschinenQualitaet.maschinenMulti]
  );

  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;

  const istQualityAktiv = zielQualitaet.tierIndex > 0;

  // Map: ZielproduktId → { gewuenschteRateSek, qualitaet, craftingFaktor }
  const zielProduktMap = useMemo(() => {
    const map = {};
    for (const p of perItem) {
      if (!p.id) continue;
      map[p.id] = {
        gewuenschteRateSek: p.mengeProMin / 60,
        qualitaet:          p.qualitaet ?? zielQualitaet,
        craftingFaktor:     p.qualityFaktor ?? 1,
      };
    }
    return map;
  }, [perItem, zielQualitaet]);

  const beitraegeMap = useMemo(() => {
    if (perItem.length <= 1) return {};
    const result = {};
    for (let i = 0; i < perItem.length; i++) {
      const item = perItem[i];
      const name = sprache === 'de'
        ? (REZEPTE_MAP[item.id]?.name   ?? item.id)
        : (REZEPTE_MAP[item.id]?.nameEn ?? item.id);
      for (const [rid, rate] of Object.entries(item.produktion)) {
        if (!result[rid]) result[rid] = [];
        result[rid].push({ id: item.id, name, rateProMin: rate * 60, colorIdx: i % ITEM_FARBEN.length });
      }
    }
    return result;
  }, [perItem, sprache]);

  const zeigeBeitraege = perItem.length > 1;

  if (!produktion || Object.keys(produktion).length === 0) return null;

  const eintraege = Object.entries(produktion).map(([id, rateProSek]) => {
    const rezept      = REZEPTE_MAP[id];
    const istRohstoff = !rezept || rezept.zeit === 0;

    // Zielprodukte: Wunsch-Rate anzeigen, Crafting-Rate für Maschinenberechnung nutzen
    const zielInfo   = zielProduktMap[id];
    const istZiel    = !!zielInfo;
    const displayRate = istZiel ? zielInfo.gewuenschteRateSek : rateProSek;
    const craftingRate = rateProSek; // immer Akkumulator-Rate (= Crafting-Rate)

    // Maschinenqualitäts-Multiplikator für Geschwindigkeit
    const mQMulti = maschinenQualitaet.maschinenMulti;
    const anzahl  = istRohstoff ? null : maschinenAnzahl(id, craftingRate, boni, modulBoni, mQMulti);

    const baender = foerderband?.durchsatz ? Math.ceil(displayRate / foerderband.durchsatz) : null;

    // Quality-Badge: Zielprodukte bekommen die Ziel-Qualität, andere Normal
    const qualitaet = istZiel ? (zielInfo.qualitaet ?? zielQualitaet) : null;

    return {
      id,
      name:         sprache === 'de' ? (rezept?.name ?? getItemName(id, 'de')) : (rezept?.nameEn ?? getItemName(id, 'en')),
      rateProSek:   displayRate,
      rateProMin:   displayRate * 60,
      craftingRate,
      istRohstoff,
      istZiel,
      qualitaet,
      anzahl,
      maschine:     rezept?.maschine ?? null,
      baender,
    };
  });

  const herstellung = eintraege.filter(e => !e.istRohstoff);
  const rohstoffe   = eintraege.filter(e =>  e.istRohstoff);

  const bonusHinweis = boni.miningBonus > 0 || boni.assemblerBonus > 0;

  const aktiveModulBoni = Object.entries(modulBoni).filter(
    ([, b]) => b.speedBonus !== 0 || b.produktivitaet > 0
  );

  const beltFarbe = foerderband ? (BELT_FARBE[foerderband.id] ?? 'text-gray-300') : 'text-gray-300';

  // Besten Crafting-Faktor ermitteln (für Info-Zeile)
  const maxCraftingFaktor = Math.max(...Object.values(qualityFaktorPerMaschine), 1);

  return (
    <div className="flex flex-col gap-6 mt-6">

      {/* Forschungsboni */}
      {bonusHinweis && (
        <div className="flex gap-4 text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2">
          <span className="text-amber-400 font-semibold">{tx.boniAktiv}</span>
          {boni.miningBonus > 0 && (
            <span>{tx.bergbauBonus((boni.miningBonus * 100).toFixed(0))}</span>
          )}
          {boni.assemblerBonus > 0 && (
            <span>{tx.assemblerBonus((boni.assemblerBonus * 100).toFixed(0))}</span>
          )}
        </div>
      )}

      {/* Aktive Modulboni */}
      {aktiveModulBoni.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs bg-gray-800/50 rounded-lg px-3 py-2">
          <span className="text-green-400 font-semibold shrink-0">
            {sprache === 'de' ? 'Module aktiv:' : 'Modules active:'}
          </span>
          {aktiveModulBoni.map(([maschinenType, b]) => (
            <span key={maschinenType} className="text-gray-400">
              {maschinenLabels[maschinenType]}:
              {b.speedBonus  !== 0 && ` ⚡${b.speedBonus > 0 ? '+' : ''}${(b.speedBonus * 100).toFixed(0)}%`}
              {b.produktivitaet > 0 && ` 📦+${(b.produktivitaet * 100).toFixed(0)}%`}
            </span>
          ))}
        </div>
      )}

      {/* Quality-Crafting-Info */}
      {istQualityAktiv && (
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-800/50 rounded-lg px-3 py-2">
          <span className="font-semibold" style={{ color: 'inherit' }}>
            <span className={zielQualitaet.farbe}>★ {tx.qualitaetAktiv}</span>
          </span>

          <span className={`px-2 py-0.5 rounded border font-medium ${zielQualitaet.badge}`}>
            {tx.zielQualitaet}: {zielQualitaet.icon} {sprache === 'de' ? zielQualitaet.name : zielQualitaet.nameEn}
          </span>

          <span className={`px-2 py-0.5 rounded border font-medium ${maschinenQualitaet.badge}`}>
            {tx.maschinenQ}: {maschinenQualitaet.icon} {sprache === 'de' ? maschinenQualitaet.name : maschinenQualitaet.nameEn}
            {maschinenQualitaet.maschinenMulti !== 1 && ` (⚡×${maschinenQualitaet.maschinenMulti})`}
          </span>

          {gesamtQualityChance > 0 && (
            <>
              <span className="text-gray-400">
                {tx.craftingFaktor}: <span className="text-amber-300 font-bold">{formatQualityFaktor(maxCraftingFaktor)}</span>
              </span>
              <span className="text-gray-500">
                ({(gesamtQualityChance * 100).toFixed(1)}% {sprache === 'de' ? 'Chance' : 'chance'})
              </span>
            </>
          )}

          {gesamtQualityChance === 0 && (
            <span className="text-amber-300">
              {sprache === 'de'
                ? '⚠ Keine Qualitätsmodule → Zutaten werden nicht angepasst'
                : '⚠ No quality modules → ingredients not adjusted'}
            </span>
          )}
        </div>
      )}

      <Abschnitt
        titel={tx.herstellung}
        eintraege={herstellung}
        zeigeMaschine
        tx={tx}
        maschinenLabels={maschinenLabels}
        beitraegeMap={beitraegeMap}
        zeigeBeitraege={zeigeBeitraege}
        beltFarbe={beltFarbe}
        istQualityAktiv={istQualityAktiv}
        sprache={sprache}
      />
      <Abschnitt
        titel={tx.rohstoffe}
        eintraege={rohstoffe}
        tx={tx}
        maschinenLabels={maschinenLabels}
        beitraegeMap={beitraegeMap}
        zeigeBeitraege={zeigeBeitraege}
        beltFarbe={beltFarbe}
        istQualityAktiv={istQualityAktiv}
        sprache={sprache}
      />

      {stromDaten.gesamtKW > 0 && (
        <StromverbrauchAbschnitt
          stromDaten={stromDaten}
          tx={tx}
          sprache={sprache}
          maschinenLabels={maschinenLabels}
        />
      )}
    </div>
  );
}

function StromverbrauchAbschnitt({ stromDaten, tx, sprache, maschinenLabels }) {
  const { perTyp, gesamtMW, solarPanels, dampfmaschinen } = stromDaten;
  const eintraege = Object.entries(perTyp);

  return (
    <div>
      <h2 className="text-amber-400 font-bold text-lg mb-3 border-b border-gray-700 pb-1">
        ⚡ {tx.stromverbrauch}
      </h2>

      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-3">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">{tx.maschinenTyp}</th>
              <th className="px-4 py-3 text-right">{tx.anzahl}</th>
              <th className="px-4 py-3 text-right">{tx.kwProMaschine}</th>
              <th className="px-4 py-3 text-right">{tx.gesamtKW}</th>
            </tr>
          </thead>
          <tbody>
            {eintraege.map(([maschinenType, { anzahl, kwProMaschine }], i) => {
              const totalKW  = anzahl * kwProMaschine;
              const farbe    = MASCHINEN_FARBE[maschinenType] ?? 'text-gray-400';
              const detailName = MASCHINEN_DETAIL_NAME[maschinenType];
              const name     = detailName
                ? (sprache === 'de' ? detailName.de : detailName.en)
                : (maschinenLabels[maschinenType] ?? maschinenType);
              return (
                <tr key={maschinenType} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                  <td className={`px-4 py-2 font-medium ${farbe}`}>{name}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{anzahl}</td>
                  <td className="px-4 py-2 text-right text-gray-400">{kwProMaschine} kW</td>
                  <td className="px-4 py-2 text-right font-bold text-yellow-400">
                    {totalKW >= 1000
                      ? `${(totalKW / 1000).toFixed(2)} MW`
                      : `${totalKW} kW`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-gray-800/50 rounded-lg px-4 py-3 text-sm">
        <div>
          <span className="text-gray-400">{tx.gesamtverbrauch}:</span>
          <span className="text-yellow-300 font-bold ml-2">
            {gesamtMW >= 1
              ? `${gesamtMW.toFixed(2)} MW`
              : `${(gesamtMW * 1000).toFixed(0)} kW`}
          </span>
        </div>

        <div className="h-4 border-l border-gray-600 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-yellow-500">☀</span>
          <span className="text-gray-400">{tx.solarEmpfehlung}:</span>
          <span className="text-amber-300 font-bold">{solarPanels}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-blue-400">💨</span>
          <span className="text-gray-400">{tx.dampfEmpfehlung}:</span>
          <span className="text-blue-300 font-bold">{dampfmaschinen}</span>
        </div>
      </div>
    </div>
  );
}

function QualityBadge({ qualitaet }) {
  if (!qualitaet) return null;
  return (
    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded border font-medium align-middle ${qualitaet.badge}`}>
      {qualitaet.icon} {qualitaet.name}
    </span>
  );
}

function Abschnitt({
  titel, eintraege, zeigeMaschine = false, tx, maschinenLabels,
  beitraegeMap = {}, zeigeBeitraege = false, beltFarbe,
  istQualityAktiv, sprache,
}) {
  if (eintraege.length === 0) return null;
  const zeigeBaender = eintraege.some(e => e.baender !== null);

  return (
    <div>
      <h2 className="text-amber-400 font-bold text-lg mb-3 border-b border-gray-700 pb-1">{titel}</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">{tx.produkt}</th>
              <th className="px-4 py-3 text-right">{tx.proMin}</th>
              <th className="px-4 py-3 text-right">{tx.proSek}</th>
              {zeigeBaender && (
                <th className={`px-4 py-3 text-right ${beltFarbe}`}>{tx.baender}</th>
              )}
              {zeigeMaschine && (
                <th className="px-4 py-3 text-right hidden md:table-cell">{tx.maschine}</th>
              )}
              {zeigeMaschine && (
                <th className="px-4 py-3 text-right">{tx.anzahl}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {eintraege.map((e, i) => {
              const farbe      = MASCHINEN_FARBE[e.maschine] ?? 'text-gray-400';
              const beitraege  = zeigeBeitraege ? (beitraegeMap[e.id] ?? []) : [];
              const hatMehrere = beitraege.length > 1;
              const rowBg      = i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950';

              return (
                <Fragment key={e.id}>
                  <tr className={rowBg}>
                    <td className="px-4 py-2 text-white font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon id={e.id} size={20} />
                        <span>{e.name}</span>
                      </span>
                      {istQualityAktiv && e.qualitaet && (
                        <QualityBadge qualitaet={e.qualitaet} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-green-400">{e.rateProMin.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{e.rateProSek.toFixed(3)}</td>
                    {zeigeBaender && (
                      <td className={`px-4 py-2 text-right font-bold ${e.baender !== null ? beltFarbe : 'text-gray-600'}`}>
                        {e.baender !== null ? e.baender : '—'}
                      </td>
                    )}
                    {zeigeMaschine && (
                      <td className="px-4 py-2 text-right text-xs hidden md:table-cell text-gray-400">
                        {maschinenLabels[e.maschine] ?? '—'}
                      </td>
                    )}
                    {zeigeMaschine && (
                      <td className={`px-4 py-2 text-right font-bold ${farbe}`}>
                        {e.anzahl ?? '—'}
                      </td>
                    )}
                  </tr>
                  {hatMehrere && (
                    <tr className={rowBg}>
                      <td colSpan={10} className="px-4 pb-2.5 pt-0">
                        <div className="flex gap-1.5 flex-wrap">
                          {beitraege.map(b => (
                            <span
                              key={b.id}
                              className={`text-xs px-2 py-0.5 rounded-full border ${ITEM_FARBEN[b.colorIdx]}`}
                            >
                              {b.name}: {b.rateProMin.toFixed(1)}/min
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
