import { createEngine, visibility, EXERCISES, FAULTS, STRICT, BEST_VIEW } from './engine.js?v=4.0';
import { createFeedbackGate } from './feedback.js?v=4.0';
import { migrateSettings, videoConstraints, qualityReport, emptyClip, rateFromStamps } from './settings.js?v=4.0';
import { sanitizeRoutine, moveItem, afterSet, summarize } from './routine.js?v=4.0';

export const APP_VERSION = '4.0';
const BAD_CUES = new Set(FAULTS);
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(j => {
  if (j.v && j.v !== APP_VERSION) { const k = 'cf_reload_' + j.v; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); location.replace(location.pathname + '?v=' + j.v + '&t=' + Date.now()); } }
}).catch(() => {});

const T = {
  ru: {
    title:'Your pocket trainer', subtitle:'Считает только чистые повторы. Видео не покидает телефон. Техника строгая — распознавание не идеальное.',
    target:'Цель', start:'Начать', finish:'Завершить', loading:'Загружаю модель…', technique:'Техника', uncounted:'Не засчитано',
    uncountedSub:'неглубоко, не до конца или ошибка формы', uncountedSubHold:'время с ошибкой формы',
    streak:'Серия', streakSub:'дней подряд', time:'Время', timeSub:'вся тренировка', clean:'чисто', error:'ошибка', share:'Поделиться', again:'Ещё раз', home:'На главную',
    of:'из', sec:'сек', reps:'повт.', goalDone:'Цель выполнена', done:'Тренировка завершена', go:'Начали!', streakHome:n=>`Серия: ${n} дн. подряд`,
    techWord:p=>p>=90?'Отлично':p>=70?'Хорошо':'Есть над чем работать',
    rec:'Запись', recStart:'Начать запись', recStop:'Остановить запись', recOn:'Идёт запись', recSave:'Сохранить видео',
    recUnsup:'Запись не поддерживается в этом браузере', recErr:'Не удалось начать запись', recEmpty:'Слишком короткая запись — предыдущие ролики на месте',
    history:'История', noHist:'Пока пусто — закончи первую тренировку', chart:'Прогресс', clearHist:'Очистить историю',
    sets:'Подходы', rest:'Отдых', restNow:'ОТДЫХ', nextSet:'Следующий подход', setOf:(a,b)=>`Подход ${a} из ${b}`, setDone:'Подход завершён',
    exOf:(a,b)=>`Упражнение ${a} из ${b}`, nextEx:'Дальше', exercises:'упражнений', setup:'Подготовка',
    build:'Собрать тренировку', buildTitle:'Тренировка', buildSub:'Порядок, подходы, повторы или секунды, отдых. Хранится на телефоне.',
    addEx:'Добавить', startRoutine:'Начать тренировку', emptyRoutine:'Добавь хотя бы одно упражнение.', up:'Выше', down:'Ниже', remove:'Убрать',
    repsShort:'Повторы', secShort:'Секунды', restShort:'Отдых',
    exitQ:'Выйти?', exitSub:'Сделанное сохранится', exitStay:'Остаться', exitLeave:'Выйти',
    notStarted:'Тренировка не началась', notStartedSub:'Не удалось встать в позицию. Проверь камеру и попробуй ещё раз.',
    story:'Картинка для сторис', shared:'Готово',
    calNoBody:'Встань в кадр — отойди на 2–3 м от телефона', calMissing:p=>`Не видно: ${p}. Отойди дальше и повернись боком`,
    calSide:'Поставь телефон сбоку, на уровне пояса — нужен профиль', calOk:'Отлично, стой спокойно…', calBody:'Всё тело должно помещаться в кадр',
    hsSide:'Поставь камеру строго сбоку — так проверяется линия тела', restSkip:'Дальше', videoSaved:'Файл скачан на это устройство',
    parts:{s:'плечи',e:'локти',w:'кисти',h:'таз',k:'колени',a:'стопы'},
    ex:{pushup:['Отжимания','отжиманий'],pullup:['Подтягивания','подтягиваний'],squat:['Приседания','приседаний'],dip:['Брусья','отжиманий на брусьях'],plank:['Планка','сек в планке'],hollow:['Hollow body','сек в hollow'],handstand:['Стойка на руках','сек в стойке'],lsit:['L-sit','сек в L-sit'],row:['Австралийские подтягивания','австралийских подтягиваний'],lunge:['Выпады','выпадов']},
    exSub:{pushup:'сбоку, телефон на полу',pullup:'сбоку или спереди',squat:'сбоку, во весь рост',dip:'сбоку, во весь рост',plank:'удержание, линия тела',hollow:'удержание, лодочка',handstand:'удержание, линия',lsit:'удержание, ноги прямые',row:'горизонтально, низкая перекладина',lunge:'сбоку, во весь рост'},
    hint:{pushup:'Телефон на полу <b>сбоку</b>, 1,5–2 м. Если не помещаешься — положи его горизонтально.',pullup:'Поставь телефон в 2–3 м, чтобы были видны перекладина и руки.',
      squat:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.',dip:'Телефон <b>сбоку</b> в 2–3 м, видно плечи, локти и таз.',plank:'Телефон на полу <b>сбоку</b>, 1,5–2 м.',hollow:'Телефон на полу <b>сбоку</b>, 1,5–2 м, лёжа на спине.',handstand:'Телефон <b>сбоку</b>, 2–3 м, видно всё тело — от кистей до стоп.',lsit:'Телефон <b>сбоку</b> на полу, 1,5–2 м. Руки на полу или на паралетсах.',row:'Телефон <b>сбоку</b>, 2–3 м, низкая перекладина или стол. Тело одной линией.',lunge:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.'},
    cue:{clean:'Чисто!',go_lower:'Ниже!',deeper:'Глубже: таз до колен',dip_lower:'Ниже: плечи до локтей',lockout:'Выпрями руки до конца',full_hang:'Полный вис внизу',chin_over:'Подбородок над перекладиной',no_kipping:'Без рывка ногами',no_swing:'Не раскачивайся',stand_tall:'Встань до конца',chest_up:'Грудь вверх',knees_out:'Колени наружу',hips_high:'Таз слишком высоко',hips_sag:'Таз провис',elbows_in:'Локти ближе к корпусу',hands_under:'Ладони под плечами',shoulders_over_elbows:'Плечи над локтями',shoulders_over_wrists:'Плечи над запястьями',legs_lower:'Опусти ноги ниже',legs_up:'Ноги от пола',shoulders_up:'Лопатки от пола',straight_arms:'Выпрями руки в локтях',open_shoulders:'Открой плечи',no_banana:'Не прогибайся',hs_line:'Выстрой линию',legs_straight:'Выпрями ноги',hips_up_ls:'Подними таз',back_straight:'Спина прямая',knees_forward:'Колени над носками',lean_back:'Отклонись назад',rest:'Отдых',set:'Подход',pause:'Пауза. Нажми продолжить',hold:'Держи',lost:'Не вижу тебя',pos:'Займи позицию',lsit_position:'Подними таз и прямые ноги над полом',not_hollow:'Ляг на спину и оторви лопатки и ноги',not_plank:'Опустись в планку: тело одной линией',not_pullup:'Это австралийское подтягивание: повисни вертикально и оторви ноги',feet_support:'Убери ноги с опоры',knees_down:'Отожмись на носках, без колен на полу',whole_body:'Опускай всё тело, а не только таз или голову',knees_wide:'Колени над стопами, не разводи слишком широко',heels_up:'Не отрывай пятки',lunge_knees:'Согни обе ноги',lunge_step:'Сделай шаг вперёд или назад — это выпад',not_squat:'Это приседание, а не выпад: сделай шаг вперёд или назад',not_lunge:'Это выпад, а не приседание: ноги должны стоять рядом'},
    settings:'Настройки', language:'Язык', voiceOne:'Голос', male:'Мужской', female:'Женский', voiceNote:'Один выбор для русского и английского.',
    voiceOn:'Голосовые подсказки', preview:'Прослушать', close:'Готово', debug:'Отладка (углы на экране)', version:'Версия',
    model:'Модель позы', mLite:'Быстрая', mFull:'Стандарт', mHeavy:'Макс', fellBack:'Медленно — включаю быструю модель',
    views:{side:'Сбоку',d34:'3/4',front:'Спереди'}, better:'лучше', checksAll:'амплитуда', noChecks:'только время, форма не проверяется',
    ck:{hips_sag:'провис таза',hips_high:'таз высоко',hands_under:'ладони',elbows_in:'локти',chest_up:'грудь',knees_out:'колени',no_kipping:'без рывка',no_swing:'раскачка',shoulders_over_wrists:'плечи/кисти',shoulders_over_elbows:'плечи/локти',legs_lower:'ноги',legs_up:'ноги от пола',shoulders_up:'лопатки',straight_arms:'прямые руки',open_shoulders:'плечи',no_banana:'прогиб',hs_line:'линия',legs_straight:'прямые ноги',hips_up_ls:'таз',back_straight:'спина',lockout:'локти',lsit_position:'позиция',not_hollow:'позиция',not_plank:'позиция',not_pullup:'вертикальный вис',feet_support:'опора ног',knees_down:'колени',whole_body:'всё тело',knees_wide:'ширина колен',heels_up:'пятки',lunge_knees:'оба колена',lunge_step:'шаг',not_squat:'шаг при выпаде',not_lunge:'симметрия ног'},
    tipTitle:'Поставь камеру так', topDown:'ВИД СВЕРХУ', phoneLabel:'ТЕЛЕФОН', facingLabel:'ЛИЦО', sideHit:'Камера видит БОК', frontHit:'Камера видит ЛИЦО', d34Hit:'Камера видит ЛИЦО И БОК',
    gotIt:'Понятно, начать', tView:'Ракурс', tHeight:'Высота камеры', tDist:'Расстояние', tFrame:'Всё тело в кадре — от кистей до стоп',
    hFloor:'на полу', hWaist:'на уровне пояса', hChest:'на уровне груди', hKnee:'на уровне колена',
    vSide:'строго сбоку (профиль)', vFront:'спереди или сзади', v34:'по диагонали (3/4)',
    tipNote:{d34:'Телефон по диагонали: в кадре и лицо, и бок.',side:'Камера стоит сбоку и смотрит в плечо. Спереди линия тела не проверяется.',front:'Камера стоит перед лицом. Сбоку добавится контроль раскачки.'},
    say:{halfway:'Половина',last:'Последний!',done:'Готово!',summary:(n,p,b)=>`${n} чистых. Техника ${p} процентов.${b?` Не засчитано: ${b}.`:''}`},
    camRear:'Основная', camFront:'Фронт', camera:'Камера', soundOn:'Звук включён', soundOff:'Звук выключен',
    camRes:'Разрешение', camFps:'Кадры в секунду',
    camNote:'Браузер не забирает настройки приложения «Камера». Здесь запрос 720p или 1080p и 30 или 60 кадров. Ниже — что реально открылось. Если режима нет, будет ближайший.',
    qAsk:'запрос', qFallback:'это ближайший доступный режим, не запрошенный',
    overlay:'Картинка записи', overlayOn:'С линиями', overlayOff:'Только камера',
    strictNote:'Техника всегда строгая: небольшой допуск на шум камеры и на угол. Небольшое отклонение L-sit от горизонта ещё считается, большое — нет. Это не идеальное распознавание.',
    saveShare:'Поделиться', saveDown:'Скачать', savePrev:'Другая запись', saveTitle:'Запись',
    saveNote:'Ролик остаётся на телефоне и никуда не отправляется. На iPhone нажми «Поделиться» и сохрани в «Файлы». Браузер не умеет сам положить видео в «Фото». Если шаринга нет — «Скачать».',
    saveMic:'В ролике есть микрофон.', saveNoMic:'Микрофон не пишется: доступ запрещён или его нет. В файле только видео, подсказки остаются в динамике. Ролик всё равно сохраняется.',
    saveCoach:'Голос тренера добавляется в файл, только если браузер умеет захватывать звук страницы. На части iPhone в ролик попадает лишь микрофон — тогда подсказки слышно, если играет динамик.',
    back:'Назад',
  },
  en: {
    title:'Your pocket trainer', subtitle:'Counts only clean reps. Video never leaves your phone. Technique is strict — detection is not perfect.',
    target:'Target', start:'Start', finish:'Finish', loading:'Loading model…', technique:'Technique', uncounted:'Not counted',
    uncountedSub:'too shallow, no lockout or form error', uncountedSubHold:'time with a form error',
    streak:'Streak', streakSub:'days in a row', time:'Time', timeSub:'whole workout', clean:'clean', error:'error', share:'Share', again:'Again', home:'Home',
    of:'of', sec:'sec', reps:'reps', goalDone:'Goal complete', done:'Workout complete', go:'Go!', streakHome:n=>`Streak: ${n} day${n>1?'s':''} in a row`,
    techWord:p=>p>=90?'Excellent':p>=70?'Good':'Room to improve',
    rec:'Record', recStart:'Start recording', recStop:'Stop recording', recOn:'Recording', recSave:'Save video',
    recUnsup:'Recording is not supported in this browser', recErr:'Could not start recording', recEmpty:'That clip was too short — earlier recordings are kept',
    history:'History', noHist:'Empty so far — finish your first workout', chart:'Progress', clearHist:'Clear history',
    sets:'Sets', rest:'Rest', restNow:'REST', nextSet:'Next set', setOf:(a,b)=>`Set ${a} of ${b}`, setDone:'Set complete',
    exOf:(a,b)=>`Exercise ${a} of ${b}`, nextEx:'Next', exercises:'exercises', setup:'Setup',
    build:'Build routine', buildTitle:'Routine', buildSub:'Order, sets, reps or seconds, rest. Stored on this phone.',
    addEx:'Add', startRoutine:'Start routine', emptyRoutine:'Add at least one exercise.', up:'Up', down:'Down', remove:'Remove',
    repsShort:'Reps', secShort:'Seconds', restShort:'Rest',
    exitQ:'Exit?', exitSub:'What you already did will be saved', exitStay:'Stay', exitLeave:'Exit',
    notStarted:'Workout never started', notStartedSub:'Could not get into position. Check the camera and try again.',
    story:'Story image', shared:'Done',
    calNoBody:'Step into the frame — stand 2–3 m from the phone', calMissing:p=>`Can't see: ${p}. Step back and turn sideways`,
    calSide:'Put the phone at your side, waist height — a profile view is needed', calOk:'Great, hold still…', calBody:'Your whole body must fit in the frame',
    hsSide:'Place the camera strictly to the side — that is how the body line is checked', restSkip:'Next', videoSaved:'File downloaded on this device',
    parts:{s:'shoulders',e:'elbows',w:'wrists',h:'hips',k:'knees',a:'feet'},
    ex:{pushup:['Push-ups','push-ups'],pullup:['Pull-ups','pull-ups'],squat:['Squats','squats'],dip:['Dips','dips'],plank:['Plank','sec plank'],hollow:['Hollow body','sec hollow'],handstand:['Handstand','sec handstand'],lsit:['L-sit','sec L-sit'],row:['Australian pull-ups','body rows'],lunge:['Lunges','lunges']},
    exSub:{pushup:'side view, phone on floor',pullup:'side or front view',squat:'side view, full body',dip:'side view, full body',plank:'hold, body line',hollow:'hold, banana shape',handstand:'hold, straight line',lsit:'hold, straight legs',row:'horizontal, low bar',lunge:'side view, full body'},
    hint:{pushup:'Phone on the floor, <b>side view</b>, 1.5–2 m away. If you don\'t fit, turn it landscape.',pullup:'Place the phone 2–3 m away so the bar and your arms are visible.',
      squat:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.',dip:'Phone <b>side view</b>, 2–3 m, shoulders, elbows and hips visible.',plank:'Phone on the floor, <b>side view</b>, 1.5–2 m.',hollow:'Phone on the floor, <b>side view</b>, 1.5–2 m, lying on your back.',handstand:'Phone <b>side view</b>, 2–3 m, full body visible — hands to feet.',lsit:'Phone on the floor, <b>side view</b>, 1.5–2 m. Hands on the floor or parallettes.',row:'Phone <b>side view</b>, 2–3 m, low bar or table. Keep your body in one line.',lunge:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.'},
    cue:{clean:'Clean!',go_lower:'Go lower',deeper:'Deeper: hips to knees',dip_lower:'Lower: shoulders to elbows',lockout:'Lock out arms',full_hang:'Full hang',chin_over:'Chin over bar',no_kipping:'No kipping',no_swing:'Stop swinging',stand_tall:'Stand tall',chest_up:'Chest up',knees_out:'Knees out',hips_high:'Hips too high',hips_sag:'Hips sagging',elbows_in:'Elbows in',hands_under:'Hands under shoulders',shoulders_over_elbows:'Shoulders over elbows',shoulders_over_wrists:'Shoulders over wrists',legs_lower:'Lower your legs',legs_up:'Lift your legs',shoulders_up:'Shoulders off floor',straight_arms:'Lock your elbows',open_shoulders:'Open shoulders',no_banana:'No banana back',hs_line:'Stack the line',legs_straight:'Straighten your legs',hips_up_ls:'Lift your hips',back_straight:'Back straight',knees_forward:'Knees over toes',lean_back:'Lean back',rest:'Rest',set:'Set',pause:'Paused. Tap resume',hold:'Hold',lost:'Can\'t see you',pos:'Get in position',lsit_position:'Lift your hips and straight legs off the floor',not_hollow:'Lie on your back and lift your shoulders and legs',not_plank:'Get into a plank: keep your body in one line',not_pullup:'That is a body row: hang vertically with feet off the floor',feet_support:'Take your feet off the support',knees_down:'Push up on your toes, knees off the floor',whole_body:'Lower your whole body, not just your hips or head',knees_wide:'Keep knees over feet, not too wide',heels_up:'Keep your heels down',lunge_knees:'Bend both knees',lunge_step:'Step forward or back for a lunge',not_squat:'That is a squat, not a lunge: step forward or back',not_lunge:'That is a lunge, not a squat: keep your feet together'},
    settings:'Settings', language:'Language', voiceOne:'Voice', male:'Male', female:'Female', voiceNote:'One choice for Russian and English.',
    voiceOn:'Voice cues', preview:'Preview', close:'Done', debug:'Debug (angles on screen)', version:'Version',
    model:'Pose model', mLite:'Fast', mFull:'Standard', mHeavy:'Max', fellBack:'Slow device — switching to fast model',
    views:{side:'Side',d34:'3/4',front:'Front'}, better:'best', checksAll:'range', noChecks:'time only, form not checked',
    ck:{hips_sag:'hip sag',hips_high:'hips high',hands_under:'hands',elbows_in:'elbows',chest_up:'chest',knees_out:'knees',no_kipping:'no kip',no_swing:'swing',shoulders_over_wrists:'shoulders/wrists',shoulders_over_elbows:'shoulders/elbows',legs_lower:'legs',legs_up:'legs up',shoulders_up:'shoulders up',straight_arms:'straight arms',open_shoulders:'shoulders',no_banana:'banana',hs_line:'line',legs_straight:'straight legs',hips_up_ls:'hips',back_straight:'back',lockout:'elbows',lsit_position:'position',not_hollow:'position',not_plank:'position',not_pullup:'vertical hang',feet_support:'foot support',knees_down:'knees',whole_body:'whole body',knees_wide:'knee width',heels_up:'heels',lunge_knees:'both knees',lunge_step:'step',not_squat:'lunge step',not_lunge:'leg symmetry'},
    tipTitle:'Set up the camera', topDown:'TOP-DOWN VIEW', phoneLabel:'PHONE', facingLabel:'FACE', sideHit:'Camera sees the SIDE', frontHit:'Camera sees the FACE', d34Hit:'Camera sees FACE + SIDE',
    gotIt:'Got it, start', tView:'View', tHeight:'Camera height', tDist:'Distance', tFrame:'Whole body in frame — hands to feet',
    hFloor:'on the floor', hWaist:'at waist height', hChest:'at chest height', hKnee:'at knee height',
    vSide:'straight from the side (profile)', vFront:'from the front or back', v34:'diagonal (3/4)',
    tipNote:{d34:'The phone sits on a diagonal: both the face and the side are in frame.',side:'The camera sits to the side and looks at the shoulder. From the front the body line is not checked.',front:'The camera sits in front of the face. A side view also checks swing.'},
    say:{halfway:'Halfway',last:'Last one!',done:'Done!',summary:(n,p,b)=>`${n} clean reps. Technique ${p} percent.${b?` ${b} not counted.`:''}`},
    camRear:'Rear', camFront:'Front', camera:'Camera', soundOn:'Sound on', soundOff:'Sound off',
    camRes:'Resolution', camFps:'Frame rate',
    camNote:'The browser cannot inherit the phone Camera app\'s settings. This asks for 720p or 1080p and 30 or 60 fps. The line below is the mode that actually opened. If that mode is missing, the closest one is used.',
    qAsk:'asked', qFallback:'closest available, not the mode asked for',
    overlay:'Recording picture', overlayOn:'With lines', overlayOff:'Camera only',
    strictNote:'Technique is always strict, with a small tolerance for camera noise and angle. A slight L-sit tilt off horizontal still counts; a large one does not. Detection is not perfect.',
    saveShare:'Share', saveDown:'Download', savePrev:'Other recording', saveTitle:'Recording',
    saveNote:'The clip stays on the phone and is not uploaded. On iPhone, tap Share and save to Files. The browser cannot put the video into Photos by itself. If sharing is unavailable, use Download.',
    saveMic:'Microphone is in the clip.', saveNoMic:'No microphone — permission was denied or there is no mic. The file is video only; cues stay on the speaker. The video is still saved.',
    saveCoach:'Coach audio is mixed in only when the browser can capture the page\'s sound. On some iPhones only the microphone is captured — cues are heard if the speaker is playing.',
    back:'Back',
  }
};
const T35 = {
  ru: { ex:{muscleup:['Выход силы','выходов силы'],frontlever:['Передний вис','сек в переднем висе'],backlever:['Задний вис','сек в заднем висе'],planchelean:['Планш-наклон','сек в наклоне'],hanginglegraise:['Подъёмы ног в висе','подъёмов ног'],pistolsquat:['Пистолетик','пистолетиков'],pikepushup:['Пайк-отжимания','пайк-отжиманий']},
    exSub:{muscleup:'сбоку, строгий, без рывка',frontlever:'удержание, лицом вверх',backlever:'удержание, лицом вниз',planchelean:'удержание, плечи за кистями',hanginglegraise:'сбоку, ноги до горизонта',pistolsquat:'сбоку, на одной ноге',pikepushup:'сбоку, таз высоко'},
    hint:{muscleup:'Телефон <b>сбоку</b> на уровне груди, 2–3 м, видно перекладину, кисти и всё тело. Спереди переход не виден.',frontlever:'Телефон <b>сбоку</b> на уровне груди, 2–3 м, видно от кистей до стоп.',backlever:'Телефон <b>сбоку</b> на уровне груди, 2–3 м, видно от кистей до стоп.',planchelean:'Телефон на полу <b>сбоку</b>, 1,5–2 м.',hanginglegraise:'Телефон <b>сбоку</b> на уровне груди, 2–3 м, видно перекладину и стопы.',pistolsquat:'Телефон на уровне пояса <b>сбоку</b>, 2–3 м, видно с головы до стоп.',pikepushup:'Телефон на полу <b>сбоку</b>, 1,5–2 м.'},
    cue:{not_muscleup:'Это подтягивание, а не выход силы',mu_hang:'Начинай из полного виса, без прыжка',not_frontlever:'Это задний вис, а не передний',not_backlever:'Это передний вис, а не задний',lever_level:'Тело параллельно полу',lever_pike:'Раскрой таз, не сгибайся в поясе',not_planchelean:'Это планка, а не наклон в планш: подай плечи вперёд',not_legraise:'Это подъём коленей, а не ног: держи ноги прямыми',hlr_higher:'Выше: ноги до горизонта',not_pistol:'Это приседание, а не пистолетик',pistol_foot:'Свободная нога не касается пола',not_pike:'Это обычное отжимание, а не пайк: подними таз',pike_hips:'Держи таз высоко'},
    ck:{not_muscleup:'переход',mu_hang:'старт из виса',not_frontlever:'лицом вверх',not_backlever:'лицом вниз',lever_level:'горизонт',lever_pike:'таз',not_planchelean:'наклон',not_legraise:'прямые ноги',not_pistol:'одна нога',pistol_foot:'стопа на весу',not_pike:'пайк',pike_hips:'таз высоко'},
    tipEx:{muscleup:'Только сбоку видно переход над перекладиной. Спереди переход и прямые руки вверху не проверяются.',frontlever:'Сбоку видно горизонт, прямые руки и сгиб в тазу. Задний вис отличается по направлению лица.',backlever:'Сбоку видно горизонт, прямые руки и прогиб. Передний вис отличается по направлению лица.',planchelean:'Сбоку видно, насколько плечи ушли за кисти. Без наклона это просто планка.',hanginglegraise:'Сбоку видно высоту ног, прямые ноги и раскачку.',pistolsquat:'Сбоку видно глубину и свободную ногу. Держать ногу рукой можно.',pikepushup:'Сбоку видно высоту таза: обычное отжимание не засчитается.'} },
  en: { ex:{muscleup:['Muscle-up','muscle-ups'],frontlever:['Front lever','sec front lever'],backlever:['Back lever','sec back lever'],planchelean:['Planche lean','sec planche lean'],hanginglegraise:['Hanging leg raises','leg raises'],pistolsquat:['Pistol squat','pistol squats'],pikepushup:['Pike push-ups','pike push-ups']},
    exSub:{muscleup:'side view, strict, no kip',frontlever:'hold, face up',backlever:'hold, face down',planchelean:'hold, shoulders past wrists',hanginglegraise:'side view, legs to horizontal',pistolsquat:'side view, one leg',pikepushup:'side view, hips high'},
    hint:{muscleup:'Phone <b>side view</b> at chest height, 2–3 m; bar, hands and whole body visible. The transition is not visible from the front.',frontlever:'Phone <b>side view</b> at chest height, 2–3 m, hands to feet visible.',backlever:'Phone <b>side view</b> at chest height, 2–3 m, hands to feet visible.',planchelean:'Phone on the floor, <b>side view</b>, 1.5–2 m.',hanginglegraise:'Phone <b>side view</b> at chest height, 2–3 m; bar and feet visible.',pistolsquat:'Phone at waist height, <b>side view</b>, 2–3 m, head to feet visible.',pikepushup:'Phone on the floor, <b>side view</b>, 1.5–2 m.'},
    cue:{not_muscleup:'That is a pull-up, not a muscle-up',mu_hang:'Start from a dead hang, no jumping',not_frontlever:'That is a back lever, not a front lever',not_backlever:'That is a front lever, not a back lever',lever_level:'Keep your body parallel to the floor',lever_pike:'Open your hips, do not pike',not_planchelean:'That is a plank, not a planche lean: shift your shoulders forward',not_legraise:'That is a knee raise, not a leg raise: keep your legs straight',hlr_higher:'Higher: legs to horizontal',not_pistol:'That is a squat, not a pistol squat',pistol_foot:'Keep the free foot off the floor',not_pike:'That is a regular push-up, not a pike: lift your hips',pike_hips:'Keep your hips high'},
    ck:{not_muscleup:'transition',mu_hang:'dead-hang start',not_frontlever:'face up',not_backlever:'face down',lever_level:'horizontal',lever_pike:'hips',not_planchelean:'lean',not_legraise:'straight legs',not_pistol:'one leg',pistol_foot:'free foot',not_pike:'pike',pike_hips:'hips high'},
    tipEx:{muscleup:'Only a side view shows the transition over the bar. From the front the transition and top lockout are not checked.',frontlever:'Side view checks horizontal, straight arms and piking. A back lever is told apart by which way you face.',backlever:'Side view checks horizontal, straight arms and arching. A front lever is told apart by which way you face.',planchelean:'Side view shows how far the shoulders pass the wrists. Without a lean it is just a plank.',hanginglegraise:'Side view checks leg height, straight legs and swing.',pistolsquat:'Side view checks depth and the free leg. Holding the free leg with a hand is fine.',pikepushup:'Side view checks hip height: a regular push-up is not counted.'} }
};
T35.ru.muSide = 'Поставь камеру сбоку — спереди переход над перекладиной не виден';
T35.en.muSide = 'Place the camera to the side — the transition over the bar is not visible from the front';
for (const lg of ['ru','en']) for (const [k,v] of Object.entries(T35[lg])) { if (typeof v === 'string') T[lg][k] = v; else Object.assign(T[lg][k] ??= {}, v); }

const EX_ORDER = ['pushup','pullup','squat','dip','row','lunge','plank','hollow','lsit','handstand','muscleup','frontlever','backlever','planchelean','hanginglegraise','pistolsquat','pikepushup'];
const $ = id => document.getElementById(id);
const cfg = migrateSettings((() => { try { return JSON.parse(localStorage.getItem('cf_settings') || '{}'); } catch { return {}; } })());
const routineKnown = { known: new Set(EX_ORDER), isHold: id => EXERCISES[id]?.kind === 'hold' };
let routine = sanitizeRoutine((() => { try { return JSON.parse(localStorage.getItem('cf_routine') || 'null'); } catch { return null; } })(), routineKnown);
const save = () => localStorage.setItem('cf_settings', JSON.stringify(cfg));
const saveRoutine = () => { routine = sanitizeRoutine(routine, routineKnown); localStorage.setItem('cf_routine', JSON.stringify(routine)); };
save();
const t = () => T[cfg.lang] || T.ru;
const isHold = ex => EXERCISES[ex || cfg.ex].kind === 'hold';
const nSets = () => Math.max(1, Math.min(10, cfg.sets[cfg.ex] || 1));
const fast = () => !!window.__CF_FAST__;
let lastMode = 'single';

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function applyLang() {
  document.documentElement.lang = cfg.lang;
  document.title = 'Calisthenics Flow · ' + t().title;
  document.querySelectorAll('[data-i]').forEach(el => { const v = t()[el.dataset.i]; if (typeof v === 'string') el.textContent = v; });
  $('camRear').textContent = t().camRear; $('camFront').textContent = t().camFront;
  $('camRear').setAttribute('aria-pressed', cfg.front ? 'false' : 'true');
  $('camFront').setAttribute('aria-pressed', cfg.front ? 'true' : 'false');
  $('camSeg').setAttribute('aria-label', t().camera);
  $('quitBtn').setAttribute('aria-label', t().close);
  $('setBtn').setAttribute('aria-label', t().settings);
  $('histBtn').setAttribute('aria-label', t().history);
  $('buildBtn').setAttribute('aria-label', t().buildTitle);
  $('buildBack').setAttribute('aria-label', t().back);
  $('strictNote').textContent = t().strictNote;
  $('camNote').textContent = t().camNote;
  syncSound(); syncRec(); renderEx(); renderTarget(); renderStreak(); renderBuilder();
  showQuality(lastQuality);
}
function renderEx() {
  $('exList').innerHTML = EX_ORDER.map(k => `<button type="button" class="ex ${k===cfg.ex?'sel':''}" data-k="${k}"><b>${t().ex[k][0]}</b><span>${t().exSub[k]}</span></button>`).join('');
  $('exList').querySelectorAll('.ex').forEach(b => b.onclick = () => { cfg.ex = b.dataset.k; save(); renderEx(); renderTarget(); });
}
function renderTarget() {
  $('tVal').textContent = cfg.targets[cfg.ex]; $('tUnit').textContent = isHold() ? t().sec : t().reps;
  $('sVal').textContent = nSets(); $('rVal').textContent = cfg.rest + ' ' + t().sec; $('startBtn').textContent = t().start;
}
function stepSets(d) { cfg.sets[cfg.ex] = Math.max(1, Math.min(10, nSets() + d)); save(); renderTarget(); }
function stepRest(d) { cfg.rest = Math.max(0, Math.min(300, cfg.rest + d * 10)); save(); renderTarget(); }
function step(d) { const hold = isHold(); const v = cfg.targets[cfg.ex] + d * (hold ? 5 : 1); cfg.targets[cfg.ex] = Math.max(hold?10:1, Math.min(hold?600:200, v)); save(); renderTarget(); }

const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
function getStreak() {
  const days = new Set(JSON.parse(localStorage.getItem('cf_days') || '[]'));
  let n = 0, d = new Date(); if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function markToday() { const a = new Set(JSON.parse(localStorage.getItem('cf_days') || '[]')); a.add(dayKey()); localStorage.setItem('cf_days', JSON.stringify([...a].slice(-400))); }
function renderStreak() { const n = getStreak(); $('homeStreak').textContent = n ? t().streakHome(n) : ''; }

let voiceOn = cfg.voice !== false;
const ACtx = window.AudioContext || window.webkitAudioContext;
let ac = null, gain = null, mixDest = null, playing = [], sayGen = 0, saying = false;
const bufs = new Map();
const vdir = () => `${cfg.lang}-${cfg.gender === 'f' ? 'f' : 'm'}`;
function syncSound() {
  voiceOn = !!cfg.voice;
  const b = $('muteBtn');
  b.setAttribute('aria-pressed', voiceOn ? 'true' : 'false');
  b.setAttribute('aria-label', voiceOn ? t().soundOn : t().soundOff);
}
function unlockAudio() {
  try {
    if (!ac && ACtx) { ac = new ACtx(); gain = ac.createGain(); gain.gain.value = 1; gain.connect(ac.destination); }
    if (ac && ac.state !== 'running') ac.resume();
  } catch {}
}
function ensureMix() {
  unlockAudio();
  if (!ac) return null;
  if (!mixDest) {
    mixDest = ac.createMediaStreamDestination();
    gain.connect(mixDest);
    if (micNode) { try { micNode.connect(mixDest); } catch {} }
  }
  return mixDest;
}
// A new destination every take. Chrome ends the previous mix track when that recorder stops,
// and reusing the ended track makes the next file 0 bytes.
function freshCueTrack() {
  unlockAudio();
  if (!ac) return null;
  if (mixDest) { try { gain.disconnect(mixDest); } catch {} mixDest = null; }
  ensureMix();
  const track = mixDest?.stream.getAudioTracks().find(t => t.readyState === 'live');
  if (!track) return null;
  try { return track.clone(); } catch { return track; }
}
function clip(key, dir = vdir()) {
  const id = dir + '/' + key; if (bufs.has(id)) return bufs.get(id);
  const p = fetch(`audio/${id}.mp3?v=${APP_VERSION}`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(ab => new Promise((res, rej) => (ac ? ac.decodeAudioData(ab.slice(0), res, rej) : rej()))).catch(() => { bufs.delete(id); return null; });
  bufs.set(id, p); return p;
}
function preloadVoice(target) {
  if (!ac) return;
  const keys = ['go','halfway','last','done','clean','hold','lost','pos', ...FAULTS];
  for (let i = 0; i <= Math.min(120, Math.max(10, target|0)); i++) keys.push('n' + i);
  keys.forEach(k => clip(k));
}
function stopVoice() { sayGen++; saying = false; playing.forEach(s => { try { s.stop(); } catch {} }); playing = []; try { speechSynthesis.cancel(); } catch {} }
function speakTTS(text) {
  if (!('speechSynthesis' in window) || text == null) return;
  const u = new SpeechSynthesisUtterance(String(text)); u.lang = cfg.lang === 'ru' ? 'ru-RU' : 'en-US'; u.rate = 1.05;
  const want = cfg.gender === 'f';
  const list = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(cfg.lang));
  const v = list.find(v => want ? /female|woman/i.test(v.name) : /male|man/i.test(v.name)) || list[0];
  if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
async function say(keys, text, { interrupt = true, force = false } = {}) {
  if (!force && (!cfg.voice || !voiceOn)) return;
  if (!interrupt && saying) return;
  if (interrupt) stopVoice();
  const my = ++sayGen;
  saying = true;
  if (!ac) { speakTTS(text); if (my === sayGen) saying = false; return; }
  const list = await Promise.all((keys || []).map(k => clip(k)));
  if (my !== sayGen) return;
  if (!list.length || list.some(b => !b)) { speakTTS(text); if (my === sayGen) saying = false; return; }
  let t0 = ac.currentTime + 0.02;
  const live = [];
  for (const b of list) { const s = ac.createBufferSource(); s.buffer = b; s.connect(gain); s.start(t0); live.push(s); t0 += b.duration + 0.05; }
  playing = live;
  const last = live[live.length - 1];
  if (last) last.onended = () => { if (my === sayGen) { saying = false; playing = []; } };
  else saying = false;
}
const sayNum = (n, extra = [], text = '', opt) => say(n <= 120 ? ['n' + n, ...extra] : extra, `${n}. ${text}`, opt);
let lastToneAt = 0;
function playTone(kind) {
  if (!cfg.voice || !voiceOn || !ac || !kind) return;
  const now = ac.currentTime;
  if (now - lastToneAt < 0.12) return;
  lastToneAt = now;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = kind === 'good' ? 'sine' : 'triangle';
  o.frequency.value = kind === 'good' ? 880 : 196;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(kind === 'good' ? 0.07 : 0.09, now + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'good' ? 0.09 : 0.14));
  o.connect(g); g.connect(gain);
  o.start(now); o.stop(now + 0.16);
}

let landmarker = null, lmModel = null, poseWorker = null, poseMode = '', poseReady = false, poseBusy = false, workerModel = '';
const poseStat = { frames: 0, first: 0, last: 0, ms: 0 };
function notePose(ms) {
  const tnow = performance.now();
  poseStat.frames++; if (!poseStat.first) poseStat.first = tnow; poseStat.last = tnow;
  poseStat.ms = poseStat.ms ? poseStat.ms * 0.9 + ms * 0.1 : ms;
  if (W) W.dms = poseStat.ms;
}
async function loadModel(model = cfg.model) {
  if (landmarker && lmModel === model) return landmarker;
  if (landmarker) { try { landmarker.close(); } catch {} landmarker = null; }
  const { FilesetResolver, PoseLandmarker } = await import('./mp/vision_bundle.mjs');
  const fs = await FilesetResolver.forVisionTasks(new URL('./mp/', location.href).href);
  const mk = delegate => PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: `./mp/pose_landmarker_${model}.task`, delegate }, runningMode: 'VIDEO', numPoses: 1,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
  try { landmarker = await mk('GPU'); } catch (e) { console.warn('GPU failed, CPU', e); landmarker = await mk('CPU'); }
  lmModel = model; return landmarker;
}
function startWorker(model) {
  return new Promise((resolve, reject) => {
    if (poseWorker) { try { poseWorker.terminate(); } catch {} poseWorker = null; }
    poseReady = false;
    const w = new Worker(new URL('./pose-worker.js?v=4.0', import.meta.url), { type: 'module' });
    poseWorker = w;
    const to = setTimeout(() => { try { w.terminate(); } catch {} reject(new Error('pose worker timeout')); }, 12000);
    w.onmessage = (e) => {
      const d = e.data || {};
      if (d.type === 'ready') { clearTimeout(to); poseReady = true; workerModel = d.model; lmModel = d.model; resolve(d.model); }
      else if (d.type === 'pose') onWorkerPose(d);
      else if (d.type === 'error') { poseBusy = false; if (!poseReady) { clearTimeout(to); reject(new Error(d.message || 'worker')); } }
    };
    w.onerror = (err) => { clearTimeout(to); poseBusy = false; reject(err.error || err); };
    w.postMessage({ type: 'init', model });
  });
}
async function ensurePose() {
  if (window.__CF_MOCK_POSE__) { poseMode = 'mock'; poseReady = true; return; }
  if (poseMode === 'worker' && poseReady && workerModel === cfg.model) return;
  try { await startWorker(cfg.model); poseMode = 'worker'; }
  catch (e) { console.warn('pose worker unavailable', e); poseMode = 'main'; await loadModel(cfg.model); }
}

const cv = $('cv'), ctx = cv.getContext('2d'), vid = $('vid');
let recCv = document.createElement('canvas'), rctx = recCv.getContext('2d', { alpha: false });
let stream = null, runId = 0, frameArmed = false, W = null, wakeLock = null, startSeq = 0, starting = false, lastQuality = null;
let SESS = null, fb = null;
const BONES = [[11,13],[13,15],[12,14],[14,16],[11,12],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const COLORS = { good:'#C6FF00', warn:'#FFC23A', bad:'#FF4D5E', idle:'rgba(244,244,238,.55)', lost:'rgba(244,244,238,.35)' };
const KEY = [11,12,15,16,23,24,27,28];
const rc = document.createElement('canvas'), rcx = rc.getContext('2d');
function rotatedFrame() {
  const sc = Math.min(1, 960 / Math.max(vid.videoWidth, vid.videoHeight || 1));
  const w = Math.max(2, Math.round(vid.videoWidth * sc)), h = Math.max(2, Math.round(vid.videoHeight * sc));
  if (rc.width !== w || rc.height !== h) { rc.width = w; rc.height = h; }
  rcx.setTransform(-1, 0, 0, -1, w, h); rcx.drawImage(vid, 0, 0, w, h); rcx.setTransform(1,0,0,1,0,0); return rc;
}
function unpack(lm, wl, flip) {
  if (!lm) return [null, wl || null];
  if (!flip) return [lm, wl || null];
  return [lm.map(q => [1 - q[0], 1 - q[1], q[2], q[3] ?? 1]), wl ? wl.map(q => [-q[0], -q[1], q[2]]) : null];
}
function toLm(res, flip) {
  const p = res?.landmarks?.[0]; if (!p) return null;
  const lm = p.map(q => [q.x, q.y, q.z, q.visibility ?? 1]);
  return unpack(lm, null, flip)[0];
}
function toWl(res, flip) {
  const p = res?.worldLandmarks?.[0]; if (!p) return null;
  const wl = p.map(q => [q.x, q.y, q.z]);
  return unpack([[0,0,0,1]], wl, flip)[1];
}

const SETUP = { pushup:['side','floor','1,5–2'], plank:['side','floor','1,5–2'], hollow:['side','floor','1,5–2'],
  lsit:['side','floor','1,5–2'], row:['side','knee','2–3'], squat:['side','waist','2–3'], lunge:['side','waist','2–3'],
  dip:['side','waist','2–3'], handstand:['side','waist','2–3'], pullup:['front','chest','2–3'],
  muscleup:['side','chest','2–3'], frontlever:['side','chest','2–3'], backlever:['side','chest','2–3'], planchelean:['side','floor','1,5–2'],
  hanginglegraise:['side','chest','2–3'], pistolsquat:['side','waist','2–3'], pikepushup:['side','floor','1,5–2'] };
function setupSvg(ex) {
  const [view, height, dist] = SETUP[ex] || ['side','waist','2–3'];
  const L = t();
  const label = (L.views[view] || view).toUpperCase();
  const m = cfg.lang === 'ru' ? dist + ' м' : dist.replace(',', '.') + ' m';
  const heightLabel = L['h' + height[0].toUpperCase() + height.slice(1)];
  const hit = view === 'front' ? L.frontHit : view === 'd34' ? L.d34Hit : L.sideHit;
  const cam = view === 'front' ? [188, 34] : view === 'd34' ? [86, 52] : [52, 118];
  const aim = view === 'front' ? [188, 92] : view === 'd34' ? [170, 96] : [166, 108];
  const face = view !== 'side', side = view !== 'front';
  const ang = Math.atan2(aim[1] - cam[1], aim[0] - cam[0]);
  const wedge = (spread) => {
    const R = 210, a1 = ang - spread, a2 = ang + spread;
    const p = a => [cam[0] + Math.cos(a) * R, cam[1] + Math.sin(a) * R];
    const p1 = p(a1), p2 = p(a2);
    return `M${cam[0]} ${cam[1]} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${R} ${R} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z`;
  };
  return `<svg viewBox="0 0 340 228" class="tipsvg" role="img" aria-label="${L.topDown}: ${label}" data-view="${view}">
    <text x="14" y="20" fill="rgba(244,244,238,.62)" font-size="10" font-weight="800" letter-spacing="1.3" font-family="Montserrat">${L.topDown}</text>
    <text x="326" y="20" text-anchor="end" fill="#C6FF00" font-size="11" font-weight="800" font-family="Montserrat">${label}</text>
    <circle cx="188" cy="124" r="58" fill="none" stroke="rgba(244,244,238,.12)" stroke-dasharray="3 5"/>
    <path d="${wedge(0.42)}" fill="rgba(198,255,0,.16)" stroke="rgba(198,255,0,.85)" stroke-width="1.4"/>
    <g aria-label="${L.phoneLabel}" transform="translate(${cam[0]} ${cam[1]})">
      <rect x="-12" y="-18" width="24" height="36" rx="4" fill="#0E100E" stroke="#C6FF00" stroke-width="2"/>
      <circle cx="0" cy="10" r="1.7" fill="#C6FF00"/>
      <circle cx="0" cy="-9" r="2.6" fill="none" stroke="#C6FF00" stroke-width="1.5"/>
    </g>
    <g aria-label="${L.facingLabel}">
      <rect x="176" y="112" width="24" height="40" rx="12" fill="#0E100E" stroke="#F4F4EE" stroke-width="2.5"/>
      <line x1="164" y1="112" x2="212" y2="112" stroke="${side ? '#C6FF00' : '#F4F4EE'}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="188" cy="96" r="15" fill="#0E100E" stroke="${face ? '#C6FF00' : '#F4F4EE'}" stroke-width="2.5"/>
      <circle cx="183" cy="95" r="1.5" fill="#F4F4EE"/><circle cx="193" cy="95" r="1.5" fill="#F4F4EE"/>
      <path d="M188 84 v-14" stroke="#C6FF00" stroke-width="2" stroke-linecap="round"/>
      <path d="M183 74 h10 l-5 -7 z" fill="#C6FF00"/>
    </g>
    <text x="170" y="186" text-anchor="middle" fill="#C6FF00" font-size="13" font-weight="800" font-family="Manrope">${hit}</text>
    <text x="170" y="206" text-anchor="middle" fill="rgba(244,244,238,.72)" font-size="11" font-weight="700" font-family="Manrope">${L.phoneLabel} · ${heightLabel} · ${m}</text>
  </svg>`;
}
function showTip(ex) {
  const [view, h, d] = SETUP[ex] || ['side','waist','2–3']; const L = t();
  $('tipBody').innerHTML = setupSvg(ex) + `<ul class="tiplist">
    <li><small>${L.tView}</small><b>${view === 'd34' ? L.v34 : view === 'side' ? L.vSide : L.vFront}</b></li>
    <li><small>${L.tHeight}</small><b>${L['h' + h[0].toUpperCase() + h.slice(1)]}</b></li>
    <li><small>${L.tDist}</small><b>${cfg.lang === 'ru' ? d + ' м' : d.replace(',', '.') + ' m'}</b></li>
    <li><small>✓</small><b>${L.tFrame}</b></li></ul><p class="tipnote">${L.tipEx?.[ex] || L.tipNote[view] || ''}</p>`;
  $('tipTitle').textContent = `${L.ex[ex][0]} · ${L.tipTitle}`; $('tipGo').textContent = L.gotIt;
  $('tip').classList.add('show');
}

function showQuality(q) {
  lastQuality = q || null;
  const asked = `${q?.askedRes || cfg.camRes}p/${q?.askedFps || cfg.camFps}`;
  const got = q?.label || '—';
  const text = `${t().qAsk} ${asked} → ${got}` + (q?.fallback ? ' · ' + t().qFallback : '');
  const el = $('qChip');
  el.textContent = q?.label ? text : '';
  el.classList.toggle('fb', !!q?.fallback);
  $('qNow').textContent = text;
}
async function openCamera() {
  const video = videoConstraints({ front: cfg.front, res: cfg.camRes, fps: cfg.camFps });
  try { return await navigator.mediaDevices.getUserMedia({ audio: false, video }); }
  catch (e) {
    if (e.name === 'OverconstrainedError' || e.name === 'NotFoundError' || e.name === 'ConstraintError') {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: cfg.front ? 'user' : 'environment' } });
    }
    throw e;
  }
}
function readQuality() {
  const track = stream?.getVideoTracks?.()[0];
  const settings = track?.getSettings?.() || {};
  const q = qualityReport(settings, { res: cfg.camRes, fps: cfg.camFps });
  showQuality(q); return q;
}
async function setFacing(front, force = false) {
  const nextFront = !!front;
  if (!force && cfg.front === nextFront && stream) { applyCamPressed(); return; }
  const prevFront = cfg.front;
  cfg.front = nextFront; save(); applyCamPressed();
  if (!W && !starting) return;
  const my = startSeq;
  try {
    const next = await openCamera();
    if (my !== startSeq) { next.getTracks().forEach(tr => tr.stop()); return; }
    const prev = stream; stream = next; vid.srcObject = next; await vid.play();
    // Only the camera track changes. An in-progress recorder keeps its own canvas and audio.
    prev?.getTracks().forEach(tr => { if (tr.kind === 'video') tr.stop(); });
    readQuality();
  } catch (e) {
    cfg.front = prevFront; save(); applyCamPressed();
    toast(t().recErr);
  }
}
function applyCamPressed() {
  $('camRear').setAttribute('aria-pressed', cfg.front ? 'false' : 'true');
  $('camFront').setAttribute('aria-pressed', cfg.front ? 'true' : 'false');
}

function armFrame() {
  if (frameArmed) return;
  frameArmed = true;
  const token = runId;
  const tick = (now, meta) => {
    frameArmed = false;
    if (token !== runId) return;
    armFrame();
    if (!W || W.paused || vid.readyState < 2) return;
    const stamp = meta?.presentedFrames ?? vid.currentTime;
    if (stamp === W.lastVideoT) return;
    W.lastVideoT = stamp;
    W.lastPaint = performance.now();
    paintFrame();
    kickPose(now || performance.now());
  };
  if (typeof vid.requestVideoFrameCallback === 'function') vid.requestVideoFrameCallback((t, meta) => tick(t, meta));
  else requestAnimationFrame(t => tick(t, null));
  if (W && !W.backup) {
    W.backup = true;
    const backup = () => {
      if (token !== runId || !W) return;
      requestAnimationFrame(backup);
      if (W.paused || vid.readyState < 2) return;
      if (performance.now() - (W.lastPaint || 0) < 90) return;
      if (vid.currentTime === W.backupStamp) return;
      W.backupStamp = vid.currentTime;
      W.lastVideoT = 'b' + vid.currentTime;
      W.lastPaint = performance.now();
      paintFrame();
      kickPose(performance.now());
    };
    requestAnimationFrame(backup);
  }
}
function paintFrame() {
  const vw = vid.videoWidth, vh = vid.videoHeight;
  if (!vw || !vh) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cw = Math.max(2, Math.round(innerWidth * dpr)), ch = Math.max(2, Math.round(innerHeight * dpr));
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  const s = Math.max(cw / vw, ch / vh), dw = vw * s, dh = vh * s, ox = (cw - dw) / 2, oy = (ch - dh) / 2;
  const map = { x: nx => cfg.front ? cw - (ox + nx * dw) : ox + nx * dw, y: ny => oy + ny * dh };
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#000'; ctx.fillRect(0,0,cw,ch);
  ctx.save(); if (cfg.front) { ctx.translate(cw, 0); ctx.scale(-1, 1); }
  ctx.drawImage(vid, ox, oy, dw, dh); ctx.restore();
  const color = boneColor();
  if (W.lastLm) drawBones(ctx, W.lastLm, map, color, cfg.debug ? W.lastR?.angle : null, cw / Math.max(1, innerWidth));
  paintChrome();
  paintRecording(vw, vh);
  if (cfg.debug && W.lastR) showDbg(W.lastR); else if (!cfg.debug) $('dbgOut').textContent = '';
}
function boneColor() {
  const r = W.lastR;
  if (!r || W.phase !== 'active') return COLORS.idle;
  if (r.status === 'lost') return COLORS.lost;
  if (r.status !== 'ok') return COLORS.idle;
  if (r.cue && BAD_CUES.has(r.cue)) return COLORS.bad;
  return COLORS[r.seg] || COLORS.good;
}
function drawBones(g, lm, map, color, angle, scale) {
  g.lineCap = 'round'; g.lineWidth = 4.5 * (scale || 1); g.strokeStyle = color; g.shadowColor = color; g.shadowBlur = 10 * (scale || 1);
  for (const [a,b] of BONES) {
    const p = lm[a], q = lm[b]; if (!p || !q || p[3] < 0.4 || q[3] < 0.4) continue;
    g.beginPath(); g.moveTo(map.x(p[0]), map.y(p[1])); g.lineTo(map.x(q[0]), map.y(q[1])); g.stroke();
  }
  g.shadowBlur = 0; g.fillStyle = '#060706';
  for (const i of [11,12,13,14,15,16,23,24,25,26,27,28]) {
    const p = lm[i]; if (!p || p[3] < 0.4) continue;
    g.beginPath(); g.arc(map.x(p[0]), map.y(p[1]), 4.5 * (scale || 1), 0, 7); g.fill(); g.stroke();
  }
  if (angle != null && W) {
    const ex = EXERCISES[W.ex]; const left = (lm[11]?.[3]||0) + (lm[13]?.[3]||0) >= (lm[12]?.[3]||0) + (lm[14]?.[3]||0);
    const j = ex.primary === 'knee' ? (left ? 25 : 26) : ex.primary === 'hip' ? (left ? 23 : 24) : (left ? 13 : 14);
    const p = lm[j]; if (p) { g.font = `800 ${14*(scale||1)}px Montserrat,sans-serif`; g.fillStyle = '#F4F4EE'; g.fillText(Math.round(angle)+'°', map.x(p[0])+10, map.y(p[1])); }
  }
}
function paintChrome() {
  if (!SESS || !W) return;
  const item = SESS.items[SESS.index]; if (!item) return;
  $('statEx').textContent = t().ex[item.ex][0];
  const setNo = Math.min(item.sets, SESS.done.length + 1);
  let line = t().setOf(setNo, item.sets);
  if (SESS.mode === 'routine') line += ' · ' + t().exOf(SESS.index + 1, SESS.items.length);
  $('statSet').textContent = line;
  if (W.phase === 'calib') $('cOf').textContent = t().setup;
}
function kickPose(now) {
  if (!W || W.paused || poseBusy) return;
  if (W.phase !== 'calib' && W.phase !== 'active') return;
  if (!vid.videoWidth) return;
  if (poseMode === 'mock' && window.__CF_MOCK_POSE__) {
    poseBusy = true; const t0 = performance.now();
    Promise.resolve(window.__CF_MOCK_POSE__.frame(now, W)).then(res => {
      const ms = performance.now() - t0; poseBusy = false; notePose(ms);
      if (!W || W.paused || !res) return;
      onPose(res.lm || null, res.wl || null, performance.now());
    }).catch(() => { poseBusy = false; });
    return;
  }
  if (poseMode === 'worker' && poseReady && poseWorker) {
    poseBusy = true;
    const flip = !!W.flip; const id = ++W.poseN;
    createImageBitmap(vid).then(bmp => {
      if (!poseWorker || !W || W.paused) { bmp.close?.(); poseBusy = false; return; }
      poseWorker.postMessage({ type:'frame', bitmap:bmp, ts: performance.now(), flip, id }, [bmp]);
    }).catch(() => { poseBusy = false; });
    return;
  }
  if (poseMode === 'main' && landmarker) {
    poseBusy = true;
    setTimeout(() => {
      if (!W || W.paused) { poseBusy = false; return; }
      const t0 = performance.now(); let lm = null, wl = null;
      try {
        const flip = !!W.flip;
        const res = landmarker.detectForVideo(flip ? rotatedFrame() : vid, performance.now());
        lm = toLm(res, flip); wl = toWl(res, flip);
      } catch (e) { console.warn(e); }
      notePose(performance.now() - t0); poseBusy = false;
      onPose(lm, wl, performance.now());
    }, 0);
  }
}
function onWorkerPose(d) {
  poseBusy = false; notePose(d.ms || 0);
  if (!W || W.paused) return;
  const [lm, wl] = unpack(d.lm, d.wl, !!d.flip);
  onPose(lm, wl, performance.now());
  maybeFallback();
}
function maybeFallback() {
  if (!W || poseMode === 'mock' || W.phase !== 'active' || lmModel === 'lite' || W.fbBusy || cfg.noFb) return;
  const dt = W.prevPose ? Math.min(0.5, (performance.now() - W.prevPose) / 1000) : 0.1;
  W.prevPose = performance.now();
  W.slowT = (W.dms || 0) > 80 ? (W.slowT || 0) + dt : 0;
  if (W.slowT > 3) {
    W.fbBusy = true; cfg.model = 'lite'; save(); toast(t().fellBack);
    const go = poseMode === 'worker' && poseWorker ? startWorker('lite').then(() => { poseMode = 'worker'; }) : loadModel('lite');
    go.then(() => { if (W) W.fbBusy = false; }).catch(() => { if (W) W.fbBusy = false; });
  }
}
function onPose(lm, wl, ts) {
  if (!W || W.paused) return;
  if (W.ex === 'handstand' && W.phase === 'active') {
    const q = lm ? KEY.reduce((a,i) => a + (lm[i]?.[3] || 0), 0) / KEY.length : 0;
    const dt = W.prevHand ? Math.min(0.5, (ts - W.prevHand) / 1000) : 0.03; W.prevHand = ts;
    W.badT = q < 0.55 ? (W.badT || 0) + dt : 0;
    if (W.badT > 0.6) { W.flip = !W.flip; W.badT = 0; }
  }
  W.lastLm = lm;
  if (W.phase === 'calib') { calib(lm, ts); return; }
  if (W.phase !== 'active' || !W.engine) return;
  const r = W.engine.update(lm, ts, wl || undefined);
  W.lastR = r;
  if ((W.ex === 'handstand' || W.ex === 'muscleup') && r.view && r.view !== 'side' && r.status === 'ok' && !(r.cue && BAD_CUES.has(r.cue))) {
    r._hint = W.ex === 'muscleup' ? 'muSide' : 'hsSide';
  }
  maybeFallback();
  handle(r, ts);
}

let cueUntil = 0;
function cueText(c) { if (c === 'hsSide') return t().hsSide; if (c === 'muSide') return t().muSide; return (t().cue && t().cue[c]) || c || ''; }
function showCue(c, kind) { const el = $('cue'); el.textContent = cueText(c); el.className = 'cue show ' + (kind || ''); }
function hideCue() { $('cue').className = 'cue'; }
function handle(r, now) {
  const d = fb.step({ now, status: r.status, cue: r.cue, events: r.events });
  if (!d.visual && r._hint) { d.visual = r._hint; d.kind = 'warn'; }
  if (d.visual) { cueUntil = 0; showCue(d.visual, d.kind); }
  else if (d.flash) { cueUntil = now + 900; showCue(d.flash, d.flashKind); }
  else if (!cueUntil || now >= cueUntil) hideCue();
  if (d.tone) playTone(d.tone);
  if (d.speech) say([d.speech], cueText(d.speech), { interrupt: true });
  const hold = isHold(W.ex);
  for (const e of r.events || []) {
    if (!hold) {
      W.attempts.push(e.clean ? 'g' : 'r');
      const dot = document.createElement('i'); dot.className = e.clean ? 'g' : 'r'; $('dots').appendChild(dot);
    }
    if (e.clean) {
      $('cNum').textContent = r.reps; flashPlus();
      if (r.reps >= W.target) { sayNum(r.reps, ['done'], t().say.done); return finish(true, false); }
      if (r.reps === Math.ceil(W.target / 2) && W.target >= 6) sayNum(r.reps, ['halfway'], t().say.halfway);
      else if (r.reps === W.target - 1 && W.target > 3) sayNum(r.reps, ['last'], t().say.last);
      else sayNum(r.reps);
    }
  }
  if (!hold) $('cNum').textContent = r.reps || 0;
  if (hold) {
    const s = Math.floor(r.holdGood || 0); $('cNum').textContent = s;
    $('cOf').textContent = `/ ${W.target} ${t().sec}`;
    $('barFill').style.width = Math.min(100, (r.holdGood || 0) / W.target * 100) + '%';
    if (s > (W.holdSpoken || 0)) {
      W.holdSpoken = s;
      if (s >= W.target) { say(['done'], t().say.done); return finish(true, false); }
      if (s === Math.floor(W.target / 2) && W.target >= 20) say(['halfway'], t().say.halfway, { interrupt: false });
      else if (W.target - s <= 3 && W.target - s > 0) sayNum(W.target - s, [], '', { interrupt: false });
      else if (s % 10 === 0 && s > 0) sayNum(s, [], '', { interrupt: false });
    }
  } else {
    $('cOf').textContent = `/ ${W.target}`;
    $('barFill').style.width = Math.min(100, (r.reps || 0) / W.target * 100) + '%';
  }
}
function flashPlus() {
  const p = $('plus'); p.classList.remove('go'); void p.offsetWidth; p.classList.add('go');
  const c = document.querySelector('.statnum'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
}
function showDbg(r) {
  const f = v => typeof v === 'number' ? (Math.abs(v) < 5 ? v.toFixed(2) : v.toFixed(0)) : v;
  const rows = [`${r.status}/${r.seg}${r.angle != null ? ' ∠'+f(r.angle) : ''}${r.cue ? ' '+r.cue : ''}`];
  rows.push(`pose ${Math.round(poseStat.ms)}ms · lat ${r.faultLatency != null ? Math.round(r.faultLatency) : '—'}ms · ${lmModel||poseMode}${W.flip?' ROT':''}`);
  if (r.dbg) rows.push(Object.entries(r.dbg).map(([k,v]) => `${k} ${f(v)}`).join('  '));
  $('dbgOut').textContent = rows.join('\n');
}
function calib(lm, now) {
  const vis = visibility(lm); const need = EXERCISES[W.ex].need;
  const missing = need.filter(k => !vis[k]);
  if (now - (W.calT || 0) > 350) {
    W.calT = now;
    $('hint').innerHTML = !lm ? t().calNoBody + '<br><span class="dim">' + t().calBody + '</span>'
      : missing.length ? t().calMissing(missing.map(k => t().parts[k]).join(', ')) + (BEST_VIEW[W.ex] === 'side' ? '<br><span class="dim">' + t().calSide + '</span>' : '')
      : t().calOk;
  }
  document.querySelectorAll('#parts span').forEach(s => s.classList.toggle('ok', !!vis[s.dataset.p]));
  const all = need.every(k => vis[k]);
  if (!all) W.okSince = 0; else if (!W.okSince) W.okSince = now;
  const needMs = fast() ? 160 : 1200;
  const prog = all ? Math.min(1, (now - W.okSince) / needMs) : need.filter(k => vis[k]).length / need.length * 0.6;
  $('ringFg').style.strokeDashoffset = String(107 * (1 - prog));
  if (all && now - W.okSince > needMs) countdown();
}
function countdown() {
  if (W.phase === 'count' || W.phase === 'active') return;
  W.phase = 'count'; $('calib').classList.remove('show');
  const big = $('big'); let n = fast() ? 0 : 3; const name = t().ex[W.ex][0];
  const tick = () => {
    if (!W) return;
    if (W.paused) { setTimeout(tick, 200); return; }
    if (n > 0) { big.innerHTML = `<small>${name}</small>${n}`; big.classList.add('show'); sayNum(n); n--; setTimeout(tick, fast() ? 20 : 1000); }
    else {
      big.innerHTML = `<small>${name}</small><span style="font-size:56px">${t().go}</span>`; say(['go'], t().go);
      setTimeout(() => big.classList.remove('show'), fast() ? 30 : 700);
      W.engine = createEngine(W.ex, { aspect: (vid.videoWidth / vid.videoHeight) || 9/16, strict: STRICT });
      W.t0 = performance.now(); W.phase = 'active'; W.holdSpoken = 0;
    }
  };
  tick();
}

async function beginSession(mode) {
  unlockAudio();
  if (mode === 'routine') {
    if (!routine.items.length) { toast(t().emptyRoutine); return; }
    SESS = { mode:'routine', items: routine.items.map(x => ({...x})), index:0, setsDone:0, done:[], log:[] };
    lastMode = 'routine';
  } else {
    SESS = { mode:'single', items:[{ id:'quick', ex:cfg.ex, sets:nSets(), target:cfg.targets[cfg.ex], rest:cfg.rest }], index:0, setsDone:0, done:[], log:[] };
    lastMode = 'single';
  }
  cfg.ex = SESS.items[0].ex;
  show('home'); showTip(cfg.ex);
}
async function startWorkout() {
  if (!SESS) return;
  const myStart = ++startSeq; starting = true; runId++; frameArmed = false;
  const item = SESS.items[SESS.index]; cfg.ex = item.ex;
  $('dbgOut').textContent = '';
  armBackGuard(); unlockAudio(); preloadVoice(item.target);
  $('tip').classList.remove('show');
  show('work'); $('loading').classList.add('show'); $('loading').querySelector('p').textContent = t().loading;
  $('cue').className = 'cue'; $('dots').innerHTML = ''; $('barFill').style.width = '0';
  $('cNum').textContent = '0'; $('cOf').textContent = t().setup;
  try {
    await ensurePose();
    stream = await openCamera();
    if (myStart !== startSeq) { stream.getTracks().forEach(tr => tr.stop()); return; }
    vid.srcObject = stream; await vid.play();
    readQuality();
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
    if (myStart !== startSeq) return;
  } catch (e) {
    if (myStart !== startSeq) return;
    starting = false;
    $('loading').querySelector('p').textContent = (cfg.lang==='ru' ? 'Нет доступа к камере или модели: ' : 'Camera or model unavailable: ') + (e.message || e);
    return;
  }
  starting = false; $('loading').classList.remove('show');
  fb = createFeedbackGate(c => BAD_CUES.has(c));
  W = { flip:false, badT:0, dms:0, slowT:0, poseN:1, lastLm:null, lastR:null, lastVideoT:-1, ex:item.ex, target:item.target, phase:'calib', okSince:0, engine:null, t0:0, attempts:[], paused:false, pauseT:0, calT:0, holdSpoken:0, finished:false };
  $('calib').classList.add('show'); $('hint').innerHTML = t().hint[item.ex] || '';
  $('parts').innerHTML = EXERCISES[item.ex].need.map(k => `<span data-p="${k}">${t().parts[k]}</span>`).join('');
  paintChrome(); armFrame();
  if (rec && rec.state === 'paused') resumeRec();
}
function releaseCamera() {
  runId++; frameArmed = false;
  try { wakeLock?.release(); } catch {} wakeLock = null;
  if (stream) stream.getTracks().forEach(tr => tr.stop());
  stream = null; if (vid) vid.srcObject = null;
}
function stopCamera() { releaseCamera(); stopRec(); }

let restTimer = 0, restLeft = 0, restPaused = false;
function stopRest() { clearInterval(restTimer); restTimer = 0; restPaused = false; $('rest').classList.remove('show'); }
function runRestTimer() {
  clearInterval(restTimer);
  const tick = () => {
    if (restPaused || !SESS) return;
    $('restNum').textContent = restLeft;
    if (restLeft <= 0) { stopRest(); afterRest(); }
    else { if (restLeft <= 3) sayNum(restLeft, [], '', { interrupt:false }); restLeft--; }
  };
  tick(); restTimer = setInterval(tick, fast() ? 20 : 1000);
}
function showRest(res, step) {
  stopVoice(); const L = t();
  $('restSet').textContent = L.setDone + ' · ' + res.n + (res.hold ? ' ' + L.sec : ' ' + L.reps) + ' · ' + res.tech + '%';
  $('restNext').textContent = step.then === 'exercise'
    ? (L.nextEx + ': ' + L.ex[step.item.ex][0])
    : (L.nextSet + ' · ' + L.setOf(step.setNo, step.item.sets));
  $('rest').classList.add('show');
  say(['rest'], L.rest); restLeft = step.rest; restPaused = false; runRestTimer();
}
function afterRest() {
  stopRest(); if (!SESS) return;
  if (SESS.afterRest === 'exercise') showTip(cfg.ex);
  else startWorkout();
}
function collectSet(goalFlag) {
  const r = W.engine ? W.engine.update(null, performance.now()) : { reps:0, bad:0, holdGood:0, holdTotal:0 };
  const hold = isHold(W.ex);
  const secs = W.t0 ? (performance.now() - W.t0 - (W.pauseT || 0)) / 1000 : 0;
  const n = hold ? Math.floor(r.holdGood || 0) : (r.reps || 0);
  const bad = hold ? Math.max(0, Math.round((r.holdTotal || 0) - (r.holdGood || 0))) : (r.bad || 0);
  const tech = (n + bad) ? Math.round(n / (n + bad) * 100) : 0;
  return { ex:W.ex, n, bad, tech, secs, goal: !!(goalFlag || n >= W.target), attempts: W.attempts.slice(), hold, block: SESS.index };
}
function finish(goal, endAll = false) {
  if (!W || W.finished || !SESS) return;
  W.finished = true;
  const res = collectSet(goal);
  SESS.log.push(res); SESS.done.push(res); SESS.setsDone = SESS.done.length;
  const step = endAll ? { action:'done' } : afterSet({ items: SESS.items, index: SESS.index, setsDone: SESS.setsDone });
  stopRest();
  if (step.action === 'rest') { releaseCamera(); pauseRec(); }
  else stopCamera();
  W = null;
  if (step.action === 'rest') {
    if (step.then === 'exercise') {
      SESS.index = step.nextIndex; SESS.done = []; SESS.setsDone = 0;
      cfg.ex = SESS.items[SESS.index].ex; SESS.afterRest = 'exercise';
    } else SESS.afterRest = 'set';
    armBackGuard();
    if ((step.rest || 0) <= 0) return afterRest();
    return showRest(res, step);
  }
  endSession();
}
function endSession() {
  const log = SESS ? SESS.log.slice() : [];
  SESS = null; disarmBackGuard(); stopCamera(); stopRest();
  if (!log.length) { show('home'); applyLang(); return; }
  const model = summarize(log);
  if (model.blocks.some(b => b.n > 0)) {
    markToday();
    for (const b of model.blocks) if (b.n > 0) saveHistory({ ex:b.ex, n:b.n, tech:b.tech, secs:Math.round(b.secs), sets:b.sets.length });
  }
  showSummary(model);
  const one = model.blocks.length === 1 ? model.blocks[0] : null;
  setTimeout(() => {
    if (one && one.n <= 120) {
      const hold = one.hold;
      const k = ['s_done', hold ? 's_hold' : 's_clean', 'n'+Math.min(120, one.n), 's_tech', 'p'+one.tech];
      if (one.bad && !hold) k.push('s_bad', 'n'+Math.min(120, one.bad));
      say(k, t().say.summary(one.n, one.tech, one.bad), { interrupt:true });
    } else say(['done'], t().say.done, { interrupt:true });
  }, 600);
}

function renderBuilder() {
  const L = t();
  $('addPick').innerHTML = EX_ORDER.map(k => `<option value="${k}">${L.ex[k][0]}</option>`).join('');
  $('buildEmpty').textContent = routine.items.length ? '' : L.emptyRoutine;
  $('buildList').innerHTML = routine.items.map((it, i) => {
    const hold = isHold(it.ex);
    return `<div class="bitem" data-i="${i}">
      <div class="bhead"><b>${i+1}. ${L.ex[it.ex][0]}</b>
        <div class="ord">
          <button type="button" data-move="-1" aria-label="${L.up}" ${i===0?'disabled':''}>↑</button>
          <button type="button" data-move="1" aria-label="${L.down}" ${i===routine.items.length-1?'disabled':''}>↓</button>
          <button type="button" class="bremove" data-del="1" aria-label="${L.remove}">✕</button>
        </div>
      </div>
      <div class="mini"><span>${L.sets}</span><div class="stepper"><button type="button" data-k="sets" data-d="-1">−</button><b>${it.sets}</b><button type="button" data-k="sets" data-d="1">+</button></div></div>
      <div class="mini"><span>${hold ? L.secShort : L.repsShort}</span><div class="stepper"><button type="button" data-k="target" data-d="-1">−</button><b>${it.target}</b><button type="button" data-k="target" data-d="1">+</button></div></div>
      <div class="mini"><span>${L.restShort}</span><div class="stepper"><button type="button" data-k="rest" data-d="-1">−</button><b>${it.rest}</b><button type="button" data-k="rest" data-d="1">+</button></div></div>
    </div>`;
  }).join('');
  $('buildList').querySelectorAll('.bitem').forEach(row => {
    const i = Number(row.dataset.i);
    row.querySelector('[data-del]').onclick = () => { routine.items.splice(i, 1); saveRoutine(); renderBuilder(); };
    row.querySelectorAll('[data-move]').forEach(b => b.onclick = () => { routine.items = moveItem(routine.items, i, Number(b.dataset.move)); saveRoutine(); renderBuilder(); });
    row.querySelectorAll('[data-k]').forEach(b => b.onclick = () => bumpItem(i, b.dataset.k, Number(b.dataset.d)));
  });
}
function bumpItem(i, key, dir) {
  const it = routine.items[i]; if (!it) return;
  const hold = isHold(it.ex);
  if (key === 'sets') it.sets = Math.max(1, Math.min(10, it.sets + dir));
  if (key === 'rest') it.rest = Math.max(0, Math.min(300, it.rest + dir * 10));
  if (key === 'target') it.target = Math.max(hold ? 10 : 1, Math.min(hold ? 600 : 200, it.target + dir * (hold ? 5 : 1)));
  saveRoutine(); renderBuilder();
}

const getHist = () => { try { return JSON.parse(localStorage.getItem('cf_history') || '[]'); } catch { return []; } };
function saveHistory(r) {
  const h = getHist(); h.push({ d: Date.now(), ex:r.ex, n:r.n, tech:r.tech, secs:Math.round(r.secs), sets:r.sets || 1 });
  localStorage.setItem('cf_history', JSON.stringify(h.slice(-300)));
}
function openHistory() {
  const h = getHist().slice().reverse(), L = t();
  $('histList').innerHTML = h.length ? h.slice(0, 40).map(x => {
    const dt = new Date(x.d).toLocaleDateString(cfg.lang === 'ru' ? 'ru-RU' : 'en-US', { day:'numeric', month:'short' });
    const hold = EXERCISES[x.ex]?.kind === 'hold';
    return `<div class="hrow"><div><b>${L.ex[x.ex] ? L.ex[x.ex][0] : x.ex}</b><span>${dt} · ${Math.floor(x.secs/60)}:${String(x.secs%60).padStart(2,'0')}${x.sets>1?' · '+x.sets+'×':''}</span></div>
      <div class="hval"><b>${x.n}${hold?' '+L.sec:''}</b><span class="${x.tech>=90?'lime':x.tech>=70?'amber':'red'}">${x.tech}%</span></div></div>`;
  }).join('') : `<p class="dim" style="padding:14px 0">${L.noHist}</p>`;
  $('histChart').innerHTML = chartSvg(getHist().filter(x => x.ex === cfg.ex));
  $('histEx').textContent = L.ex[cfg.ex][0]; $('sheetHist').classList.add('show');
}
function chartSvg(rows) {
  if (!rows.length) return '';
  const r = rows.slice(-14), W0 = 320, H = 110, max = Math.max(...r.map(x => x.n), 1);
  const bw = Math.min(20, (W0 - 20) / r.length - 6);
  return `<svg viewBox="0 0 ${W0} ${H}" class="chart"><line x1="6" y1="${H-22}" x2="${W0-6}" y2="${H-22}" stroke="#2a2d29"/>` + r.map((x,i) => {
    const cx = 12 + i * ((W0 - 24) / r.length), h = Math.max(3, x.n / max * (H - 46));
    return `<rect x="${cx-bw/2}" y="${H-22-h}" width="${bw}" height="${h}" rx="3" fill="${x.tech>=90?'#C6FF00':x.tech>=70?'#FFC23A':'#FF4D5E'}"/>
      <text x="${cx}" y="${H-26-h}" text-anchor="middle" fill="rgba(244,244,238,.8)" font-size="10" font-family="Montserrat" font-weight="700">${x.n}</text>
      <text x="${cx}" y="${H-6}" text-anchor="middle" fill="rgba(244,244,238,.45)" font-size="8" font-family="Manrope">${new Date(x.d).getDate()}.${new Date(x.d).getMonth()+1}</text>`;
  }).join('') + '</svg>';
}

let lastRes = null;
function showSummary(model) {
  lastRes = model;
  const one = model.blocks.length === 1 ? model.blocks[0] : null;
  const hold = !!(one && one.hold);
  const n = one ? one.n : model.blocks.length;
  const bad = one ? one.bad : model.blocks.reduce((a,b) => a + b.bad, 0);
  const tech = one ? one.tech : model.tech;
  const empty = model.secs < 2 && model.blocks.every(b => !b.n && !b.bad);
  $('sEyebrow').textContent = empty ? t().notStarted : model.goal ? t().goalDone : t().done;
  $('sNum').textContent = n;
  $('sLabel').textContent = one ? t().ex[one.ex][1] : t().exercises;
  $('sTech').textContent = tech + '%';
  $('sTechW').textContent = empty ? t().notStartedSub : t().techWord(tech);
  $('sBad').textContent = one && hold ? bad + ' ' + t().sec : bad;
  document.querySelector('[data-i="uncountedSub"]').textContent = one && hold ? t().uncountedSubHold : t().uncountedSub;
  $('sStreak').textContent = getStreak();
  const m = Math.floor(model.secs / 60), s = Math.round(model.secs % 60);
  $('sTime').textContent = `${m}:${String(s).padStart(2,'0')}`;
  $('sDots').innerHTML = (model.attempts || []).map(a => `<i class="${a}"></i>`).join('');
  const multi = model.blocks.length > 1 || model.blocks.some(b => b.sets.length > 1);
  $('sSets').innerHTML = multi ? model.blocks.map(b => b.sets.map((x,i) => `<div class="setrow"><span>${t().ex[b.ex][0]} · ${t().setOf(i+1, b.sets.length)}</span><b>${x.n}${b.hold?' '+t().sec:''}</b><span class="dim">${x.tech}%</span></div>`).join('')).join('') : '';
  $('recSave').classList.toggle('show', clips.length > 0);
  show('sum');
}
function storyCanvas(model) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  const one = model.blocks.length === 1 ? model.blocks[0] : null;
  const L = t();
  x.fillStyle = '#060706'; x.fillRect(0, 0, 1080, 1920);
  x.fillStyle = '#C6FF00'; x.beginPath(); x.arc(96, 128, 12, 0, 7); x.fill();
  x.font = '800 34px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE'; x.fillText('CALISTHENICS FLOW', 126, 142);
  x.textAlign = 'center';
  if (one) {
    x.font = '800 40px Montserrat, sans-serif'; x.fillStyle = 'rgba(244,244,238,.7)'; x.fillText(L.ex[one.ex][0].toUpperCase(), 540, 460);
    x.font = '900 420px Montserrat, sans-serif'; x.fillStyle = '#C6FF00'; x.fillText(String(one.n), 540, 900);
    x.font = '800 48px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE'; x.fillText(L.ex[one.ex][1].toUpperCase(), 540, 990);
    x.font = '900 120px Montserrat, sans-serif'; x.fillText(one.tech + '%', 540, 1180);
  } else {
    x.font = '800 40px Montserrat, sans-serif'; x.fillStyle = '#C6FF00'; x.fillText(L.buildTitle.toUpperCase(), 540, 420);
    model.blocks.slice(0, 8).forEach((b, i) => {
      x.font = '700 42px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE';
      x.fillText(`${L.ex[b.ex][0]}  ${b.n}${b.hold ? 's' : ''}`, 540, 560 + i * 90);
    });
  }
  x.font = '900 64px Montserrat, sans-serif'; x.fillStyle = '#F4F4EE'; x.fillText('@calistenics_flow', 540, 1680);
  x.font = '600 32px Manrope, sans-serif'; x.fillStyle = 'rgba(244,244,238,.55)';
  x.fillText('Your pocket trainer · ' + new Date().toLocaleDateString(cfg.lang === 'ru' ? 'ru-RU' : 'en-US'), 540, 1760);
  return c;
}
function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
async function shareStory() {
  const model = lastRes; if (!model) return;
  const blob = await new Promise(res => storyCanvas(model).toBlob(res, 'image/png'));
  const file = new File([blob], 'calisthenics-flow.png', { type:'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files:[file] })) await navigator.share({ files:[file], title:'Calisthenics Flow' });
    else download(URL.createObjectURL(blob), file.name);
    toast(t().shared);
  } catch (e) { if (e.name !== 'AbortError') download(URL.createObjectURL(blob), file.name); }
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2800); }
async function share() {
  const model = lastRes; if (!model) return;
  const one = model.blocks[0];
  const txt = one && model.blocks.length === 1
    ? `${one.n} ${t().ex[one.ex][1]} · ${t().technique} ${one.tech}% · Calisthenics Flow @calistenics_flow`
    : model.blocks.map(b => `${t().ex[b.ex][0]} ${b.n}`).join(' · ') + ' · Calisthenics Flow';
  try { if (navigator.share) await navigator.share({ title:'Calisthenics Flow', text:txt, url:location.href });
    else { await navigator.clipboard.writeText(txt + ' ' + location.href); toast(t().shared); } } catch {}
}

// Recording used to capture the on-screen canvas from inside the pose loop, with the mic disabled.
// Pose time therefore became the video frame rate, and the file had no audio.
// Frames are now painted from the camera clock into a canvas the size of the camera frame.
// Pose runs beside that, on a worker when the browser allows it.
let rec = null, recStarting = false, clips = [], saveIndex = 0, saveResume = false, micStream = null, micNode = null;
const recSupported = () => typeof MediaRecorder === 'function' && typeof recCv.captureStream === 'function';
function isSafari() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return true;
  return /Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua);
}
function recMime() {
  if (!recSupported()) return null;
  const list = isSafari()
    ? ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm']
    : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  return list.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || '';
}
function syncRec() {
  const on = !!(rec && rec.state !== 'inactive');
  $('recBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
  $('recBtn').setAttribute('aria-label', on ? t().recStop : t().recStart);
  $('recInd').classList.toggle('show', !!(rec && rec.state === 'recording'));
}
function fmtDur(ms) { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function recElapsed(now) { if (!rec) return 0; const end = rec.hold || now; return Math.max(0, end - rec.t0 - (rec.pausedMs || 0)); }
async function addMic() {
  ensureMix();
  if (window.__CF_DENY_MIC__) { const err = new Error('denied'); err.name = 'NotAllowedError'; throw err; }
  const ms = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true }, video:false });
  micStream = ms;
  if (ac && mixDest) { micNode = ac.createMediaStreamSource(ms); micNode.connect(mixDest); }
  return true;
}
function releaseMic() {
  try { micNode?.disconnect(); } catch {}
  micNode = null;
  micStream?.getTracks().forEach(tr => tr.stop());
  micStream = null;
}
async function toggleRec() {
  if (rec && rec.state !== 'inactive') { stopRec(); return; }
  if (recStarting) return;
  if (W && W.paused && !W.finished) resumeWorkout();
  recStarting = true;
  const mime = recMime();
  if (!mime) { recStarting = false; toast(t().recUnsup); return; }
  const vw = vid.videoWidth || 1280, vh = vid.videoHeight || 720;
  if (recCv && recCv.parentNode) recCv.parentNode.removeChild(recCv);
  recCv = document.createElement('canvas');
  recCv.width = vw; recCv.height = vh;
  recCv.setAttribute('aria-hidden', 'true');
  // Safari does not capture a canvas that is outside the document.
  recCv.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;opacity:0.02;pointer-events:none;z-index:-1';
  document.body.appendChild(recCv);
  rctx = recCv.getContext('2d', { alpha: false });
  let mic = 'failed';
  try { await addMic(); mic = 'on'; } catch (e) { mic = (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'failed'; }
  try {
    let canvasStream;
    try { canvasStream = recCv.captureStream(30); } catch { canvasStream = recCv.captureStream(); }
    const canvasTrack = canvasStream.getVideoTracks()[0];
    const tracks = [canvasTrack];
    // A silent Web Audio track with no microphone makes Chrome write a 0-byte file.
    // Safari records the microphone track itself; it often drops an AudioContext mix.
    let audio = null;
    if (mic === 'on') {
      const micLive = micStream?.getAudioTracks().find(t => t.readyState === 'live');
      audio = isSafari() && micLive ? micLive : freshCueTrack();
    }
    if (audio && audio.readyState === 'live') tracks.push(audio);
    const mixed = new MediaStream(tracks);
    const mr = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: (Math.min(vw, vh) >= 1000 ? 8_000_000 : 5_000_000), audioBitsPerSecond: 128000 });
    const chunks = [];
    rec = mr; mr.w = vw; mr.h = vh; mr.frames = 0; mr.firstT = 0; mr.lastT = 0; mr.t0 = performance.now(); mr.pausedMs = 0; mr.hold = 0;
    mr.mic = mic; mr.hasAudio = tracks.some(tr => tr.kind === 'audio'); mr.canvasTrack = canvasTrack; mr.chunks = chunks;
    mr.q = lastQuality ? { ...lastQuality } : null;
    mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      const elapsed = recElapsed(performance.now());
      const blob = new Blob(chunks, { type: (mr.mimeType || 'video/webm').split(';')[0] });
      const fps = rateFromStamps(mr.firstT, mr.lastT, mr.frames);
      releaseMic();
      if (rec === mr) rec = null;
      syncRec();
      if (emptyClip({ size: blob.size, elapsed, frames: mr.frames })) {
        window.__CF_LAST_EMPTY = { size: blob.size, elapsed, frames: mr.frames, audio: mr.hasAudio, mic: mr.mic };
        toast(t().recEmpty); return;
      }
      const url = URL.createObjectURL(blob);
      clips.push({ blob, url, w: mr.w, h: mr.h, frames: mr.frames, fps, elapsed, audio: mr.hasAudio, mic: mr.mic, q: mr.q, overlay: cfg.recOverlay !== false });
      openSave(clips.length - 1, { pause: !!(W && !W.finished) });
    };
    mr.onerror = () => { toast(t().recErr); if (rec === mr) stopRec(); };
    mr.start(200); syncRec(); $('recTime').textContent = '0:00';
  } catch (e) { rec = null; releaseMic(); syncRec(); toast(t().recErr); }
  finally { recStarting = false; }
}
function stopRec() { if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch { rec = null; syncRec(); } } }
function pauseRec() { if (rec && rec.state === 'recording') { try { rec.pause(); rec.hold = performance.now(); } catch {} syncRec(); } }
function resumeRec() {
  if (rec && rec.state === 'paused') {
    try { rec.resume(); if (rec.hold) { rec.pausedMs += performance.now() - rec.hold; rec.hold = 0; } } catch {}
    syncRec();
  }
}
function paintRecording(vw, vh) {
  if (!rec || rec.state !== 'recording') return;
  const w = rec.w, h = rec.h;
  const s = Math.min(w / vw, h / vh), dw = vw * s, dh = vh * s, ox = (w - dw) / 2, oy = (h - dh) / 2;
  rctx.setTransform(1,0,0,1,0,0); rctx.fillStyle = '#000'; rctx.fillRect(0,0,w,h);
  rctx.save();
  if (cfg.front) { rctx.translate(ox + dw, oy); rctx.scale(-1, 1); rctx.drawImage(vid, 0, 0, dw, dh); }
  else rctx.drawImage(vid, ox, oy, dw, dh);
  rctx.restore();
  if (cfg.recOverlay !== false && W?.lastLm) {
    const map = { x: nx => cfg.front ? ox + (1 - nx) * dw : ox + nx * dw, y: ny => oy + ny * dh };
    drawBones(rctx, W.lastLm, map, boneColor(), null, h / 720);
    const n = W.phase === 'active' ? (isHold(W.ex) ? Math.floor(W.lastR?.holdGood || 0) : (W.lastR?.reps || 0)) : 0;
    rctx.shadowBlur = 0; rctx.fillStyle = '#F4F4EE'; rctx.font = `900 ${Math.round(h * 0.07)}px Montserrat,sans-serif`;
    rctx.fillText(String(n), 24, Math.round(h * 0.1));
    rctx.fillStyle = '#C6FF00'; rctx.font = `800 ${Math.round(h * 0.028)}px Montserrat,sans-serif`;
    rctx.fillText('@calistenics_flow', 24, h - 24);
  }
  const now = performance.now();
  rec.frames++; if (!rec.firstT) rec.firstT = now; rec.lastT = now;
  if (rec.canvasTrack?.requestFrame) { try { rec.canvasTrack.requestFrame(); } catch {} }
  $('recTime').textContent = fmtDur(recElapsed(now));
}
function openSave(i, opts = {}) {
  if (!clips.length) return;
  saveIndex = (i + clips.length) % clips.length;
  const clip = clips[saveIndex];
  if (opts.pause && W && !W.paused && !W.finished) { softPause(); saveResume = true; }
  $('saveVid').src = clip.url; $('saveVid').load?.();
  const q = clip.q;
  $('saveEyebrow').textContent = t().saveTitle;
  $('saveMeta').textContent = `${clip.w}×${clip.h} · ${clip.fps ? clip.fps.toFixed(1) : '—'} fps · ${fmtDur(clip.elapsed)} · ${clip.frames}f`
    + (q?.fallback ? ' · ' + t().qFallback : '');
  $('saveNote').textContent = (clip.mic === 'on' ? t().saveMic + ' ' + t().saveCoach : t().saveNoMic) + ' ' + t().saveNote;
  $('savePrev').hidden = clips.length < 2;
  $('saveDlg').classList.add('show');
}
async function shareClip(clip) {
  const ext = clip.blob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([clip.blob], `calisthenics-flow-${Date.now()}.${ext}`, { type: clip.blob.type || 'video/webm' });
  if (navigator.canShare && navigator.canShare({ files:[file] })) await navigator.share({ files:[file], title:'Calisthenics Flow' });
  else { download(clip.url, file.name); toast(t().videoSaved); }
}
function closeSave() {
  $('saveDlg').classList.remove('show');
  if (saveResume) { saveResume = false; resumeWorkout(); }
}

let backArmed = false;
function armBackGuard() { if (backArmed) return; backArmed = true; try { history.pushState({ cf: 1 }, ''); } catch {} }
function disarmBackGuard() { if (!backArmed) return; backArmed = false; }
function sessionLive() {
  return starting || (!!W && !W.finished) || (!!SESS && ($('rest').classList.contains('show') || $('tip').classList.contains('show')));
}
function fillPause() {
  $('pauseQ').textContent = t().exitQ; $('pauseSub').textContent = t().exitSub;
  $('pauseStay').textContent = t().exitStay; $('pauseGo').textContent = t().exitLeave;
}
function softPause() {
  if (W && !W.paused && !W.finished) { W.paused = true; W.pausedAt = performance.now(); stopVoice(); pauseRec(); }
}
function pauseWorkout() {
  if ($('pause').classList.contains('show') || $('saveDlg').classList.contains('show')) return;
  if (starting && !W) { fillPause(); $('pause').classList.add('show'); return; }
  if (SESS && $('rest').classList.contains('show')) {
    if (restPaused) return;
    restPaused = true; clearInterval(restTimer); restTimer = 0; stopVoice();
    fillPause(); $('pause').classList.add('show'); return;
  }
  if (W && !W.finished) {
    if (!W.paused) { W.paused = true; W.pausedAt = performance.now(); stopVoice(); pauseRec(); }
    fillPause(); $('pause').classList.add('show'); return;
  }
  if (SESS && $('tip').classList.contains('show')) {
    $('tip').classList.remove('show'); SESS.tipWasOpen = true; fillPause(); $('pause').classList.add('show');
  }
}
function resumeWorkout() {
  $('pause').classList.remove('show');
  if (starting && !W) return;
  if (!W && restPaused && SESS) { restPaused = false; runRestTimer(); return; }
  if (W) {
    W.pauseT = (W.pauseT || 0) + (performance.now() - (W.pausedAt || performance.now()));
    if (W.engine?.state) W.engine.state.lastT = null;
    W.paused = false; W.lastVideoT = -1; resumeRec();
    vid.play().catch(() => {}); armFrame(); return;
  }
  if (SESS?.tipWasOpen) { SESS.tipWasOpen = false; showTip(cfg.ex); }
}
window.addEventListener('popstate', () => {
  if (sessionLive()) { backArmed = false; armBackGuard(); pauseWorkout(); }
  else backArmed = false;
});
document.addEventListener('visibilitychange', () => { if (document.hidden && sessionLive()) pauseWorkout(); });

function renderSettings() {
  document.querySelectorAll('#sheet [data-set]').forEach(b => {
    const [k, v] = b.dataset.set.split(':');
    const cur = k === 'lang' ? cfg.lang : k === 'gender' ? cfg.gender : k === 'voice' ? String(!!cfg.voice) : k === 'debug' ? String(!!cfg.debug) : k === 'model' ? cfg.model : k === 'res' ? cfg.camRes : k === 'fps' ? String(cfg.camFps) : k === 'overlay' ? String(cfg.recOverlay !== false) : '';
    b.classList.toggle('sel', cur === v);
  });
}
document.querySelectorAll('#sheet [data-set]').forEach(b => b.onclick = () => {
  unlockAudio(); const [k, v] = b.dataset.set.split(':');
  if (k === 'lang') cfg.lang = v;
  else if (k === 'gender') cfg.gender = v === 'f' ? 'f' : 'm';
  else if (k === 'voice') cfg.voice = v === 'true';
  else if (k === 'debug') { cfg.debug = v === 'true'; if (!cfg.debug) $('dbgOut').textContent = ''; }
  else if (k === 'model') {
    cfg.model = v;
    if (!window.__CF_MOCK_POSE__) {
      if (poseMode === 'worker') startWorker(v).then(() => { poseMode = 'worker'; }).catch(() => loadModel(v).then(() => { poseMode = 'main'; }));
      else loadModel(v).catch(() => {});
    }
  } else if (k === 'res') cfg.camRes = v === '1080' ? '1080' : '720';
  else if (k === 'fps') cfg.camFps = v === '60' ? 60 : 30;
  else if (k === 'overlay') cfg.recOverlay = v === 'true';
  save(); applyLang(); renderSettings(); syncSound();
  if (!cfg.voice) stopVoice();
  if (k === 'gender') say(['clean'], t().cue.clean, { force:true });
  if ((k === 'res' || k === 'fps') && stream && (W || starting)) setFacing(cfg.front, true);
});
$('setBtn').onclick = () => { unlockAudio(); renderSettings(); $('sheet').classList.add('show'); };
$('sheetClose').onclick = () => $('sheet').classList.remove('show');
$('sheet').onclick = e => { if (e.target.id === 'sheet') $('sheet').classList.remove('show'); };
$('previewBtn').onclick = () => { unlockAudio(); say(['n3','n2','n1','go'], '3 2 1 ' + t().go, { force:true }); };
$('tMinus').onclick = () => step(-1); $('tPlus').onclick = () => step(1);
$('sMinus').onclick = () => stepSets(-1); $('sPlus').onclick = () => stepSets(1);
$('rMinus').onclick = () => stepRest(-1); $('rPlus').onclick = () => stepRest(1);
$('startBtn').onclick = () => beginSession('single');
$('againBtn').onclick = () => { if (lastMode === 'routine' && routine.items.length) beginSession('routine'); else beginSession('single'); };
$('homeBtn').onclick = () => { SESS = null; disarmBackGuard(); applyLang(); show('home'); };
$('buildBtn').onclick = () => { renderBuilder(); show('build'); };
$('buildOpen').onclick = () => { renderBuilder(); show('build'); };
$('buildBack').onclick = () => show('home');
$('addEx').onclick = () => {
  const ex = $('addPick').value;
  routine.items.push({ id:'r'+Date.now().toString(36)+routine.items.length, ex, sets:3, target:cfg.targets[ex], rest:cfg.rest });
  saveRoutine(); renderBuilder();
};
$('startRoutine').onclick = () => beginSession('routine');
$('tipGo').onclick = () => { $('tip').classList.remove('show'); if (SESS) startWorkout(); };
$('tipX').onclick = () => {
  $('tip').classList.remove('show');
  if (SESS && SESS.log.length) { fillPause(); $('pause').classList.add('show'); }
  else { SESS = null; disarmBackGuard(); }
};
$('shareBtn').onclick = share;
$('storyBtn').onclick = shareStory;
$('recBtn').onclick = () => { unlockAudio(); toggleRec(); };
$('recSave').onclick = () => { if (clips.length) openSave(clips.length - 1); };
$('saveShare').onclick = () => { const c = clips[saveIndex]; if (c) shareClip(c).catch(e => { if (e.name !== 'AbortError') download(c.url, 'calisthenics-flow.webm'); }); };
$('saveDown').onclick = () => { const c = clips[saveIndex]; if (c) { const ext = c.blob.type.includes('mp4') ? 'mp4' : 'webm'; download(c.url, `calisthenics-flow.${ext}`); toast(t().videoSaved); } };
$('savePrev').onclick = () => openSave(saveIndex - 1);
$('saveClose').onclick = closeSave;
$('histBtn').onclick = openHistory; $('histSum').onclick = openHistory;
$('histClose').onclick = () => $('sheetHist').classList.remove('show');
$('histClear').onclick = () => { localStorage.removeItem('cf_history'); openHistory(); };
$('finishBtn').onclick = () => finish(false, true);
$('quitBtn').onclick = () => { if (sessionLive()) pauseWorkout(); else { SESS = null; stopCamera(); W = null; show('home'); } };
$('muteBtn').onclick = () => { cfg.voice = !cfg.voice; save(); syncSound(); if (!cfg.voice) stopVoice(); renderSettings(); };
$('camRear').onclick = () => setFacing(false);
$('camFront').onclick = () => setFacing(true);
$('restSkip').onclick = () => { stopRest(); if (SESS) afterRest(); };
$('restQuit').onclick = () => { stopRest(); if (SESS && SESS.log.length) endSession(); else { SESS = null; disarmBackGuard(); show('home'); } };
$('pauseStay').onclick = resumeWorkout;
$('pauseGo').onclick = () => {
  $('pause').classList.remove('show');
  if (starting && !W) { startSeq++; starting = false; SESS = null; stopCamera(); disarmBackGuard(); stopVoice(); show('home'); return; }
  if (W) { W.paused = false; finish(false, true); return; }
  if (SESS && SESS.log.length) endSession();
  else { SESS = null; disarmBackGuard(); stopCamera(); show('home'); }
};
addEventListener('resize', () => { if (W) W.lastVideoT = -1; });
document.addEventListener('touchend', unlockAudio, { once:true });
document.addEventListener('click', unlockAudio, { once:true });
applyLang(); renderSettings();
if (!window.__CF_MOCK_POSE__) ensurePose().catch(() => {});

window.__CF = {
  get cfg() { return cfg; },
  get routine() { return routine; },
  get clips() { return clips; },
  get sess() { return SESS; },
  voiceDir: vdir,
  get debug() { return { paused: !!(W && W.paused), phase: W?.phase || null, video: vid.videoWidth + 'x' + vid.videoHeight, stream: !!stream }; },
  tone: playTone,
  version: APP_VERSION,
  stats() {
    return {
      poseMode,
      poseFrames: poseStat.frames,
      poseFps: rateFromStamps(poseStat.first, poseStat.last, poseStat.frames),
      poseMs: poseStat.ms,
      quality: lastQuality,
      recording: rec && rec.state !== 'inactive' ? { state: rec.state, frames: rec.frames, w: rec.w, h: rec.h, audio: rec.hasAudio, mic: rec.mic, fps: rateFromStamps(rec.firstT, rec.lastT, rec.frames) } : null,
      clips: clips.map(c => ({ w:c.w, h:c.h, frames:c.frames, fps:c.fps, audio:c.audio, mic:c.mic, elapsed:c.elapsed, bytes:c.blob.size })),
    };
  },
  completeSetForTest() {
    if (!W) return false;
    if (!W.engine) W.engine = createEngine(W.ex, { aspect: 16/9, strict: STRICT });
    const target = W.target;
    W.engine.state.reps = target; W.engine.state.holdGood = target; W.engine.state.holdTotal = target;
    const orig = W.engine.update.bind(W.engine);
    W.engine.update = (lm, ts) => lm ? orig(lm, ts) : { reps: target, bad: 0, holdGood: target, holdTotal: target, events: [] };
    finish(true, false);
    return true;
  },
};
