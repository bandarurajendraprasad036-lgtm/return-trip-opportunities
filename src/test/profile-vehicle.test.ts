import { describe, expect, it } from 'vitest';
import { parseVehicleCategory, vehicleCategory } from '@/lib/profile-vehicle';
import { hasValidMobile } from '@/lib/phone';

describe('profile vehicle details', () => {
  it('saves vehicle type and tons together without changing the vehicle type', () => {
    expect(vehicleCategory('Lorry', '12.5')).toBe('Lorry · 12.5 టన్నులు');
    expect(parseVehicleCategory('Lorry · 12.5 టన్నులు')).toEqual({ vehicleType: 'Lorry', tons: '12.5' });
  });
  it('allows an empty tons value and rejects invalid capacity', () => {
    expect(vehicleCategory('Car', '')).toBe('Car');
    expect(vehicleCategory('Lorry', '0')).toBeNull();
    expect(vehicleCategory('Lorry', '101')).toBeNull();
  });
  it('keeps existing vehicle categories without tons readable', () => {
    expect(parseVehicleCategory('Mini truck')).toEqual({ vehicleType: 'Mini truck', tons: '' });
  });
  it('requires a valid ten-digit Indian mobile', () => {
    expect(hasValidMobile('9876543210')).toBe(true);
    expect(hasValidMobile('')).toBe(false);
    expect(hasValidMobile('1234567890')).toBe(false);
    expect(hasValidMobile('987654321')).toBe(false);
  });
});
