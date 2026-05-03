export function encodePlan(items) {
  const data = items
    .filter(i => i.id)
    .map(({ id, mengeProMin, rezeptOverride }) => ({ id, mengeProMin, rezeptOverride }));
  if (!data.length) return null;
  const b64 = btoa(JSON.stringify(data));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodePlan(str) {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const rem = padded.length % 4;
    const b64 = rem ? padded + '='.repeat(4 - rem) : padded;
    const parsed = JSON.parse(atob(b64));
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((d, i) => ({
        key: i + 1,
        id: typeof d.id === 'string' ? d.id : '',
        mengeProMin: typeof d.mengeProMin === 'number' && d.mengeProMin > 0 ? d.mengeProMin : 60,
        rezeptOverride: typeof d.rezeptOverride === 'string' ? d.rezeptOverride : null,
      }))
      .filter(d => d.id);
  } catch {
    return null;
  }
}
