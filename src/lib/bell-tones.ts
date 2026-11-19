export const BELL_TONES = [
  { id: 'temple', label: 'గుడి గంట', frequencies: [520, 1040, 1456, 2184, 2912] },
  { id: 'chime', label: 'మృదువైన గంట', frequencies: [660, 880, 1320] },
  { id: 'phone', label: 'ఫోన్ గంట', frequencies: [440, 480, 960] },
] as const;
export type BellTone = typeof BELL_TONES[number]['id'];
export function validBellTone(value: string | null): BellTone {
  return BELL_TONES.find(tone => tone.id === value)?.id ?? 'temple';
}