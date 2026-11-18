import { isBellNight } from '@/lib/bell-rules';
let audio: AudioContext | undefined;
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
  [520, 1040, 1456, 2184, 2912].forEach((frequency, index) => {
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