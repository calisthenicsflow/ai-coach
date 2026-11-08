// Stored easy/normal/hard and the four language-specific voices are migrated once.
import { EXERCISES } from './engine.js';

export const EX_IDS = Object.keys(EXERCISES);
const DEFAULT_TARGETS = { pushup:20, pullup:10, squat:20, dip:15, plank:60, hollow:30, handstand:30, lsit:20, row:15, lunge:20, muscleup:5, frontlever:10, backlever:10, planchelean:20, hanginglegraise:10, pistolsquat:6, pikepushup:10 };

function num(v, d, lo, hi) { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; }

export function migrateSettings(raw) {
  const S = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  let gender = 'm';
  if (S.gender === 'f' || S.gender === 'm') gender = S.gender;
  else if (S.voices && typeof S.voices === 'object') {
    const ru = S.voices.ru, en = S.voices.en;
    const prefer = S.lang === 'en' ? en : ru;
    gender = prefer === 'f' || prefer === 'm' ? prefer : (ru === 'f' || ru === 'm' ? ru : (en === 'f' || en === 'm' ? en : 'm'));
  }
  const targets = {};
  const srcT = S.targets && typeof S.targets === 'object' && !Array.isArray(S.targets) ? S.targets : {};
  for (const id of EX_IDS) targets[id] = num(srcT[id], DEFAULT_TARGETS[id] ?? 10, EXERCISES[id].kind === 'hold' ? 10 : 1, EXERCISES[id].kind === 'hold' ? 600 : 200);
  const sets = {};
  const srcS = S.sets && typeof S.sets === 'object' && !Array.isArray(S.sets) ? S.sets : {};
  for (const id of EX_IDS) if (srcS[id] != null) sets[id] = num(srcS[id], 1, 1, 10);
  return {
    lang: S.lang === 'en' ? 'en' : 'ru',
    ex: EXERCISES[S.ex] ? S.ex : 'pushup',
    voice: S.voice !== false,
    front: !!S.front,
    gender,
    debug: !!S.debug,
    model: S.model === 'lite' || S.model === 'heavy' ? S.model : 'full',
    noFb: !!S.noFb,
    rest: num(S.rest, 60, 0, 300),
    targets, sets,
    camRes: S.camRes === '1080' ? '1080' : '720',
    camFps: Number(S.camFps) === 60 ? 60 : 30,
    recOverlay: S.recOverlay !== false,
  };
}

export function videoConstraints({ front, res, fps }) {
  const height = res === '1080' ? 1080 : 720;
  const width = res === '1080' ? 1920 : 1280;
  const frameRate = Number(fps) === 60 ? 60 : 30;
  return {
    facingMode: { ideal: front ? 'user' : 'environment' },
    width: { ideal: width },
    height: { ideal: height },
    frameRate: { ideal: frameRate },
  };
}

export function qualityReport(settings, asked) {
  const w = Number(settings?.width) || 0;
  const h = Number(settings?.height) || 0;
  const fps = Number(settings?.frameRate) || 0;
  const wantShort = asked?.res === '1080' ? 1080 : 720;
  const wantFps = Number(asked?.fps) === 60 ? 60 : 30;
  const short = w && h ? Math.min(w, h) : 0;
  const resOk = short >= wantShort - 80;
  const fpsOk = !fps || fps >= wantFps - 5;
  const label = w && h ? `${w}×${h} · ${fps ? Math.round(fps) : '—'} fps` : '';
  return {
    width: w, height: h, fps: fps ? Math.round(fps) : 0,
    askedRes: asked?.res === '1080' ? '1080' : '720',
    askedFps: wantFps,
    fallback: !(resOk && fpsOk),
    label,
  };
}

export function emptyClip({ size = 0, elapsed = 0, frames = 0 } = {}) {
  return size < 800 || elapsed < 350 || frames < 2;
}

export function rateFromStamps(first, last, frames) {
  if (!(frames >= 2) || first == null || last == null || !(last > first)) return 0;
  return (frames - 1) / ((last - first) / 1000);
}
