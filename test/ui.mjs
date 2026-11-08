// Headless Chrome, synthetic camera. Not a physical iPhone.
import puppeteer from '/tmp/cf-test/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });
const PORT = 8765;
const results = [];
const fail = (name, detail) => { results.push({ name, ok: false, detail }); console.error('FAIL', name, detail); };
const ok = (name, detail) => { results.push({ name, ok: true, detail }); console.log('OK', name, detail || ''); };

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: '/workspace', stdio: 'ignore' });
await delay(400);

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--hide-scrollbars'],
});
const page = await browser.newPage();
page.on('pageerror', e => console.error('PAGE', e.message));
page.on('console', msg => { if (msg.type() === 'error') console.error('CONSOLE', msg.text()); });

await page.evaluateOnNewDocument(() => {
  window.__CF_FAST__ = true;
  const lm = () => {
    const a = Array.from({ length: 33 }, () => [0.5, 0.55, 0, 0.99]);
    const put = (i, x, y) => { a[i] = [x, y, 0, 0.99]; };
    put(0, 0.42, 0.16);
    put(11, 0.4, 0.28); put(12, 0.44, 0.28);
    put(13, 0.38, 0.4); put(14, 0.46, 0.4);
    put(15, 0.36, 0.52); put(16, 0.48, 0.52);
    put(23, 0.4, 0.58); put(24, 0.44, 0.58);
    put(25, 0.4, 0.74); put(26, 0.44, 0.74);
    put(27, 0.4, 0.9); put(28, 0.44, 0.9);
    return a;
  };
  window.__CF_MOCK_POSE__ = {
    frame() { return new Promise(res => setTimeout(() => res({ lm: lm(), wl: null }), 160)); },
  };
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext('2d');
  let n = 0;
  const draw = () => {
    n++;
    ctx.fillStyle = n % 2 ? '#101810' : '#1a2814';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#C6FF00';
    ctx.fillRect((n * 14) % 1280, 0, 18, 720);
    requestAnimationFrame(draw);
  };
  draw();
  window.__facing = 'environment';
  function videoStream() {
    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    const base = track.getSettings.bind(track);
    track.getSettings = () => ({ ...base(), width: 1280, height: 720, frameRate: 30, facingMode: window.__facing });
    return stream;
  }
  function micStream() {
    const ac = window.__micAC || (window.__micAC = new AudioContext());
    const osc = ac.createOscillator();
    const dest = ac.createMediaStreamDestination();
    osc.frequency.value = 440;
    osc.connect(dest);
    osc.start();
    ac.resume?.();
    return dest.stream;
  }
  const installGum = () => {
    if (!navigator.mediaDevices) return false;
    navigator.mediaDevices.getUserMedia = gum;
    return true;
  };
  const gum = async (c) => {
    const wantsVideo = !!(c && c.video);
    const wantsAudio = !!(c && c.audio);
    if (wantsAudio && !wantsVideo) {
      if (window.__CF_DENY_MIC__) { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; }
      return micStream();
    }
    const mode = c?.video?.facingMode?.ideal || c?.video?.facingMode || 'environment';
    window.__facing = mode === 'user' ? 'user' : 'environment';
    return videoStream();
  };
  if (!installGum()) {
    const timer = setInterval(() => { if (installGum()) clearInterval(timer); }, 20);
  }
});

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
}
function vp(w, h) { return page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); }

try {
  await vp(390, 844);
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#exList .ex');
  const home = await page.evaluate(() => ({
    h1: document.querySelector('h1').textContent,
    lang: !!document.getElementById('langBtn'),
    voice: !!document.getElementById('voiceBtn'),
    cam: !!document.getElementById('camBtn'),
    gear: !!document.getElementById('setBtn'),
    ex: document.querySelectorAll('#exList .ex').length,
    ver: document.querySelector('.ver').textContent,
  }));
  if (home.h1 !== 'Your pocket trainer' || home.lang || home.voice || home.cam || !home.gear || home.ex !== 17) fail('home', home);
  else ok('home', home);
  await shot('home-390x844');

  await vp(320, 568);
  await shot('home-320x568');
  const homeScroll = await page.evaluate(() => {
    const sc = document.getElementById('home');
    const btn = document.getElementById('startBtn');
    sc.scrollTop = sc.scrollHeight;
    const r = btn.getBoundingClientRect();
    return { scroll: sc.scrollHeight > sc.clientHeight + 20, top: r.top, bottom: r.bottom, h: innerHeight };
  });
  if (!homeScroll.scroll || homeScroll.bottom > innerHeight(homeScroll) + 40) {
    // bottom should be on screen after scroll
  }
  if (!homeScroll.scroll || homeScroll.top < 0 || homeScroll.bottom > 568 + 8) fail('home-scroll', homeScroll);
  else ok('home-scroll', homeScroll);

  await page.evaluate(() => { document.getElementById('home').scrollTop = 0; });
  await page.click('#setBtn');
  await page.waitForSelector('#sheet.show');
  await delay(400);
  await shot('settings-ru-320x568');
  await page.click('[data-set="res:1080"]');
  await page.click('[data-set="fps:60"]');
  await page.evaluate(() => document.querySelector('[data-set="res:1080"]').scrollIntoView({ block: 'center' }));
  await delay(200);
  await shot('settings-ru-quality');
  const asked = await page.evaluate(() => ({
    res: document.querySelector('[data-set="res:1080"]').classList.contains('sel'),
    fps: document.querySelector('[data-set="fps:60"]').classList.contains('sel'),
    line: document.getElementById('qNow').textContent,
  }));
  if (!asked.res || !asked.fps || !/1080p\/60/.test(asked.line)) fail('quality-request', asked);
  else ok('quality-request', asked);
  const scroll = await page.evaluate(() => {
    const body = document.getElementById('sheetBody');
    const close = document.getElementById('sheetClose');
    const panel = document.querySelector('#sheet .panel').getBoundingClientRect();
    const before = close.getBoundingClientRect();
    const can = body.scrollHeight > body.clientHeight + 20;
    body.scrollTop = body.scrollHeight;
    const closeNow = close.getBoundingClientRect();
    return {
      can, scrolled: body.scrollTop > 40, client: body.clientHeight, scrollH: body.scrollHeight,
      closeTop: closeNow.top, closeBottom: closeNow.bottom, panelTop: panel.top, panelBottom: panel.bottom,
      beforeTop: before.top, view: innerHeight,
    };
  });
  const closeVisible = scroll.closeTop >= -2 && scroll.closeBottom <= scroll.view + 2;
  if (!scroll.can || !scroll.scrolled || !closeVisible) fail('settings-scroll-320', scroll);
  else ok('settings-scroll-320', scroll);

  await vp(375, 667);
  await shot('settings-375x667');
  const scroll375 = await page.evaluate(() => {
    const body = document.getElementById('sheetBody');
    body.scrollTop = 0;
    const can = body.scrollHeight > body.clientHeight + 10;
    body.scrollTop = body.scrollHeight;
    const close = document.getElementById('sheetClose').getBoundingClientRect();
    return { can, scrolled: body.scrollTop > 20, closeBottom: close.bottom, view: innerHeight };
  });
  if (!scroll375.can || scroll375.closeBottom > scroll375.view + 2) fail('settings-scroll-375', scroll375);
  else ok('settings-scroll-375', scroll375);

  await page.click('[data-set="lang:en"]');
  const en = await page.evaluate(() => ({
    h1: document.querySelector('#home h1').textContent,
    sub: document.querySelector('.sub').textContent,
    settings: document.querySelector('#sheet h2').textContent,
    genders: [...document.querySelectorAll('[data-set^="gender:"]')].map(b => b.dataset.set),
    levels: [...document.querySelectorAll('[data-set^="level:"]')].length,
    voices: [...document.querySelectorAll('[data-set^="ru:"],[data-set^="en:"]')].length,
    strict: document.getElementById('strictNote').textContent,
  }));
  if (en.h1 !== 'Your pocket trainer' || !/clean reps/i.test(en.sub) || en.settings !== 'Settings' || en.genders.length !== 2 || en.levels || en.voices) fail('lang-en', en);
  else ok('lang-en', { genders: en.genders, strict: en.strict.slice(0, 48) });
  if (!/not perfect/i.test(en.strict)) fail('strict-copy', en.strict);
  else ok('strict-copy');
  const names = await page.evaluate(() => {
    const read = () => [...document.querySelectorAll('#exList .ex b')].map(b => b.textContent.trim());
    const enNames = read();
    document.querySelector('[data-set="lang:ru"]').click();
    const ruNames = read();
    document.querySelector('[data-set="lang:en"]').click();
    return { enNames, ruNames };
  });
  const unique = (a) => new Set(a).size === 17 && a.every(x => x && x.length > 1);
  if (!unique(names.enNames) || !unique(names.ruNames)) fail('exercises-17', names);
  else ok('exercises-17', { en: names.enNames.length, ru: names.ruNames.length });
  await page.click('#sheetClose');

  await page.evaluate(() => localStorage.setItem('cf_settings', JSON.stringify({ lang:'en', voices:{ ru:'m', en:'f' }, level:'easy', ex:'lunge', voice:true })));
  await page.reload({ waitUntil: 'networkidle0' });
  const mig = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.cf_settings);
    return { gender: window.__CF.cfg.gender, level: window.__CF.cfg.level, storedLevel: stored.level, storedVoices: stored.voices, dir: window.__CF.voiceDir(), ex: window.__CF.cfg.ex };
  });
  if (mig.gender !== 'f' || mig.level != null || mig.storedLevel != null || mig.storedVoices || mig.dir !== 'en-f' || mig.ex !== 'lunge') fail('migrate', mig);
  else ok('migrate', mig);

  await page.evaluate(() => document.getElementById('buildOpen').scrollIntoView({ block: 'center' }));
  await page.click('#buildOpen');
  await page.waitForSelector('#build.active');
  await page.select('#addPick', 'pushup');
  await page.click('#addEx');
  await page.select('#addPick', 'plank');
  await page.click('#addEx');
  await page.select('#addPick', 'squat');
  await page.click('#addEx');
  await page.click('#buildList .bitem:nth-child(3) [data-move="-1"]');
  for (let n = 0; n < 3; n++) {
    await page.click(`#buildList .bitem:nth-child(${n + 1}) [data-k="sets"][data-d="-1"]`);
    await page.click(`#buildList .bitem:nth-child(${n + 1}) [data-k="sets"][data-d="-1"]`);
  }
  await shot('builder-390');
  const built = await page.evaluate(() => window.__CF.routine.items.map(i => i.ex));
  if (built.join() !== 'pushup,squat,plank') fail('builder-order', built);
  else ok('builder-order', built);
  await page.reload({ waitUntil: 'networkidle0' });
  const kept = await page.evaluate(() => JSON.parse(localStorage.cf_routine).items.map(i => i.ex));
  if (kept.join() !== 'pushup,squat,plank') fail('builder-persist', kept);
  else ok('builder-persist', kept);

  await vp(390, 844);
  await page.evaluate(() => { window.__CF.cfg.camRes = '1080'; window.__CF.cfg.camFps = 60; });
  await page.evaluate(() => document.getElementById('buildOpen').scrollIntoView({ block: 'center' }));
  await page.click('#buildOpen');
  await page.click('#startRoutine');
  await page.waitForSelector('#tip.show');
  await delay(400);
  await shot('setup-pushup');
  const setup = await page.evaluate(() => {
    const svg = document.querySelector('#tipBody svg');
    return { view: svg?.getAttribute('data-view'), label: svg?.getAttribute('aria-label'), title: document.getElementById('tipTitle').textContent };
  });
  if (setup.view !== 'side' || !/push/i.test(setup.title)) fail('setup', setup);
  else ok('setup', setup);

  await page.click('#tipGo');
  await page.waitForSelector('#calib.show', { timeout: 12000 });
  await delay(300);
  await shot('workout-calib');
  await page.waitForFunction(() => window.__CF.debug.phase === 'active', { timeout: 8000 });
  await delay(250);
  await shot('workout-active');
  const active = await page.evaluate(() => ({
    phase: window.__CF.debug.phase,
    calib: document.getElementById('calib').classList.contains('show'),
    num: document.getElementById('cNum').textContent,
    chip: document.getElementById('qChip').textContent,
    ex: document.getElementById('statEx').textContent,
  }));
  if (active.phase !== 'active' || active.calib) fail('active', active);
  else ok('active', active);
  if (!/1080p\/60/.test(active.chip) || !/1280×720/.test(active.chip) || !/30 fps/.test(active.chip)) fail('quality-actual', active);
  else ok('quality-actual', active.chip);
  const hud = await page.evaluate(() => {
    const box = el => { const r = el.getBoundingClientRect(); return { top:r.top, right:r.right, bottom:r.bottom, left:r.left, w:r.width, h:r.height }; };
    const rec = box(document.getElementById('recBtn'));
    const mute = box(document.getElementById('muteBtn'));
    const cam = box(document.getElementById('camSeg'));
    const panels = document.querySelectorAll('.statpanel').length;
    const dbg = document.getElementById('dbgOut').textContent;
    const ex = document.getElementById('statEx').textContent;
    const set = document.getElementById('statSet').textContent;
    return {
      rec, mute, cam, panels, dbg, ex, set, w: innerWidth,
      viewChip: !!document.getElementById('viewChip'),
      labels: { rec: document.getElementById('recBtn').getAttribute('aria-label'), mute: document.getElementById('muteBtn').getAttribute('aria-label') },
    };
  });
  if (hud.panels !== 1 || hud.dbg || hud.viewChip || !(hud.rec.right > hud.w * 0.72) || !(hud.mute.right > hud.w * 0.72) || !(hud.rec.top < 90) || !(hud.mute.top < 90) || !(hud.cam.top < 90)) fail('hud', hud);
  else ok('hud', { ex: hud.ex, set: hud.set, recRight: Math.round(hud.rec.right), muteRight: Math.round(hud.mute.right) });

  await page.click('#recBtn');
  await delay(400);
  await page.evaluate(() => { for (let i = 0; i < 6; i++) window.__CF.tone('good'); });
  await delay(1400);
  const mid = await page.evaluate(() => window.__CF.stats());
  await page.click('#camFront');
  await delay(400);
  const switched = await page.evaluate(() => ({
    front: document.getElementById('camFront').getAttribute('aria-pressed'),
    facing: window.__facing,
    rec: window.__CF.stats().recording,
  }));
  await page.click('#recBtn');
  await page.waitForSelector('#saveDlg.show', { timeout: 8000 });
  await delay(400);
  await shot('save-dialog');
  const after = await page.evaluate(() => window.__CF.stats());
  const dlg = await page.evaluate(() => ({
    note: document.getElementById('saveNote').textContent,
    meta: document.getElementById('saveMeta').textContent,
  }));
  const recFps = after.clips[0]?.fps || mid.recording?.fps || 0;
  const poseFps = mid.poseFps || 0;
  if (!(recFps > 15 && (poseFps === 0 || recFps > poseFps * 1.5))) fail('cadence', { recFps, poseFps, mid, after });
  else ok('cadence', { recFps, poseFps, poseMs: mid.poseMs, clip: after.clips[0] });
  if (switched.front !== 'true' || switched.facing !== 'user' || !switched.rec) fail('front-switch', switched);
  else ok('front-switch', { facing: switched.facing, frames: switched.rec.frames });
  if (!/microphone|микрофон/i.test(dlg.note) || !/Files|Файлы|Photos|Фото/i.test(dlg.note)) fail('save-copy', dlg);
  else ok('save-copy', dlg.meta);

  const file = await page.evaluate(async () => {
    const clip = window.__CF.clips[0];
    const buf = await clip.blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return { b64: btoa(s), type: clip.blob.type, meta: { w: clip.w, h: clip.h, fps: clip.fps, frames: clip.frames, audio: clip.audio, mic: clip.mic, elapsed: clip.elapsed } };
  });
  writeFileSync(`${OUT}/recording-sample.webm`, Buffer.from(file.b64, 'base64'));
  writeFileSync(`${OUT}/recording-meta.json`, JSON.stringify({ syntheticCamera: true, physicalIphone: false, ...file.meta, type: file.type }, null, 2));
  ok('clip-file', file.meta);

  const beforeEmpty = await page.evaluate(() => window.__CF.clips.length);
  await page.evaluate(() => document.getElementById('saveClose').click());
  await page.waitForFunction(() => !document.getElementById('saveDlg').classList.contains('show'));
  await page.evaluate(() => { window.__CF_DENY_MIC__ = true; });
  await page.evaluate(() => document.getElementById('recBtn').click());
  try {
    await page.waitForFunction(() => (window.__CF.stats().recording?.frames || 0) > 8, { timeout: 5000 });
  } catch (e) {
    const dbg = await page.evaluate(() => ({ debug: window.__CF.debug, stats: window.__CF.stats(), deny: window.__CF_DENY_MIC__ }));
    fail('denied-frames', dbg);
  }
  await delay(900);
  await page.evaluate(() => document.getElementById('toast').classList.remove('show'));
  await page.evaluate(() => document.getElementById('recBtn').click());
  await page.waitForFunction(() => document.getElementById('saveDlg').classList.contains('show') || document.getElementById('toast').classList.contains('show'), { timeout: 8000 });
  const denied = await page.evaluate(() => {
    const clips = window.__CF.clips;
    const last = clips[clips.length - 1];
    return {
      n: clips.length, mic: last?.mic, open: document.getElementById('saveDlg').classList.contains('show'),
      note: document.getElementById('saveNote').textContent,
      toast: document.getElementById('toast').textContent, empty: window.__CF_LAST_EMPTY || null,
      first: clips[0]?.blob?.size || 0,
    };
  });
  if (denied.n < beforeEmpty || denied.mic !== 'denied' || !denied.open || !/denied|запрещ|нет|No microphone/i.test(denied.note) || !(denied.first > 1000)) fail('denied-mic', denied);
  else ok('denied-mic', { n: denied.n, mic: denied.mic, first: denied.first });
  await page.evaluate(() => { if (document.getElementById('saveDlg').classList.contains('show')) document.getElementById('saveClose').click(); });

  await page.evaluate(() => window.__CF.completeSetForTest());
  await page.waitForSelector('#rest.show', { timeout: 5000 });
  const rest = await page.$eval('#restNext', el => el.textContent);
  if (!/squat|присед/i.test(rest)) fail('routine-next', rest);
  else ok('routine-next', rest);
  await page.evaluate(() => history.back());
  await delay(300);
  const paused = await page.evaluate(() => document.getElementById('pause').classList.contains('show'));
  if (!paused) fail('back', { paused });
  else ok('back');
  await page.click('#pauseStay');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get() { return 'hidden'; } });
    Object.defineProperty(document, 'hidden', { configurable: true, get() { return true; } });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await delay(200);
  const hiddenPause = await page.evaluate(() => document.getElementById('pause').classList.contains('show'));
  if (!hiddenPause) fail('visibility', { hiddenPause });
  else ok('visibility');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get() { return 'visible'; } });
    Object.defineProperty(document, 'hidden', { configurable: true, get() { return false; } });
  });
  await page.click('#pauseStay');
  await page.click('#restSkip');
  await page.waitForSelector('#tip.show');
  const nextTip = await page.$eval('#tipTitle', el => el.textContent);
  if (!/squat|присед/i.test(nextTip)) fail('next-setup', nextTip);
  else ok('next-setup', nextTip);
  await shot('setup-next');
  await page.click('#tipGo');
  await page.waitForFunction(() => window.__CF.completeSetForTest(), { timeout: 8000 });
  await page.waitForSelector('#rest.show', { timeout: 5000 });
  await page.click('#restSkip');
  await page.waitForSelector('#tip.show');
  await page.click('#tipGo');
  await page.waitForFunction(() => window.__CF.completeSetForTest(), { timeout: 8000 });
  await page.waitForSelector('#sum.active', { timeout: 8000 });
  await shot('summary-routine');
  const hist = await page.evaluate(() => JSON.parse(localStorage.cf_history || '[]').map(x => x.ex));
  if (hist.join() !== 'pushup,squat,plank') fail('history', hist);
  else ok('history', hist);
} catch (e) {
  console.error('UNCAUGHT', e);
  try { await shot('failure'); } catch {}
  fail('uncaught', String(e.stack || e));
} finally {
  writeFileSync(`${OUT}/ui-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
  server.kill();
}

function innerHeight(o) { return o.h; }
function documentOpen() { return true; }
const bad = results.filter(r => !r.ok);
if (bad.length) {
  console.error(JSON.stringify(bad, null, 2));
  process.exit(1);
}
console.log('UI PASS', results.length);
