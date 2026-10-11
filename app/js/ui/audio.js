// Original synthesized UI sounds (WebAudio). No samples shipped. Honors the sound setting; unlocks on first user gesture (iOS).
let ctx = null; let on = true; let master = null;
export function setSound(v) { on = !!v; }
export function unlock() { if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; } const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.18; master.connect(ctx.destination); } catch { ctx = null; } }
function tone(freq, t0, dur, type = 'sine', vol = 1, slideTo) {
  if (!ctx || !on) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime + t0); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + t0); g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur); o.connect(g); g.connect(master); o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + 0.05);
}
export const sfx = {
  tap: () => tone(620, 0, 0.05, 'triangle', 0.5), select: () => { tone(520, 0, 0.07, 'triangle', 0.6); tone(780, 0.05, 0.08, 'triangle', 0.5); },
  confirm: () => { tone(440, 0, 0.09, 'sine', 0.7); tone(660, 0.08, 0.14, 'sine', 0.7); }, deny: () => tone(180, 0, 0.18, 'sawtooth', 0.35, 120),
  alert: () => { tone(880, 0, 0.1, 'square', 0.25); tone(660, 0.12, 0.16, 'square', 0.25); }, war: () => { tone(110, 0, 0.5, 'sawtooth', 0.5, 70); tone(165, 0.05, 0.4, 'square', 0.2, 90); },
  tech: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'sine', 0.5)); }, month: () => tone(300, 0, 0.03, 'sine', 0.25),
};
export function haptic(ms = 10, enabled = true) {
  if (!enabled) return;
  const wk = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.haptic; // iOS shell bridge
  if (wk) { try { wk.postMessage(ms); } catch { /* ignore */ } return; }
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch { /* unsupported */ } }
}
