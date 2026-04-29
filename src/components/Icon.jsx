import { useState } from 'react';
import gamedata from '../data/gamedata.json';

function resolveIconPath(id, type) {
  if (type === 'technologies') return gamedata.technologies[id]?.icon ?? null;
  if (type === 'machines')     return gamedata.machines[id]?.icon ?? null;
  // items / fluids (fluids live in gamedata.items with subgroup='fluid')
  const itemIcon = gamedata.items[id]?.icon;
  if (itemIcon) return itemIcon;
  // recipe id ≠ item id (e.g. oil-processing) → look up main result
  const recipe = gamedata.recipes?.[id];
  if (recipe?.results?.[0]) {
    return gamedata.items[recipe.results[0].item]?.icon ?? null;
  }
  return null;
}

function resolveAlt(id, type) {
  if (type === 'technologies') return gamedata.technologies[id]?.name?.de ?? id;
  if (type === 'machines')     return gamedata.machines[id]?.name?.de ?? id;
  return gamedata.items[id]?.name?.de ?? id;
}

function Fallback({ letter, size, className }) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-slate-700 text-slate-300 rounded flex-shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, fontSize: Math.max(8, Math.floor(size * 0.5)) }}
    >
      {letter}
    </span>
  );
}

/**
 * Zentrale Icon-Komponente für Factorio Items, Technologien und Maschinen.
 * type: 'items' (default) | 'technologies' | 'machines'
 */
export default function Icon({ id, type = 'items', size = 24, className = '' }) {
  const [err, setErr] = useState(false);

  if (!id) return <Fallback letter="?" size={size} className={className} />;

  const iconPath = !err ? resolveIconPath(id, type) : null;

  if (iconPath) {
    return (
      <img
        src={iconPath}
        alt={resolveAlt(id, type)}
        width={size}
        height={size}
        className={`flex-shrink-0 ${className}`}
        style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
        onError={() => setErr(true)}
      />
    );
  }

  return <Fallback letter={(id[0] ?? '?').toUpperCase()} size={size} className={className} />;
}
