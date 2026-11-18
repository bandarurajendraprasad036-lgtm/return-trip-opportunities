import { expect, it } from 'vitest';
import { findPlaces, type PlaceRow } from '@/lib/india-places';
it('Warangal appears once for repeated same-region source records', () => {
  const rows: PlaceRow[] = [['1','Warangal','','Telangana',17,79,['warangal'],1],['2','Warangal','','Telangana',17,79,['warangal'],2]];
  expect(findPlaces(rows,'Warangal').map(row=>row[1])).toEqual(['Warangal']);
});
it('Garmela appears once while different-region places remain distinguishable', () => {
  const rows: PlaceRow[] = [['1','Garmela','','Telangana',17,79,['garmela'],1],['2','Garmela','','Telangana',17,79,['garmela'],2],['3','Garmela','','Other district',20,80,['garmela'],3]];
  expect(findPlaces(rows,'Garmela').map(row=>row[3])).toEqual(['Telangana','Other district']);
});