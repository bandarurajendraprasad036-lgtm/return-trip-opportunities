import { expect, it } from 'vitest';
import { findPlaces, type PlaceRow } from '@/lib/india-places';
it('Warangal appears once for repeated same-region source records', () => {
  const rows: PlaceRow[] = [['1','Warangal','','Telangana',17,79,['warangal'],1],['2','Warangal','','Telangana',17,79,['warangal'],2]];
  expect(findPlaces(rows,'Warangal').map(row=>row[1])).toEqual(['Warangal']);
});
it('the same English village name appears only once across regions', () => {
  const rows: PlaceRow[] = [['1','Garmela','','Telangana',17,79,['garmela'],1],['2','Garmela','','Telangana',17,79,['garmela'],2],['3','Garmela','','Other district',20,80,['garmela'],3]];
  expect(findPlaces(rows,'Garmela').map(row=>row[1])).toEqual(['Garmela']);
});
it('CH lists Chennur and Chittoor once; CHE lists only Chennur', () => {
  const rows: PlaceRow[] = [['1','Chennur','','Telangana',17,79,['chennur'],1],['2','Chennur','','Andhra Pradesh',17,79,['chennur'],2],['3','Chittoor','','Andhra Pradesh',20,80,['chittoor'],3]];
  expect(findPlaces(rows,'C')).toEqual([]);
  expect(findPlaces(rows,'CH').map(row=>row[1])).toEqual(['Chennur','Chittoor']);
  expect(findPlaces(rows,'CHE').map(row=>row[1])).toEqual(['Chennur']);
});