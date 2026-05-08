import { useEinstellungen } from '../context/EinstellungenContext';
import { useModul } from '../context/ModulContext';
import { useSprache } from '../context/SprachContext';
import { MASCHINEN } from '../data/recipes';
import { MODULE_TYPEN, MODUL_SLOTS } from '../data/modules';
import { FOERDERBAENDER } from '../data/belts';

// ── Static option lists ───────────────────────────────────────────────────────

const MASCHINEN_OPTIONEN = [
  {
    typ: MASCHINEN.ASSEMBLER,
    de: 'Montage',
    en: 'Assembly',
    optionen: [
      { id: 'assembling-machine-1', de: 'Montageautomat 1 (0.5/s)', en: 'Assembling Machine 1 (0.5/s)' },
      { id: 'assembling-machine-2', de: 'Montageautomat 2 (0.75/s)', en: 'Assembling Machine 2 (0.75/s)' },
      { id: 'assembling-machine-3', de: 'Montageautomat 3 (1.25/s)', en: 'Assembling Machine 3 (1.25/s)' },
    ],
  },
  {
    typ: MASCHINEN.SCHMELZOFEN,
    de: 'Schmelze',
    en: 'Smelting',
    optionen: [
      { id: 'stone-furnace',    de: 'Steinofen (1/s)',         en: 'Stone Furnace (1/s)' },
      { id: 'steel-furnace',    de: 'Stahlofen (2/s)',         en: 'Steel Furnace (2/s)' },
      { id: 'electric-furnace', de: 'Elektrischer Ofen (2/s)', en: 'Electric Furnace (2/s)' },
    ],
  },
  {
    typ: MASCHINEN.BERGBAU,
    de: 'Bergbau',
    en: 'Mining',
    optionen: [
      { id: 'electric-mining-drill', de: 'Bergbaubohrer (0.5/s)',      en: 'Electric Mining Drill (0.5/s)' },
      { id: 'big-mining-drill',      de: 'Großer Bergbaubohrer (2.5/s)', en: 'Big Mining Drill (2.5/s)' },
    ],
  },
];

const MODUL_MASCHINEN = [
  { typ: MASCHINEN.ASSEMBLER,     de: 'Montageautomat',    en: 'Assembling Machine' },
  { typ: MASCHINEN.SCHMELZOFEN,   de: 'Ofen',              en: 'Furnace' },
  { typ: MASCHINEN.CHEMIEANLAGE,  de: 'Chemieanlage',      en: 'Chemical Plant' },
  { typ: MASCHINEN.OELRAFFINERIE, de: 'Ölraffinerie',      en: 'Oil Refinery' },
  { typ: MASCHINEN.ZENTRIFUGE,    de: 'Zentrifuge',        en: 'Centrifuge' },
  { typ: MASCHINEN.HOCHOFEN,      de: 'Hochofen',          en: 'Foundry' },
  { typ: MASCHINEN.BERGBAU,       de: 'Bergbau',           en: 'Mining' },
];

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS = {
  fruehspiel: {
    de: '🌱 Frühspiel',
    en: '🌱 Early Game',
    einstellungen: {
      standardBandId: 'gelb',
      defaultMaschinenPerType: {
        [MASCHINEN.ASSEMBLER]:   'assembling-machine-1',
        [MASCHINEN.SCHMELZOFEN]: 'stone-furnace',
        [MASCHINEN.BERGBAU]:     'electric-mining-drill',
      },
    },
    modulConfig: {},
  },
  midgame: {
    de: '⚡ Midgame',
    en: '⚡ Midgame',
    einstellungen: {
      standardBandId: 'rot',
      defaultMaschinenPerType: {
        [MASCHINEN.ASSEMBLER]:   'assembling-machine-2',
        [MASCHINEN.SCHMELZOFEN]: 'electric-furnace',
        [MASCHINEN.BERGBAU]:     'electric-mining-drill',
      },
    },
    modulConfig: {
      [MASCHINEN.ASSEMBLER]:     { modulId: 'effizienz-1', anzahl: 2 },
      [MASCHINEN.SCHMELZOFEN]:   { modulId: 'effizienz-1', anzahl: 2 },
      [MASCHINEN.CHEMIEANLAGE]:  { modulId: 'effizienz-1', anzahl: 2 },
      [MASCHINEN.OELRAFFINERIE]: { modulId: 'effizienz-1', anzahl: 2 },
    },
  },
  endgame: {
    de: '🏭 Endgame',
    en: '🏭 Endgame',
    einstellungen: {
      standardBandId: 'blau',
      defaultMaschinenPerType: {
        [MASCHINEN.ASSEMBLER]:   'assembling-machine-3',
        [MASCHINEN.SCHMELZOFEN]: 'electric-furnace',
        [MASCHINEN.BERGBAU]:     'electric-mining-drill',
      },
    },
    modulConfig: {
      [MASCHINEN.ASSEMBLER]:     { modulId: 'produktivitaet-3', anzahl: 2 },
      [MASCHINEN.SCHMELZOFEN]:   { modulId: 'produktivitaet-3', anzahl: 2 },
      [MASCHINEN.CHEMIEANLAGE]:  { modulId: 'produktivitaet-3', anzahl: 3 },
      [MASCHINEN.OELRAFFINERIE]: { modulId: 'produktivitaet-3', anzahl: 3 },
      [MASCHINEN.ZENTRIFUGE]:    { modulId: 'produktivitaet-3', anzahl: 2 },
      [MASCHINEN.HOCHOFEN]:      { modulId: 'produktivitaet-3', anzahl: 4 },
      [MASCHINEN.BERGBAU]:       { modulId: 'produktivitaet-3', anzahl: 3 },
    },
  },
};

// ── Localization ──────────────────────────────────────────────────────────────

const TX = {
  de: {
    titel:          '⚙ Globale Einstellungen',
    presets:        'Schnell-Presets',
    stdMaschine:    'Standard-Maschine',
    stdMaschinenHint: 'Gilt wenn kein manueller Override gesetzt ist.',
    stdModule:      'Standard-Module',
    stdBand:        'Standard-Förderband',
    anzeigeEinheit: 'Anzeigeeinheit (Primärspalte)',
    einheitMin:     '/ Min',
    einheitSek:     '/ Sek',
    einheitStd:     '/ Std',
    slots:          'Slots',
    keineModule:    'Keine Module',
    schliessen:     '✕',
  },
  en: {
    titel:          '⚙ Global Settings',
    presets:        'Quick Presets',
    stdMaschine:    'Default Machine',
    stdMaschinenHint: 'Used when no manual override is set.',
    stdModule:      'Default Modules',
    stdBand:        'Default Belt',
    anzeigeEinheit: 'Display Unit (primary column)',
    einheitMin:     '/ Min',
    einheitSek:     '/ Sec',
    einheitStd:     '/ Hr',
    slots:          'Slots',
    keineModule:    'No modules',
    schliessen:     '✕',
  },
};

// ── Section wrapper ───────────────────────────────────────────────────────────

function Sektion({ titel, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700/60 pb-1">
        {titel}
      </h3>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EinstellungenModal({ onClose }) {
  const { einstellungen, setEinstellungen } = useEinstellungen();
  const { modulConfig, setMaschinenModul, applyModulConfig } = useModul();
  const { sprache } = useSprache();
  const tx = TX[sprache];
  const isDE = sprache === 'de';

  const applyPreset = (key) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setEinstellungen(prev => ({ ...prev, ...preset.einstellungen }));
    applyModulConfig(preset.modulConfig);
  };

  const setDefaultMaschine = (typ, id) => {
    setEinstellungen(prev => ({
      ...prev,
      defaultMaschinenPerType: { ...prev.defaultMaschinenPerType, [typ]: id },
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-amber-400 font-bold text-base">{tx.titel}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors px-1"
            aria-label={tx.schliessen}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex flex-col gap-5 px-5 py-5 overflow-y-auto flex-1">

          {/* ── Presets ──────────────────────────────────────────────── */}
          <Sektion titel={tx.presets}>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-gray-700 hover:border-amber-500/40 transition-colors"
                >
                  {isDE ? preset.de : preset.en}
                </button>
              ))}
            </div>
          </Sektion>

          {/* ── Standard-Maschine ──────────────────────────────────── */}
          <Sektion titel={tx.stdMaschine}>
            <p className="text-xs text-gray-500">{tx.stdMaschinenHint}</p>
            <div className="flex flex-col gap-2">
              {MASCHINEN_OPTIONEN.map(({ typ, de, en, optionen }) => (
                <div key={typ} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-24 shrink-0">{isDE ? de : en}</span>
                  <select
                    value={einstellungen.defaultMaschinenPerType[typ] ?? optionen[0].id}
                    onChange={e => setDefaultMaschine(typ, e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    {optionen.map(o => (
                      <option key={o.id} value={o.id}>{isDE ? o.de : o.en}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Sektion>

          {/* ── Standard-Module ────────────────────────────────────── */}
          <Sektion titel={tx.stdModule}>
            <div className="flex flex-col gap-2">
              {MODUL_MASCHINEN.map(({ typ, de, en }) => {
                const maxSlots = MODUL_SLOTS[typ] ?? 0;
                if (maxSlots === 0) return null;
                const cfg = modulConfig[typ] ?? { modulId: 'keins', anzahl: 0 };
                return (
                  <div key={typ} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-400 w-36 shrink-0">{isDE ? de : en}</span>
                    <select
                      value={cfg.modulId ?? 'keins'}
                      onChange={e => setMaschinenModul(typ, e.target.value, cfg.anzahl || 0)}
                      className="bg-gray-800 border border-gray-600 text-white text-xs rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      {MODULE_TYPEN.map(m => (
                        <option key={m.id} value={m.id}>{isDE ? m.name : m.nameEn}</option>
                      ))}
                    </select>
                    {cfg.modulId && cfg.modulId !== 'keins' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={maxSlots}
                          value={cfg.anzahl || 1}
                          onChange={e => {
                            const v = Math.max(1, Math.min(maxSlots, Number(e.target.value)));
                            setMaschinenModul(typ, cfg.modulId, v);
                          }}
                          className="bg-gray-800 border border-gray-600 text-white text-xs rounded px-1.5 py-1 w-12 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        <span className="text-xs text-gray-500">/ {maxSlots} {tx.slots}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Sektion>

          {/* ── Standard-Förderband ────────────────────────────────── */}
          <Sektion titel={tx.stdBand}>
            <select
              value={einstellungen.standardBandId}
              onChange={e => setEinstellungen(prev => ({ ...prev, standardBandId: e.target.value }))}
              className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-xs"
            >
              {FOERDERBAENDER.map(b => (
                <option key={b.id} value={b.id}>{isDE ? b.name : b.nameEn}</option>
              ))}
            </select>
          </Sektion>

          {/* ── Anzeigeeinheit ─────────────────────────────────────── */}
          <Sektion titel={tx.anzeigeEinheit}>
            <div className="flex gap-3">
              {[
                { id: 'min', label: tx.einheitMin },
                { id: 'sek', label: tx.einheitSek },
                { id: 'std', label: tx.einheitStd },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="anzeigeEinheit"
                    value={id}
                    checked={einstellungen.anzeigeEinheit === id}
                    onChange={() => setEinstellungen(prev => ({ ...prev, anzeigeEinheit: id }))}
                    className="accent-amber-400"
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </Sektion>

        </div>
      </div>
    </div>
  );
}
