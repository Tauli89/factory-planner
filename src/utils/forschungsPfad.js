import { TECH_MAP, LEVEL_GRUPPE_VON_TECH } from '../data/research';

export function berechnePfad(zielTechId, erforschteIds) {
  // BFS rückwärts – alle transitiven Voraussetzungen sammeln
  const benoetigt = new Set();
  const queue = [zielTechId];
  const besucht = new Set();

  while (queue.length) {
    const id = queue.shift();
    if (besucht.has(id)) continue;
    besucht.add(id);
    const tech = TECH_MAP[id];
    if (!tech) continue;
    benoetigt.add(id);
    for (const preId of tech.prerequisites) {
      if (!besucht.has(preId) && TECH_MAP[preId]) queue.push(preId);
    }
  }

  const zuErforschen = [...benoetigt].filter(id => !erforschteIds.has(id));
  const bereitsErforscht = new Set([...benoetigt].filter(id => erforschteIds.has(id)));

  // Kahn-Algorithmus: topologische Sortierung
  const idSet = new Set(zuErforschen);
  const inDegree = {};
  const adjList = {};
  for (const id of zuErforschen) { inDegree[id] = 0; adjList[id] = []; }
  for (const id of zuErforschen) {
    for (const preId of TECH_MAP[id]?.prerequisites ?? []) {
      if (idSet.has(preId)) { inDegree[id]++; adjList[preId].push(id); }
    }
  }
  const startQ = zuErforschen.filter(id => inDegree[id] === 0);
  const reihenfolgeRaw = [];
  while (startQ.length) {
    const cur = startQ.shift();
    reihenfolgeRaw.push(cur);
    for (const nxt of adjList[cur]) {
      if (--inDegree[nxt] === 0) startQ.push(nxt);
    }
  }

  // Auf TECH_LAYOUT-IDs mappen: Level-Gruppen-Mitglieder → erster Eintrag
  const reihenfolge = [];
  const gesehen = new Set();
  for (const id of reihenfolgeRaw) {
    const gruppenInfo = LEVEL_GRUPPE_VON_TECH[id];
    const layoutId = gruppenInfo ? gruppenInfo.gruppe.ids[0] : id;
    if (!gesehen.has(layoutId)) { gesehen.add(layoutId); reihenfolge.push(layoutId); }
  }

  // Wissenschaftskosten summieren
  const wissenschaftskosten = {};
  for (const id of zuErforschen) {
    for (const [pack, count] of Object.entries(TECH_MAP[id]?.cost ?? {})) {
      if (typeof count === 'number') {
        wissenschaftskosten[pack] = (wissenschaftskosten[pack] ?? 0) + count;
      }
    }
  }

  return { reihenfolge, wissenschaftskosten, bereitsErforscht };
}
