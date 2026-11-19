import { isBellNight } from '@/lib/bell-rules';
import { BELL_TONES, validBellTone, type BellTone } from '@/lib/bell-tones';
let audio: AudioContext | undefined;
export function bellTone(): BellTone { try { return validBellTone(localStorage.getItem('gayatri-bell-tone')); } catch { return 'temple'; } }
export function setBellTone(tone: BellTone) {
  try { localStorage.setItem('gayatri-bell-tone', validBellTone(tone)); } catch { /* Storage may be unavailable. */ }
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
export function playBell() {
  if (!audio || audio.state !== 'running' || bellMuted() || isBellNight(new Date())) return;
  (BELL_TONES.find(tone => tone.id === bellTone()) ?? BELL_TONES[0]).frequencies.forEach((frequency, index) => {
    if (!audio) return;
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.42 / (index + 1), audio.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 3.8);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + 3.8);
  });
}
/** Loud temple-bell strike played on the user's own tap. The tap itself is the consent, so the
 * evening quiet rule for incoming alerts does not apply. Phone silent switches/volume are controlled
 * by the phone; a website cannot override them. */
export function playTapBell() {
  if (bellMuted()) return;
  try { audio ??= new AudioContext(); } catch { return; }
  const ctx = audio;
  const strike = () => {
    const out = ctx.createGain(); out.gain.value = 1;
    let target: AudioNode = ctx.destination;
    try { const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 6; comp.connect(ctx.destination); target = comp; } catch { /* compressor optional */ }
    out.connect(target);
    (BELL_TONES.find(tone => tone.id === bellTone()) ?? BELL_TONES[0]).frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = index === 0 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.9 / (index + 1), ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
      oscillator.connect(gain); gain.connect(out);
      oscillator.start(); oscillator.stop(ctx.currentTime + 3.5);
    });
  };
  if (ctx.state === 'running') strike(); else void ctx.resume().then(strike, () => undefined);
}
