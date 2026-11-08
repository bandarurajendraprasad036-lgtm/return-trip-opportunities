import { describe, expect, it } from 'vitest';
import { filterServiceListings } from '@/lib/service-directory';
const rows = [
  { user_id: 'a', town: 'Guntur', category: 'Electrician', service: 'Electrician' },
  { user_id: 'b', town: 'Guntur', category: 'Plumber', service: 'Plumber' },
  { user_id: 'c', town: 'Hyderabad', category: 'Driver', service: 'Driver' },
];
describe('Consented service directory filters', () => {
  it('All towns includes all providers', () => { expect(filterServiceListings(rows, 'All', 'All').map(row => row.user_id)).toEqual(['a','b','c']); });
  it('same town and category shows only matching service', () => { expect(filterServiceListings(rows, ' guntur ', 'ఎలక్ట్రీషియన్').map(row => row.user_id)).toEqual(['a']); });
  it('All towns still respects category', () => { expect(filterServiceListings(rows, 'All', 'Driver').map(row => row.user_id)).toEqual(['c']); });
  it('a different town does not include providers elsewhere', () => { expect(filterServiceListings(rows, 'Mumbai', 'Plumber')).toEqual([]); });
});