import { describe, expect, it } from 'vitest';
import { areaMap } from '@/lib/area-map';

describe('India-wide keyless maps', () => {
  it('uses the requested fixed India embed', () => expect(areaMap().embed).toBe('https://www.google.com/maps?q=India&output=embed'));
  it('opens India search rather than calculated directions', () => expect(areaMap().directions).toBe('https://www.google.com/maps?q=India'));
});