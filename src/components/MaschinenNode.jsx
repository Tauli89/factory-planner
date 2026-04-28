import { Handle, Position } from '@xyflow/react';

const MASCHINEN_STYLES = {
  schmelzofen:   { color: '#f97316', icon: '🔥', label: 'Furnace' },
  assembler:     { color: '#60a5fa', icon: '⚙️', label: 'Assembler' },
  chemieanlage:  { color: '#22d3ee', icon: '🧪', label: 'Chem. Plant' },
  oelraffinerie: { color: '#eab308', icon: '🛢️', label: 'Oil Refinery' },
  zentrifuge:    { color: '#4ade80', icon: '💫', label: 'Centrifuge' },
  hochofen:      { color: '#f87171', icon: '🏭', label: 'Foundry' },
  'em-anlage':   { color: '#a78bfa', icon: '⚡', label: 'EM Plant' },
  biokammer:     { color: '#a3e635', icon: '🌿', label: 'Biochamber' },
  kryogenanlage: { color: '#7dd3fc', icon: '❄️', label: 'Cryo Plant' },
  bergbau:       { color: '#9ca3af', icon: '⛏️', label: 'Mining' },
  raumplattform: { color: '#818cf8', icon: '🚀', label: 'Space Hub' },
  recycler:      { color: '#fb923c', icon: '♻️', label: 'Recycler' },
  crusher:       { color: '#94a3b8', icon: '🪨', label: 'Crusher' },
};

const HANDLE_STYLE = { width: 12, height: 12, borderWidth: 2 };

export default function MaschinenNode({ data, selected }) {
  const s = MASCHINEN_STYLES[data.maschine] ?? { color: '#9ca3af', icon: '🏭', label: data.maschine };

  return (
    <div
      style={{ borderColor: s.color, minWidth: 155 }}
      className={`rounded-lg border-2 bg-gray-900 shadow-lg transition-shadow ${
        selected ? 'shadow-amber-400/30 shadow-xl' : 'shadow-black/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...HANDLE_STYLE, borderColor: s.color, backgroundColor: '#1f2937' }}
      />

      {/* Header bar */}
      <div
        className="rounded-t px-2.5 py-1.5 flex items-center gap-1.5"
        style={{ backgroundColor: `${s.color}25` }}
      >
        <span className="text-sm leading-none">{s.icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: s.color }}>
          {s.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="text-white text-xs font-semibold leading-snug mb-1.5 break-words">
          {data.name}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-gray-500 text-[10px]">×</span>
            <span className="font-bold text-sm leading-none" style={{ color: s.color }}>
              {data.anzahl}
            </span>
            <span className="text-gray-500 text-[10px] ml-0.5">Mach.</span>
          </div>
          <div className="text-green-400 text-[10px] font-medium">
            {data.rateProMin?.toFixed(1)}/min
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ ...HANDLE_STYLE, borderColor: s.color, backgroundColor: '#1f2937' }}
      />
    </div>
  );
}
