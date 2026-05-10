import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import VergleichsAnsicht from './components/Vergleich';
import ExportModal from './components/ExportModal';
import ProduktAuswahl from './components/ProduktAuswahl';
import MengenEingabe from './components/MengenEingabe';
import ErgebnisTabelle from './components/ErgebnisTabelle';
import ProduktionsBaum from './components/ProduktionsBaum';
import FlowDiagramm from './components/FlowDiagramm';
import PlanManager from './components/PlanManager';
import ForschungsBaum from './components/ForschungsBaum';
import ModulAuswahl from './components/ModulAuswahl';
import ModulOptimierung from './components/ModulOptimierung';
import QualityAuswahl from './components/QualityAuswahl';
import QualityRechner from './components/QualityRechner';
import FabrikPlaner from './components/FabrikPlaner';
import { ForschungProvider, useForschung } from './context/ForschungContext';
import { SprachProvider, useSprache } from './context/SprachContext';
import { ModulProvider, useModul } from './context/ModulContext';
import { QualityProvider, useQuality } from './context/QualityContext';
import { BerechnungProvider, useBerechnung } from './context/BerechnungContext';
import { TechtreeProvider, useTechtree } from './context/TechtreeContext';
import { TooltipProvider } from './context/TooltipContext';
import ItemTooltip from './components/ItemTooltip';
import EinstellungenModal from './components/EinstellungenModal';
import SnapshotManager from './components/SnapshotManager';
import PlanetenAuswahl from './components/PlanetenAuswahl';
import { EinstellungenProvider, useEinstellungen } from './context/EinstellungenContext';
import { PlanetenProvider } from './context/PlanetenContext';
import { berechneProduktion, maschinenAnzahl, getVerfuegbareRezepte } from './utils/berechnung';
import { encodePlan, decodePlan } from './utils/planShare';
import { REZEPTE_MAP, MASCHINEN } from './data/recipes';
import { MASCHINEN_PER_TYPE } from './data/gamedata-adapter';
import { FOERDERBAENDER, FOERDERBAENDER_MAP } from './data/belts';

const TABS = {
  de: [
    { id: 'rechner',      label: '⚙️ Rechner' },
    { id: 'optimierung',  label: '🎯 Modul-Optimierung' },
    { id: 'qualitaet',    label: '✨ Qualität' },
    { id: 'forschung',    label: '🔬 Forschung' },
    { id: 'fabrikplaner', label: '🏗️ Fabrikplaner' },
  ],
  en: [
    { id: 'rechner',      label: '⚙️ Calculator' },
    { id: 'optimierung',  label: '🎯 Module Optimizer' },
    { id: 'qualitaet',    label: '✨ Quality' },
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
    leerTitel:     'Kein Produkt ausgewählt',
    foerderband:   'Förderband',
    module:        'Module',
    rezept:        'Rezept',
    teilenBtn:     '🔗 Plan teilen',
    teilenKopiert: '✓ Link kopiert!',
    ansichtTabelle: '☰ Tabelle',
    ansichtBaum:    '🌿 Baum',
    ansichtFlow:    '〰 Flow',
  },
  en: {
    konfigurieren: 'Configure production',
    hinzufuegen:   '+ Add product',
    zuruecksetzen: 'Reset',
    entfernen:     'Remove',
    hinweis:       'Select a product to calculate the production chain.',
    leerTitel:     'No product selected',
    foerderband:   'Belt type',
    module:        'Modules',
    rezept:        'Recipe',
    teilenBtn:     '🔗 Share plan',
    teilenKopiert: '✓ Copied!',
    ansichtTabelle: '☰ Table',
    ansichtBaum:    '🌿 Tree',
    ansichtFlow:    '〰 Flow',
  },
};

const LS_ANSICHT = 'factoryplanner_ansicht_v1';

// Full-height tabs that need no scroll wrapper
const FULLSCREEN_TABS = new Set(['forschung', 'fabrikplaner']);

const LS_KEY = 'factoryplanner_rechner_v1';

const MASCHINEN_TYP_LABEL = {
  de: {
    [MASCHINEN.ASSEMBLER]:    'Montage',
    [MASCHINEN.SCHMELZOFEN]:  'Schmelze',
    [MASCHINEN.CHEMIEANLAGE]: 'Chemie',
    [MASCHINEN.OELRAFFINERIE]:'Ölverarb.',
    [MASCHINEN.ZENTRIFUGE]:   'Zentrifuge',
    [MASCHINEN.HOCHOFEN]:     'Hochofen',
    [MASCHINEN.EM_ANLAGE]:    'Elektromagn.',
    [MASCHINEN.BIOKAMMER]:    'Biokammer',
    [MASCHINEN.KRYOGENANLAGE]:'Kryogen',
    [MASCHINEN.BERGBAU]:      'Bergbau',
    [MASCHINEN.RECYCLER]:     'Recycler',
    [MASCHINEN.CRUSHER]:      'Zerkleinerer',
    [MASCHINEN.RAUMPLATTFORM]:'Raumplattf.',
  },
  en: {
    [MASCHINEN.ASSEMBLER]:    'Assembly',
    [MASCHINEN.SCHMELZOFEN]:  'Smelting',
    [MASCHINEN.CHEMIEANLAGE]: 'Chemistry',
    [MASCHINEN.OELRAFFINERIE]:'Oil Proc.',
    [MASCHINEN.ZENTRIFUGE]:   'Centrifuge',
    [MASCHINEN.HOCHOFEN]:     'Foundry',
    [MASCHINEN.EM_ANLAGE]:    'EM Plant',
    [MASCHINEN.BIOKAMMER]:    'Biochamber',
    [MASCHINEN.KRYOGENANLAGE]:'Cryogenics',
    [MASCHINEN.BERGBAU]:      'Mining',
    [MASCHINEN.RECYCLER]:     'Recycler',
    [MASCHINEN.CRUSHER]:      'Crusher',
    [MASCHINEN.RAUMPLATTFORM]:'Space Platf.',
  },
};

function GlobaleMaschinenAuswahl({ globaleMaschinen, setGlobaleMaschine, sprache }) {
  const typen = Object.entries(MASCHINEN_PER_TYPE)
    .filter(([, maschinen]) => maschinen.length > 1)
    .map(([typ, maschinen]) => ({ typ, maschinen }));

  if (typen.length === 0) return null;

  const header = sprache === 'de' ? 'Maschinen (global)' : 'Machines (global)';
  const labels = MASCHINEN_TYP_LABEL[sprache] ?? MASCHINEN_TYP_LABEL.de;

  return (
    <div className="mt-4 pt-4 border-t border-gray-700/50">
      <div className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">{header}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {typen.map(({ typ, maschinen }) => {
          const selectedId = globaleMaschinen[typ] ?? maschinen[0].id;
          return (
            <div key={typ} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 shrink-0">{labels[typ] ?? typ}:</span>
              <select
                value={selectedId}
                onChange={e => setGlobaleMaschine(typ, e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {maschinen.map(m => (
                  <option key={m.id} value={m.id}>
                    {sprache === 'de' ? m.nameDe : m.nameEn}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseItemsArr(arr) {
  return arr.map((p, i) => ({
    key: i + 1,
    id: typeof p.id === 'string' ? p.id : '',
    mengeProMin: typeof p.mengeProMin === 'number' && p.mengeProMin > 0 ? p.mengeProMin : 60,
    rezeptOverride: typeof p.rezeptOverride === 'string' ? p.rezeptOverride : null,
  }));
}

function ladeGespeicherteItems() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
    if (!arr.length) return null;
    return parseItemsArr(arr);
  } catch {
    return null;
  }
}

function ladeInitialMaschinenOverrides() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return {};
    return typeof parsed.maschinenOverrides === 'object' && parsed.maschinenOverrides !== null
      ? parsed.maschinenOverrides
      : {};
  } catch { return {}; }
}

function ladeInitialBeaconConfigs() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return {};
    return typeof parsed.beaconConfigs === 'object' && parsed.beaconConfigs !== null
      ? parsed.beaconConfigs
      : {};
  } catch { return {}; }
}

function ladeInitialItems() {
  const param = new URLSearchParams(window.location.search).get('plan');
  if (param) {
    const decoded = decodePlan(param);
    if (decoded?.length) {
      window.history.replaceState({}, '', window.location.pathname);
      return decoded;
    }
  }
  return ladeGespeicherteItems() ?? [{ key: 1, id: '', mengeProMin: 60, rezeptOverride: null }];
}

function RechnerTab({ sprache, onReset }) {
  const { einstellungen }                            = useEinstellungen();
  const [items, setItems]                           = useState(ladeInitialItems);
  const [maschinenOverrides, setMaschinenOverrides] = useState(ladeInitialMaschinenOverrides);
  const [beaconConfigs, setBeaconConfigs]           = useState(ladeInitialBeaconConfigs);
  const [bandId, setBandId]                         = useState(() => einstellungen.standardBandId ?? 'keins');
  const [zeigeModule, setZeigeModule]               = useState(false);
  const [linkKopiert, setLinkKopiert]               = useState(false);
  const [ansicht, setAnsicht] = useState(() => {
    try { return localStorage.getItem(LS_ANSICHT) ?? 'tabelle'; } catch { return 'tabelle'; }
  });
  const [vergleichModus, setVergleichModus]         = useState(false);
  const vergleichInitialARef                        = useRef(null);
  const [zeigeExport, setZeigeExport]               = useState(false);
  const keyRef = useRef(1000);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({
      items: items.map(i => ({ id: i.id, mengeProMin: i.mengeProMin, rezeptOverride: i.rezeptOverride })),
      maschinenOverrides,
      beaconConfigs,
    }));
  }, [items, maschinenOverrides, beaconConfigs]);

  useEffect(() => {
    try { localStorage.setItem(LS_ANSICHT, ansicht); } catch {}
  }, [ansicht]);

  const { boni: boniForscht }                             = useForschung();
  const { modulBoni }                                     = useModul();
  const { zielQualitaet, maschinenQualitaet, getQualityFaktorFuerMaschine } = useQuality();
  const { setMaschinenListe, ignorierteItems, toggleIgnoriertesItem } = useBerechnung();
  const { techtreeModus, globaleMaschinen, setGlobaleMaschine } = useTechtree();
  const boni = techtreeModus ? boniForscht : { miningBonus: 0, assemblerBonus: 0 };

  const onPlanLoad = (neueItems) => {
    setItems(neueItems.map((it, i) => ({ ...it, key: keyRef.current + i + 1 })));
    keyRef.current += neueItems.length + 1;
  };

  const addItem    = () => setItems(prev => [...prev, { key: keyRef.current++, id: '', mengeProMin: 60, rezeptOverride: null }]);
  const removeItem = key => setItems(prev => prev.length > 1 ? prev.filter(i => i.key !== key) : prev);
  const updateId   = (key, id) => setItems(prev => prev.map(i => i.key === key ? { ...i, id, rezeptOverride: null } : i));
  const updateMenge= (key, menge) => setItems(prev => prev.map(i => i.key === key ? { ...i, mengeProMin: menge } : i));
  const updateRezeptOverride = (key, rezeptId) => setItems(prev => prev.map(i => i.key === key ? { ...i, rezeptOverride: rezeptId } : i));
  const resetAll   = () => setItems([{ key: keyRef.current++, id: '', mengeProMin: 60, rezeptOverride: null }]);
  const updateMaschinenOverride = (rezeptId, maschinenId) =>
    setMaschinenOverrides(prev => ({ ...prev, [rezeptId]: maschinenId }));

  const updateBeaconConfig = (itemId, config) =>
    setBeaconConfigs(prev => ({ ...prev, [itemId]: config }));

  const teilePlan  = () => {
    const encoded = encodePlan(items);
    if (!encoded) return;
    const url = window.location.origin + '?plan=' + encoded;
    navigator.clipboard.writeText(url).then(() => {
      setLinkKopiert(true);
      setTimeout(() => setLinkKopiert(false), 1500);
    });
  };

  const rezeptOverrides = useMemo(() => {
    const map = {};
    for (const item of items) {
      if (item.id && item.rezeptOverride) map[item.id] = item.rezeptOverride;
    }
    return map;
  }, [items]);

  const { combined, perItem } = useMemo(() => {
    const active = items.filter(i => i.id && i.mengeProMin > 0);
    if (!active.length) return { combined: {}, perItem: [] };

    const perItemList = active.map(item => {
      const effektivRezeptId = item.rezeptOverride ?? item.id;
      const rezept        = REZEPTE_MAP[effektivRezeptId] ?? REZEPTE_MAP[item.id];
      const maschinenType = rezept?.maschine;
      const qualityFaktor = getQualityFaktorFuerMaschine(maschinenType);
      const craftingRateSek = (item.mengeProMin / 60) * qualityFaktor;
      const produktion = berechneProduktion(item.id, craftingRateSek, {}, modulBoni, rezeptOverrides, ignorierteItems);
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
  }, [items, modulBoni, zielQualitaet, getQualityFaktorFuerMaschine, rezeptOverrides, ignorierteItems]);

  // In Frei-Modus: overlay global machine per category for all recipes without a per-recipe override
  const effectiveMaschinenOverrides = useMemo(() => {
    if (techtreeModus) return maschinenOverrides;
    const result = {};
    for (const id of Object.keys(combined)) {
      if (maschinenOverrides[id]) { result[id] = maschinenOverrides[id]; continue; }
      const rezept = REZEPTE_MAP[id];
      if (!rezept?.maschine) continue;
      const global = globaleMaschinen[rezept.maschine];
      if (global) result[id] = global;
    }
    return result;
  }, [techtreeModus, maschinenOverrides, globaleMaschinen, combined]);

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
          anzahl:     maschinenAnzahl(id, rateProSek, boni, modulBoni, mQMulti, effectiveMaschinenOverrides[id] ?? null, beaconConfigs[id] ?? null),
          rateProMin: rateProSek * 60,
          rateProSek,
        };
      });
  }, [combined, boni, modulBoni, maschinenQualitaet, effectiveMaschinenOverrides, beaconConfigs]);

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

  const aktiviereVergleich = () => {
    vergleichInitialARef.current = {
      items:              items.map(i => ({ ...i })),
      maschinenOverrides: { ...maschinenOverrides },
      beaconConfigs:      JSON.parse(JSON.stringify(beaconConfigs)),
    };
    setVergleichModus(true);
  };

  const handleSetupBUebernehmen = ({ items: newItems, maschinenOverrides: newMO, beaconConfigs: newBC }) => {
    setItems(newItems.map((it, i) => ({ ...it, key: keyRef.current + i + 1 })));
    keyRef.current += newItems.length + 1;
    setMaschinenOverrides(newMO);
    setBeaconConfigs(newBC);
    setVergleichModus(false);
  };

  if (vergleichModus && vergleichInitialARef.current) {
    return (
      <VergleichsAnsicht
        initialA={vergleichInitialARef.current}
        onBeenden={() => setVergleichModus(false)}
        onSetupBUebernehmen={handleSetupBUebernehmen}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 min-w-0">
          <PlanManager
            currentItems={items}
            onPlanLoad={onPlanLoad}
            sprache={sprache}
          />
        </div>
        <SnapshotManager sprache={sprache} onReset={onReset} />
      </div>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-amber-400 font-bold text-base uppercase tracking-wide">
            {tx.konfigurieren}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={aktiviereVergleich}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors border border-gray-600"
              title={sprache === 'de' ? 'Zwei Setups nebeneinander vergleichen' : 'Compare two setups side by side'}
            >
              ⚖️ {sprache === 'de' ? 'Vergleichen' : 'Compare'}
            </button>
            {hasResult && (
              <button
                onClick={() => setZeigeExport(true)}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors border border-gray-600"
                title={sprache === 'de' ? 'Plan exportieren' : 'Export plan'}
              >
                📤 {sprache === 'de' ? 'Exportieren' : 'Export'}
              </button>
            )}
            {hasSelected && (
              <button
                onClick={teilePlan}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
              >
                {linkKopiert ? tx.teilenKopiert : tx.teilenBtn}
              </button>
            )}
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
              {item.id && (() => {
                const rezepte = getVerfuegbareRezepte(item.id);
                if (rezepte.length <= 1) return null;
                return (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">{tx.rezept}</label>
                    <select
                      value={item.rezeptOverride ?? item.id}
                      onChange={e => updateRezeptOverride(item.key, e.target.value)}
                      className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[220px]"
                    >
                      {rezepte.map(r => (
                        <option key={r.id} value={r.id}>
                          {sprache === 'de' ? r.name : r.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
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

        {!techtreeModus && (
          <GlobaleMaschinenAuswahl
            globaleMaschinen={globaleMaschinen}
            setGlobaleMaschine={setGlobaleMaschine}
            sprache={sprache}
          />
        )}
      </section>

      {hasResult ? (
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-5">
            {[
              { id: 'tabelle', label: tx.ansichtTabelle },
              { id: 'baum',    label: tx.ansichtBaum },
              { id: 'flow',    label: tx.ansichtFlow },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => setAnsicht(a.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  ansicht === a.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {ansicht === 'tabelle' && (
            <ErgebnisTabelle
              produktion={combined}
              perItem={perItem}
              foerderband={foerderband?.id !== 'keins' ? foerderband : null}
              maschinenOverrides={effectiveMaschinenOverrides}
              onMaschinenOverrideChange={techtreeModus ? updateMaschinenOverride : null}
              beaconConfigs={beaconConfigs}
              onBeaconConfigChange={updateBeaconConfig}
              ignorierteItems={ignorierteItems}
              onToggleIgnoriertesItem={toggleIgnoriertesItem}
            />
          )}
          {ansicht === 'baum' && (
            <ProduktionsBaum
              perItem={perItem}
              maschinenOverrides={maschinenOverrides}
              rezeptOverrides={rezeptOverrides}
            />
          )}
          {ansicht === 'flow' && (
            <FlowDiagramm
              combined={combined}
              perItem={perItem}
              ignorierteItems={ignorierteItems}
            />
          )}
        </section>
      ) : (
        <div className="flex flex-col items-center gap-4 mt-16 py-12 rounded-xl border border-dashed border-gray-800">
          <div className="text-5xl opacity-20 select-none">🏭</div>
          <p className="text-gray-400 font-semibold text-lg">{tx.leerTitel}</p>
          <p className="text-gray-600 text-sm">{tx.hinweis}</p>
        </div>
      )}

      {zeigeExport && (
        <ExportModal
          combined={combined}
          maschinenOverrides={maschinenOverrides}
          beaconConfigs={beaconConfigs}
          items={items}
          onClose={() => setZeigeExport(false)}
          sprache={sprache}
          foerderband={foerderband?.id !== 'keins' ? foerderband : null}
        />
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

function AppInner({ onReset }) {
  const [aktuellerTab, setAktuellerTab]         = useState('rechner');
  const [zeigeEinstellungen, setZeigeEinstellungen] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setZeigeEinstellungen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { erforscht } = useForschung();
  const { sprache, setSprache } = useSprache();
  const { techtreeModus, setTechtreeModus } = useTechtree();
  const anzahlErforscht = [...erforscht].filter(id => !IMMER_ERFORSCHT_IDS.has(id)).length;

  const tabs = TABS[sprache];
  const erforschtLabel = sprache === 'de' ? 'Technologien erforscht' : 'technologies researched';
  const subtitle = sprache === 'de' ? 'Factorio Produktionsrechner' : 'Factorio Production Calculator';

  const isFullscreen = FULLSCREEN_TABS.has(aktuellerTab);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white font-sans">
      <ItemTooltip />
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZeigeEinstellungen(true)}
            className="text-3xl hover:opacity-75 transition-opacity cursor-pointer leading-none"
            title={sprache === 'de' ? 'Einstellungen' : 'Settings'}
          >⚙️</button>
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

        <div className="ml-auto flex items-center gap-3">
          <PlanetenAuswahl />

          <div
            className="flex rounded-lg border border-gray-700 overflow-hidden text-xs font-bold"
            title={techtreeModus
              ? (sprache === 'de' ? 'Forschungsboni aktiv – beste erforschte Maschinen' : 'Research bonuses active – best researched machines')
              : (sprache === 'de' ? 'Alle Maschinen frei wählbar – keine Forschungsboni' : 'All machines freely selectable – no research bonuses')}
          >
            <button
              onClick={() => setTechtreeModus(true)}
              className={`px-2.5 py-1 transition-colors ${techtreeModus ? 'bg-amber-500/30 text-amber-300' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
            >
              {sprache === 'de' ? '🔬 Techtree' : '🔬 Tech Tree'}
            </button>
            <button
              onClick={() => setTechtreeModus(false)}
              className={`px-2.5 py-1 transition-colors ${!techtreeModus ? 'bg-gray-600/40 text-gray-200' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
            >
              {sprache === 'de' ? '🏭 Frei' : '🏭 Free'}
            </button>
          </div>

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
        {aktuellerTab === 'rechner'      && <RechnerTab      sprache={sprache} onReset={onReset} />}
        {aktuellerTab === 'optimierung'  && <ModulOptimierung />}
        {aktuellerTab === 'qualitaet'   && <QualityRechner />}
        {aktuellerTab === 'forschung'    && <ForschungsTab    sprache={sprache} />}
        {aktuellerTab === 'fabrikplaner' && <FabrikPlanerTab  sprache={sprache} />}

        {!isFullscreen && (
          <footer className="mt-12 pt-4 border-t border-gray-800 text-center text-xs text-gray-500 flex flex-wrap items-center justify-center gap-4">
            <span>
              {sprache === 'de' ? 'Erstellt von' : 'Made by'}{' '}
              <a
                href="https://github.com/Tauli89"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                Tauli89
              </a>
            </span>
            <span className="text-gray-700">·</span>
            <span>
              {sprache === 'de' ? 'Kein offizielles Factorio-Produkt' : 'Not an official Factorio product'}
            </span>
            <span className="text-gray-700">·</span>
            <a
              href="https://ko-fi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              ☕ Ko-fi
            </a>
            <span className="text-gray-700">·</span>
            <a
              href="https://github.com/Tauli89/factory-planner"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              GitHub
            </a>
          </footer>
        )}
      </main>

      {zeigeEinstellungen && (
        <EinstellungenModal onClose={() => setZeigeEinstellungen(false)} />
      )}
    </div>
  );
}

export default function App() {
  const [resetKey, setResetKey] = useState(0);
  const doReset = () => setResetKey(k => k + 1);

  return (
    <SprachProvider>
      <TechtreeProvider>
      <Fragment key={resetKey}>
        <EinstellungenProvider>
          <ForschungProvider>
            <ModulProvider>
              <QualityProvider>
                <BerechnungProvider>
                  <TooltipProvider>
                    <PlanetenProvider>
                      <AppInner onReset={doReset} />
                    </PlanetenProvider>
                  </TooltipProvider>
                </BerechnungProvider>
              </QualityProvider>
            </ModulProvider>
          </ForschungProvider>
        </EinstellungenProvider>
      </Fragment>
      </TechtreeProvider>
    </SprachProvider>
  );
}
