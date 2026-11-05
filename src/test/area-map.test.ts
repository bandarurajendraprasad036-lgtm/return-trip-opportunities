import { describe, expect, it } from 'vitest';
import { areaMap } from '@/lib/area-map';

describe('India-wide keyless maps', () => {
  it('uses the requested fixed India embed', () => expect(areaMap().embed).toBe('https://www.google.com/maps?q=India&output=embed'));
  it('opens India search rather than calculated directions', () => expect(areaMap().directions).toBe('https://www.google.com/maps?q=India'));
  it('uses submitted vehicle endpoints and keeps India context', () => {
    expect(new URL(areaMap({ from: ' Delhi ', to: 'Mumbai' }).embed).searchParams.get('q')).toBe('Delhi to Mumbai, India');
    expect(new URL(areaMap({ from: 'Delhi' }).embed).searchParams.get('q')).toBe('Delhi, India');
  });
  it('uses a named local colony or job area without inventing coordinates', () => {
    const map = areaMap({ area: ' మంచిర్యాల రాంనగర్ ACC ' });
    expect(new URL(map.embed).searchParams.get('q')).toBe('మంచిర్యాల రాంనగర్ ACC, India');
    expect(new URL(map.directions).searchParams.get('q')).toBe('మంచిర్యాల రాంనగర్ ACC, India');
  });
  it('returns to India for a cleared search and encodes input safely', () => {
    expect(areaMap({ from: ' ', to: '', area: ' ' }).embed).toBe('https://www.google.com/maps?q=India&output=embed');
    expect(new URL(areaMap({ area: 'ACC & Ramnagar' }).embed).searchParams.get('q')).toBe('ACC & Ramnagar, India');
  });
});