// Ordered multi-exercise routine. Pure: no DOM, no storage.
export function sanitizeRoutine(raw, { known, isHold }) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const out = [];
  for (const it of items) {
    if (!it || !known.has(it.ex)) continue;
    const hold = !!isHold(it.ex);
    out.push({
      id: String(it.id || ('r' + out.length + '_' + Math.random().toString(36).slice(2, 7))),
      ex: it.ex,
      sets: clamp(it.sets, 1, 10, 3),
      target: clamp(it.target, hold ? 10 : 1, hold ? 600 : 200, hold ? 30 : 10),
      rest: clamp(it.rest, 0, 300, 60),
    });
    if (out.length >= 24) break;
  }
  return { v: 1, items: out };
}

export function moveItem(items, index, dir) {
  const j = index + dir;
  if (j < 0 || j >= items.length) return items.slice();
  const next = items.slice();
  const [it] = next.splice(index, 1);
  next.splice(j, 0, it);
  return next;
}

export function afterSet(session) {
  const item = session.items[session.index];
  if (!item) return { action: 'done' };
  if (session.setsDone < item.sets) {
    return { action: 'rest', then: 'set', rest: item.rest, item, setNo: session.setsDone + 1 };
  }
  if (session.index + 1 < session.items.length) {
    const next = session.items[session.index + 1];
    return { action: 'rest', then: 'exercise', rest: item.rest, item: next, setNo: 1, nextIndex: session.index + 1 };
  }
  return { action: 'done' };
}

export function summarize(sets) {
  const blocks = [];
  for (const s of sets || []) {
    const prev = blocks[blocks.length - 1];
    if (!prev || prev.ex !== s.ex || prev.block !== s.block) {
      blocks.push({ ex: s.ex, block: s.block, hold: !!s.hold, sets: [], n: 0, bad: 0, secs: 0, attempts: [], goal: true, tech: 0 });
    }
    const b = blocks[blocks.length - 1];
    b.sets.push(s);
    b.n += s.n || 0; b.bad += s.bad || 0; b.secs += s.secs || 0;
    if (s.attempts) b.attempts.push(...s.attempts);
    if (!s.goal) b.goal = false;
    const denom = b.n + b.bad;
    b.tech = denom ? Math.round(b.n / denom * 100) : 0;
  }
  const secs = (sets || []).reduce((a, s) => a + (s.secs || 0), 0);
  const w = blocks.reduce((a, b) => a + b.secs, 0);
  const tech = w ? Math.round(blocks.reduce((a, b) => a + b.tech * b.secs, 0) / w) : (blocks.length ? Math.round(blocks.reduce((a, b) => a + b.tech, 0) / blocks.length) : 0);
  return {
    blocks, secs, tech,
    mixed: new Set((sets || []).map(s => s.ex)).size > 1,
    attempts: (sets || []).flatMap(s => s.attempts || []),
    goal: blocks.length > 0 && blocks.every(b => b.goal),
  };
}

function clamp(v, lo, hi, d) { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : d; }
