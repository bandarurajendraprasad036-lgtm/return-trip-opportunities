import { isBellNight } from '@/lib/bell-rules';
import { GAYATRI_RING, RING_GAP_SECONDS, ringStrikes, validBellVolume, volumeGain, type BellVolume } from '@/lib/bell-tones';
let audio: AudioContext | undefined;
export function bellVolume(): BellVolume { try { return validBellVolume(localStorage.getItem('gayatri-bell-volume')); } catch { return 'high'; } }
export function setBellVolume(volume: BellVolume) {
  try { localStorage.setItem('gayatri-bell-volume', validBellVolume(volume)); } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new Event(BELL_PREFERENCE_EVENT));
}
export function bellMuted() { try { return localStorage.getItem('gayatri-notices-muted') === 'yes'; } catch { return false; } }
export const BELL_PREFERENCE_EVENT = 'gayatri-bell-preference';
export function setBellMuted(muted: boolean) {
  try { localStorage.setItem('gayatri-notices-muted', muted ? 'yes' : 'no'); } catch { /* Device storage may be unavailable. */ }
  window.dispatchEvent(new Event(BELL_PREFERENCE_EVENT));
}
export function enableBellAudio() {
  if (bellMuted()) return;
  try { audio ??= new AudioContext(); void audio.resume(); } catch { /* Browser may not support audio. */ }
}
export function installBellAudioUnlock() {
  const unlock = () => enableBellAudio();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
}
let ringTimer: ReturnType<typeof setInterval> | undefined;
function strike(ctx: AudioContext, level: number) {
  const out = ctx.createGain(); out.gain.value = level;
  let target: AudioNode = ctx.destination;
  try { const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 8; comp.connect(ctx.destination); target = comp; } catch { /* optional */ }
  out.connect(target);
  const t = ctx.currentTime;
  GAYATRI_RING.frequencies.forEach((frequency, index) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = index === 0 ? 'triangle' : 'sine'; o.frequency.value = frequency;
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.95 / (index + 1), t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.5);
  });
  // Short bright noise crack ("lightning") so the ring is recognisably Gayatri One.
  const len = Math.floor(ctx.sampleRate * 0.18); const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const n = ctx.createBufferSource(); n.buffer = buf; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500; const ng = ctx.createGain(); ng.gain.value = 0.7;
  n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t);
}
export function stopBell() { if (ringTimer) clearInterval(ringTimer); ringTimer = undefined; }
/** Incoming alert: repeats like a phone call for 30 seconds. */
export function playBell() {
  if (!audio || audio.state !== 'running' || bellMuted() || isBellNight(new Date())) return;
  const ctx = audio; const level = volumeGain(bellVolume());
  stopBell(); let count = 0; strike(ctx, level);
  ringTimer = setInterval(() => { if (++count >= ringStrikes() || bellMuted()) { stopBell(); return; } strike(ctx, level); }, RING_GAP_SECONDS * 1000);
}
/** User's own tap: one loud strike (also used as the settings preview). */
export function playTapBell() {
  if (bellMuted()) return;
  try { audio ??= new AudioContext(); } catch { return; }
  const ctx = audio; const level = volumeGain(bellVolume());
  if (ctx.state === 'running') strike(ctx, level); else void ctx.resume().then(() => strike(ctx, level), () => undefined);
}
