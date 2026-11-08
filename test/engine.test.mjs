// Synthetic landmarks only. These are not recordings of a person.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, STRICT } from '../engine.js';

const I = { nose:0, ls:11, rs:12, le:13, re:14, lw:15, rw:16, lh:23, rh:24, lk:25, rk:26, la:27, ra:28 };

function ang(a, b, c) {
  const v1x = a[0] - b[0], v1y = a[1] - b[1], v2x = c[0] - b[0], v2y = c[1] - b[1];
  const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1e-9;
  return Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / d))) * 180 / Math.PI;
}
function blank(v = 0) { return Array.from({ length: 33 }, () => [0.5, 0.5, 0, v]); }
function put(lm, i, x, y, v = 0.99) { lm[i] = [x, y, 0, v]; }
function kneeAt(hip, ankle, want, y) {
  let best = [hip[0], y], bd = 1e9;
  const x0 = Math.min(hip[0], ankle[0]) - 0.02, x1 = Math.max(hip[0], ankle[0]) + 0.55;
  for (let x = x0; x <= x1; x += 0.003) {
    const k = [x, y];
    const d = Math.abs(ang(hip, k, ankle) - want);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
function worldFeet(step) {
  const w = Array.from({ length: 33 }, () => [0, 0, 0]);
  w[11] = [0.2, 0, 0]; w[12] = [-0.2, 0, 0];
  w[23] = [0.12, 0.4, 0]; w[24] = [-0.12, 0.4, 0];
  if (step) {
    w[25] = [0.04, 0.8, 0.26]; w[26] = [-0.03, 0.8, -0.12];
    w[27] = [0.02, 0.95, 0.38]; w[28] = [-0.02, 0.95, -0.18];
  } else {
    w[25] = [0.08, 0.8, 0.01]; w[26] = [-0.08, 0.8, -0.01];
    w[27] = [0.06, 0.95, 0.01]; w[28] = [-0.06, 0.95, -0.01];
  }
  return w;
}
function squatFrame(knee, { vis = 0.99 } = {}) {
  const lm = blank();
  const hip = [0.42, 0.48], ankle = [0.42, 0.90], sh = [0.42, 0.2];
  const k = kneeAt(hip, ankle, knee, 0.7);
  for (const side of [0, 1]) {
    const dx = side ? 0.012 : 0;
    put(lm, side ? I.rs : I.ls, sh[0] + dx, sh[1], vis);
    put(lm, side ? I.re : I.le, sh[0] + dx, sh[1] + 0.14, vis);
    put(lm, side ? I.rw : I.lw, sh[0] + dx, sh[1] + 0.28, vis);
    put(lm, side ? I.rh : I.lh, hip[0] + dx, hip[1], vis);
    put(lm, side ? I.rk : I.lk, k[0] + dx, k[1], vis);
    put(lm, side ? I.ra : I.la, ankle[0] + dx, ankle[1], vis);
  }
  put(lm, I.nose, sh[0], sh[1] - 0.06, vis);
  return lm;
}
function lungeFrame(frontKnee, backKnee) {
  const lm = blank();
  const hip = [0.48, 0.46], sh = [0.48, 0.18];
  const aF = [0.66, 0.9], aB = [0.3, 0.9];
  const kF = kneeAt(hip, aF, frontKnee, 0.7);
  const kB = kneeAt([hip[0] - 0.02, hip[1]], aB, backKnee, 0.72);
  put(lm, I.ls, sh[0], sh[1]); put(lm, I.rs, sh[0] + 0.01, sh[1]);
  put(lm, I.le, sh[0], sh[1] + 0.14); put(lm, I.re, sh[0] + 0.01, sh[1] + 0.14);
  put(lm, I.lw, sh[0], sh[1] + 0.28); put(lm, I.rw, sh[0] + 0.01, sh[1] + 0.28);
  put(lm, I.lh, hip[0], hip[1]); put(lm, I.rh, hip[0] + 0.01, hip[1]);
  put(lm, I.lk, kF[0], kF[1]); put(lm, I.rk, kB[0], kB[1]);
  put(lm, I.la, aF[0], aF[1]); put(lm, I.ra, aB[0], aB[1]);
  put(lm, I.nose, sh[0], sh[1] - 0.06);
  return lm;
}
function run(ex, n, frame, { wl, strict = 0.85, forceView = 'side' } = {}) {
  const eng = createEngine(ex, { aspect: 1, forceView, strict, smooth: false });
  const events = [];
  let last = null;
  for (let i = 0; i < n; i++) {
    last = eng.update(frame(i), i * 33, typeof wl === 'function' ? wl(i) : wl);
    if (last.events?.length) events.push(...last.events);
  }
  return { events, last, eng };
}

test('strict level ignores a stored easy value', () => {
  assert.equal(STRICT, 1.15);
  const easy = createEngine('squat', { strict: 0.85, aspect: 1, forceView: 'side' });
  const hard = createEngine('squat', { strict: 1.15, aspect: 1, forceView: 'side' });
  assert.equal(easy.state ? true : true, true);
  let a = null, b = null;
  const frame = squatFrame(150);
  const wl = worldFeet(false);
  for (let i = 0; i < 5; i++) { a = easy.update(frame, i * 33, wl); b = hard.update(frame, i * 33, wl); }
  assert.equal(a.strict, 1.15);
  assert.equal(b.strict, 1.15);
});

test('synthetic clean squat counts one rep and a lunge shape does not', () => {
  const clean = run('squat', 80, i => {
    const p = i < 40 ? i / 40 : (80 - i) / 40;
    return squatFrame(172 - p * 92);
  }, { wl: worldFeet(false) });
  assert.equal(clean.events.filter(e => e.clean).length, 1, 'clean squat: ' + JSON.stringify(clean.events));
  assert.equal(clean.events.filter(e => !e.clean).length, 0);

  const mismatch = run('squat', 80, i => {
    const p = i < 40 ? i / 40 : (80 - i) / 40;
    return squatFrame(172 - p * 92);
  }, { wl: worldFeet(true) });
  assert.ok(mismatch.events.some(e => !e.clean && (e.reason === 'not_lunge' || (e.faults || []).includes('not_lunge'))),
    'lunge fed to squat: ' + JSON.stringify(mismatch.events));
  assert.equal(mismatch.events.filter(e => e.clean).length, 0);
});

test('synthetic squat fed to the lunge exercise is rejected', () => {
  const bad = run('lunge', 80, i => {
    const p = i < 40 ? i / 40 : (80 - i) / 40;
    const k = 172 - p * 80;
    return lungeFrame(k, k);
  }, { wl: worldFeet(false) });
  assert.ok(bad.events.some(e => !e.clean && (e.reason === 'not_squat' || e.reason === 'lunge_step')),
    JSON.stringify(bad.events));
  assert.equal(bad.events.filter(e => e.clean).length, 0);
});

test('synthetic clean lunge can count when there is a real step', () => {
  const clean = run('lunge', 80, i => {
    const p = i < 40 ? i / 40 : (80 - i) / 40;
    const k = 172 - p * 82;
    return lungeFrame(k, Math.min(168, k + 8));
  }, { wl: worldFeet(true) });
  assert.equal(clean.events.filter(e => e.clean).length, 1, JSON.stringify(clean.events));
});

test('a depth that only the old easy mode would accept is rejected', () => {
  const res = run('squat', 80, i => {
    const p = i < 40 ? i / 40 : (80 - i) / 40;
    return squatFrame(172 - p * 68); // bottoms near 104°, stricter than the old easy band
  }, { wl: worldFeet(false), strict: 0.85 });
  assert.ok(res.events.some(e => !e.clean && e.reason === 'deeper'), JSON.stringify(res.events));
  assert.equal(res.events.filter(e => e.clean).length, 0);
});

function plank(hipY) {
  const lm = blank();
  const v = 0.99;
  put(lm, I.ls, 0.28, 0.4, v); put(lm, I.rs, 0.29, 0.4, v);
  put(lm, I.le, 0.28, 0.52, v); put(lm, I.re, 0.29, 0.52, v);
  put(lm, I.lw, 0.28, 0.64, v); put(lm, I.rw, 0.29, 0.64, v);
  put(lm, I.lh, 0.55, hipY, v); put(lm, I.rh, 0.56, hipY, v);
  put(lm, I.la, 0.82, 0.41, v); put(lm, I.ra, 0.83, 0.41, v);
  put(lm, I.lk, 0.68, 0.42, v); put(lm, I.rk, 0.69, 0.42, v);
  put(lm, I.nose, 0.2, 0.4, v);
  return lm;
}

test('posture error latency is short, and one noisy frame is not a fault', () => {
  const eng = createEngine('plank', { aspect: 1, forceView: 'side', smooth: false });
  let last = null;
  for (let i = 0; i < 20; i++) last = eng.update(plank(0.4), i * 33);
  assert.ok(!last.live?.includes('hips_sag'), 'straight plank flagged ' + JSON.stringify(last.live));
  const noisy = eng.update(plank(0.62), 20 * 33);
  assert.ok(!noisy.live?.includes('hips_sag'), 'single frame must not flag');
  eng.update(plank(0.4), 21 * 33);
  const t0 = 22 * 33;
  let hit = null;
  for (let i = 0; i < 20; i++) {
    last = eng.update(plank(0.62), t0 + i * 33);
    if (last.live?.includes('hips_sag')) { hit = { i, last }; break; }
  }
  assert.ok(hit, 'sag never flagged: ' + JSON.stringify(last && { live: last.live, status: last.status, dbg: last.dbg, body: last.body }));
  const wall = hit.i * 33;
  console.log(JSON.stringify({ synthetic:true, postureFaultWallMs: wall, faultLatencyMs: hit.last.faultLatency }));
  assert.ok(wall < 350, 'wall latency ' + wall);
  assert.ok(wall > 60, 'fired too instantly ' + wall);
  assert.ok(last.faultLatency == null || last.faultLatency < 300);
});

test('invisible body is lost, not a form error', () => {
  const eng = createEngine('plank', { aspect: 1, forceView: 'side', smooth: false });
  let last = null;
  for (let i = 0; i < 15; i++) last = eng.update(plank(0.62).map(p => [p[0], p[1], p[2], 0.05]), i * 40);
  assert.equal(last.status, 'lost');
  assert.deepEqual(last.live, []);
  assert.ok(last.cue == null || last.cue === 'lost');
  assert.equal(last.events.length, 0);
});

function lsit(tiltDeg, dir) {
  const lm = blank();
  const hip = [0.4, 0.56], sh = [0.4, 0.34], wrist = [0.46, 0.78], elbow = [0.44, 0.67];
  const rad = tiltDeg * Math.PI / 180, len = 0.36;
  const sign = dir < 0 ? -1 : 1;
  const ankle = [hip[0] + Math.cos(rad) * len, hip[1] + sign * Math.sin(rad) * len];
  const knee = [(hip[0] + ankle[0]) / 2, (hip[1] + ankle[1]) / 2];
  for (const side of [0, 1]) {
    const dx = side ? 0.01 : 0;
    put(lm, side ? I.rs : I.ls, sh[0] + dx, sh[1]);
    put(lm, side ? I.re : I.le, elbow[0] + dx, elbow[1]);
    put(lm, side ? I.rw : I.lw, wrist[0] + dx, wrist[1]);
    put(lm, side ? I.rh : I.lh, hip[0] + dx, hip[1]);
    put(lm, side ? I.rk : I.lk, knee[0] + dx, knee[1]);
    put(lm, side ? I.ra : I.la, ankle[0] + dx, ankle[1]);
  }
  put(lm, I.nose, sh[0] + 0.02, sh[1] - 0.04);
  return lm;
}

test('L-sit: a small tilt off horizontal counts, a large one does not', () => {
  const slight = createEngine('lsit', { aspect: 1, forceView: 'side', smooth: false });
  let good = 0, last = null;
  for (let i = 0; i < 40; i++) {
    last = slight.update(lsit(12, 1), i * 33);
    if (last.status === 'ok' && !last.live?.length) good += 0.033;
  }
  assert.ok(good > 0.6, 'slight L-sit should count, last=' + JSON.stringify({ status: last.status, live: last.live, cue: last.cue, dbg: last.dbg }));

  const steep = createEngine('lsit', { aspect: 1, forceView: 'side', smooth: false });
  let bad = false, credited = 0;
  for (let i = 0; i < 40; i++) {
    last = steep.update(lsit(48, 1), i * 33);
    if (last.live?.includes('legs_up') || last.cue === 'legs_up') bad = true;
    if (last.status === 'ok' && !last.live?.length) credited += 0.033;
  }
  assert.ok(bad, 'large droop not flagged ' + JSON.stringify({ status: last.status, live: last.live, cue: last.cue, dbg: last.dbg }));
  assert.ok(credited < 0.25, 'large droop was counted ' + credited);

  const high = createEngine('lsit', { aspect: 1, forceView: 'side', smooth: false });
  bad = false; credited = 0;
  for (let i = 0; i < 40; i++) {
    last = high.update(lsit(46, -1), i * 33);
    if (last.live?.includes('legs_lower') || last.cue === 'legs_lower') bad = true;
    if (last.status === 'ok' && !last.live?.length) credited += 0.033;
  }
  assert.ok(bad, 'large raise not flagged ' + JSON.stringify({ status: last.status, live: last.live, cue: last.cue, dbg: last.dbg }));
  assert.ok(credited < 0.25);
});

test('L-sit with invisible legs is not called wrong', () => {
  const eng = createEngine('lsit', { aspect: 1, forceView: 'side', smooth: false });
  const lm = lsit(48, 1);
  for (const i of [I.lk, I.rk, I.la, I.ra, I.lh, I.rh]) lm[i][3] = 0.1;
  let last = null;
  for (let i = 0; i < 20; i++) last = eng.update(lm, i * 33);
  assert.ok(last.status === 'lost' || (last.live || []).length === 0, JSON.stringify({ status: last.status, live: last.live, cue: last.cue }));
  assert.ok(!last.live?.includes('legs_up'));
  assert.ok(last.cue !== 'legs_up' && last.cue !== 'legs_straight');
});
