import { useMemo, Fragment, useState } from 'react';
import { REZEPTE_MAP, MASCHINEN, KATEGORIEN } from '../data/recipes';
import {
  maschinenAnzahl, berechneStromverbrauch, analysiereProduktion,
  MASCHINEN_LABEL, MASCHINEN_LABEL_EN, getVerfuegbareMaschinen, BEACON_MODUL_EFFEKTE,
} from '../utils/berechnung';
import { ABSTRACT_TO_MACHINE_ID } from '../data/gamedata-adapter';
import { useForschung } from '../context/ForschungContext';
import { useSprache } from '../context/SprachContext';
import { useModul } from '../context/ModulContext';
import { useQuality } from '../context/QualityContext';
import { BELT_FARBE } from '../data/belts';
import { formatQualityFaktor } from '../data/quality';
import { MASCHINEN_DETAIL_NAME } from '../data/machines';
import { ITEM_ICONS, getItemName } from '../data/gamedata-adapter';
import Icon from './Icon';

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_BEACON_CONFIG = { anzahlBeacons: 0, modulTyp: 'speed-module-3', moduleProBeacon: 2 };

const BEACON_MODUL_GRUPPEN = [
  { key: 'speed',        de: 'Geschwindigkeit', en: 'Speed',        ids: ['speed-module', 'speed-module-2', 'speed-module-3'] },
  { key: 'efficiency',   de: 'Effizienz',       en: 'Efficiency',   ids: ['efficiency-module', 'efficiency-module-2', 'efficiency-module-3'] },
  { key: 'productivity', de: 'Produktivität',   en: 'Productivity', ids: ['productivity-module', 'productivity-module-2', 'productivity-module-3'] },
];

const BEACON_MODUL_NAMEN = {
  de: {
    'speed-module':          'Geschwindigkeitsmodul 1 (+20%)',
    'speed-module-2':        'Geschwindigkeitsmodul 2 (+30%)',
    'speed-module-3':        'Geschwindigkeitsmodul 3 (+50%)',
    'efficiency-module':     'Effizienzmodul 1 (-30% Energie)',
    'efficiency-module-2':   'Effizienzmodul 2 (-40% Energie)',
    'efficiency-module-3':   'Effizienzmodul 3 (-50% Energie)',
    'productivity-module':   'Produktivitätsmodul 1 (+4% Geschw.)',
    'productivity-module-2': 'Produktivitätsmodul 2 (+6% Geschw.)',
    'productivity-module-3': 'Produktivitätsmodul 3 (+10% Geschw.)',
  },
  en: {
    'speed-module':          'Speed Module 1 (+20%)',
    'speed-module-2':        'Speed Module 2 (+30%)',
    'speed-module-3':        'Speed Module 3 (+50%)',
    'efficiency-module':     'Efficiency Module 1 (-30% energy)',
    'efficiency-module-2':   'Efficiency Module 2 (-40% energy)',
    'efficiency-module-3':   'Efficiency Module 3 (-50% energy)',
    'productivity-module':   'Productivity Module 1 (+4% speed)',
    'productivity-module-2': 'Productivity Module 2 (+6% speed)',
    'productivity-module-3': 'Productivity Module 3 (+10% speed)',
  },
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
    qualNormal:        'Normal',
    stromverbrauch:    'Stromverbrauch',
    maschinenTyp:      'Maschinen-Typ',
    kwProMaschine:     'kW / Maschine',
    gesamtKW:          'Gesamt',
    gesamtverbrauch:   'Gesamtverbrauch Fabrik',
    solarEmpfehlung:   'Solarpanels',
    dampfEmpfehlung:   'Dampfmaschinen',
    beaconAnzahl:      'Beacons',
    beaconModul:       'Modultyp',
    beaconProBeacon:   'Module/Beacon',
    beaconGeschw:      'Geschw.',
    beaconEnergie:     'Energie',
    beaconMaschinen:   'Maschinen',
    beaconKonfig:      'Beacons konfigurieren',
    analyseTitle:      '🔍 Produktionsanalyse',
    effizienzHinweis:  v => `Produktion läuft auf ${v}% Effizienz`,
    engpass:           'Engpass',
    engpassText:       (name, ist, soll, aut) =>
      `${name}: ${ist.toFixed(1)}/min benötigt, Maschinen liefern ${soll.toFixed(1)}/min (${aut}% Auslastung)`,
    vorschlaegeTitle:  'Optimierungsvorschläge',
    keinVorschlag:     'Keine Verbesserungen – Produktion ist optimal!',
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
    qualNormal:        'Normal',
    stromverbrauch:    'Power Consumption',
    maschinenTyp:      'Machine type',
    kwProMaschine:     'kW / machine',
    gesamtKW:          'Total',
    gesamtverbrauch:   'Total factory power',
    solarEmpfehlung:   'Solar Panels',
    dampfEmpfehlung:   'Steam Engines',
    beaconAnzahl:      'Beacons',
    beaconModul:       'Module type',
    beaconProBeacon:   'Modules/Beacon',
    beaconGeschw:      'speed',
    beaconEnergie:     'energy',
    beaconMaschinen:   'Machines',
    beaconKonfig:      'Configure beacons',
    analyseTitle:      '🔍 Production Analysis',
    effizienzHinweis:  v => `Production runs at ${v}% efficiency`,
    engpass:           'Bottleneck',
    engpassText:       (name, ist, soll, aut) =>
      `${name}: ${ist.toFixed(1)}/min needed, machines produce ${soll.toFixed(1)}/min (${aut}% utilized)`,
    vorschlaegeTitle:  'Optimization Suggestions',
    keinVorschlag:     'No improvements found – production is optimal!',
  },
};

// ── BeaconKonfigurator ────────────────────────────────────────────────────────

function BeaconKonfigurator({ config, onChange, baseAnzahl, currentAnzahl, sprache, tx }) {
  const modulEffekt     = BEACON_MODUL_EFFEKTE[config.modulTyp] ?? {};
  const speedBonus      = config.anzahlBeacons * config.moduleProBeacon * (modulEffekt.speed  ?? 0) * 0.5 * 100;
  const energyRed       = config.anzahlBeacons * config.moduleProBeacon * Math.abs(modulEffekt.energy ?? 0) * 0.5 * 100;
  const hasSpeedEffect  = speedBonus > 0;
  const hasEnergyEffect = energyRed > 0;
  const machineSaving   = baseAnzahl !== null && currentAnzahl !== null && baseAnzahl !== currentAnzahl;

  const set = (field, val) => onChange({ ...config, [field]: val });

  return (
    <div className="flex flex-wrap gap-4 items-end px-4 py-3 bg-blue-950/30 border border-blue-700/30 rounded-lg">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">{tx.beaconAnzahl}</label>
        <input
          type="number"
          min={0} max={20}
          value={config.anzahlBeacons}
          onChange={e => set('anzahlBeacons', Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0)))}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1 w-20 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">{tx.beaconModul}</label>
        <select
          value={config.modulTyp}
          onChange={e => set('modulTyp', e.target.value)}
          className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          {BEACON_MODUL_GRUPPEN.map(g => (
            <optgroup key={g.key} label={sprache === 'de' ? g.de : g.en}>
              {g.ids.map(id => (
                <option key={id} value={id}>
                  {(BEACON_MODUL_NAMEN[sprache] ?? BEACON_MODUL_NAMEN.en)[id]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">{tx.beaconProBeacon}</label>
        <select
          value={config.moduleProBeacon}
          onChange={e => set('moduleProBeacon', parseInt(e.target.value, 10))}
          className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </div>
      {config.anzahlBeacons > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-800/50 rounded px-3 py-2">
          {hasSpeedEffect && (
            <span className="text-amber-300">⚡ +{speedBonus.toFixed(0)}% {tx.beaconGeschw}</span>
          )}
          {hasEnergyEffect && (
            <span className="text-green-300">🔋 -{energyRed.toFixed(0)}% {tx.beaconEnergie}</span>
          )}
          {machineSaving && (
            <span className="text-gray-300">
              {tx.beaconMaschinen}:{' '}
              <span className="text-gray-400 line-through">{baseAnzahl}</span>
              {' → '}
              <span className="text-green-400 font-bold">{currentAnzahl}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── ProduktionsAnalyse ────────────────────────────────────────────────────────

function ProduktionsAnalyse({ analyseData, tx }) {
  const [offen, setOffen] = useState(false);
  if (!analyseData) return null;

  const { effizienzScore, bottleneck, vorschlaege } = analyseData;
  const scoreColor  = effizienzScore >= 90 ? 'text-green-400' : effizienzScore >= 70 ? 'text-yellow-400' : 'text-red-400';
  const borderColor = effizienzScore >= 90 ? 'border-green-700/40' : effizienzScore >= 70 ? 'border-yellow-700/40' : 'border-red-700/40';

  return (
    <div className={`rounded-xl border ${borderColor} bg-gray-900/60 overflow-hidden`}>
      <button
        onClick={() => setOffen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/30 transition-colors"
      >
        <span className="text-amber-400 font-bold">{tx.analyseTitle}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-0.5">
            <span className={`text-3xl font-black tabular-nums leading-none ${scoreColor}`}>{effizienzScore}</span>
            <span className={`text-lg font-bold ${scoreColor}`}>%</span>
          </div>
          <span className="text-gray-500 text-xs">{offen ? '▲' : '▼'}</span>
        </div>
      </button>

      {offen && (
        <div className="px-4 pb-5 pt-3 flex flex-col gap-4 border-t border-gray-700/40">
          <p className="text-sm text-gray-400">{tx.effizienzHinweis(effizienzScore)}</p>

          {bottleneck && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div>
                <div className="text-red-300 font-semibold text-sm mb-0.5">{tx.engpass}</div>
                <div className="text-gray-300 text-sm">
                  {tx.engpassText(bottleneck.itemName, bottleneck.istDurchsatz, bottleneck.sollDurchsatz, bottleneck.auslastung)}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {tx.vorschlaegeTitle}
            </div>
            {vorschlaege.length === 0 ? (
              <div className="text-sm text-green-400">✓ {tx.keinVorschlag}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {vorschlaege.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-gray-800/50 border border-gray-700/40 rounded-lg px-3 py-2.5"
                  >
                    <span className={`font-bold text-sm flex-shrink-0 mt-0.5 tabular-nums w-7 text-right ${
                      v.ersparnis > 0 ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {v.ersparnis > 0 ? `−${v.ersparnis}` : '→'}
                    </span>
                    <span className="text-gray-200 text-sm">{v.beschreibung}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QualityBadge({ qualitaet }) {
  if (!qualitaet) return null;
  return (
    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded border font-medium align-middle ${qualitaet.badge}`}>
      {qualitaet.icon} {qualitaet.name}
    </span>
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
            {eintraege.map(([maschinenType, entry], i) => {
              const { anzahl, kwProMaschine, totalKW: rawTotalKW, name: overrideName } = entry;
              const totalKW = rawTotalKW ?? (anzahl * kwProMaschine);
              const farbe   = MASCHINEN_FARBE[maschinenType] ?? 'text-gray-400';
              let name;
              if (overrideName) {
                name = sprache === 'de' ? overrideName.de : overrideName.en;
              } else {
                const detailName = MASCHINEN_DETAIL_NAME[maschinenType];
                name = detailName
                  ? (sprache === 'de' ? detailName.de : detailName.en)
                  : (maschinenLabels[maschinenType] ?? maschinenType);
              }
              return (
                <tr key={maschinenType} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                  <td className={`px-4 py-2 font-medium ${farbe}`}>{name}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{anzahl}</td>
                  <td className="px-4 py-2 text-right text-gray-400">{kwProMaschine} kW</td>
                  <td className="px-4 py-2 text-right font-bold text-yellow-400">
                    {totalKW >= 1000
                      ? `${(totalKW / 1000).toFixed(2)} MW`
                      : `${totalKW.toFixed(1)} kW`}
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

function Abschnitt({
  titel, eintraege, zeigeMaschine = false, tx, maschinenLabels,
  beitraegeMap = {}, zeigeBeitraege = false, beltFarbe,
  istQualityAktiv, sprache, onMaschinenOverrideChange = null,
  beaconConfigs = {}, onBeaconConfigChange = null,
  bottleneckId = null,
}) {
  if (eintraege.length === 0) return null;
  const zeigeBaender = eintraege.some(e => e.baender !== null);
  const zeigeBeacon  = zeigeMaschine && !!onBeaconConfigChange;
  const [openBeaconId, setOpenBeaconId] = useState(null);

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
              {zeigeBeacon && (
                <th className="px-2 py-3 text-center text-gray-600 text-base">◈</th>
              )}
            </tr>
          </thead>
          <tbody>
            {eintraege.map((e, i) => {
              const istBottleneck  = e.id === bottleneckId;
              const maschinenFarbe = e.beaconActive ? 'text-green-400' : (MASCHINEN_FARBE[e.maschine] ?? 'text-gray-400');
              const beitraege      = zeigeBeitraege ? (beitraegeMap[e.id] ?? []) : [];
              const hatMehrere     = beitraege.length > 1;
              const rowBg          = i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950';
              const beaconOffen    = openBeaconId === e.id;

              return (
                <Fragment key={e.id}>
                  <tr className={`${rowBg}${istBottleneck ? ' border-l-4 border-red-500' : ''}`}>
                    <td className={`py-2 text-white font-medium ${istBottleneck ? 'pl-3 pr-4' : 'px-4'}`}>
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
                        {e.verfuegbareMaschinen.length > 1 ? (
                          <select
                            value={e.selectedMaschinenId ?? e.defaultMaschinenId ?? e.verfuegbareMaschinen[0]?.id ?? ''}
                            onChange={ev => onMaschinenOverrideChange?.(e.id, ev.target.value)}
                            className="bg-gray-800 border border-gray-600 text-gray-200 text-xs rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[180px] cursor-pointer"
                          >
                            {e.verfuegbareMaschinen.map(m => (
                              <option key={m.id} value={m.id}>
                                {sprache === 'de' ? m.nameDe : m.nameEn} ({m.speed}/s)
                              </option>
                            ))}
                          </select>
                        ) : (
                          maschinenLabels[e.maschine] ?? '—'
                        )}
                      </td>
                    )}
                    {zeigeMaschine && (
                      <td className={`px-4 py-2 text-right font-bold ${maschinenFarbe}`}>
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {e.beaconActive && (
                            <span className="text-xs text-blue-400 font-normal">
                              🔵{e.beaconCfg.anzahlBeacons}
                            </span>
                          )}
                          {e.anzahl ?? '—'}
                        </span>
                      </td>
                    )}
                    {zeigeBeacon && (
                      <td className="px-1 py-2 text-center">
                        <button
                          onClick={() => setOpenBeaconId(beaconOffen ? null : e.id)}
                          title={tx.beaconKonfig}
                          className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                            beaconOffen
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : e.beaconActive
                                ? 'text-blue-400 hover:text-blue-200 hover:bg-blue-900/20'
                                : 'text-gray-600 hover:text-gray-300 hover:bg-gray-700/50'
                          }`}
                        >
                          ◈
                        </button>
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

                  {beaconOffen && zeigeBeacon && (
                    <tr className={rowBg}>
                      <td colSpan={10} className="px-2 pb-2 pt-0">
                        <BeaconKonfigurator
                          config={beaconConfigs[e.id] ?? DEFAULT_BEACON_CONFIG}
                          onChange={cfg => onBeaconConfigChange(e.id, cfg)}
                          baseAnzahl={e.baseAnzahl}
                          currentAnzahl={e.anzahl}
                          sprache={sprache}
                          tx={tx}
                        />
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function ErgebnisTabelle({
  produktion, perItem = [], foerderband = null,
  maschinenOverrides = {}, onMaschinenOverrideChange = null,
  beaconConfigs = {}, onBeaconConfigChange = null,
}) {
  const { boni }           = useForschung();
  const { sprache }        = useSprache();
  const { modulBoni }      = useModul();
  const { zielQualitaet, maschinenQualitaet, gesamtQualityChance, qualityFaktorPerMaschine } = useQuality();
  const tx = T[sprache];

  const stromDaten = useMemo(
    () => berechneStromverbrauch(produktion, boni, modulBoni, maschinenQualitaet.maschinenMulti, maschinenOverrides, beaconConfigs),
    [produktion, boni, modulBoni, maschinenQualitaet.maschinenMulti, maschinenOverrides, beaconConfigs]
  );

  const maschinenLabels = sprache === 'de' ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;
  const istQualityAktiv = zielQualitaet.tierIndex > 0;

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

  const mQMulti = maschinenQualitaet.maschinenMulti;

  const eintraege = Object.entries(produktion).map(([id, rateProSek]) => {
    const rezept      = REZEPTE_MAP[id];
    const istRohstoff = !rezept || rezept.zeit === 0;

    const zielInfo    = zielProduktMap[id];
    const istZiel     = !!zielInfo;
    const displayRate = istZiel ? zielInfo.gewuenschteRateSek : rateProSek;
    const craftingRate = rateProSek;

    const overrideId   = istRohstoff ? null : (maschinenOverrides[id] ?? null);
    const beaconCfg    = istRohstoff ? null : (beaconConfigs[id] ?? null);
    const beaconActive = beaconCfg?.anzahlBeacons > 0;
    const baseAnzahl   = istRohstoff ? null : maschinenAnzahl(id, craftingRate, boni, modulBoni, mQMulti, overrideId, null);
    const anzahl       = beaconActive
      ? maschinenAnzahl(id, craftingRate, boni, modulBoni, mQMulti, overrideId, beaconCfg)
      : baseAnzahl;

    const baender = foerderband?.durchsatz ? Math.ceil(displayRate / foerderband.durchsatz) : null;
    const qualitaet = istZiel ? (zielInfo.qualitaet ?? zielQualitaet) : null;

    const verfuegbareMaschinen = istRohstoff ? [] : getVerfuegbareMaschinen(id);
    const defaultMaschinenId   = rezept ? (ABSTRACT_TO_MACHINE_ID[rezept.maschine] ?? null) : null;

    return {
      id,
      name:                sprache === 'de' ? (rezept?.name ?? getItemName(id, 'de')) : (rezept?.nameEn ?? getItemName(id, 'en')),
      rateProSek:          displayRate,
      rateProMin:          displayRate * 60,
      craftingRate,
      istRohstoff,
      istZiel,
      qualitaet,
      anzahl,
      baseAnzahl,
      beaconCfg,
      beaconActive,
      maschine:            rezept?.maschine ?? null,
      verfuegbareMaschinen,
      selectedMaschinenId: overrideId,
      defaultMaschinenId,
      baender,
    };
  });

  const herstellung = eintraege.filter(e => !e.istRohstoff);
  const rohstoffe   = eintraege.filter(e =>  e.istRohstoff);

  // Analysis (computed inline — only runs when eintraege changes)
  const analyseData = herstellung.length > 0
    ? analysiereProduktion(herstellung, boni, modulBoni, mQMulti, sprache)
    : null;
  const bottleneckId = analyseData?.bottleneck?.rezeptId ?? null;

  const bonusHinweis = boni.miningBonus > 0 || boni.assemblerBonus > 0;
  const aktiveModulBoni = Object.entries(modulBoni).filter(
    ([, b]) => b.speedBonus !== 0 || b.produktivitaet > 0
  );
  const beltFarbe = foerderband ? (BELT_FARBE[foerderband.id] ?? 'text-gray-300') : 'text-gray-300';
  const maxCraftingFaktor = Math.max(...Object.values(qualityFaktorPerMaschine), 1);

  return (
    <div className="flex flex-col gap-6 mt-6">

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

      {istQualityAktiv && (
        <div className="flex flex-wrap items-center gap-3 text-xs bg-gray-800/50 rounded-lg px-3 py-2">
          <span className={zielQualitaet.farbe}>★ {tx.qualitaetAktiv}</span>
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
        onMaschinenOverrideChange={onMaschinenOverrideChange}
        beaconConfigs={beaconConfigs}
        onBeaconConfigChange={onBeaconConfigChange}
        bottleneckId={bottleneckId}
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

      <ProduktionsAnalyse analyseData={analyseData} tx={tx} />
    </div>
  );
}
