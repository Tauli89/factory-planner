import { useRef } from 'react';
import { useTooltip } from '../context/TooltipContext';

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

export default function WithTooltip({ itemId, children }) {
  const ctx      = useTooltip();
  const timerRef = useRef(null);
  const posRef   = useRef({ x: 0, y: 0 });

  if (isTouchDevice || !itemId || !ctx) return children;

  const { showTooltip, hideTooltip, moveTooltip } = ctx;

  return (
    <span
      style={{ display: 'contents' }}
      onMouseEnter={e => {
        posRef.current = { x: e.clientX, y: e.clientY };
        timerRef.current = setTimeout(
          () => showTooltip(itemId, posRef.current.x, posRef.current.y),
          250,
        );
      }}
      onMouseMove={e => {
        posRef.current = { x: e.clientX, y: e.clientY };
        moveTooltip(e.clientX, e.clientY);
      }}
      onMouseLeave={() => {
        clearTimeout(timerRef.current);
        hideTooltip();
      }}
    >
      {children}
    </span>
  );
}
