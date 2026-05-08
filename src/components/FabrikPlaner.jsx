import { useState, useCallback, useRef, useEffect } from 'react';
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
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import MaschinenNode from './MaschinenNode';
import Icon from './Icon';
import { useBerechnung } from '../context/BerechnungContext';
import { FOERDERBAENDER, FOERDERBAENDER_MAP } from '../data/belts';
import { buildBlueprint, encodeBlueprintString, buildLayoutJSON } from '../utils/blueprintExport';
import { berechneElkLayout } from '../utils/elkLayout';
import { REZEPTE_MAP, REZEPT_ZU_ITEM_ID, getItemName } from '../data/gamedata-adapter';

const NODE_W = 185;
const NODE_H = 100;

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
    autoLayout:     'Auto-Layout',
    layoutRunning:  'Berechne…',
    vollbild:       'Vollbild',
    vollbildBeenden:'Vollbild beenden',
    exportPng:      'PNG',
    exportingPng:   '…',
    fluss:          'Fluss',
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
    autoLayout:     'Auto-layout',
    layoutRunning:  'Computing…',
    vollbild:       'Fullscreen',
    vollbildBeenden:'Exit fullscreen',
    exportPng:      'PNG',
    exportingPng:   '…',
    fluss:          'Flow',
  },
};

// ── Edge builders ─────────────────────────────────────────────────────────────

function buildManualEdge(params, beltId, sprache) {
  const belt  = FOERDERBAENDER_MAP[beltId];
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
    labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.85 },
    data: { beltId },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
  };
}

function buildAutoEdge(sourceId, targetId, itemId, rateProMin) {
  const strokeW = Math.max(1.5, Math.min(7, 1 + Math.log2(rateProMin + 1) * 0.85));
  const color   = '#6b7280';
  return {
    id:         `auto-${sourceId}-${targetId}-${itemId}`,
    source:     sourceId,
    target:     targetId,
    type:       'smoothstep',
    animated:   true,
    style:      { stroke: color, strokeWidth: strokeW },
    label:      `${rateProMin.toFixed(1)}/min`,
    labelStyle: { fill: '#9ca3af', fontSize: 9, fontWeight: 600 },
    labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.85 },
    data:       { isAuto: true, itemId, rateProMin },
    markerEnd:  { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
  };
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function TBtn({ onClick, disabled, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

// ── Inner component (needs ReactFlowProvider ancestor) ──────────────────────

function FabrikPlanerInner({ sprache }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedBelt, setSelectedBelt]   = useState('gelb');
  const [selectedEdge, setSelectedEdge]   = useState(null);
  const [exportModal, setExportModal]     = useState(null);
  const [bpLoading, setBpLoading]         = useState(false);
  const [copied, setCopied]               = useState(false);
  const [isLayouting, setIsLayouting]     = useState(false);
  const [isExporting, setIsExporting]     = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);

  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();
  const { maschinenListe } = useBerechnung();
  const nodeIdRef    = useRef(1);
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const tx           = TX[sprache] ?? TX.de;

  // Sync fullscreen state with browser events
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Connect nodes ──────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params) => {
      setEdges(prev => addEdge(buildManualEdge(params, selectedBelt, sprache), prev));
    },
    [selectedBelt, sprache, setEdges],
  );

  // ── Click edge ────────────────────────────────────────────────────────────
  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(prev => prev?.id === edge.id ? null : edge);
  }, []);

  const onPaneClick = useCallback(() => setSelectedEdge(null), []);

  // ── Change belt on selected manual edge ───────────────────────────────────
  const changeEdgeBelt = useCallback((beltId) => {
    if (!selectedEdge) return;
    setEdges(prev => prev.map(e =>
      e.id !== selectedEdge.id ? e : buildManualEdge(e, beltId, sprache),
    ));
    setSelectedEdge(null);
  }, [selectedEdge, sprache, setEdges]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges(prev => prev.filter(e => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  // ── Add a single machine node (drag-dropped from sidebar) ─────────────────
  const addMachineNode = useCallback((machineData, position) => {
    const id = `drop-${nodeIdRef.current++}`;
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

  // ── Import all from calculator (ELK layout + auto-edges) ─────────────────
  const importAll = useCallback(async () => {
    if (!maschinenListe.length) return;
    setIsLayouting(true);
    try {
      // Build new calc nodes (position 0,0 — ELK will assign positions)
      const calcNodes = maschinenListe.map(m => ({
        id:       `calc-${m.id}`,
        type:     'maschine',
        position: { x: 0, y: 0 },
        data:     m,
      }));

      // Keep manually dropped nodes
      const manualNodes = nodes.filter(n => !n.id.startsWith('calc-'));

      // Build map: itemId → nodeId that produces it (among calc nodes)
      const produziert = {};
      for (const m of maschinenListe) {
        const itemId = REZEPT_ZU_ITEM_ID[m.id];
        if (itemId) produziert[itemId] = `calc-${m.id}`;
      }

      // Build auto-edges between calc nodes
      const autoEdges = [];
      for (const m of maschinenListe) {
        const rezept = REZEPTE_MAP[m.id];
        if (!rezept?.zutaten) continue;
        const ergibt       = rezept.ergibt ?? 1;
        const cyclesPerMin = m.rateProMin / ergibt;
        for (const zutat of rezept.zutaten) {
          const sourceId = produziert[zutat.item];
          const targetId = `calc-${m.id}`;
          if (!sourceId || sourceId === targetId) continue;
          const rate = cyclesPerMin * zutat.anzahl;
          autoEdges.push(buildAutoEdge(sourceId, targetId, zutat.item, rate));
        }
      }

      // Run ELK layout on calc nodes only
      const laidOut = await berechneElkLayout(calcNodes, autoEdges, NODE_W, NODE_H);

      // Preserve existing manual edges, replace all auto-edges
      const manualEdges = edges.filter(e => !e.data?.isAuto);

      setNodes([...laidOut, ...manualNodes]);
      setEdges([...manualEdges, ...autoEdges]);
      setTimeout(() => fitView({ padding: 0.15 }), 50);
    } finally {
      setIsLayouting(false);
    }
  }, [maschinenListe, nodes, edges, setNodes, setEdges, fitView]);

  // ── Re-run auto-layout on current nodes ───────────────────────────────────
  const runAutoLayout = useCallback(async () => {
    if (!nodes.length) return;
    setIsLayouting(true);
    try {
      const autoEdgesOnly = edges.filter(e => e.data?.isAuto);
      const laidOut = await berechneElkLayout(nodes, autoEdgesOnly, NODE_W, NODE_H);
      setNodes(laidOut);
      setTimeout(() => fitView({ padding: 0.15 }), 50);
    } finally {
      setIsLayouting(false);
    }
  }, [nodes, edges, setNodes, fitView]);

  // ── Clear everything ──────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    nodeIdRef.current = 1;
    setSelectedEdge(null);
  }, [setNodes, setEdges]);

  // ── Export as PNG ─────────────────────────────────────────────────────────
  const exportPng = useCallback(async () => {
    if (!canvasRef.current || nodes.length === 0) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: '#111111',
        pixelRatio: 2,
      });
      const a    = document.createElement('a');
      a.href     = dataUrl;
      a.download = `factory-layout-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setIsExporting(false);
    }
  }, [nodes.length]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

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
  const isManualEdgeSelected = selectedEdge && !selectedEdge.data?.isAuto;
  const isAutoEdgeSelected   = selectedEdge?.data?.isAuto;

  return (
    <div className="flex h-full" ref={containerRef} style={{ height: '100%' }}>

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
                  disabled={isLayouting}
                  className="flex-1 text-xs px-2 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition-colors disabled:opacity-50"
                >
                  {isLayouting ? tx.layoutRunning : tx.importAll}
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

        {/* Belt type selector (for new manual connections) */}
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
      <div
        className="flex-1 min-w-0 relative"
        ref={canvasRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
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
          style={{ background: '#111111' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#3d3d3d"
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={n => MACH_COLOR[n.data?.maschine] ?? '#4a4a4a'}
            maskColor="rgba(0,0,0,0.6)"
            style={{ background: '#1a1a1a', border: '1px solid #4a4a4a' }}
          />

          {/* ── Toolbar (top-right) ── */}
          <Panel position="top-right">
            <div className="flex items-center gap-0.5 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl p-1 shadow-2xl mt-1 mr-1">
              <TBtn
                onClick={runAutoLayout}
                disabled={isLayouting || nodes.length === 0}
                title={tx.autoLayout}
              >
                {isLayouting ? '⏳' : '⚡'}
              </TBtn>

              <div className="w-px h-5 bg-gray-700 mx-0.5" />

              <TBtn onClick={() => zoomIn()} title="Zoom in">＋</TBtn>
              <TBtn onClick={() => zoomOut()} title="Zoom out">－</TBtn>
              <TBtn onClick={() => fitView({ padding: 0.15 })} title="Fit view">⊡</TBtn>

              <div className="w-px h-5 bg-gray-700 mx-0.5" />

              <TBtn
                onClick={exportPng}
                disabled={isExporting || nodes.length === 0}
                title={`📸 ${tx.exportPng}`}
              >
                {isExporting ? '…' : '📸'}
              </TBtn>
              <TBtn
                onClick={toggleFullscreen}
                title={isFullscreen ? tx.vollbildBeenden : tx.vollbild}
              >
                {isFullscreen ? '⛶' : '⛶'}
              </TBtn>
            </div>
          </Panel>

          {/* ── Hint when canvas is empty ── */}
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

          {/* ── Auto-edge info panel ── */}
          {isAutoEdgeSelected && (
            <Panel position="top-center">
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xl mt-2">
                <Icon id={selectedEdge.data.itemId} size={20} />
                <div>
                  <div className="text-white text-xs font-semibold leading-snug">
                    {getItemName(selectedEdge.data.itemId, sprache)}
                  </div>
                  <div className="text-green-400 text-[10px]">
                    {selectedEdge.data.rateProMin.toFixed(1)}/min
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="text-gray-600 hover:text-gray-400 transition-colors ml-1 text-xs"
                >
                  {tx.close}
                </button>
              </div>
            </Panel>
          )}

          {/* ── Manual edge belt picker ── */}
          {isManualEdgeSelected && (
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
                  onClick={() => setSelectedEdge(null)}
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
  const name  = sprache === 'de' ? maschine.name : (maschine.nameEn ?? maschine.name);
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
  const [forceShow, setForceShow] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile && !forceShow) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <div className="text-5xl">🏭</div>
        <h2 className="text-amber-400 font-bold text-lg">
          {sprache === 'de' ? 'Desktop empfohlen' : 'Desktop recommended'}
        </h2>
        <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
          {sprache === 'de'
            ? 'Der Fabrikplaner ist für große Bildschirme optimiert. Auf mobilen Geräten kann die Bedienung eingeschränkt sein.'
            : 'The factory planner is optimised for large screens. The experience may be limited on mobile devices.'}
        </p>
        <button
          onClick={() => setForceShow(true)}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
        >
          {sprache === 'de' ? 'Trotzdem öffnen' : 'Open anyway'}
        </button>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FabrikPlanerInner sprache={sprache} />
    </ReactFlowProvider>
  );
}
