// Pose inference off the thread that paints and records camera frames.
let landmarker = null, modelName = '', scratch = null;

async function boot(model) {
  const { FilesetResolver, PoseLandmarker } = await import('./mp/vision_bundle.mjs');
  const base = new URL('./mp/', import.meta.url).href;
  const fs = await FilesetResolver.forVisionTasks(base);
  if (landmarker) { try { landmarker.close(); } catch {} landmarker = null; }
  const opts = delegate => ({
    baseOptions: { modelAssetPath: new URL(`pose_landmarker_${model}.task`, base).href, delegate },
    runningMode: 'VIDEO', numPoses: 1,
    minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  try { landmarker = await PoseLandmarker.createFromOptions(fs, opts('GPU')); }
  catch { landmarker = await PoseLandmarker.createFromOptions(fs, opts('CPU')); }
  modelName = model;
}

function source(bitmap, flip) {
  if (!flip) return bitmap;
  const w = bitmap.width, h = bitmap.height;
  if (typeof OffscreenCanvas !== 'function') return bitmap;
  if (!scratch || scratch.width !== w || scratch.height !== h) scratch = new OffscreenCanvas(w, h);
  const c = scratch.getContext('2d', { alpha: false });
  c.setTransform(-1, 0, 0, -1, w, h);
  c.drawImage(bitmap, 0, 0);
  c.setTransform(1, 0, 0, 1, 0, 0);
  return scratch;
}

const pack = lm => lm ? lm.map(q => [q.x, q.y, q.z, q.visibility ?? 1]) : null;
const packW = lm => lm ? lm.map(q => [q.x, q.y, q.z]) : null;

self.onmessage = async (e) => {
  const d = e.data || {};
  try {
    if (d.type === 'init' || d.type === 'model') {
      await boot(d.model || 'full');
      self.postMessage({ type: 'ready', model: modelName });
    } else if (d.type === 'frame') {
      if (!landmarker) { d.bitmap?.close?.(); self.postMessage({ type: 'pose', lm: null, wl: null, ts: d.ts, ms: 0, model: modelName }); return; }
      const t0 = performance.now();
      let res = null;
      try { res = landmarker.detectForVideo(source(d.bitmap, !!d.flip), d.ts); }
      finally { try { d.bitmap?.close?.(); } catch {} }
      self.postMessage({
        type: 'pose', id: d.id, flip: !!d.flip, ts: d.ts, ms: performance.now() - t0, model: modelName,
        lm: pack(res?.landmarks?.[0]), wl: packW(res?.worldLandmarks?.[0]),
      });
    } else if (d.type === 'close') {
      try { landmarker?.close(); } catch {}
      landmarker = null;
    }
  } catch (err) {
    try { d.bitmap?.close?.(); } catch {}
    self.postMessage({ type: 'error', message: String(err?.message || err) });
  }
};
