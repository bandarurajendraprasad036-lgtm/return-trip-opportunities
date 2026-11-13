import { expect, it } from 'vitest';
import { matchesArea } from '@/lib/master-area';
it('matches only the selected whole area, not a substring or another town',()=>{
  expect(matchesArea('Chittoor',' chittoor ')).toBe(true);
  expect(matchesArea('Chittoor Rural','Chittoor')).toBe(false);
  expect(matchesArea('Tirupati','Chittoor')).toBe(false);
  expect(matchesArea('Chittoor','')).toBe(false);
});