import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSettings, videoConstraints, qualityReport, emptyClip, rateFromStamps, EX_IDS } from '../settings.js';
import { sanitizeRoutine, moveItem, afterSet, summarize } from '../routine.js';
import { createFeedbackGate } from '../feedback.js';

const isHold = ex => ['plank','hollow','lsit','handstand','frontlever','backlever','planchelean'].includes(ex);
const known = new Set(['pushup','pullup','squat','dip','row','lunge','plank','hollow','lsit','handstand','muscleup','frontlever','backlever','planchelean','hanginglegraise','pistolsquat','pikepushup']);

test('voice and level storage migrates to one gender and no difficulty', () => {
  const ru = migrateSettings({ lang:'ru', voices:{ ru:'f', en:'m' }, level:'easy', ex:'squat', voice:true });
  assert.equal(ru.gender, 'f');
  assert.equal(ru.level, undefined);
  assert.equal(ru.ex, 'squat');
  const en = migrateSettings({ lang:'en', voices:{ ru:'m', en:'f' }, level:'hard' });
  assert.equal(en.gender, 'f');
  const agree = migrateSettings({ lang:'en', voices:{ ru:'m', en:'m' } });
  assert.equal(agree.gender, 'm');
  const kept = migrateSettings({ gender:'f', voices:{ ru:'m', en:'m' }, level:'easy' });
  assert.equal(kept.gender, 'f');
  assert.equal(kept.camRes, '720');
  assert.equal(kept.camFps, 30);
  assert.equal(Object.keys(kept.targets).length, 17);
});

test('all 17 exercises survive settings migration', () => {
  assert.equal(EX_IDS.length, 17);
  const cfg = migrateSettings({});
  assert.equal(Object.keys(cfg.targets).length, 17);
  for (const id of EX_IDS) assert.ok(cfg.targets[id] > 0, id);
});

test('camera constraints ask for a size and do not pretend to copy the Camera app', () => {
  const c = videoConstraints({ front:true, res:'1080', fps:60 });
  assert.equal(c.facingMode.ideal, 'user');
  assert.equal(c.width.ideal, 1920);
  assert.equal(c.height.ideal, 1080);
  assert.equal(c.frameRate.ideal, 60);
  assert.equal(c.width.max, undefined);
  const got = qualityReport({ width:1280, height:720, frameRate:30 }, { res:'1080', fps:60 });
  assert.equal(got.fallback, true);
  assert.equal(got.label, '1280×720 · 30 fps');
  const ok = qualityReport({ width:1920, height:1080, frameRate:60 }, { res:'1080', fps:60 });
  assert.equal(ok.fallback, false);
  const portrait = qualityReport({ width:720, height:1280, frameRate:30 }, { res:'720', fps:30 });
  assert.equal(portrait.fallback, false);
});

test('routine order, rest and summary', () => {
  const r = sanitizeRoutine({ items:[
    { ex:'pushup', sets:2, target:8, rest:30 },
    { ex:'not-real', sets:1, target:1, rest:10 },
    { ex:'plank', sets:1, target:20, rest:0 },
  ]}, { known, isHold });
  assert.equal(r.items.length, 2);
  assert.equal(r.items[1].ex, 'plank');
  const moved = moveItem(r.items, 0, 1);
  assert.equal(moved[0].ex, 'plank');
  assert.equal(moved[1].ex, 'pushup');
  let step = afterSet({ items: r.items, index: 0, setsDone: 1 });
  assert.equal(step.action, 'rest');
  assert.equal(step.then, 'set');
  assert.equal(step.setNo, 2);
  step = afterSet({ items: r.items, index: 0, setsDone: 2 });
  assert.equal(step.then, 'exercise');
  assert.equal(step.item.ex, 'plank');
  assert.equal(step.rest, 30);
  step = afterSet({ items: r.items, index: 1, setsDone: 1 });
  assert.equal(step.action, 'done');
  const sum = summarize([
    { ex:'pushup', block:0, n:8, bad:1, tech:89, secs:20, attempts:['g','r'], goal:true, hold:false },
    { ex:'pushup', block:0, n:6, bad:0, tech:100, secs:18, attempts:['g'], goal:false, hold:false },
    { ex:'plank', block:1, n:20, bad:2, tech:91, secs:22, attempts:[], goal:true, hold:true },
  ]);
  assert.equal(sum.blocks.length, 2);
  assert.equal(sum.blocks[0].n, 14);
  assert.equal(sum.mixed, true);
  assert.equal(sum.blocks[1].hold, true);
});

test('an error is spoken once per episode and not while the person is lost', () => {
  const bad = new Set(['hips_sag','deeper']);
  const g = createFeedbackGate(k => bad.has(k));
  const speeches = [];
  const tones = [];
  const frames = [];
  for (let i = 0; i < 40; i++) frames.push({ now:i * 50, status:'ok', cue:'hips_sag', events:[] });
  // flicker off for 200ms then back
  for (let i = 0; i < 4; i++) frames.push({ now:2000 + i * 50, status:'ok', cue:null, events:[] });
  for (let i = 0; i < 10; i++) frames.push({ now:2200 + i * 50, status:'ok', cue:'hips_sag', events:[] });
  // sustained correction
  for (let i = 0; i < 20; i++) frames.push({ now:3000 + i * 50, status:'ok', cue:null, events:[] });
  frames.push({ now:4100, status:'ok', cue:'hips_sag', events:[] });
  // lost must not be labeled wrong even if a stale cue is passed
  frames.push({ now:4200, status:'lost', cue:'hips_sag', events:[] });
  frames.push({ now:5000, status:'ok', cue:null, events:[{ clean:false, reason:'deeper' }] });
  frames.push({ now:5600, status:'ok', cue:null, events:[{ clean:true, n:1 }] });
  for (const f of frames) {
    const d = g.step(f);
    if (d.speech) speeches.push(d.speech);
    if (d.tone) tones.push(d.tone);
    if (f.status === 'lost') assert.ok(d.visual !== 'hips_sag');
  }
  assert.deepEqual(speeches.filter(s => s === 'hips_sag'), ['hips_sag', 'hips_sag']);
  assert.ok(speeches.includes('deeper'));
  assert.ok(tones.includes('good'));
  assert.ok(tones.filter(x => x === 'bad').length < 8);
  assert.equal(emptyClip({ size:100, elapsed:2000, frames:10 }), true);
  assert.equal(emptyClip({ size:5000, elapsed:1200, frames:20 }), false);
  const fps = rateFromStamps(0, 1000, 31);
  assert.ok(Math.abs(fps - 30) < 0.01);
});
