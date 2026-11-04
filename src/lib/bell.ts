import { isBellNight } from '@/lib/bell-rules';
let audio: AudioContext | undefined;
export function bellMuted() { try { return localStorage.getItem('gayatri-notices-muted') === 'yes'; } catch { return false; } }
export function enableBellAudio() {
  try { audio ??= new AudioContext(); void audio.resume(); } catch { /* Browser may not support audio. */ }
}
export function playBell() {
  if (!audio || audio.state !== 'running' || bellMuted() || isBellNight(new Date())) return;
  [880, 1320, 1760].forEach((frequency, index) => {
    if (!audio) return;
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.10 / (index + 1), audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1.8);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + 1.8);
  });
}