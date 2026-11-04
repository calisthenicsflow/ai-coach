import { createEngine, visibility, EXERCISES, FAULTS, L } from './engine.js?v=3.0';
export const APP_VERSION = '3.0';
/* ---------- update guard: no service worker; always check version.json bypassing caches ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(j => {
  if (j.v && j.v !== APP_VERSION) { const k = 'cf_reload_' + j.v; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); location.replace(location.pathname + '?v=' + j.v + '&t=' + Date.now()); } }
}).catch(() => {});

/* ---------- i18n ---------- */
const T = {
  ru: { title:'AI-тренер', subtitle:'Считает только чистые повторы. Видео не покидает телефон.', target:'Цель', voice:'Голос', camFront:'Фронтальная камера', camBack:'Основная камера',
    start:'Начать', finish:'Завершить', loading:'Загружаю модель…', technique:'Техника', uncounted:'Не засчитано', uncountedSub:'неглубоко, не до конца или ошибка формы',
    streak:'Серия', streakSub:'дней подряд', time:'Время', timeSub:'вся тренировка', clean:'чисто', error:'ошибка', share:'Поделиться', again:'Ещё раз', home:'На главную',
    of:'из', sec:'сек', reps:'повт.', goalDone:'Цель выполнена', done:'Тренировка завершена', go:'Начали!', streakHome:n=>`Серия: ${n} дн. подряд`,
    techWord:p=>p>=90?'Отлично':p>=70?'Хорошо':'Есть над чем работать',
    parts:{s:'плечи',e:'локти',w:'кисти',h:'таз',k:'колени',a:'стопы'},
    ex:{pushup:['Отжимания','отжиманий'],pullup:['Подтягивания','подтягиваний'],squat:['Приседания','приседаний'],dip:['Брусья','отжиманий на брусьях'],plank:['Планка','сек в планке'],hollow:['Hollow body','сек в hollow'],handstand:['Стойка на руках','сек в стойке']},
    exSub:{pushup:'сбоку, телефон на полу',pullup:'сбоку или спереди',squat:'сбоку, во весь рост',dip:'сбоку, во весь рост',plank:'удержание, линия тела',hollow:'удержание, лодочка',handstand:'удержание, линия'},
    hint:{pushup:'Телефон на полу <b>сбоку</b>, 1,5–2 м. Если не помещаешься — положи его горизонтально.',pullup:'Поставь телефон в 2–3 м, чтобы были видны перекладина и руки.',
      squat:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.',dip:'Телефон <b>сбоку</b> в 2–3 м, видно плечи, локти и таз.',plank:'Телефон на полу <b>сбоку</b>, 1,5–2 м.',hollow:'Телефон на полу <b>сбоку</b>, 1,5–2 м, лёжа на спине.',handstand:'Телефон <b>сбоку</b>, 2–3 м, видно всё тело — от кистей до стоп.'},
    cue:{clean:'Чисто!',go_lower:'Ниже!',deeper:'Глубже: таз до колен',dip_lower:'Ниже: плечи до локтей',lockout:'Выпрями руки до конца',full_hang:'Полный вис внизу',chin_over:'Подбородок над перекладиной',no_kipping:'Без рывка ногами',no_swing:'Не раскачивайся',stand_tall:'Встань до конца',chest_up:'Грудь вверх',knees_out:'Колени наружу',hips_high:'Таз слишком высоко',hips_sag:'Таз провис',elbows_in:'Локти ближе к корпусу',hands_under:'Ладони под плечами',shoulders_over_elbows:'Плечи над локтями',shoulders_over_wrists:'Плечи над запястьями',legs_lower:'Опусти ноги ниже',legs_up:'Ноги от пола',shoulders_up:'Лопатки от пола',straight_arms:'Выпрями руки в локтях',open_shoulders:'Открой плечи',no_banana:'Не прогибайся',hs_line:'Выстрой линию',hold:'Держи',lost:'Не вижу тебя',pos:'Займи позицию'},
    settings:'Настройки',language:'Язык',voiceRu:'Голос (русский)',voiceEn:'Голос (английский)',male:'Мужской',female:'Женский',voiceOn:'Голосовые подсказки',preview:'Прослушать',close:'Готово',debug:'Отладка (углы на экране)',version:'Версия',
    say:{halfway:'Половина',last:'Последний!',done:'Готово!',summary:(n,p,b)=>`${n} чистых. Техника ${p} процентов.${b?` Не засчитано: ${b}.`:''}`},
  },
  en: { title:'AI Coach', subtitle:'Counts only clean reps. Video never leaves your phone.', target:'Target', voice:'Voice', camFront:'Front camera', camBack:'Back camera',
    start:'Start', finish:'Finish', loading:'Loading model…', technique:'Technique', uncounted:'Not counted', uncountedSub:'too shallow, no lockout or form error',
    streak:'Streak', streakSub:'days in a row', time:'Time', timeSub:'whole workout', clean:'clean', error:'error', share:'Share', again:'Again', home:'Home',
    of:'of', sec:'sec', reps:'reps', goalDone:'Goal complete', done:'Workout complete', go:'Go!', streakHome:n=>`Streak: ${n} day${n>1?'s':''} in a row`,
    techWord:p=>p>=90?'Excellent':p>=70?'Good':'Room to improve',
    parts:{s:'shoulders',e:'elbows',w:'wrists',h:'hips',k:'knees',a:'feet'},
    ex:{pushup:['Push-ups','push-ups'],pullup:['Pull-ups','pull-ups'],squat:['Squats','squats'],dip:['Dips','dips'],plank:['Plank','sec plank'],hollow:['Hollow body','sec hollow'],handstand:['Handstand','sec handstand']},
    exSub:{pushup:'side view, phone on floor',pullup:'side or front view',squat:'side view, full body',dip:'side view, full body',plank:'hold, body line',hollow:'hold, banana shape',handstand:'hold, straight line'},
    hint:{pushup:'Phone on the floor, <b>side view</b>, 1.5–2 m away. If you don\'t fit, turn it landscape.',pullup:'Place the phone 2–3 m away so the bar and your arms are visible.',
      squat:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.',dip:'Phone <b>side view</b>, 2–3 m, shoulders, elbows and hips visible.',plank:'Phone on the floor, <b>side view</b>, 1.5–2 m.',hollow:'Phone on the floor, <b>side view</b>, 1.5–2 m, lying on your back.',handstand:'Phone <b>side view</b>, 2–3 m, full body visible — hands to feet.'},
    cue:{clean:'Clean!',go_lower:'Go lower',deeper:'Deeper: hips to knees',dip_lower:'Lower: shoulders to elbows',lockout:'Lock out arms',full_hang:'Full hang',chin_over:'Chin over bar',no_kipping:'No kipping',no_swing:'Stop swinging',stand_tall:'Stand tall',chest_up:'Chest up',knees_out:'Knees out',hips_high:'Hips too high',hips_sag:'Hips sagging',elbows_in:'Elbows in',hands_under:'Hands under shoulders',shoulders_over_elbows:'Shoulders over elbows',shoulders_over_wrists:'Shoulders over wrists',legs_lower:'Lower your legs',legs_up:'Lift your legs',shoulders_up:'Shoulders off floor',straight_arms:'Lock your elbows',open_shoulders:'Open shoulders',no_banana:'No banana back',hs_line:'Stack the line',hold:'Hold',lost:'Can\'t see you',pos:'Get in position'},
    settings:'Settings',language:'Language',voiceRu:'Voice (Russian)',voiceEn:'Voice (English)',male:'Male',female:'Female',voiceOn:'Voice cues',preview:'Preview',close:'Done',debug:'Debug (angles on screen)',version:'Version',
    say:{halfway:'Halfway',last:'Last one!',done:'Done!',summary:(n,p,b)=>`${n} clean reps. Technique ${p} percent.${b?` ${b} not counted.`:''}`},
  }
};
const EX_ORDER = ['pushup','pullup','squat','dip','plank','hollow','handstand'];
const BAD_CUES = new Set(FAULTS);

const $ = id => document.getElementById(id);
const S = JSON.parse(localStorage.getItem('cf_settings') || '{}');
const cfg = { lang: S.lang || 'ru', ex: S.ex || 'pushup', voice: S.voice ?? true, front: S.front ?? false, voices: S.voices || { ru:'m', en:'m' }, targets: S.targets || { pushup:20, pullup:10, squat:20, dip:15, plank:60, hollow:30, handstand:30 }, debug: S.debug ?? false };
cfg.targets.handstand ??= 30;
const save = () => localStorage.setItem('cf_settings', JSON.stringify(cfg));
const t = () => T[cfg.lang];
const isHold = () => EXERCISES[cfg.ex].kind === 'hold';

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function applyLang() {
  document.documentElement.lang = cfg.lang;
  document.querySelectorAll('[data-i]').forEach(el => { const v = t()[el.dataset.i]; if (typeof v === 'string') el.textContent = v; });
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

/* ---------- voice: pre-generated neural TTS clips via Web Audio, speechSynthesis fallback ---------- */
let voiceOn = true;
const ACtx = window.AudioContext || window.webkitAudioContext;
let ac = null, gain = null, playing = [], endT = 0, seq = 0;
const bufs = new Map();
const vdir = () => `${cfg.lang}-${cfg.voices[cfg.lang] || 'm'}`;
function unlockAudio() { // must run inside a user gesture (iOS)
  try {
    if (!ac && ACtx) { ac = new ACtx(); gain = ac.createGain(); gain.gain.value = 1; gain.connect(ac.destination); }
    if (ac) { if (ac.state !== 'running') ac.resume(); const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(gain); s.start(0); }
  } catch {}
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch {}
}
function clip(key, dir = vdir()) {
  const id = dir + '/' + key; if (bufs.has(id)) return bufs.get(id);
  const p = fetch(`audio/${id}.mp3?v=${APP_VERSION}`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(ab => new Promise((res, rej) => (ac ? ac.decodeAudioData(ab, res, rej) : rej()))).catch(() => { bufs.delete(id); return null; });
  bufs.set(id, p); return p;
}
function preloadVoice(target) {
  if (!ac) return;
  const keys = ['go','halfway','last','done','clean','hold','lost','pos', ...FAULTS];
  for (let i = 0; i <= Math.min(120, Math.max(10, target)); i++) keys.push('n' + i);
  keys.forEach(k => clip(k));
}
function stopVoice() { seq++; playing.forEach(s => { try { s.stop(); } catch {} }); playing = []; endT = 0; try { speechSynthesis.cancel(); } catch {} }
function speakTTS(text, interrupt) {
  if (!('speechSynthesis' in window) || text == null) return;
  const u = new SpeechSynthesisUtterance(String(text)); u.lang = cfg.lang === 'ru' ? 'ru-RU' : 'en-US'; u.rate = 1.05;
  const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(cfg.lang)); if (v) u.voice = v;
  if (interrupt) speechSynthesis.cancel(); speechSynthesis.speak(u);
}
// say(['n12','halfway'], '12. Halfway') — plays clips back to back; falls back to speechSynthesis if any clip is missing
async function say(keys, text, { interrupt = true, force = false } = {}) {
  if (!force && (!cfg.voice || !voiceOn)) return;
  if (interrupt) stopVoice();
  const my = seq;
  if (!ac) return speakTTS(text, interrupt);
  const list = await Promise.all(keys.map(k => clip(k)));
  if (my !== seq) return;
  if (list.some(b => !b)) return speakTTS(text, interrupt);
  let t0 = Math.max(ac.currentTime + 0.02, endT);
  for (const b of list) { const s = ac.createBufferSource(); s.buffer = b; s.connect(gain); s.start(t0); playing.push(s); s.onended = () => { playing = playing.filter(x => x !== s); }; t0 += b.duration + 0.06; }
  endT = t0;
}
const sayNum = (n, extra = [], text = '', opt) => say(n <= 120 ? ['n' + n, ...extra] : [], `${n}. ${text}`, opt);

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

async function startWorkout() { $('dbgOut').textContent = '';
  unlockAudio(); voiceOn = true; preloadVoice(cfg.targets[cfg.ex]); $('muteBtn').textContent = '🔊';
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
  if (cfg.debug) showDbg(r);
  handle(r, now);
}

function showDbg(r) {
  const f = v => typeof v === 'number' ? (Math.abs(v) < 5 ? v.toFixed(2) : v.toFixed(0)) : v;
  const d = r.dbg || {}; const rows = [`${r.status}/${r.seg}${r.angle != null ? ' ∠' + f(r.angle) : ''}${r.body != null ? ' body ' + f(r.body) : ''}`];
  rows.push(Object.entries(d).filter(([k]) => k !== 'b').map(([k, v]) => `${k} ${f(v)}`).join('  '));
  rows.push((r.live || []).join(', ') || '—');
  $('dbgOut').textContent = rows.join('\n');
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
    if (n > 0) { big.innerHTML = `<small>${name}</small>${n}`; big.classList.add('show'); sayNum(n); n--; setTimeout(tick, 1000); }
    else { big.innerHTML = `<small>${name}</small><span style="font-size:56px">${t().go}</span>`; say(['go'], t().go);
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
      if (r.reps === W.target) { sayNum(r.reps, ['done'], t().say.done); return finish(true); }
      if (r.reps === Math.ceil(W.target / 2) && W.target >= 6) sayNum(r.reps, ['halfway'], t().say.halfway);
      else if (r.reps === W.target - 1 && W.target > 3) sayNum(r.reps, ['last'], t().say.last);
      else sayNum(r.reps);
    } else { showCue(e.reason, 'bad'); say([e.reason], t().cue[e.reason]); W.lastCueSpoken = now; }
  }
  // live form cues (not tied to a finished rep)
  if (r.cue && BAD_CUES.has(r.cue) && !r.events.length) {
    showCue(r.cue, r.seg === 'warn' ? 'warn' : 'bad');
    if (now - W.lastCueSpoken > 2500 || r.cue !== W.lastCueKey) { if (now - W.lastCueSpoken > 1200) { say([r.cue], t().cue[r.cue]); W.lastCueSpoken = now; W.lastCueKey = r.cue; } }
  } else if ((r.status === 'lost' && r.lostT > 1.5) || r.status === 'pos') { if (!hold || r.status === 'lost') showCue(r.status, 'warn'); }
  if (hold) {
    const s = Math.floor(r.holdGood); $('cNum').textContent = s;
    $('barFill').style.width = Math.min(100, r.holdGood / W.target * 100) + '%';
    if (s > W.holdSpoken) { W.holdSpoken = s;
      const busy = now - W.lastCueSpoken < 1500;
      if (s >= W.target) { say(['done'], t().say.done); return finish(true); }
      if (s === Math.floor(W.target / 2) && W.target >= 20) say(['halfway'], t().say.halfway, { interrupt: !busy });
      else if (s >= W.target - 3) sayNum(W.target - s, [], '', { interrupt: !busy });
      else if (s % 10 === 0) sayNum(s, [], '', { interrupt: !busy }); }
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
  setTimeout(() => { const k = ['s_done', hold ? 's_hold' : 's_clean', 'n' + Math.min(120, res.n), 's_tech', 'p' + res.tech];
    if (res.bad && !hold) k.push('s_bad', 'n' + Math.min(120, res.bad));
    say(res.n > 120 ? [] : k, t().say.summary(res.n, res.tech, res.bad), { interrupt: false }); }, 700);
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
function renderSettings() {
  document.querySelectorAll('#sheet [data-set]').forEach(b => { const [k, v] = b.dataset.set.split(':');
    const cur = k === 'lang' ? cfg.lang : k === 'voice' ? String(cfg.voice) : k === 'debug' ? String(cfg.debug) : cfg.voices[k]; b.classList.toggle('sel', cur === v); });
}
document.querySelectorAll('#sheet [data-set]').forEach(b => b.onclick = () => {
  unlockAudio(); const [k, v] = b.dataset.set.split(':');
  if (k === 'lang') cfg.lang = v; else if (k === 'voice') cfg.voice = v === 'true'; else if (k === 'debug') cfg.debug = v === 'true'; else cfg.voices[k] = v;
  save(); applyLang(); renderSettings();
  if (k === 'ru' || k === 'en') { const l = cfg.lang; cfg.lang = k; say(['s_great'], k === 'ru' ? 'Отличная работа!' : 'Great work!', { force: true }); cfg.lang = l; }
});
$('setBtn').onclick = () => { unlockAudio(); renderSettings(); $('sheet').classList.add('show'); };
$('sheetClose').onclick = () => $('sheet').classList.remove('show');
$('sheet').onclick = e => { if (e.target.id === 'sheet') $('sheet').classList.remove('show'); };
$('previewBtn').onclick = () => { unlockAudio(); say(['n3', 'n2', 'n1', 'go'], '3 2 1 ' + t().go, { force: true }); };
$('voiceBtn').onclick = () => { unlockAudio(); cfg.voice = !cfg.voice; save(); applyLang(); };
$('camBtn').onclick = () => { cfg.front = !cfg.front; save(); applyLang(); };
$('tMinus').onclick = () => step(-1); $('tPlus').onclick = () => step(1);
$('startBtn').onclick = startWorkout; $('againBtn').onclick = startWorkout;
$('homeBtn').onclick = () => { applyLang(); show('home'); };
$('shareBtn').onclick = share;
$('finishBtn').onclick = () => finish(false);
$('quitBtn').onclick = () => { stopCamera(); W = null; stopVoice(); applyLang(); show('home'); };
$('muteBtn').onclick = () => { voiceOn = !voiceOn; $('muteBtn').textContent = voiceOn ? '🔊' : '🔈'; if (!voiceOn) stopVoice(); };
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
document.addEventListener('touchend', unlockAudio, { once: true }); document.addEventListener('click', unlockAudio, { once: true });
applyLang();
loadModel().catch(() => {}); // warm up in background
