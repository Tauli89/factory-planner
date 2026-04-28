import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MaschinenNode from './MaschinenNode';
import { useBerechnung } from '../context/BerechnungContext';
import { FOERDERBAENDER, FOERDERBAENDER_MAP } from '../data/belts';
import { buildBlueprint, encodeBlueprintString, buildLayoutJSON } from '../utils/blueprintExport';

const nodeTypes = { maschine: MaschinenNode };

const BELT_COLOR = {
  gelb:  '#facc15',
  rot:   '#f87171',
  blau:  '#60a5fa',
  turbo: '#c084fc',
};

const MACH_COLOR = {
  schmelzofen:   '#f97316',
  assembler:     '#60a5fa',
  chemieanlage:  '#22d3ee',
  oelraffinerie: '#eab308',
  zentrifuge:    '#4ade80',
  hochofen:      '#f87171',
  'em-anlage':   '#a78bfa',
  biokammer:     '#a3e635',
  kryogenanlage: '#7dd3fc',
  bergbau:       '#9ca3af',
  raumplattform: '#818cf8',
  recycler:      '#fb923c',
  crusher:       '#94a3b8',
};

const TX = {
  de: {
    titel:          'Fabrikplaner',
    maschinen:      'Maschinen (Rechner)',
    importAll:      'Alle importieren',
    clear:          'Leeren',
    noCalc:         'Berechne zuerst im Rechner-Tab eine Produktion.',
    newBelt:        'Förderband (neue Verbindungen):',
    changeBelt:     'Förderband ändern:',
    hint:           'Maschinen aus der Leiste links auf die Fläche ziehen · Handles verbinden für Förderbänder',
    deleteEdge:     'Verbindung löschen',
    close:          'Schließen',
    machines:       'Maschinen',
    rateMin:        '/min',
    exportBp:       'Blueprint',
    exportJson:     'JSON',
    exportSection:  'Export',
    bpModalTitle:   'Factorio Blueprint-String',
    bpHint:         'In Factorio: Importieren-Schaltfläche oder Strg+Alt+V · Maschinen evtl. neu anordnen',
    bpCopy:         'In Zwischenablage',
    bpCopied:       'Kopiert!',
    bpLoading:      'Wird generiert…',
    bpNoNodes:      'Keine Maschinen auf der Planfläche.',
    jsonModalTitle: 'Layout-JSON',
    jsonHint:       'Speichern & Teilen – enthält Positionen, Maschinentypen und Verbindungen.',
    jsonDownload:   'JSON herunterladen',
    jsonCopy:       'In Zwischenablage',
  },
  en: {
    titel:          'Factory Planner',
    maschinen:      'Machines (Calculator)',
    importAll:      'Import all',
    clear:          'Clear',
    noCalc:         'First calculate a production in the Calculator tab.',
    newBelt:        'Belt type (new connections):',
    changeBelt:     'Change belt:',
    hint:           'Drag machines from the left panel onto the canvas · Connect handles for belts',
    deleteEdge:     'Delete connection',
    close:          'Close',
    machines:       'Machines',
    rateMin:        '/min',
    exportBp:       'Blueprint',
    exportJson:     'JSON',
    exportSection:  'Export',
    bpModalTitle:   'Factorio Blueprint String',
    bpHint:         'In Factorio: Import button or Ctrl+Alt+V · You may need to rearrange machines',
    bpCopy:         'Copy to Clipboard',
    bpCopied:       'Copied!',
    bpLoading:      'Generating…',
    bpNoNodes:      'No machines on the canvas.',
    jsonModalTitle: 'Layout JSON',
    jsonHint:       'Save & share – includes positions, machine types, and connections.',
    jsonDownload:   'Download JSON',
    jsonCopy:       'Copy to Clipboard',
  },
};

function buildEdge(params, beltId, sprache) {
  const belt = FOERDERBAENDER_MAP[beltId];
  const color = BELT_COLOR[beltId] ?? '#6b7280';
  const label = belt && belt.id !== 'keins'
    ? (sprache === 'de' ? belt.name : belt.nameEn)
    : '';
  return {
    ...params,
    type: 'smoothstep',
    animated: true,
    style: { stroke: color, strokeWidth: 2.5 },
    label,
    labelStyle: { fill: color, fontSize: 9, fontWeight: 600 },
    labelBgStyle: { fill: '#111827', fillOpacity: 0.85 },
    data: { beltId },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
  };
}

// ── Inner component (needs ReactFlowProvider ancestor) ──────────────────────

function FabrikPlanerInner({ sprache }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedBelt, setSelectedBelt] = useState('gelb');
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [exportModal, setExportModal] = useState(null); // { type, content } | null
  const [bpLoading, setBpLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const { maschinenListe } = useBerechnung();
  const nodeIdRef = useRef(1);
  const tx = TX[sprache];

  // ── Connect nodes ──────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params) => {
      setEdges(prev => addEdge(buildEdge(params, selectedBelt, sprache), prev));
    },
    [selectedBelt, sprache, setEdges],
  );

  // ── Click edge → show belt picker ─────────────────────────────────────────
  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdgeId(id => id === edge.id ? null : edge.id);
  }, []);

  // ── Click canvas background → deselect edge ───────────────────────────────
  const onPaneClick = useCallback(() => setSelectedEdgeId(null), []);

  // ── Change belt on existing edge ──────────────────────────────────────────
  const changeEdgeBelt = useCallback((beltId) => {
    setEdges(prev => prev.map(e =>
      e.id !== selectedEdgeId ? e : buildEdge(e, beltId, sprache),
    ));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, sprache, setEdges]);

  const deleteSelectedEdge = useCallback(() => {
    setEdges(prev => prev.filter(e => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges]);

  // ── Add a single machine node ──────────────────────────────────────────────
  const addMachineNode = useCallback((machineData, position) => {
    const id = `m-${nodeIdRef.current++}`;
    setNodes(prev => [...prev, { id, type: 'maschine', position, data: machineData }]);
  }, [setNodes]);

  // ── Drop from sidebar ─────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/factoryplanner');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addMachineNode(data, position);
    } catch { /* ignore */ }
  }, [screenToFlowPosition, addMachineNode]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ── Import all from calculator ────────────────────────────────────────────
  const importAll = useCallback(() => {
    if (!maschinenListe.length) return;
    const COLS = 3;
    const COL_W = 220, ROW_H = 160;
    setNodes(prev => {
      const existingIds = new Set(prev.map(n => n.data.id));
      const toAdd = maschinenListe.filter(m => !existingIds.has(m.id));
      const startX = 60, startY = 60;
      const newNodes = toAdd.map((m, i) => ({
        id: `m-${nodeIdRef.current++}`,
        type: 'maschine',
        position: {
          x: startX + (i % COLS) * COL_W,
          y: startY + Math.floor(i / COLS) * ROW_H,
        },
        data: m,
      }));
      return [...prev, ...newNodes];
    });
  }, [maschinenListe, setNodes]);

  // ── Clear everything ──────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    nodeIdRef.current = 1;
    setSelectedEdgeId(null);
  }, [setNodes, setEdges]);

  // ── Export as Factorio Blueprint ──────────────────────────────────────────
  const exportBlueprint = useCallback(async () => {
    if (nodes.length === 0) return;
    setBpLoading(true);
    try {
      const obj = buildBlueprint(nodes, 'Factory Planner');
      const str = await encodeBlueprintString(obj);
      setExportModal({ type: 'blueprint', content: str });
    } finally {
      setBpLoading(false);
    }
  }, [nodes]);

  // ── Export as JSON ────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    if (nodes.length === 0) return;
    const json = buildLayoutJSON(nodes, edges);
    setExportModal({ type: 'json', content: json });
  }, [nodes, edges]);

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  const copyToClipboard = useCallback(() => {
    if (!exportModal) return;
    navigator.clipboard.writeText(exportModal.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [exportModal]);

  // ── Download JSON ─────────────────────────────────────────────────────────
  const downloadJSON = useCallback(() => {
    if (!exportModal) return;
    const blob = new Blob([exportModal.content], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'factory-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportModal]);

  const beltsForSelector = FOERDERBAENDER.filter(b => b.id !== 'keins');

  return (
    <div className="flex h-full" style={{ height: '100%' }}>
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-amber-400 font-bold text-xs uppercase tracking-wide">
            {tx.maschinen}
          </h3>
        </div>

        {maschinenListe.length > 0 ? (
          <>
            {/* Action buttons */}
            <div className="px-3 py-2 border-b border-gray-800 flex-shrink-0 flex flex-col gap-1.5">
              <div className="flex gap-2">
                <button
                  onClick={importAll}
                  className="flex-1 text-xs px-2 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition-colors"
                >
                  {tx.importAll}
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs px-2 py-1.5 rounded bg-gray-700 hover:bg-red-900/40 text-gray-400 hover:text-red-300 transition-colors"
                >
                  {tx.clear}
                </button>
              </div>

              {/* Export buttons */}
              <div className="flex gap-2">
                <button
                  onClick={exportBlueprint}
                  disabled={nodes.length === 0 || bpLoading}
                  title={nodes.length === 0 ? tx.bpNoNodes : undefined}
                  className="flex-1 text-xs px-2 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <span className="text-[10px]">📋</span>
                  {bpLoading ? tx.bpLoading : tx.exportBp}
                </button>
                <button
                  onClick={exportJSON}
                  disabled={nodes.length === 0}
                  title={nodes.length === 0 ? tx.bpNoNodes : undefined}
                  className="flex-1 text-xs px-2 py-1.5 rounded bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <span className="text-[10px]">📄</span>
                  {tx.exportJson}
                </button>
              </div>
            </div>

            {/* Machine list */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-0">
              {maschinenListe.map(m => (
                <SidebarItem
                  key={m.id}
                  maschine={m}
                  sprache={sprache}
                  onAdd={() => addMachineNode(m, { x: 80 + Math.random() * 200, y: 80 + Math.random() * 200 })}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-gray-500 text-xs text-center leading-relaxed">{tx.noCalc}</p>
          </div>
        )}

        {/* Belt type selector (for new connections) */}
        <div className="border-t border-gray-800 p-3 flex-shrink-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">{tx.newBelt}</p>
          <div className="flex flex-col gap-1">
            {beltsForSelector.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBelt(b.id)}
                className={`text-xs px-2 py-1 rounded text-left flex items-center gap-2 transition-colors ${
                  selectedBelt === b.id
                    ? 'bg-gray-700/80 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span
                  className="w-5 h-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: BELT_COLOR[b.id] ?? '#6b7280' }}
                />
                <span>{sprache === 'de' ? b.name : b.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── ReactFlow canvas ── */}
      <div className="flex-1 min-w-0 relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode="Delete"
          colorMode="dark"
          style={{ background: '#030712' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#374151"
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={n => MACH_COLOR[n.data?.maschine] ?? '#374151'}
            maskColor="rgba(0,0,0,0.6)"
            style={{ background: '#111827', border: '1px solid #374151' }}
          />

          {/* Hint when canvas is empty */}
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="mt-16 flex flex-col items-center gap-4 text-center px-4 max-w-sm select-none pointer-events-none">
                <div className="text-5xl opacity-30">🏭</div>
                <div className="text-gray-500 text-sm leading-relaxed">{tx.hint}</div>
                {maschinenListe.length > 0 && (
                  <div className="pointer-events-auto flex flex-col items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs animate-bounce">
                      <span>←</span>
                      <span>{sprache === 'de' ? 'Maschinen aus der Seitenleiste' : 'Machines from the sidebar'}</span>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Edge belt-type picker */}
          {selectedEdgeId && (
            <Panel position="top-center">
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-2xl mt-2">
                <span className="text-xs text-gray-400 mr-1">{tx.changeBelt}</span>
                {beltsForSelector.map(b => (
                  <button
                    key={b.id}
                    onClick={() => changeEdgeBelt(b.id)}
                    style={{ borderColor: BELT_COLOR[b.id] }}
                    className="text-xs px-2.5 py-1 rounded-lg border text-white hover:opacity-80 transition-opacity"
                  >
                    {sprache === 'de' ? b.name.split(' ')[0] : b.nameEn.split(' ')[0]}
                  </button>
                ))}
                <button
                  onClick={deleteSelectedEdge}
                  className="text-xs px-2 py-1 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 transition-colors ml-1 border border-red-800/40"
                >
                  ✕
                </button>
                <button
                  onClick={() => setSelectedEdgeId(null)}
                  className="text-gray-600 hover:text-gray-400 transition-colors ml-0.5 text-xs"
                >
                  {tx.close}
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
      {/* ── Export Modal ── */}
      {exportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setExportModal(null); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-white font-bold text-sm">
                  {exportModal.type === 'blueprint' ? tx.bpModalTitle : tx.jsonModalTitle}
                </h2>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {exportModal.type === 'blueprint' ? tx.bpHint : tx.jsonHint}
                </p>
              </div>
              <button
                onClick={() => { setExportModal(null); setCopied(false); }}
                className="text-gray-600 hover:text-white transition-colors text-lg leading-none ml-4"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <textarea
                readOnly
                value={exportModal.content}
                rows={exportModal.type === 'blueprint' ? 4 : 10}
                onClick={e => e.target.select()}
                className="w-full bg-gray-950 text-green-400 text-[11px] font-mono rounded-xl p-3.5 resize-none border border-gray-800 focus:outline-none focus:border-gray-600 transition-colors leading-relaxed"
              />

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    copied
                      ? 'bg-green-600/30 border border-green-500/50 text-green-300'
                      : exportModal.type === 'blueprint'
                        ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300'
                        : 'bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300'
                  }`}
                >
                  {copied ? tx.bpCopied : (exportModal.type === 'blueprint' ? tx.bpCopy : tx.jsonCopy)}
                </button>

                {exportModal.type === 'json' && (
                  <button
                    onClick={downloadJSON}
                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 transition-colors"
                  >
                    {tx.jsonDownload}
                  </button>
                )}

                <button
                  onClick={() => { setExportModal(null); setCopied(false); }}
                  className="px-5 py-2 rounded-xl text-sm bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  {tx.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar draggable machine item ─────────────────────────────────────────

function SidebarItem({ maschine, sprache, onAdd }) {
  const name = sprache === 'de' ? maschine.name : (maschine.nameEn ?? maschine.name);
  const color = MACH_COLOR[maschine.maschine] ?? '#9ca3af';

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/60 border border-gray-700/40 cursor-grab active:cursor-grabbing hover:border-gray-600 hover:bg-gray-800 transition-colors select-none"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/factoryplanner', JSON.stringify(maschine));
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-white text-[11px] font-medium leading-snug truncate">{name}</div>
        <div className="text-gray-500 text-[10px] mt-0.5">
          ×{maschine.anzahl} · {maschine.rateProMin.toFixed(1)}/min
        </div>
      </div>
      <button
        onClick={onAdd}
        title="Auf Planfläche hinzufügen"
        className="text-gray-600 hover:text-amber-400 transition-colors text-base px-0.5 leading-none flex-shrink-0"
      >
        +
      </button>
    </div>
  );
}

// ── Public export with ReactFlowProvider wrapper ───────────────────────────

export default function FabrikPlaner({ sprache }) {
  return (
    <ReactFlowProvider>
      <FabrikPlanerInner sprache={sprache} />
    </ReactFlowProvider>
  );
}
