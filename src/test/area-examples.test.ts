import { describe, expect, it } from 'vitest';
import { areaExamples } from '@/lib/search-examples';

describe('Area-specific presentation examples', () => {
  it('shows six examples for each selected category, within requested five to eight', () => {
    for (const category of ['local', 'return', 'cars', 'seeker', 'employer'] as const) {
      expect(areaExamples('Bombay', '', category)).toHaveLength(6);
    }
  });
  it('uses only Bombay when Bombay is the submitted area', () => {
    expect(areaExamples(' Bombay ', '', 'return').every(row => row.type === 'vehicle' && row.from === 'Bombay' && row.to === '')).toBe(true);
  });
  it('uses Hyderabad as the selected job destination', () => {
    expect(areaExamples('Bombay', ' Hyderabad ', 'employer').map(row => row.type === 'job' ? row.location : null)).toEqual(Array(6).fill('Hyderabad'));
  });
  it('does not manufacture a location before search', () => {
    expect(areaExamples(' ', '', 'local')).toEqual([]);
  });
  it('does not create contact, account or post identifiers for examples', () => {
    for (const example of areaExamples('Hyderabad', '', 'cars')) {
      expect(Object.keys(example).sort()).toEqual(['from', 'title', 'to', 'type']);
    }
  });
});