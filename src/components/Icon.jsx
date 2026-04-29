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

export default function Icon({ id, type = 'items', size = 32, className = '' }) {
  if (!id) return <Fallback letter="?" size={size} className={className} />;

  const iconPath = resolveIconPath(id, type);
  if (!iconPath) return <Fallback letter={(id[0] ?? '?').toUpperCase()} size={size} className={className} />;

  return (
    <div
      role="img"
      aria-label={resolveAlt(id, type)}
      className={`flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${iconPath})`,
        backgroundPosition: '0 0',
        backgroundSize: `${size * (120 / 64)}px ${size}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}
