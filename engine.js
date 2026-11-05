// Calisthenics Flow — rep/hold engine. Pure logic, no DOM. Shared by app and tests.
export const L = { nose:0, ls:11, rs:12, le:13, re:14, lw:15, rw:16, lh:23, rh:24, lk:25, rk:26, la:27, ra:28, lheel:29, rheel:30, ltoe:31, rtoe:32 };

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

// 3D angle at b (world landmarks, metres)
function ang3(a, b, c) { const v1=[a[0]-b[0],a[1]-b[1],a[2]-b[2]], v2=[c[0]-b[0],c[1]-b[1],c[2]-b[2]];
  const d=Math.hypot(...v1)*Math.hypot(...v2)||1e-9; return Math.acos(Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2])/d)))*180/Math.PI; }
// 3D deviation of segment a->c from vertical (world y = image down axis), deg
function vdev3(a, c) { return Math.atan2(Math.hypot(c[0]-a[0], c[2]-a[2]), Math.abs(c[1]-a[1])||1e-9)*180/Math.PI; }
// One Euro filter (Casiez 2012): low jitter when still, low lag when moving
function oneEuro(minCut=1.2, beta=8, dCut=1) { let x=null, dx=0; const al=(c,dt)=>1/(1+1/(2*Math.PI*c*dt));
  return (v, dt) => { if (x==null) return x=v; const ed=(v-x)/dt; dx+=al(dCut,dt)*(ed-dx); x+=al(minCut+beta*Math.abs(dx),dt)*(v-x); return x; }; }
export const VIS = 0.5;
// camera view from shoulder/hip orientation: world-z depth vs width (3D), fallback 2D width/torso ratio
export function viewYaw(lm, wl, ar=9/16) {
  if (wl) { const y = (i, j) => Math.atan2(Math.abs(wl[i][2]-wl[j][2]), Math.hypot(wl[i][0]-wl[j][0], wl[i][1]-wl[j][1])||1e-9)*180/Math.PI;
    return (y(11,12) + y(23,24)) / 2; }
  const d = (i, j) => Math.hypot((lm[i][0]-lm[j][0])*ar, lm[i][1]-lm[j][1]);
  const mx = (i, j) => [(lm[i][0]+lm[j][0])/2, (lm[i][1]+lm[j][1])/2];
  const ms = mx(11,12), mh = mx(23,24), tl = Math.hypot((ms[0]-mh[0])*ar, ms[1]-mh[1]) || 1e-6;
  const r = (d(11,12) + d(23,24)*1.25) / 2 / tl; // ~0.75 facing camera, ~0.1 side-on
  return Math.acos(Math.max(0, Math.min(1, r / 0.75))) * 180/Math.PI;
}
// which checks run in which view. side = profile, front = facing (or back to) camera, d34 = 3/4 diagonal
export const CHECKS = {
  pushup:   { side:['hips_sag','hips_high','hands_under','elbows_in'], d34:['hips_sag','hips_high'], front:['elbows_in'] },
  squat:    { side:['chest_up'], d34:['chest_up','knees_out','knees_wide'], front:['knees_out','knees_wide'] },
  pullup:   { side:['no_kipping','no_swing'], d34:['no_kipping','no_swing'], front:['no_kipping'] },
  dip:      { side:['no_kipping'], d34:['no_kipping'], front:['no_kipping'] },
  plank:    { side:['hips_sag','hips_high','shoulders_over_wrists'], d34:['hips_sag','hips_high'], front:[] },
  hollow:   { side:['legs_lower','legs_up','shoulders_up'], d34:['legs_lower'], front:[] },
  // handstand: hs_line (lean/line vs vertical) is only meaningful from the side; off-profile it read as a permanent fault
  handstand:{ side:['straight_arms','open_shoulders','no_banana','hs_line'], d34:['straight_arms','open_shoulders','no_banana'], front:['straight_arms'] },
  lsit:     { side:['legs_straight','hips_up_ls','shoulders_over_wrists'], d34:['legs_straight'], front:['legs_straight'] },
  row:      { side:['hips_sag','hips_high','lockout'], d34:['hips_sag','hips_high'], front:[] },
  lunge:    { side:['back_straight'], d34:['back_straight','knees_out'], front:['knees_out'] },
};
export const BEST_VIEW = { pushup:'side', squat:'side', pullup:'front', dip:'side', plank:'side', hollow:'side', handstand:'side', lsit:'side', row:'side', lunge:'side' };

export const EXERCISES = {
  pushup:  { kind:'reps', primary:'elbow', top:145, start:132, depth:100, need:['s','e','w','h','a'], lowCue:'go_lower', lockCue:'lockout' },
  squat:   { kind:'reps', primary:'knee',  top:160, start:140, depth:105, need:['s','h','k','a'], lowCue:'deeper', lockCue:'stand_tall' },
  dip:     { kind:'reps', primary:'elbow', top:145, start:132, depth:100, need:['s','e','w','h'], lowCue:'dip_lower', lockCue:'lockout' },
  pullup:  { kind:'reps', primary:'elbow', top:145, start:130, depth:90,  inverted:true, need:['s','e','w'], lowCue:'chin_over', lockCue:'full_hang' },
  plank:   { kind:'hold', need:['s','e','h','a'] },
  hollow:  { kind:'hold', need:['s','h','a'] },
  handstand:{ kind:'hold', need:['s','e','w','h','a'] },
  lsit:    { kind:'hold', need:['s','e','w','h','k','a'] },
  row:     { kind:'reps', primary:'elbow', top:145, start:130, depth:95, need:['s','e','w','h','a'], lowCue:'chin_over', lockCue:'lockout', inverted:true },
  lunge:   { kind:'reps', primary:'knee',  top:160, start:142, depth:115, need:['s','h','k','a'], lowCue:'deeper', lockCue:'stand_tall' },
};
// every named fault blocks the rep / hold second. Priority = order (first shown).
export const FAULTS = ['not_lunge','not_squat','lunge_step','lunge_knees','heels_up','knees_wide','whole_body','knees_down','feet_support','not_pullup','not_plank','not_hollow','lsit_position',
  'hips_sag','hips_high','shoulders_over_elbows','shoulders_over_wrists','no_kipping','no_swing','knees_out','chest_up','elbows_in','hands_under',
  'legs_up','legs_lower','shoulders_up','straight_arms','open_shoulders','no_banana','hs_line','legs_straight','hips_up_ls','back_straight','go_lower','deeper','dip_lower','chin_over','lockout','full_hang','stand_tall'];

const PART = { s:['ls','rs'], e:['le','re'], w:['lw','rw'], h:['lh','rh'], k:['lk','rk'], a:['la','ra'] };

export function visibility(lm) { // which body groups are visible (either side)
  const out = {}; if (!lm) return out;
  for (const k in PART) out[k] = PART[k].some(n => lm[L[n]] && (lm[L[n]][3] ?? 1) > 0.5);
  return out;
}

// plank: real clean side-view planks read offT ~+0.04 and armV ~+4 deg (MediaPipe bias), so limits are centred there
export const LIM = { offC:0.04, off:0.12, armC:4, arm:10, pbody:164, hsElb:155, hsSh:155, hsHip:163, hsLean:8, hands:0.42, kipPull:140, kipDip:115, chest:45 };

export function createEngine(exId, { aspect = 9/16, smooth = null, forceView = null, euro = [1.5, 4], hold = 400, strict = 1 } = {}) {
  const SL = strict >= 1.15 ? 1.15 : strict <= 0.85 ? 0.85 : strict; // per-user threshold calibration: >1 = stricter
  const K = { tol: 1/SL, depth: SL };
  const ex = EXERCISES[exId]; const ar = aspect; // ar = width/height of frame
  const st = { phase:'top', reps:0, bad:0, attempts:[], minA:999, maxA:0, ascMax:0, faults:new Set(),
    sm:null, lastT:null, holdGood:0, holdTotal:0, cue:null, cueT:0, smBody:null, lostT:0, M:{}, F:{} };
  const dist = (a, b) => Math.hypot((a[0]-b[0])*ar, a[1]-b[1]) || 1e-6;

  const pairVis = (...ps) => ps.every(p => p && (p[3] ?? 1) >= 0.6);
  // Compare left/right along the body's sagittal axis, not raw left/right image x.
  // This distinguishes a lunge step from a wide squat stance in side/3/4/front views.
  function legSymmetry(P, P3) {
    if (!P3 || !pairVis(P.H2,P.H3,P.K2,P.K3,P.A2,P.A3,P.S2,P.S3)) return null;
    const W3 = [P3.S2,P3.S3];
    const lateral = W3[0].map((v,i) => v-W3[1][i]);
    lateral[1] = 0; const ll = Math.hypot(...lateral);
    if (ll < 0.04) return null;
    const u = lateral.map(v => v/ll), sag = [-u[2],0,u[0]];
    const thigh = (dist(P.H2,P.K2)+dist(P.H3,P.K3))/2;
    if (thigh < 0.04) return null;
    const metric = (a,b) => { const d=a.map((v,i)=>v-b[i]); return {
      sag:Math.abs(d[0]*sag[0]+d[2]*sag[2])/thigh,
      lat:Math.abs(d[0]*u[0]+d[2]*u[2])/thigh,
      vert:Math.abs(d[1])/thigh }; };
    return { ankle:metric(P3.A2,P3.A3), knee:metric(P3.K2,P3.K3), hip:metric(P3.H2,P3.H3), thigh };
  }

  function side(lm, wl) {
    const v = n => (lm[L[n]][3] ?? 1);
    const l = v('ls')+v('lh')+v('le')+v('lk')+v('la')+v('lw'), r = v('rs')+v('rh')+v('re')+v('rk')+v('ra')+v('rw');
    st.sideL = (st.sideL ?? 0) * 0.9 + (l - r) * 0.1; // sticky side choice: avoids left/right flips
    const s = st.sideL >= 0 ? 'l' : 'r'; const g = n => lm[L[s+n]];
    const kv = v(s+'k') > 0.5;
    const w = wl ? (n => wl[L[s+n]]) : null;
    const P3 = w ? { S:w('s'), E:w('e'), W:w('w'), H:w('h'), K:w('k'), A:w('a'), K2:wl[L.lk], K3:wl[L.rk], A2:wl[L.la], A3:wl[L.ra], S2:wl[L.ls], S3:wl[L.rs], H2:wl[L.lh], H3:wl[L.rh] } : null;
    return { P3, S:g('s'), E:g('e'), W:g('w'), H:g('h'), K:g('k'), A:g('a'), N:lm[0], kv,
      S2:lm[L.ls], S3:lm[L.rs], W2:lm[L.lw], W3:lm[L.rw], K2:lm[L.lk], K3:lm[L.rk], A2:lm[L.la], A3:lm[L.ra], H2:lm[L.lh], H3:lm[L.rh],
      HE2:lm[L.lheel], HE3:lm[L.rheel], T2:lm[L.ltoe], T3:lm[L.rtoe] };
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

  // smoothing + visibility: One Euro per coordinate; low-visibility points hold their last good position briefly, then drop out
  function prep(lm, wl, dt, tMs) {
    if (!(smooth ?? !['pushup','plank'].includes(exId))) return [lm, wl];  // push-up/plank already read well raw; One Euro lagged lockouts there
    const F = st.flt || (st.flt = { p:[], w:[], last:[] }); const out = [], wout = wl ? [] : null;
    for (let i = 0; i < lm.length; i++) {
      const p = lm[i], v = p[3] ?? 1, last = F.last[i];
      if (v >= VIS || !last) {
        const f = F.p[i] || (F.p[i] = [oneEuro(...euro), oneEuro(...euro), oneEuro(...euro)]);
        const q = [f[0](p[0], dt), f[1](p[1], dt), f[2](p[2], dt), v]; out.push(q);
        if (v >= VIS) F.last[i] = { q, t:tMs };
      } else if (tMs - last.t < hold) out.push([last.q[0], last.q[1], last.q[2], VIS + 0.01]); // brief dropout: hold
      else { out.push(p); F.p[i] = null; }
      if (wl) { const f = F.w[i] || (F.w[i] = [oneEuro(...euro), oneEuro(...euro), oneEuro(...euro)]); const w = wl[i]; wout.push([f[0](w[0], dt), f[1](w[1], dt), f[2](w[2], dt)]); }
    }
    return [out, wout];
  }
  function view(lm, wl, dt) {
    const y = viewYaw(lm, wl, ar); st.yaw = ema(st.yaw, y, dt, 0.6);
    const v = st.view, Y = st.yaw; // hysteresis between views
    // push-up/plank on the floor: depth (z) is the least reliable there and the side view is the norm -> stickier side
    const fl = exId === 'pushup' || exId === 'plank', sOut = fl ? 32 : 47, sIn = fl ? 44 : 60, s0 = fl ? 42 : 55;
    st.view = !v ? (Y > s0 ? 'side' : Y < 30 ? 'front' : 'd34')
      : v === 'side' ? (Y < sOut ? 'd34' : 'side') : v === 'front' ? (Y > 38 ? 'd34' : 'front') : (Y > sIn ? 'side' : Y < 25 ? 'front' : 'd34');
    if (forceView) st.view = forceView;
    else if (exId === 'hollow') st.view = 'side';  // lying on the back: yaw from world z is meaningless, checks are side-only
    return st.view;
  }

  function update(lm0, tMs, wl0) {
    const dt = st.lastT==null ? 0.033 : Math.max(0.001, Math.min(0.5, (tMs-st.lastT)/1000)); st.lastT = tMs;
    const ev = []; const res = { events:ev, seg:'good', angle:null, live:[] };
    if (!lm0) { st.lostT += dt; return finish(res, 'lost'); }
    const [lm, wl] = prep(lm0, wl0, dt, tMs); res.lm = lm;
    const V = res.view = view(lm, wl, dt); res.yaw = st.yaw;
    res.checks = (CHECKS[exId] || {})[V] || [];
    const vis = visibility(lm); const ok = ex.need.every(k => vis[k]);
    if (!ok) { st.lostT += dt; return finish(res, 'lost'); }
    st.lostT = 0;
    const P = side(lm, wl); const P3 = P.P3;
    const use3 = !!P3 && V !== 'side';                      // off-profile: 2D angles are foreshortened -> use 3D world landmarks
    let bodyLine = ang(P.S, P.H, P.A, ar), offRaw = lineOffset(P.S, P.A, P.H, ar);
    if (use3) { bodyLine = ang3(P3.S, P3.H, P3.A);
      const u = [P3.A[0]-P3.S[0], P3.A[1]-P3.S[1], P3.A[2]-P3.S[2]], h = [P3.H[0]-P3.S[0], P3.H[1]-P3.S[1], P3.H[2]-P3.S[2]];
      const k = (u[0]*h[0]+u[1]*h[1]+u[2]*h[2]) / (u[0]*u[0]+u[1]*u[1]+u[2]*u[2] || 1e-9);
      offRaw = -(h[1] - k*u[1]); }                          // + hips above the shoulder-ankle line (pike)
    const off = m('off', offRaw, dt);   // + pike, - sag
    st.smBody = ema(st.smBody, bodyLine, dt, 0.15);
    res.body = st.smBody;

    res.use3 = use3;
    if (ex.kind === 'hold') return hold(P, dt, tMs, res, off, V, use3);

    const raw = (use3 && ex.primary !== 'knee') ? (ex.primary === 'knee' ? ang3(P3.H, P3.K, P3.A) : ang3(P3.S, P3.E, P3.W))
      : ex.primary === 'knee' ? ang(P.H, P.K, P.A, ar) : ang(P.S, P.E, P.W, ar);
    st.buf = (st.buf || []).concat([[tMs, raw]]).filter(b => tMs - b[0] <= 110).slice(-5); // short time-window median kills 1-frame glitches
    const vals = st.buf.map(b => b[1]).sort((x,y)=>x-y); const med = vals.length === 2 ? (vals[0]+vals[1])/2 : vals[vals.length>>1];
    const a = st.sm = ema(st.sm, med, dt, 0.04); res.angle = a;

    // posture gate: are we in the exercise position?
    const torso = use3 ? 90 - vdev3(P3.H, P3.S) : tilt(P.S, P.H, ar);
    let inPos = true;
    if (exId === 'pushup') inPos = tilt(P.S, P.A, ar) < 40 && P.W[1] > P.S[1];
    if (exId === 'squat')  inPos = Math.max(torso, tilt(P.S, P.H, ar)) > 35;  // 3D torso can read leaned on deep front-view squats
    if (exId === 'dip')    inPos = torso > 45 && P.W[1] > P.S[1];
    if (exId === 'pullup') inPos = P.W[1] < P.S[1];
    if (exId === 'row') inPos = P.W[1] < P.S[1] && tilt(P.S, P.A, ar) < 55;  // body hanging under a low bar, inclined
    if (exId === 'lunge') inPos = Math.max(torso, tilt(P.S, P.H, ar)) > 45;
    if (!inPos) { if (st.phase !== 'top') { st.phase='top'; } st.F = {}; res.seg='idle'; return finish(res, 'pos'); }

    // ---- live form checks (smoothed + hysteresis) ----
    const live = [];
    const working = st.phase !== 'top';
    const bothLegs = pairVis(P.H2,P.H3,P.K2,P.K3,P.A2,P.A3);
    const sym = bothLegs ? legSymmetry(P,P3) : null;
    if (sym) {
      const aStep = m('aStep',sym.ankle.sag,dt,0.18), kStep = m('kStep',sym.knee.sag,dt,0.18);
      const aWide = m('aWide',sym.ankle.lat,dt,0.18);
      const stepped = aStep > 0.68 && kStep > 0.42 && aStep > 1.25*aWide;
      const stepStay = aStep > 0.52 && kStep > 0.30 && aStep > 1.1*aWide;
      res.sym = { ankle:sym.ankle, knee:sym.knee, hip:sym.hip, aStep, kStep, aWide };
      if (exId === 'squat') live.push(flag('not_lunge', stepped, stepStay, dt, 0.3) && 'not_lunge');
      if (exId === 'lunge') {
        live.push(flag('lunge_step', working && a < 142 && !stepped && !st.repStep, working && a < 145 && !stepStay && !st.repStep, dt, 0.45) && 'lunge_step');
        const hasStep = stepped || st.repStep;
        if (stepped) st.repStep = true;
        live.push(flag('not_squat', working && a < 130 && !hasStep, working && a < 135 && !hasStep && !stepStay, dt, 0.3) && 'not_squat');
      }
    }

    if (exId === 'pushup') {
      live.push(...bodyFaults(dt, st.smBody, off, LIM.pbody - (K.tol-1)*20, LIM.pbody+5 - (K.tol-1)*20));
      // hands under shoulders (checked near lockout): horizontal wrist offset vs arm length
      const hw = m('hands', Math.abs(P.W[0]-P.S[0])*ar / dist(P.S, P.W), dt, 0.25);
      if (a > 140) live.push(flag('hands_under', hw > LIM.hands, hw > LIM.hands-0.08, dt, 0.6) && 'hands_under');
      // elbow flare (side view): at the bottom, upper arm foreshortened and ~perpendicular to torso
      const sh = ang(P.H, P.S, P.E, ar), ratio = dist(P.S, P.E) / dist(P.E, P.W);
      res.dbg = { hw, sh, ratio };
      if (V === 'front') { // facing camera: elbows flare = elbow span much wider than shoulder span at the bottom
        const ew = Math.abs(lm[L.le][0]-lm[L.re][0]) / (Math.abs(lm[L.ls][0]-lm[L.rs][0]) || 1e-6);
        const er = m('ew', ew, dt, 0.15); res.dbg.ew = er;
        if (a < 115) live.push(flag('elbows_in', er > 1.7, er > 1.55, dt, 0.25) && 'elbows_in');
      } else if (a < 115) live.push(flag('elbows_in', sh > 80 && ratio < 0.55, sh > 72 && ratio < 0.65, dt, 0.25) && 'elbows_in');
    }
    if (exId === 'squat' || exId === 'lunge') {
      live.push(flag('chest_up', working && torso < LIM.chest, working && torso < LIM.chest+6, dt, 0.3) && 'chest_up');
      // knee valgus: only measurable from the front (shoulders wide in image)
      const sw = Math.abs(P.S2[0]-P.S3[0])*ar, tl = dist(P.S, P.H);
      if (exId === 'lunge') {
        live.push(flag('back_straight', working && torso < 62, working && torso < 70, dt, 0.3) && 'back_straight');
        if (bothLegs) {
          const k1 = use3 ? ang3(P3.H2,P3.K2,P3.A2) : ang(P.H2,P.K2,P.A2,ar);
          const k2 = use3 ? ang3(P3.H3,P3.K3,P3.A3) : ang(P.H3,P.K3,P.A3,ar);
          const bothBend = Math.max(k1,k2) < 150;
          live.push(flag('lunge_knees', working && a < 130 && !bothBend, working && a < 135 && Math.max(k1,k2) < 158, dt, 0.3) && 'lunge_knees');
        }
      }
      if (exId === 'squat') {
        // Two independent image-space signals: ankle travel plus heel/toe pitch.
        // The latter uses MediaPipe landmarks 29–32 and still fires when the toe
        // stays planted and the ankle tracker barely moves. World-y is avoided:
        // it is not a stable floor signal across clips.
        const footScale = (dist(P.H2,P.K2)+dist(P.H3,P.K3))/2 || 1;
        const ankleY = (P.A2[1]+P.A3[1])/2;
        const feet = [[P.A2,P.HE2,P.T2],[P.A3,P.HE3,P.T3]]
          .filter(q => q.every(p => p && (p[3] ?? 1) >= 0.6));
        const pitchNow = feet.length ? feet.reduce((sum,q) => sum + (q[2][1]-q[1][1])/footScale,0)/feet.length : null;
        if (st.phase === 'top' && a > 160) {
          st.heelBase = st.heelBase == null ? ankleY : ema(st.heelBase,ankleY,dt,0.6);
          if (pitchNow != null) st.heelPitchBase = st.heelPitchBase == null ? pitchNow : ema(st.heelPitchBase,pitchNow,dt,0.6);
        }
        const rise = m('heelRise',((st.heelBase ?? ankleY)-ankleY)/footScale,dt,0.12);
        const pitch = pitchNow == null || st.heelPitchBase == null ? null : m('heelPitch',pitchNow-st.heelPitchBase,dt,0.12);
        res.heelRise = rise; res.heelPitch = pitch;
        const heelEnter = rise > 0.22 || (pitch != null && pitch > 0.32);
        const heelStay = rise > 0.17 || (pitch != null && pitch > 0.24);
        if (working && pairVis(P.A2,P.A3)) live.push(flag('heels_up',heelEnter,heelStay,dt,0.3) && 'heels_up');
      }
      const allV = [P.K2,P.K3,P.A2,P.A3].every(p => (p[3] ?? 1) > 0.6);
      if (allV && (P3 ? V !== 'side' : sw > 0.45*tl) && working && a < 140) {
        const hz = (p, q) => Math.hypot(p[0]-q[0], p[2]-q[2]);
        const kw = P3 ? hz(P3.K2, P3.K3) : Math.abs(P.K2[0]-P.K3[0])*ar, aw = (P3 ? hz(P3.A2, P3.A3) : Math.abs(P.A2[0]-P.A3[0])*ar) || 1e-6;
        const kr = m('kr', kw/aw, dt, 0.15); res.dbg = { kr };
        live.push(flag('knees_out', kr < 0.75, kr < 0.85, dt, 0.25) && 'knees_out');
        if (exId === 'squat') live.push(flag('knees_wide', kr > 1.8, kr > 1.65, dt, 0.3) && 'knees_wide');
      }
    }
    if (exId === 'row') {
      live.push(...bodyFaults(dt, st.smBody, off, 160, 168));   // keep the straight line shoulders-hips-ankles
      res.dbg = { b: st.smBody };
    }
    if (exId === 'pullup' || exId === 'dip') {
      if (P.kv) { // knee / leg drive: hip flexion
        const hip = m('hip', use3 ? ang3(P3.S, P3.H, P3.K) : ang(P.S, P.H, P.K, ar), dt, 0.1);
        const lim = exId === 'pullup' ? LIM.kipPull : LIM.kipDip;
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
    // Whole-body travel prevents arm-only / hip-only push-ups from counting.
    if (exId === 'pushup') {
      const sc = dist(P.S,P.H) || 0.1;
      const sy = (P.S2[1]+P.S3[1])/2, hy = (P.H2[1]+P.H3[1])/2;
      st.motion = st.motion || { topS:sy, topH:hy, topT:tMs, lowS:sy, lowH:hy, lowT:tMs };
      const M = st.motion;
      if (st.phase === 'top' && a > 140) { const topY=Math.min(sy,hy); if (topY < M.topS) { M.topS=sy; M.topH=hy; M.topT=tMs; } M.lowS=sy; M.lowH=hy; }
      if (st.phase !== 'top' && Math.abs(sy-M.topS) > Math.abs(M.lowS-M.topS)) { M.lowS=sy; M.lowH=hy; M.lowT=tMs; }
      const shoulderTravel = Math.abs(sy-M.topS)/sc, hipTravel = Math.abs(hy-M.topH)/sc;
      res.motion = { shoulderTravel, hipTravel, torso:sc };

      // Knees on the floor have a recognisable horizontal thigh + vertical shin.
      if (bothLegs) {
        const thighs = [tilt(P.H2,P.K2,ar),tilt(P.H3,P.K3,ar)], shins=[tilt(P.K2,P.A2,ar),tilt(P.K3,P.A3,ar)];
        const kneeDown = thighs.filter(x=>x<35).length && shins.filter(x=>x>65).length;
        live.push(flag('knees_down',kneeDown,kneeDown,dt,0.4) && 'knees_down');
      }
    }
    // Support/horizontal-body errors are only asserted when the relevant feet are visible.
    if (exId === 'pullup' && pairVis(P.A2,P.A3) && pairVis(P.H2,P.H3,P.K2,P.K3)) {
      const torsoL=tilt(P.S2,P.H2,ar),torsoR=tilt(P.S3,P.H3,ar);
      const torsoMax=Math.max(torsoL,torsoR),torsoMin=Math.min(torsoL,torsoR);
      res.pullupBodyTilt = Math.round(torsoMax);
      // A body-row silhouette has horizontal thighs, and shins that point down
      // from the knees rather than hanging vertically below a high bar. Either
      // near-horizontal torso or a low planted shin + inclined thigh rejects it.
      const thighs=[tilt(P.H2,P.K2,ar),tilt(P.H3,P.K3,ar)];
      const shins=[tilt(P.K2,P.A2,ar),tilt(P.K3,P.A3,ar)];
      const lowFeet=P.A2[1]>P.H2[1]+0.04 && P.A3[1]>P.H3[1]+0.04;
      const horizontal=torsoMax<60 && Math.max(...thighs)<58 && Math.min(...shins)<65;
      const supported=lowFeet && Math.min(...thighs)<55 && Math.max(...thighs)<75 && Math.min(...shins)<75;
      const inclined=torsoMax<80 && torsoMin<72 && Math.min(...thighs)<42 && Math.min(...shins)<48;
      const wrongRow=horizontal || supported || inclined;
      live.push(flag('not_pullup',wrongRow,wrongRow,dt,0.4) && 'not_pullup');
    }
    if (exId === 'dip' && bothLegs) {
      const thighs=[tilt(P.H2,P.K2,ar),tilt(P.H3,P.K3,ar)], shins=[tilt(P.K2,P.A2,ar),tilt(P.K3,P.A3,ar)];
      const supported = thighs.some(x=>x<30) && shins.some(x=>x>60);
      live.push(flag('feet_support',supported,supported,dt,0.4) && 'feet_support');
    }
    const act = gate(live, res); res.live = act;

    for (const f of act) if (working || ['hands_under','not_lunge','not_squat','lunge_step','feet_support','not_pullup'].includes(f) || f.startsWith('hips')) st.faults.add(f);
    if (act.length) { const f = FAULTS.find(k => act.includes(k)); res.seg = 'bad'; setCue(f, tMs); }

    const D = ex;
    // phases: top (extended) -> work (flexing) -> rise -> top (count)
    if (st.phase === 'top') {
      if (a < D.start) { st.phase = 'work'; st.workT = tMs; st.minA = a; st.faults = new Set(act); st.chin = false;
      }
    } else if (st.phase === 'work' || st.phase === 'rise') {
      st.minA = Math.min(st.minA, a);
      if (ex.inverted && P.N && P.N[1] < P.W[1] + 0.01) st.chin = true;
      if (st.phase === 'work' && a > st.minA + 20) { st.phase = 'rise'; st.ascMax = a; }
      if (st.phase === 'rise') {
        st.ascMax = Math.max(st.ascMax, a);
        if (a >= D.top && ((!ex.inverted && st.minA > D.start - 18 && !st.faults.size) || tMs - st.workT < 300)) { st.phase = 'top'; } // tiny wiggle or sub-0.3s glitch: ignore
        else if (a >= D.top) { // completed: judge
          const faults = FAULTS.filter(f => st.faults.has(f));
          if (exId === 'pushup' && st.motion) {
            const M=st.motion, sc=dist(P.S,P.H)||0.1;
            const shoulder=Math.abs(M.lowS-M.topS)/sc, hip=Math.abs(M.lowH-M.topH)/sc;
            const peak=Math.max(shoulder,hip), trough=Math.min(shoulder,hip);
            if ((peak > 0.2 && trough < 0.4*peak) || (peak < 0.12 && st.minA <= D.depth + (1-K.depth)*40)) faults.unshift('whole_body');
            res.repMotion={shoulder,hip};
          }
          const depthOk = ex.inverted ? (st.minA <= D.depth + (1-K.depth)*40 || st.chin) : st.minA <= D.depth + (1-K.depth)*40;
          if (!depthOk) faults.push(ex.lowCue);
          const clean = faults.length === 0;
          if (clean) { st.reps++; ev.push({ type:'rep', clean:true, min:Math.round(st.minA), n:st.reps }); setCue('clean', tMs); }
          else { st.bad++; ev.push({ type:'rep', clean:false, min:Math.round(st.minA), reason:faults[0], faults }); setCue(faults[0], tMs); }
          st.attempts.push(clean ? 'clean' : 'bad'); st.phase = 'top'; st.repStep = false;
        } else if (a < st.ascMax - 30 && st.ascMax < D.top - 12) { // went back down without lockout
          st.bad++; st.attempts.push('bad'); ev.push({ type:'rep', clean:false, min:Math.round(st.minA), reason:ex.lockCue, faults:[ex.lockCue] });
          setCue(ex.lockCue, tMs); st.phase = 'work'; st.minA = a; st.faults = new Set(act);
        }
      }
    }
    return finish(res, 'ok');
  }

  function hold(P, dt, tMs, res, off, V, use3) {
    const P3 = P.P3;
    const b = st.smBody; const live = [];
    // A standing or seated body is not a floor hold. Keep the debounce alive while
    // the ordinary position gate would otherwise reset it on every frame.
    const wrongHoldPose = (torsoMin, bodyMin) => {
      const torsoUp = tilt(P.S,P.H,ar) > torsoMin;
      const legVisible = (P.K[3] ?? 1) >= VIS && (P.A[3] ?? 1) >= VIS;
      const seated = torsoUp && legVisible && tilt(P.H,P.K,ar) < 35 && P.A[1] >= P.H[1] - 0.03;
      return torsoUp && (tilt(P.S,P.A,ar) > bodyMin || seated);
    };
    if (exId === 'plank') {
      const wrongPose = wrongHoldPose(60,55);
      const wrong = flag('not_plank',wrongPose,wrongPose,dt,0.4);
      if (wrong) return finish(res,'ok',[],['not_plank'],dt);
      if (wrongPose) return finish(res,'pos');
      if (tilt(P.S, P.A, ar) > 40) { st.F = {}; res.seg='idle'; return finish(res, 'pos'); }
      if (tilt(P.S,P.H,ar) > 60) live.push(flag('not_plank',true,true,dt,0.4) && 'not_plank');
      live.push(...bodyFaults(dt, b, off, 166, 170));
      // support point: straight-arm plank -> wrist, forearm plank -> elbow
      const elb = m('elb', ang(P.S, P.E, P.W, ar), dt, 0.2);
      const straight = elb > 145;
      const sup = straight ? P.W : P.E;
      const dir = Math.sign(P.H[0] - P.S[0]) || 1;               // +1 if hips are to the right of shoulders
      const tl = dist(P.S, P.H);
      const dx = -(P.S[0] - sup[0]) * dir * ar;                     // + = shoulders toward the head (past hands)
      const off_t = m('offT', dx / tl, dt);                         // horizontal offset in torso lengths
      const armV = m('armV', Math.atan2(dx, Math.abs(sup[1] - P.S[1]) || 1e-6) * 180/Math.PI, dt); // arm vs vertical, deg
      const sa = m('sa', ang(P.H, P.S, sup, ar), dt);               // shoulder angle (info)
      res.dbg = { offT: off_t, armV, sa, elb, b };
      const eo = Math.abs(off_t - LIM.offC), ea = Math.abs(armV - LIM.armC);
      const bad = eo > LIM.off*K.tol || ea > LIM.arm*K.tol, stay = eo > LIM.off*K.tol*0.7 || ea > LIM.arm*K.tol*0.7;
      const key = straight ? 'shoulders_over_wrists' : 'shoulders_over_elbows';
      const on = flag('shoulders', bad, stay, dt);
      if (on) live.push(key);
    } else if (exId === 'handstand') {
      // inverted: wrists below hips, body near vertical
      if (!(P.W[1] > P.H[1] && P.H[1] > P.A[1] - 0.02) || tilt(P.W, P.A, ar) < 50) { st.F = {}; res.seg='idle'; return finish(res, 'pos'); }
      const vdev = (a, c) => Math.atan2(Math.abs((c[0]-a[0])*ar), Math.abs(c[1]-a[1]) || 1e-6) * 180/Math.PI; // deg from vertical
      const A3 = P3 && (use3 || V === 'front');                     // joint angles in 3D unless filmed in profile
      const J = (a, b, c) => A3 ? ang3(P3[a], P3[b], P3[c]) : ang(P[a], P[b], P[c], ar);
      const VD = (a, c) => use3 ? vdev3(P3[a], P3[c]) : vdev(P[a], P[c]);  // front view: 2D = sideways lean
      const elb = m('elb', J('S','E','W'), dt, 0.15);
      const sh  = m('sh',  J('H','S','E'), dt, 0.15);     // open shoulder ~180
      const hip = m('hip', J('S','H','A'), dt, 0.15);     // banana / pike
      const lean = m('lean', VD('W','A'), dt, 0.2);            // whole line vs vertical
      const segs = m('segs', Math.max(VD('W','S'), VD('S','H'), VD('H','A')), dt, 0.2);
      res.dbg = { elb, sh, hip, lean, segs };
      const R = A3 ? 8 : 0;  // 3D joint angles read ~5-8 deg more bent on straight limbs
      live.push(flag('straight_arms', elb < LIM.hsElb - R, elb < LIM.hsElb - R + 5, dt) && 'straight_arms');
      live.push(flag('open_shoulders', sh < LIM.hsSh - R, sh < LIM.hsSh - R + 5, dt) && 'open_shoulders');
      live.push(flag('no_banana', hip < LIM.hsHip - R, hip < LIM.hsHip - R + 5, dt) && 'no_banana');
      const HL = (LIM.hsLean + (V === 'd34' ? 14 : use3 ? 6 : 0)) * K.tol;  // 3/4 view has a wider fallback tolerance; hs_line itself is gated off outside profile view
      live.push(flag('hs_line', lean > HL || segs > 2*HL, lean > HL - 2 || segs > 2*HL - 4, dt) && 'hs_line');
    } else if (exId === 'lsit') {
      // seated L: hands on the floor beside the hips, hips off the ground, legs up and straight
      const onFloor = P.A[1] >= P.W[1] - 0.015 && P.H[1] >= P.W[1] - 0.06;
      if (flag('lsit_position',onFloor,onFloor,dt,0.4)) return finish(res,'ok',[],['lsit_position'],dt);
      if (!(P.H[1] < P.A[1] + 0.06) || P.W[1] < P.H[1] - 0.1) { st.F = {}; res.seg='idle'; return finish(res, 'pos'); }
      if (tilt(P.S,P.H,ar) < 25 || P.H[1] > P.W[1] + 0.08) live.push(flag('lsit_position',true,true,dt,0.4) && 'lsit_position');
      // In a profile L-sit the far leg can be projected as a short, bent limb while the near leg is straight.
      // Evaluate both visible legs and use the extended one; using only the shoulder-side leg caused false 'straighten legs'.
      const legs = ['l','r'].map(side => ({ H:side === 'l' ? P.H2 : P.H3, K:side === 'l' ? P.K2 : P.K3, A:side === 'l' ? P.A2 : P.A3,
        W:side === 'l' ? P.W2 : P.W3 }))
        .filter(q => [q.H,q.K,q.A].every(p => p && (p[3] ?? 1) >= VIS));
      const ka = q => ang(q.H,q.K,q.A,ar);
      const leg = legs.length ? legs.reduce((best,q) => ka(q) > ka(best) ? q : best, legs[0]) : P;
      const knee = m('kn', ka(leg), dt, 0.15);
      // In a true L the hips and feet are above the hands/floor line. Positive values mean sagging below it.
      const lift = m('lift', P.H[1] - P.W[1], dt, 0.15);
      const hup  = m('hup', leg.A[1] - leg.W[1], dt, 0.15);
      res.dbg = { knee, lift, hup };
      live.push(flag('legs_straight', knee < 150, knee < 158, dt) && 'legs_straight');
      live.push(flag('hips_up_ls', lift > 0.04, lift > 0.02, dt) && 'hips_up_ls');
      live.push(flag('legs_up', hup > 0.04, hup > 0.02, dt) && 'legs_up');
    } else { // hollow: lying on back, shoulders and feet lifted, slight banana
      const wrongPose = wrongHoldPose(55,55);
      const wrong = flag('not_hollow',wrongPose,wrongPose,dt,0.4);
      if (wrong) return finish(res,'ok',[],['not_hollow'],dt);
      if (wrongPose) return finish(res,'pos');
      if (tilt(P.S, P.A, ar) > 45) { st.F = {}; res.seg='idle'; return finish(res, 'pos'); }
      if (tilt(P.S,P.H,ar) > 55) live.push(flag('not_hollow',true,true,dt,0.4) && 'not_hollow');
      const footUp = m('fu', P.H[1] - P.A[1], dt), shUp = m('su', P.H[1] - P.S[1], dt);
      live.push(flag('legs_lower', b < 140, b < 146, dt) && 'legs_lower');
      live.push(flag('legs_up', footUp < 0.015, footUp < 0.025, dt) && 'legs_up');
      live.push(flag('shoulders_up', shUp < 0.005, shUp < 0.012, dt) && 'shoulders_up');
    }
    const act = gate(live, res); res.live = act;
    st.holdTotal += dt;
    if (!act.length) { st.holdGood += dt; res.seg = 'good'; if (st.cue !== 'hold') setCue('hold', tMs); }
    else { res.seg = 'bad'; setCue(FAULTS.find(k => act.includes(k)), tMs); st.faultTime = st.faultTime || {}; for (const f of act) st.faultTime[f] = (st.faultTime[f]||0) + dt; }
    return finish(res, 'ok');
  }

  // only report form checks that are valid from the current camera view
  const ALL = new Set(Object.values(CHECKS[exId] || {}).flat());
  function gate(live, res) { const ok = new Set(res.checks); if (ok.has('shoulders_over_wrists')) ok.add('shoulders_over_elbows');
    return live.filter(f => f && (!ALL.has(f) && f !== 'shoulders_over_elbows' || ok.has(f))); }
  function finish(res, status, events = [], faults = [], dt = 0) {
    if (events.length) res.events.push(...events);
    if (faults.length) { st.holdTotal += dt; st.faultTime = st.faultTime || {}; res.live = faults; res.seg = 'bad'; setCue(faults[0],st.lastT); for (const f of faults) st.faultTime[f]=(st.faultTime[f]||0)+dt; }
    res.status = status; res.reps = st.reps; res.bad = st.bad; res.attempts = st.attempts; res.phase = st.phase;
    res.holdGood = st.holdGood; res.holdTotal = st.holdTotal; res.lostT = st.lostT; res.faultTime = st.faultTime;
    res.cue = st.cue && (st.lastT - st.cueT) < 1500 ? st.cue : null;
    return res;
  }
  return { update, state: st, ex };
}
