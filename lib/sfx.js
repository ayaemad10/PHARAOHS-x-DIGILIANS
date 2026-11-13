/**
 * Sound, synthesised in the browser. No audio files, so nothing to download or license.
 *
 * Browsers only allow sound after a click or key press, so the engine starts on the first
 * interaction with the page (see HomeStage). Every sound is short and quiet; the cabin hum is the only
 * one that lasts. All calls are safe to make when sound is off or unsupported.
 */
let ctx = null, master = null, meter = null, hum = null, on = false;

function ensure() {
  if (ctx || typeof window === "undefined") return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 1;
  // a gentle limiter so stacked sounds never clip, then out
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -10; lim.ratio.value = 6; lim.attack.value = 0.003; lim.release.value = 0.2;
  meter = ctx.createAnalyser(); meter.fftSize = 512;
  master.connect(lim); lim.connect(meter); meter.connect(ctx.destination);
  return ctx;
}
function env(node, t0, peak, attack, release) {
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
  node.connect(g); g.connect(master); return g;
}
function tone(freq, { type = "sine", peak = 0.18, attack = 0.01, release = 0.35, when = 0, glide = 0 } = {}) {
  if (!on || !ensure()) return;
  const t0 = ctx.currentTime + when, o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * glide), t0 + attack + release);
  env(o, t0, peak, attack, release); o.start(t0); o.stop(t0 + attack + release + 0.05);
}
function noise({ peak = 0.12, attack = 0.02, release = 0.5, freq = 1200, q = 0.7, type = "bandpass", when = 0, sweep = 0 } = {}) {
  if (!on || !ensure()) return;
  const t0 = ctx.currentTime + when, len = Math.ceil(ctx.sampleRate * (attack + release + 0.1));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * sweep), t0 + attack + release);
  src.connect(f); env(f, t0, peak, attack, release); src.start(t0); src.stop(t0 + attack + release + 0.1);
}

/* one pitch per sensor, low to high in the order they usually respond, so the rhythm tells the story */
const SENSOR_HZ = { camera: 880, radiation: 660, sampleTemp: 523.25, plume: 392, co2: 261.63 };

export const sfx = {
  isOn: () => on,
  setOn(v) {
    on = !!v;
    if (on && ensure() && ctx.state !== "running") ctx.resume().catch(() => {});
    if (!on) this.hum(false);
    try { window.localStorage.setItem("fx:sound", on ? "1" : "0"); } catch { /* ignore */ }
  },
  /** Sound is on unless the visitor switched it off. */
  wanted() { try { return window.localStorage.getItem("fx:sound") !== "0"; } catch { return true; } },
  /** true once the browser has let audio start (needs one click or key press on the page) */
  running: () => !!ctx && ctx.state === "running",
  /** peak output level right now, 0..1 (used to check that sound is really coming out) */
  level() { if (!meter) return 0; const d = new Uint8Array(meter.fftSize); meter.getByteTimeDomainData(d); let m = 0; for (const v of d) m = Math.max(m, Math.abs(v - 128)); return m / 128; },
  chime() { tone(660, { peak: 0.60, release: 0.25 }); tone(990, { peak: 0.47, release: 0.3, when: 0.09 }); },

  click() { tone(1400, { type: "triangle", peak: 0.09, attack: 0.002, release: 0.05 }); },
  swap() { tone(520, { type: "triangle", peak: 0.13, release: 0.12, glide: 1.5 }); },
  ignite() { noise({ peak: 0.42, attack: 0.004, release: 0.12, freq: 3200, q: 1.5 }); noise({ peak: 0.26, attack: 0.15, release: 0.9, freq: 500, q: 0.5, when: 0.08, sweep: 1.8 }); },
  detect(id) { const f = SENSOR_HZ[id] || 440; tone(f, { peak: 0.42, release: 0.5 }); tone(f * 2, { peak: 0.13, release: 0.3, when: 0.02 }); },
  allDetected() { [261.63, 392, 523.25].forEach((f, i) => tone(f, { peak: 0.26, release: 1.1, when: i * 0.09 })); },
  alarm() { [0, 0.28, 0.56].forEach((w) => { tone(740, { type: "square", peak: 0.18, attack: 0.01, release: 0.14, when: w }); tone(554, { type: "square", peak: 0.13, attack: 0.01, release: 0.14, when: w + 0.14 }); }); },
  tick() { tone(980, { type: "triangle", peak: 0.13, attack: 0.002, release: 0.06 }); },
  fanDown() { noise({ peak: 0.36, attack: 0.05, release: 1.4, freq: 900, q: 0.6, sweep: 0.12 }); tone(140, { type: "sawtooth", peak: 0.13, release: 1.3, glide: 0.3 }); },
  fanKeep() { noise({ peak: 0.21, attack: 0.1, release: 0.5, freq: 700, q: 0.5 }); },
  gas() { noise({ peak: 0.42, attack: 0.03, release: 1.5, freq: 5200, q: 0.4, type: "highpass", sweep: 0.6 }); },
  outcome(good) { (good ? [392, 523.25, 659.25] : [330, 311.13, 277.18]).forEach((f, i) => tone(f, { peak: 0.26, release: 0.9, when: i * 0.14 })); },

  /** the cabin: a low fan hum, on while the replay runs */
  hum(v, level = 1) {
    if (!v || !on) { if (hum) { const h = hum; hum = null; try { h.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2); h.o.stop(ctx.currentTime + 0.8); h.n.stop(ctx.currentTime + 0.8); } catch { /* ignore */ } } return; }
    if (!ensure()) return;
    if (hum) { hum.g.gain.setTargetAtTime(0.09 * level, ctx.currentTime, 0.4); return; }
    const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 110;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; o.connect(lp); lp.connect(g);
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 0.4; n.connect(bp); bp.connect(g);
    o.start(); n.start(); g.gain.setTargetAtTime(0.09 * level, ctx.currentTime, 0.5);
    hum = { g, o, n };
  },
};
