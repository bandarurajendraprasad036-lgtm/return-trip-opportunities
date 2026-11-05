import { describe, expect, it } from 'vitest';
import { areaMap } from '@/lib/area-map';

describe('India-wide keyless maps', () => {
  it('starts with India, not the example city', () => {
    const map = areaMap('', '');
    expect(new URL(map.embed).searchParams.get('q')).toBe('India');
    expect(map.directions).toBeNull();
  });
  it('uses both selected endpoints for any national route without a key', () => {
    const map = areaMap(' Delhi ', ' Mumbai ');
    const embed = new URL(map.embed);
    expect(embed.searchParams.get('saddr')).toBe('Delhi, India');
    expect(embed.searchParams.get('daddr')).toBe('Mumbai, India');
    expect(embed.searchParams.has('key')).toBe(false);
    expect(new URL(map.directions ?? '').searchParams.get('destination')).toBe('Mumbai, India');
  });
  it('accepts either endpoint alone for local areas and vacancies', () => {
    expect(new URL(areaMap('హైదరాబాద్', '').embed).searchParams.get('q')).toBe('హైదరాబాద్, India');
    expect(new URL(areaMap('', 'Kolkata').embed).searchParams.get('q')).toBe('Kolkata, India');
  });
});