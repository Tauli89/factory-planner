import { useState, useMemo } from 'react';
import { REZEPTE_MAP } from '../data/recipes';
import {
  maschinenAnzahl, berechneStromverbrauch,
  MASCHINEN_LABEL, MASCHINEN_LABEL_EN,
} from '../utils/berechnung';
import { MASCHINEN_STROMVERBRAUCH } from '../data/machines';
import { getItemName } from '../data/gamedata-adapter';
import { useForschung } from '../context/ForschungContext';
import { useModul } from '../context/ModulContext';
import { useQuality } from '../context/QualityContext';

// ── Localization ──────────────────────────────────────────────────────────────

const TX = {
  de: {
    titel:          '📤 Exportieren',
    tabText:        '📝 Text',
    tabCSV:         '📊 CSV',
    tabJSON:        '{ } JSON',
    kopieren:       '📋 Kopieren',
    kopiert:        '✓ Kopiert!',
    herunterladen:  '⬇ Herunterladen',
    mitEmojis:      'Emojis ein',
    ohneEmojis:     'Emojis aus',
    maschinen:      'MASCHINEN:',
    rohstoffe:      'ROHSTOFFE (pro Minute):',
    strom:          'STROM:',
    solar:          'Solarpanel',
    dampf:          'Dampfmaschine',
    footer:         'Erstellt mit factory-planner-nine.vercel.app',
    csvHeader:      'Produkt;Menge_pro_min;Maschine;Anzahl_Maschinen;Strom_kW',
  },
  en: {
    titel:          '📤 Export',
    tabText:        '📝 Text',
    tabCSV:         '📊 CSV',
    tabJSON:        '{ } JSON',
    kopieren:       '📋 Copy',
    kopiert:        '✓ Copied!',
    herunterladen:  '⬇ Download',
    mitEmojis:      'Emojis on',
    ohneEmojis:     'Emojis off',
    maschinen:      'MACHINES:',
    rohstoffe:      'RESOURCES (per minute):',
    strom:          'POWER:',
    solar:          'Solar Panel',
    dampf:          'Steam Engine',
    footer:         'Created with factory-planner-nine.vercel.app',
    csvHeader:      'Product;Amount_per_min;Machine;Machine_count;Power_kW',
  },
};

// ── Data builder ──────────────────────────────────────────────────────────────

function buildExportData({ combined, maschinenOverrides, beaconConfigs, items, boni, modulBoni, mQMulti, sprache }) {
  const isDE = sprache === 'de';
  const maschinenLabels = isDE ? MASCHINEN_LABEL : MASCHINEN_LABEL_EN;

  const planName = items
    .filter(i => i.id)
    .map(i => {
      const r = REZEPTE_MAP[i.id];
      const name = isDE ? (r?.name ?? i.id) : (r?.nameEn ?? i.id);
      return `${name} × ${i.mengeProMin}/min`;
    })
    .join(' + ') || 'Plan';

  const herstellung = Object.entries(combined)
    .filter(([id]) => {
      const r = REZEPTE_MAP[id];
      return r && r.zeit > 0;
    })
    .map(([id, rateProSek]) => {
      const r = REZEPTE_MAP[id];
      const overrideId = maschinenOverrides[id] ?? null;
      const beaconCfg  = beaconConfigs[id] ?? null;
      const anzahl     = maschinenAnzahl(id, rateProSek, boni, modulBoni, mQMulti, overrideId, beaconCfg) ?? 0;
      const kwPro      = MASCHINEN_STROMVERBRAUCH[r.maschine] ?? 0;
      return {
        id,
        name:           isDE ? (r.name ?? getItemName(id, 'de')) : (r.nameEn ?? getItemName(id, 'en')),
        rateProMin:     rateProSek * 60,
        maschinenLabel: maschinenLabels[r.maschine] ?? r.maschine ?? '—',
        anzahl,
        stromKW:        anzahl * kwPro,
      };
    });

  const rohstoffe = Object.entries(combined)
    .filter(([id]) => {
      const r = REZEPTE_MAP[id];
      return !r || r.zeit === 0;
    })
    .map(([id, rateProSek]) => {
      const r = REZEPTE_MAP[id];
      return {
        id,
        name:       isDE ? (r?.name ?? getItemName(id, 'de')) : (r?.nameEn ?? getItemName(id, 'en')),
        rateProMin: rateProSek * 60,
      };
    });

  const stromDaten = berechneStromverbrauch(combined, boni, modulBoni, mQMulti, maschinenOverrides, beaconConfigs);

  return { planName, herstellung, rohstoffe, stromDaten };
}

// ── Format generators ─────────────────────────────────────────────────────────

function genText(data, withEmojis, sprache, tx) {
  const e = (emoji) => withEmojis ? emoji + ' ' : '';
  const SEP = '═══════════════════════════════════════════';
  const lines = [];

  lines.push(`${e('📋')}FactoryPlanner — ${data.planName}`);
  lines.push(SEP);

  if (data.herstellung.length > 0) {
    lines.push('');
    lines.push(`${e('🏭')}${tx.maschinen}`);
    for (const h of data.herstellung) {
      lines.push(`  ${withEmojis ? '• ' : '- '}${h.anzahl}× ${h.maschinenLabel} → ${h.name} (${h.rateProMin.toFixed(1)}/min)`);
    }
  }

  if (data.rohstoffe.length > 0) {
    lines.push('');
    lines.push(`${e('⛏')}${tx.rohstoffe}`);
    for (const r of data.rohstoffe) {
      lines.push(`  ${withEmojis ? '• ' : '- '}${r.name}: ${r.rateProMin.toFixed(1)}/min`);
    }
  }

  if (data.stromDaten.gesamtKW > 0) {
    const { gesamtMW, gesamtKW, solarPanels, dampfmaschinen } = data.stromDaten;
    const mwStr = gesamtMW >= 1 ? `${gesamtMW.toFixed(2)} MW` : `${gesamtKW.toFixed(0)} kW`;
    lines.push('');
    lines.push(`${e('⚡')}${tx.strom} ${mwStr} (${solarPanels}× ${withEmojis ? '☀ ' : ''}${tx.solar} ${sprache === 'de' ? 'oder' : 'or'} ${dampfmaschinen}× ${tx.dampf})`);
  }

  lines.push('');
  lines.push(SEP);
  lines.push(`${e('🌐')}${tx.footer}`);

  return lines.join('\n');
}

function csvEscape(val) {
  const s = String(val);
  return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function genCSV(data, tx) {
  const rows = [tx.csvHeader];
  for (const h of data.herstellung) {
    rows.push([
      csvEscape(h.name),
      h.rateProMin.toFixed(2),
      csvEscape(h.maschinenLabel),
      h.anzahl,
      h.stromKW.toFixed(0),
    ].join(';'));
  }
  if (data.herstellung.length > 0 && data.rohstoffe.length > 0) rows.push('');
  for (const r of data.rohstoffe) {
    rows.push([csvEscape(r.name), r.rateProMin.toFixed(2), '', '', ''].join(';'));
  }
  return rows.join('\n');
}

function genJSON(data, items) {
  const plan = {
    createdAt: new Date().toISOString(),
    source: 'factory-planner-nine.vercel.app',
    goals: items
      .filter(i => i.id)
      .map(i => ({ itemId: i.id, amountPerMin: i.mengeProMin, recipe: i.rezeptOverride ?? i.id })),
    production: data.herstellung.map(h => ({
      itemId:       h.id,
      name:         h.name,
      amountPerMin: parseFloat(h.rateProMin.toFixed(3)),
      machine:      h.maschinenLabel,
      machineCount: h.anzahl,
      powerKW:      h.stromKW,
    })),
    resources: data.rohstoffe.map(r => ({
      itemId:       r.id,
      name:         r.name,
      amountPerMin: parseFloat(r.rateProMin.toFixed(3)),
    })),
    power: {
      totalKW:      parseFloat(data.stromDaten.gesamtKW.toFixed(2)),
      totalMW:      parseFloat(data.stromDaten.gesamtMW.toFixed(4)),
      solarPanels:  data.stromDaten.solarPanels,
      steamEngines: data.stromDaten.dampfmaschinen,
    },
  };
  return JSON.stringify(plan, null, 2);
}

// ── Download helper ───────────────────────────────────────────────────────────

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(str) {
  return str.replace(/[^\w\-]/g, '_').slice(0, 40);
}

function dateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Tab content ───────────────────────────────────────────────────────────────

function PreviewPane({ content, onCopy, onDownload, kopiert, tx }) {
  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <pre className="flex-1 min-h-0 overflow-auto bg-gray-950 border border-gray-700 rounded-lg p-4 text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </pre>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onCopy}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            kopiert
              ? 'bg-green-500/20 text-green-300 border-green-500/40'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
          }`}
        >
          {kopiert ? tx.kopiert : tx.kopieren}
        </button>
        <button
          onClick={onDownload}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
        >
          {tx.herunterladen}
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function ExportModal({ combined, maschinenOverrides, beaconConfigs, items, onClose, sprache }) {
  const { boni }                                = useForschung();
  const { modulBoni }                           = useModul();
  const { maschinenQualitaet }                  = useQuality();
  const mQMulti                                 = maschinenQualitaet?.maschinenMulti ?? 1;
  const tx                                      = TX[sprache] ?? TX.de;

  const [aktuellerTab, setAktuellerTab] = useState('text');
  const [mitEmojis, setMitEmojis]       = useState(true);
  const [kopiertTab, setKopiertTab]     = useState(null);

  const data = useMemo(
    () => buildExportData({ combined, maschinenOverrides, beaconConfigs, items, boni, modulBoni, mQMulti, sprache }),
    [combined, maschinenOverrides, beaconConfigs, items, boni, modulBoni, mQMulti, sprache],
  );

  const textContent = useMemo(() => genText(data, mitEmojis, sprache, tx), [data, mitEmojis, sprache, tx]);
  const csvContent  = useMemo(() => genCSV(data, tx),  [data, tx]);
  const jsonContent = useMemo(() => genJSON(data, items), [data, items]);

  const contentMap = { text: textContent, csv: csvContent, json: jsonContent };
  const content    = contentMap[aktuellerTab];

  const planSlug = safeName(data.planName);
  const datum    = dateStr();

  const filenameMap = {
    text: `factoryplanner_${planSlug}_${datum}.txt`,
    csv:  `factoryplanner_${planSlug}_${datum}.csv`,
    json: `factoryplanner_${planSlug}_${datum}.json`,
  };
  const mimeMap = {
    text: 'text/plain;charset=utf-8',
    csv:  'text/csv;charset=utf-8',
    json: 'application/json;charset=utf-8',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setKopiertTab(aktuellerTab);
      setTimeout(() => setKopiertTab(null), 1500);
    });
  };

  const handleDownload = () => {
    downloadBlob(content, filenameMap[aktuellerTab], mimeMap[aktuellerTab]);
  };

  const tabs = [
    { id: 'text', label: tx.tabText },
    { id: 'csv',  label: tx.tabCSV },
    { id: 'json', label: tx.tabJSON },
  ];

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal box */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl flex flex-col"
           style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-amber-400 font-bold text-base">{tx.titel}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors px-1"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 pt-4 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAktuellerTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                aktuellerTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {aktuellerTab === 'text' && (
            <button
              onClick={() => setMitEmojis(v => !v)}
              className="ml-auto px-3 py-2 rounded-lg text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {mitEmojis ? tx.ohneEmojis : tx.mitEmojis}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 px-5 py-4 flex-1 min-h-0" style={{ minHeight: 0 }}>
          <PreviewPane
            content={content}
            onCopy={handleCopy}
            onDownload={handleDownload}
            kopiert={kopiertTab === aktuellerTab}
            tx={tx}
          />
        </div>
      </div>
    </div>
  );
}
