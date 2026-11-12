import { describe, expect, it } from 'vitest';
import { SERVICE_CATEGORIES } from '@/lib/service-categories';
import { filterServiceListings } from '@/lib/service-directory';
describe('Service category eligibility', () => {
  it('keeps the requested four service occupations distinct', () => {
    expect(SERVICE_CATEGORIES.map(category => category.key)).toEqual(['electrician', 'plumber', 'technician', 'tv mechanic']);
  });
  it('does not infer nearby providers from another named area', () => {
    expect(filterServiceListings([{ user_id: 'a', service: 'Plumber', category: 'Plumber', town: 'Hyderabad' }], 'Mancherial', 'Plumber')).toEqual([]);
  });
});