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
  pushup:  { kind:'reps', primary:'elbow', top:145, start:132, depth:100,  need:['s','e','w','h','a'] },
  squat:   { kind:'reps', primary:'knee',  top:160, start:140, depth:105, need:['s','h','k','a'] },
  dip:     { kind:'reps', primary:'elbow', top:145, start:132, depth:100,  need:['s','e','w','h'] },
  pullup:  { kind:'reps', primary:'elbow', top:145, start:130, depth:90,  inverted:true, need:['s','e','w'] },
  plank:   { kind:'hold', need:['s','h','a'] },
  hollow:  { kind:'hold', need:['s','h','a'] },
};

const PART = { s:['ls','rs'], e:['le','re'], w:['lw','rw'], h:['lh','rh'], k:['lk','rk'], a:['la','ra'] };

export function visibility(lm) { // which body groups are visible (either side)
  const out = {}; if (!lm) return out;
  for (const k in PART) out[k] = PART[k].some(n => lm[L[n]] && (lm[L[n]][3] ?? 1) > 0.5);
  return out;
}

export function createEngine(exId, { aspect = 9/16 } = {}) {
  const ex = EXERCISES[exId]; const ar = aspect; // ar = width/height of frame
  const st = { phase:'top', reps:0, bad:0, attempts:[], minA:999, maxA:0, ascMax:0, faults:new Set(),
    sm:null, lastT:null, holdGood:0, holdTotal:0, cue:null, cueT:0, smBody:null, lostT:0 };

  function side(lm) {
    const v = n => (lm[L[n]][3] ?? 1);
    const l = v('ls')+v('lh')+v('le')+v('lk')+v('la')+v('lw'), r = v('rs')+v('rh')+v('re')+v('rk')+v('ra')+v('rw');
    st.sideL = (st.sideL ?? 0) * 0.9 + (l - r) * 0.1; // sticky side choice: avoids left/right flips
    const s = st.sideL >= 0 ? 'l' : 'r'; const g = n => lm[L[s+n]];
    return { S:g('s'), E:g('e'), W:g('w'), H:g('h'), K:g('k'), A:g('a'), N:lm[0] };
  }
  function ema(prev, x, dt, tau=0.07) { if (prev==null) return x; const a = 1-Math.exp(-dt/tau); return prev + a*(x-prev); }
  function setCue(c, t) { st.cue = c; st.cueT = t; }

  function update(lm, tMs) {
    const dt = st.lastT==null ? 0.033 : Math.max(0.001, (tMs-st.lastT)/1000); st.lastT = tMs;
    const ev = []; const res = { events:ev, seg:'good', angle:null };
    if (!lm) { st.lostT += dt; return finish(res, 'lost'); }
    const vis = visibility(lm); const ok = ex.need.every(k => vis[k]);
    if (!ok) { st.lostT += dt; return finish(res, 'lost'); }
    st.lostT = 0;
    const P = side(lm);
    const bodyLine = ang(P.S, P.H, P.A, ar);           // 180 = straight
    const off = lineOffset(P.S, P.A, P.H, ar);          // + pike, - sag
    st.smBody = ema(st.smBody, bodyLine, dt, 0.12);
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
    if (!inPos) { if (st.phase !== 'top') { st.phase='top'; } res.seg='idle'; return finish(res, 'pos'); }

    // live form faults
    let cand = null, live = null;
    if (exId === 'pushup' && st.smBody < 158) cand = off < 0 ? 'hips_up' : 'hips_down';
    if (exId === 'squat' && torso < 40 && st.phase !== 'top') cand = 'chest_up';
    st.faultT = cand ? (st.faultT || 0) + dt : 0;   // must persist 0.3 s to count as a fault
    if (st.faultT >= 0.3) live = cand;
    if (live) { st.faults.add(live); res.seg = st.smBody < 148 || exId==='squat' ? 'bad' : 'warn'; setCue(live, tMs); }

    const D = ex; const down = !ex.inverted ? a < D.start : a < D.start; // all use flexion of joint as "work" phase
    // phases: top (extended) -> work (flexing) -> rise -> top (count)
    if (st.phase === 'top') {
      if (a < D.start) { st.phase = 'work'; st.workT = tMs; st.minA = a; st.faults = new Set(live ? [live] : []); st.chin = false; }
    } else if (st.phase === 'work' || st.phase === 'rise') {
      st.minA = Math.min(st.minA, a);
      if (ex.inverted && P.N && P.N[1] < P.W[1] + 0.01) st.chin = true;
      if (st.phase === 'work' && a > st.minA + 20) { st.phase = 'rise'; st.ascMax = a; }
      if (st.phase === 'rise') {
        st.ascMax = Math.max(st.ascMax, a);
        if (a >= D.top && ((!ex.inverted && st.minA > D.start - 18 && !st.faults.size) || tMs - st.workT < 300)) { st.phase = 'top'; } // tiny wiggle or sub-0.3s glitch: ignore
        else if (a >= D.top) { // completed: judge
          const faults = [...st.faults];
          const depthOk = ex.inverted ? (st.minA <= D.depth || st.chin) : st.minA <= D.depth;
          if (!depthOk) faults.push(ex.inverted ? 'higher' : 'go_lower');
          const clean = depthOk && !faults.some(f => f==='hips_up'||f==='hips_down'||f==='chest_up');
          if (clean) { st.reps++; ev.push({ type:'rep', clean:true, min:Math.round(st.minA), n:st.reps }); setCue('clean', tMs); }
          else { st.bad++; ev.push({ type:'rep', clean:false, min:Math.round(st.minA), reason:faults[0] }); setCue(faults[0], tMs); }
          st.attempts.push(clean ? 'clean' : 'bad'); st.phase = 'top';
        } else if (a < st.ascMax - 30 && st.ascMax < D.top - 12) { // went back down without lockout
          st.bad++; st.attempts.push('bad'); ev.push({ type:'rep', clean:false, min:Math.round(st.minA), reason:'lockout' });
          setCue('lockout', tMs); st.phase = 'work'; st.minA = a; st.faults = new Set();
        }
      }
      if (st.phase === 'work' && !live && a > D.depth && a < D.start - 15) res.seg = res.seg === 'good' ? 'good' : res.seg;
    }
    return finish(res, 'ok');
  }

  function hold(P, dt, tMs, res, off) {
    const b = st.smBody; let fault = null;
    if (exId === 'plank') {
      if (tilt(P.S, P.A, ar) > 40) { res.seg='idle'; return finish(res, 'pos'); }
      if (b < 160) fault = off < 0 ? 'hips_up' : 'hips_down';
    } else { // hollow: lying on back, shoulders and feet lifted, slight banana
      if (tilt(P.S, P.A, ar) > 45) { res.seg='idle'; return finish(res, 'pos'); }
      const footUp = P.H[1] - P.A[1], shUp = P.H[1] - P.S[1];
      if (b < 140) fault = 'legs_lower';
      else if (footUp < 0.015) fault = 'legs_up';
      else if (shUp < 0.005) fault = 'shoulders_up';
    }
    st.holdTotal += dt;
    if (!fault) { st.holdGood += dt; res.seg = 'good'; if (st.cue !== 'hold') setCue('hold', tMs); }
    else { res.seg = 'bad'; setCue(fault, tMs); }
    return finish(res, 'ok');
  }

  function finish(res, status) {
    res.status = status; res.reps = st.reps; res.bad = st.bad; res.attempts = st.attempts; res.phase = st.phase;
    res.holdGood = st.holdGood; res.holdTotal = st.holdTotal; res.lostT = st.lostT;
    res.cue = st.cue && (st.lastT - st.cueT) < 1500 ? st.cue : null;
    return res;
  }
  return { update, state: st, ex };
}
