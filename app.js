import { createEngine, visibility, EXERCISES, L } from './engine.js';

/* ---------- i18n ---------- */
const T = {
  ru: { title:'AI-тренер', subtitle:'Считает только чистые повторы. Видео не покидает телефон.', target:'Цель', voice:'Голос', camFront:'Фронтальная камера', camBack:'Основная камера',
    start:'Начать', finish:'Завершить', loading:'Загружаю модель…', technique:'Техника', uncounted:'Не засчитано', uncountedSub:'неглубоко, не до конца или ошибка формы',
    streak:'Серия', streakSub:'дней подряд', time:'Время', timeSub:'вся тренировка', clean:'чисто', error:'ошибка', share:'Поделиться', again:'Ещё раз', home:'На главную',
    of:'из', sec:'сек', reps:'повт.', goalDone:'Цель выполнена', done:'Тренировка завершена', go:'Начали!', streakHome:n=>`Серия: ${n} дн. подряд`,
    techWord:p=>p>=90?'Отлично':p>=70?'Хорошо':'Есть над чем работать',
    parts:{s:'плечи',e:'локти',w:'кисти',h:'таз',k:'колени',a:'стопы'},
    ex:{pushup:['Отжимания','отжиманий'],pullup:['Подтягивания','подтягиваний'],squat:['Приседания','приседаний'],dip:['Брусья','отжиманий на брусьях'],plank:['Планка','сек в планке'],hollow:['Hollow body','сек в hollow']},
    exSub:{pushup:'сбоку, телефон на полу',pullup:'сбоку или спереди',squat:'сбоку, во весь рост',dip:'сбоку, во весь рост',plank:'удержание, линия тела',hollow:'удержание, лодочка'},
    hint:{pushup:'Телефон на полу <b>сбоку</b>, 1,5–2 м. Если не помещаешься — положи его горизонтально.',pullup:'Поставь телефон в 2–3 м, чтобы были видны перекладина и руки.',
      squat:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.',dip:'Телефон <b>сбоку</b> в 2–3 м, видно плечи, локти и таз.',plank:'Телефон на полу <b>сбоку</b>, 1,5–2 м.',hollow:'Телефон на полу <b>сбоку</b>, 1,5–2 м, лёжа на спине.'},
    cue:{clean:'Чисто!',go_lower:'Ниже!',higher:'Выше!',lockout:'Выпрями руки',hips_up:'Подними таз',hips_down:'Опусти таз',chest_up:'Грудь вверх',hold:'Держи',legs_up:'Ноги выше',legs_lower:'Ноги ниже',shoulders_up:'Плечи от пола',lost:'Не вижу тебя',pos:'Займи позицию'},
    say:{halfway:'Половина',last:'Последний!',done:'Готово!',summary:(n,p,b)=>`${n} чистых. Техника ${p} процентов.${b?` Не засчитано: ${b}.`:''}`},
  },
  en: { title:'AI Coach', subtitle:'Counts only clean reps. Video never leaves your phone.', target:'Target', voice:'Voice', camFront:'Front camera', camBack:'Back camera',
    start:'Start', finish:'Finish', loading:'Loading model…', technique:'Technique', uncounted:'Not counted', uncountedSub:'too shallow, no lockout or form error',
    streak:'Streak', streakSub:'days in a row', time:'Time', timeSub:'whole workout', clean:'clean', error:'error', share:'Share', again:'Again', home:'Home',
    of:'of', sec:'sec', reps:'reps', goalDone:'Goal complete', done:'Workout complete', go:'Go!', streakHome:n=>`Streak: ${n} day${n>1?'s':''} in a row`,
    techWord:p=>p>=90?'Excellent':p>=70?'Good':'Room to improve',
    parts:{s:'shoulders',e:'elbows',w:'wrists',h:'hips',k:'knees',a:'feet'},
    ex:{pushup:['Push-ups','push-ups'],pullup:['Pull-ups','pull-ups'],squat:['Squats','squats'],dip:['Dips','dips'],plank:['Plank','sec plank'],hollow:['Hollow body','sec hollow']},
    exSub:{pushup:'side view, phone on floor',pullup:'side or front view',squat:'side view, full body',dip:'side view, full body',plank:'hold, body line',hollow:'hold, banana shape'},
    hint:{pushup:'Phone on the floor, <b>side view</b>, 1.5–2 m away. If you don\'t fit, turn it landscape.',pullup:'Place the phone 2–3 m away so the bar and your arms are visible.',
      squat:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.',dip:'Phone <b>side view</b>, 2–3 m, shoulders, elbows and hips visible.',plank:'Phone on the floor, <b>side view</b>, 1.5–2 m.',hollow:'Phone on the floor, <b>side view</b>, 1.5–2 m, lying on your back.'},
    cue:{clean:'Clean!',go_lower:'Go lower',higher:'Chin over bar',lockout:'Full extension',hips_up:'Hips up',hips_down:'Hips down',chest_up:'Chest up',hold:'Hold',legs_up:'Legs up',legs_lower:'Legs lower',shoulders_up:'Shoulders up',lost:'Can\'t see you',pos:'Get in position'},
    say:{halfway:'Halfway',last:'Last one!',done:'Done!',summary:(n,p,b)=>`${n} clean reps. Technique ${p} percent.${b?` ${b} not counted.`:''}`},
  }
};
const EX_ORDER = ['pushup','pullup','squat','dip','plank','hollow'];
const BAD_CUES = new Set(['go_lower','higher','lockout','hips_up','hips_down','chest_up','legs_up','legs_lower','shoulders_up']);

const $ = id => document.getElementById(id);
const S = JSON.parse(localStorage.getItem('cf_settings') || '{}');
const cfg = { lang: S.lang || 'ru', ex: S.ex || 'pushup', voice: S.voice ?? true, front: S.front ?? false, targets: S.targets || { pushup:20, pullup:10, squat:20, dip:15, plank:60, hollow:30 } };
const save = () => localStorage.setItem('cf_settings', JSON.stringify(cfg));
const t = () => T[cfg.lang];
const isHold = () => EXERCISES[cfg.ex].kind === 'hold';

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function applyLang() {
  document.documentElement.lang = cfg.lang;
  document.querySelectorAll('[data-i]').forEach(el => { const v = t()[el.dataset.i]; if (typeof v === 'string') el.textContent = v; });
  $('langBtn').textContent = cfg.lang === 'ru' ? 'EN' : 'RU';
  $('camBtn').textContent = cfg.front ? t().camFront : t().camBack;
  $('voiceBtn').classList.toggle('on', cfg.voice);
  renderEx(); renderTarget(); renderStreak();
}
function renderEx() {
  $('exList').innerHTML = EX_ORDER.map(k => `<button class="ex ${k===cfg.ex?'sel':''}" data-k="${k}"><b>${t().ex[k][0]}</b><span>${t().exSub[k]}</span></button>`).join('');
  $('exList').querySelectorAll('.ex').forEach(b => b.onclick = () => { cfg.ex = b.dataset.k; save(); renderEx(); renderTarget(); });
}
function renderTarget() { $('tVal').textContent = cfg.targets[cfg.ex]; $('tUnit').textContent = isHold() ? t().sec : t().reps; }
function step(d) { const v = cfg.targets[cfg.ex] + d * (isHold() ? 10 : 1); cfg.targets[cfg.ex] = Math.max(isHold()?10:1, Math.min(isHold()?600:200, v)); save(); renderTarget(); }

/* ---------- streak ---------- */
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
function getStreak() {
  const days = new Set(JSON.parse(localStorage.getItem('cf_days') || '[]'));
  let n = 0, d = new Date(); if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function markToday() { const a = new Set(JSON.parse(localStorage.getItem('cf_days') || '[]')); a.add(dayKey()); localStorage.setItem('cf_days', JSON.stringify([...a].slice(-400))); }
function renderStreak() { const n = getStreak(); $('homeStreak').textContent = n ? t().streakHome(n) : ''; }

/* ---------- voice ---------- */
let voiceOn = true;
function speak(text, { interrupt = false } = {}) {
  if (!cfg.voice || !voiceOn || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(String(text));
  u.lang = cfg.lang === 'ru' ? 'ru-RU' : 'en-US'; u.rate = 1.05;
  const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(cfg.lang)); if (v) u.voice = v;
  if (interrupt) speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function unlockSpeech() { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch {} }

/* ---------- pose model ---------- */
let landmarker = null;
async function loadModel() {
  if (landmarker) return landmarker;
  const { FilesetResolver, PoseLandmarker } = await import('./mp/vision_bundle.mjs');
  const fs = await FilesetResolver.forVisionTasks(new URL('./mp', location.href).href);
  const mk = delegate => PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: './mp/pose_landmarker_full.task', delegate }, runningMode: 'VIDEO', numPoses: 1,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
  try { landmarker = await mk('GPU'); } catch (e) { console.warn('GPU failed, CPU', e); landmarker = await mk('CPU'); }
  return landmarker;
}

/* ---------- workout ---------- */
const cv = $('cv'), ctx = cv.getContext('2d'), vid = $('vid');
let stream = null, raf = 0, W = null, wakeLock = null;

async function startWorkout() {
  unlockSpeech(); voiceOn = true; $('muteBtn').textContent = '🔊';
  show('work'); $('loading').classList.add('show');
  $('cue').className = 'cue'; $('dots').innerHTML = ''; $('barFill').style.width = '0';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: cfg.front ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
    vid.srcObject = stream; await vid.play();
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
    await loadModel();
  } catch (e) {
    $('loading').querySelector('p').textContent = (cfg.lang==='ru' ? 'Нет доступа к камере или модели: ' : 'Camera/model unavailable: ') + (e.message || e);
    return;
  }
  $('loading').classList.remove('show');
  const target = cfg.targets[cfg.ex];
  W = { ex: cfg.ex, target, phase: 'calib', okSince: 0, engine: null, t0: 0, lastCue: null, lastCueSpoken: 0, said: {}, lastVideoT: -1, holdSpoken: 0, finished: false, attempts: [] };
  $('cNum').textContent = '0'; $('cOf').textContent = `${t().of} ${target}${isHold() ? ' ' + t().sec : ''}`;
  $('calib').classList.add('show'); $('hint').innerHTML = t().hint[cfg.ex];
  const need = EXERCISES[cfg.ex].need;
  $('parts').innerHTML = need.map(k => `<span data-p="${k}">${t().parts[k]}</span>`).join('');
  loop();
}

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== innerWidth * dpr || cv.height !== innerHeight * dpr) { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
}
function coverMap() { // map normalized video coords to canvas pixels (object-fit: cover, mirrored for selfie)
  const vw = vid.videoWidth, vh = vid.videoHeight, cw = cv.width, ch = cv.height;
  const s = Math.max(cw / vw, ch / vh), dw = vw * s, dh = vh * s, ox = (cw - dw) / 2, oy = (ch - dh) / 2;
  return { s, dw, dh, ox, oy, mirror: cfg.front, x: nx => cfg.front ? cw - (ox + nx * dw) : ox + nx * dw, y: ny => oy + ny * dh };
}

const COLORS = { good: '#C6FF00', warn: '#FFC23A', bad: '#FF4D5E', idle: 'rgba(244,244,238,.55)', lost: 'rgba(244,244,238,.35)' };
const BONES = [[11,13],[13,15],[12,14],[14,16],[11,12],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];

function draw(lm, color, angle) {
  resize(); const m = coverMap(); const { dw, dh, ox, oy } = m;
  ctx.save(); if (m.mirror) { ctx.translate(cv.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(vid, ox, oy, dw, dh); ctx.restore();
  if (!lm) return;
  const dpr = cv.width / innerWidth;
  ctx.lineCap = 'round'; ctx.lineWidth = 5 * dpr; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12 * dpr;
  for (const [a, b] of BONES) { const p = lm[a], q = lm[b]; if (p[3] < 0.4 || q[3] < 0.4) continue;
    ctx.beginPath(); ctx.moveTo(m.x(p[0]), m.y(p[1])); ctx.lineTo(m.x(q[0]), m.y(q[1])); ctx.stroke(); }
  ctx.shadowBlur = 0; ctx.fillStyle = '#060706';
  for (const i of [11,12,13,14,15,16,23,24,25,26,27,28]) { const p = lm[i]; if (p[3] < 0.4) continue;
    ctx.beginPath(); ctx.arc(m.x(p[0]), m.y(p[1]), 5 * dpr, 0, 7); ctx.fill(); ctx.lineWidth = 2.5 * dpr; ctx.stroke(); }
  if (angle != null) { // joint angle label at primary joint
    const ex = EXERCISES[W.ex]; const left = lm[11][3] + lm[13][3] >= lm[12][3] + lm[14][3];
    const j = ex.primary === 'knee' ? (left ? 25 : 26) : (left ? 13 : 14); const p = lm[j];
    ctx.font = `800 ${15 * dpr}px Montserrat`; ctx.fillStyle = '#F4F4EE'; ctx.fillText(Math.round(angle) + '°', m.x(p[0]) + 12 * dpr, m.y(p[1]) + 5 * dpr);
  }
}

function toEngineLm(res) { const p = res.landmarks && res.landmarks[0]; return p ? p.map(q => [q.x, q.y, q.z, q.visibility ?? 1]) : null; }

function loop() {
  raf = requestAnimationFrame(loop);
  if (!W || vid.readyState < 2) return;
  const now = performance.now();
  if (vid.currentTime === W.lastVideoT) return; W.lastVideoT = vid.currentTime;
  window.__f = (window.__f||0) + 1;
  let lm = null; try { lm = toEngineLm(landmarker.detectForVideo(vid, now)); } catch (e) { console.warn(e); }
  if (W.phase === 'calib') return calib(lm, now);
  if (W.phase === 'count') { draw(lm, COLORS.idle); return; }
  const r = W.engine.update(lm, now);
  const color = r.status === 'lost' ? COLORS.lost : r.status === 'pos' ? COLORS.idle : (r.cue && BAD_CUES.has(r.cue) ? (r.seg === 'warn' ? COLORS.warn : COLORS.bad) : COLORS[r.seg] || COLORS.good);
  draw(lm, color, r.angle);
  handle(r, now);
}

function calib(lm, now) {
  draw(lm, COLORS.idle);
  const vis = visibility(lm); const need = EXERCISES[W.ex].need;
  document.querySelectorAll('#parts span').forEach(s => s.classList.toggle('ok', !!vis[s.dataset.p]));
  const all = need.every(k => vis[k]);
  if (!all) W.okSince = 0; else if (!W.okSince) W.okSince = now;
  const prog = all ? Math.min(1, (now - W.okSince) / 1200) : need.filter(k => vis[k]).length / need.length * 0.6;
  $('ringFg').style.strokeDashoffset = String(107 * (1 - prog));
  if (all && now - W.okSince > 1200) countdown();
}

function countdown() {
  W.phase = 'count'; $('calib').classList.remove('show');
  const big = $('big'); let n = 3; const name = t().ex[W.ex][0];
  const tick = () => {
    if (!W) return;
    if (n > 0) { big.innerHTML = `<small>${name}</small>${n}`; big.classList.add('show'); speak(n, { interrupt: true }); n--; setTimeout(tick, 1000); }
    else { big.innerHTML = `<small>${name}</small><span style="font-size:56px">${t().go}</span>`; speak(t().go, { interrupt: true });
      setTimeout(() => big.classList.remove('show'), 700);
      W.engine = createEngine(W.ex, { aspect: vid.videoWidth / vid.videoHeight }); W.t0 = performance.now(); W.phase = 'active'; }
  };
  tick();
}

function showCue(c, kind) { const el = $('cue'); el.textContent = t().cue[c] || c; el.className = 'cue show ' + kind; clearTimeout(showCue.t); showCue.t = setTimeout(() => el.classList.remove('show'), 1300); }

function handle(r, now) {
  const hold = EXERCISES[W.ex].kind === 'hold';
  for (const e of r.events) {
    W.attempts.push(e.clean ? 'g' : 'r');
    const d = document.createElement('i'); d.className = e.clean ? 'g' : 'r'; $('dots').appendChild(d);
    if (e.clean) {
      $('cNum').textContent = r.reps; const p = $('plus'); p.classList.remove('go'); void p.offsetWidth; p.classList.add('go');
      const c = document.querySelector('.counter'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
      showCue('clean', '');
      if (r.reps === W.target) { speak(t().say.done, { interrupt: true }); return finish(true); }
      if (r.reps === Math.ceil(W.target / 2) && W.target >= 6) speak(`${r.reps}. ${t().say.halfway}`, { interrupt: true });
      else if (r.reps === W.target - 1 && W.target > 3) speak(`${r.reps}. ${t().say.last}`, { interrupt: true });
      else speak(r.reps, { interrupt: true });
    } else { showCue(e.reason, 'bad'); speak(t().cue[e.reason], { interrupt: true }); W.lastCueSpoken = now; }
  }
  // live form cues (not tied to a finished rep)
  if (r.cue && BAD_CUES.has(r.cue) && !r.events.length) {
    showCue(r.cue, r.seg === 'warn' ? 'warn' : 'bad');
    if (now - W.lastCueSpoken > 2500) { speak(t().cue[r.cue], { interrupt: true }); W.lastCueSpoken = now; }
  } else if ((r.status === 'lost' && r.lostT > 1.5) || r.status === 'pos') { if (!hold || r.status === 'lost') showCue(r.status, 'warn'); }
  if (hold) {
    const s = Math.floor(r.holdGood); $('cNum').textContent = s;
    $('barFill').style.width = Math.min(100, r.holdGood / W.target * 100) + '%';
    if (s > W.holdSpoken) { W.holdSpoken = s;
      if (s === Math.floor(W.target / 2) && W.target >= 20) speak(t().say.halfway);
      else if (s >= W.target - 3 && s < W.target) speak(W.target - s);
      else if (s % 10 === 0) speak(s);
      if (s >= W.target) { speak(t().say.done, { interrupt: true }); return finish(true); } }
  } else $('barFill').style.width = Math.min(100, r.reps / W.target * 100) + '%';
}

function stopCamera() { cancelAnimationFrame(raf); try { wakeLock?.release(); } catch {} wakeLock = null; if (stream) stream.getTracks().forEach(tr => tr.stop()); stream = null; }

function finish(goal) {
  if (!W || W.finished) return; W.finished = true;
  const r = W.engine ? W.engine.update(null, performance.now()) : { reps: 0, bad: 0, holdGood: 0, holdTotal: 0 };
  const hold = EXERCISES[W.ex].kind === 'hold';
  const secs = W.t0 ? (performance.now() - W.t0) / 1000 : 0;
  const n = hold ? Math.floor(r.holdGood) : r.reps;
  const tech = hold ? (r.holdTotal ? Math.round(r.holdGood / r.holdTotal * 100) : 0) : (r.reps + r.bad ? Math.round(r.reps / (r.reps + r.bad) * 100) : 0);
  if (n > 0) markToday();
  const res = { ex: W.ex, n, bad: hold ? Math.round(r.holdTotal - r.holdGood) : r.bad, tech, secs, goal: goal || n >= W.target, attempts: W.attempts };
  stopCamera(); W = null; showSummary(res);
  setTimeout(() => speak(t().say.summary(res.n, res.tech, res.bad)), 500);
}

let lastRes = null;
function showSummary(res) {
  lastRes = res; const hold = EXERCISES[res.ex].kind === 'hold';
  $('sEyebrow').textContent = res.goal ? t().goalDone : t().done;
  $('sNum').textContent = res.n; $('sLabel').textContent = t().ex[res.ex][1];
  $('sTech').textContent = res.tech + '%'; $('sTechW').textContent = t().techWord(res.tech);
  $('sBad').textContent = hold ? res.bad + ' ' + t().sec : res.bad;
  $('sStreak').textContent = getStreak(); const m = Math.floor(res.secs / 60), s = Math.round(res.secs % 60);
  $('sTime').textContent = `${m}:${String(s).padStart(2, '0')}`;
  $('sDots').innerHTML = res.attempts.map(a => `<i class="${a}"></i>`).join('');
  show('sum');
}

async function share() {
  const r = lastRes; if (!r) return;
  const txt = cfg.lang === 'ru' ? `${r.n} ${t().ex[r.ex][1]} · техника ${r.tech}% · Calisthenics Flow AI Coach @calistenics_flow` : `${r.n} ${t().ex[r.ex][1]} · technique ${r.tech}% · Calisthenics Flow AI Coach @calistenics_flow`;
  try { if (navigator.share) await navigator.share({ title: 'Calisthenics Flow', text: txt, url: location.href }); else { await navigator.clipboard.writeText(txt + ' ' + location.href); $('shareBtn').textContent = '✓'; setTimeout(applyLang, 1200); } } catch {}
}

/* ---------- wire ---------- */
$('langBtn').onclick = () => { cfg.lang = cfg.lang === 'ru' ? 'en' : 'ru'; save(); applyLang(); };
$('voiceBtn').onclick = () => { cfg.voice = !cfg.voice; save(); applyLang(); };
$('camBtn').onclick = () => { cfg.front = !cfg.front; save(); applyLang(); };
$('tMinus').onclick = () => step(-1); $('tPlus').onclick = () => step(1);
$('startBtn').onclick = startWorkout; $('againBtn').onclick = startWorkout;
$('homeBtn').onclick = () => { applyLang(); show('home'); };
$('shareBtn').onclick = share;
$('finishBtn').onclick = () => finish(false);
$('quitBtn').onclick = () => { stopCamera(); W = null; speechSynthesis?.cancel(); applyLang(); show('home'); };
$('muteBtn').onclick = () => { voiceOn = !voiceOn; $('muteBtn').textContent = voiceOn ? '🔊' : '🔈'; if (!voiceOn) speechSynthesis.cancel(); };
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
applyLang();
loadModel().catch(() => {}); // warm up in background
