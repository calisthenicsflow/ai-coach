import { createEngine, visibility, EXERCISES, FAULTS, L } from './engine.js?v=3.3';
import { CHECKS, BEST_VIEW } from './engine.js?v=3.3';
export const APP_VERSION = '3.3';
/* ---------- update guard: no service worker; always check version.json bypassing caches ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(j => {
  if (j.v && j.v !== APP_VERSION) { const k = 'cf_reload_' + j.v; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); location.replace(location.pathname + '?v=' + j.v + '&t=' + Date.now()); } }
}).catch(() => {});

/* ---------- i18n ---------- */
const T = {
  ru: { title:'AI-тренер', subtitle:'Считает только чистые повторы. Видео не покидает телефон.', target:'Цель', voice:'Голос', camFront:'Фронтальная камера', camBack:'Основная камера',
    start:'Начать', finish:'Завершить', loading:'Загружаю модель…', technique:'Техника', uncounted:'Не засчитано', uncountedSub:'неглубоко, не до конца или ошибка формы',uncountedSubHold:'время с ошибкой формы',
    streak:'Серия', streakSub:'дней подряд', time:'Время', timeSub:'вся тренировка', clean:'чисто', error:'ошибка', share:'Поделиться', again:'Ещё раз', home:'На главную',
    of:'из', sec:'сек', reps:'повт.', goalDone:'Цель выполнена', done:'Тренировка завершена', go:'Начали!', streakHome:n=>`Серия: ${n} дн. подряд`,
    techWord:p=>p>=90?'Отлично':p>=70?'Хорошо':'Есть над чем работать',
    rec:'Запись',recStart:'Записать подход',recStop:'Стоп',recOn:'Записывается',recSave:'Сохранить видео',recUnsup:'Запись не поддерживается в этом браузере',recErr:'Не удалось начать запись',
    history:'История',noHist:'Пока пусто — закончи первую тренировку',histSub:'последние тренировки',chart:'Прогресс',clearHist:'Очистить историю',
    sets:'Подходы',rest:'Отдых',restNow:'ОТДЫХ',nextSet:'Следующий подход',skipRest:'Пропустить',setOf:(a,b)=>`Подход ${a} из ${b}`,setDone:'Подход завершён',
    level:'Уровень',lvEasy:'Легко',lvStd:'Норма',lvHard:'Жёстко',lvNote:'Меняет пороги глубины и допуски техники',
    exitQ:'Выйти?',exitSub:'Подход будет сохранён в текущем виде',exitStay:'Остаться',exitLeave:'Выйти',paused:'Пауза',resume:'Продолжить',
    notStarted:'Тренировка не началась',notStartedSub:'Не удалось встать в позицию. Проверь камеру и попробуй ещё раз.',
    story:'Картинка для сторис',saveImg:'Сохранить',shared:'Готово',
    calNoBody:'Встань в кадр — отойди на 2–3 м от телефона',calMissing:p=>`Не видно: ${p}. Отойди дальше и повернись боком`,calSide:'Поставь телефон сбоку, на уровне пояса — нужен профиль',calOk:'Отлично, стой спокойно…',calBody:'Всё тело должно помещаться в кадр',
    hsSide:'Поставь камеру строго сбоку — так проверяется линия тела',
    restSkip:'Дальше',videoSaved:'Видео сохранено',
    parts:{s:'плечи',e:'локти',w:'кисти',h:'таз',k:'колени',a:'стопы'},
    ex:{pushup:['Отжимания','отжиманий'],pullup:['Подтягивания','подтягиваний'],squat:['Приседания','приседаний'],dip:['Брусья','отжиманий на брусьях'],plank:['Планка','сек в планке'],hollow:['Hollow body','сек в hollow'],handstand:['Стойка на руках','сек в стойке'],lsit:['L-sit','сек в L-sit'],row:['Австралийские подтягивания','австралийских подтягиваний'],lunge:['Выпады','выпадов']},
    exSub:{pushup:'сбоку, телефон на полу',pullup:'сбоку или спереди',squat:'сбоку, во весь рост',dip:'сбоку, во весь рост',plank:'удержание, линия тела',hollow:'удержание, лодочка',handstand:'удержание, линия',lsit:'удержание, ноги прямые',row:'горизонтально, низкая перекладина',lunge:'сбоку, во весь рост'},
    hint:{pushup:'Телефон на полу <b>сбоку</b>, 1,5–2 м. Если не помещаешься — положи его горизонтально.',pullup:'Поставь телефон в 2–3 м, чтобы были видны перекладина и руки.',
      squat:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.',dip:'Телефон <b>сбоку</b> в 2–3 м, видно плечи, локти и таз.',plank:'Телефон на полу <b>сбоку</b>, 1,5–2 м.',hollow:'Телефон на полу <b>сбоку</b>, 1,5–2 м, лёжа на спине.',handstand:'Телефон <b>сбоку</b>, 2–3 м, видно всё тело — от кистей до стоп.',lsit:'Телефон <b>сбоку</b> на полу, 1,5–2 м. Руки на полу или на паралетсах.',row:'Телефон <b>сбоку</b>, 2–3 м, низкая перекладина или стол. Тело одной линией.',lunge:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.'},
    cue:{clean:'Чисто!',go_lower:'Ниже!',deeper:'Глубже: таз до колен',dip_lower:'Ниже: плечи до локтей',lockout:'Выпрями руки до конца',full_hang:'Полный вис внизу',chin_over:'Подбородок над перекладиной',no_kipping:'Без рывка ногами',no_swing:'Не раскачивайся',stand_tall:'Встань до конца',chest_up:'Грудь вверх',knees_out:'Колени наружу',hips_high:'Таз слишком высоко',hips_sag:'Таз провис',elbows_in:'Локти ближе к корпусу',hands_under:'Ладони под плечами',shoulders_over_elbows:'Плечи над локтями',shoulders_over_wrists:'Плечи над запястьями',legs_lower:'Опусти ноги ниже',legs_up:'Ноги от пола',shoulders_up:'Лопатки от пола',straight_arms:'Выпрями руки в локтях',open_shoulders:'Открой плечи',no_banana:'Не прогибайся',hs_line:'Выстрой линию',legs_straight:'Выпрями ноги',hips_up_ls:'Подними таз',back_straight:'Спина прямая',knees_forward:'Колени над носками',lean_back:'Отклонись назад',rest:'Отдых',set:'Подход',pause:'Пауза. Нажми продолжить',hold:'Держи',lost:'Не вижу тебя',pos:'Займи позицию'},
    settings:'Настройки',language:'Язык',voiceRu:'Голос (русский)',voiceEn:'Голос (английский)',male:'Мужской',female:'Женский',voiceOn:'Голосовые подсказки',preview:'Прослушать',close:'Готово',debug:'Отладка (углы на экране)',version:'Версия',
    model:'Модель позы',mLite:'Быстрая',mFull:'Стандарт',mHeavy:'Макс',fellBack:'Медленно — включаю быструю модель',
    views:{side:'Сбоку',d34:'3/4',front:'Спереди'},better:'лучше',checksAll:'амплитуда',noChecks:'только время, форма не проверяется',
    ck:{hips_sag:'провис таза',hips_high:'таз высоко',hands_under:'ладони',elbows_in:'локти',chest_up:'грудь',knees_out:'колени',no_kipping:'без рывка',no_swing:'раскачка',shoulders_over_wrists:'плечи/кисти',shoulders_over_elbows:'плечи/локти',legs_lower:'ноги',legs_up:'ноги от пола',shoulders_up:'лопатки',straight_arms:'прямые руки',open_shoulders:'плечи',no_banana:'прогиб',hs_line:'линия',legs_straight:'прямые ноги',hips_up_ls:'таз',back_straight:'спина',lockout:'локти'},
    tipTitle:'Поставь камеру так',gotIt:'Понятно, начать',tView:'Ракурс',tHeight:'Высота камеры',tDist:'Расстояние',tFrame:'Всё тело в кадре — от кистей до стоп',
    hFloor:'на полу',hWaist:'на уровне пояса',hChest:'на уровне груди',hKnee:'на уровне колена',
    vSide:'строго сбоку (профиль)',vFront:'спереди или сзади',
    tipNote:{side:'Сбоку проверяется линия тела. Спереди — только локти/колени, остальное отключится.',front:'Спереди видно рывок и симметрию. Сбоку тоже можно — добавится контроль раскачки.'},
    say:{halfway:'Половина',last:'Последний!',done:'Готово!',summary:(n,p,b)=>`${n} чистых. Техника ${p} процентов.${b?` Не засчитано: ${b}.`:''}`},
  },
  en: { title:'AI Coach', subtitle:'Counts only clean reps. Video never leaves your phone.', target:'Target', voice:'Voice', camFront:'Front camera', camBack:'Back camera',
    start:'Start', finish:'Finish', loading:'Loading model…', technique:'Technique', uncounted:'Not counted', uncountedSub:'too shallow, no lockout or form error',uncountedSubHold:'time with a form error',
    streak:'Streak', streakSub:'days in a row', time:'Time', timeSub:'whole workout', clean:'clean', error:'error', share:'Share', again:'Again', home:'Home',
    of:'of', sec:'sec', reps:'reps', goalDone:'Goal complete', done:'Workout complete', go:'Go!', streakHome:n=>`Streak: ${n} day${n>1?'s':''} in a row`,
    techWord:p=>p>=90?'Excellent':p>=70?'Good':'Room to improve',
    rec:'Record',recStart:'Record set',recStop:'Stop',recOn:'Recording',recSave:'Save video',recUnsup:'Recording is not supported in this browser',recErr:'Could not start recording',
    history:'History',noHist:'Empty so far — finish your first workout',histSub:'recent workouts',chart:'Progress',clearHist:'Clear history',
    sets:'Sets',rest:'Rest',restNow:'REST',nextSet:'Next set',skipRest:'Skip',setOf:(a,b)=>`Set ${a} of ${b}`,setDone:'Set complete',
    level:'Level',lvEasy:'Easy',lvStd:'Normal',lvHard:'Strict',lvNote:'Changes depth thresholds and form tolerances',
    exitQ:'Exit?',exitSub:'The set will be saved as it is',exitStay:'Stay',exitLeave:'Exit',paused:'Paused',resume:'Resume',
    notStarted:'Workout never started',notStartedSub:'Could not get into position. Check the camera and try again.',
    story:'Story image',saveImg:'Save',shared:'Done',
    calNoBody:'Step into the frame — stand 2–3 m from the phone',calMissing:p=>`Can't see: ${p}. Step back and turn sideways`,calSide:'Put the phone at your side, waist height — a profile view is needed',calOk:'Great, hold still…',calBody:'Your whole body must fit in the frame',
    hsSide:'Place the camera strictly to the side — that is how the body line is checked',
    restSkip:'Next',videoSaved:'Video saved',
    parts:{s:'shoulders',e:'elbows',w:'wrists',h:'hips',k:'knees',a:'feet'},
    ex:{pushup:['Push-ups','push-ups'],pullup:['Pull-ups','pull-ups'],squat:['Squats','squats'],dip:['Dips','dips'],plank:['Plank','sec plank'],hollow:['Hollow body','sec hollow'],handstand:['Handstand','sec handstand'],lsit:['L-sit','sec L-sit'],row:['Australian pull-ups','body rows'],lunge:['Lunges','lunges']},
    exSub:{pushup:'side view, phone on floor',pullup:'side or front view',squat:'side view, full body',dip:'side view, full body',plank:'hold, body line',hollow:'hold, banana shape',handstand:'hold, straight line',lsit:'hold, straight legs',row:'horizontal, low bar',lunge:'side view, full body'},
    hint:{pushup:'Phone on the floor, <b>side view</b>, 1.5–2 m away. If you don\'t fit, turn it landscape.',pullup:'Place the phone 2–3 m away so the bar and your arms are visible.',
      squat:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.',dip:'Phone <b>side view</b>, 2–3 m, shoulders, elbows and hips visible.',plank:'Phone on the floor, <b>side view</b>, 1.5–2 m.',hollow:'Phone on the floor, <b>side view</b>, 1.5–2 m, lying on your back.',handstand:'Phone <b>side view</b>, 2–3 m, full body visible — hands to feet.',lsit:'Phone on the floor, <b>side view</b>, 1.5–2 m. Hands on the floor or parallettes.',row:'Phone <b>side view</b>, 2–3 m, low bar or table. Keep your body in one line.',lunge:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.'},
    cue:{clean:'Clean!',go_lower:'Go lower',deeper:'Deeper: hips to knees',dip_lower:'Lower: shoulders to elbows',lockout:'Lock out arms',full_hang:'Full hang',chin_over:'Chin over bar',no_kipping:'No kipping',no_swing:'Stop swinging',stand_tall:'Stand tall',chest_up:'Chest up',knees_out:'Knees out',hips_high:'Hips too high',hips_sag:'Hips sagging',elbows_in:'Elbows in',hands_under:'Hands under shoulders',shoulders_over_elbows:'Shoulders over elbows',shoulders_over_wrists:'Shoulders over wrists',legs_lower:'Lower your legs',legs_up:'Lift your legs',shoulders_up:'Shoulders off floor',straight_arms:'Lock your elbows',open_shoulders:'Open shoulders',no_banana:'No banana back',hs_line:'Stack the line',legs_straight:'Straighten your legs',hips_up_ls:'Lift your hips',back_straight:'Back straight',knees_forward:'Knees over toes',lean_back:'Lean back',rest:'Rest',set:'Set',pause:'Paused. Tap resume',hold:'Hold',lost:'Can\'t see you',pos:'Get in position'},
    settings:'Settings',language:'Language',voiceRu:'Voice (Russian)',voiceEn:'Voice (English)',male:'Male',female:'Female',voiceOn:'Voice cues',preview:'Preview',close:'Done',debug:'Debug (angles on screen)',version:'Version',
    model:'Pose model',mLite:'Fast',mFull:'Standard',mHeavy:'Max',fellBack:'Slow device — switching to fast model',
    views:{side:'Side',d34:'3/4',front:'Front'},better:'best',checksAll:'range',noChecks:'time only, form not checked',
    ck:{hips_sag:'hip sag',hips_high:'hips high',hands_under:'hands',elbows_in:'elbows',chest_up:'chest',knees_out:'knees',no_kipping:'no kip',no_swing:'swing',shoulders_over_wrists:'shoulders/wrists',shoulders_over_elbows:'shoulders/elbows',legs_lower:'legs',legs_up:'legs up',shoulders_up:'shoulders up',straight_arms:'straight arms',open_shoulders:'shoulders',no_banana:'banana',hs_line:'line',legs_straight:'straight legs',hips_up_ls:'hips',back_straight:'back',lockout:'elbows'},
    tipTitle:'Set up the camera',gotIt:'Got it, start',tView:'View',tHeight:'Camera height',tDist:'Distance',tFrame:'Whole body in frame — hands to feet',
    hFloor:'on the floor',hWaist:'at waist height',hChest:'at chest height',hKnee:'at knee height',
    vSide:'straight from the side (profile)',vFront:'from the front or back',
    tipNote:{side:'Side view checks the body line. From the front only elbows/knees are checked, the rest is switched off.',front:'Front view shows kipping and symmetry. Side works too and adds swing control.'},
    say:{halfway:'Halfway',last:'Last one!',done:'Done!',summary:(n,p,b)=>`${n} clean reps. Technique ${p} percent.${b?` ${b} not counted.`:''}`},
  }
};
const EX_ORDER = ['pushup','pullup','squat','dip','row','lunge','plank','hollow','lsit','handstand'];
const BAD_CUES = new Set(FAULTS);

const $ = id => document.getElementById(id);
let S = {}; try { const v = JSON.parse(localStorage.getItem('cf_settings') || '{}'); if (v && typeof v === 'object' && !Array.isArray(v)) S = v; } catch {}
for (const k of ['targets','sets']) if (!S[k] || typeof S[k] !== 'object' || Array.isArray(S[k])) S[k] = {};
const cfg = { lang: S.lang || 'ru', ex: S.ex || 'pushup', voice: S.voice ?? true, front: S.front ?? false, voices: S.voices || { ru:'m', en:'m' }, targets: S.targets || { pushup:20, pullup:10, squat:20, dip:15, plank:60, hollow:30, handstand:30, lsit:20, row:15, lunge:20 }, debug: S.debug ?? false, model: S.model || 'full', noFb: !!S.noFb, sets: S.sets || {}, rest: S.rest ?? 60, level: S.level || 'std' };
for (const [k,v] of Object.entries({pushup:20,pullup:10,squat:20,dip:15,plank:60,hollow:30,handstand:30,lsit:20,row:15,lunge:20})) cfg.targets[k] ??= v;
const nSets = () => Math.max(1, Math.min(10, cfg.sets[cfg.ex] || 1));
const strictVal = () => cfg.level === 'hard' ? 1.15 : cfg.level === 'easy' ? 0.85 : 1;
const save = () => localStorage.setItem('cf_settings', JSON.stringify(cfg));
cfg.voices = { ru:'m', en:'m', ...(cfg.voices || {}) };
if (!T[cfg.lang]) cfg.lang = 'ru';
if (!EXERCISES[cfg.ex]) cfg.ex = 'pushup';
const t = () => T[cfg.lang];
const isHold = () => EXERCISES[cfg.ex].kind === 'hold';

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function applyLang() {
  document.documentElement.lang = cfg.lang;
  document.querySelectorAll('[data-i]').forEach(el => { const v = t()[el.dataset.i]; if (typeof v === 'string') el.textContent = v; });
  $('camBtn').textContent = cfg.front ? t().camFront : t().camBack;
  $('voiceBtn').classList.toggle('on', cfg.voice);
  document.querySelectorAll('#langBtn b').forEach(b => b.classList.toggle('on', b.dataset.l === cfg.lang));
  renderEx(); renderTarget(); renderStreak();
}
function renderEx() {
  $('exList').innerHTML = EX_ORDER.map(k => `<button class="ex ${k===cfg.ex?'sel':''}" data-k="${k}"><b>${t().ex[k][0]}</b><span>${t().exSub[k]}</span></button>`).join('');
  $('exList').querySelectorAll('.ex').forEach(b => b.onclick = () => { cfg.ex = b.dataset.k; save(); renderEx(); renderTarget(); });
}
function renderTarget() { $('tVal').textContent = cfg.targets[cfg.ex]; $('tUnit').textContent = isHold() ? t().sec : t().reps;
  $('sVal').textContent = nSets(); $('rVal').textContent = cfg.rest + ' ' + t().sec; $('startBtn').textContent = t().start;
  $('levelNote').textContent = t().lvNote; $('recInd').title = t().recOn; }
function stepSets(d) { cfg.sets[cfg.ex] = Math.max(1, Math.min(10, nSets() + d)); save(); renderTarget(); }
function stepRest(d) { cfg.rest = Math.max(10, Math.min(300, cfg.rest + d * 10)); save(); renderTarget(); }
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
const vdir = () => `${cfg.lang}-${(cfg.voices || {})[cfg.lang] || 'm'}`;
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
let landmarker = null, lmModel = null;
async function loadModel(model = cfg.model) {
  if (landmarker && lmModel === model) return landmarker;
  if (landmarker) { try { landmarker.close(); } catch {} landmarker = null; }
  const { FilesetResolver, PoseLandmarker } = await import('./mp/vision_bundle.mjs');
  const fs = await FilesetResolver.forVisionTasks(new URL('./mp', location.href).href);
  const mk = delegate => PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: `./mp/pose_landmarker_${model}.task`, delegate }, runningMode: 'VIDEO', numPoses: 1,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
  try { landmarker = await mk('GPU'); } catch (e) { console.warn('GPU failed, CPU', e); landmarker = await mk('CPU'); }
  lmModel = model; return landmarker;
}

/* ---------- workout ---------- */
const cv = $('cv'), ctx = cv.getContext('2d'), vid = $('vid');
let stream = null, raf = 0, W = null, wakeLock = null, startSeq = 0, starting = false;

/* ---------- setup tip card ---------- */
const SETUP = { pushup:['side','floor','1,5–2'], plank:['side','floor','1,5–2'], hollow:['side','floor','1,5–2'],
  lsit:['side','floor','1,5–2'], row:['side','knee','2–3'], squat:['side','waist','2–3'], lunge:['side','waist','2–3'],
  dip:['side','waist','2–3'], handstand:['side','waist','2–3'], pullup:['front','chest','2–3'] };
/* One drawing grammar for every card, 340x176, floor y=146:
   phone on a tripod on the LEFT, lens facing RIGHT; dashed sight line to the person's head;
   lime dashed rectangle = what the phone actually films. Side view => ONE profile figure facing the phone (left);
   front view => TWO legs / TWO arms and both eyes, standing square to the lens. */
const POSE = {
  squat:   { up:1, head:[234,52], spine:'M234 66 L230 104', arms:'M234 70 L214 82', legs:'M230 104 L212 120 L224 146', ground:1 },
  lunge:   { up:1, head:[228,50], spine:'M228 64 L230 102', arms:'M228 68 L224 96', legs:'M230 102 L204 118 L204 146 M230 102 L254 120 L266 146', ground:1 },
  dip:     { up:1, head:[232,44], spine:'M232 58 L230 96', arms:'M232 62 L216 74 L216 92', legs:'M230 96 L234 122 L232 140', ground:1, prop:'M200 96 L266 96' },
  handstand:{ up:0, head:[236,118], spine:'M236 106 L236 66', arms:'M236 106 L226 146 M236 106 L246 146', legs:'M236 66 L230 36 L228 16', ground:0 },
  pushup:  { up:0, head:[204,102], spine:'M214 110 L252 118', arms:'M214 110 L208 146', legs:'M252 118 L280 142', ground:1 },
  plank:   { up:0, head:[202,110], spine:'M212 118 L252 122', arms:'M212 118 L210 136 L202 146', legs:'M252 122 L280 144', ground:1 },
  hollow:  { up:0, head:[206,124], spine:'M216 132 L248 140', arms:'M216 130 L244 120', legs:'M248 140 L282 116', ground:1 },
  lsit:    { up:1, head:[252,64], spine:'M252 78 L254 112', arms:'M252 82 L242 112 L242 146', legs:'M254 112 L208 112 L206 118', ground:0 },
  row:     { up:0, head:[200,124], spine:'M210 126 L250 108', arms:'M210 126 L214 92 M214 92 L244 92', legs:'M250 108 L278 142', ground:1, prop:'M196 88 L262 88 M262 88 L262 146' },
  pullup:  { up:1, front:1, head:[232,52], spine:'M232 66 L232 100', arms:'M232 70 L214 56 L214 32 M232 70 L250 56 L250 32', legs:'M232 100 L224 122 L224 146 M232 100 L240 122 L240 146', ground:1, prop:'M196 28 L268 28' },
};
function setupSvg(ex) {
  const [view, h, dist] = SETUP[ex]; const p = POSE[ex]; const py = h === 'floor' ? 134 : h === 'knee' ? 108 : h === 'waist' ? 84 : 62;
  const m = cfg.lang === 'ru' ? dist + ' м' : dist.replace(',', '.') + ' m';
  const label = cfg.lang === 'ru' ? (view === 'side' ? 'ВИД СБОКУ' : 'ВИД СПЕРЕДИ') : (view === 'side' ? 'SIDE VIEW' : 'FRONT VIEW');
  const [hx, hy] = p.head;
  // sight line from the phone's lens to the head; film frustum around the whole body
  return `<svg viewBox="0 0 340 176" class="tipsvg" role="img" aria-label="${label}">
  <line x1="8" y1="147" x2="332" y2="147" stroke="rgba(244,244,238,.25)" stroke-width="2"/>
  ${py < 130 ? `<path d="M40 ${py+16} L40 146 M28 146 L40 ${py+16} L52 146" stroke="rgba(244,244,238,.4)" stroke-width="2" fill="none"/>` : ''}
  <path d="M52 ${py} L186 12 M52 ${py} L186 152" stroke="rgba(198,255,0,.3)" stroke-width="1.4" fill="none" stroke-dasharray="4 5"/>
  <rect x="30" y="${py-12}" width="22" height="32" rx="4" fill="#0E100E" stroke="#C6FF00" stroke-width="2"/>
  <circle cx="52" cy="${py+4}" r="4" fill="none" stroke="#C6FF00" stroke-width="2"/>
  <rect x="182" y="12" width="128" height="140" rx="10" fill="none" stroke="rgba(198,255,0,.55)" stroke-width="1.5" stroke-dasharray="6 5"/>
  ${p.prop ? `<path d="${p.prop}" stroke="rgba(244,244,238,.45)" stroke-width="4" stroke-linecap="round" fill="none"/>` : ''}
  <path d="${p.spine} ${p.arms} ${p.legs}" stroke="#F4F4EE" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="${hx}" cy="${hy}" r="9" fill="#F4F4EE"/>
  ${p.front ? `<circle cx="${hx-3}" cy="${hy-1}" r="1.4" fill="#060706"/><circle cx="${hx+3}" cy="${hy-1}" r="1.4" fill="#060706"/>`
    : `<path d="M${hx-9} ${hy-2} L${hx-14} ${hy+2} L${hx-9} ${hy+4} Z" fill="#F4F4EE"/><circle cx="${hx-4}" cy="${hy-2}" r="1.5" fill="#060706"/>`}
  <path d="M52 ${py} L${hx} ${hy}" stroke="rgba(198,255,0,.75)" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M62 164 L174 164 M62 164 l7 -3 M62 164 l7 3 M174 164 l-7 -3 M174 164 l-7 3" stroke="rgba(244,244,238,.5)" stroke-width="1.5"/>
  <text x="118" y="161" text-anchor="middle" fill="rgba(244,244,238,.75)" font-size="11" font-family="Manrope">${m}</text>
  <text x="248" y="168" text-anchor="middle" fill="#C6FF00" font-size="11" font-weight="700" letter-spacing="1" font-family="Montserrat">${label}</text>
  <text x="30" y="${py-20}" fill="#C6FF00" font-size="9" font-weight="700" font-family="Montserrat">REC</text>
</svg>`;
}
function showTip(ex) {
  const [view, h, d] = SETUP[ex]; const L = t();
  $('tipBody').innerHTML = setupSvg(ex) + `<ul class="tiplist">
    <li><small>${L.tView}</small><b>${view === 'side' ? L.vSide : L.vFront}</b></li>
    <li><small>${L.tHeight}</small><b>${L['h' + h[0].toUpperCase() + h.slice(1)]}</b></li>
    <li><small>${L.tDist}</small><b>${cfg.lang === 'ru' ? d + ' м' : d.replace(',', '.') + ' m'}</b></li>
    <li><small>✓</small><b>${L.tFrame}</b></li></ul><p class="tipnote">${L.tipNote[view]}</p>`;
  $('tipTitle').textContent = `${L.ex[ex][0]} · ${L.tipTitle}`; $('tipGo').textContent = L.gotIt;
  $('tip').classList.add('show');
}
$('tipGo').onclick = () => { $('tip').classList.remove('show'); startWorkout(); };
$('tipX').onclick = () => $('tip').classList.remove('show');
function preStart() { unlockAudio(); showTip(cfg.ex); }

async function startWorkout(keepSession) { const myStart = ++startSeq; starting = true; $('dbgOut').textContent = ''; $('viewChip').textContent = ''; $('viewChip').className = 'vchip';
  if (!keepSession) SESS = { ex: cfg.ex, sets: nSets(), target: cfg.targets[cfg.ex], done: [], t0: 0 };
  armBackGuard();
  unlockAudio(); voiceOn = true; preloadVoice(cfg.targets[cfg.ex]); $('muteBtn').textContent = '🔊';
  show('work'); $('loading').classList.add('show');
  $('cue').className = 'cue'; $('dots').innerHTML = ''; $('barFill').style.width = '0';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: cfg.front ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
    if (myStart !== startSeq) { stream.getTracks().forEach(tr => tr.stop()); return; }
    vid.srcObject = stream; await vid.play();
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
    await loadModel();
    if (myStart !== startSeq) return;
  } catch (e) {
    if (myStart !== startSeq) return;
    starting = false; disarmBackGuard();
    $('loading').querySelector('p').textContent = (cfg.lang==='ru' ? 'Нет доступа к камере или модели: ' : 'Camera/model unavailable: ') + (e.message || e);
    return;
  }
  starting = false;
  $('loading').classList.remove('show');
  const target = SESS.target;
  W = { flip: false, badT: 0, dms: 0, slowT: 0, lastNow: 0, checksKey: '', ex: cfg.ex, target: SESS.target, phase: 'calib', okSince: 0, engine: null, t0: 0, lastCue: null, lastCueSpoken: 0, said: {}, lastVideoT: -1, holdSpoken: 0, finished: false, attempts: [], paused: false, pauseT: 0, calT: 0 };
  $('setChip').textContent = SESS.sets > 1 ? t().setOf(SESS.done.length + 1, SESS.sets) : '';
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

function toEngineLm(res, flip) { const p = res.landmarks && res.landmarks[0]; return p ? p.map(q => flip ? [1 - q.x, 1 - q.y, q.z, q.visibility ?? 1] : [q.x, q.y, q.z, q.visibility ?? 1]) : null; }
function toWorld(res, flip) { const p = res.worldLandmarks && res.worldLandmarks[0]; return p ? p.map(q => flip ? [-q.x, -q.y, q.z] : [q.x, q.y, q.z]) : undefined; }
// MediaPipe's detector is trained on upright people: an inverted body (handstand) is often mis-tracked as standing.
// For handstand we feed a 180°-rotated frame when the upright pass loses the body, and auto-switch back.
const rc = document.createElement('canvas'), rctx = rc.getContext('2d');
function rotatedFrame() {
  const sc = Math.min(1, 960 / Math.max(vid.videoWidth, vid.videoHeight)); const w = Math.round(vid.videoWidth * sc), h = Math.round(vid.videoHeight * sc);
  if (rc.width !== w || rc.height !== h) { rc.width = w; rc.height = h; }
  rctx.setTransform(-1, 0, 0, -1, w, h); rctx.drawImage(vid, 0, 0, w, h); return rc;
}
const KEY = [11, 12, 15, 16, 23, 24, 27, 28];
function detect(now) {
  const t0 = performance.now(); let res = null;
  try { res = landmarker.detectForVideo(W.flip ? rotatedFrame() : vid, now); } catch (e) { console.warn(e); }
  const ms = performance.now() - t0; W.dms = W.dms ? W.dms * 0.9 + ms * 0.1 : ms;
  const lm = res ? toEngineLm(res, W.flip) : null, wl = res ? toWorld(res, W.flip) : undefined;
  if (W.ex === 'handstand' && W.phase === 'active') {
    const q = lm ? KEY.reduce((a, i) => a + lm[i][3], 0) / KEY.length : 0;
    const dt = W.lastNow ? Math.min(0.5, (now - W.lastNow) / 1000) : 0;
    W.badT = q < 0.55 ? W.badT + dt : 0;
    if (W.badT > 0.6) { W.flip = !W.flip; W.badT = 0; }
  }
  // auto-fallback: if the heavier model can't keep ~12 fps, switch to lite for this session
  if (W.phase === 'active' && lmModel !== 'lite' && !W.fbBusy && !cfg.noFb) {
    W.slowT = W.dms > 80 ? W.slowT + (now - (W.lastNow || now)) / 1000 : 0;
    if (W.slowT > 3) { W.fbBusy = true; W.fellBack = true; showCue('', 'warn'); $('cue').textContent = t().fellBack;
      const wref = W; loadModel('lite').then(() => { if (wref) wref.fbBusy = false; }).catch(() => {}); }
  }
  W.lastNow = now; return [lm, wl];
}
function showView(r) {
  if (!r.view) return; const key = r.view + '|' + (r.checks || []).join(',') + '|' + cfg.lang;
  if (key === W.checksKey) return; W.checksKey = key; const L = t(); const best = BEST_VIEW[W.ex];
  const cks = (r.checks || []).map(c => L.ck[c] || c);
  $('viewChip').innerHTML = `<b>${L.views[r.view]}</b>${r.view !== best && !(best === 'front' && r.view !== 'front') ? ` <em>${L.better}: ${L.views[best]}</em>` : ''}<br><span>✓ ${([...(EXERCISES[W.ex].kind === 'hold' ? [] : [L.checksAll]), ...cks].join(' · ') || L.noChecks)}</span>`;
  $('viewChip').className = 'vchip show' + (r.view !== best && best === 'side' ? ' warn' : '');
}

function loop() {
  raf = requestAnimationFrame(loop);
  if (!W || vid.readyState < 2 || W.paused) return;
  const now = performance.now();
  if (vid.currentTime === W.lastVideoT) return; W.lastVideoT = vid.currentTime;
  window.__f = (window.__f||0) + 1;
  if (!landmarker) return; const [lm, wl] = detect(now);
  if (W.phase === 'calib') { recFrame(now); return calib(lm, now); }
  if (W.phase === 'count') { draw(lm, COLORS.idle); return; }
  const r = W.engine.update(lm, now, wl); showView(r);
  if (W.ex === 'handstand' && r.view && r.view !== 'side' && r.status === 'ok') {
    const c = $('cue'); c.textContent = t().hsSide; c.className = 'cue show warn'; clearTimeout(showCue.t); showCue.t = setTimeout(() => c.classList.remove('show'), 1600);
  }
  const color = r.status === 'lost' ? COLORS.lost : r.status === 'pos' ? COLORS.idle : (r.cue && BAD_CUES.has(r.cue) ? (r.seg === 'warn' ? COLORS.warn : COLORS.bad) : COLORS[r.seg] || COLORS.good);
  draw(lm, color, r.angle);
  if (cfg.debug) showDbg(r);
  if (rec) recOverlay(r);
  recFrame(now);
  handle(r, now);
}

function showDbg(r) {
  const f = v => typeof v === 'number' ? (Math.abs(v) < 5 ? v.toFixed(2) : v.toFixed(0)) : v;
  const d = r.dbg || {}; const rows = [`${r.status}/${r.seg}${r.angle != null ? ' ∠' + f(r.angle) : ''}${r.body != null ? ' body ' + f(r.body) : ''}`];
  rows.push(Object.entries(d).filter(([k]) => k !== 'b').map(([k, v]) => `${k} ${f(v)}`).join('  '));
  rows.push((r.live || []).join(', ') || '—');
  rows.push(`${lmModel} ${Math.round(1000 / Math.max(1, W.dms))}fps(det ${Math.round(W.dms)}ms) view ${r.view} yaw ${r.yaw != null ? Math.round(r.yaw) : '-'}${W.flip ? ' ROT180' : ''}${r.use3 ? ' 3D' : ''}`);
  $('dbgOut').textContent = rows.join('\n');
}
function calib(lm, now) {
  draw(lm, COLORS.idle);
  const vis = visibility(lm); const need = EXERCISES[W.ex].need;
  const missing = need.filter(k => !vis[k]);
  if (now - (W.calT || 0) > 400) { W.calT = now;
    $('hint').innerHTML = !lm ? t().calNoBody + '<br><span class="dim">' + t().calBody + '</span>'
      : missing.length ? t().calMissing(missing.map(k => t().parts[k]).join(', '))
        + (BEST_VIEW[W.ex] === 'side' ? '<br><span class="dim">' + t().calSide + '</span>' : '')
      : t().calOk; }
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
    if (W.paused) { setTimeout(tick, 250); return; }
    if (n > 0) { big.innerHTML = `<small>${name}</small>${n}`; big.classList.add('show'); sayNum(n); n--; setTimeout(tick, 1000); }
    else { big.innerHTML = `<small>${name}</small><span style="font-size:56px">${t().go}</span>`; say(['go'], t().go);
      setTimeout(() => big.classList.remove('show'), 700);
      stopRest(); W.engine = createEngine(W.ex, { aspect: vid.videoWidth / vid.videoHeight, strict: strictVal() }); W.t0 = performance.now(); W.phase = 'active'; }
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

function stopCamera() { cancelAnimationFrame(raf); try { wakeLock?.release(); } catch {} wakeLock = null; stopRec(); if (stream) stream.getTracks().forEach(tr => tr.stop()); stream = null; }

/* ---------- sessions: sets + rest, history, recordings ---------- */
let SESS = null, restTimer = 0, restLeft = 0, restPaused = false;
function stopRest() { clearInterval(restTimer); restTimer = 0; restPaused = false; $('rest').classList.remove('show'); $('pause').classList.remove('show'); }
function runRestTimer() {
  clearInterval(restTimer);
  const tick = () => { if (restPaused || !SESS) return; $('restNum').textContent = restLeft; if (restLeft <= 0) { stopRest(); startWorkout(true); } else { if (restLeft <= 3) sayNum(restLeft); restLeft--; } };
  tick(); restTimer = setInterval(tick, 1000);
}
function collectSet(goal) {
  const r = W.engine ? W.engine.update(null, performance.now()) : { reps: 0, bad: 0, holdGood: 0, holdTotal: 0 };
  const hold = EXERCISES[W.ex].kind === 'hold';
  const secs = W.t0 ? (performance.now() - W.t0 - (W.pauseT || 0)) / 1000 : 0;
  const n = hold ? Math.floor(r.holdGood) : r.reps;
  const tech = hold ? (r.holdTotal ? Math.round(r.holdGood / r.holdTotal * 100) : 0) : (r.reps + r.bad ? Math.round(r.reps / (r.reps + r.bad) * 100) : 0);
  return { ex: W.ex, n, bad: hold ? Math.round(r.holdTotal - r.holdGood) : r.bad, tech, secs,
    goal: goal || n >= W.target, attempts: W.attempts.slice(), set: SESS.done.length + 1 };
}
function finish(goal) {
  if (!W || W.finished) return; W.finished = true;
  const res = collectSet(goal);
  SESS.done.push(res); stopRest(); stopCamera(); W = null;
  if (SESS.done.length < SESS.sets) { armBackGuard(); return showRest(res); }
  disarmBackGuard();
  const all = SESS.done, last = all[all.length - 1];
  const tot = all.reduce((s, x) => s + x.n, 0), bad = all.reduce((s, x) => s + x.bad, 0), secs = all.reduce((s, x) => s + x.secs, 0);
  const tech = tot + bad ? Math.round(tot / (tot + bad) * 100) : 0;
  const agg = { ...last, n: tot, bad, tech, secs, attempts: all.flatMap(x => x.attempts), sets: all.map(x => ({ n: x.n, bad: x.bad, tech: x.tech })), goal: all.every(x => x.goal) };
  SESS = null;
  if (tot > 0) { markToday(); saveHistory(agg); }
  showSummary(agg);
  setTimeout(() => { const hold = EXERCISES[agg.ex].kind === 'hold';
    const k = ['s_done', hold ? 's_hold' : 's_clean', 'n' + Math.min(120, agg.n), 's_tech', 'p' + agg.tech];
    if (agg.bad && !hold) k.push('s_bad', 'n' + Math.min(120, agg.bad));
    say(agg.n > 120 ? [] : k, t().say.summary(agg.n, agg.tech, agg.bad), { interrupt: false }); }, 700);
}
function showRest(res) {
  stopVoice(); const L = t();
  $('restSet').textContent = L.setDone + ' · ' + res.n + (EXERCISES[res.ex].kind === 'hold' ? ' ' + L.sec : ' ' + L.reps) + ' · ' + res.tech + '%';
  $('rest').classList.add('show'); $('restNext').textContent = L.nextSet + ' · ' + L.setOf(res.set + 1, SESS.sets);
  say(['rest'], L.rest); restLeft = cfg.rest; restPaused = false; runRestTimer();
}
$('restSkip').onclick = () => { stopRest(); if (SESS) startWorkout(true); };
$('restQuit').onclick = () => { const done = SESS && SESS.done.slice(); stopRest(); if (done && done.length) { SESS.done = []; SESS.sets = done.length; SESS.done = done; finishFromRest(done); } };
function finishFromRest(done) {
  const last = done[done.length - 1], tot = done.reduce((s, x) => s + x.n, 0), bad = done.reduce((s, x) => s + x.bad, 0);
  const agg = { ...last, n: tot, bad, tech: tot + bad ? Math.round(tot / (tot + bad) * 100) : 0, secs: done.reduce((s, x) => s + x.secs, 0), attempts: done.flatMap(x => x.attempts), sets: done.map(x => ({n:x.n,bad:x.bad,tech:x.tech})), goal: false };
  SESS = null; disarmBackGuard(); stopCamera(); if (tot > 0) { markToday(); saveHistory(agg); } showSummary(agg);
}

/* ---------- history (localStorage) ---------- */
const getHist = () => { try { return JSON.parse(localStorage.getItem('cf_history') || '[]'); } catch { return []; } };
function saveHistory(r) { const h = getHist(); h.push({ d: Date.now(), ex: r.ex, n: r.n, tech: r.tech, secs: Math.round(r.secs), sets: r.sets ? r.sets.length : 1 }); localStorage.setItem('cf_history', JSON.stringify(h.slice(-300))); }
function openHistory() {
  const h = getHist().slice().reverse(), L = t();
  $('histList').innerHTML = h.length ? h.slice(0, 30).map(x => {
    const d = new Date(x.d), dt = d.toLocaleDateString(cfg.lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
    const hold = EXERCISES[x.ex].kind === 'hold';
    return `<div class="hrow"><div><b>${L.ex[x.ex] ? L.ex[x.ex][0] : x.ex}</b><span>${dt} · ${Math.floor(x.secs / 60)}:${String(x.secs % 60).padStart(2, '0')}${x.sets > 1 ? ' · ' + x.sets + '×' : ''}</span></div>
      <div class="hval"><b>${x.n}${hold ? ' ' + L.sec : ''}</b><span class="${x.tech >= 90 ? 'lime' : x.tech >= 70 ? 'amber' : 'red'}">${x.tech}%</span></div></div>`;
  }).join('') : `<p class="dim" style="padding:14px 0">${L.noHist}</p>`;
  $('histChart').innerHTML = chartSvg(getHist().filter(x => x.ex === cfg.ex));
  $('histEx').textContent = L.ex[cfg.ex][0]; $('sheetHist').classList.add('show');
}
function chartSvg(rows) {
  if (!rows.length) return '';
  const r = rows.slice(-14), W0 = 320, H = 110, max = Math.max(...r.map(x => x.n), 1);
  const bw = Math.min(20, (W0 - 20) / r.length - 6);
  return `<svg viewBox="0 0 ${W0} ${H}" class="chart"><line x1="6" y1="${H - 22}" x2="${W0 - 6}" y2="${H - 22}" stroke="#2a2d29"/>` + r.map((x, i) => {
    const cx = 12 + i * ((W0 - 24) / r.length), h = Math.max(3, x.n / max * (H - 46));
    return `<rect x="${cx - bw / 2}" y="${H - 22 - h}" width="${bw}" height="${h}" rx="3" fill="${x.tech >= 90 ? '#C6FF00' : x.tech >= 70 ? '#FFC23A' : '#FF4D5E'}"/>
      <text x="${cx}" y="${H - 26 - h}" text-anchor="middle" fill="rgba(244,244,238,.8)" font-size="10" font-family="Montserrat" font-weight="700">${x.n}</text>
      <text x="${cx}" y="${H - 6}" text-anchor="middle" fill="rgba(244,244,238,.45)" font-size="8" font-family="Manrope">${new Date(x.d).getDate()}.${new Date(x.d).getMonth() + 1}</text>`;
  }).join('') + '</svg>';
}

/* ---------- story image 1080x1920 ---------- */
function storyCanvas(res) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  const hold = EXERCISES[res.ex].kind === 'hold', L = t();
  x.fillStyle = '#060706'; x.fillRect(0, 0, 1080, 1920);
  const g = x.createRadialGradient(540, 700, 60, 540, 700, 900); g.addColorStop(0, 'rgba(198,255,0,.16)'); g.addColorStop(1, 'rgba(198,255,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  x.strokeStyle = 'rgba(198,255,0,.25)'; x.lineWidth = 3; x.strokeRect(48, 48, 984, 1824);
  x.fillStyle = '#C6FF00'; x.beginPath(); x.arc(96, 128, 12, 0, 7); x.fill();
  x.font = '800 34px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE'; x.fillText('CALISTHENICS FLOW', 126, 142);
  x.textAlign = 'center';
  x.font = '800 40px Montserrat, sans-serif'; x.fillStyle = 'rgba(244,244,238,.7)'; x.fillText(L.ex[res.ex][0].toUpperCase(), 540, 460);
  x.font = '900 420px Montserrat, sans-serif'; x.fillStyle = '#C6FF00'; x.fillText(String(res.n), 540, 860);
  x.font = '800 54px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE';
  let unit = L.ex[res.ex][1].toUpperCase(); if (x.measureText(unit).width > 920) { x.font = '800 38px Montserrat, sans-serif'; } x.fillText(unit, 540, 950);
  x.font = '900 150px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE'; x.fillText(res.tech + '%', 540, 1180);
  x.font = '700 36px Montserrat, sans-serif'; x.fillStyle = 'rgba(244,244,238,.6)'; x.fillText(L.technique.toUpperCase() + ' · ' + L.techWord(res.tech).toUpperCase(), 540, 1240);
  if (res.sets && res.sets.length > 1) { x.font = '700 40px Montserrat, sans-serif'; x.fillStyle = '#C6FF00'; x.fillText(res.sets.map(s => s.n).join(' + '), 540, 1350); }
  x.fillStyle = 'rgba(244,244,238,.12)'; x.fillRect(140, 1450, 800, 2);
  x.font = '900 92px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE'; x.fillText('@calistenics_flow', 540, 1610);
  x.font = '600 36px Manrope, sans-serif'; x.fillStyle = 'rgba(244,244,238,.55)';
  x.fillText('AI Coach · ' + new Date().toLocaleDateString(cfg.lang === 'ru' ? 'ru-RU' : 'en-US'), 540, 1680);
  return c;
}
function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
async function shareStory() {
  const r = lastRes; if (!r) return; const c = storyCanvas(r);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  const file = new File([blob], `calisthenics-flow-${r.ex}.png`, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Calisthenics Flow' });
    else download(URL.createObjectURL(blob), file.name); toast(t().shared);
  } catch (e) { if (e.name !== 'AbortError') { download(URL.createObjectURL(blob), file.name); } }
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }

/* ---------- video recording: canvas (video + skeleton) -> MediaRecorder -> share/download ---------- */
let rec = null, recBlob = null, recT = 0;
const recSupported = () => typeof window.MediaRecorder === 'function' && typeof cv.captureStream === 'function';
function recMime() {
  if (!recSupported()) return null;
  for (const m of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'])
    if (MediaRecorder.isTypeSupported(m)) return m;
  return null;
}
function resetRecUi() { $('recBtn').classList.remove('on'); $('recBtn').textContent = '●'; $('recInd').classList.remove('show'); $('recTime').textContent = ''; }
function toggleRec() {
  if (rec) { stopRec(); return; }
  const mime = recMime();
  if (!mime) { toast(t().recUnsup); return; }
  try {
    recBlob = null; $('recSave').classList.remove('show');
    const st = cv.captureStream(30), mr = new MediaRecorder(st, { mimeType: mime, videoBitsPerSecond: 5_000_000 }), chunks = [];
    rec = mr; mr.elapsed = 0; mr.lastTick = 0;
    mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      if (chunks.length) { recBlob = new Blob(chunks, { type: mr.mimeType.split(';')[0] }); $('recSave').classList.add('show'); }
      st.getTracks().forEach(tr => tr.stop()); if (rec === mr) rec = null; resetRecUi();
    };
    mr.onerror = () => { toast(t().recErr); if (rec === mr) stopRec(); };
    mr.start(500); $('recBtn').classList.add('on'); $('recBtn').textContent = '■'; $('recInd').classList.add('show');
  } catch (e) { rec = null; resetRecUi(); toast(t().recErr + ': ' + (e.message || e)); }
}
function stopRec() { if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch { resetRecUi(); } } }
function recFrame(now) {
  if (!rec || rec.state !== 'recording') return;
  if (rec.lastTick) rec.elapsed += now - rec.lastTick; rec.lastTick = now;
  if (now - recT > 200) { recT = now; $('recTime').textContent = Math.round(rec.elapsed / 1000) + 's'; }
}
function recOverlay(r) { // burn counter + brand into the recorded canvas (not the HUD DOM)
  if (!rec) return; const dpr = cv.width / innerWidth;
  ctx.save(); ctx.font = `900 ${64 * dpr}px Montserrat, sans-serif`; ctx.fillStyle = '#F4F4EE';
  ctx.fillText(String(r.reps != null && EXERCISES[W.ex].kind === 'hold' ? Math.floor(r.holdGood) : r.reps || 0), 20 * dpr, 90 * dpr);
  ctx.font = `800 ${20 * dpr}px Montserrat, sans-serif`; ctx.fillStyle = '#C6FF00'; ctx.fillText('@calistenics_flow', 20 * dpr, cv.height - 24 * dpr);
  ctx.restore();
}
async function saveRec() {
  if (!recBlob) return;
  const ext = recBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([recBlob], `calisthenics-flow-${Date.now()}.${ext}`, { type: recBlob.type });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file] });
    else { download(URL.createObjectURL(recBlob), file.name); toast(t().videoSaved); }
  } catch (e) { if (e.name !== 'AbortError') download(URL.createObjectURL(recBlob), file.name); }
}

/* ---------- back / tab-leave guard: pause, never lose the set silently ---------- */
let backArmed = false;
function armBackGuard() { if (backArmed) return; backArmed = true; try { history.pushState({ cfWork: 1 }, ''); } catch {} }
function disarmBackGuard() { if (!backArmed) return; backArmed = false; try { if (history.state && history.state.cfWork) history.replaceState(null, ''); } catch {} }
window.addEventListener('popstate', () => {
  if (starting || (W && !W.finished) || (SESS && $('rest').classList.contains('show'))) { backArmed = false; armBackGuard(); pauseWorkout(); }
  else backArmed = false;
});
document.addEventListener('visibilitychange', () => { if (document.hidden && (starting || (W && !W.finished) || (SESS && $('rest').classList.contains('show')))) pauseWorkout(); });
function pauseWorkout() {
  if (starting && !W) { $('pauseQ').textContent = t().exitQ; $('pauseSub').textContent = t().exitSub; $('pauseStay').textContent = t().exitStay; $('pauseGo').textContent = t().exitLeave; $('pause').classList.add('show'); return; }
  const resting = !W && SESS && $('rest').classList.contains('show');
  if (resting) {
    if (restPaused) return;
    restPaused = true; clearInterval(restTimer); restTimer = 0; stopVoice();
  } else {
    if (!W || W.paused || W.finished) return;
    W.paused = true; W.pausedAt = performance.now(); stopVoice(); if (rec?.state === 'recording') { try { rec.pause(); } catch {} }
  }
  $('pauseQ').textContent = t().exitQ; $('pauseSub').textContent = t().exitSub;
  $('pauseStay').textContent = t().exitStay; $('pauseGo').textContent = t().exitLeave;
  $('pause').classList.add('show');
}
function resumeWorkout() {
  if (starting && !W) { $('pause').classList.remove('show'); return; }
  if (!W && restPaused && SESS) { restPaused = false; $('pause').classList.remove('show'); runRestTimer(); return; }
  if (!W) return;
  W.pauseT = (W.pauseT || 0) + (performance.now() - (W.pausedAt || performance.now()));
  if (W.engine && W.engine.state) W.engine.state.lastT = null;  // avoid a giant dt after the pause
  W.paused = false; W.lastVideoT = -1; if (rec?.state === 'paused') { try { rec.resume(); rec.lastTick = performance.now(); } catch {} } $('pause').classList.remove('show');
  if (vid.srcObject) vid.play().catch(() => {});
}
$('pauseStay').onclick = resumeWorkout;
$('pauseGo').onclick = () => {
  $('pause').classList.remove('show');
  if (starting && !W) { startSeq++; starting = false; SESS = null; stopCamera(); disarmBackGuard(); stopVoice(); show('home'); return; }
  if (W) { W.paused = false; finish(false); }
  else if (restPaused && SESS) { const done = SESS.done.slice(); stopRest(); if (done.length) finishFromRest(done); else { SESS = null; disarmBackGuard(); show('home'); } }
};

let lastRes = null;
function showSummary(res) {
  lastRes = res; const hold = EXERCISES[res.ex].kind === 'hold';
  const empty = !res.n && !res.bad && res.secs < 2;
  $('sEyebrow').textContent = empty ? t().notStarted : res.goal ? t().goalDone : t().done;
  $('sNum').textContent = res.n; $('sLabel').textContent = t().ex[res.ex][1];
  $('sTech').textContent = res.tech + '%'; $('sTechW').textContent = empty ? t().notStartedSub : t().techWord(res.tech);
  $('sBad').textContent = hold ? res.bad + ' ' + t().sec : res.bad;
  document.querySelector('[data-i="uncountedSub"]').textContent = hold ? t().uncountedSubHold : t().uncountedSub;
  $('sStreak').textContent = getStreak(); const m = Math.floor(res.secs / 60), s = Math.round(res.secs % 60);
  $('sTime').textContent = `${m}:${String(s).padStart(2, '0')}`;
  $('sDots').innerHTML = res.attempts.map(a => `<i class="${a}"></i>`).join('');
  $('sSets').innerHTML = res.sets && res.sets.length > 1 ? res.sets.map((x, i) => `<div class="setrow"><span>${t().setOf(i + 1, res.sets.length)}</span><b>${x.n}</b><span class="dim">${x.tech}%</span></div>`).join('') : '';
  if (recBlob) $('recSave').classList.add('show');
  show('sum');
}

async function share() {
  const r = lastRes; if (!r) return;
  const txt = `${r.n} ${t().ex[r.ex][1]} · ${t().technique} ${r.tech}% · Calisthenics Flow AI Coach @calistenics_flow`;
  try { if (navigator.share) await navigator.share({ title: 'Calisthenics Flow', text: txt, url: location.href }); else { await navigator.clipboard.writeText(txt + ' ' + location.href); $('shareBtn').textContent = '✓'; setTimeout(applyLang, 1200); } } catch {}
}

/* ---------- wire ---------- */
function renderSettings() {
  document.querySelectorAll('#sheet [data-set]').forEach(b => { const [k, v] = b.dataset.set.split(':');
    const cur = k === 'lang' ? cfg.lang : k === 'level' ? cfg.level : k === 'voice' ? String(cfg.voice) : k === 'debug' ? String(cfg.debug) : k === 'model' ? cfg.model : cfg.voices[k]; b.classList.toggle('sel', cur === v); });
}
document.querySelectorAll('#sheet [data-set]').forEach(b => b.onclick = () => {
  unlockAudio(); const [k, v] = b.dataset.set.split(':');
  if (k === 'lang') cfg.lang = v; else if (k === 'level') cfg.level = v; else if (k === 'voice') cfg.voice = v === 'true'; else if (k === 'debug') cfg.debug = v === 'true'; else if (k === 'model') { cfg.model = v; loadModel(v).catch(() => {}); } else cfg.voices[k] = v;
  save(); applyLang(); renderSettings();
  if (k === 'ru' || k === 'en') { const l = cfg.lang; cfg.lang = k; say(['s_great'], k === 'ru' ? 'Отличная работа!' : 'Great work!', { force: true }); cfg.lang = l; }
});
$('langBtn').onclick = () => { cfg.lang = cfg.lang === 'ru' ? 'en' : 'ru'; save(); applyLang(); };
$('setBtn').onclick = () => { unlockAudio(); renderSettings(); $('sheet').classList.add('show'); };
$('sheetClose').onclick = () => $('sheet').classList.remove('show');
$('sheet').onclick = e => { if (e.target.id === 'sheet') $('sheet').classList.remove('show'); };
$('previewBtn').onclick = () => { unlockAudio(); say(['n3', 'n2', 'n1', 'go'], '3 2 1 ' + t().go, { force: true }); };
$('voiceBtn').onclick = () => { unlockAudio(); cfg.voice = !cfg.voice; save(); applyLang(); };
$('camBtn').onclick = () => { cfg.front = !cfg.front; save(); applyLang(); };
$('tMinus').onclick = () => step(-1); $('tPlus').onclick = () => step(1);
$('sMinus').onclick = () => stepSets(-1); $('sPlus').onclick = () => stepSets(1);
$('rMinus').onclick = () => stepRest(-1); $('rPlus').onclick = () => stepRest(1);
$('startBtn').onclick = preStart; $('againBtn').onclick = preStart;
$('homeBtn').onclick = () => { SESS = null; disarmBackGuard(); applyLang(); renderStreak(); show('home'); };
$('shareBtn').onclick = share;
$('storyBtn').onclick = shareStory;
$('recBtn').onclick = toggleRec;
$('recSave').onclick = saveRec;
$('histBtn').onclick = openHistory; $('histSum').onclick = openHistory;
$('histClose').onclick = () => $('sheetHist').classList.remove('show');
$('histClear').onclick = () => { localStorage.removeItem('cf_history'); openHistory(); };
$('finishBtn').onclick = () => finish(false);
$('quitBtn').onclick = () => { if (starting && !W) pauseWorkout(); else if (W && !W.finished) pauseWorkout(); else { stopRest(); SESS = null; disarmBackGuard(); stopCamera(); W = null; stopVoice(); applyLang(); show('home'); } };
$('muteBtn').onclick = () => { voiceOn = !voiceOn; $('muteBtn').textContent = voiceOn ? '🔊' : '🔈'; if (!voiceOn) stopVoice(); };
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
document.addEventListener('touchend', unlockAudio, { once: true }); document.addEventListener('click', unlockAudio, { once: true });
applyLang();
loadModel().catch(() => {}); // warm up in background
