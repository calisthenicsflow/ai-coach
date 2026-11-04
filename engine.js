// Calisthenics Flow — rep/hold engine. Pure logic, no DOM. Shared by app and tests.
export const L = { nose:0, ls:11, rs:12, le:13, re:14, lw:15, rw:16, lh:23, rh:24, lk:25, rk:26, la:27, ra:28 };

function ang(a, b, c, ar) { // angle at b, degrees, aspect-corrected
  const v1x = (a[0]-b[0])*ar, v1y = a[1]-b[1], v2x = (c[0]-b[0])*ar, v2y = c[1]-b[1];
  const d = Math.hypot(v1x,v1y)*Math.hypot(v2x,v2y) || 1e-9;
  return Math.acos(Math.max(-1, Math.min(1, (v1x*v2x+v1y*v2y)/d))) * 180/Math.PI;
}
// angle of segment a->b vs horizontal, 0..90
function tilt(a, b, ar) { const dx=Math.abs((b[0]-a[0])*ar), dy=Math.abs(b[1]-a[1]); return Math.atan2(dy, dx)*180/Math.PI; }
// signed distance of p from line a-b, normalised by |ab|; positive = p is "above" (smaller y) the line
function lineOffset(a, b, p, ar) {
  const abx=(b[0]-a[0])*ar, aby=b[1]-a[1], apx=(p[0]-a[0])*ar, apy=p[1]-a[1];
  const len=Math.hypot(abx,aby)||1e-9; let cr=(abx*apy-aby*apx)/len/len;
  if (abx < 0) cr = -cr; // orient so that +y (down) gives negative
  return -cr; // >0 : above line (pike), <0 : below (sag)
}

export const EXERCISES = {
  pushup:  { kind:'reps', primary:'elbow', top:145, start:132, depth:100, need:['s','e','w','h','a'], lowCue:'go_lower', lockCue:'lockout' },
  squat:   { kind:'reps', primary:'knee',  top:160, start:140, depth:105, need:['s','h','k','a'], lowCue:'deeper', lockCue:'stand_tall' },
  dip:     { kind:'reps', primary:'elbow', top:145, start:132, depth:100, need:['s','e','w','h'], lowCue:'dip_lower', lockCue:'lockout' },
  pullup:  { kind:'reps', primary:'elbow', top:145, start:130, depth:90,  inverted:true, need:['s','e','w'], lowCue:'chin_over', lockCue:'full_hang' },
  plank:   { kind:'hold', need:['s','e','h','a'] },
  hollow:  { kind:'hold', need:['s','h','a'] },
};
// every named fault blocks the rep / hold second. Priority = order (first shown).
export const FAULTS = ['hips_sag','hips_high','shoulders_over_elbows','shoulders_over_wrists','no_kipping','no_swing','knees_out','chest_up','elbows_in','hands_under',
  'legs_up','legs_lower','shoulders_up','go_lower','deeper','dip_lower','chin_over','lockout','full_hang','stand_tall'];

const PART = { s:['ls','rs'], e:['le','re'], w:['lw','rw'], h:['lh','rh'], k:['lk','rk'], a:['la','ra'] };

export function visibility(lm) { // which body groups are visible (either side)
  const out = {}; if (!lm) return out;
  for (const k in PART) out[k] = PART[k].some(n => lm[L[n]] && (lm[L[n]][3] ?? 1) > 0.5);
  return out;
}

export function createEngine(exId, { aspect = 9/16 } = {}) {
  const ex = EXERCISES[exId]; const ar = aspect; // ar = width/height of frame
  const st = { phase:'top', reps:0, bad:0, attempts:[], minA:999, maxA:0, ascMax:0, faults:new Set(),
    sm:null, lastT:null, holdGood:0, holdTotal:0, cue:null, cueT:0, smBody:null, lostT:0, M:{}, F:{} };
  const dist = (a, b) => Math.hypot((a[0]-b[0])*ar, a[1]-b[1]) || 1e-6;

  function side(lm) {
    const v = n => (lm[L[n]][3] ?? 1);
    const l = v('ls')+v('lh')+v('le')+v('lk')+v('la')+v('lw'), r = v('rs')+v('rh')+v('re')+v('rk')+v('ra')+v('rw');
    st.sideL = (st.sideL ?? 0) * 0.9 + (l - r) * 0.1; // sticky side choice: avoids left/right flips
    const s = st.sideL >= 0 ? 'l' : 'r'; const g = n => lm[L[s+n]];
    const kv = v(s+'k') > 0.5;
    return { S:g('s'), E:g('e'), W:g('w'), H:g('h'), K:g('k'), A:g('a'), N:lm[0], kv,
      S2:lm[L.ls], S3:lm[L.rs], K2:lm[L.lk], K3:lm[L.rk], A2:lm[L.la], A3:lm[L.ra], H2:lm[L.lh], H3:lm[L.rh] };
  }
  function ema(prev, x, dt, tau=0.07) { if (prev==null) return x; const a = 1-Math.exp(-dt/tau); return prev + a*(x-prev); }
  function setCue(c, t) { st.cue = c; st.cueT = t; }
  // smoothed metric
  function m(key, x, dt, tau=0.15) { if (x == null || !isFinite(x)) return st.M[key]; return st.M[key] = ema(st.M[key], x, dt, tau); }
  // hysteresis fault: turns on after `enter` holds 0.35 s, off after `stay` fails 0.3 s
  function flag(key, enter, stay, dt, onT=0.35, offT=0.3) {
    const f = st.F[key] || (st.F[key] = { on:false, t:0 });
    if (!f.on) { f.t = enter ? f.t + dt : 0; if (f.t >= onT) { f.on = true; f.t = 0; } }
    else { f.t = stay ? 0 : f.t + dt; if (f.t >= offT) { f.on = false; f.t = 0; } }
    return f.on;
  }
  function clearFlags(keys) { for (const k of keys) if (st.F[k]) st.F[k] = { on:false, t:0 }; }

  function bodyFaults(dt, b, off, enterAt, stayAt) {
    const high = flag('hips_high', b < enterAt && off > 0, b < stayAt && off > 0, dt);
    const sag  = flag('hips_sag',  b < enterAt && off <= 0, b < stayAt && off <= 0, dt);
    return [sag && 'hips_sag', high && 'hips_high'];
  }

  function update(lm, tMs) {
    const dt = st.lastT==null ? 0.033 : Math.max(0.001, Math.min(0.5, (tMs-st.lastT)/1000)); st.lastT = tMs;
    const ev = []; const res = { events:ev, seg:'good', angle:null, live:[] };
    if (!lm) { st.lostT += dt; return finish(res, 'lost'); }
    const vis = visibility(lm); const ok = ex.need.every(k => vis[k]);
    if (!ok) { st.lostT += dt; return finish(res, 'lost'); }
    st.lostT = 0;
    const P = side(lm);
    const bodyLine = ang(P.S, P.H, P.A, ar);           // 180 = straight
    const off = m('off', lineOffset(P.S, P.A, P.H, ar), dt);   // + pike, - sag
    st.smBody = ema(st.smBody, bodyLine, dt, 0.15);
    res.body = st.smBody;

    if (ex.kind === 'hold') return hold(P, dt, tMs, res, off);

    const raw = ex.primary === 'knee' ? ang(P.H, P.K, P.A, ar) : ang(P.S, P.E, P.W, ar);
    st.buf = (st.buf || []).concat([[tMs, raw]]).filter(b => tMs - b[0] <= 110).slice(-5); // short time-window median kills 1-frame glitches
    const vals = st.buf.map(b => b[1]).sort((x,y)=>x-y); const med = vals.length === 2 ? (vals[0]+vals[1])/2 : vals[vals.length>>1];
    const a = st.sm = ema(st.sm, med, dt, 0.04); res.angle = a;

    // posture gate: are we in the exercise position?
    const torso = tilt(P.S, P.H, ar);
    let inPos = true;
    if (exId === 'pushup') inPos = tilt(P.S, P.A, ar) < 40 && P.W[1] > P.S[1];
    if (exId === 'squat')  inPos = torso > 35;
    if (exId === 'dip')    inPos = torso > 45 && P.W[1] > P.S[1];
    if (exId === 'pullup') inPos = P.W[1] < P.S[1];
    if (!inPos) { if (st.phase !== 'top') { st.phase='top'; } st.F = {}; res.seg='idle'; return finish(res, 'pos'); }

    // ---- live form checks (smoothed + hysteresis) ----
    const live = [];
    const working = st.phase !== 'top';
    if (exId === 'pushup') {
      live.push(...bodyFaults(dt, st.smBody, off, 160, 166));
      // hands under shoulders (checked near lockout): horizontal wrist offset vs arm length
      const hw = m('hands', Math.abs(P.W[0]-P.S[0])*ar / dist(P.S, P.W), dt, 0.25);
      if (a > 140) live.push(flag('hands_under', hw > 0.45, hw > 0.35, dt, 0.6) && 'hands_under');
      // elbow flare (side view): at the bottom, upper arm foreshortened and ~perpendicular to torso
      const sh = ang(P.H, P.S, P.E, ar), ratio = dist(P.S, P.E) / dist(P.E, P.W);
      res.dbg = { hw, sh, ratio };
      if (a < 115) live.push(flag('elbows_in', sh > 80 && ratio < 0.55, sh > 72 && ratio < 0.65, dt, 0.25) && 'elbows_in');
    }
    if (exId === 'squat') {
      live.push(flag('chest_up', working && torso < 40, working && torso < 46, dt, 0.3) && 'chest_up');
      // knee valgus: only measurable from the front (shoulders wide in image)
      const sw = Math.abs(P.S2[0]-P.S3[0])*ar, tl = dist(P.S, P.H);
      const allV = [P.K2,P.K3,P.A2,P.A3].every(p => (p[3] ?? 1) > 0.6);
      if (allV && sw > 0.45*tl && working && a < 140) {
        const kw = Math.abs(P.K2[0]-P.K3[0]), aw = Math.abs(P.A2[0]-P.A3[0]) || 1e-6;
        const kr = m('kr', kw/aw, dt, 0.15); res.dbg = { kr };
        live.push(flag('knees_out', kr < 0.75, kr < 0.85, dt, 0.25) && 'knees_out');
      }
    }
    if (exId === 'pullup' || exId === 'dip') {
      if (P.kv) { // knee / leg drive: hip flexion
        const hip = m('hip', ang(P.S, P.H, P.K, ar), dt, 0.1);
        const lim = exId === 'pullup' ? 130 : 105;
        live.push(flag('no_kipping', hip < lim, hip < lim + 8, dt, 0.2) && 'no_kipping');
        res.dbg = { hip };
      }
      if (exId === 'pullup') { // horizontal swing of hips relative to hands, normalised by torso
        const tl = dist(P.S, P.H) || 0.1;
        const mid = (a, b) => (a[0] + b[0]) / 2;
        const hx = (mid(P.H2, P.H3) - mid(lm[L.lw], lm[L.rw]))*ar / tl;
        st.swing = st.swing || [];
        st.swing.push([tMs, hx]); st.swing = st.swing.filter(s => tMs - s[0] < 1500);
        const xs = st.swing.map(s => s[1]); const range = Math.max(...xs) - Math.min(...xs);
        const sr = m('swing', range, dt, 0.2); res.dbg = { ...(res.dbg||{}), sr };
        live.push(flag('no_swing', sr > 0.85, sr > 0.7, dt, 0.3) && 'no_swing');
      }
    }
    const act = live.filter(Boolean); res.live = act;
    for (const f of act) if (working || f === 'hands_under' || f.startsWith('hips')) st.faults.add(f);
    if (act.length) { const f = FAULTS.find(k => act.includes(k)); res.seg = 'bad'; setCue(f, tMs); }

    const D = ex;
    // phases: top (extended) -> work (flexing) -> rise -> top (count)
    if (st.phase === 'top') {
      if (a < D.start) { st.phase = 'work'; st.workT = tMs; st.minA = a; st.faults = new Set(act); st.chin = false; }
    } else if (st.phase === 'work' || st.phase === 'rise') {
      st.minA = Math.min(st.minA, a);
      if (ex.inverted && P.N && P.N[1] < P.W[1] + 0.01) st.chin = true;
      if (st.phase === 'work' && a > st.minA + 20) { st.phase = 'rise'; st.ascMax = a; }
      if (st.phase === 'rise') {
        st.ascMax = Math.max(st.ascMax, a);
        if (a >= D.top && ((!ex.inverted && st.minA > D.start - 18 && !st.faults.size) || tMs - st.workT < 300)) { st.phase = 'top'; } // tiny wiggle or sub-0.3s glitch: ignore
        else if (a >= D.top) { // completed: judge
          const faults = FAULTS.filter(f => st.faults.has(f));
          const depthOk = ex.inverted ? (st.minA <= D.depth || st.chin) : st.minA <= D.depth;
          if (!depthOk) faults.push(ex.lowCue);
          const clean = faults.length === 0;
          if (clean) { st.reps++; ev.push({ type:'rep', clean:true, min:Math.round(st.minA), n:st.reps }); setCue('clean', tMs); }
          else { st.bad++; ev.push({ type:'rep', clean:false, min:Math.round(st.minA), reason:faults[0], faults }); setCue(faults[0], tMs); }
          st.attempts.push(clean ? 'clean' : 'bad'); st.phase = 'top';
        } else if (a < st.ascMax - 30 && st.ascMax < D.top - 12) { // went back down without lockout
          st.bad++; st.attempts.push('bad'); ev.push({ type:'rep', clean:false, min:Math.round(st.minA), reason:ex.lockCue, faults:[ex.lockCue] });
          setCue(ex.lockCue, tMs); st.phase = 'work'; st.minA = a; st.faults = new Set(act);
        }
      }
    }
    return finish(res, 'ok');
  }

  function hold(P, dt, tMs, res, off) {
    const b = st.smBody; const live = [];
    if (exId === 'plank') {
      if (tilt(P.S, P.A, ar) > 40) { st.F = {}; res.seg='idle'; return finish(res, 'pos'); }
      live.push(...bodyFaults(dt, b, off, 166, 170));
      // support point: straight-arm plank -> wrist, forearm plank -> elbow
      const elb = m('elb', ang(P.S, P.E, P.W, ar), dt, 0.2);
      const straight = elb > 145;
      const sup = straight ? P.W : P.E;
      const dir = Math.sign(P.H[0] - P.S[0]) || 1;               // +1 if hips are to the right of shoulders
      const fwd = m('fwd', -(P.S[0] - sup[0]) * dir * ar / dist(P.S, sup), dt); // + shoulders past the hands (toward head)
      const sa = m('sa', ang(P.H, P.S, sup, ar), dt);               // shoulder angle, ~90 ideal
      res.dbg = { fwd, sa, elb, b };
      const bad = Math.abs(fwd) > 0.3 || sa < 72 || sa > 108, stay = Math.abs(fwd) > 0.22 || sa < 77 || sa > 103;
      const key = straight ? 'shoulders_over_wrists' : 'shoulders_over_elbows';
      const on = flag('shoulders', bad, stay, dt);
      if (on) live.push(key);
    } else { // hollow: lying on back, shoulders and feet lifted, slight banana
      if (tilt(P.S, P.A, ar) > 45) { st.F = {}; res.seg='idle'; return finish(res, 'pos'); }
      const footUp = m('fu', P.H[1] - P.A[1], dt), shUp = m('su', P.H[1] - P.S[1], dt);
      live.push(flag('legs_lower', b < 140, b < 146, dt) && 'legs_lower');
      live.push(flag('legs_up', footUp < 0.015, footUp < 0.025, dt) && 'legs_up');
      live.push(flag('shoulders_up', shUp < 0.005, shUp < 0.012, dt) && 'shoulders_up');
    }
    const act = live.filter(Boolean); res.live = act;
    st.holdTotal += dt;
    if (!act.length) { st.holdGood += dt; res.seg = 'good'; if (st.cue !== 'hold') setCue('hold', tMs); }
    else { res.seg = 'bad'; setCue(FAULTS.find(k => act.includes(k)), tMs); st.faultTime = st.faultTime || {}; for (const f of act) st.faultTime[f] = (st.faultTime[f]||0) + dt; }
    return finish(res, 'ok');
  }

  function finish(res, status) {
    res.status = status; res.reps = st.reps; res.bad = st.bad; res.attempts = st.attempts; res.phase = st.phase;
    res.holdGood = st.holdGood; res.holdTotal = st.holdTotal; res.lostT = st.lostT; res.faultTime = st.faultTime;
    res.cue = st.cue && (st.lastT - st.cueT) < 1500 ? st.cue : null;
    return res;
  }
  return { update, state: st, ex };
}
