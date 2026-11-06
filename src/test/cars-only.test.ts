import { expect, it } from 'vitest';
import { VEHICLE_TYPES, listedVehicle } from '@/lib/vehicle-types';
it('offers cars and goods vehicles while preserving free jobs', () => {
  expect(VEHICLE_TYPES.map(t => t.value)).toContain('Car');
  expect(VEHICLE_TYPES.map(t => t.value)).toContain('Lorry');
  expect(listedVehicle({ module: 'vehicle', vehicle_type: 'Car' })).toBe(true);
  expect(VEHICLE_TYPES.map(t => t.value)).not.toContain('Bicycle');
  expect(listedVehicle({ module: 'vehicle', vehicle_type: 'Lorry' })).toBe(true);
  expect(listedVehicle({ module: 'job' })).toBe(true);
});