import { expect, it } from 'vitest';
import { VEHICLE_TYPES, listedVehicle } from '@/lib/vehicle-types';
it('offers cars only while preserving jobs and hiding non-car listings', () => {
  expect(VEHICLE_TYPES.map(t => t.value)).toEqual(['Car']);
  expect(listedVehicle({ module: 'vehicle', vehicle_type: 'Car' })).toBe(true);
  expect(listedVehicle({ module: 'vehicle', vehicle_type: 'Bicycle' })).toBe(false);
  expect(listedVehicle({ module: 'vehicle', vehicle_type: 'Lorry' })).toBe(false);
  expect(listedVehicle({ module: 'job' })).toBe(true);
});