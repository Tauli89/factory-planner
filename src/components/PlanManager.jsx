import { useState, useEffect, useRef } from 'react';

const LS_PLAENE  = 'factoryplanner_plaene_v1';
const LS_AKTIV   = 'factoryplanner_aktiver_plan_v1';
const LS_ALT     = 'factoryplanner_rechner_v1'; // migration source
const MAX_PLAENE = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function neuerPlan(name, produkte = []) {
  return { id: crypto.randomUUID(), name, produkte, erstelltAm: Date.now() };
}

function parseProdukte(arr) {
  if (!Array.isArray(arr) || !arr.length) {
    return [{ key: 1, id: '', mengeProMin: 60, rezeptOverride: null }];
  }
  return arr.map((p, i) => ({
    key: i + 1,
    id: typeof p.id === 'string' ? p.id : '',
    mengeProMin: typeof p.mengeProMin === 'number' && p.mengeProMin > 0 ? p.mengeProMin : 60,
    rezeptOverride: typeof p.rezeptOverride === 'string' ? p.rezeptOverride : null,
  }));
}

function serialisiereProdukte(items) {
  return items.map(i => ({
    id: i.id,
    mengeProMin: i.mengeProMin,
    rezeptOverride: i.rezeptOverride ?? null,
  }));
}

function ladePlaeneAusLS() {
  try {
    const raw = localStorage.getItem(LS_PLAENE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch { return null; }
}

function ladeAktivIdAusLS(plaene) {
  try {
    const id = localStorage.getItem(LS_AKTIV);
    if (id && plaene.find(p => p.id === id)) return id;
  } catch {}
  return plaene[0]?.id ?? null;
}

function migriereAltenState() {
  try {
    const raw = localStorage.getItem(LS_ALT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
    return serialisiereProdukte(parseProdukte(arr));
  } catch { return []; }
}

function speichereInLS(plaene, aktivId) {
  try {
    localStorage.setItem(LS_PLAENE, JSON.stringify(plaene));
    if (aktivId) localStorage.setItem(LS_AKTIV, aktivId);
  } catch {}
}

function ladeInitialState() {
  const gespeichert = ladePlaeneAusLS();
  if (gespeichert) {
    const aktivId = ladeAktivIdAusLS(gespeichert);
    return { plaene: gespeichert, aktivId };
  }
  // First time: migrate existing items or start fresh
  const alteDaten  = migriereAltenState();
  const ersterPlan = neuerPlan('Plan 1', alteDaten);
  speichereInLS([ersterPlan], ersterPlan.id);
  return { plaene: [ersterPlan], aktivId: ersterPlan.id };
}

// ── Component ─────────────────────────────────────────────────────────────────

const TX = {
  de: { loeschen: 'Plan löschen', neuenPlan: 'Neuen Plan erstellen' },
  en: { loeschen: 'Delete plan',  neuenPlan: 'Create new plan' },
};

export default function PlanManager({ currentItems, onPlanLoad, sprache = 'de' }) {
  const [{ plaene, aktivId }, setState] = useState(ladeInitialState);
  const [umbenenneId, setUmbenenneId]   = useState(null);
  const [umbenenneText, setUmbenenneText] = useState('');
  const umbenenneInputRef = useRef(null);
  const initialLoadDone   = useRef(false);
  const tx = TX[sprache] ?? TX.de;

  // Load active plan into RechnerTab on mount (once)
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const { plaene: initPlaene, aktivId: initAktivId } = ladeInitialState();
    const aktivPlan = initPlaene.find(p => p.id === initAktivId);
    if (aktivPlan?.produkte?.length) {
      onPlanLoad(parseProdukte(aktivPlan.produkte));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save current items to active plan
  useEffect(() => {
    if (!aktivId) return;
    setState(prev => {
      const neuePlaene = prev.plaene.map(p =>
        p.id === aktivId
          ? { ...p, produkte: serialisiereProdukte(currentItems) }
          : p,
      );
      speichereInLS(neuePlaene, aktivId);
      return { plaene: neuePlaene, aktivId };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems, aktivId]);

  // Focus rename input when it appears
  useEffect(() => {
    if (umbenenneId && umbenenneInputRef.current) {
      umbenenneInputRef.current.select();
    }
  }, [umbenenneId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const wechselePlan = (planId) => {
    if (planId === aktivId) return;
    const plan = plaene.find(p => p.id === planId);
    if (!plan) return;
    setState(prev => {
      const mitSave = prev.plaene.map(p =>
        p.id === prev.aktivId
          ? { ...p, produkte: serialisiereProdukte(currentItems) }
          : p,
      );
      speichereInLS(mitSave, planId);
      return { plaene: mitSave, aktivId: planId };
    });
    onPlanLoad(parseProdukte(plan.produkte));
  };

  const neuerPlanErstellen = () => {
    if (plaene.length >= MAX_PLAENE) return;
    const nums = plaene.map(p => {
      const m = p.name.match(/^Plan (\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    });
    const naechsteNr = Math.max(0, ...nums) + 1;
    const plan = neuerPlan(`Plan ${naechsteNr}`);
    setState(prev => {
      const mitSave = prev.plaene.map(p =>
        p.id === prev.aktivId
          ? { ...p, produkte: serialisiereProdukte(currentItems) }
          : p,
      );
      const neuePlaene = [...mitSave, plan];
      speichereInLS(neuePlaene, plan.id);
      return { plaene: neuePlaene, aktivId: plan.id };
    });
    onPlanLoad([{ key: Date.now(), id: '', mengeProMin: 60, rezeptOverride: null }]);
  };

  const planLoeschen = (planId, e) => {
    e.stopPropagation();
    if (plaene.length <= 1) return;
    setState(prev => {
      const neuePlaene = prev.plaene.filter(p => p.id !== planId);
      let neueAktivId = prev.aktivId;
      if (prev.aktivId === planId) {
        neueAktivId = neuePlaene[0].id;
        onPlanLoad(parseProdukte(neuePlaene[0].produkte));
      }
      speichereInLS(neuePlaene, neueAktivId);
      return { plaene: neuePlaene, aktivId: neueAktivId };
    });
  };

  const starteUmbenennen = (planId, name, e) => {
    e.stopPropagation();
    setUmbenenneId(planId);
    setUmbenenneText(name);
  };

  const bestaetigeUmbenennen = () => {
    if (!umbenenneId) return;
    const trimmed = umbenenneText.trim();
    if (trimmed) {
      setState(prev => {
        const neuePlaene = prev.plaene.map(p =>
          p.id === umbenenneId ? { ...p, name: trimmed } : p,
        );
        speichereInLS(neuePlaene, prev.aktivId);
        return { ...prev, plaene: neuePlaene };
      });
    }
    setUmbenenneId(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center gap-0.5 bg-gray-950 border border-gray-800 rounded-xl px-2 py-1.5 overflow-x-auto min-h-[42px]">
      {plaene.map(plan => {
        const istAktiv      = plan.id === aktivId;
        const istUmbenennen = umbenenneId === plan.id;

        return (
          <div
            key={plan.id}
            onClick={() => !istUmbenennen && wechselePlan(plan.id)}
            className={`relative flex items-center gap-1 px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors flex-shrink-0 select-none group ${
              istAktiv
                ? 'bg-gray-800 text-amber-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            {/* Active indicator */}
            {istAktiv && (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{ background: '#c8a84b' }}
              />
            )}

            {istUmbenennen ? (
              <input
                ref={umbenenneInputRef}
                value={umbenenneText}
                onChange={e => setUmbenenneText(e.target.value)}
                onBlur={bestaetigeUmbenennen}
                onKeyDown={e => {
                  if (e.key === 'Enter')  { e.preventDefault(); bestaetigeUmbenennen(); }
                  if (e.key === 'Escape') { setUmbenenneId(null); }
                  e.stopPropagation();
                }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-700 border border-amber-500/50 text-white text-sm rounded px-1.5 py-0 w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            ) : (
              <span
                className="max-w-[120px] truncate"
                onDoubleClick={e => starteUmbenennen(plan.id, plan.name, e)}
                title={plan.name}
              >
                {plan.name}
              </span>
            )}

            {plaene.length > 1 && !istUmbenennen && (
              <button
                onClick={e => planLoeschen(plan.id, e)}
                title={tx.loeschen}
                className="ml-0.5 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none flex-shrink-0"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={neuerPlanErstellen}
        disabled={plaene.length >= MAX_PLAENE}
        title={tx.neuenPlan}
        className="ml-1 px-2.5 py-1 rounded-lg text-gray-400 hover:text-amber-300 hover:bg-gray-800/60 transition-colors text-base leading-none flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ＋
      </button>
    </div>
  );
}
