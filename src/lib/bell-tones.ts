/** One distinctive Gayatri One ring: temple-bell partials plus a bright "lightning" crack. */
export const GAYATRI_RING = { label: 'గాయత్రి వన్ గంట', frequencies: [520, 1040, 1456, 2184, 2912] } as const;
export const RING_SECONDS = 30;
export const RING_GAP_SECONDS = 1.6;
export type BellVolume = 'high' | 'low';
export function validBellVolume(value: string | null): BellVolume { return value === 'low' ? 'low' : 'high'; }
export function volumeGain(volume: BellVolume) { return volume === 'low' ? 0.35 : 1; }
/** Number of strikes in one full ring. */
export function ringStrikes() { return Math.ceil(RING_SECONDS / RING_GAP_SECONDS); }
