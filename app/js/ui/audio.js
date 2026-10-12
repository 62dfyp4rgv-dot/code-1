// Original synthesized UI sounds (WebAudio). No samples shipped. Honors the sound setting; unlocks on first user gesture (iOS).
let ctx = null;
let on = true;
let master = null;
export function setSound(v) {
  on = !!v;
}
export function unlock() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}
function tone(freq, t0, dur, type = 'sine', vol = 1, slideTo) {
  if (!ctx || !on) return;
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(ctx.currentTime + t0);
  o.stop(ctx.currentTime + t0 + dur + 0.05);
}
export const sfx = {
  tap: () => tone(620, 0, 0.05, 'triangle', 0.5),
  select: () => {
    tone(520, 0, 0.07, 'triangle', 0.6);
    tone(780, 0.05, 0.08, 'triangle', 0.5);
  },
  confirm: () => {
    tone(440, 0, 0.09, 'sine', 0.7);
    tone(660, 0.08, 0.14, 'sine', 0.7);
  },
  deny: () => tone(180, 0, 0.18, 'sawtooth', 0.35, 120),
  alert: () => {
    tone(880, 0, 0.1, 'square', 0.25);
    tone(660, 0.12, 0.16, 'square', 0.25);
  },
  war: () => {
    tone(110, 0, 0.5, 'sawtooth', 0.5, 70);
    tone(165, 0.05, 0.4, 'square', 0.2, 90);
  },
  tech: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'sine', 0.5));
  },
  month: () => tone(300, 0, 0.03, 'sine', 0.25),
};
// ---- generative ambient music: slow chords from a mood-dependent scale. Original, no samples; off by default (setting "music").
const MOODS = {
  calm: { root: 146.83, scale: [0, 2, 4, 7, 9, 12, 14], tempo: 5200, vol: 0.05 }, // D major pentatonic-ish
  tense: { root: 146.83, scale: [0, 2, 3, 7, 8, 12, 14], tempo: 4200, vol: 0.055 }, // D minor with a flat sixth
  war: { root: 110, scale: [0, 1, 3, 7, 8, 12], tempo: 3400, vol: 0.06 }, // low, phrygian
};
let musicOn = false;
let mood = 'calm';
let musicTimer = null;
let step = 0;
function pad(freq, dur, vol) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'triangle';
  o2.type = 'sine';
  o.frequency.value = freq;
  o2.frequency.value = freq * 1.005;
  f.type = 'lowpass';
  f.frequency.value = 900;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  o2.connect(f);
  f.connect(g);
  g.connect(master);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.1);
  o2.stop(t + dur + 0.1);
}
function musicTick() {
  if (!ctx || !musicOn || document.hidden) return;
  const m = MOODS[mood];
  const deg = (n) => m.root * Math.pow(2, m.scale[n % m.scale.length] / 12);
  const base = (step * 2) % m.scale.length;
  const dur = (m.tempo / 1000) * 1.8;
  pad(deg(base), dur, m.vol);
  pad(deg(base + 2) * 2, dur, m.vol * 0.7);
  if (step % 2 === 0) pad(deg(base + 4), dur, m.vol * 0.6);
  if (mood === 'war' && step % 3 === 0) tone(m.root / 2, 0, 0.9, 'sine', 0.28);
  step++;
}
export function setMusic(v) {
  musicOn = !!v;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicOn) {
    musicTimer = setInterval(musicTick, MOODS[mood].tempo);
    musicTick();
  }
}
export function setMood(m) {
  if (!MOODS[m] || m === mood) return;
  mood = m;
  if (musicOn) setMusic(true);
}
export function haptic(ms = 10, enabled = true) {
  if (!enabled) return;
  const wk = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.haptic; // iOS shell bridge
  if (wk) {
    try {
      wk.postMessage(ms);
    } catch {
      /* ignore */
    }
    return;
  }
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* unsupported */
    }
  }
}
