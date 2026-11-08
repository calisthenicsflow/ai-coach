// Speech and tones for one continuous form error, not for every frame.
// A cue may repeat only after the posture has stayed clean (or the person has left
// the position) and the same error then actually comes back.
const CLEAR_MS = 700;
const TONE_GAP_MS = 250;

export function createFeedbackGate(isBad) {
  let episode = null;
  let clearSince = null;
  let lastTone = -1e9;
  function tone(kind, now) {
    if (now - lastTone < TONE_GAP_MS) return null;
    lastTone = now;
    return kind;
  }
  return {
    reset() { episode = null; clearSince = null; lastTone = -1e9; },
    step({ now, status, cue, events }) {
      const out = { speech: null, tone: null, visual: null, kind: '', flash: null, flashKind: '' };
      // Not in frame: never call it wrong, and don't treat the gap as a correction.
      if (status === 'lost') {
        if (cue === 'lost') { out.visual = 'lost'; out.kind = 'warn'; }
        return out;
      }
      const badCue = status === 'ok' && cue && isBad(cue) ? cue : null;
      if (!badCue) {
        if (status === 'pos' && cue === 'pos') { out.visual = 'pos'; out.kind = 'warn'; }
        if (episode) {
          if (clearSince == null) clearSince = now;
          if (now - clearSince >= CLEAR_MS) { episode = null; clearSince = null; }
        }
      } else {
        clearSince = null;
        out.visual = badCue;
        out.kind = 'bad';
        if (!episode || episode.key !== badCue) {
          out.speech = badCue;
          out.tone = tone('bad', now);
          episode = { key: badCue, at: now };
        }
      }
      for (const e of events || []) {
        if (!e) continue;
        if (e.clean) {
          const t = tone('good', now);
          if (t) out.tone = t;
          out.flash = 'clean';
          out.flashKind = '';
        } else if (e.reason && isBad(e.reason)) {
          const already = episode && episode.key === e.reason && (now - episode.at) < 8000;
          if (!already) {
            out.speech = e.reason;
            episode = { key: e.reason, at: now };
          }
          const t = tone('bad', now);
          if (t && out.tone !== 'good') out.tone = t;
          out.flash = e.reason;
          out.flashKind = 'bad';
        }
      }
      return out;
    }
  };
}
