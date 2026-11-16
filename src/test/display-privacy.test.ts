import { expect, it } from 'vitest';
import { anonymousPostDetails } from '@/lib/display-privacy';

it('removes name, mobile, photo and free-text identity even from a paid detail response', () => {
  const result = anonymousPostDetails({
    driver_name: 'Private owner', contact_phone: '9876543210',
    public_photo: 'https://example.com/owner.jpg', public_brand: 'Private name',
    vehicle_number: 'AP 03 1234', vehicle_name: 'Owner vehicle',
    description: 'Call Private owner 9876543210',
    trip_date: '2026-11-16', capacity_tons: 4, goods_type: 'goods',
  });
  expect(result).toEqual({ trip_date: '2026-11-16', capacity_tons: 4, goods_type: 'goods' });
  expect(JSON.stringify(result)).not.toContain('9876543210');
  expect(JSON.stringify(result)).not.toContain('Private');
  expect(JSON.stringify(result)).not.toContain('owner.jpg');
});