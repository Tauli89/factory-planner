import { useState, useRef, useEffect } from 'react';

const LS_SNAPSHOTS  = 'factoryplanner_snapshots_v1';
const MAX_SNAPSHOTS = 20;

// Keys captured per snapshot (language / research / quality are user-prefs, not plan state)
const SNAPSHOT_KEYS = [
  'factoryplanner_plaene_v1',
  'factoryplanner_aktiver_plan_v1',
  'factoryplanner_rechner_v1',
  'factoryplanner_einstellungen_v1',
  'factoryplanner_module_v1',
  'factoryplanner_planeten_v1',
];

// ── Localisation ──────────────────────────────────────────────────────────────

const TX = {
  de: {
    btn:          'Snapshots',
    titel:        'Fabrik-Snapshots',
    placeholder:  'Snapshot-Name…',
    speichern:    'Speichern',
    laden:        'Laden',
    loeschen:     'Löschen',
    umbenennen:   'Umbenennen',
    exportieren:  '📤 Export JSON',
    importieren:  '📥 Import JSON',
    leer:         'Noch keine Snapshots gespeichert.',
    zaehler:      (n) => `${n} / ${MAX_SNAPSHOTS}`,
    gespeichert:  '✓ Snapshot gespeichert',
    altesterGel:  '⚠ Ältester Snapshot gelöscht (Limit 20)',
    importOk:     (n) => `✓ ${n} Snapshot(s) importiert`,
    importFehler: '✗ Ungültige oder leere Datei',
    loeschenFrage:'Snapshot wirklich löschen?',
  },
  en: {
    btn:          'Snapshots',
    titel:        'Factory Snapshots',
    placeholder:  'Snapshot name…',
    speichern:    'Save',
    laden:        'Load',
    loeschen:     'Delete',
    umbenennen:   'Rename',
    exportieren:  '📤 Export JSON',
    importieren:  '📥 Import JSON',
    leer:         'No snapshots saved yet.',
    zaehler:      (n) => `${n} / ${MAX_SNAPSHOTS}`,
    gespeichert:  '✓ Snapshot saved',
    altesterGel:  '⚠ Oldest snapshot removed (limit 20)',
    importOk:     (n) => `✓ ${n} snapshot(s) imported`,
    importFehler: '✗ Invalid or empty file',
    loeschenFrage:'Really delete this snapshot?',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ladeSnapshots() {
  try {
    const raw = localStorage.getItem(LS_SNAPSHOTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function speichereSnapshots(list) {
  try { localStorage.setItem(LS_SNAPSHOTS, JSON.stringify(list)); } catch {}
}

function captureState() {
  const data = {};
  for (const key of SNAPSHOT_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) data[key] = v;
  }
  return data;
}

function restoreState(data) {
  for (const [key, val] of Object.entries(data)) {
    try { localStorage.setItem(key, val); } catch {}
  }
}

function formatDatum(ts, sprache) {
  return new Date(ts).toLocaleString(sprache === 'de' ? 'de-DE' : 'en-US', {
    day:    '2-digit',
    month:  '2-digit',
    year:   '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SnapshotManager({ sprache = 'de', onReset }) {
  const [snapshots, setSnapshots]         = useState(ladeSnapshots);
  const [offen, setOffen]                 = useState(false);
  const [nameInput, setNameInput]         = useState('');
  const [hinweis, setHinweis]             = useState('');
  const [umbenenneId, setUmbenenneId]     = useState(null);
  const [umbenenneText, setUmbenenneText] = useState('');

  const panelRef     = useRef(null);
  const importRef    = useRef(null);
  const umbenenneRef = useRef(null);
  const timerRef     = useRef(null);
  const tx           = TX[sprache] ?? TX.de;

  // Close on outside click
  useEffect(() => {
    if (!offen) return;
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target)) setOffen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [offen]);

  // Auto-focus rename input
  useEffect(() => {
    if (umbenenneId && umbenenneRef.current) umbenenneRef.current.select();
  }, [umbenenneId]);

  const flash = (msg) => {
    setHinweis(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHinweis(''), 2500);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const save = () => {
    const snap = {
      id:          crypto.randomUUID(),
      name:        nameInput.trim() || 'Snapshot',
      erstelltAm:  Date.now(),
      data:        captureState(),
    };
    let list     = [...snapshots, snap];
    const overLimit = list.length > MAX_SNAPSHOTS;
    if (overLimit) list = list.slice(-MAX_SNAPSHOTS);
    setSnapshots(list);
    speichereSnapshots(list);
    setNameInput('');
    flash(overLimit ? tx.altesterGel : tx.gespeichert);
  };

  const laden = (snap) => {
    restoreState(snap.data);
    setOffen(false);
    onReset?.();
  };

  const loeschen = (id) => {
    if (!window.confirm(tx.loeschenFrage)) return;
    const list = snapshots.filter(s => s.id !== id);
    setSnapshots(list);
    speichereSnapshots(list);
  };

  const bestaetigeUmbenennen = () => {
    if (!umbenenneId) return;
    const name = umbenenneText.trim();
    if (name) {
      const list = snapshots.map(s => s.id === umbenenneId ? { ...s, name } : s);
      setSnapshots(list);
      speichereSnapshots(list);
    }
    setUmbenenneId(null);
  };

  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, exportiertAm: Date.now(), snapshots }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `factoryplanner_snapshots_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw     = JSON.parse(ev.target.result);
        const imports = Array.isArray(raw) ? raw : (raw.snapshots ?? []);
        const valid   = imports.filter(s => s?.id && s?.name && s?.data && s?.erstelltAm);
        if (!valid.length) { flash(tx.importFehler); return; }
        const merged  = [...snapshots, ...valid];
        const list    = merged.slice(-MAX_SNAPSHOTS);
        setSnapshots(list);
        speichereSnapshots(list);
        flash(tx.importOk(valid.length));
      } catch { flash(tx.importFehler); }
    };
    reader.readAsText(file);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>

      {/* Toggle button */}
      <button
        onClick={() => setOffen(v => !v)}
        className={`flex items-center gap-1 px-3 py-1.5 h-full rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
          offen
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
        }`}
        title={tx.titel}
      >
        📷 <span className="hidden sm:inline">{tx.btn}</span> {offen ? '▲' : '▼'}
      </button>

      {/* Dropdown panel */}
      {offen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col" style={{ width: '22rem' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <span className="text-amber-400 font-bold text-sm">{tx.titel}</span>
            <span className="text-xs text-gray-500">{tx.zaehler(snapshots.length)}</span>
          </div>

          {/* Save row */}
          <div className="flex gap-2 px-4 py-3 border-b border-gray-700/50 flex-shrink-0">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); }}
              placeholder={tx.placeholder}
              className="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-600"
            />
            <button
              onClick={save}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {tx.speichern}
            </button>
          </div>

          {/* Flash hint */}
          {hinweis && (
            <div className="px-4 py-2 text-xs text-center border-b border-gray-700/40 bg-gray-800/60 text-green-400 flex-shrink-0">
              {hinweis}
            </div>
          )}

          {/* Snapshot list */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: '280px' }}>
            {snapshots.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">{tx.leer}</div>
            ) : (
              [...snapshots].reverse().map(snap => (
                <div
                  key={snap.id}
                  className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/40"
                >
                  {/* Name / inline rename */}
                  <div className="flex-1 min-w-0">
                    {umbenenneId === snap.id ? (
                      <input
                        ref={umbenenneRef}
                        value={umbenenneText}
                        onChange={e => setUmbenenneText(e.target.value)}
                        onBlur={bestaetigeUmbenennen}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); bestaetigeUmbenennen(); }
                          if (e.key === 'Escape') setUmbenenneId(null);
                          e.stopPropagation();
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-gray-700 border border-amber-500/50 text-white text-sm rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    ) : (
                      <>
                        <div
                          className="text-sm text-gray-200 truncate cursor-text"
                          title={snap.name}
                          onDoubleClick={() => { setUmbenenneId(snap.id); setUmbenenneText(snap.name); }}
                        >
                          {snap.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDatum(snap.erstelltAm, sprache)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => laden(snap)}
                    className="text-xs px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex-shrink-0"
                  >
                    {tx.laden}
                  </button>
                  <button
                    onClick={() => { setUmbenenneId(snap.id); setUmbenenneText(snap.name); }}
                    title={tx.umbenennen}
                    className="text-gray-500 hover:text-gray-300 text-base leading-none transition-colors flex-shrink-0 px-0.5"
                  >✎</button>
                  <button
                    onClick={() => loeschen(snap.id)}
                    title={tx.loeschen}
                    className="text-gray-500 hover:text-red-400 text-xl leading-none transition-colors flex-shrink-0 px-0.5"
                  >×</button>
                </div>
              ))
            )}
          </div>

          {/* Footer: Export / Import */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={exportJSON}
              disabled={snapshots.length === 0}
              className="flex-1 text-xs py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {tx.exportieren}
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex-1 text-xs py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors"
            >
              {tx.importieren}
            </button>
            <input ref={importRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
          </div>
        </div>
      )}

      {/* Toast shown when panel is closed */}
      {!offen && hinweis && (
        <div className="absolute right-0 top-full mt-1 z-50 text-xs bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-green-400 whitespace-nowrap shadow-lg pointer-events-none">
          {hinweis}
        </div>
      )}
    </div>
  );
}
